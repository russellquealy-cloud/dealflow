'use client';

import { useMemo, useState } from 'react';
import MapViewClient, { Point } from './MapViewClient';
import ListingCard from './ListingCard';

type Props = {
  points: Point[];
  listings: any[];
};

export default function ListingsSplitClient({ points, listings }: Props) {
  const [bounds, setBounds] = useState<any>(null);

  // filter listings to “what’s visible”
  const visible = useMemo(() => {
    if (!bounds) return listings;
    const { _southWest, _northEast } = bounds;
    const within = (lat: number, lng: number) =>
      lat >= _southWest.lat &&
      lat <= _northEast.lat &&
      lng >= _southWest.lng &&
      lng <= _northEast.lng;

    return listings.filter((l) => {
      const lat = Number(l.lat ?? l.latitude);
      const lng = Number(l.lng ?? l.longitude ?? l.lon ?? l.long);
      return Number.isFinite(lat) && Number.isFinite(lng) && within(lat, lng);
    });
  }, [bounds, listings]);

  return (
    // IMPORTANT: overflow-hidden on the wrapper stops page scrolling
    <div
      className="grid grid-cols-12 gap-6 overflow-hidden"
      style={{ ['--df-offset' as any]: '240px' }}
    >
      {/* Map column */}
      <div className="col-span-12 lg:col-span-6 min-h-0">
        <MapViewClient points={points} onBoundsChange={setBounds} />
      </div>

      {/* List column (scrolls independently) */}
      <div className="col-span-12 lg:col-span-6 min-h-0">
        <div className="h-[calc(100vh-var(--df-offset))] overflow-y-auto pr-2 space-y-4">
          {visible.map((l: any) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </div>
    </div>
  );
}
