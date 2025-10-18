/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */


import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ListingsSplitClient from '@/components/ListingsSplitClient';
import SearchBarClient from '@/components/SearchBarClient';
import { price, beds, baths, sqft } from '@/lib/filterOptions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const toNum = (v: unknown) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const pick = (obj: any, keys: string[]) => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return undefined;
};

export default async function ListingsPage({ searchParams }: { searchParams: any }) {
  const supabase = createClient();
  const { data, error } = await supabase.from('listings').select('*').limit(500);

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-black">Find Deals</h1>
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-800">
          Supabase error: {error.message}
        </div>
      </div>
    );
  }

  const rows = (data ?? []) as any[];

  // normalize for map points
  const normalized = rows
    .map((r) => {
      const lat = toNum(pick(r, ['lat', 'latitude']));
      const lng = toNum(pick(r, ['lng', 'longitude', 'lon', 'long']));
      const priceRaw = pick(r, ['price', 'list_price', 'asking_price']);
      const price =
        typeof priceRaw === 'number'
          ? priceRaw
          : typeof priceRaw === 'string'
          ? Number(priceRaw.replace(/[^\d.-]/g, ''))
          : undefined;
      return { raw: r, lat, lng, price };
    })
    .filter(({ lat, lng }) => lat !== undefined && lng !== undefined);

  const points = normalized.map(({ raw, lat, lng, price }) => ({
    id: String(raw.id),
    lat: lat!,
    lng: lng!,
    price,
  }));

  const listings = normalized.map(({ raw }) => raw);

  return (
    <div className="mx-auto max-w-screen-2x1 px-6 pt-6 space-y-5 overflow-hidden">
      {/* header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black mb-4">Find Deals</h1>
        <SearchBarClient />
      </div>

{/* filters row */}
<div className="grid grid-cols-2 md:grid-cols-9 gap-3">
  {/* Beds */}
  <div className="space-y-1">
    <label className="text-xs text-gray-600">Min Beds</label>
    <select className="rounded-md border px-2 py-2">
      {beds.map((o, i) => <option key={i} value={String(o)}>{String(o)}</option>)}
    </select>
  </div>
  <div className="space-y-1">
    <label className="text-xs text-gray-600">Max Beds</label>
    <select className="rounded-md border px-2 py-2">
      {beds.map((o, i) => <option key={i} value={String(o)}>{String(o)}</option>)}
    </select>
  </div>

  {/* Baths */}
  <div className="space-y-1">
    <label className="text-xs text-gray-600">Min Baths</label>
    <select className="rounded-md border px-2 py-2">
      {baths.map((o, i) => <option key={i} value={String(o)}>{String(o)}</option>)}
    </select>
  </div>
  <div className="space-y-1">
    <label className="text-xs text-gray-600">Max Baths</label>
    <select className="rounded-md border px-2 py-2">
      {baths.map((o, i) => <option key={i} value={String(o)}>{String(o)}</option>)}
    </select>
  </div>

  {/* Price */}
  <div className="space-y-1">
    <label className="text-xs text-gray-600">Min Price</label>
    <select className="rounded-md border px-2 py-2">
      {price.map((o, i) => <option key={i} value={String(o)}>{String(o)}</option>)}
    </select>
  </div>
  <div className="space-y-1">
    <label className="text-xs text-gray-600">Max Price</label>
    <select className="rounded-md border px-2 py-2">
      {price.map((o, i) => <option key={i} value={String(o)}>{String(o)}</option>)}
    </select>
  </div>

  {/* Sq Ft */}
  <div className="space-y-1">
    <label className="text-xs text-gray-600">Min Sq Ft</label>
    <select className="rounded-md border px-2 py-2">
      {sqft.map((o, i) => <option key={i} value={String(o)}>{String(o)}</option>)}
    </select>
  </div>
  <div className="space-y-1">
    <label className="text-xs text-gray-600">Max Sq Ft</label>
    <select className="rounded-md border px-2 py-2">
      {sqft.map((o, i) => <option key={i} value={String(o)}>{String(o)}</option>)}
    </select>
  </div>

  <div className="flex items-end">
    <Link href="/listings" className="rounded-md border px-3 py-2 hover:bg-gray-50">Reset view</Link>
  </div>
</div>



      {/* main split view – page won’t scroll; list column will */}
      <ListingsSplitClient points={points} listings={listings} />
    </div>
  );
}
