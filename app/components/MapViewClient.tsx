// app/components/MapViewClient.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export type Point = { id: string; lat: number; lng: number; price?: number };
type Props = { points: Point[]; onBoundsChange?: (b: any) => void };

export default function MapViewClient({ points, onBoundsChange }: Props) {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const drawnRef = useRef<any>(null);
  const didFitRef = useRef(false);
  const lastBoundsRef = useRef<string>('');
  const lastIdsRef = useRef<string>('');
  const router = useRouter();

  const rafInvalidate = () =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => mapRef.current?.invalidateSize(false))
    );

  useEffect(() => {
    let Lmod: any;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
	// after: const map = Lmod!.map(containerRef.current!, { ... });
map.whenReady(() => setTimeout(() => map.invalidateSize(), 0));
// also helps on route transitions
requestAnimationFrame(() => map.invalidateSize());


    const el = document.getElementById('df-map') as any;
    if (!el) return;

    const ensureHeight = () => {
      const h = el.getBoundingClientRect().height;
      if (!h || h < 120) el.style.minHeight = '480px';
    };
    ensureHeight();

    const onResize = () => rafInvalidate();
    const onPageShow = () => rafInvalidate();
    const onVisibility = () => { if (document.visibilityState === 'visible') rafInvalidate(); };
    const onPopState = () => setTimeout(rafInvalidate, 0);

    async function boot() {
      if (mapRef.current) { rafInvalidate(); return; }

      const leaflet = await import('leaflet');
	await import('leaflet-draw'); // CSS now comes from globals.css
	Lmod = leaflet.default;

      const [marker2x, marker, shadow] = await Promise.all([
        import('leaflet/dist/images/marker-icon-2x.png'),
        import('leaflet/dist/images/marker-icon.png'),
        import('leaflet/dist/images/marker-shadow.png'),
      ]);
      Lmod.Icon.Default.mergeOptions({
        iconRetinaUrl: (marker2x as any).default ?? (marker2x as any).src,
        iconUrl: (marker as any).default ?? (marker as any).src,
        shadowUrl: (shadow as any).default ?? (shadow as any).src,
      });

      if ((el as any)._leaflet_id) { try { mapRef.current?.remove(); } catch {} (el as any)._leaflet_id = undefined; el.innerHTML = ''; }

      const map = Lmod.map(el, { zoomControl: false });
      mapRef.current = map;
      Lmod.control.zoom({ position: 'topleft' }).addTo(map);

      const FORCE_OSM = (process.env.NEXT_PUBLIC_FORCE_OSM ?? '1') === '1';
      const mtKey = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim();
      const canUseMapTiler = !!mtKey && !FORCE_OSM;

      const addOSM = () => {
        Lmod.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors', minZoom: 3, maxZoom: 19, crossOrigin: true,
        }).addTo(map);
        rafInvalidate();
      };

      if (canUseMapTiler) {
        const mtUrl = `https://api.maptiler.com/maps/streets-v2/512/{z}/{x}/{y}.png?key=${mtKey}`;
        const mt = Lmod.tileLayer(mtUrl, {
          attribution: '© MapTiler © OpenStreetMap contributors',
          tileSize: 512, zoomOffset: -1, minZoom: 3, maxZoom: 19, crossOrigin: true,
        }).addTo(map);

        let loaded = 0;
        const onLoad = () => { loaded += 1; if (loaded === 1) { mt.off('tileload', onLoad); mt.off('tileerror', onError); } rafInvalidate(); };
        const onError = () => { if (loaded === 0) { mt.off('tileload', onLoad); mt.off('tileerror', onError); if (map.hasLayer(mt)) map.removeLayer(mt); addOSM(); } };
        mt.on('tileload', onLoad); mt.on('tileerror', onError);
        setTimeout(() => { if (loaded === 0 && map.hasLayer(mt)) { mt.off('tileload', onLoad); mt.off('tileerror', onError); map.removeLayer(mt); addOSM(); } }, 1200);
      } else addOSM();

      map.whenReady(() => {
        ensureHeight();
        rafInvalidate();
        setTimeout(rafInvalidate, 50);
        setTimeout(rafInvalidate, 200);
        setTimeout(rafInvalidate, 600);
      });

      if ('ResizeObserver' in window) { ro = new ResizeObserver(() => { ensureHeight(); rafInvalidate(); }); ro.observe(el); }
      if ('IntersectionObserver' in window) {
        io = new IntersectionObserver((entries) => { if (entries.some(e => e.isIntersecting)) { ensureHeight(); rafInvalidate(); } });
        io.observe(el);
      }
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', onResize);
      window.addEventListener('pageshow', onPageShow);
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('popstate', onPopState);

      markersRef.current = Lmod.layerGroup().addTo(map);
      drawnRef.current = Lmod.featureGroup().addTo(map);

      const drawControl = new (Lmod as any).Control.Draw({
        position: 'topright',
        draw: { polygon: true, rectangle: true, circle: true, marker: false, polyline: false, circlemarker: false },
        edit: { featureGroup: drawnRef.current },
      });
      map.addControl(drawControl);

      const emitBounds = (b: any) => {
        const s = b.toBBoxString(); if (s === lastBoundsRef.current) return;
        lastBoundsRef.current = s; onBoundsChange?.(b);
      };
      map.on((Lmod as any).Draw.Event.CREATED, (e: any) => { drawnRef.current!.clearLayers(); drawnRef.current!.addLayer(e.layer); const b = e.layer?.getBounds?.(); if (b) emitBounds(b); });
      map.on((Lmod as any).Draw.Event.EDITED, (e: any) => { const layers = e.layers?.getLayers?.() ?? []; if (layers.length) { const b = layers[0]?.getBounds?.(); if (b) emitBounds(b); } });
      map.on((Lmod as any).Draw.Event.DELETED, () => { drawnRef.current!.clearLayers(); emitBounds(map.getBounds()); });
      map.on('moveend', () => emitBounds(map.getBounds()));
    }

    boot();

    return () => {
      ro?.disconnect();
      io?.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('popstate', onPopState);
      if (mapRef.current) { try { mapRef.current.remove(); } catch {} mapRef.current = null; }
      if ((el as any)?._leaflet_id) (el as any)._leaflet_id = undefined;
    };
  }, [onBoundsChange]);

  // Marker layer + initial fit
  useEffect(() => {
    (async () => {
      const map = mapRef.current, layer = markersRef.current; if (!map || !layer) return;
      const L = (await import('leaflet')).default;

      const ids = points.map(p => p.id).join(','); if (ids === lastIdsRef.current) return;
      lastIdsRef.current = ids;

      layer.clearLayers();
      points.forEach(pt => {
        const m = L.marker([pt.lat, pt.lng], { title: pt.id });
        m.on('click', () => router.push(`/listing/${pt.id}`));
        m.addTo(layer);
      });

      if (points.length && !didFitRef.current && drawnRef.current && drawnRef.current.getLayers().length === 0) {
        didFitRef.current = true;
        const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number]));
        map.fitBounds(bounds.pad(0.2));
        const b = map.getBounds(); lastBoundsRef.current = b.toBBoxString(); onBoundsChange?.(b);
      }

      setTimeout(rafInvalidate, 0);
      setTimeout(rafInvalidate, 150);
    })();
  }, [points, router, onBoundsChange]);

  // Final tiny nudge (this hook belongs INSIDE the component)
  useEffect(() => {
    const nudge = () => setTimeout(() => mapRef.current?.invalidateSize(false), 0);
    window.addEventListener('pageshow', nudge);
    document.addEventListener('visibilitychange', nudge);
    return () => {
      window.removeEventListener('pageshow', nudge);
      document.removeEventListener('visibilitychange', nudge);
    };
  }, []);

  return <div id="df-map" className="h-[calc(100vh-var(--df-offset))] rounded-xl border overflow-hidden" />;
}
