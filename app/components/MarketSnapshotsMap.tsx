'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { logger } from '@/lib/logger';
import type { MarketSnapshot } from '../lib/types/markets';

type MarketSnapshotWithCoords = MarketSnapshot & {
  lat: number;
  lng: number;
  normalizedScore: number; // 0-1 normalized score for coloring
};

type ScoreType = 'marketStrengthScore' | 'flipScore' | 'rentalScore' | 'growthScore' | 'rentalYieldScore';

const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: '100%',
  height: '600px',
  borderRadius: '8px',
};

const MAP_LIBRARIES: ('visualization' | 'places')[] = ['visualization', 'places'];

/**
 * Converts a score (0-100) to a hex color (blue for low, red for high)
 */
function scoreToColor(score: number | null): string {
  if (score === null || score === undefined || isNaN(score)) {
    return '#9ca3af'; // Gray for missing data
  }

  // Clamp score to 0-100
  const normalized = Math.max(0, Math.min(100, score)) / 100;

  // Blue (low) to Red (high) gradient
  const r = Math.round(59 + (239 - 59) * normalized);
  const g = Math.round(130 - (68 - 130) * normalized);
  const b = Math.round(246 - (68 - 246) * normalized);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Gets the score value for a snapshot based on the selected score type
 */
function getScoreValue(snapshot: MarketSnapshot, scoreType: ScoreType): number | null {
  switch (scoreType) {
    case 'marketStrengthScore':
      return snapshot.marketStrengthScore;
    case 'flipScore':
      return snapshot.flipScore;
    case 'rentalScore':
      return snapshot.rentalScore;
    case 'growthScore':
      return snapshot.growthScore;
    case 'rentalYieldScore':
      return snapshot.rentalYieldScore;
    default:
      return snapshot.marketStrengthScore;
  }
}

/**
 * Gets the display name for a score type
 */
function getScoreDisplayName(scoreType: ScoreType): string {
  switch (scoreType) {
    case 'marketStrengthScore':
      return 'Market Strength';
    case 'flipScore':
      return 'Flip Score';
    case 'rentalScore':
      return 'Rental Score';
    case 'growthScore':
      return 'Growth Score';
    case 'rentalYieldScore':
      return 'Rental Yield';
    default:
      return 'Market Strength';
  }
}

/**
 * MarketSnapshotsMap component that displays market snapshot data
 * as colored markers on a map, with tooltips and side panel for details.
 */
export default function MarketSnapshotsMap() {
  const [snapshots, setSnapshots] = useState<MarketSnapshot[]>([]);
  const [snapshotsWithCoords, setSnapshotsWithCoords] = useState<MarketSnapshotWithCoords[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedScoreType, setSelectedScoreType] = useState<ScoreType>('marketStrengthScore');
  const [selectedState, setSelectedState] = useState<string>('');
  const [hoveredSnapshot, setHoveredSnapshot] = useState<MarketSnapshotWithCoords | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<MarketSnapshotWithCoords | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'dealflow-market-map',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: MAP_LIBRARIES,
    preventGoogleFontsLoading: true,
  });

  // Fetch market snapshot data from API
  const fetchSnapshots = useCallback(async (stateFilter?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        regionType: 'msa',
        sortBy: 'marketStrengthScore',
        sortDir: 'desc',
        limit: '500',
      });

      if (stateFilter && stateFilter.trim()) {
        params.set('state', stateFilter.trim());
      }

      const response = await fetch(`/api/markets/snapshot?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch market snapshots: ${response.status}`);
      }

      const data = await response.json();
      const snapshotsData = Array.isArray(data) ? data : [data];
      
      setSnapshots(snapshotsData);
      // Reset geocoded snapshots when data changes
      setSnapshotsWithCoords([]);
    } catch (err) {
      logger.error('Error fetching market snapshots:', err);
      setError('Failed to load market snapshot data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  // Refetch when state filter changes
  useEffect(() => {
    if (selectedState !== undefined) {
      // Reset geocoded snapshots to trigger re-geocoding with new data
      setSnapshotsWithCoords([]);
      fetchSnapshots(selectedState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState]);

  // Get unique states for filter dropdown
  const availableStates = useMemo(() => {
    const states = new Set<string>();
    snapshots.forEach((s) => {
      if (s.stateName) {
        states.add(s.stateName);
      }
    });
    return Array.from(states).sort();
  }, [snapshots]);

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
                (resolve) => {
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

              if (result?.geometry?.location) {
                const location = result.geometry.location;
                const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
                const lng = typeof location.lng === 'function' ? location.lng() : location.lng;

                if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                  const score = getScoreValue(snapshot, selectedScoreType);
                  geocoded.push({
                    ...snapshot,
                    lat,
                    lng,
                    normalizedScore: score !== null ? score / 100 : 0.5,
                  });
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

      setSnapshotsWithCoords(geocoded);
      setGeocoding(false);
    };

    geocodeSnapshots();
  }, [isLoaded, snapshots, snapshotsWithCoords.length, selectedScoreType]);

  // Recalculate normalized scores when score type changes
  useEffect(() => {
    if (snapshotsWithCoords.length > 0) {
      setSnapshotsWithCoords((prev) =>
        prev.map((snapshot) => {
          const score = getScoreValue(snapshot, selectedScoreType);
          return {
            ...snapshot,
            normalizedScore: score !== null ? score / 100 : 0.5,
          };
        })
      );
    }
  }, [selectedScoreType, snapshotsWithCoords.length]);

  // Calculate map bounds from geocoded points
  const bounds = useMemo(() => {
    if (snapshotsWithCoords.length === 0) return null;
    
    const mapBounds = new google.maps.LatLngBounds();
    snapshotsWithCoords.forEach((snapshot) => {
      mapBounds.extend(new google.maps.LatLng(snapshot.lat, snapshot.lng));
    });
    return mapBounds;
  }, [snapshotsWithCoords]);

  const handleMarkerHover = useCallback((snapshot: MarketSnapshotWithCoords, event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      setHoveredSnapshot(snapshot);
      setTooltipPosition({
        lat: typeof event.latLng.lat === 'function' ? event.latLng.lat() : event.latLng.lat,
        lng: typeof event.latLng.lng === 'function' ? event.latLng.lng() : event.latLng.lng,
      });
    }
  }, []);

  const handleMarkerLeave = useCallback(() => {
    setHoveredSnapshot(null);
    setTooltipPosition(null);
  }, []);

  const handleMarkerClick = useCallback((snapshot: MarketSnapshotWithCoords) => {
    setSelectedSnapshot(snapshot);
  }, []);

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
      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#374151',
            }}
          >
            Score Type
          </label>
          <select
            value={selectedScoreType}
            onChange={(e) => setSelectedScoreType(e.target.value as ScoreType)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              minWidth: '180px',
              cursor: 'pointer',
            }}
          >
            <option value="marketStrengthScore">Market Strength</option>
            <option value="flipScore">Flip Score</option>
            <option value="rentalScore">Rental Score</option>
            <option value="growthScore">Growth Score</option>
            <option value="rentalYieldScore">Rental Yield</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#374151',
            }}
          >
            State Filter
          </label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              minWidth: '180px',
              cursor: 'pointer',
            }}
          >
            <option value="">All States</option>
            {availableStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
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
          {snapshotsWithCoords.map((snapshot) => {
            const score = getScoreValue(snapshot, selectedScoreType);
            const color = scoreToColor(score);
            
            return (
              <Marker
                key={snapshot.regionId}
                position={{ lat: snapshot.lat, lng: snapshot.lng }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: color,
                  fillOpacity: 0.8,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
                onMouseOver={(e) => handleMarkerHover(snapshot, e)}
                onMouseOut={handleMarkerLeave}
                onClick={() => handleMarkerClick(snapshot)}
              />
            );
          })}

          {/* Tooltip */}
          {hoveredSnapshot && tooltipPosition && (
            <InfoWindow
              position={tooltipPosition}
              onCloseClick={handleMarkerLeave}
              options={{
                disableAutoPan: true,
                pixelOffset: new google.maps.Size(0, -10),
              }}
            >
              <div style={{ padding: '4px', fontSize: '12px', lineHeight: '1.5' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                  {hoveredSnapshot.regionName}
                  {hoveredSnapshot.stateName && `, ${hoveredSnapshot.stateName}`}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  {getScoreDisplayName(selectedScoreType)}: {getScoreValue(hoveredSnapshot, selectedScoreType)?.toFixed(0) ?? 'N/A'}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  Flip Score: {hoveredSnapshot.flipScore?.toFixed(0) ?? 'N/A'}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  Rental Score: {hoveredSnapshot.rentalScore?.toFixed(0) ?? 'N/A'}
                </div>
                {hoveredSnapshot.zhviMidSfr && (
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    ZHVI: ${(hoveredSnapshot.zhviMidSfr / 1000).toFixed(0)}k
                  </div>
                )}
                {hoveredSnapshot.zoriRentIndex && (
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    Rent Index: ${hoveredSnapshot.zoriRentIndex.toFixed(0)}
                  </div>
                )}
              </div>
            </InfoWindow>
          )}

          {/* Side panel info window */}
          {selectedSnapshot && (
            <InfoWindow
              position={{ lat: selectedSnapshot.lat, lng: selectedSnapshot.lng }}
              onCloseClick={() => setSelectedSnapshot(null)}
            >
              <div style={{ padding: '8px', maxWidth: '300px', fontSize: '13px' }}>
                <h3 style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>
                  {selectedSnapshot.regionName}
                  {selectedSnapshot.stateName && `, ${selectedSnapshot.stateName}`}
                </h3>
                
                <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Scores (0-100)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px' }}>
                    <div>Market Strength: <strong>{selectedSnapshot.marketStrengthScore?.toFixed(0) ?? 'N/A'}</strong></div>
                    <div>Flip Score: <strong>{selectedSnapshot.flipScore?.toFixed(0) ?? 'N/A'}</strong></div>
                    <div>Rental Score: <strong>{selectedSnapshot.rentalScore?.toFixed(0) ?? 'N/A'}</strong></div>
                    <div>Growth Score: <strong>{selectedSnapshot.growthScore?.toFixed(0) ?? 'N/A'}</strong></div>
                    <div>Rental Yield: <strong>{selectedSnapshot.rentalYieldScore?.toFixed(0) ?? 'N/A'}</strong></div>
                    <div>Competition: <strong>{selectedSnapshot.competitionScore?.toFixed(0) ?? 'N/A'}</strong></div>
                    <div>Liquidity: <strong>{selectedSnapshot.liquidityScore?.toFixed(0) ?? 'N/A'}</strong></div>
                    <div>Affordability: <strong>{selectedSnapshot.affordabilityScore?.toFixed(0) ?? 'N/A'}</strong></div>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Key Metrics</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px' }}>
                  {selectedSnapshot.zhviMidSfr && (
                    <div>ZHVI Mid SFR: <strong>${(selectedSnapshot.zhviMidSfr / 1000).toFixed(0)}k</strong></div>
                  )}
                  {selectedSnapshot.zoriRentIndex && (
                    <div>Rent Index: <strong>${selectedSnapshot.zoriRentIndex.toFixed(0)}</strong></div>
                  )}
                  {selectedSnapshot.inventoryForSale && (
                    <div>Inventory: <strong>{selectedSnapshot.inventoryForSale.toLocaleString()}</strong></div>
                  )}
                  {selectedSnapshot.salesCount && (
                    <div>Sales Count: <strong>{selectedSnapshot.salesCount.toLocaleString()}</strong></div>
                  )}
                  {selectedSnapshot.marketTempIndex !== null && (
                    <div>Market Temp: <strong>{selectedSnapshot.marketTempIndex.toFixed(1)}</strong></div>
                  )}
                  {selectedSnapshot.pctSoldAboveList !== null && (
                    <div>% Above List: <strong>{selectedSnapshot.pctSoldAboveList.toFixed(1)}%</strong></div>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
      
      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          top: '80px',
          right: '16px',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          fontSize: '12px',
          color: '#374151',
          maxWidth: '200px',
          zIndex: 10,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
          {getScoreDisplayName(selectedScoreType)}
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
          Score range: 0-100
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
            Low → High
          </div>
        </div>
      </div>
    </div>
  );
}
