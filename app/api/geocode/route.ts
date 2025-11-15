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
      return NextResponse.json({ ok: false, error: "Geocoding failed: missing query" }, { status: 400 });
    }

    // Use server-side key (prefer dedicated server key, fallback to public key)
    const key = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      console.error("GEOCODE_ERROR: Maps server key is not configured");
      return NextResponse.json({ ok: false, error: "Maps server key is not configured" }, { status: 500 });
    }

    // If placeId is provided, use Place Details API
    if (placeId) {
      const placeUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
      placeUrl.searchParams.set("place_id", placeId);
      placeUrl.searchParams.set("key", key);
      placeUrl.searchParams.set("fields", "geometry,formatted_address,name");

      const placeRes = await fetch(placeUrl, { method: "GET", cache: "no-store" });
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
      console.error("GEOCODE_ERROR: Places Text Search API returned non-OK status", textRes.status);
      // Fall through to geocoding API
    }
    
    const textJson = (await textRes.json()) as {
      status?: string;
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
    if (textJson.status && textJson.status !== "OK" && textJson.status !== "ZERO_RESULTS") {
      console.error("GEOCODE_ERROR: Places Text Search returned error status", textJson.status);
      // Fall through to geocoding API
    }

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

    let hit = Array.isArray(textJson?.results) && textJson.results.length > 0 ? pick(textJson.results[0]) : null;

    if (!hit) {
      const geoRes = await fetch(geoUrl, { method: "GET", cache: "no-store" });
      
      if (!geoRes.ok) {
        console.error("GEOCODE_ERROR: Geocoding API returned non-OK status", geoRes.status);
        return NextResponse.json({ ok: false, error: "Geocoding failed" }, { status: 400 });
      }
      
      const geoJson = (await geoRes.json()) as {
        status?: string;
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
        console.error("GEOCODE_ERROR: Geocoding API returned error status", geoJson.status);
        return NextResponse.json({ ok: false, error: "Geocoding failed" }, { status: 400 });
      }
      
      hit = Array.isArray(geoJson?.results) && geoJson.results.length > 0 ? pick(geoJson.results[0]) : null;
    }

    if (!hit) {
      return NextResponse.json({ ok: false, error: "Geocoding failed" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, ...hit });
  } catch (e) {
    console.error("GEOCODE_ERROR", e);
    return NextResponse.json({ ok: false, error: "Geocoding failed" }, { status: 500 });
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
