/**
 * Google Maps Geocoding API Route
 * 
 * This route handles geocoding addresses to coordinates using Google's Geocoding API.
 * 
 * ENVIRONMENT VARIABLES REQUIRED:
 * - GOOGLE_GEOCODE_API_KEY (server-side key, preferred)
 * - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (fallback, client-side key)
 * 
 * Returns: { lat: number, lng: number } on success
 *          { error: string } on failure (4xx/5xx status)
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

export async function POST(req: NextRequest): Promise<NextResponse<{ lat: number; lng: number } | { error: string }>> {
  try {
    const body = (await req.json()) as GeoReq;
    const query = (body.query || body.q || body.address || "").trim();
    const placeId = body.placeId;

    if (!query && !placeId) {
      return NextResponse.json(
        { error: "Missing query parameter" },
        { status: 400 }
      );
    }

    // Read API key and fail fast if missing
    const apiKey = process.env.GOOGLE_GEOCODE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error('Geocode API key is missing. Check Vercel env.');
      return NextResponse.json(
        { error: 'Geocoding service is not configured.' },
        { status: 500 }
      );
    }

    // Build the standard Google Geocoding API URL
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;

    console.log('Geocode request', {
      query,
      url: url.replace(apiKey, '***'),
    });

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error('Geocode HTTP error', {
        status: response.status,
        statusText: response.statusText,
        body: text.substring(0, 500), // Limit body length in logs
      });

      return NextResponse.json(
        {
          error: 'Geocoding service denied request. Check API key and configuration.',
        },
        { status: 400 }
      );
    }

    const data = (await response.json()) as GeocodeResult;

    console.log('Geocode response status', data.status);

    if (data.status !== 'OK' || !data.results?.length) {
      console.error('Geocode API returned non-OK status', {
        status: data.status,
        error_message: data.error_message,
        query,
      });

      // Provide helpful error messages based on status
      let errorMessage = 'Geocoding service could not find this location or rejected the request.';
      
      if (data.status === 'REQUEST_DENIED') {
        errorMessage = 'Geocoding service denied request. Check key, billing, and restrictions.';
      } else if (data.status === 'INVALID_REQUEST') {
        errorMessage = 'Invalid geocoding request. Please check the query format.';
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        errorMessage = 'Geocoding quota exceeded. Please try again later.';
      } else if (data.status === 'ZERO_RESULTS') {
        errorMessage = `Could not find location: ${query}. Please try a more specific location.`;
      } else if (data.error_message) {
        errorMessage = `Geocoding failed: ${data.error_message}`;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { lat, lng } = data.results[0].geometry.location;
    const viewport = data.results[0].geometry.viewport;
    const formattedAddress = data.results[0].formatted_address;

    console.log('Geocode success', {
      query,
      lat,
      lng,
      hasViewport: !!viewport,
      formattedAddress,
    });

    // Return coordinates with viewport if available
    const response: {
      lat: number;
      lng: number;
      viewport?: {
        north: number;
        south: number;
        east: number;
        west: number;
      };
      formattedAddress?: string;
    } = {
      lat,
      lng,
    };

    if (viewport) {
      response.viewport = {
        north: viewport.northeast.lat,
        south: viewport.southwest.lat,
        east: viewport.northeast.lng,
        west: viewport.southwest.lng,
      };
    }

    if (formattedAddress) {
      response.formattedAddress = formattedAddress;
    }

    return NextResponse.json(response);
  } catch (e) {
    console.error("Geocode unexpected error", {
      error: e instanceof Error ? e.message : 'Unknown error',
      stack: e instanceof Error ? e.stack : undefined,
    });
    return NextResponse.json(
      { error: "Geocoding service error. Please try again later." },
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
