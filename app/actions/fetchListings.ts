
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
// Build query string safely from params
for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
  if (k === "bounds") continue; // handled separately
  if (v == null) continue;      // skip undefined/null

  if (typeof v === "string") {
    const s = v.trim();
    if (s !== "") q.set(k, s);
    continue;
  }

  if (typeof v === "number" || typeof v === "boolean") {
    q.set(k, String(v));
    continue;
  }

  // ignore non-primitives (e.g., Bounds object)
}


  const res = await fetch(`/api/listings.geojson?${q.toString()}`, { cache: 'no-store' });
  const data = await res.json();
  return data;
}
