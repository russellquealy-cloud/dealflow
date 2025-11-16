'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ListingCard from './ListingCard';

export type MapPoint = { id: string; lat: number; lng: number; price?: number; featured?: boolean; featured_until?: string };
export type ListItem = { id: string } & Record<string, unknown>;

type Props = {
  points: MapPoint[];
  listings: ListItem[];
  MapComponent: React.ComponentType<{
    points: MapPoint[];
    onBoundsChange?: (bounds: unknown) => void;
    center?: { lat: number; lng: number };
    zoom?: number;
    viewport?: { north: number; south: number; east: number; west: number };
    onMarkerClick?: (id: string) => void;
  }>;
  onBoundsChange?: (bounds: unknown) => void;
  mapCenter?: { lat: number; lng: number } | undefined;
  mapZoom?: number | undefined;
  mapViewport?: { north: number; south: number; east: number; west: number } | undefined;
};

export default function ListingsSplitClient({ points, listings, MapComponent, onBoundsChange, mapCenter, mapZoom, mapViewport }: Props) {
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');
  const router = useRouter();
  const handleMarkerClick = useCallback(
    (id: string) => {
      router.push(`/listing/${id}`);
    },
    [router]
  );
  
  const mapContainerStyle = useMemo(() => ({
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    background: '#fff',
    minWidth: 0,
    display: mobileView === 'list' ? 'none' : 'flex',
    flexDirection: 'column' as const,
    flex: 1,
    height: '100%',
    minHeight: '420px',
    overflow: 'hidden',
    padding: '0',
    margin: '0',
  }), [mobileView]);
  
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden' 
    }}>
      {/* Mobile View Toggle - Only visible on mobile */}
      <div style={{
        display: 'none'
      }}>
        <style>{`
          @media (max-width: 1023px) {
            .mobile-toggle-container {
              display: flex !important;
              gap: 8px;
              marginBottom: 16px;
              zIndex: 30;
              position: relative;
              background: white;
              flexShrink: 0;
            }
          }
        `}</style>
      </div>
      <div className="mobile-toggle-container" style={{ display: 'none' }}>
        <button
          onClick={() => setMobileView('map')}
          style={{
            flex: 1,
            padding: '12px 16px',
            minHeight: '44px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontWeight: 600,
            fontSize: '14px',
            background: mobileView === 'map' ? '#3b82f6' : '#fff',
            color: mobileView === 'map' ? '#fff' : '#374151',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
        >
          🗺️ Map View
        </button>
        <button
          onClick={() => setMobileView('list')}
          style={{
            flex: 1,
            padding: '12px 16px',
            minHeight: '44px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontWeight: 600,
            fontSize: '14px',
            background: mobileView === 'list' ? '#3b82f6' : '#fff',
            color: mobileView === 'list' ? '#fff' : '#374151',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
        >
          📋 List View
        </button>
      </div>

      {/* Desktop: Side by side, Mobile: Stacked with toggle */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '16px',
        flex: 1,
        minHeight: 0
      }}>
        <style>{`
          @media (min-width: 1024px) {
            .listings-split-grid {
              grid-template-columns: minmax(540px, 1fr) 1fr !important;
            }
          }
        `}</style>
        <div className="listings-split-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '16px',
          flex: 1,
          minHeight: 0
        }}>
          {/* MAP */}
          <div style={mapContainerStyle}>
            <div style={{
              flex: 1,
              minWidth: 0,
              width: '100%',
              height: '100%',
              padding: '0'
            }}>
              <MapComponent
                points={points}
                onBoundsChange={onBoundsChange}
                center={mapCenter}
                zoom={mapZoom}
                viewport={mapViewport}
                onMarkerClick={handleMarkerClick}
              />
            </div>
          </div>

          {/* LIST */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            background: '#fff',
            minWidth: 0,
            overflowY: 'auto',
            padding: '16px',
            display: mobileView === 'map' ? 'none' : 'block',
            height: mobileView === 'list' ? 'calc(100vh - 280px)' : '35vh',
          }}>
            <style>{`
              @media (min-width: 1024px) {
                .listings-list-container {
                  display: block !important;
                  height: 100% !important;
                }
              }
            `}</style>
            <div className="listings-list-container" style={{
              display: mobileView === 'map' ? 'none' : 'block',
              height: mobileView === 'list' ? 'calc(100vh - 280px)' : '35vh',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '16px'
              }}>
                <style>{`
                  @media (min-width: 1024px) {
                    .listings-grid {
                      grid-template-columns: repeat(2, 1fr) !important;
                    }
                  }
                `}</style>
                <div className="listings-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '16px'
                }}>
                  {listings.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#6b7280', 
                      padding: 20,
                      gridColumn: '1 / -1'
                    }}>
                      No listings found
                    </div>
                  ) : (
                    listings.map((l) => <ListingCard key={String(l.id)} listing={l} />)
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
