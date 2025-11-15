'use client';

import GoogleMapComponent from '@/components/GoogleMapComponent';

type Point = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
};

export default function HeatmapClient({ points }: { points: Point[] }) {
  return (
    <GoogleMapComponent
      points={points.map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        title: p.title,
      }))}
    />
  );
}

