'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  GoogleMap,
  Marker,
  MarkerClusterer,
  Polygon,
  useJsApiLoader,
} from '@react-google-maps/api';
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

export type BoundsPayload = google.maps.LatLngBoundsLiteral & {
  polygon?: {
    type: 'Polygon';
    coordinates: number[][][];
  };
};

export interface GoogleMapImplProps {
  points: Point[];
  onBoundsChange?: (bounds: BoundsPayload | null) => void;
  onPolygonComplete?: (polygon: google.maps.Polygon) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (id: string) => void;
}

const MAP_LIBRARIES: ('drawing' | 'places')[] = ['drawing', 'places'];
const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
};
const DEFAULT_CENTER: google.maps.LatLngLiteral = {
  lat: 39.8283,
  lng: -98.5795,
};
const DEFAULT_ZOOM = 4;
const BOUNDS_EPSILON = 0.0005;

const polygonOptions: google.maps.PolygonOptions = {
  fillColor: '#3b82f6',
  fillOpacity: 0.24,
  strokeColor: '#1d4ed8',
  strokeOpacity: 0.9,
  strokeWeight: 2,
  clickable: true,
  editable: false,
  draggable: false,
};

const FEATURED_MARKER_SVG = `
<svg width="64" height="88" viewBox="0 0 64 88" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g filter="url(#dropShadow)">
    <path d="M32 6C19.2975 6 8.99996 16.3458 9 29.125C9.00005 46.875 32 76 32 76C32 76 54.9999 46.875 55 29.125C55 16.3458 44.7025 6 32 6Z" fill="#F59E0B"/>
    <path d="M32 14.5C24.1929 14.5 17.875 20.9056 17.875 28.8438C17.875 36.782 24.1929 43.1875 32 43.1875C39.8071 43.1875 46.125 36.782 46.125 28.8438C46.125 20.9056 39.8071 14.5 32 14.5Z" fill="url(#innerGradient)"/>
  </g>
  <defs>
    <filter id="dropShadow" x="0" y="0" width="64" height="88" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feOffset dy="2"/>
      <feGaussianBlur stdDeviation="4"/>
      <feComposite in2="SourceAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.24 0"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow"/>
    </filter>
    <linearGradient id="innerGradient" x1="32" y1="14.5" x2="32" y2="43.1875" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FEF3C7"/>
      <stop offset="1" stop-color="#F59E0B"/>
    </linearGradient>
  </defs>
</svg>
`;

function pathsToBounds(path: google.maps.LatLngLiteral[]): google.maps.LatLngBoundsLiteral {
  const bounds = new google.maps.LatLngBounds();
  path.forEach((point) => bounds.extend(point));
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  return {
    south: sw.lat(),
    west: sw.lng(),
    north: ne.lat(),
    east: ne.lng(),
  };
}

function pathsToGeoJson(path: google.maps.LatLngLiteral[]) {
  const coordinates = path.map((point) => [point.lng, point.lat]);
  if (coordinates.length) {
    coordinates.push(coordinates[0]);
  }
  return {
    type: 'Polygon' as const,
    coordinates: [coordinates],
  };
}

function boundsChanged(a: google.maps.LatLngBoundsLiteral, b: google.maps.LatLngBoundsLiteral) {
  return (
    Math.abs(a.north - b.north) > BOUNDS_EPSILON ||
    Math.abs(a.south - b.south) > BOUNDS_EPSILON ||
    Math.abs(a.east - b.east) > BOUNDS_EPSILON ||
    Math.abs(a.west - b.west) > BOUNDS_EPSILON
  );
}

