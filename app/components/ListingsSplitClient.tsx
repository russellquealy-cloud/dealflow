// app/components/ListingsSplitClient.tsx
'use client';

import React, { useMemo, useState } from 'react';
import ListingCard from './ListingCard';
import MobileTabs from './MobileTabs';

export type MapPoint = { id: string; lat: number; lng: number };
export type ListItem = { id: string } & Record<string, unknown>;

type Props = {
  points: MapPoint[];
  listings: ListItem[];
  MapComponent: React.ComponentType<{ points: MapPoint[] }>;
};

export default function ListingsSplitClient({ points, listings, MapComponent }: Props) {
  const [tab, setTab] = useState<'list' | 'map'>('list');

  // Old layout proportions
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(420px, 1fr) 1fr', // left map fixed min width
    gap: 16,
    padding: '12px 18px 18px 18px',
    flex: 1,
    minHeight: 0,
  };

  const paneStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    background: '#fff',
    overflow: 'hidden',
    minWidth: 0,
    minHeight: 0,
  };

  const mapBoxStyle: React.CSSProperties = {
    ...paneStyle,
    height: 'calc(100dvh - 220px)', // matches old header+filters height
  };

  const listBoxStyle: React.CSSProperties = {
    ...paneStyle,
    height: 'calc(100dvh - 220px)',
    overflowY: 'auto',
    padding: 10,
  };

  // Mobile one-pane
  const mobileBoxStyle: React.CSSProperties = {
    height: 'calc(100dvh - 240px)',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    background: '#fff',
  };

  const visible = useMemo(() => listings, [listings]);

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block" style={{ minHeight: 0, flex: 1 }}>
        <div style={gridStyle}>
          <div style={mapBoxStyle}>
            <MapComponent points={points} />
          </div>
          <div style={listBoxStyle}>
            <div style={{ display: 'grid', gap: 12 }}>
              {visible.map((l) => <ListingCard key={String(l.id)} listing={l} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden" style={{ padding: '12px 18px', display: 'grid', gap: 10, minHeight: 0, flex: 1 }}>
        <MobileTabs active={tab} onChange={setTab} />
        {tab === 'map' ? (
          <div style={mobileBoxStyle}>
            <MapComponent points={points} />
          </div>
        ) : (
          <div style={{ ...mobileBoxStyle, padding: 10, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gap: 12 }}>
              {visible.map((l) => <ListingCard key={String(l.id)} listing={l} />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
