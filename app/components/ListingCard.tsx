'use client';

import Link from 'next/link';
import Image from 'next/image';
import * as React from 'react';
import { formatCurrency } from '@/lib/format';

type ListingLike = {
  id: string | number;
} & Record<string, unknown>;

type Props = { listing: ListingLike };

const toNum = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const pickString = (obj: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const k of keys) {
    const val = obj[k];
    if (typeof val === 'string' && val.trim() !== '') return val;
  }
  return undefined;
};

const pickNumber = (obj: Record<string, unknown>, keys: string[]): number => {
  for (const k of keys) {
    const v = obj[k];
    const n = toNum(v);
    if (n !== 0) return n;
    if (v === 0) return 0;
  }
  return 0;
};

function badge(text: string) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        background: '#ecfeff',
        border: '1px solid #a5f3fc',
      }}
    >
      {text}
    </span>
  );
}

export default function ListingCard({ listing }: Props) {
  const obj = listing as Record<string, unknown>;
  const url = `/listing/${String(listing.id)}`;

  // numbers (coerce safely)
  const price = pickNumber(obj, ['price', 'list_price', 'asking_price']);
  const arv = pickNumber(obj, ['arv', 'after_repair_value']);
  const repairs = pickNumber(obj, ['repairs', 'repair_costs']);
  const spread = Math.max(0, arv - repairs - price);
  const roiPct = price > 0 ? (spread / price) * 100 : 0;

  // address
  const address = [
    pickString(obj, ['address1', 'address', 'street', 'street_address']),
    pickString(obj, ['city']),
    pickString(obj, ['state', 'region']),
    pickString(obj, ['zip', 'zipcode', 'postal_code']),
  ]
    .filter(Boolean)
    .join(', ');

  // image (prefer explicit hero/cover, then common fields)
  const img =
    pickString(obj, ['hero_url', 'coverImage', 'imageUrl', 'photo_url', 'image_url']) ??
    // if there's an images array, take first string
    (() => {
      const cand = obj['images'];
      if (Array.isArray(cand)) {
        const first = cand.find((x) => typeof x === 'string') as string | undefined;
        return first;
      }
      return undefined;
    })();

  return (
    <Link
      href={url}
      style={{
        display: 'block',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'white',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12 }}>
        <div style={{ position: 'relative', height: 140, background: '#f3f4f6' }}>
          {img ? (
            <Image
              src={img}
              alt={address || 'Listing photo'}
              fill
              sizes="220px"
              style={{ objectFit: 'cover' }}
              priority={false}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                color: '#9ca3af',
                fontSize: 12,
              }}
            >
              No image
            </div>
          )}
        </div>

        <div style={{ padding: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{formatCurrency(price)}</div>
          <div style={{ marginTop: 4, color: '#6b7280', fontSize: 13 }}>{address || '—'}</div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {badge(`ARV ${formatCurrency(arv)}`)}
            {badge(`Repairs ${formatCurrency(repairs)}`)}
            {badge(`Spread ${formatCurrency(spread)}`)}
            {badge(`ROI ${Math.round(roiPct)}%`)}
          </div>
        </div>
      </div>
    </Link>
  );
}
