'use client';

import React, { useState } from 'react';
import ListingCard from './ListingCard';

export type MapPoint = { id: string; lat: number; lng: number; price?: number; featured?: boolean; featured_until?: string };
export type ListItem = { id: string } & Record<string, unknown>;

type Props = {
  points: MapPoint[];
  listings: ListItem[];
  MapComponent: React.ComponentType<{ points: MapPoint[]; onBoundsChange?: (bounds: unknown) => void }>;
  onBoundsChange?: (bounds: unknown) => void;
};

export default function ListingsSplitClient({ points, listings, MapComponent, onBoundsChange }: Props) {
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Mobile View Toggle - Only visible on mobile */}
      <div className="lg:hidden flex gap-2 mb-4 z-30 relative bg-white flex-shrink-0">
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
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(540px,1fr)_1fr] gap-4 flex-1 min-h-0">
        {/* MAP */}
        <div style={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          background: '#fff',
          minWidth: 0, // Prevent layout thrash (per guardrails)
          display: mobileView === 'list' ? 'none' : 'flex',
          height: '65vh',
          overflow: 'hidden'
        }}>
          <div style={{
            flex: 1,
            minWidth: 0,
            width: '100%',
            height: '100%'
          }}>
            <MapComponent points={points} onBoundsChange={onBoundsChange} />
          </div>
        </div>

        {/* LIST */}
        <div className={`
          border border-gray-200 rounded-xl bg-white min-w-0 overflow-y-auto p-4
          ${mobileView === 'map' ? 'hidden lg:block h-full' : 'block'}
          ${mobileView === 'list' ? 'h-[calc(100vh-200px)] lg:h-full' : 'h-[35vh] lg:h-full'}
        `}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {listings.length === 0 ? (
              <div className="text-center text-gray-500 py-5 col-span-full">
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