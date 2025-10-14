'use client';

import { useMemo, useState } from 'react';
import MapViewClient from './MapViewClient';
import ListingCard from './ListingCard';

type Bounds = {
  _southWest: { lat: number; lng: number };
  _northEast: { lat: number; lng: number };
};

type Point = { lat: number; lng: number; id?: string | number };

type ListingLike = {
  id: string | number;
  lat?: number | string;
  lng?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  lon?: number | string;
  long?: number | string;
  [k: string]: unknown;
};

type Props = { points: Point[]; listings: ListingLike[] };

export default function ListingsSplitClient({ points, listings }: Props) {
  const [bounds, setBounds] = useState<Bounds | null>(null);

  const visible: ListingLike[] = useMemo(() => {
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
    <div className="grid grid-cols-12 gap-6 overflow-hidden" style={{ ['--df-offset' as any]: '240px' }}>
      {/* Map column */}
      <div className="col-span-12 lg:col-span-6 min-h-0">
        <MapViewClient points={points} onBoundsChange={setBounds} />
      </div>

      {/* List column (independent scroll) */}
      <div className="col-span-12 lg:col-span-6 min-h-0">
        <div className="h-[calc(100vh-var(--df-offset))] overflow-y-auto pr-2 space-y-4">
          {visible.map((l) => (
            <ListingCard key={String(l.id)} listing={l} />
          ))}
        </div>
      </div>
    </div>
  );
}
