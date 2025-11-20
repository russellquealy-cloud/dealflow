/**
 * Google Maps Geocoding API Route
 * 
 * REQUIRED GOOGLE CLOUD APIs:
 * - Geocoding API (for address → coordinates)
 * - Places API (for text search and place details)
 * - Places Details API (for place_id → coordinates)
 * 
 * ENVIRONMENT VARIABLES REQUIRED:
 * - GOOGLE_GEOCODE_API_KEY (server-side key, preferred)
 * - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (fallback, client-side key)
 * 
 * The server-side key (GOOGLE_GEOCODE_API_KEY) should be restricted to:
 * - API restrictions: Geocoding API, Places API, Places Details API
 * - HTTP referrer restrictions: Your production domain
 * 
 * This route handles:
 * - Text search queries (e.g., "Miami, FL")
 * - Place IDs (from Google Places Autocomplete)
 * - Address geocoding
 * 
 * Returns: { ok: true, lat: number, lng: number, viewport?: {...}, formattedAddress?: string }
 *          or { ok: false, error: string }
 */

// Node runtime (uses server key)
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

type GeoReq = { query?: string; q?: string; address?: string; placeId?: string };

type GeoResp =
  | {
      ok: true;
      lat: number;
      lng: number;
      viewport?: { north: number; south: number; east: number; west: number };
      formattedAddress?: string;
    }
  | { ok: false; error: string };

