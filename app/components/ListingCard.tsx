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
  arv?: number | string;
  repairs?: number | string;
  spread?: number | string;
  roi?: number | string; // percent
};

type Props = { listing: ListingLike };

const toNum = (v: unknown): number | undefined => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};
const money = (n?: number) =>
  n === undefined ? '—' : n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function ListingCard({ listing }: Props) {
  const href = `/listing/${listing.id}`;
  const price = toNum(listing.price);
  const beds = listing.bedrooms;
  const baths = listing.bathrooms;
  const sqft = listing.home_sqft;
  const address =
    listing.address ??
    [listing.title, [listing.city, listing.state].filter(Boolean).join(', '), listing.zip]
      .filter(Boolean)
      .join(', ');

  const img = listing.cover_image_url ?? (listing.images && listing.images[0]) ?? null;

  const arv = toNum(listing.arv);
  const repairs = toNum(listing.repairs);
  const spread = toNum(listing.spread);
  const roi = toNum(listing.roi);

  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr',
          gap: 14,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          padding: 12,
          background: '#fff',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', borderRadius: 10, background: '#f3f4f6' }}>
          {img ? <Image src={img} alt="" fill sizes="160px" style={{ objectFit: 'cover' }} /> : null}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{money(price)}</div>
          <div style={{ color: '#374151', fontSize: 13, marginTop: 4, lineHeight: 1.2 }}>{address || '—'}</div>
          <div style={{ color: '#111', fontSize: 13, marginTop: 8 }}>
            {beds !== undefined ? `${beds} bd` : '—'} • {baths !== undefined ? `${baths} ba` : '—'} •{' '}
            {sqft !== undefined ? `${sqft.toLocaleString()} sqft` : '—'}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {arv !== undefined && (
              <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 16, background: '#E6FBF7', color: '#0f766e', border: '1px solid #A7F3D0' }}>
                ARV {money(arv)}
              </span>
            )}
            {repairs !== undefined && (
              <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 16, background: '#E6FBF7', color: '#0f766e', border: '1px solid #A7F3D0' }}>
                Repairs {money(repairs)}
              </span>
            )}
            {spread !== undefined && (
              <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 16, background: '#E6FBF7', color: '#0f766e', border: '1px solid #A7F3D0' }}>
                Spread {money(spread)}
              </span>
            )}
            {roi !== undefined && (
              <span style={{ fontSize: 12, padding: '4px 8px', borderRadius: 16, background: '#E6FBF7', color: '#0f766e', border: '1px solid #A7F3D0' }}>
                ROI {roi}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
