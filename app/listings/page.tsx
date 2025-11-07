'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/supabase/client';
import FiltersBar, { type Filters } from '@/components/FiltersBar';
import ListingsSplitClient from '@/components/ListingsSplitClient';
import GoogleMapWrapper from '@/components/GoogleMapWrapper';
import SearchBarClient from '@/components/SearchBarClient';
import ListingsSkeleton from '@/components/ListingsSkeleton';
import { toNum } from '@/lib/format';
import { logger } from '@/lib/logger';
import type { ListItem, MapPoint } from '@/components/ListingsSplitClient';

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
  const [mapBounds, setMapBounds] = useState<{ south: number; north: number; west: number; east: number } | null>(null);
  const [activeMapBounds, setActiveMapBounds] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [mapZoom, setMapZoom] = useState<number | undefined>(undefined);
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

    // Debounce the bounds change by 1500ms - increased to reduce flicker
    boundsChangeTimeoutRef.current = setTimeout(async () => {
      // Set processing flag
      isProcessingBoundsRef.current = true;

      try {
        // Handle bounds clearing (null)
        if (bounds === null) {
          logger.log('Map drawing cleared. Maintaining current map view bounds.');
          return;
        }

        // Validate bounds
    if (!bounds || 
        typeof bounds !== 'object' ||
        !('south' in bounds) ||
        !('north' in bounds) ||
        !('west' in bounds) ||
        !('east' in bounds) ||
        typeof (bounds as Record<string, unknown>).south !== 'number' || 
        typeof (bounds as Record<string, unknown>).north !== 'number' || 
        typeof (bounds as Record<string, unknown>).west !== 'number' || 
        typeof (bounds as Record<string, unknown>).east !== 'number' ||
        isNaN((bounds as Record<string, unknown>).south as number) || 
        isNaN((bounds as Record<string, unknown>).north as number) || 
        isNaN((bounds as Record<string, unknown>).west as number) || 
        isNaN((bounds as Record<string, unknown>).east as number)) {
          logger.log('Invalid bounds received, skipping spatial filter');
      return;
    }
    
    const typedBounds = bounds as { south: number; north: number; west: number; east: number; polygon?: Record<string, unknown> };
    
    // Check if polygon search is being used
    const hasPolygon = typedBounds.polygon && typedBounds.polygon.type === 'Polygon';
    
            // Only update state if bounds actually changed significantly to prevent flicker
            const threshold = 0.02; // About 2 kilometers - increased to reduce flicker
            if (!mapBounds || 
                Math.abs(mapBounds.south - typedBounds.south) > threshold ||
                Math.abs(mapBounds.north - typedBounds.north) > threshold ||
                Math.abs(mapBounds.west - typedBounds.west) > threshold ||
                Math.abs(mapBounds.east - typedBounds.east) > threshold ||
                hasPolygon) { // Always update if polygon is present
          
          logger.log('Bounds changed significantly, applying spatial filter for bounds:', typedBounds);
          
          // Update bounds state
          setMapBounds(typedBounds);
          setActiveMapBounds(true);

    try {
      // Use polygon search if polygon is provided
      if (hasPolygon) {
        const response = await fetch('/api/listings/polygon-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            polygon: typedBounds.polygon,
            filters: filtersToUse,
          }),
        });

        if (!response.ok) {
          logger.error('Polygon search failed:', await response.text());
          return;
        }

        const data = await response.json();
        const listings = data.listings || [];

        const items = listings.map((r: Row) => {
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
            bedrooms: toNum(r.beds) ?? toNum(r.bedrooms), // Also include for backward compatibility
            bathrooms: toNum(r.baths), // Also include for backward compatibility
            home_sqft: toNum(r.sqft), // Also include for backward compatibility
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
          };
        });

        const pts: MapPoint[] = [];
        for (const r of listings as Row[]) {
          if (r.latitude && r.longitude) {
            pts.push({
              id: String(r.id),
              lat: toNum(r.latitude) || 0,
              lng: toNum(r.longitude) || 0,
              price: toNum(r.price),
              featured: r.featured,
              featured_until: r.featured_until
            });
          }
        }

        setAllListings(items as ListItem[]);
        setAllPoints(pts);
        return;
      }

      // Regular bounding box search
      let query = supabase
        .from('listings')
        .select('*, latitude, longitude')
        .gte('latitude', typedBounds.south)
        .lte('latitude', typedBounds.north)
        .gte('longitude', typedBounds.west)
        .lte('longitude', typedBounds.east);
      
            // Apply filters
            if (filtersToUse.minPrice) query = query.gte('price', filtersToUse.minPrice);
            if (filtersToUse.maxPrice) query = query.lte('price', filtersToUse.maxPrice);
            if (filtersToUse.minBeds) {
              query = query.or(`beds.gte.${filtersToUse.minBeds},bedrooms.gte.${filtersToUse.minBeds}`);
            }
            if (filtersToUse.maxBeds) {
              query = query.lte('bedrooms', filtersToUse.maxBeds);
            }
            if (filtersToUse.minBaths) query = query.gte('baths', filtersToUse.minBaths);
            if (filtersToUse.maxBaths) query = query.lte('baths', filtersToUse.maxBaths);
            if (filtersToUse.minSqft) query = query.gte('sqft', filtersToUse.minSqft);
            if (filtersToUse.maxSqft) query = query.lte('sqft', filtersToUse.maxSqft);
      
      if (searchQuery.trim()) {
        query = query.or(`address.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%,zip.ilike.%${searchQuery}%`);
      }
      
      // Apply sorting
            if (filtersToUse.sortBy === 'price_asc') {
        query = query.order('price', { ascending: true, nullsFirst: false });
            } else if (filtersToUse.sortBy === 'price_desc') {
        query = query.order('price', { ascending: false, nullsFirst: false });
            } else if (filtersToUse.sortBy === 'sqft_asc') {
        query = query.order('sqft', { ascending: true, nullsFirst: false });
            } else if (filtersToUse.sortBy === 'sqft_desc') {
        query = query.order('sqft', { ascending: false, nullsFirst: false });
      } else {
        query = query.order('created_at', { ascending: false, nullsFirst: false });
      }

      const { data: boundedData, error: boundedError } = await query;
      
      if (boundedError) {
        logger.error('Bounded query error:', boundedError);
        return;
      }
      
      if (boundedData) {
        const rows = boundedData as unknown as Row[];
        
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
            bedrooms: toNum(r.beds) ?? toNum(r.bedrooms), // Also include for backward compatibility
            bathrooms: toNum(r.baths), // Also include for backward compatibility
            home_sqft: toNum(r.sqft), // Also include for backward compatibility
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
          };
        });
        
        const pts: MapPoint[] = [];
        for (const r of rows) {
                if (r.latitude && r.longitude) {
                  pts.push({
                    id: String(r.id),
                    lat: toNum(r.latitude) || 0,
                    lng: toNum(r.longitude) || 0,
                    price: toNum(r.price),
                    featured: r.featured,
                    featured_until: r.featured_until
                  });
                }
              }
              
              setAllListings(items as ListItem[]);
              setAllPoints(pts);
            }
          } catch (err) {
            logger.error('Error in spatial filtering:', err);
          }
        } else {
          logger.log('Bounds unchanged (within threshold), skipping update to prevent flicker');
        }
      } catch (err) {
        logger.error('Error in outer try block:', err);
      } finally {
        // Always reset the processing flag
        isProcessingBoundsRef.current = false;
      }
    }, 1000);
  }, [searchQuery, mapBounds]);

  const handleMapBoundsChange = useCallback(async (bounds: unknown) => {
    return handleMapBoundsChangeWithFilters(bounds, filters);
  }, [handleMapBoundsChangeWithFilters, filters]);

  // Load listings function (can be called from retry button)
  const loadListings = useCallback(async () => {
    let isMounted = true;

    const loadListingsInner = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        setError(null);
        setShowSkeleton(true);
        
        // Show skeleton for minimum 800ms
        const skeletonTimeout = setTimeout(() => {
          if (isMounted) setShowSkeleton(false);
        }, 800);
        
        logger.log('Loading listings from API...');
        console.log('🏠 Loading listings from API...');
        
        // Use API endpoint with timeout and error handling
        const startTime = Date.now();
        const response = await fetch('/api/listings?limit=40&offset=0', {
          cache: 'no-store',
          signal: AbortSignal.timeout(10000) // 10s client timeout
        });

        const elapsed = Date.now() - startTime;
        console.log(`⏱️ API response received in ${elapsed}ms`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}` } }));
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const result = await response.json();
        
        if (result.error) {
          console.error('❌ API returned error:', result.error);
          if (isMounted) {
            setError({ message: result.error.message, code: result.error.code });
            setAllListings([]);
            setAllPoints([]);
            setLoading(false);
          }
          return;
        }

        console.log(`✅ Loaded ${result.items?.length || 0} listings in ${elapsed}ms`);
        
        clearTimeout(skeletonTimeout);
        if (isMounted) setShowSkeleton(false);

        if (!isMounted) return;

        const data = result.items as Row[] | null;

        if (data && Array.isArray(data) && data.length > 0) {
          const rows = data as unknown as Row[];
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
              images: Array.isArray(r.images) ? r.images : r.images ? [r.images] : [],
              latitude: toNum(r.latitude),
              longitude: toNum(r.longitude),
              created_at: r.created_at ?? undefined,
              updated_at: r.updated_at ?? undefined,
              featured: r.featured ?? false,
              featured_until: r.featured_until ?? undefined
            };
          });

          const pts: MapPoint[] = [];
          for (const r of rows) {
            if (r.latitude && r.longitude) {
              pts.push({
                id: String(r.id),
                lat: toNum(r.latitude) || 0,
                lng: toNum(r.longitude) || 0,
                price: toNum(r.price),
                featured: r.featured,
                featured_until: r.featured_until
              });
            }
          }

          if (isMounted) {
            setAllListings(items as ListItem[]);
            setAllPoints(pts);
            setLoading(false);
          }
        } else {
          if (isMounted) {
            setAllListings([]);
            setAllPoints([]);
            setLoading(false);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        logger.error('Error loading listings:', err);
        console.error('❌ Error loading listings:', err);
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to load listings';
        if (isMounted) {
          setError({ message: errorMessage, code: 'FETCH_ERROR' });
          setAllListings([]);
          setAllPoints([]);
          setLoading(false);
          setShowSkeleton(false);
        }
      }
    };

    loadListingsInner();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  // Load listings on mount
  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Handle geocoding events from search bar
  useEffect(() => {
    const handleGeocode = async (e: Event) => {
      const customEvent = e as CustomEvent<{ q: string }>;
      const query = customEvent.detail.q;
      
      if (!query) return;
      
      try {
        const response = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: query })
        });
        
        if (!response.ok) {
          logger.error('Geocoding failed');
          return;
        }
        
        const data = await response.json();
        if (data.location) {
          // Move map to geocoded location
          setMapCenter({ lat: data.location.lat, lng: data.location.lng });
          setMapZoom(12); // Zoom to city level
          // Also update search query to show the formatted address
          setSearchQuery(data.formatted_address || query);
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

    // Apply text search
    if (searchQuery.trim()) {
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
  }, [allListings, searchQuery, filters]);

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

  // Memoize map component to prevent re-renders
  const MapComponent = useMemo(() => {
    const MapComponentInner = (props: Record<string, unknown>) => (
      <GoogleMapWrapper
        {...props}
        points={allPoints}
        onBoundsChange={handleMapBoundsChange}
        center={mapCenter}
        zoom={mapZoom}
      />
    );
    MapComponentInner.displayName = 'MapComponent';
    return MapComponentInner;
  }, [allPoints, handleMapBoundsChange, mapCenter, mapZoom]);

  // Show skeleton or error state
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
          <FiltersBar value={filters} onChange={setFilters} />
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
              loadListings();
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
          MapComponent={MapComponent}
        />
      </div>
    </div>
  );
}
