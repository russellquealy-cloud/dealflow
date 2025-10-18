'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import FiltersBar from '@/app/components/FiltersBar';
import MobileTabs from '@/app/components/MobileTabs';
import ListingList from '@/app/components/ListingList';

const MapViewClient = dynamic(() => import('@/app/components/MapViewClient'), { ssr: false });

export default function ListingsPage() {
  const [tab, setTab] = useState<'list' | 'map'>('list');

  // TODO: wire filters to your data query
  const points = useMemo(() => [], []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', minHeight: 0 }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb' }}>
        <FiltersBar />
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
