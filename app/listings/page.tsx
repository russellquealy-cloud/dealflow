'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import FiltersBar, { type Filters } from '@/components/FiltersBar';
import ListingsSplitClient from '@/components/ListingsSplitClient';
import GoogleMapWrapper from '@/components/GoogleMapWrapper';
import SearchBarClient from '@/components/SearchBarClient';
import ListingsSkeleton from '@/components/ListingsSkeleton';
import { toNum } from '@/lib/format';
import { logger } from '@/lib/logger';
import type { ListItem, MapPoint } from '@/components/ListingsSplitClient';
import type { BoundsPayload } from '@/components/GoogleMapImpl';

interface ListingData {
  id: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number;
  arv?: number;
  repairs?: number;
  spread?: number;
  roi?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  year_built?: number;
  lot_size?: number;
  property_type?: string;
  description?: string;
  images?: string[];
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
  featured?: boolean;
  featured_until?: string;
}

interface Row {
  id: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number;
  arv?: number;
  repairs?: number;
  beds?: number;
  bedrooms?: number;
  baths?: number;
  sqft?: number;
  year_built?: number;
  lot_size?: number;
  property_type?: string;
  description?: string;
  images?: string[];
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
  featured?: boolean;
  featured_until?: string;
}


export default function ListingsPage() {
  const [allListings, setAllListings] = useState<ListItem[]>([]);
  const [allPoints, setAllPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapBounds, setMapBounds] = useState<BoundsPayload | null>(null);
  const [activeMapBounds, setActiveMapBounds] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);
  const [mapViewport, setMapViewport] = useState<{ north: number; south: number; east: number; west: number } | undefined>(undefined);
  const [filters, setFilters] = useState<Filters>({
    minPrice: null,
    maxPrice: null,
    minBeds: null,
    maxBeds: null,
    minBaths: null,
    maxBaths: null,
    minSqft: null,
    maxSqft: null,
    sortBy: 'newest'
  });

  const mapRowsToState = useCallback((rows: Row[]) => {
    const items = rows.map((r) => {
      const price = toNum(r.price);
      const arv = toNum(r.arv);
      const repairs = toNum(r.repairs);
      const spread = arv && price ? arv - price : undefined;
      const roi = arv && price ? ((arv - price) / price) * 100 : undefined;

      return {
        id: String(r.id),
        title: r.title ?? undefined,
        address: r.address ?? undefined,
        city: r.city ?? undefined,
        state: r.state ?? undefined,
        zip: r.zip ?? undefined,
        price,
        arv,
        repairs,
        spread,
        roi,
        beds: toNum(r.beds) ?? toNum(r.bedrooms),
        baths: toNum(r.baths),
        sqft: toNum(r.sqft),
        bedrooms: toNum(r.beds) ?? toNum(r.bedrooms),
        bathrooms: toNum(r.baths),
        home_sqft: toNum(r.sqft),
        year_built: toNum(r.year_built),
        lot_size: toNum(r.lot_size),
        property_type: r.property_type ?? undefined,
        description: r.description ?? undefined,
        images: r.images ?? [],
        latitude: toNum(r.latitude),
        longitude: toNum(r.longitude),
        created_at: r.created_at ?? undefined,
        updated_at: r.updated_at ?? undefined,
        featured: r.featured,
        featured_until: r.featured_until
      } as ListingData;
    });

    const points: MapPoint[] = [];
    for (const r of rows) {
      if (r.latitude && r.longitude) {
        points.push({
          id: String(r.id),
          lat: toNum(r.latitude) || 0,
          lng: toNum(r.longitude) || 0,
          price: toNum(r.price),
          featured: r.featured,
          featured_until: r.featured_until
        });
      }
    }

    return { items: items as ListItem[], points };
  }, []);

  const requestListings = useCallback(
    async (
      filtersToUse: Filters,
      options?: {
        bounds?: BoundsPayload;
        limit?: number;
      }
    ) => {
      const params = new URLSearchParams();
      params.set('limit', String(options?.limit ?? 40));
      params.set('offset', '0');

      if (filtersToUse.minPrice !== null) params.set('minPrice', String(filtersToUse.minPrice));
      if (filtersToUse.maxPrice !== null) params.set('maxPrice', String(filtersToUse.maxPrice));
      if (filtersToUse.minBeds !== null) params.set('minBeds', String(filtersToUse.minBeds));
      if (filtersToUse.maxBeds !== null) params.set('maxBeds', String(filtersToUse.maxBeds));
      if (filtersToUse.minBaths !== null) params.set('minBaths', String(filtersToUse.minBaths));
      if (filtersToUse.maxBaths !== null) params.set('maxBaths', String(filtersToUse.maxBaths));
      if (filtersToUse.minSqft !== null) params.set('minSqft', String(filtersToUse.minSqft));
      if (filtersToUse.maxSqft !== null) params.set('maxSqft', String(filtersToUse.maxSqft));
      if (filtersToUse.sortBy) params.set('sortBy', filtersToUse.sortBy);

      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      if (options?.bounds) {
        const { south, north, west, east, polygon } = options.bounds;
        params.set('south', String(south));
        params.set('north', String(north));
        params.set('west', String(west));
        params.set('east', String(east));
        if (polygon) {
          params.set('polygon', JSON.stringify(polygon));
        }
      }

      const response = await fetch(`/api/listings?${params.toString()}`, { cache: 'no-store' });
      const result = await response.json();

      if (!response.ok || result.error) {
        const message = result.error?.message || `HTTP ${response.status}`;
        const code = result.error?.code;
        throw Object.assign(new Error(message), { code });
      }

      const rows = (result.items ?? []) as Row[];
      return mapRowsToState(rows);
    },
    [mapRowsToState, searchQuery]
  );

  // Debounce bounds changes to prevent excessive API calls
  const boundsChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingBoundsRef = useRef(false);

  // Helper function to handle map bounds changes with specific filters
  const handleMapBoundsChangeWithFilters = useCallback(async (bounds: unknown, filtersToUse: Filters) => {
     // If we're already processing bounds, ignore this call to prevent loops
     if (isProcessingBoundsRef.current) {
         logger.log('Already processing bounds, ignoring duplicate call');
           return;
         }
         
     // Clear any existing timeout
     if (boundsChangeTimeoutRef.current) {
       clearTimeout(boundsChangeTimeoutRef.current);
     }
 
    boundsChangeTimeoutRef.current = setTimeout(async () => {
      isProcessingBoundsRef.current = true;

      try {
        if (bounds === null) {
          logger.log('Map drawing cleared. Reloading default listings.');
          setActiveMapBounds(false);
          setMapBounds(null);
          const { items, points } = await requestListings(filtersToUse, { limit: 40 });
          setAllListings(items);
          setAllPoints(points);
          return;
        }

        if (
          !bounds ||
          typeof bounds !== 'object' ||
          !('south' in bounds) ||
          !('north' in bounds) ||
          !('west' in bounds) ||
          !('east' in bounds)
        ) {
          logger.log('Invalid bounds received, skipping spatial filter');
          return;
        }

        const typedBounds = bounds as BoundsPayload;

        if (
          Number.isNaN(typedBounds.south) ||
          Number.isNaN(typedBounds.north) ||
          Number.isNaN(typedBounds.west) ||
          Number.isNaN(typedBounds.east)
        ) {
          logger.log('Bounds contained NaN values, skipping spatial filter');
          return;
        }

        const normalizedBounds: BoundsPayload = {
          south: typedBounds.south,
          north: typedBounds.north,
          west: typedBounds.west,
          east: typedBounds.east,
          ...(typedBounds.polygon ? { polygon: typedBounds.polygon } : {}),
        };

        const threshold = 0.02;
        if (
          !mapBounds ||
          Math.abs(mapBounds.south - normalizedBounds.south) > threshold ||
          Math.abs(mapBounds.north - normalizedBounds.north) > threshold ||
          Math.abs(mapBounds.west - normalizedBounds.west) > threshold ||
          Math.abs(mapBounds.east - normalizedBounds.east) > threshold
        ) {
          logger.log('Bounds changed significantly, applying spatial filter for bounds:', normalizedBounds);
          setMapBounds(normalizedBounds);
          setActiveMapBounds(true);

          const { items, points } = await requestListings(filtersToUse, {
            bounds: normalizedBounds,
            limit: 200,
          });

          setAllListings(items);
          setAllPoints(points);
        } else {
          logger.log('Bounds unchanged (within threshold), skipping update to prevent flicker');
        }
      } catch (err) {
        logger.error('Error applying spatial filter:', err);
      } finally {
        isProcessingBoundsRef.current = false;
      }
    }, 800);
  }, [mapBounds, requestListings]);

  const handleMapBoundsChange = useCallback(async (bounds: unknown) => {
    return handleMapBoundsChangeWithFilters(bounds, filters);
  }, [handleMapBoundsChangeWithFilters, filters]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('savedSearchCriteria');
      if (!raw) return;
      window.localStorage.removeItem('savedSearchCriteria');
      const parsed = JSON.parse(raw) as {
        filters?: Partial<Filters> | null;
        searchQuery?: string | null;
        bounds?: BoundsPayload | null;
      };

      if (parsed.searchQuery) {
        setSearchQuery(parsed.searchQuery);
      }
      if (parsed.filters) {
        setFilters((prev) => ({ ...prev, ...parsed.filters }));
      }
      if (parsed.bounds) {
        setMapBounds(parsed.bounds);
        setActiveMapBounds(true);
        void handleMapBoundsChange(parsed.bounds);

        const { north, south, east, west } = parsed.bounds;
        if (
          typeof north === 'number' &&
          typeof south === 'number' &&
          typeof east === 'number' &&
          typeof west === 'number'
        ) {
          const lat = (north + south) / 2;
          const lng = (east + west) / 2;
          setMapCenter({ lat, lng });
          setMapZoom(parsed.bounds.polygon ? 12 : 11);
        }
      }
    } catch (error) {
      logger.error('Failed to apply saved search criteria', error);
    }
  }, [handleMapBoundsChange]);

  // Load all listings on mount
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const loadListings = async (retryCount = 0) => {
      if (!isMounted) return;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        if (!isMounted) return;
        logger.warn('Listings load timeout - setting loading to false');
        setLoading(false);
        setShowSkeleton(false);
        setError({ message: 'Request timed out. Please retry.', code: 'TIMEOUT' });
        if (retryCount === 0) {
          logger.log('Retrying listings load after timeout...');
          setTimeout(() => loadListings(1), 1500);
        }
      }, 15000);

      try {
        if (retryCount === 0) {
          setLoading(true);
          setShowSkeleton(true);
          setError(null);
        }

        logger.log(`Loading listings from API... (attempt ${retryCount + 1})`);
        const skeletonTimeout = setTimeout(() => {
          if (isMounted) setShowSkeleton(false);
        }, 800);

        const { items, points } = await requestListings(filters, { limit: 40 });

        if (!isMounted) return;

        clearTimeout(skeletonTimeout);
        
        // Defensive logging: compare map markers vs list items
        logger.log('📊 Listings loaded', {
          itemsCount: items.length,
          pointsCount: points.length,
          itemsIds: items.map(i => i.id).slice(0, 5),
          pointsIds: points.map(p => p.id).slice(0, 5),
          note: 'If pointsCount > itemsCount, some listings may be filtered out client-side'
        });
        
        if (points.length > items.length) {
          logger.warn('⚠️ Map has more markers than list items', {
            pointsCount: points.length,
            itemsCount: items.length,
            difference: points.length - items.length,
            note: 'This suggests client-side filtering is excluding some listings'
          });
        }
        
        setAllListings(items);
        setAllPoints(points);
        setLoading(false);
        setShowSkeleton(false);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        logger.error('Error loading listings:', err);
        const message = err instanceof Error ? err.message : 'Failed to load listings';
        const code = (err as { code?: string }).code;
        setError({ message, code });
        setAllListings([]);
        setAllPoints([]);
        setLoading(false);
        setShowSkeleton(false);

        if (retryCount === 0) {
          logger.log('Retrying listings load after error...');
          setTimeout(() => loadListings(1), 2000);
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    };

    loadListings();

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [filters, requestListings]);

  // Handle geocoding events from search bar
  useEffect(() => {
    const handleGeocode = async (e: Event) => {
      const customEvent = e as CustomEvent<{ q: string; placeId?: string }>;
      const query = customEvent.detail.q;
      const placeId = customEvent.detail.placeId;
      
      if (!query) return;
      
      try {
        const response = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, placeId })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          logger.error('Geocoding failed', { status: response.status, error: errorText, query });
          // Show user-friendly error message
          setError({ message: `Could not find location: ${query}`, code: 'GEOCODE_ERROR' });
          return;
        }
        
        const data = await response.json() as {
          ok: boolean;
          lat?: number;
          lng?: number;
          viewport?: {
            north: number;
            south: number;
            east: number;
            west: number;
          };
          formattedAddress?: string;
          error?: string;
        };
        
        if (data.ok && typeof data.lat === 'number' && typeof data.lng === 'number') {
          logger.log('✅ Geocoding successful', { query, lat: data.lat, lng: data.lng, viewport: data.viewport });
          
          // Move map to geocoded location
          setMapCenter({ lat: data.lat, lng: data.lng });
          
          // Use viewport if available (map will use fitBounds for better UX)
          if (data.viewport) {
            logger.log('📍 Setting map viewport and bounds', data.viewport);
            setMapViewport(data.viewport);
            // Clear zoom when using viewport (fitBounds will handle it)
            setMapZoom(undefined);
            
            // When using viewport, set map bounds to filter listings by location
            // This ensures the list matches what's shown on the map
            setMapBounds({
              north: data.viewport.north,
              south: data.viewport.south,
              east: data.viewport.east,
              west: data.viewport.west,
            });
            setActiveMapBounds(true);
            
            // Trigger a refresh of listings with the new bounds
            // This ensures the list updates to match the map viewport
            setTimeout(() => {
              handleMapBoundsChange({
                north: data.viewport!.north,
                south: data.viewport!.south,
                east: data.viewport!.east,
                west: data.viewport!.west,
              });
            }, 100);
            
            // Keep the formatted address in the search bar for display
            if (data.formattedAddress) {
              setSearchQuery(data.formattedAddress);
            }
          } else {
            // Fallback to center + zoom if no viewport
            logger.log('📍 Setting map center and zoom (no viewport)', { lat: data.lat, lng: data.lng });
            setMapViewport(undefined);
            setMapZoom(14);
            // Clear bounds filtering when using center/zoom
            setActiveMapBounds(false);
            setMapBounds(null);
          }
          
          // Update search query to show the formatted address
          if (data.formattedAddress) {
            setSearchQuery(data.formattedAddress);
          }
        } else if (!data.ok) {
          logger.warn('Geocoding returned no results:', data.error);
          setError({ message: data.error || `Could not find location: ${query}`, code: 'GEOCODE_NO_RESULTS' });
        }
      } catch (error) {
        logger.error('Error geocoding:', error);
      }
    };
    
    window.addEventListener('df:geocode', handleGeocode);
    return () => {
      window.removeEventListener('df:geocode', handleGeocode);
    };
  }, []);

  // Apply filters to listings
  const filteredListings = useMemo(() => {
    let filtered = allListings as ListingData[];

    // Apply map bounds filtering FIRST (most important when active)
    // This ensures the list matches what's shown on the map
    if (activeMapBounds && mapBounds) {
      filtered = filtered.filter(listing => {
        const lat = listing.latitude;
        const lng = listing.longitude;
        
        if (!lat || !lng) {
          return false;
        }
        
        const isInBounds = lat >= mapBounds.south && 
                          lat <= mapBounds.north && 
                          lng >= mapBounds.west && 
                          lng <= mapBounds.east;
        
        return isInBounds;
      });
    }

    // Apply text search (only if map bounds are not active)
    // When map bounds are active, we filter by location, not text
    if (!activeMapBounds && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(listing => 
        listing.address?.toLowerCase().includes(query) ||
        listing.city?.toLowerCase().includes(query) ||
        listing.state?.toLowerCase().includes(query) ||
        listing.zip?.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.minPrice) filtered = filtered.filter(l => (l.price ?? 0) >= filters.minPrice!);
    if (filters.maxPrice) filtered = filtered.filter(l => (l.price ?? 0) <= filters.maxPrice!);
    if (filters.minBeds) filtered = filtered.filter(l => (l.beds ?? 0) >= filters.minBeds!);
    if (filters.maxBeds) filtered = filtered.filter(l => (l.beds ?? 0) <= filters.maxBeds!);
    if (filters.minBaths) filtered = filtered.filter(l => (l.baths ?? 0) >= filters.minBaths!);
    if (filters.maxBaths) filtered = filtered.filter(l => (l.baths ?? 0) <= filters.maxBaths!);
    if (filters.minSqft) filtered = filtered.filter(l => (l.sqft ?? 0) >= filters.minSqft!);
    if (filters.maxSqft) filtered = filtered.filter(l => (l.sqft ?? 0) <= filters.maxSqft!);

    // Apply sorting
    if (filters.sortBy === 'price_asc') {
      filtered.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (filters.sortBy === 'price_desc') {
      filtered.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (filters.sortBy === 'sqft_asc') {
      filtered.sort((a, b) => (a.sqft ?? 0) - (b.sqft ?? 0));
    } else if (filters.sortBy === 'sqft_desc') {
      filtered.sort((a, b) => (b.sqft ?? 0) - (a.sqft ?? 0));
    } else {
      filtered.sort((a, b) => new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime());
    }

    return filtered;
  }, [allListings, searchQuery, filters, activeMapBounds, mapBounds]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    
    // If map bounds are active, trigger a refresh
    if (activeMapBounds && mapBounds) {
      logger.log('🔄 Map bounds active, triggering refresh with new filters');
      // Temporarily disable map bounds to force refresh
      setActiveMapBounds(false);
      setTimeout(() => {
        setActiveMapBounds(true);
        handleMapBoundsChange(mapBounds);
      }, 100);
    }
  }, [activeMapBounds, mapBounds, handleMapBoundsChange]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const state = {
        filters,
        searchQuery,
        bounds: activeMapBounds ? mapBounds : null,
      };
      localStorage.setItem('currentFilters', JSON.stringify(state));
    } catch (err) {
      logger.error('Failed to persist current search state', err);
    }
  }, [filters, searchQuery, mapBounds, activeMapBounds]);

  // Memoize map component to prevent re-renders
  if (showSkeleton || (loading && !error)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)' }}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 lg:px-6 lg:py-4 gap-4 flex-shrink-0 bg-white z-30 relative">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Find Deals</h1>
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-center">
            <div className="flex-1 lg:w-80">
              <SearchBarClient
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by address, city, or state..."
              />
            </div>
          </div>
        </div>
        <div className="px-4 lg:px-6 py-3 border-b border-gray-200 flex-shrink-0 bg-white z-20 relative shadow-sm">
          <FiltersBar value={filters} onChange={handleFiltersChange} />
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          <ListingsSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ textAlign: 'center', maxWidth: 500 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#dc2626' }}>Failed to Load Listings</h2>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 24 }}>
            {error.message}
            {error.code && <span style={{ display: 'block', fontSize: 14, marginTop: 8 }}>Error code: {error.code}</span>}
          </p>
          <button
            onClick={() => {
              setError(null);
              setShowSkeleton(true);
              setLoading(true);
              requestListings(filters, { limit: 40 })
                .then(({ items, points }) => {
                  setAllListings(items);
                  setAllPoints(points);
                  setLoading(false);
                  setShowSkeleton(false);
                })
                .catch((err) => {
                  const message = err instanceof Error ? err.message : 'Failed to load listings';
                  const code = (err as { code?: string }).code;
                  setError({ message, code });
                  setLoading(false);
                  setShowSkeleton(false);
                });
            }}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)', overflow: 'hidden', position: 'relative' }}>
      {/* header + search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 lg:px-6 lg:py-4 gap-4 flex-shrink-0 bg-white z-30 relative">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
          Find Deals
        </h1>

        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-center">
          <div className="flex-1 lg:w-80">
            <SearchBarClient
            value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by address, city, or state..."
            />
          </div>
        </div>
      </div>

      {/* filters */}
      <div className="px-4 lg:px-6 py-3 border-b border-gray-200 flex-shrink-0 bg-white z-20 relative shadow-sm">
        <FiltersBar value={filters} onChange={handleFiltersChange} />
      </div>

      {/* the split fills the rest of the viewport - NO SCROLL */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ListingsSplitClient 
          points={allPoints} 
          listings={filteredListings as ListItem[]}
          onBoundsChange={handleMapBoundsChange}
          MapComponent={GoogleMapWrapper}
          mapCenter={mapCenter}
          mapZoom={mapZoom}
          mapViewport={mapViewport}
        />
      </div>
    </div>
  );
}
