'use client';
import Link from 'next/link';

type Num = number | string | null | undefined;
const toNum = (v: Num) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const money = (n?: number) =>
  typeof n === 'number'
    ? n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    : '—';

const pick = (obj: any, keys: string[]) => {
  for (const k of keys) if (obj?.[k] !== undefined && obj?.[k] !== null && obj?.[k] !== '') return obj[k];
  return undefined;
};

export default function ListingCard({ listing }: { listing: any }) {
  if (!listing) return null;

  const price = toNum(pick(listing, ['price', 'list_price', 'listPrice', 'asking_price']));
  const arv = toNum(pick(listing, ['arv', 'after_repair_value', 'afterRepairValue']));
  const repairs = toNum(pick(listing, ['repairs', 'repair_costs', 'repairs_cost', 'repairCosts']));
  const sqft = toNum(pick(listing, ['sqft', 'home_sqft', 'living_area', 'livingArea']));
  const beds = toNum(pick(listing, ['beds', 'bedrooms', 'bed']));
  const baths = toNum(pick(listing, ['baths', 'bathrooms', 'bath']));
  const spread = typeof arv === 'number' && typeof price === 'number' ? arv - (price + (repairs ?? 0)) : undefined;
  const roi = typeof arv === 'number' && typeof price === 'number'
    ? ((arv - (price + (repairs ?? 0))) / (price + (repairs ?? 0))) * 100 : undefined;
  const hero = pick(listing, ['hero_url', 'photo_url', 'image_url', 'coverImage']);

  const addrLine = (() => {
    const street = pick(listing, ['address', 'street', 'street_address']);
    const city = pick(listing, ['city']);
    const state = pick(listing, ['state', 'region']);
    const zip = pick(listing, ['zip', 'zipcode', 'postal_code']);
    return [street, city, state, zip].filter(Boolean).join(', ');
  })();

  return (
    <Link
      href={`/listing/${listing.id}`}
      style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
    >
      <div className="rounded-xl border bg-white overflow-hidden">
        {hero && <img src={hero} alt={addrLine || 'Listing photo'} className="h-40 w-full object-cover" />}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-xl font-semibold">{money(price)}</h3>
            <div className="text-sm text-gray-600 text-right">{addrLine}</div>
          </div>
          <div className="text-sm text-gray-800">
            {typeof beds === 'number' ? `${beds} bd` : '— bd'} • {typeof baths === 'number' ? `${baths} ba` : '— ba'} • {typeof sqft === 'number' ? `${sqft.toLocaleString()} sq ft` : '— sq ft'}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">ARV {money(arv)}</span>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">Repairs {money(repairs)}</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Spread {money(spread)}</span>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">ROI {typeof roi === 'number' ? `${Math.round(roi)}%` : '—'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
