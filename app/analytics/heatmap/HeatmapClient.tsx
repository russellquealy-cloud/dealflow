'use client';

import { useEffect, useState, useRef } from 'react';
import { useJsApiLoader, GoogleMap, HeatmapLayer } from '@react-google-maps/api';
import { logger } from '@/lib/logger';

type HeatmapPoint = {
  id: string;
  lat: number;
  lng: number;
  views: number;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: '100%',
  height: '600px',
  borderRadius: '8px',
};

const DEFAULT_CENTER: google.maps.LatLngLiteral = {
  lat: 39.8283,
  lng: -98.5795,
};

const DEFAULT_ZOOM = 4;

const MAP_LIBRARIES: ('visualization')[] = ['visualization'];

/**
 * HeatmapClient component that fetches listing data and displays it as a heatmap
 * based on view counts. Higher view counts = stronger heat intensity.
 */
export default function HeatmapClient() {
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'dealflow-google-map',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: MAP_LIBRARIES,
    preventGoogleFontsLoading: true,
  });

  // Fetch heatmap data from API
  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/heatmap', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to view the heatmap');
            return;
          }
          throw new Error(`Failed to fetch heatmap data: ${response.status}`);
        }

        const result = await response.json();
        setHeatmapData(result.data || []);
        setError(null);
      } catch (err) {
        logger.error('Error fetching heatmap data:', err);
        setError('Failed to load heatmap data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, []);

  // Convert heatmap data to Google Maps format with weighted points
  const heatmapDataPoints: google.maps.visualization.WeightedLocation[] = heatmapData.map((point) => {
    // Normalize views to a weight (0-1 scale)
    // Use logarithmic scaling to handle wide ranges of view counts
    const maxViews = Math.max(...heatmapData.map((p) => p.views), 1);
    const minViews = Math.min(...heatmapData.map((p) => p.views), 0);
    const viewsRange = maxViews - minViews || 1;
    
    // Logarithmic normalization: log(view + 1) / log(maxViews + 1)
    // This gives better distribution for wide ranges
    const normalizedWeight = maxViews > 0
      ? Math.log(point.views + 1) / Math.log(maxViews + 1)
      : 0;

    return {
      location: new google.maps.LatLng(point.lat, point.lng),
      weight: normalizedWeight,
    };
  });

  // Heatmap gradient configuration (blue to red, low to high intensity)
  const heatmapGradient = [
    'rgba(59, 130, 246, 0)',      // Transparent blue (low intensity)
    'rgba(59, 130, 246, 0.5)',    // Light blue
    'rgba(147, 197, 253, 0.7)',   // Medium blue
    'rgba(251, 191, 36, 0.8)',    // Yellow
    'rgba(245, 158, 11, 0.9)',    // Orange
    'rgba(239, 68, 68, 1)',       // Red (high intensity)
  ];

  // Heatmap options
  const heatmapOptions: google.maps.visualization.HeatmapLayerOptions = {
    data: heatmapDataPoints,
    radius: 50, // Radius of heat influence in pixels
    opacity: 0.8,
    gradient: heatmapGradient,
    maxIntensity: 1,
    dissipating: true, // Heat dissipates on zoom out
  };

  if (loadError) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444' }}>
        Error loading Google Maps. Please check your API key configuration.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>Loading map...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>Loading heatmap data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444' }}>
        {error}
      </div>
    );
  }

  if (heatmapData.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
        No listing data available for heatmap visualization.
      </div>
    );
  }

  // Calculate map bounds from data points
  const bounds = new google.maps.LatLngBounds();
  heatmapData.forEach((point) => {
    bounds.extend(new google.maps.LatLng(point.lat, point.lng));
  });

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={bounds.getCenter()}
        zoom={mapRef.current ? undefined : 10} // Use bounds on first load
        onLoad={(map) => {
          mapRef.current = map;
          map.fitBounds(bounds);
        }}
        options={{
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
          disableDefaultUI: false,
          gestureHandling: 'greedy',
          clickableIcons: false,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        <HeatmapLayer options={heatmapOptions} />
      </GoogleMap>
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          fontSize: '12px',
          color: '#374151',
          maxWidth: '200px',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Legend</div>
        <div style={{ fontSize: '11px', color: '#6b7280' }}>
          Intensity based on listing views
        </div>
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '60px',
              height: '8px',
              background: 'linear-gradient(to right, rgba(59, 130, 246, 0.5), rgba(239, 68, 68, 1))',
              borderRadius: '4px',
            }}
          />
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            Low → High
          </div>
        </div>
      </div>
    </div>
  );
}