export async function POST(req: NextRequest): Promise<NextResponse<GeoResp>> {
  try {
    const body = (await req.json()) as GeoReq;
    // Support 'query', 'q', and 'address' for compatibility
    const query = (body.query || body.q || body.address || "").trim();
    const placeId = body.placeId;

    if (!query && !placeId) {
      console.error("GEOCODE_ERROR: Missing query parameter");
      return NextResponse.json({ ok: false, error: "Geocoding failed: missing query" }, { status: 400 });
    }

    // Use server-side key (GOOGLE_GEOCODE_API_KEY) - this is the preferred key for backend
    // Fallback to NEXT_PUBLIC_GOOGLE_MAPS_API_KEY if server key not available
    const key = process.env.GOOGLE_GEOCODE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!key) {
      console.error("GEOCODE_ERROR: No Google Maps API key configured. Set GOOGLE_GEOCODE_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY");
      return NextResponse.json({ 
        ok: false, 
        error: "Geocoding service not configured. Please contact support." 
      }, { status: 500 });
    }
    
    // Log which key type is being used (for debugging, but don't log the actual key)
    if (process.env.GOOGLE_GEOCODE_API_KEY) {
      console.log("GEOCODE: Using GOOGLE_GEOCODE_API_KEY (server-side key)");
    } else {
      console.log("GEOCODE: Using NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (fallback)");
    }

    // If placeId is provided, use Place Details API
    if (placeId) {
      const placeUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
      placeUrl.searchParams.set("place_id", placeId);
      placeUrl.searchParams.set("key", key);
      placeUrl.searchParams.set("fields", "geometry,formatted_address,name");

      const placeRes = await fetch(placeUrl, { method: "GET", cache: "no-store" });
      
      if (!placeRes.ok) {
        console.error("GEOCODE_ERROR: Place Details API returned non-OK status", {
          status: placeRes.status,
          statusText: placeRes.statusText,
          placeId,
        });
      }
      
      const placeJson = await placeRes.json();

      if (placeJson.status === "OK" && placeJson.result?.geometry?.location) {
        const loc = placeJson.result.geometry.location;
        const vp = placeJson.result.geometry.viewport;
        return NextResponse.json({
          ok: true,
          lat: loc.lat,
          lng: loc.lng,
          viewport: vp
            ? {
                north: vp.northeast.lat,
                east: vp.northeast.lng,
                south: vp.southwest.lat,
                west: vp.southwest.lng,
              }
            : undefined,
          formattedAddress: placeJson.result.formatted_address || placeJson.result.name,
        });
      } else if (placeJson.status) {
        console.error("GEOCODE_ERROR: Place Details API returned error status", {
          status: placeJson.status,
          error_message: placeJson.error_message,
          placeId,
        });
        // Fall through to text search
      }
    }

    // Primary: Places Text Search (better intent), fallback: Geocoding
    const textUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    textUrl.searchParams.set("query", query);
    textUrl.searchParams.set("key", key);

    const geoUrl = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    geoUrl.searchParams.set("address", query);
    geoUrl.searchParams.set("key", key);

    const textRes = await fetch(textUrl, { method: "GET", cache: "no-store" });
    
    if (!textRes.ok) {
      console.error("GEOCODE_ERROR: Places Text Search API returned non-OK status", {
        status: textRes.status,
        statusText: textRes.statusText,
        query,
      });
      // Fall through to geocoding API
    }
    
    const textJson = (await textRes.json()) as {
      status?: string;
      error_message?: string;
      results?: Array<{
        geometry?: {
          location?: { lat: number; lng: number };
          viewport?: {
            northeast: { lat: number; lng: number };
            southwest: { lat: number; lng: number };
          };
        };
        formatted_address?: string;
        name?: string;
      }>;
    };
    
    // Check if Places API returned an error status
    const pick = (
      r: {
        geometry?: {
          location?: { lat: number; lng: number };
          viewport?: {
            northeast: { lat: number; lng: number };
            southwest: { lat: number; lng: number };
          };
        };
        formatted_address?: string;
        name?: string;
      } | null | undefined
    ) => {
      const loc = r?.geometry?.location;
      const vp = r?.geometry?.viewport;
      if (!loc) return null;
      return {
        lat: loc.lat,
        lng: loc.lng,
        viewport: vp
          ? {
              north: vp.northeast.lat,
              east: vp.northeast.lng,
              south: vp.southwest.lat,
              west: vp.southwest.lng,
            }
          : undefined,
        formattedAddress: r.formatted_address ?? r.name,
      };
    };

    // Try to get result from Places Text Search
    let hit = null;
    if (textJson?.status === "OK" || textJson?.status === "ZERO_RESULTS") {
      // Only use results if status is explicitly OK or ZERO_RESULTS
      hit = Array.isArray(textJson?.results) && textJson.results.length > 0 ? pick(textJson.results[0]) : null;
    } else if (textJson?.status) {
      // If status is an error (e.g., "REQUEST_DENIED", "INVALID_REQUEST"), log it but continue to fallback
      console.error("GEOCODE_ERROR: Places Text Search returned error status", {
        status: textJson.status,
        error_message: textJson.error_message,
        query,
      });
    }

    if (!hit) {
      const geoRes = await fetch(geoUrl, { method: "GET", cache: "no-store" });
      
      if (!geoRes.ok) {
        console.error("GEOCODE_ERROR: Geocoding API returned non-OK status", {
          status: geoRes.status,
          statusText: geoRes.statusText,
          query,
        });
        return NextResponse.json({ ok: false, error: "Geocoding service temporarily unavailable" }, { status: 400 });
      }
      
      const geoJson = (await geoRes.json()) as {
        status?: string;
        error_message?: string;
        results?: Array<{
          geometry?: {
            location?: { lat: number; lng: number };
            viewport?: {
              northeast: { lat: number; lng: number };
              southwest: { lat: number; lng: number };
            };
          };
          formatted_address?: string;
          name?: string;
        }>;
      };
      
      // Check if Geocoding API returned an error status
      if (geoJson.status && geoJson.status !== "OK" && geoJson.status !== "ZERO_RESULTS") {
        console.error("GEOCODE_ERROR: Geocoding API returned error status", {
          status: geoJson.status,
          error_message: geoJson.error_message,
          query,
        });
        
        // Provide more specific error message
        const errorMsg = geoJson.status === "REQUEST_DENIED" 
          ? "Geocoding service denied request. Please check API key configuration and ensure required APIs are enabled."
          : geoJson.status === "INVALID_REQUEST"
          ? "Invalid geocoding request. Please check the query format."
          : geoJson.status === "OVER_QUERY_LIMIT"
          ? "Geocoding quota exceeded. Please try again later."
          : `Geocoding failed: ${geoJson.status}${geoJson.error_message ? ` - ${geoJson.error_message}` : ''}`;
        return NextResponse.json({ ok: false, error: errorMsg }, { status: 400 });
      }
      
      hit = Array.isArray(geoJson?.results) && geoJson.results.length > 0 ? pick(geoJson.results[0]) : null;
    }

    if (!hit) {
      return NextResponse.json({ 
        ok: false, 
        error: `Could not find location: ${query}. Please try a more specific location (e.g., "Miami, FL" instead of "Miami").` 
      }, { status: 400 });
    }

    return NextResponse.json({ ok: true, ...hit });
  } catch (e) {
    console.error("GEOCODE_ERROR: Unexpected error", {
      error: e instanceof Error ? e.message : 'Unknown error',
      stack: e instanceof Error ? e.stack : undefined,
    });
    return NextResponse.json({ ok: false, error: "Geocoding service error. Please try again later." }, { status: 500 });
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