export default function GoogleMapImpl({
  points,
  onBoundsChange,
  onPolygonComplete,
  center,
  zoom,
  onMarkerClick,
}: GoogleMapImplProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const mapListenersRef = useRef<google.maps.MapsEventListener[]>([]);
  const debounceRef = useRef<number | null>(null);
  const skipIdleRef = useRef(false);
  const lastReportedBoundsRef = useRef<BoundsPayload | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnPath, setDrawnPath] = useState<google.maps.LatLngLiteral[] | null>(null);
  const [boundsPayload, setBoundsPayload] = useState<BoundsPayload | null>(null);

  const geocodePanRef = useRef(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'dealflow-google-map',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: MAP_LIBRARIES,
    preventGoogleFontsLoading: true,
  });

  const [initialCenter] = useState<google.maps.LatLngLiteral>(() => {
    if (center) {
      return { lat: center.lat, lng: center.lng };
    }
    if (typeof window === 'undefined') {
      return DEFAULT_CENTER;
    }
    try {
      const saved = localStorage.getItem('dealflow-google-map-center');
      if (saved) {
        const parsed = JSON.parse(saved) as google.maps.LatLngLiteral;
        if (typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          return parsed;
        }
      }
    } catch (error) {
      logger.warn('Failed to restore map center', error);
    }
    return DEFAULT_CENTER;
  });

  const [initialZoom] = useState<number>(() => {
    if (typeof zoom === 'number') {
      return zoom;
    }
    if (typeof window === 'undefined') {
      return DEFAULT_ZOOM;
    }
    try {
      const saved = localStorage.getItem('dealflow-google-map-zoom');
      if (saved) {
        const parsed = Number.parseInt(saved, 10);
        if (!Number.isNaN(parsed) && parsed >= 2 && parsed <= 18) {
          return parsed;
        }
      }
    } catch (error) {
      logger.warn('Failed to restore map zoom', error);
    }
    return DEFAULT_ZOOM;
  });

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
      disableDefaultUI: false,
      gestureHandling: 'greedy',
      clickableIcons: false,
      streetViewControl: true,
      mapTypeControl: true,
      fullscreenControl: true,
    }),
    []
  );

  const featuredMarkerIcon = useMemo<google.maps.Icon | undefined>(() => {
    if (!isLoaded || typeof window === 'undefined' || !window.google?.maps) {
      return undefined;
    }
    const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(FEATURED_MARKER_SVG)}`;
    return {
      url,
      scaledSize: new window.google.maps.Size(48, 64),
      anchor: new window.google.maps.Point(24, 60),
      labelOrigin: new window.google.maps.Point(24, 26),
    };
  }, [isLoaded]);

  const markerData = useMemo(
    () =>
      points.map((point) => ({
        ...point,
        position: { lat: point.lat, lng: point.lng } as google.maps.LatLngLiteral,
      })),
    [points]
  );

  useEffect(() => {
    if (!onBoundsChange) return;
    onBoundsChange(boundsPayload);
  }, [boundsPayload, onBoundsChange]);

  const clearListeners = useCallback(() => {
    mapListenersRef.current.forEach((listener) => listener.remove());
    mapListenersRef.current = [];
  }, []);

  const handleIdle = useCallback(() => {
    if (geocodePanRef.current) {
      // skip the idle event fired right after an imperative pan
      geocodePanRef.current = false;
      return;
    }
    if (!mapRef.current) return;
    const bounds = mapRef.current.getBounds();
    if (!bounds) return;
    const literal = bounds.toJSON();

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      const payload: BoundsPayload = { ...literal };
      const last = lastReportedBoundsRef.current;
      if (!last || boundsChanged(last, payload)) {
        lastReportedBoundsRef.current = payload;
        setBoundsPayload(payload);
      }
      if (typeof window !== 'undefined') {
        const centerLatLng = mapRef.current?.getCenter();
        const mapZoom = mapRef.current?.getZoom();
        if (centerLatLng && typeof mapZoom === 'number') {
          localStorage.setItem(
            'dealflow-google-map-center',
            JSON.stringify(centerLatLng.toJSON())
          );
          localStorage.setItem('dealflow-google-map-zoom', mapZoom.toString());
        }
      }
    }, 300);
  }, []);

  const handleLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      clearListeners();

      mapListenersRef.current.push(map.addListener('idle', () => {
        if (skipIdleRef.current) {
          skipIdleRef.current = false;
          return;
        }
        handleIdle();
      }));

      // Emit an initial bounds payload once the map has its first layout
      window.setTimeout(() => {
        if (!mapRef.current) return;
        const initialBounds = mapRef.current.getBounds();
        if (!initialBounds) return;
        const literal = initialBounds.toJSON();
        const payload: BoundsPayload = { ...literal };
        lastReportedBoundsRef.current = payload;
        setBoundsPayload(payload);
      }, 0);
    },
    [clearListeners, handleIdle]
  );

  const handleUnmount = useCallback(() => {
    clearListeners();
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setMap(null);
      drawingManagerRef.current = null;
    }
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    mapRef.current = null;
  }, [clearListeners]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setMap(null);
      drawingManagerRef.current = null;
    }
  }, []);

  const startDrawing = useCallback(() => {
    if (!mapRef.current || !window.google?.maps?.drawing) {
      logger.warn('Drawing library not available');
      return;
    }

    stopDrawing();
    setIsDrawing(true);

    const manager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: false,
      polygonOptions,
    });

    manager.setMap(mapRef.current);
    drawingManagerRef.current = manager;

    const listener = manager.addListener('polygoncomplete', (polygon: google.maps.Polygon) => {
      const pathArray = polygon.getPath().getArray().map((latLng) => ({
        lat: latLng.lat(),
        lng: latLng.lng(),
      }));

      setDrawnPath(pathArray);

      const geojson = pathsToGeoJson(pathArray);
      const boundsLiteral = pathsToBounds(pathArray);
      const payload: BoundsPayload = { ...boundsLiteral, polygon: geojson };

      skipIdleRef.current = true;
      lastReportedBoundsRef.current = payload;
      setBoundsPayload(payload);

      if (onPolygonComplete) {
        onPolygonComplete(polygon);
      }

      polygon.setMap(null);
      stopDrawing();
    });

    mapListenersRef.current.push(listener);
  }, [onPolygonComplete, stopDrawing]);

  const toggleDrawing = useCallback(() => {
    if (isDrawing) {
      stopDrawing();
    } else {
      startDrawing();
    }
  }, [isDrawing, startDrawing, stopDrawing]);

  const handleClearArea = useCallback(() => {
    setDrawnPath(null);
    lastReportedBoundsRef.current = null;
    setBoundsPayload(null);
  }, []);

  useEffect(() => {
    if (!mapRef.current || !center) return;
    if (typeof center.lat !== 'number' || typeof center.lng !== 'number') return;

    const currentCenter = mapRef.current.getCenter();
    if (
      currentCenter &&
      Math.abs(currentCenter.lat() - center.lat) < 1e-6 &&
      Math.abs(currentCenter.lng() - center.lng) < 1e-6
    ) {
      if (typeof zoom === 'number') {
        mapRef.current.setZoom(zoom);
      }
      return;
    }

    geocodePanRef.current = true;
    mapRef.current.panTo(center);
    if (typeof zoom === 'number') {
      mapRef.current.setZoom(zoom);
    }

    window.setTimeout(() => {
      geocodePanRef.current = false;
    }, 150);
  }, [center, zoom]);

  useEffect(() => () => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
  }, []);

  if (loadError) {
    logger.error('Google Maps failed to load', loadError);
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gray-50 p-6 text-center">
        <div className="text-4xl">🗺️</div>
        <p className="text-base font-semibold text-gray-700">Map unavailable</p>
        <p className="text-sm text-gray-500">
          We couldn&apos;t load Google Maps right now. Please check your connection or try again later.
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100">
        <div className="text-center text-sm text-gray-600">Loading map…</div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={initialCenter}
        zoom={initialZoom}
        options={mapOptions}
        onLoad={handleLoad}
        onUnmount={handleUnmount}
      >
        <div className="absolute right-3 top-3 z-[1] flex flex-col gap-2">
          <button
            type="button"
            onClick={toggleDrawing}
            className="rounded-md px-3 py-2 text-sm font-semibold text-white shadow-md transition focus:outline-none"
            style={{
              backgroundColor: isDrawing ? '#dc2626' : '#2563eb',
            }}
          >
            {isDrawing ? 'Stop Drawing' : 'Draw Area'}
          </button>
          {drawnPath && drawnPath.length > 0 && (
            <button
              type="button"
              onClick={handleClearArea}
              className="rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-md transition focus:outline-none"
            >
              Clear Area
            </button>
          )}
        </div>

        <MarkerClusterer>
          {(clusterer) => (
            <>
              {markerData.map((point) => (
                <Marker
                  key={point.id}
                  position={point.position}
                  clusterer={clusterer}
                  icon={
                    point.featured && featuredMarkerIcon ? featuredMarkerIcon : undefined
                  }
                  label={
                    point.featured
                      ? {
                          text: '★',
                          color: '#1f2937',
                          fontWeight: '700',
                          fontSize: '20px',
                        }
                      : undefined
                  }
                  zIndex={point.featured ? 200 : undefined}
                  onClick={() => {
                    if (onMarkerClick) {
                      onMarkerClick(point.id);
                    }
                  }}
                />
              ))}
            </>
          )}
        </MarkerClusterer>

        {drawnPath && drawnPath.length > 0 && (
          <Polygon path={drawnPath} options={polygonOptions} />
        )}
      </GoogleMap>
    </div>
  );
}
