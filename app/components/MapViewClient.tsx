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

      // Use a more neutral center (US center) instead of hardcoded Tucson
      const map = Lmod.map(root, { center: [39.8283, -98.5795], zoom: 4 });
      mapRef.current = map;
      isInitializedRef.current = true;

      Lmod.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      // Add drawing tools
      try {
        const drawPlugin = await import('leaflet-draw');
        const LDraw = drawPlugin.default || drawPlugin;
        
        // Initialize the draw control
        const drawControl = new LDraw.Control({
          position: 'topright',
          draw: {
            polygon: {
              allowIntersection: false,
              showArea: true,
              drawError: {
                color: '#e1e100',
                message: '<strong>Error:</strong> shape edges cannot cross!'
              },
              shapeOptions: {
                color: '#bada55'
              }
            },
            polyline: {
              shapeOptions: {
                color: '#f357a1',
                weight: 4
              }
            },
            circle: {
              shapeOptions: {
                color: '#662d91'
              }
            },
            rectangle: {
              shapeOptions: {
                color: '#bada55'
              }
            },
            marker: true,
            circlemarker: false
          },
          edit: {
            featureGroup: Lmod.layerGroup(),
            remove: true
          }
        });
        
        map.addControl(drawControl);
        console.log('✅ Drawing tools added to map');
      } catch (err) {
        console.log('⚠️ Could not load drawing tools:', err);
      }

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

  // Render markers - ENHANCED: Better error handling and marker management
  useEffect(() => {
    console.log('=== MAP MARKER RENDERING EFFECT TRIGGERED ===');
    console.log('Points received:', points);
    console.log('Points length:', points?.length || 0);
    console.log('Map ref:', !!mapRef.current);
    console.log('Initialized:', isInitializedRef.current);
    
    if (!points || points.length === 0) {
      console.log('⚠️ No points to render markers for');
      return;
    }
    
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
      await new Promise(resolve => setTimeout(resolve, 200));
      
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

        console.log('🎯 Creating markers for', points.length, 'points');
        const group = L.layerGroup();
        
        for (const p of points) {
          try {
            console.log('📍 Creating marker for point:', p);
            
            // Create a simple red circle marker
            const markerIcon = L.divIcon({
              className: 'custom-marker',
              html: `<div style="
                background-color: #dc2626;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 8px;
                font-weight: bold;
                cursor: pointer;
              ">🏠</div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            
            const marker = L.marker([p.lat, p.lng], { icon: markerIcon });
            marker.addTo(group);
            marker.on('click', () => {
              console.log('Marker clicked:', p.id);
              router.push(`/listing/${p.id}`);
            });
            
            console.log('✅ Marker created successfully for:', p.id, 'at', p.lat, p.lng);
          } catch (err) {
            console.error('❌ Error creating marker for point:', p, err);
            // Fallback to default marker
            try {
              const fallbackMarker = L.marker([p.lat, p.lng]);
              fallbackMarker.addTo(group);
              fallbackMarker.on('click', () => {
                console.log('Fallback marker clicked:', p.id);
                router.push(`/listing/${p.id}`);
              });
              console.log('✅ Fallback marker created for:', p.id);
            } catch (fallbackErr) {
              console.error('❌ Fallback marker also failed:', fallbackErr);
            }
          }
        }
        
        group.addTo(map);
        markersRef.current = group;
        console.log('🎉 All markers added to map successfully');
        
        // Don't auto-fit bounds to prevent snapping
        console.log('Markers added, no auto-fitting to prevent snapping');
        
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

  // DISABLED: Center changes to prevent snapping
  useEffect(() => {
    // COMPLETELY DISABLED: This was causing map snapping
    console.log('Center change requested (DISABLED):', center);
    return;
  }, [center]);

  return (
    <div
      id="df-map"
      style={{ height: '100%', width: '100%', minHeight: 0, minWidth: 0, borderRadius: 12, border: '1px solid #e5e7eb' }}
    />
  );
}