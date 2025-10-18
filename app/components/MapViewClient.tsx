/* eslint-disable @typescript-eslint/no-explicit-any */
// app/components/MapViewClient.tsx
'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export type Point = { id: string; lat: number; lng: number; price?: number };

export default function MapViewClient({ points }: { points: Point[] }) {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let Lmod: any;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;

    const root = document.getElementById('df-map');
    if (!root) return;

    root.style.minWidth = '0';
    root.style.minHeight = '0';

    (async () => {
      const L = await import('leaflet');
      Lmod = L;

      const map = L.map(root, { center: [32.2226, -110.9747], zoom: 10 });
      mapRef.current = map;

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      setTimeout(() => map.invalidateSize(false), 0);

      ro = new ResizeObserver(() => map.invalidateSize(false));
      ro.observe(root);

      io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) requestAnimationFrame(() => map.invalidateSize(false));
      });
      io.observe(root);

      if (points?.length) {
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    })();

    return () => {
      try {
        ro?.disconnect();
        io?.disconnect();
        mapRef.current?.remove?.();
      } catch {}
    };
  }, [points]);

  return <div id="df-map" style={{ height: '100%', width: '100%', minHeight: 0, minWidth: 0 }} />;
}
