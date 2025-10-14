'use client';

import * as React from 'react';
import MapViewClient from './MapViewClient';

// Minimal point shape MapViewClient expects
type Point = { id?: string | number; lat: number; lng: number };

export default function MapInner({
  points,
  onBoundsChange,
}: {
  points: Point[];
  onBoundsChange?: (b: unknown) => void;
}) {
  return (
    <div className="h-full w-full">
      <MapViewClient points={points.map(p => ({
        id: String(p.id ?? `${p.lat},${p.lng}`),
        lat: Number(p.lat),
        lng: Number(p.lng),
      }))} onBoundsChange={onBoundsChange} />
    </div>
  );
}
