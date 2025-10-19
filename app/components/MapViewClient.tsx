// app/components/MapViewClient.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export type Point = { id: string; lat: number; lng: number; price?: number };
type Props = { 
  points: Point[]; 
  onBoundsChange?: (b: any) => void;
  center?: { lat: number; lng: number };
};

export default function MapViewClient({ points, onBoundsChange, center }: Props) {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const didFitRef = useRef(false);
  const lastCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const isInitializedRef = useRef(false);

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
      isInitializedRef.current = true;

      Lmod.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize(false);
        }
      }, 0);

      ro = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize(false);
        }
      });
      ro.observe(root);
      
      io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          requestAnimationFrame(() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize(false);
            }
          });
        }
      });
      io.observe(root);

      const emitBounds = () => {
        if (onBoundsChange && mapRef.current) {
          onBoundsChange(mapRef.current.getBounds());
        }
      };
      map.on('moveend', emitBounds);
      map.on('zoomend', emitBounds);
    })();

    return () => {
      try {
        ro?.disconnect();
        io?.disconnect();
        if (mapRef.current) {
          mapRef.current.off?.();
          mapRef.current.remove?.();
          mapRef.current = null;
          isInitializedRef.current = false;
        }
      } catch {}
    };
  }, [onBoundsChange]);

  // Render markers - FIXED: Better error handling and marker management
  useEffect(() => {
    console.log('=== MAP MARKER RENDERING EFFECT TRIGGERED ===');
    console.log('Points received:', points);
    console.log('Points length:', points?.length || 0);
    console.log('Map ref:', !!mapRef.current);
    console.log('Initialized:', isInitializedRef.current);
    
    (async () => {
      console.log('=== MAP MARKER RENDERING ===');
      console.log('Points received:', points);
      console.log('Points length:', points?.length || 0);
      
      const map = mapRef.current;
      if (!map || !isInitializedRef.current) {
        console.log('❌ Map not ready for markers:', { map: !!map, initialized: isInitializedRef.current });
        return;
      }
      
      console.log('✅ Map is ready, rendering markers for points:', points?.length || 0);
      
      // Add a small delay to ensure map is fully ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const L = (await import('leaflet')).default;

        // Clear existing markers safely
        if (markersRef.current) {
          try {
            markersRef.current.clearLayers?.();
            map.removeLayer(markersRef.current);
          } catch (err) {
            console.log('Error clearing markers:', err);
          }
          markersRef.current = null;
        }

        // Add new markers only if we have points
        if (points && points.length > 0) {
          console.log('🎯 Creating markers for', points.length, 'points');
          const group = L.layerGroup();
          
          for (const p of points) {
            try {
              console.log('📍 Creating marker for point:', p);
              
              // Use a simple default marker first to ensure it works
              const marker = L.marker([p.lat, p.lng]);
              marker.addTo(group);
              marker.on('click', () => {
                console.log('Marker clicked:', p.id);
                router.push(`/listing/${p.id}`);
              });
              
              console.log('✅ Marker created successfully for:', p.id, 'at', p.lat, p.lng);
            } catch (err) {
              console.error('❌ Error creating marker for point:', p, err);
            }
          }
          
          group.addTo(map);
          markersRef.current = group;
          console.log('🎉 All markers added to map successfully');
          
          // Only fit bounds once on initial load
          if (!didFitRef.current && points.length > 0) {
            try {
              const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
              map.fitBounds(bounds, { padding: [20, 20] });
              didFitRef.current = true;
              console.log('Map bounds fitted to markers');
            } catch (err) {
              console.log('Error fitting bounds:', err);
            }
          }
        } else {
          console.log('⚠️ No points to render markers for');
        }
        
        requestAnimationFrame(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize(false);
          }
        });
      } catch (err) {
        console.error('Error in marker rendering:', err);
      }
    })();
  }, [points, router]);

  // Handle center changes (when user searches) - FIXED: Prevent snapping
  useEffect(() => {
    if (mapRef.current && center && isInitializedRef.current) {
      // Only update if center actually changed to prevent snapping
      const currentCenter = lastCenterRef.current;
      if (!currentCenter || 
          Math.abs(currentCenter.lat - center.lat) > 0.001 || 
          Math.abs(currentCenter.lng - center.lng) > 0.001) {
        try {
          mapRef.current.setView([center.lat, center.lng], 12);
          lastCenterRef.current = center;
        } catch (err) {
          console.log('Error setting map view:', err);
        }
      }
    }
  }, [center]);

  return (
    <div
      id="df-map"
      style={{ height: '100%', width: '100%', minHeight: 0, minWidth: 0, borderRadius: 12, border: '1px solid #e5e7eb' }}
    />
  );
}