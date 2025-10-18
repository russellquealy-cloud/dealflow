// app/components/ListingsSplitClient.tsx
'use client';

import React, { useMemo } from 'react';
import ListingCard from './ListingCard';

export type MapPoint = { id: string; lat: number; lng: number };
export type ListItem = { id: string } & Record<string, unknown>;

type Props = {
  points: MapPoint[];
  listings: ListItem[];
  MapComponent: React.ComponentType<{ points: MapPoint[] }>;
};

export default function ListingsSplitClient({ points, listings, MapComponent }: Props) {
  // Map LEFT, List RIGHT. Page itself does not scroll.
  const wrap: React.CSSProperties = {
    flex: 1, minHeight: 0, overflow: 'hidden', padding: '12px 18px 18px 18px',
  };
  const grid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(520px, 1fr) 1fr', // map left like OLD
    gap: 16,
    height: '100%',
    minHeight: 0,
  };
  const pane: React.CSSProperties = {
    border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', minWidth: 0, minHeight: 0, overflow: 'hidden',
  };
  const mapPane: React.CSSProperties = { ...pane };
  const listPane: React.CSSProperties = { ...pane, overflowY: 'auto' };

  const visible = useMemo(() => listings, [listings]);

  return (
    <div style={wrap}>
      <div style={grid}>
        {/* LEFT: map */}
        <div style={mapPane}>
          <div style={{ height: '100%', width: '100%' }}>
            <MapComponent points={points} />
          </div>
        </div>

        {/* RIGHT: listings */}
        <div style={listPane}>
          <div style={{ display: 'grid', gap: 12, padding: 10 }}>
            {visible.map((l) => <ListingCard key={String(l.id)} listing={l} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
