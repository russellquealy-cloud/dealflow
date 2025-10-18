'use client';

import React from 'react';
import ListingCard from './ListingCard';

export type MapPoint = { id: string; lat: number; lng: number; price?: number };
export type ListItem = { id: string } & Record<string, unknown>;

type Props = {
  points: MapPoint[];
  listings: ListItem[];
  MapComponent: React.ComponentType<{ points: MapPoint[]; onBoundsChange?: (bounds: unknown) => void }>;
};

export default function ListingsSplitClient({ points, listings, MapComponent }: Props) {
  console.log('ListingsSplitClient render:', { points: points.length, listings: listings.length });
  
  // Fill viewport. Page does not scroll.
  return (
  <div style={{ height: '100%', padding: '12px 18px 18px 18px', boxSizing: 'border-box' }}>
    <div
      style={{
        height: '100%',
        display: 'grid',
        gridTemplateColumns: 'minmax(540px, 1fr) 1fr', // MAP LEFT, LIST RIGHT
        gap: 16,
        minHeight: 0,
      }}
    >
      {/* MAP LEFT */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', minWidth: 0, minHeight: 0, display: 'flex' }}>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
          <MapComponent points={points} />
        </div>
      </div>

      {/* LIST RIGHT */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff', minWidth: 0, minHeight: 0, overflowY: 'auto', padding: 10 }}>
        <div style={{ display: 'grid', gap: 12 }}>
          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
              No listings found
            </div>
          ) : (
            listings.map((l) => <ListingCard key={String(l.id)} listing={l} />)
          )}
        </div>
      </div>
    </div>
  </div>
);
}