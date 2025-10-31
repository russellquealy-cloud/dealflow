'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Polygon, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

export type Point = { 
  id: string; 
  lat: number; 
  lng: number; 
  price?: number;
  title?: string;
  address?: string;
  featured?: boolean;
  featured_until?: string;
};

type Props = { 
  points: Point[]; 
  onBoundsChange?: (bounds: { south: number; north: number; west: number; east: number } | null) => void;
  onPolygonComplete?: (polygon: google.maps.Polygon) => void;
  center?: { lat: number; lng: number }; // External control of map center
  zoom?: number; // External control of zoom
};

const libraries: ("drawing" | "geometry" | "places" | "marker")[] = ["drawing", "geometry", "places", "marker"];

const mapContainerStyle = {
  width: '100%',
  height: '100%' // Use full height of container
};

const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795
};

const defaultOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
  fullscreenControl: true,
  gestureHandling: 'greedy' as const,
  mapTypeId: 'roadmap' as const,
  // Only add mapId if it's actually set
  ...(process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID && { 
    mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID 
  }),
};

export default function GoogleMapComponent({ points, onBoundsChange, onPolygonComplete, center: externalCenter, zoom: externalZoom }: Props) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Point | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const isProcessingBoundsRef = useRef<boolean>(false);
  const lastBoundsUpdateRef = useRef<number>(0);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    version: 'weekly',
    preventGoogleFontsLoading: true,
  });

  // Memoize center and zoom from localStorage, or use external center if provided
  const mapCenter = useMemo(() => {
    // If external center is provided, use it
    if (externalCenter && externalCenter.lat && externalCenter.lng) {
      return externalCenter;
    }
    
    if (typeof window === 'undefined') return defaultCenter;
    
    try {
      const savedCenter = localStorage.getItem('dealflow-google-map-center');
      if (savedCenter) {
        const center = JSON.parse(savedCenter);
        if (center.lat && center.lng) {
          return center;
        }
      }
    } catch (error) {
      console.warn('Failed to restore map center from localStorage:', error);
    }
    return defaultCenter;
  }, [externalCenter]);

  const mapZoom = useMemo(() => {
    if (externalZoom !== undefined) {
      return externalZoom;
    }
    if (typeof window === 'undefined') return 4;
    
    try {
      const savedZoom = localStorage.getItem('dealflow-google-map-zoom');
      if (savedZoom) {
        const zoom = parseInt(savedZoom);
        if (zoom >= 1 && zoom <= 18) {
          return zoom;
        }
      }
    } catch (error) {
      console.warn('Failed to restore map zoom from localStorage:', error);
    }
    return 4;
  }, [externalZoom]);

  // Pan map when external center changes (e.g., from geocoding)
  const isPanningRef = useRef(false);
  React.useEffect(() => {
    if (map && externalCenter && externalCenter.lat && externalCenter.lng) {
      // Temporarily disable bounds updates to prevent flickering during pan
      isPanningRef.current = true;
      map.panTo(new google.maps.LatLng(externalCenter.lat, externalCenter.lng));
      if (externalZoom !== undefined) {
        map.setZoom(externalZoom);
      }
      // Re-enable bounds updates after pan completes
      setTimeout(() => {
        isPanningRef.current = false;
      }, 2000);
    }
  }, [map, externalCenter, externalZoom]);

  // Memoize map options to prevent re-renders
  const mapOptions = useMemo(() => defaultOptions, []);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setIsMapReady(true);
    
    // Initialize marker clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    clustererRef.current = new MarkerClusterer({ map: mapInstance });

    // Set up bounds change listener with aggressive anti-flickering
    const emitBounds = () => {
      // Don't emit bounds if we're panning from an external source (like geocoding)
      if (isPanningRef.current) {
        return;
      }
      if (mapInstance && onBoundsChange && !isProcessingBoundsRef.current) {
        const now = Date.now();
        // Prevent bounds updates more frequent than every 3 seconds to eliminate flickering
        if (now - lastBoundsUpdateRef.current < 3000) {
          console.log('Bounds unchanged (within threshold), skipping update to prevent flicker');
          return;
        }
        
        isProcessingBoundsRef.current = true;
        lastBoundsUpdateRef.current = now;
        
        const bounds = mapInstance.getBounds();
        if (bounds) {
          const boundsObject = {
            south: bounds.getSouthWest().lat(),
            north: bounds.getNorthEast().lat(),
            west: bounds.getSouthWest().lng(),
            east: bounds.getNorthEast().lng()
          };
          console.log('Bounds changed significantly, applying spatial filter for bounds:', boundsObject);
          onBoundsChange(boundsObject);
        }
        // Reset the flag after a longer delay
        setTimeout(() => {
          isProcessingBoundsRef.current = false;
        }, 1000);
      } else if (isProcessingBoundsRef.current) {
        console.log('Already processing bounds, ignoring duplicate call');
      }
    };

    // Debounced bounds emission with very long delay to eliminate flickering
    let boundsTimeout: NodeJS.Timeout;
    const debouncedEmitBounds = () => {
      clearTimeout(boundsTimeout);
      boundsTimeout = setTimeout(emitBounds, 3000); // Increased to 3000ms to eliminate flickering
    };

    // Add event listeners - only use 'idle' to reduce flickering
    mapInstance.addListener('idle', debouncedEmitBounds);

    // Emit initial bounds
    setTimeout(emitBounds, 500);

    // Save map position on changes
    const savePosition = () => {
      const center = mapInstance.getCenter();
      const zoom = mapInstance.getZoom();
      if (center && zoom) {
        localStorage.setItem('dealflow-google-map-center', JSON.stringify({
          lat: center.lat(),
          lng: center.lng()
        }));
        localStorage.setItem('dealflow-google-map-zoom', zoom.toString());
      }
    };

    mapInstance.addListener('center_changed', savePosition);
    mapInstance.addListener('zoom_changed', savePosition);
  }, [onBoundsChange]);

  const onUnmount = useCallback(() => {
    // Cleanup
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }
    setMarkers([]);
    setPolygons([]);
  }, []);

  // Handle marker creation with clustering
  const createMarkers = useCallback((points: Point[]) => {
    if (!map || !clustererRef.current || !window.google?.maps || !isMapReady) {
      return;
    }

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    clustererRef.current.clearMarkers();

    const newMarkers: google.maps.Marker[] = [];

    points.forEach((point, index) => {
      // Check if listing is currently featured
      const isFeatured = point.featured && (!point.featured_until || new Date(point.featured_until) > new Date());
      
      const marker = new window.google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        title: point.title || `Property ${index + 1}`,
        // Remove animation to prevent triple drop effect
        // animation: window.google.maps.Animation.DROP,
        // Use regular markers instead of Advanced Markers
        optimized: true,
        // Use different icon for featured listings
        icon: isFeatured ? {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>
              <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">⭐</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        } : undefined
      });

      marker.addListener('click', () => {
        setSelectedMarker(point);
        // Navigate to listing page
        if (point.id) {
          window.location.href = `/listing/${point.id}`;
        }
      });

      newMarkers.push(marker);
    });

    // Add markers to clusterer
    clustererRef.current.addMarkers(newMarkers);
    setMarkers(newMarkers);
  }, [map, markers, isMapReady]);

  // Update markers when points change - use a ref to prevent unnecessary re-renders
  const pointsRef = useRef<Point[]>([]);
  
  React.useEffect(() => {
    // Only update if points actually changed and map is ready
    if (JSON.stringify(points) !== JSON.stringify(pointsRef.current) && isMapReady) {
      pointsRef.current = points;
      if (points && points.length > 0) {
        createMarkers(points);
      }
    }
  }, [points, createMarkers, isMapReady]);

  // Handle drawing completion
  const onDrawingComplete = useCallback((polygon: google.maps.Polygon) => {
    setPolygons(prev => [...prev, polygon]);
    setIsDrawing(false); // Stop drawing mode
    
    if (onPolygonComplete) {
      onPolygonComplete(polygon);
    }

    // Get bounds and emit
    if (onBoundsChange && window.google?.maps) {
      const bounds = new window.google.maps.LatLngBounds();
      const path = polygon.getPath();
      for (let i = 0; i < path.getLength(); i++) {
        bounds.extend(path.getAt(i));
      }
      
      const boundsObject = {
        south: bounds.getSouthWest().lat(),
        north: bounds.getNorthEast().lat(),
        west: bounds.getSouthWest().lng(),
        east: bounds.getNorthEast().lng()
      };
      
      onBoundsChange(boundsObject);
    }
  }, [onBoundsChange, onPolygonComplete]);

  // Toggle drawing mode
  const toggleDrawing = useCallback(() => {
    if (!map || !window.google?.maps) return;
    
    setIsDrawing(!isDrawing);
    
    if (!isDrawing) {
      // Start drawing mode
      const drawingManager = new window.google.maps.drawing.DrawingManager({
        drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
        drawingControl: false,
        polygonOptions: {
          fillColor: '#3b82f6',
          strokeColor: '#1d4ed8',
          fillOpacity: 0.3,
          strokeWeight: 3,
          clickable: true,
          editable: true,
          zIndex: 1,
        },
      });
      
      drawingManager.setMap(map);
      
      // Listen for polygon completion
      const listener = drawingManager.addListener('polygoncomplete', (polygon: google.maps.Polygon) => {
        onDrawingComplete(polygon);
        drawingManager.setDrawingMode(null);
        drawingManager.setMap(null);
      });
      
      // Store reference for cleanup
      (map as unknown as { drawingManager?: google.maps.drawing.DrawingManager; drawingListener?: google.maps.MapsEventListener }).drawingManager = drawingManager;
      (map as unknown as { drawingManager?: google.maps.drawing.DrawingManager; drawingListener?: google.maps.MapsEventListener }).drawingListener = listener;
    } else {
      // Stop drawing mode
      const mapWithDrawing = map as unknown as { drawingManager?: google.maps.drawing.DrawingManager; drawingListener?: google.maps.MapsEventListener };
      if (mapWithDrawing.drawingManager) {
        mapWithDrawing.drawingManager.setMap(null);
        if (mapWithDrawing.drawingListener) {
          window.google.maps.event.removeListener(mapWithDrawing.drawingListener);
        }
      }
      
      // Clear any existing polygons and reset bounds
      polygons.forEach(polygon => polygon.setMap(null));
      setPolygons([]);
      
      // Notify parent that bounds are cleared
      if (onBoundsChange) {
        onBoundsChange(null);
      }
    }
  }, [map, isDrawing, onDrawingComplete, onBoundsChange, polygons]);

  // Drawing manager options removed - using custom button instead

  if (loadError) {
    console.error('Google Maps load error:', loadError);
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '20px',
        textAlign: 'center',
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#495057', fontSize: '18px' }}>Map Unavailable</h3>
        <p style={{ margin: '0 0 16px 0', color: '#6c757d', fontSize: '14px' }}>
          Unable to load Google Maps. This may be due to:
        </p>
        <ul style={{ margin: '0 0 16px 0', padding: '0 0 0 20px', color: '#6c757d', fontSize: '12px', textAlign: 'left' }}>
          <li>Poor internet connection</li>
          <li>API key configuration</li>
          <li>Browser compatibility</li>
        </ul>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Retry Loading Map
        </button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={mapZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* Custom Draw Button */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={toggleDrawing}
            style={{
              backgroundColor: isDrawing ? '#dc2626' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '120px',
              justifyContent: 'center',
            }}
          >
            {isDrawing ? 'Stop Drawing' : 'Draw Area'}
          </button>
          
          {polygons.length > 0 && (
            <button
              onClick={() => {
                // Clear all polygons
                polygons.forEach(polygon => polygon.setMap(null));
                setPolygons([]);
                // Reset bounds to show all listings
                if (onBoundsChange) {
                  onBoundsChange(null);
                }
              }}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '100px',
                justifyContent: 'center',
              }}
            >
              Clear Area
            </button>
          )}
        </div>
        
        {polygons.map((polygon, index) => (
          <Polygon
            key={index}
            paths={polygon.getPath()}
            options={{
              fillColor: '#3b82f6',
              strokeColor: '#3b82f6',
              fillOpacity: 0.2,
              strokeWeight: 2,
              clickable: true,
              editable: true,
              zIndex: 1,
            }}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div style={{ padding: '10px', maxWidth: '200px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333' }}>
                {selectedMarker.title || 'Property'}
              </h3>
              {selectedMarker.price && (
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                  ${selectedMarker.price.toLocaleString()}
                </p>
              )}
              {selectedMarker.address && (
                <p style={{ margin: '0', fontSize: '12px', color: '#888' }}>
                  {selectedMarker.address}
                </p>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
