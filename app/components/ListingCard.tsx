// app/components/ListingCard.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';

export type ListingLike = {
  id: string | number;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number | string;
  bedrooms?: number;
  bathrooms?: number;
  home_sqft?: number;
  images?: string[];
  cover_image_url?: string;
  // optional KPIs
  arv?: number;
  repairs?: number;
  spread?: number;
  roi?: number;
};

type Props = { listing: ListingLike };

function asNum(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function currency(n?: number) {
  return n === undefined ? '—' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function ListingCard({ listing }: Props) {
  const href = `/listing/${listing.id}`;
  const price = asNum(listing.price);
  const beds = listing.bedrooms;
  const baths = listing.bathrooms;
  const sqft = listing.home_sqft;
  const addressLine = listing.address ??
    [listing.title, [listing.city, listing.state].filter(Boolean).join(', '), listing.zip].filter(Boolean).join(', ');

  // image url (cover or first image path already absolute in your data)
  const img = listing.cover_image_url ?? (listing.images && listing.images[0]) ?? null;

  const pills: Array<{ label: string; value: string }> = [];
  const arv = asNum(listing.arv);       if (arv !== undefined) pills.push({ label: 'ARV', value: currency(arv) });
  const rep = asNum(listing.repairs);   if (rep !== undefined) pills.push({ label: 'Repairs', value: currency(rep) });
  const spr = asNum(listing.spread);    if (spr !== undefined) pills.push({ label: 'Spread', value: currency(spr) });
  const roi = asNum(listing.roi);       if (roi !== undefined) pills.push({ label: 'ROI', value: `${roi}%` });

  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          gap: 14,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 12,
          alignItems: 'center',
          background: '#fff',
        }}
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', borderRadius: 10, background: '#f3f4f6' }}>
          {img ? <Image src={img} alt="" fill sizes="140px" style={{ objectFit: 'cover' }} /> : null}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{currency(price)}</div>
          <div style={{ color: '#374151', fontSize: 13, marginTop: 4, lineHeight: 1.2 }}>{addressLine || '—'}</div>
          <div style={{ color: '#111', fontSize: 13, marginTop: 8 }}>
            {beds !== undefined ? `${beds} bd` : '—'} • {baths !== undefined ? `${baths} ba` : '—'} • {sqft !== undefined ? `${sqft.toLocaleString()} sqft` : '—'}
          </div>

          {!!pills.length && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {pills.map((p) => (
                <span key={p.label} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 16, background: '#E6FBF7', color: '#0f766e', border: '1px solid #A7F3D0' }}>
                  {p.label} {p.value}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
