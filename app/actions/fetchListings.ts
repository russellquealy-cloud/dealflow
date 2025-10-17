'use server';

import 'server-only';

export type Bounds = { _southWest: { lat: number; lng: number }; _northEast: { lat: number; lng: number } };

export type Params = {
  q?: string;
  minBeds?: number | null;
  maxBeds?: number | null;
  minBaths?: number | null;
  maxBaths?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minSqft?: number | null;
  maxSqft?: number | null;
  bounds?: Bounds | null;
};

export async function fetchListings(params: Params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k === 'bounds') continue;
    if (typeof v === 'number') q.set(k, String(v));
    else if (typeof v === 'string' && v.trim() !== '') q.set(k, v);
  }
  if (params.bounds) {
    const b = params.bounds;
    q.set('bbox', [b._southWest.lat, b._southWest.lng, b._northEast.lat, b._northEast.lng].join(','));
  }

  const res = await fetch(`/api/listings.geojson?${q.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load listings');
  return (await res.json()) as unknown;
}
