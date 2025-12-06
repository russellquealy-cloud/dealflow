'use client';

import { useEffect, useState, useRef } from 'react';
import { useJsApiLoader, GoogleMap, HeatmapLayer } from '@react-google-maps/api';
import { logger } from '@/lib/logger';

type DistressHeatmapPoint = {
  lat: number;
  lng: number;
  distressScore: number;
  listingId: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  listingCount: number;
};

const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: '100%',
  height: '600px',
  borderRadius: '8px',
};

const MAP_LIBRARIES: ('visualization')[] = ['visualization'];

/**
 * DistressHeatmapClient component that fetches distressed listing data and displays it as a heatmap
 * based on distress scores. Higher distress scores = stronger heat intensity.
 */
export default function DistressHeatmapClient() {
  const [heatmapData, setHeatmapData] = useState<DistressHeatmapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'dealflow-google-map',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: MAP_LIBRARIES,
    preventGoogleFontsLoading: true,
  });

  // Fetch distress heatmap data from API
  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/distress-heatmap', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to view the distress heatmap');
            return;
          }
          throw new Error(`Failed to fetch distress heatmap data: ${response.status}`);
        }

        const result = await response.json();
        setHeatmapData(result.data || []);
        setError(null);
      } catch (err) {
        logger.error('Error fetching distress heatmap data:', err);
        setError('Failed to load distress heatmap data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, []);

  // Convert heatmap data to Google Maps format with weighted points
  const heatmapDataPoints: google.maps.visualization.WeightedLocation[] = heatmapData.map((point) => {
    // Normalize distress score to a weight (0-1 scale)
    // Distress scores are 0-10, so divide by 10 for normalization
    const normalizedWeight = Math.min(1, Math.max(0, point.distressScore / 10));

    return {
      location: new google.maps.LatLng(point.lat, point.lng),
      weight: normalizedWeight,
    };
  });

  // Heatmap gradient configuration (green to amber to red, low to high distress)
  const heatmapGradient = [
    'rgba(34, 197, 94, 0)',      // Transparent green (low distress)
    'rgba(34, 197, 94, 0.4)',    // Light green
    'rgba(251, 191, 36, 0.6)',   // Amber
    'rgba(245, 158, 11, 0.8)',    // Orange
    'rgba(239, 68, 68, 0.9)',    // Red
    'rgba(220, 38, 38, 1)',      // Dark red (high distress)
  ];

  // Heatmap options
  const heatmapOptions: google.maps.visualization.HeatmapLayerOptions = {
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
        <div style={{ fontSize: '14px', color: '#6b7280' }}>Loading distress heatmap data...</div>
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
        No distressed area data available yet. Check back after more market data has been imported.
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
        <HeatmapLayer data={heatmapDataPoints} options={heatmapOptions} />
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
          Intensity based on distress score (0-10)
        </div>
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '60px',
              height: '8px',
              background: 'linear-gradient(to right, rgba(34, 197, 94, 0.4), rgba(220, 38, 38, 1))',
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
