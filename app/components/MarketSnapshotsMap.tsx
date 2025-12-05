'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useJsApiLoader, GoogleMap, HeatmapLayer } from '@react-google-maps/api';
import { logger } from '@/lib/logger';

type MarketSnapshot = {
  regionId: number;
  regionName: string;
  stateName: string | null;
  regionType: string;
  sizeRank: number | null;
  zhviMidAll: number | null;
  zhviMidSfr: number | null;
  zoriRentIndex: number | null;
  inventoryForSale: number | null;
  newListings: number | null;
  newPending: number | null;
  salesCount: number | null;
  marketTempIndex: number | null;
  pctSoldAboveList: number | null;
  pctListingsPriceCut: number | null;
  medianDaysToClose: number | null;
  incomeNeededToBuy20pctMid: number | null;
  incomeNeededToRentMid: number | null;
  zhvfGrowth1m: number | null;
  zhvfGrowth3m: number | null;
  zhvfGrowth12m: number | null;
};

type MarketSnapshotWithCoords = MarketSnapshot & {
  lat: number;
  lng: number;
  normalizedTemp: number; // 0-1 normalized marketTempIndex
};

const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: '100%',
  height: '600px',
  borderRadius: '8px',
};

const MAP_LIBRARIES: ('visualization' | 'places')[] = ['visualization', 'places'];

/**
 * MarketSnapshotsMap component that fetches market snapshot data and displays it
 * on a map with markers colored by marketTempIndex (normalized 0-1).
 */
