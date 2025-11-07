'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Polygon, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { logger } from '@/lib/logger';

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
  // Store markers in refs to prevent re-renders (per guardrails)
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const isProcessingBoundsRef = useRef<boolean>(false);
  const lastBoundsUpdateRef = useRef<number>(0);
  const boundsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const isUpdatingMarkersRef = useRef(false);

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
      logger.warn('Failed to restore map center from localStorage:', error);
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
      logger.warn('Failed to restore map zoom from localStorage:', error);
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
    // CRITICAL: Only emit bounds on 'idle' event, not on every drag/zoom
    // This prevents flickering when drawing polygons or changing filters
    const emitBounds = () => {
      // Don't emit bounds if we're panning from an external source (like geocoding)
      if (isPanningRef.current) {
        return;
      }
      // Don't emit if already processing
      if (isProcessingBoundsRef.current) {
        return;
      }
      
      if (mapInstance && onBoundsChange) {
        const now = Date.now();
        // Prevent bounds updates more frequent than every 1000ms to eliminate flickering
        if (now - lastBoundsUpdateRef.current < 1000) {
          return; // Skip duplicate bounds updates
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
          logger.log('Bounds changed, applying spatial filter:', boundsObject);
          onBoundsChange(boundsObject);
        }
        // Reset the flag after delay
        setTimeout(() => {
          isProcessingBoundsRef.current = false;
        }, 1500);
      }
    };

    // Debounced bounds emission with 1000ms delay to prevent flickering
    const debouncedEmitBounds = () => {
      if (boundsTimeoutRef.current) {
        clearTimeout(boundsTimeoutRef.current);
      }
      boundsTimeoutRef.current = setTimeout(emitBounds, 1000); // 1s debounce to prevent flickering
    };

    // CRITICAL: Only listen to 'idle' event, not 'bounds_changed' or 'center_changed'
    // 'idle' fires only when map stops moving, preventing flickering
    mapInstance.addListener('idle', debouncedEmitBounds);

    // Emit initial bounds after map is fully loaded
    setTimeout(emitBounds, 1000);

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
    if (boundsTimeoutRef.current) {
      clearTimeout(boundsTimeoutRef.current);
    }
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setMap(null);
    }
    markersRef.current.forEach(marker => marker.setMap(null));
    polygonsRef.current.forEach(polygon => polygon.setMap(null));
    markersRef.current = [];
    polygonsRef.current = [];
  }, []);

  // Memoize marker creation - store in refs, not state (per guardrails)
  const createMarkers = useCallback((points: Point[]) => {
    if (!map || !clustererRef.current || !window.google?.maps || !isMapReady) {
      return;
    }

    // Clear existing markers from refs
    markersRef.current.forEach(marker => marker.setMap(null));
    clustererRef.current.clearMarkers();

    const newMarkers: google.maps.Marker[] = [];

    points.forEach((point) => {
      // Check if listing is currently featured
      const isFeatured = point.featured && (!point.featured_until || new Date(point.featured_until) > new Date());
      
      const marker = new window.google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        title: point.title || point.address || 'Property',
        optimized: true, // Use optimized markers for performance
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
        if (point.id) {
          window.location.href = `/listing/${point.id}`;
        }
      });

      newMarkers.push(marker);
    });

    // Store in refs, not state (prevents re-renders)
    markersRef.current = newMarkers;
    clustererRef.current.addMarkers(newMarkers);
  }, [map, isMapReady]);

  // Memoize points IDs array to prevent unnecessary re-renders
  const pointsIdsArray = useMemo(() => points.map(p => p.id).sort(), [points]);
  const pointsIdsString = useMemo(() => pointsIdsArray.join(','), [pointsIdsArray]);
  const pointsRef = useRef<string>('');
  
  React.useEffect(() => {
    // CRITICAL: Prevent marker updates during bounds changes to eliminate flickering
    if (isProcessingBoundsRef.current || isUpdatingMarkersRef.current) {
      return;
    }
    
    // Only update if points actually changed (by ID comparison) and map is ready
    if (pointsIdsString !== pointsRef.current && isMapReady && map) {
      isUpdatingMarkersRef.current = true;
      pointsRef.current = pointsIdsString;
      
      // Use requestAnimationFrame to batch marker updates and prevent flickering
      requestAnimationFrame(() => {
        if (points && points.length > 0) {
          createMarkers(points);
        } else if (points.length === 0) {
          // Clear markers if no points
          markersRef.current.forEach(marker => marker.setMap(null));
          if (clustererRef.current) {
            clustererRef.current.clearMarkers();
          }
          markersRef.current = [];
        }
        isUpdatingMarkersRef.current = false;
      });
    }
  }, [pointsIdsString, points, createMarkers, isMapReady, map]);

  // Handle drawing completion - store in refs, not state (per guardrails)
  const onDrawingComplete = useCallback((polygon: google.maps.Polygon) => {
    // Store polygon in ref, not state
    polygonsRef.current = [...polygonsRef.current, polygon];
    setIsDrawing(false);
    
    // Convert polygon to GeoJSON for saving
    const path = polygon.getPath();
    const coordinates: number[][] = [];
    for (let i = 0; i < path.getLength(); i++) {
      const latLng = path.getAt(i);
      coordinates.push([latLng.lng(), latLng.lat()]); // GeoJSON: [lng, lat]
    }
    // Close the polygon
    if (coordinates.length > 0) {
      coordinates.push(coordinates[0]);
    }

    const geojson = {
      type: 'Polygon',
      coordinates: [coordinates],
    };

    // Call onPolygonComplete with both polygon and GeoJSON
    if (onPolygonComplete) {
      onPolygonComplete(polygon);
    }

    // Get bounds and emit (for immediate filtering)
    if (onBoundsChange && window.google?.maps) {
      const bounds = new window.google.maps.LatLngBounds();
      for (let i = 0; i < path.getLength(); i++) {
        bounds.extend(path.getAt(i));
      }
      
      const boundsObject = {
        south: bounds.getSouthWest().lat(),
        north: bounds.getNorthEast().lat(),
        west: bounds.getSouthWest().lng(),
        east: bounds.getNorthEast().lng(),
        polygon: geojson, // Include GeoJSON in bounds object
      };
      
      onBoundsChange(boundsObject);
    }
  }, [onBoundsChange, onPolygonComplete]);

  // Toggle drawing mode - use refs for drawing manager
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
      drawingManagerRef.current = drawingManager;
      
      // Listen for polygon completion
      const listener = drawingManager.addListener('polygoncomplete', (polygon: google.maps.Polygon) => {
        onDrawingComplete(polygon);
        drawingManager.setDrawingMode(null);
        drawingManager.setMap(null);
        drawingManagerRef.current = null;
      });
    } else {
      // Stop drawing mode
      if (drawingManagerRef.current) {
        drawingManagerRef.current.setMap(null);
        drawingManagerRef.current = null;
      }
      
      // Clear polygons from refs
      polygonsRef.current.forEach(polygon => polygon.setMap(null));
      polygonsRef.current = [];
      
      // Notify parent that bounds are cleared
      if (onBoundsChange) {
        onBoundsChange(null);
      }
    }
  }, [map, isDrawing, onDrawingComplete, onBoundsChange]);

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
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 8px'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      minWidth: 0, // Prevent layout thrash (per guardrails)
    }}>
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
          
          {polygonsRef.current.length > 0 && (
            <button
              onClick={() => {
                // Clear all polygons from refs
                polygonsRef.current.forEach(polygon => polygon.setMap(null));
                polygonsRef.current = [];
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
        
        {/* Render polygons from refs */}
        {polygonsRef.current.map((polygon, index) => (
          <Polygon
            key={`polygon-${index}`}
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
