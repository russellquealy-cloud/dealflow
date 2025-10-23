// app/components/MapViewClient.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export type Point = { id: string; lat: number; lng: number; price?: number };
type Props = { 
  points: Point[]; 
  onBoundsChange?: (b: any) => void;
};

export default function MapViewClient({ points, onBoundsChange }: Props) {
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoomMessage, setZoomMessage] = useState<string | null>(null);

  console.log('🗺️ MapViewClient render - onBoundsChange:', !!onBoundsChange);

  const ensureHeight = (el: HTMLElement) => {
    el.style.minWidth = '0';
    el.style.minHeight = '0';
  };

  useEffect(() => {
    let Lmod: any;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let mapEventTimeout: NodeJS.Timeout | null = null;
    let isInitializing = false;

    const root = document.getElementById('df-map');
    if (!root) {
      console.log('🗺️ Map container not found');
      return;
    }
    
    containerRef.current = root;
    ensureHeight(root);

    (async () => {
      const leaflet = await import('leaflet');
      Lmod = leaflet.default ?? leaflet;

      // CRITICAL: Check if map already exists and is valid
      if (mapRef.current && !mapRef.current._container) {
        console.log('🗺️ Map exists but container is invalid, cleaning up');
        mapRef.current = null;
        isInitializedRef.current = false;
      }

      if (mapRef.current || isInitializing) {
        console.log('🗺️ Map already exists or initializing, skipping initialization');
        return;
      }

      isInitializing = true;

      // CRITICAL: Completely clean the container before initialization
      if ((root as any)._leaflet_id) {
        console.log('🗺️ Container has Leaflet ID, cleaning up');
        // Remove all Leaflet data
        delete (root as any)._leaflet_id;
        // Clear all child elements
        while (root.firstChild) {
          root.removeChild(root.firstChild);
        }
        // Force a small delay to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Try to restore last map position from localStorage or use search center
      let initialCenter = [39.8283, -98.5795]; // Default US center
      let initialZoom = 8; // More focused zoom level for better bounds filtering
      
      try {
        // Check for search center first
        const searchCenter = localStorage.getItem('dealflow-search-center');
        if (searchCenter) {
          const { lat, lng } = JSON.parse(searchCenter);
          if (typeof lat === 'number' && typeof lng === 'number' && 
              lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            initialCenter = [lat, lng];
            initialZoom = 10; // Zoom in for search results
            console.log('🗺️ Using search center:', initialCenter);
            // Clear search center after use
            localStorage.removeItem('dealflow-search-center');
          }
        } else {
          // Fall back to saved position
          const savedCenter = localStorage.getItem('dealflow-map-center');
          const savedZoom = localStorage.getItem('dealflow-map-zoom');
          
          if (savedCenter) {
            const [lat, lng] = JSON.parse(savedCenter);
            if (typeof lat === 'number' && typeof lng === 'number' && 
                lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
              initialCenter = [lat, lng];
              console.log('🗺️ Restored map center from localStorage:', initialCenter);
            }
          }
          
          if (savedZoom) {
            const zoom = parseInt(savedZoom);
            if (zoom >= 1 && zoom <= 18) {
              initialZoom = zoom;
              console.log('🗺️ Restored map zoom from localStorage:', initialZoom);
            }
          }
        }
      } catch (err) {
        console.log('⚠️ Could not restore map position:', err);
      }
      
      // Wait for container to have proper dimensions before initializing map
      const waitForContainerDimensions = () => {
        return new Promise<void>((resolve) => {
          const checkDimensions = () => {
            const rect = root.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              console.log('🗺️ Container has proper dimensions:', { width: rect.width, height: rect.height });
              resolve();
            } else {
              console.log('🗺️ Container dimensions not ready:', { width: rect.width, height: rect.height });
              setTimeout(checkDimensions, 50);
            }
          };
          checkDimensions();
        });
      };

      // Wait for container dimensions before initializing map
      await waitForContainerDimensions();

      // CRITICAL: Initialize map with proper maxZoom to prevent "Map has no maxZoom specified" error
      const map = Lmod.map(root, { 
        center: initialCenter, 
        zoom: initialZoom,
        maxZoom: 18, // CRITICAL: Add maxZoom to prevent error
        minZoom: 1,
        zoomControl: true,
        attributionControl: true
      });
      
      mapRef.current = map;
      isInitializedRef.current = true;
      
      console.log('🗺️ Map initialized with center:', initialCenter, 'zoom:', initialZoom);

      Lmod.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      // Add drawing tools with better error handling
      try {
        // Load leaflet-draw CSS first
        const drawCSS = document.createElement('link');
        drawCSS.rel = 'stylesheet';
        drawCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css';
        document.head.appendChild(drawCSS);
        
        const drawPlugin = await import('leaflet-draw');
        const LDraw = drawPlugin.default || drawPlugin;
        
        // Check if Control exists and is a constructor
        if (!LDraw.Control || typeof LDraw.Control !== 'function') {
          console.log('⚠️ Leaflet-draw Control not available, skipping drawing tools');
        } else {
          console.log('✅ Leaflet-draw Control available, adding drawing tools');
          
          // Create a feature group for drawn items
          const drawnItems = Lmod.featureGroup();
          map.addLayer(drawnItems);
          
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
                  color: '#3b82f6',
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.2
                }
              },
              polyline: false, // Disable polyline for simpler UX
              circle: {
                shapeOptions: {
                  color: '#10b981',
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.2
                }
              },
              rectangle: {
                shapeOptions: {
                  color: '#f59e0b',
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.2
                }
              },
              marker: false, // Disable marker for simpler UX
              circlemarker: false
            },
            edit: {
              featureGroup: drawnItems,
              remove: true
            }
          });
          
          map.addControl(drawControl);
          
          // Handle draw created event - filter properties within drawn shape
          map.on(Lmod.Draw.Event.CREATED, (e: any) => {
            const layer = e.layer;
            drawnItems.addLayer(layer);
            
            console.log('🎨 Shape drawn:', e.layerType);
            
            // Get bounds of the drawn shape
            const bounds = layer.getBounds();
            if (bounds && onBoundsChange) {
              const boundsObject = {
                south: bounds.getSouth(),
                north: bounds.getNorth(),
                west: bounds.getWest(),
                east: bounds.getEast()
              };
              console.log('🎨 Filtering by drawn shape bounds:', boundsObject);
              onBoundsChange(boundsObject);
            }
          });
          
          // Handle draw deleted event - reset to map bounds
          map.on(Lmod.Draw.Event.DELETED, () => {
            console.log('🎨 Shapes deleted, resetting to map bounds');
            if (drawnItems.getLayers().length === 0 && onBoundsChange) {
              // Reset to current map bounds
              const bounds = map.getBounds();
              const boundsObject = {
                south: bounds.getSouth(),
                north: bounds.getNorth(),
                west: bounds.getWest(),
                east: bounds.getEast()
              };
              onBoundsChange(boundsObject);
            }
          });
          
          // Handle draw edited event
          map.on(Lmod.Draw.Event.EDITED, (e: any) => {
            console.log('🎨 Shapes edited');
            // Get the first edited layer's bounds
            const layers = e.layers;
            layers.eachLayer((layer: any) => {
              if (layer.getBounds) {
                const bounds = layer.getBounds();
                if (bounds && onBoundsChange) {
                  const boundsObject = {
                    south: bounds.getSouth(),
                    north: bounds.getNorth(),
                    west: bounds.getWest(),
                    east: bounds.getEast()
                  };
                  console.log('🎨 Filtering by edited shape bounds:', boundsObject);
                  onBoundsChange(boundsObject);
                }
              }
            });
          });
          
          console.log('✅ Drawing tools added to map with filtering support');
        }
      } catch (err) {
        console.log('⚠️ Could not load drawing tools:', err);
      }

      // Set up observers after map initialization
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0 && mapRef.current) {
            console.log('🗺️ Container resized:', { width, height });
          mapRef.current.invalidateSize(false);
          }
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
          const bounds = mapRef.current.getBounds();
          const center = mapRef.current.getCenter();
          const zoom = mapRef.current.getZoom();
          
          // Convert Leaflet bounds to our expected format
          const boundsObject = {
            south: bounds.getSouth(),
            north: bounds.getNorth(),
            west: bounds.getWest(),
            east: bounds.getEast()
          };
          
          const boundsSize = Math.abs(boundsObject.north - boundsObject.south) + Math.abs(boundsObject.east - boundsObject.west);
          
          // Don't emit invalid bounds (happens when map hasn't fully initialized)
          if (boundsSize === 0 || isNaN(boundsSize)) {
            console.log('⚠️ Map bounds not ready yet (size:', boundsSize, '), skipping emission');
            return;
          }
          
          console.log('🗺️ Map bounds emitted:', bounds);
          console.log('🗺️ Map center:', center);
          console.log('🗺️ Map zoom:', zoom);
          console.log('🗺️ Converted bounds:', boundsObject, 'Size:', boundsSize);
          
          // Provide user feedback based on zoom level and bounds size
          if (zoom < 6) {
            setZoomMessage('🔍 Zoom in closer to see property listings');
          } else if (boundsSize > 10) {
            setZoomMessage('🔍 Zoom in to filter properties by area');
          } else if (boundsSize < 0.01) {
            setZoomMessage('🔍 Zoom out to see more properties');
          } else {
            setZoomMessage(null);
          }
          
          onBoundsChange(boundsObject);
        }
      };
      
      const saveMapPosition = () => {
        if (mapRef.current) {
          const center = mapRef.current.getCenter();
          const zoom = mapRef.current.getZoom();
          
          try {
            localStorage.setItem('dealflow-map-center', JSON.stringify([center.lat, center.lng]));
            localStorage.setItem('dealflow-map-zoom', zoom.toString());
            console.log('🗺️ Saved map position:', { center: [center.lat, center.lng], zoom });
          } catch (err) {
            console.log('⚠️ Could not save map position:', err);
          }
        }
      };
      
      // Debounce map events to prevent excessive firing
      
      const debouncedMapEvent = () => {
        if (mapEventTimeout) {
          clearTimeout(mapEventTimeout);
        }
        mapEventTimeout = setTimeout(() => {
          console.log('🗺️ Map event debounced and fired');
          emitBounds();
          saveMapPosition();
        }, 200); // Increased debounce to 200ms to reduce flickering
      };

      map.on('moveend', () => {
        console.log('🗺️ Map moveend event fired');
        debouncedMapEvent();
      });
      map.on('zoomend', () => {
        console.log('🗺️ Map zoomend event fired');
        debouncedMapEvent();
      });
      
      // Add viewreset event to handle when map view is reset
      map.on('viewreset', () => {
        console.log('🗺️ Map view reset');
        debouncedMapEvent();
      });
      map.on('zoomstart', () => {
        console.log('🗺️ Map zoom start');
      });
      map.on('zoomend', () => {
        console.log('🗺️ Map zoom end');
      });
      
      // Emit initial bounds after map is fully loaded and rendered
      map.whenReady(() => {
        console.log('🗺️ Map is ready');
        // Log container dimensions for debugging
        console.log('🗺️ Map container dimensions:', {
          width: root.offsetWidth,
          height: root.offsetHeight,
          clientWidth: root.clientWidth,
          clientHeight: root.clientHeight
        });
        
        // Give the map time to fully render and establish proper bounds
        setTimeout(() => {
          console.log('🗺️ Emitting initial bounds after map load');
          emitBounds();
        }, 500); // Increased delay to ensure map is fully stable
      });
    })();

    return () => {
      try {
        ro?.disconnect();
        io?.disconnect();
        if (mapEventTimeout) {
          clearTimeout(mapEventTimeout);
        }
        
        // CRITICAL: Proper cleanup to prevent "Map container is already initialized" error
        if (mapRef.current) {
          console.log('🗺️ Cleaning up map instance');
          
          // Remove all event listeners
          mapRef.current.off?.();
          
          // Remove all layers
          mapRef.current.eachLayer?.((layer: any) => {
            mapRef.current.removeLayer(layer);
          });
          
          // Remove the map
          mapRef.current.remove?.();
          
          mapRef.current = null;
          isInitializedRef.current = false;
        }
        
        // CRITICAL: Clean the container completely
        const root = document.getElementById('df-map');
        if (root) {
          // Remove all Leaflet data
          if ((root as any)._leaflet_id) {
            delete (root as any)._leaflet_id;
          }
          
          // Clear all child elements
          while (root.firstChild) {
            root.removeChild(root.firstChild);
          }
        }
        
        isInitializing = false;
      } catch (err) {
        console.log('⚠️ Error during map cleanup:', err);
      }
    };
  }, []); // Remove onBoundsChange dependency to prevent re-initialization

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
    
    console.log('🔍 All points data:', JSON.stringify(points, null, 2));
    
    // Validate points have valid coordinates
    const validPoints = points.filter(p => 
      typeof p.lat === 'number' && 
      typeof p.lng === 'number' && 
      !isNaN(p.lat) && 
      !isNaN(p.lng) &&
      p.lat >= -90 && p.lat <= 90 &&
      p.lng >= -180 && p.lng <= 180
    );
    
    if (validPoints.length === 0) {
      console.log('⚠️ No valid points to render markers for');
      return;
    }
    
    console.log('✅ Valid points for rendering:', validPoints.length);
    
    // Wait for map to be ready before rendering markers
    const waitForMap = async () => {
      let attempts = 0;
      const maxAttempts = 20; // Increased attempts to give map more time to initialize
      
      while (attempts < maxAttempts) {
      const map = mapRef.current;
        const isInitialized = isInitializedRef.current;
        
        console.log(`🔄 Checking map readiness (attempt ${attempts + 1}/${maxAttempts}):`, { 
          map: !!map, 
          initialized: isInitialized 
        });
        
        if (map && isInitialized) {
          console.log('✅ Map is ready, rendering markers for points:', points?.length || 0);
          
          // Add a small delay to ensure map is fully ready
          await new Promise(resolve => setTimeout(resolve, 300));
          
          try {
      const L = (await import('leaflet')).default;

            // Clear existing markers safely
      if (markersRef.current) {
              try {
                // Check if the marker group is still valid before clearing
                if (map.hasLayer(markersRef.current)) {
        markersRef.current.clearLayers?.();
        map.removeLayer(markersRef.current);
                }
              } catch (err) {
                console.log('Error clearing markers:', err);
              }
        markersRef.current = null;
      }

            console.log('🎯 Creating markers for', validPoints.length, 'points');
            
            // Try to load markercluster plugin for clustering
            let MarkerClusterGroup: any = null;
            let useCluster = false;
            
            try {
              // Load cluster CSS first
              if (!document.querySelector('link[href*="leaflet.markercluster"]')) {
                const clusterCSS = document.createElement('link');
                clusterCSS.rel = 'stylesheet';
                clusterCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.4.1/MarkerCluster.css';
                document.head.appendChild(clusterCSS);
                
                const clusterDefaultCSS = document.createElement('link');
                clusterDefaultCSS.rel = 'stylesheet';
                clusterDefaultCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.4.1/MarkerCluster.Default.css';
                document.head.appendChild(clusterDefaultCSS);
              }
              
              await import('leaflet.markercluster');
              // Check if we have access to L.markerClusterGroup
              if (L && (L as any).markerClusterGroup) {
                MarkerClusterGroup = (L as any).markerClusterGroup;
                useCluster = true;
                console.log('✅ MarkerCluster plugin loaded and available');
              } else {
                console.log('⚠️ MarkerCluster not available on L object');
              }
            } catch (err) {
              console.log('⚠️ Could not load markercluster plugin, using simple markers:', err);
            }
            
            // Create marker group (clustered or simple)
            const group = useCluster && MarkerClusterGroup ? MarkerClusterGroup({
              chunkedLoading: true,
              spiderfyOnMaxZoom: true,
              showCoverageOnHover: false,
              zoomToBoundsOnClick: true,
              maxClusterRadius: 60,
              iconCreateFunction: function(cluster: any) {
                const childCount = cluster.getChildCount();
                let sizeClass = 'marker-cluster-small';
                
                if (childCount > 10) {
                  sizeClass = 'marker-cluster-large';
                } else if (childCount > 5) {
                  sizeClass = 'marker-cluster-medium';
                }
                
                return L.divIcon({
                  html: `<div><span>${childCount}</span></div>`,
                  className: `marker-cluster ${sizeClass}`,
                  iconSize: L.point(40, 40)
                });
              }
            }) : L.layerGroup();
            
            console.log('📌 Using', useCluster ? 'clustered' : 'simple', 'marker group');
            
            for (const p of validPoints) {
              try {
                console.log('📍 Creating marker for point:', p);
                
                // Create a property marker with price display
                const priceText = p.price ? `$${p.price.toLocaleString()}` : '';
        const markerIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
                    background-color: #dc2626;
            width: 24px;
            height: 24px;
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
                    position: relative;
                  ">🏠</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

                const marker = L.marker([p.lat, p.lng], { icon: markerIcon });
                marker.addTo(group);
                marker.on('click', () => {
                  console.log('Marker clicked:', p.id);
                  router.push(`/listing/${p.id}`);
                });
                
                // Add tooltip with price
                if (priceText) {
                  marker.bindTooltip(priceText, {
                    permanent: false,
                    direction: 'top',
                    offset: [0, -10]
                  });
                }
                
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
            
            return; // Exit the function successfully
          } catch (err) {
            console.error('Error in marker rendering:', err);
            return;
          }
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before next attempt
      }
      
      console.log('❌ Map initialization timeout after', maxAttempts, 'attempts');
    };
    
    waitForMap();
  }, [points, router]);


  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
    <div
      id="df-map"
      style={{ height: '100%', width: '100%', minHeight: 0, minWidth: 0, borderRadius: 12, border: '1px solid #e5e7eb' }}
    />
      {zoomMessage && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          zIndex: 1000,
          maxWidth: '80%',
          textAlign: 'center'
        }}>
          {zoomMessage}
        </div>
      )}
    </div>
  );
}