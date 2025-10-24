'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type Point = { id: string; lat: number; lng: number; price?: number };
type Props = { 
  points: Point[]; 
  onBoundsChange?: (bounds: { south: number; north: number; west: number; east: number }) => void;
};

export default function GoogleMapViewClient({ points, onBoundsChange }: Props) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const isInitializedRef = useRef(false);
  const [zoomMessage, setZoomMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('🗺️ GoogleMapViewClient render - onBoundsChange:', !!onBoundsChange);

  // Memoize onBoundsChange to prevent unnecessary re-renders
  const stableOnBoundsChange = useCallback((bounds: { south: number; north: number; west: number; east: number }) => {
    if (onBoundsChange) {
      onBoundsChange(bounds);
    }
  }, [onBoundsChange]);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (typeof window === 'undefined' || window.google?.maps) {
        setIsLoading(false);
        return;
      }

      try {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=drawing,geometry`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('🗺️ Google Maps API loaded successfully');
          setIsLoading(false);
        };
        
        script.onerror = () => {
          console.error('❌ Failed to load Google Maps API');
          setIsLoading(false);
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('❌ Error loading Google Maps API:', error);
        setIsLoading(false);
      }
    };

    loadGoogleMaps();
  }, []);

  // Initialize Google Map
  useEffect(() => {
    if (isLoading || !mapRef.current || !window.google?.maps || isInitializedRef.current) {
      return;
    }

    console.log('🗺️ Initializing Google Map');

    // Set initial center and zoom
    let initialCenter = { lat: 39.8283, lng: -98.5795 }; // Default US center
    let initialZoom = 8;

    // Try to restore last map position from localStorage
    try {
      const savedCenter = localStorage.getItem('dealflow-map-center');
      const savedZoom = localStorage.getItem('dealflow-map-zoom');

      if (savedCenter) {
        const [lat, lng] = JSON.parse(savedCenter);
        if (typeof lat === 'number' && typeof lng === 'number' &&
            lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          initialCenter = { lat, lng };
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
    } catch (err) {
      console.log('⚠️ Could not restore map position:', err);
    }

    // Initialize the map
    const map = new google.maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: true,
      rotateControl: true,
      fullscreenControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    googleMapRef.current = map;
    isInitializedRef.current = true;

    console.log('🗺️ Google Map initialized with center:', initialCenter, 'zoom:', initialZoom);

    // Add drawing tools
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT,
        drawingModes: [
          google.maps.drawing.OverlayType.POLYGON,
          google.maps.drawing.OverlayType.CIRCLE,
          google.maps.drawing.OverlayType.RECTANGLE
        ]
      },
      polygonOptions: {
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        strokeColor: '#3b82f6',
        strokeOpacity: 0.8,
        strokeWeight: 2
      },
      circleOptions: {
        fillColor: '#10b981',
        fillOpacity: 0.2,
        strokeColor: '#10b981',
        strokeOpacity: 0.8,
        strokeWeight: 2
      },
      rectangleOptions: {
        fillColor: '#f59e0b',
        fillOpacity: 0.2,
        strokeColor: '#f59e0b',
        strokeOpacity: 0.8,
        strokeWeight: 2
      }
    });

    drawingManager.setMap(map);

    // Handle drawing completed events
    google.maps.event.addListener(drawingManager, 'overlaycomplete', (event: google.maps.drawing.OverlayCompleteEvent) => {
      console.log('🎨 Shape drawn:', event.type);
      
      // Get bounds of the drawn shape
      if (event.type === google.maps.drawing.OverlayType.POLYGON) {
        const polygon = event.overlay as google.maps.Polygon;
        const bounds = new google.maps.LatLngBounds();
        const path = polygon.getPath();
        for (let i = 0; i < path.getLength(); i++) {
          bounds.extend(path.getAt(i));
        }
        if (bounds && stableOnBoundsChange) {
          const boundsObject = {
            south: bounds.getSouthWest().lat(),
            north: bounds.getNorthEast().lat(),
            west: bounds.getSouthWest().lng(),
            east: bounds.getNorthEast().lng()
          };
          console.log('🎨 Filtering by drawn polygon bounds:', boundsObject);
          stableOnBoundsChange(boundsObject);
        }
      } else if (event.type === google.maps.drawing.OverlayType.CIRCLE) {
        const circle = event.overlay as google.maps.Circle;
        const center = circle.getCenter();
        const radius = circle.getRadius();
        if (center && radius && stableOnBoundsChange) {
          const boundsObject = {
            south: center.lat() - (radius / 111000), // Rough conversion from meters to degrees
            north: center.lat() + (radius / 111000),
            west: center.lng() - (radius / (111000 * Math.cos(center.lat() * Math.PI / 180))),
            east: center.lng() + (radius / (111000 * Math.cos(center.lat() * Math.PI / 180)))
          };
          console.log('🎨 Filtering by drawn circle bounds:', boundsObject);
          stableOnBoundsChange(boundsObject);
        }
      } else if (event.type === google.maps.drawing.OverlayType.RECTANGLE) {
        const rectangle = event.overlay as google.maps.Rectangle;
        const bounds = rectangle.getBounds();
        if (bounds && stableOnBoundsChange) {
          const boundsObject = {
            south: bounds.getSouthWest().lat(),
            north: bounds.getNorthEast().lat(),
            west: bounds.getSouthWest().lng(),
            east: bounds.getNorthEast().lng()
          };
          console.log('🎨 Filtering by drawn rectangle bounds.googles:', boundsObject);
          stableOnBoundsChange(boundsObject);
        }
      }
    });

    // Handle map events
    const emitBounds = () => {
      if (googleMapRef.current && stableOnBoundsChange) {
        const bounds = googleMapRef.current.getBounds();
        if (bounds) {
          const boundsObject = {
            south: bounds.getSouthWest().lat(),
            north: bounds.getNorthEast().lat(),
            west: bounds.getSouthWest().lng(),
            east: bounds.getNorthEast().lng()
          };

          const center = googleMapRef.current.getCenter();
          const zoom = googleMapRef.current.getZoom();

          console.log('🗺️ Google Map bounds emitted:', boundsObject);
          console.log('🗺️ Google Map center:', center?.toJSON());
          console.log('🗺️ Google Map zoom:', zoom);

          // Provide user feedback based on zoom level
          if (zoom && zoom < 6) {
            setZoomMessage('🔍 Zoom in closer to see property listings');
          } else if (zoom && zoom > 15) {
            setZoomMessage('🔍 Zoom out to see more properties');
          } else {
            setZoomMessage(null);
          }

          stableOnBoundsChange(boundsObject);
        }
      }
    };

    const saveMapPosition = () => {
      if (googleMapRef.current) {
        const center = googleMapRef.current.getCenter();
        const zoom = googleMapRef.current.getZoom();

        if (center && zoom) {
          try {
            localStorage.setItem('dealflow-map-center', JSON.stringify([center.lat(), center.lng()]));
            localStorage.setItem('dealflow-map-zoom', zoom.toString());
            console.log('🗺️ Saved Google Map position:', { center: center.toJSON(), zoom });
          } catch (err) {
            console.log('⚠️ Could not save map position:', err);
          }
        }
      }
    };

    // Add event listeners
    google.maps.event.addListener(map, 'bounds_changed', () => {
      console.log('🗺️ Google Map bounds changed');
      emitBounds();
      saveMapPosition();
    });

    google.maps.event.addListener(map, 'zoom_changed', () => {
      console.log('🗺️ Google Map zoom changed');
      emitBounds();
      saveMapPosition();
    });

    // Emit initial bounds
    setTimeout(() => {
      console.log('🗺️ Emitting initial Google Map bounds');
      emitBounds();
    }, 1000);

    return () => {
      // Cleanup
      if (googleMapRef.current) {
        google.maps.event.clearInstanceListeners(googleMapRef.current);
        googleMapRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [isLoading, stableOnBoundsChange]);

  // Render markers
  useEffect(() => {
    if (isLoading || !googleMapRef.current || !points || points.length === 0) {
      return;
    }

    console.log('=== GOOGLE MAP MARKER RENDERING EFFECT TRIGGERED ===');
    console.log('Points received:', points?.length || 0);

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Validate and create markers
    const validPoints = points.filter(p =>
      typeof p.lat === 'number' &&
      typeof p.lng === 'number' &&
      !isNaN(p.lat) &&
      !isNaN(p.lng) &&
      p.lat >= -90 && p.lat <= 90 &&
      p.lng >= -180 && p.lng <= 180
    );

    console.log('✅ Valid points for rendering:', validPoints.length);

    validPoints.forEach((point) => {
      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: googleMapRef.current,
        title: `Listing ID: ${point.id}`,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      // Add click listener
      marker.addListener('click', () => {
        console.log('Marker clicked:', point.id);
        router.push(`/listing/${point.id}`);
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <b>Listing ID:</b> ${point.id}<br>
            <b>Price:</b> $${point.price || 'N/A'}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    console.log('🎉 All Google Map markers added successfully');

  }, [points, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ 
        position: 'relative', 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>🗺️</div>
          <div>Loading Google Maps...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div 
        ref={mapRef} 
        style={{ 
          height: '100%', 
          width: '100%', 
          borderRadius: 12, 
          border: '1px solid #e5e7eb' 
        }} 
      />
      {zoomMessage && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '5px',
          fontSize: '0.9em',
          pointerEvents: 'none',
          zIndex: 1000,
          fontWeight: '500',
          maxWidth: '80%',
          textAlign: 'center'
        }}>
          {zoomMessage}
        </div>
      )}
    </div>
  );
}
