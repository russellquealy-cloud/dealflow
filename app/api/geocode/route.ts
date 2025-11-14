// Node runtime (uses server key)
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

type GeoReq = { q?: string; address?: string; placeId?: string };

type GeoResp =
  | {
      ok: true;
      lat: number;
      lng: number;
      viewport?: { north: number; south: number; east: number; west: number };
      formatted_address?: string;
    }
  | { ok: false; error: string };

export async function POST(req: NextRequest): Promise<NextResponse<GeoResp>> {
  try {
    const body = (await req.json()) as GeoReq;
    // Support both 'q' and 'address' for backward compatibility
    const query = (body.q || body.address || "").trim();
    const placeId = body.placeId;

    if (!query && !placeId) {
      return NextResponse.json({ ok: false, error: "missing_query" }, { status: 422 });
    }

    // Use server-side key (not public key)
    const key = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      return NextResponse.json({ ok: false, error: "server_key_missing" }, { status: 500 });
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
          formatted_address: placeJson.result.formatted_address || placeJson.result.name,
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
    const textJson = await textRes.json();

    const pick = (r: any) => {
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
        formatted_address: r.formatted_address ?? r.name,
      };
    };

    let hit = Array.isArray(textJson?.results) ? pick(textJson.results[0]) : null;

    if (!hit) {
      const geoRes = await fetch(geoUrl, { method: "GET", cache: "no-store" });
      const geoJson = await geoRes.json();
      hit = Array.isArray(geoJson?.results) ? pick(geoJson.results[0]) : null;
    }

    if (!hit) {
      return NextResponse.json({ ok: false, error: "no_results" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ...hit });
  } catch (e: any) {
    console.error("GEOCODE_ERROR", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

// Keep GET for backward compatibility
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address") ?? undefined;
  const placeId = searchParams.get("placeId") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  return POST(
    new NextRequest(request.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: q || address, placeId }),
    })
  );
}
