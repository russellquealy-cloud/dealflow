/* eslint-disable @typescript-eslint/no-explicit-any */
type Bounds = { _southWest: { lat: number; lng: number }; _northEast: { lat: number; lng: number } };
type FetchParams = {
  bounds?: Bounds;
  minBeds?: number; maxBeds?: number;
  minBaths?: number; maxBaths?: number;
  minPrice?: number; maxPrice?: number;
};

export async function fetchListings(params: FetchParams = {}) {
  const q = new URLSearchParams();
  if (params.bounds) q.set('bbox', [
    params.bounds._southWest.lng,
    params.bounds._southWest.lat,
    params.bounds._northEast.lng,
    params.bounds._northEast.lat,
  ].join(','));
  for (const [k, v] of Object.entries(params)) {
    if (k === "bounds") continue; // handled separately

    if (v === undefined || v === null) continue;

    if (typeof v === "string") {
      if (v.trim() !== "") q.set(k, v);
      continue;
    }

    if (typeof v === "number" || typeof v === "boolean") {
      q.set(k, String(v));
      continue;
    }

    // Ignore arrays/objects (e.g., Bounds) — not serializable here
  }

  const res = await fetch(`/api/listings.geojson?${q.toString()}`, { cache: 'no-store' });
  const data = await res.json();
  return data;
}