export default function MarketSnapshotsMap() {
  const [snapshots, setSnapshots] = useState<MarketSnapshot[]>([]);
  const [snapshotsWithCoords, setSnapshotsWithCoords] = useState<MarketSnapshotWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'dealflow-market-map',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: MAP_LIBRARIES,
    preventGoogleFontsLoading: true,
  });

  // Fetch market snapshot data from API
  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/markets/snapshot?limit=200', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch market snapshots: ${response.status}`);
        }

        const data = await response.json();
        const snapshotsData = Array.isArray(data) ? data : [data];
        
        // Filter to only MSA regions (exclude country-level data)
        const msaSnapshots = snapshotsData.filter(
          (s: MarketSnapshot) => s.regionType?.toLowerCase() === 'msa'
        );
        
        setSnapshots(msaSnapshots);
      } catch (err) {
        logger.error('Error fetching market snapshots:', err);
        setError('Failed to load market snapshot data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshots();
  }, []);

  // Geocode region names to get coordinates
  useEffect(() => {
    if (!isLoaded || snapshots.length === 0 || snapshotsWithCoords.length > 0) {
      return;
    }

    const geocodeSnapshots = async () => {
      setGeocoding(true);
      const geocoder = new google.maps.Geocoder();
      const geocoded: MarketSnapshotWithCoords[] = [];

      // Process in batches to avoid overwhelming the geocoding API
      const batchSize = 10;
      for (let i = 0; i < snapshots.length; i += batchSize) {
        const batch = snapshots.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (snapshot) => {
            try {
              // Build geocode query from region name and state
              const query = snapshot.stateName
                ? `${snapshot.regionName}, ${snapshot.stateName}`
                : snapshot.regionName;

              const result = await new Promise<google.maps.GeocoderResult | null>(
                (resolve, reject) => {
                  geocoder.geocode({ address: query }, (results, status) => {
                    if (status === 'OK' && results && results.length > 0) {
                      resolve(results[0]);
                    } else {
                      logger.warn('Geocoding failed', { query, status });
                      resolve(null);
                    }
                  });
                }
              );

              if (result && result.geometry && result.geometry.location) {
                const location = result.geometry.location;
                // Extract coordinates - handle both LatLng objects and plain objects
                let lat: number;
                let lng: number;
                
                try {
                  // Try calling lat() method first (LatLng object)
                  if (location && typeof (location as unknown as { lat: () => number }).lat === 'function') {
                    const latLng = location as unknown as google.maps.LatLng;
                    lat = latLng.lat();
                    lng = latLng.lng();
                  } else {
                    // Assume it's a plain object with lat/lng properties
                    const loc = location as unknown as { lat: number; lng: number };
                    lat = loc.lat;
                    lng = loc.lng;
                  }

                  if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                    geocoded.push({
                      ...snapshot,
                      lat,
                      lng,
                      normalizedTemp: 0, // Will be calculated after all geocoding
                    });
                  }
                } catch (coordError) {
                  logger.warn('Error extracting coordinates', { error: coordError });
                  // Skip this snapshot if we can't extract coordinates
                }
              }
            } catch (err) {
              logger.error('Error geocoding snapshot', { snapshot: snapshot.regionName, error: err });
            }
          })
        );

        // Small delay between batches to respect rate limits
        if (i + batchSize < snapshots.length) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      // Normalize marketTempIndex values (0-1 scale)
      const validTemps = geocoded
        .map((s) => s.marketTempIndex)
        .filter((t): t is number => t !== null && t !== undefined && !isNaN(t));

      if (validTemps.length > 0) {
        const minTemp = Math.min(...validTemps);
        const maxTemp = Math.max(...validTemps);
        const tempRange = maxTemp - minTemp || 1; // Avoid division by zero

        geocoded.forEach((snapshot) => {
          if (snapshot.marketTempIndex !== null && snapshot.marketTempIndex !== undefined) {
            snapshot.normalizedTemp = (snapshot.marketTempIndex - minTemp) / tempRange;
          } else {
            snapshot.normalizedTemp = 0.5; // Default to middle if missing
          }
        });
      }

      setSnapshotsWithCoords(geocoded);
      setGeocoding(false);
    };

    geocodeSnapshots();
  }, [isLoaded, snapshots, snapshotsWithCoords.length]);

  // Calculate map bounds from geocoded points
  const bounds = useMemo(() => {
    if (snapshotsWithCoords.length === 0) return null;
    
    const mapBounds = new google.maps.LatLngBounds();
    snapshotsWithCoords.forEach((snapshot) => {
      mapBounds.extend(new google.maps.LatLng(snapshot.lat, snapshot.lng));
    });
    return mapBounds;
  }, [snapshotsWithCoords]);


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

  if (loading || geocoding) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          {loading ? 'Loading market data...' : 'Geocoding metro locations...'}
        </div>
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

  if (snapshotsWithCoords.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
        No market data available for visualization.
      </div>
    );
  }

  const defaultCenter: google.maps.LatLngLiteral = {
    lat: 39.8283,
    lng: -98.5795,
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={bounds ? bounds.getCenter().toJSON() : defaultCenter}
        zoom={bounds ? undefined : 4}
        onLoad={(map) => {
          mapRef.current = map;
          if (bounds) {
            map.fitBounds(bounds);
          }
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
        <HeatmapLayer 
          data={snapshotsWithCoords.map((snapshot) => ({
            location: new google.maps.LatLng(snapshot.lat, snapshot.lng),
            weight: snapshot.normalizedTemp, // Use normalized temp as weight (0-1)
          }))}
          options={{
            radius: 50,
            opacity: 0.8,
            gradient: [
              'rgba(59, 130, 246, 0)',      // Transparent blue (cool)
              'rgba(59, 130, 246, 0.5)',    // Light blue
              'rgba(147, 197, 253, 0.7)',   // Medium blue
              'rgba(251, 191, 36, 0.8)',    // Yellow
              'rgba(245, 158, 11, 0.9)',    // Orange
              'rgba(239, 68, 68, 1)',       // Red (hot)
            ],
            maxIntensity: 1,
            dissipating: true,
          }}
        />
      </GoogleMap>
      
      {/* Legend */}
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
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Market Temperature</div>
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
          Based on Market Temp Index
        </div>
        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '60px',
              height: '8px',
              background: 'linear-gradient(to right, #3b82f6, #ef4444)',
              borderRadius: '4px',
            }}
          />
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            Cool → Hot
          </div>
        </div>
      </div>
    </div>
  );
}

