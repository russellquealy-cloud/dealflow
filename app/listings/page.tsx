// app/listings/page.tsx
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import FiltersBar, { type Filters } from '@/components/FiltersBar';
import ListingsSplitClient from '@/components/ListingsSplitClient';

const MapViewClient = dynamic(() => import('@/components/MapViewClient'), { ssr: false });

export type MapPoint = { id: string; lat: number; lng: number };
export type ListItem = { id: string } & Record<string, unknown>;

export default function ListingsPage() {
  // UI state only; wire to data later
  const [filters, setFilters] = useState<Filters>({
    minBeds: null, maxBeds: null,
    minBaths: null, maxBaths: null,
    minPrice: null, maxPrice: null,
    minSqft: null, maxSqft: null,
  });

  // placeholders; replace with real data
  const points: MapPoint[] = [];
  const listings: ListItem[] = [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      {/* Title + search row (visual match to old) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 8px 18px' }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Find Deals</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            aria-label="Search city or address"
            placeholder="Search city or address"
            style={{ height: 36, width: 360, maxWidth: '62vw', border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 10px' }}
          />
          <button style={{ height: 36, padding: '0 14px', border: '1px solid #111', borderRadius: 8, background: '#111', color: '#fff' }}>
            Search
          </button>
          <a href="/listings" style={{ textDecoration: 'none' }}>
            <button style={{ height: 36, padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
              Reset view
            </button>
          </a>
        </div>
      </div>

      {/* Filters row */}
      <div style={{ padding: '6px 18px 12px 18px', borderBottom: '1px solid #e5e7eb' }}>
        <FiltersBar value={filters} onChange={setFilters} />
      </div>

      {/* Split: LEFT map, RIGHT list (exact old layout) */}
      <ListingsSplitClient
        points={points}
        listings={listings}
        MapComponent={MapViewClient}
      />
    </div>
  );
}
