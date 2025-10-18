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
  // Fill viewport. Page does not scroll.
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '12px 18px 18px 18px' }}>
      <div
        style={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: 'minmax(520px, 1fr) 1fr', // MAP LEFT, LIST RIGHT
          gap: 16,
          minHeight: 0,
        }}
      >
        {/* MAP LEFT */}
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            minWidth: 0,
            minHeight: 0,
            display: 'flex',
          }}
        >
          <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
            <MapComponent points={points} />
          </div>
        </div>

        {/* LIST RIGHT */}
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            minWidth: 0,
            minHeight: 0,
            overflowY: 'auto',
            padding: 10,
          }}
        >
          <div style={{ display: 'grid', gap: 12 }}>
            {useMemo(() => listings, [listings]).map((l) => (
              <ListingCard key={String(l.id)} listing={l} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
