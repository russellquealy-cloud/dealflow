// app/listings/page.tsx
'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import FiltersBar, { type Filters } from '@/components/FiltersBar';
import MobileTabs from '@/components/MobileTabs';
import ListingList from '@/components/ListingList';

const MapViewClient = dynamic(() => import('@/components/MapViewClient'), { ssr: false });

export default function ListingsPage() {
  const [tab, setTab] = useState<'list' | 'map'>('list');

  // wire up filter state for FiltersBar
  const [filters, setFilters] = useState<Filters>({
    minBeds: null,
    maxBeds: null,
    minBaths: null,
    maxBaths: null,
    minPrice: null,
    maxPrice: null,
    minSqft: null,
    maxSqft: null,
  });

  // TODO: use `filters` to query listings and points
  const points = useMemo(() => [], [filters]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', minHeight: 0 }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
        <FiltersBar value={filters} onChange={setFilters} />
      </div>

      {/* Mobile tab switcher */}
      <div className="md:hidden" style={{ padding: 8 }}>
        <MobileTabs active={tab} onChange={setTab} />
      </div>

      {/* Desktop split */}
      <div
        className="hidden md:grid"
        style={{
          gridTemplateColumns: '440px 1fr',
          flex: 1,
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <div style={{ overflowY: 'auto', minWidth: 0 }}>
          <ListingList />
        </div>
        <div style={{ minWidth: 0, minHeight: 0 }}>
          <MapViewClient points={points} />
        </div>
      </div>

      {/* Mobile single-pane */}
      <div className="md:hidden" style={{ flex: 1, minHeight: 0 }}>
        {tab === 'list' ? (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <ListingList />
          </div>
        ) : (
          <div style={{ height: '100%', minHeight: 0, minWidth: 0 }}>
            <MapViewClient points={points} />
          </div>
        )}
      </div>
    </div>
  );
}
