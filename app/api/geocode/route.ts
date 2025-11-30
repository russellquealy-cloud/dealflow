/**
 * Google Maps Geocoding API Route
 * 
 * This route handles geocoding addresses to coordinates using Google's Geocoding API.
 * 
 * ENVIRONMENT VARIABLES REQUIRED:
 * - GOOGLE_GEOCODE_API_KEY (server-side key, preferred)
 * - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (fallback, client-side key)
 * 
 * Returns: 
 * - Success: { found: true, lat: number, lng: number, viewport?: {...}, formattedAddress?: string }
 * - No results: { found: false, reason: "NO_RESULTS" } with HTTP 200
 * - Errors: { found: false, reason, error?: string } with HTTP 4xx/5xx
 */

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

type GeoReq = { query?: string; q?: string; address?: string; placeId?: string };

type GeocodeResult = {
  status: string;
  results?: Array<{
    geometry: { 
      location: { lat: number; lng: number };
      viewport?: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
    formatted_address?: string;
  }>;
  error_message?: string;
};

type GeocodeResponse = 
  | { found: true; lat: number; lng: number; viewport?: { north: number; south: number; east: number; west: number }; formattedAddress?: string }
  | { found: false; reason: "NO_RESULTS" | "INVALID_REQUEST" | "REQUEST_DENIED" | "OVER_QUERY_LIMIT" | "UNKNOWN_ERROR"; error?: string };

export async function POST(req: NextRequest): Promise<NextResponse<GeocodeResponse>> {
  try {
    const body = (await req.json()) as GeoReq;
    const query = (body.query || body.q || body.address || "").trim();
    const placeId = body.placeId;

    if (!query && !placeId) {
      return NextResponse.json(
        { found: false, reason: 'INVALID_REQUEST', error: "Missing query parameter" },
        { status: 400 }
      );
    }

    // Read API key - prefer server key, do NOT fallback to public key in production
    // The public key should NOT be used server-side as it can have different restrictions
    const apiKey = process.env.GOOGLE_GEOCODE_API_KEY;
    const fallbackKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    // Log which key is being used (for debugging)
    const usingServerKey = !!apiKey;
    const usingFallbackKey = !apiKey && !!fallbackKey;
    
    const activeKey = apiKey || fallbackKey;

    if (!activeKey) {
      console.error('Geocode API key is missing. Check Vercel env. GOOGLE_GEOCODE_API_KEY should be set.');
      return NextResponse.json(
        { found: false, reason: 'UNKNOWN_ERROR', error: 'Geocoding service is not configured.' },
        { status: 500 }
      );
    }

    if (usingFallbackKey) {
      console.warn('⚠️ Using NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as fallback. Consider setting GOOGLE_GEOCODE_API_KEY for server-side geocoding.');
    }

    // Build the standard Google Geocoding API URL
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${activeKey}`;

    // Log request details (with key redacted)
    console.log('🔍 Geocode request initiated', {
      query,
      url: url.replace(activeKey, '***'),
      usingServerKey,
      usingFallbackKey,
      keyType: usingServerKey ? 'GOOGLE_GEOCODE_API_KEY' : 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (fallback)'
    });

    const fetchResponse = await fetch(url);
    
    // Log HTTP response status from Google
    console.log('📡 Google Geocoding API HTTP response', {
      status: fetchResponse.status,
      statusText: fetchResponse.statusText,
      ok: fetchResponse.ok
    });

    if (!fetchResponse.ok) {
      const text = await fetchResponse.text();
      console.error('Geocode HTTP error', {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        body: text.substring(0, 500), // Limit body length in logs
      });

      return NextResponse.json(
        {
          found: false,
          reason: 'UNKNOWN_ERROR',
          error: 'Geocoding service HTTP error. Check API key and configuration.',
        },
        { status: 500 }
      );
    }

    const data = (await fetchResponse.json()) as GeocodeResult;

    // Log the data.status from Google's JSON response
    console.log('📋 Google Geocoding API response data', {
      status: data.status,
      resultsCount: data.results?.length || 0,
      errorMessage: data.error_message || 'none',
      query
    });

    // Handle ZERO_RESULTS as a normal response (not an error) - return 200
    if (data.status === 'ZERO_RESULTS') {
      console.log('📍 Geocode returned ZERO_RESULTS', { query });
      return NextResponse.json(
        { found: false, reason: 'NO_RESULTS' },
        { status: 200 } // Use 200 to indicate the request was successful, just no results
      );
    }

    // Handle other non-OK statuses as actual errors
    if (data.status !== 'OK' || !data.results?.length) {
      console.error('Geocode API returned non-OK status', {
        status: data.status,
        error_message: data.error_message,
        query,
      });

      // Map status codes to reason
      let reason: "NO_RESULTS" | "INVALID_REQUEST" | "REQUEST_DENIED" | "OVER_QUERY_LIMIT" | "UNKNOWN_ERROR" = 'UNKNOWN_ERROR';
      let errorMessage = 'Geocoding service could not process this request.';
      
      if (data.status === 'REQUEST_DENIED') {
        reason = 'REQUEST_DENIED';
        errorMessage = 'Geocoding service denied request. This is a configuration issue - check API key, billing, and restrictions in Google Cloud Console.';
        // REQUEST_DENIED is a configuration error, return 500 not 400
        console.error('❌ REQUEST_DENIED from Google - Configuration issue', {
          query,
          errorMessage: data.error_message,
          keyType: usingServerKey ? 'GOOGLE_GEOCODE_API_KEY' : 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (fallback)',
          recommendation: 'Check that GOOGLE_GEOCODE_API_KEY is set in Vercel env and has Geocoding API enabled'
        });
      } else if (data.status === 'INVALID_REQUEST') {
        reason = 'INVALID_REQUEST';
        errorMessage = 'Invalid geocoding request. Please check the query format.';
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        reason = 'OVER_QUERY_LIMIT';
        errorMessage = 'Geocoding quota exceeded. Please try again later.';
      } else if (data.error_message) {
        errorMessage = `Geocoding failed: ${data.error_message}`;
      }

      // Return 4xx/5xx only for genuine server/request errors
      // REQUEST_DENIED is a configuration issue, return 500
      const statusCode = reason === 'REQUEST_DENIED' ? 500 :
                        reason === 'INVALID_REQUEST' ? 400 : 
                        reason === 'OVER_QUERY_LIMIT' ? 429 : 500;

      return NextResponse.json(
        { found: false, reason, error: errorMessage },
        { status: statusCode }
      );
    }

    const { lat, lng } = data.results[0].geometry.location;
    const viewport = data.results[0].geometry.viewport;
    const formattedAddress = data.results[0].formatted_address;

    console.log('✅ Geocode success', {
      query,
      lat,
      lng,
      hasViewport: !!viewport,
      formattedAddress,
      resultsCount: data.results?.length || 0
    });

    // Return coordinates with viewport if available
    const geocodeResponse: GeocodeResponse = {
      found: true,
      lat,
      lng,
    };

    if (viewport) {
      geocodeResponse.viewport = {
        north: viewport.northeast.lat,
        south: viewport.southwest.lat,
        east: viewport.northeast.lng,
        west: viewport.southwest.lng,
      };
    }

    if (formattedAddress) {
      geocodeResponse.formattedAddress = formattedAddress;
    }

    return NextResponse.json(geocodeResponse);
  } catch (e) {
    console.error("Geocode unexpected error", {
      error: e instanceof Error ? e.message : 'Unknown error',
      stack: e instanceof Error ? e.stack : undefined,
    });
    return NextResponse.json(
      { found: false, reason: 'UNKNOWN_ERROR', error: "Geocoding service error. Please try again later." },
      { status: 500 }
    );
  }
}

// Keep GET for backward compatibility
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address") ?? undefined;
  const placeId = searchParams.get("placeId") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const query = searchParams.get("query") ?? undefined;

  return POST(
    new NextRequest(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query || q || address, placeId }),
    })
  );
}
