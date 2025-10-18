'use client';

import Link from 'next/link';
import Image from 'next/image';

type ListingLike = {
  id: string | number;
  address?: string;
  price?: number | string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  home_sqft?: number | string;
  images?: string[]; // array of storage paths
  cover_image_url?: string; // absolute fallback
};

type Props = { listing: ListingLike };

function toNum(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

const bucket = process.env.NEXT_PUBLIC_LISTING_IMAGE_BUCKET;

function displayUrl(listing: ListingLike): string | null {
  if (listing.cover_image_url) return listing.cover_image_url;
  const path = listing.images && listing.images.length ? listing.images[0] : null;
  if (!path || !bucket || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  // public bucket assumption; if signed URLs are needed, switch to RPC
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export default function ListingCard({ listing }: Props) {
  const href = `/listing/${listing.id}`;
  const price = toNum(listing.price);
  const beds = toNum(listing.bedrooms);
  const baths = toNum(listing.bathrooms);
  const sqft = toNum(listing.home_sqft);
  const img = displayUrl(listing);

  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr',
          gap: 12,
          padding: 10,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', borderRadius: 8 }}>
          {img ? (
            <Image src={img} alt="" fill sizes="120px" style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ height: '100%', width: '100%', background: '#f3f4f6' }} />
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800 }}>{price ? price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) : '—'}</div>
          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{listing.address ?? '—'}</div>
          <div style={{ color: '#111', fontSize: 13, marginTop: 6 }}>
            {beds ? `${beds} bd` : '—'} • {baths ? `${baths} ba` : '—'} • {sqft ? `${sqft.toLocaleString()} sqft` : '—'}
          </div>
        </div>
      </div>
    </Link>
  );
}
