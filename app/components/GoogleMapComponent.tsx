'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager, Polygon, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

export type Point = { 
  id: string; 
  lat: number; 
  lng: number; 
  price?: number;
  title?: string;
  address?: string;
};

type Props = { 
  points: Point[]; 
  onBoundsChange?: (bounds: { south: number; north: number; west: number; east: number }) => void;
  onPolygonComplete?: (polygon: google.maps.Polygon) => void;
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

export default function GoogleMapComponent({ points, onBoundsChange, onPolygonComplete }: Props) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Point | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [polygons, setPolygons] = useState<google.maps.Polygon[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const clustererRef = useRef<MarkerClusterer | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    version: 'weekly',
  });

  // Memoize center and zoom from localStorage
  const mapCenter = useMemo(() => {
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
  }, []);

  const mapZoom = useMemo(() => {
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
  }, []);

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

    // Set up bounds change listener
    const emitBounds = () => {
      if (mapInstance && onBoundsChange) {
        const bounds = mapInstance.getBounds();
        if (bounds) {
          const boundsObject = {
            south: bounds.getSouthWest().lat(),
            north: bounds.getNorthEast().lat(),
            west: bounds.getSouthWest().lng(),
            east: bounds.getNorthEast().lng()
          };
          onBoundsChange(boundsObject);
        }
      }
    };

    // Debounced bounds emission
    let boundsTimeout: NodeJS.Timeout;
    const debouncedEmitBounds = () => {
      clearTimeout(boundsTimeout);
      boundsTimeout = setTimeout(emitBounds, 200);
    };

    // Add event listeners
    mapInstance.addListener('idle', debouncedEmitBounds);
    mapInstance.addListener('zoom_changed', debouncedEmitBounds);
    mapInstance.addListener('center_changed', debouncedEmitBounds);

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
      const marker = new window.google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        title: point.title || `Property ${index + 1}`,
        animation: window.google.maps.Animation.DROP,
        // Use regular markers instead of Advanced Markers
        optimized: true,
      });

      marker.addListener('click', () => {
        setSelectedMarker(point);
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

  const drawingManagerOptions = useMemo(() => {
    if (!isLoaded || !window.google?.maps) {
      return null;
    }
    
    return {
      drawingMode: null,
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          window.google.maps.drawing.OverlayType.POLYGON,
          window.google.maps.drawing.OverlayType.CIRCLE,
          window.google.maps.drawing.OverlayType.RECTANGLE
        ],
      },
      polygonOptions: {
        fillColor: '#3b82f6',
        strokeColor: '#1d4ed8',
        fillOpacity: 0.3,
        strokeWeight: 3,
        clickable: true,
        editable: true,
        zIndex: 1,
      },
      circleOptions: {
        fillColor: '#10b981',
        strokeColor: '#059669',
        fillOpacity: 0.3,
        strokeWeight: 3,
        clickable: true,
        editable: true,
        zIndex: 1,
      },
      rectangleOptions: {
        fillColor: '#f59e0b',
        strokeColor: '#d97706',
        fillOpacity: 0.3,
        strokeWeight: 3,
        clickable: true,
        editable: true,
        zIndex: 1,
      },
    };
  }, [isLoaded]);

  if (loadError) {
    console.error('Google Maps load error:', loadError);
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50">
        <div className="text-center p-4">
          <div className="text-red-600 text-xl mb-2">⚠️</div>
          <h3 className="text-red-800 font-semibold mb-2">Google Maps Error</h3>
          <p className="text-red-600 text-sm mb-2">Failed to load Google Maps API</p>
          <p className="text-red-500 text-xs">Error: {loadError.message}</p>
          <p className="text-gray-600 text-xs mt-2">
            Check your API key and ensure it&apos;s properly configured.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
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
        {drawingManagerOptions && (
          <DrawingManager
            options={drawingManagerOptions}
            onOverlayComplete={(event) => {
              if (event.type === window.google.maps.drawing.OverlayType.POLYGON) {
                onDrawingComplete(event.overlay as google.maps.Polygon);
              } else if (event.type === window.google.maps.drawing.OverlayType.CIRCLE) {
                const circle = event.overlay as google.maps.Circle;
                
                if (onBoundsChange && window.google?.maps) {
                  const bounds = circle.getBounds();
                  if (bounds) {
                    const boundsObject = {
                      south: bounds.getSouthWest().lat(),
                      north: bounds.getNorthEast().lat(),
                      west: bounds.getSouthWest().lng(),
                      east: bounds.getNorthEast().lng()
                    };
                    onBoundsChange(boundsObject);
                  }
                }
              } else if (event.type === window.google.maps.drawing.OverlayType.RECTANGLE) {
                const rectangle = event.overlay as google.maps.Rectangle;
                
                if (onBoundsChange && window.google?.maps) {
                  const bounds = rectangle.getBounds();
                  if (bounds) {
                    const boundsObject = {
                      south: bounds.getSouthWest().lat(),
                      north: bounds.getNorthEast().lat(),
                      west: bounds.getSouthWest().lng(),
                      east: bounds.getNorthEast().lng()
                    };
                    onBoundsChange(boundsObject);
                  }
                }
              }
            }}
          />
        )}
        
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
