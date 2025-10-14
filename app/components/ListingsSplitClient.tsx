'use client';

import { useMemo, useState } from 'react';
import MapViewClient from './MapViewClient';
import ListingCard from './ListingCard';
import type { Listing } from '@/types';

type Bounds = {
  _southWest: { lat: number; lng: number };
  _northEast: { lat: number; lng: number };
};

type Point = { id: string; lat: number; lng: number };
type Props = { points: Point[]; listings: Listing[] };

export default function ListingsSplitClient({ points, listings }: Props) {
  const [bounds, setBounds] = useState<Bounds | null>(null);

  const visible = useMemo(() => {
    if (!bounds) return listings;

    const { _southWest, _northEast } = bounds;
    const within = (lat: number, lng: number) =>
      lat >= _southWest.lat &&
      lat <= _northEast.lat &&
      lng >= _southWest.lng &&
      lng <= _northEast.lng;

    return listings.filter((l) => {
      const lat = Number((l as any).lat ?? (l as any).latitude);
      const lng = Number(
        (l as any).lng ??
          (l as any).longitude ??
          (l as any).lon ??
          (l as any).long
      );
      return Number.isFinite(lat) && Number.isFinite(lng) && within(lat, lng);
    });
  }, [bounds, listings]);

  return (
    <div
      className="grid grid-cols-12 gap-6 overflow-hidden"
      style={{ ['--df-offset' as any]: '240px' }}
    >
      {/* Map column */}
      <div className="col-span-12 lg:col-span-6 min-h-0">
        <MapViewClient points={points} onBoundsChange={setBounds} />
      </div>

      {/* List column (independent scroll) */}
      <div className="col-span-12 lg:col-span-6 min-h-0">
        <div className="h-[calc(100vh-var(--df-offset))] overflow-y-auto pr-2 space-y-4">
          {visible.map((l: Listing) => (
            <ListingCard key={(l as any).id} listing={l} />
          ))}
        </div>
      </div>
    </div>
  );
}
