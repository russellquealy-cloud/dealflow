'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/supabase/client';
import FiltersBar, { type Filters } from '@/components/FiltersBar';
import ListingsSplitClient from '@/components/ListingsSplitClient';
import GoogleMapWrapper from '@/components/GoogleMapWrapper';
import SearchBarClient from '@/components/SearchBarClient';
import { toNum } from '@/lib/format';
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
  repair_costs?: number;
  assignment_fee?: number;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [mapBounds, setMapBounds] = useState<{ south: number; north: number; west: number; east: number } | null>(null);
  const [activeMapBounds, setActiveMapBounds] = useState(false);
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
      console.log('Already processing bounds, ignoring duplicate call');
          return;
        }
        
    // Clear any existing timeout
    if (boundsChangeTimeoutRef.current) {
      clearTimeout(boundsChangeTimeoutRef.current);
    }

    // Debounce the bounds change by 1000ms
    boundsChangeTimeoutRef.current = setTimeout(async () => {
      // Set processing flag
      isProcessingBoundsRef.current = true;

      try {
        // Handle bounds clearing (null)
        if (bounds === null) {
          console.log('Map drawing cleared. Maintaining current map view bounds.');
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
          console.log('Invalid bounds received, skipping spatial filter');
      return;
    }
    
    const typedBounds = bounds as { south: number; north: number; west: number; east: number };
    
        // Only update state if bounds actually changed to prevent infinite loops
        const threshold = 0.01; // About 1 kilometer
        if (!mapBounds || 
            Math.abs(mapBounds.south - typedBounds.south) > threshold ||
            Math.abs(mapBounds.north - typedBounds.north) > threshold ||
            Math.abs(mapBounds.west - typedBounds.west) > threshold ||
            Math.abs(mapBounds.east - typedBounds.east) > threshold) {
          
          console.log('Bounds changed significantly, applying spatial filter for bounds:', typedBounds);
          
          // Update bounds state
          setMapBounds(typedBounds);
          setActiveMapBounds(true);

    try {
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
        console.error('Bounded query error:', boundedError);
        return;
      }
      
      if (boundedData) {
        const rows = boundedData as unknown as Row[];
        
              const items = rows.map((r) => {
          const price = toNum(r.price);
          const arv = toNum(r.arv);
          const repairs = toNum(r.repairs ?? r.repair_costs);
                const spread = arv && price ? arv - price - (toNum(r.assignment_fee) || 0) : undefined;
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
            console.error('Error in spatial filtering:', err);
          }
        } else {
          console.log('Bounds unchanged (within threshold), skipping update to prevent flicker');
        }
      } catch (err) {
        console.error('Error in outer try block:', err);
      } finally {
        // Always reset the processing flag
        isProcessingBoundsRef.current = false;
      }
    }, 1000);
  }, [searchQuery, mapBounds]);

  const handleMapBoundsChange = useCallback(async (bounds: unknown) => {
    return handleMapBoundsChangeWithFilters(bounds, filters);
  }, [handleMapBoundsChangeWithFilters, filters]);

  // Load all listings on mount
  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('listings')
          .select('*, latitude, longitude')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading listings:', error);
          return;
        }

        if (data) {
          const rows = data as unknown as Row[];
          const items = rows.map((r) => {
            const price = toNum(r.price);
            const arv = toNum(r.arv);
            const repairs = toNum(r.repairs ?? r.repair_costs);
            const spread = arv && price ? arv - price - (toNum(r.assignment_fee) || 0) : undefined;
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
        console.error('Error loading listings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
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
      console.log('🔄 Map bounds active, triggering refresh with new filters');
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
      />
    );
    MapComponentInner.displayName = 'MapComponent';
    return MapComponentInner;
  }, [allPoints, handleMapBoundsChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading listings...</div>
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
