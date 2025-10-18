// app/components/MapViewClient.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export type Point = { id: string; lat: number; lng: number; price?: number };
type Props = { points: Point[]; onBoundsChange?: (b: any) => void };

export default function MapViewClient({ points, onBoundsChange }: Props) {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const didFitRef = useRef(false);

  const ensureHeight = (el: HTMLElement) => {
    el.style.minWidth = '0';
    el.style.minHeight = '0';
  };

  useEffect(() => {
    let Lmod: any;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;

    const root = document.getElementById('df-map');
    if (!root) return;
    ensureHeight(root);

    (async () => {
      const leaflet = await import('leaflet');
      Lmod = leaflet.default ?? leaflet;

      if (mapRef.current) return;

      const map = Lmod.map(root, { center: [32.2226, -110.9747], zoom: 10 });
      mapRef.current = map;

      Lmod.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      setTimeout(() => map.invalidateSize(false), 0);

      ro = new ResizeObserver(() => map.invalidateSize(false));
      ro.observe(root);
      io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) requestAnimationFrame(() => map.invalidateSize(false));
      });
      io.observe(root);

      const emitBounds = () => {
        if (onBoundsChange) onBoundsChange(map.getBounds());
      };
      map.on('moveend', emitBounds);
      map.on('zoomend', emitBounds);
    })();

    return () => {
      try {
        ro?.disconnect();
        io?.disconnect();
        mapRef.current?.off?.();
        mapRef.current?.remove?.();
        mapRef.current = null;
      } catch {}
    };
  }, [onBoundsChange]);

  useEffect(() => {
    (async () => {
      const map = mapRef.current;
      if (!map) return;
      const L = (await import('leaflet')).default;

      if (markersRef.current) {
        markersRef.current.clearLayers?.();
        map.removeLayer(markersRef.current);
        markersRef.current = null;
      }

      const group = L.layerGroup();
      for (const p of points ?? []) {
        const m = L.marker([p.lat, p.lng]).addTo(group);
        m.on('click', () => router.push(`/listing/${p.id}`));
      }
      group.addTo(map);
      markersRef.current = group;

      if (points && points.length && !didFitRef.current) {
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [20, 20] });
        didFitRef.current = true;
      }
      requestAnimationFrame(() => map.invalidateSize(false));
    })();
  }, [points, router]);

  return (
    <div
      id="df-map"
      style={{ height: '100%', width: '100%', minHeight: 0, minWidth: 0, borderRadius: 12, border: '1px solid #e5e7eb' }}
    />
  );
}
