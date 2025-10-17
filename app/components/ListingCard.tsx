'use client';

import Link from 'next/link';
import Image from 'next/image';
import * as React from 'react';
import { formatCurrency } from '@/lib/format';
import { coverUrlFromListing } from '@/lib/images';
import type { Listing } from '@/types';

type Props = { listing: Listing };

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
  const url = `/listing/${listing.id}`;
  const price = listing.price ?? 0;
  const arv = listing.arv ?? 0;
  const repairs = listing.repairs ?? 0;
  const spread = Math.max(0, arv - repairs - price);
  const roiPct = price > 0 ? (spread / price) * 100 : 0;

  const addr = [listing.address1, listing.city, listing.state, listing.zip]
    .filter(Boolean)
    .join(', ');

  const img = coverUrlFromListing(listing);

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
              alt={addr || 'Listing photo'}
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
          <div style={{ marginTop: 4, color: '#6b7280', fontSize: 13 }}>{addr || '—'}</div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {badge(`ARV ${formatCurrency(arv)}`)}
            {badge(`Repairs ${formatCurrency(repairs)}`)}
            {badge(`Spread ${formatCurrency(spread)}`)}
            {badge(`ROI ${roiPct.toFixed(0)}%`)}
          </div>
        </div>
      </div>
    </Link>
  );
}
