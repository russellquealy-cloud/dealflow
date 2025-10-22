'use client';

import React, { useState } from 'react';
import ListingCard from './ListingCard';

export type MapPoint = { id: string; lat: number; lng: number; price?: number };
export type ListItem = { id: string } & Record<string, unknown>;

type Props = {
  points: MapPoint[];
  listings: ListItem[];
  MapComponent: React.ComponentType<{ points: MapPoint[]; onBoundsChange?: (bounds: unknown) => void }>;
};

export default function ListingsSplitClient({ points, listings, MapComponent }: Props) {
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  
  console.log('ListingsSplitClient render:', { points: points.length, listings: listings.length });
  
  return (
    <div style={{ height: '100%', padding: '12px 18px 18px 18px', boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* Mobile View Toggle - Only visible on mobile */}
      <div className="lg:hidden flex gap-2 mb-4 z-30 relative bg-white">
        <button
          onClick={() => setMobileView('map')}
          className={`flex-1 py-3 px-4 rounded-lg border font-semibold ${
            mobileView === 'map' 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          🗺️ Map View
        </button>
        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 py-3 px-4 rounded-lg border font-semibold ${
            mobileView === 'list' 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-white text-gray-700 border-gray-300'
          }`}
        >
          📋 List View
        </button>
      </div>

      {/* Desktop: Side by side, Mobile: Stacked with toggle */}
      <div style={{ height: 'calc(100% - 60px)' }} className="grid grid-cols-1 lg:grid-cols-[minmax(540px,1fr)_1fr] gap-4 lg:gap-4 lg:h-full">
        {/* MAP */}
        <div className={`
          border border-gray-200 rounded-xl bg-white min-w-0 flex overflow-hidden
          ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}
          h-full lg:h-auto
        `} style={{ maxHeight: '100%' }}>
          <div className="flex-1 min-w-0 w-full h-full">
            <MapComponent points={points} />
          </div>
        </div>

        {/* LIST */}
        <div className={`
          border border-gray-200 rounded-xl bg-white min-w-0 overflow-y-auto p-3
          ${mobileView === 'map' ? 'hidden lg:block' : 'block'}
          h-full lg:h-auto
        `} style={{ maxHeight: '100%' }}>
          <div className="grid gap-3">
            {listings.length === 0 ? (
              <div className="text-center text-gray-500 py-5">
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