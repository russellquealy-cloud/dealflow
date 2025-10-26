'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/supabase/client';
import FiltersBar, { type Filters } from '@/components/FiltersBar';
import ListingsSplitClient from '@/components/ListingsSplitClient';
import GoogleMapWrapper from '@/components/GoogleMapWrapper';
import SearchBarClient from '@/components/SearchBarClient';
import LocationSearch from '@/components/LocationSearch';
import PostDealButton from '@/components/PostDealButton';
import { toNum } from '@/lib/format';
import type { ListItem, MapPoint } from '@/types';

interface Row {
  id: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number;
  beds?: number;
  bedrooms?: number;
  baths?: number;
  sqft?: number;
  lot_size?: number;
  garage?: number;
  year_built?: number;
  assignment_fee?: number;
  description?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_name?: string;
  images?: string[];
  cover_image_url?: string;
  image_url?: string;
  arv?: number;
  repairs?: number;
  repair_costs?: number;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  lon?: number;
  created_at?: string;
  featured?: boolean;
  featured_until?: string;
}

export default function ListingsPage() {
  const [filters, setFilters] = useState<Filters>(() => ({
    minBeds: null, maxBeds: null,
    minBaths: null, maxBaths: null,
    minPrice: null, maxPrice: null,
    minSqft: null, maxSqft: null,
    sortBy: 'newest',
  }));

  // Debug filter changes
  const handleFiltersChange = (newFilters: Filters) => {
    console.log('🔄 LISTINGS PAGE: Filter change received:', {
      old: filters,
      new: newFilters,
      maxBedsChanged: filters.maxBeds !== newFilters.maxBeds,
      sortByChanged: filters.sortBy !== newFilters.sortBy,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // If only sort changed and map bounds are active, force a refresh with new filters
    if (filters.sortBy !== newFilters.sortBy && activeMapBounds && mapBounds) {
      console.log('🔄 Sort changed with active map bounds, forcing immediate refresh with new sort:', newFilters.sortBy);
      // Apply the new filters first
      setFilters(newFilters);
      // Then immediately trigger map bounds refresh with the new filters
      setTimeout(() => {
        handleMapBoundsChangeWithFilters(mapBounds, newFilters);
      }, 50);
    } else {
      setFilters(newFilters);
    }
  };

  const [allListings, setAllListings] = useState<ListItem[]>([]);
  const [allPoints, setAllPoints] = useState<MapPoint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapBounds, setMapBounds] = useState<{ south: number; north: number; west: number; east: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMapBounds, setActiveMapBounds] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load all listings from database with filtering
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // If map bounds are currently active, this useEffect should not interfere.
      // The map bounds handler is responsible for setting listings in that case.
      if (activeMapBounds) {
        console.log('Main load skipped: Map bounds are active. Triggering map bounds refresh to apply new filters.');
        console.log('🔍 Current mapBounds:', mapBounds);
        console.log('🔍 handleMapBoundsChange function:', typeof handleMapBoundsChange);
        // Trigger the map bounds handler to re-apply filters with current bounds
        if (mapBounds) {
          console.log('✅ Calling handleMapBoundsChange with bounds:', mapBounds);
          handleMapBoundsChange(mapBounds);
        } else {
          console.log('❌ mapBounds is null, cannot refresh');
        }
        return;
      }
      
      // Set loading state
      setLoading(true);
      
      try {
        // Start with a simple query to test connection
        const { error: testError } = await supabase.from('listings').select('id').limit(1);
        
        if (testError) {
          console.error('❌ Basic connection failed:', testError);
          setLoading(false);
          return;
        }
        
        // Build the query directly from the listings table
        let query = supabase
          .from('listings')
          .select('*, latitude, longitude');
        
        // Apply filters
        if (filters.minPrice) {
          query = query.gte('price', filters.minPrice);
        }
        if (filters.maxPrice) {
          query = query.lte('price', filters.maxPrice);
        }
        if (filters.minBeds) {
          // Check both beds and bedrooms fields
          query = query.or(`beds.gte.${filters.minBeds},bedrooms.gte.${filters.minBeds}`);
        }
        if (filters.maxBeds) {
          console.log('🔍 Applying maxBeds filter:', filters.maxBeds);
          // Since we cleaned the data, beds = bedrooms, so we can use simple filter
          query = query.lte('bedrooms', filters.maxBeds);
        }
        if (filters.minBaths) {
          query = query.gte('baths', filters.minBaths);
        }
        if (filters.maxBaths) {
          query = query.lte('baths', filters.maxBaths);
        }
        if (filters.minSqft) {
          query = query.gte('sqft', filters.minSqft);
        }
        if (filters.maxSqft) {
          query = query.lte('sqft', filters.maxSqft);
        }

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%`);
        }

        // Apply sorting
        if (filters.sortBy === 'price_asc') {
          query = query.order('price', { ascending: true, nullsFirst: false });
        } else if (filters.sortBy === 'price_desc') {
          query = query.order('price', { ascending: false, nullsFirst: false });
        } else if (filters.sortBy === 'sqft_asc') {
          query = query.order('sqft', { ascending: true, nullsFirst: false });
        } else if (filters.sortBy === 'sqft_desc') {
          query = query.order('sqft', { ascending: false, nullsFirst: false });
        } else {
          // Default to newest
          query = query.order('created_at', { ascending: false, nullsFirst: false });
        }

        const { data, error } = await query;

        if (cancelled) return;

        if (error) {
          console.error('Error loading listings:', error);
          setLoading(false);
          return;
        }

        const items: ListItem[] = (data || []).map((r: any) => {
          const price = toNum(r.price);
          const arv = toNum(r.arv);
          const repairs = toNum(r.repairs || r.repair_costs);
          const spread = arv && price ? arv - price - (r.assignment_fee || 0) : undefined;
          const roi = arv && price ? ((arv - price) / price) * 100 : undefined;

          return {
            id: String(r.id),
            title: r.title ?? undefined,
            address: r.address ?? undefined,
            city: r.city ?? undefined,
            state: r.state ?? undefined,
            zip: r.zip ?? undefined,
            price,
            bedrooms: r.beds ?? undefined,
            bathrooms: r.baths ?? undefined,
            home_sqft: r.sqft ?? undefined,
            lot_size: toNum(r.lot_size),
            garage: r.garage ?? undefined,
            year_built: r.year_built ?? undefined,
            assignment_fee: toNum(r.assignment_fee),
            description: r.description ?? undefined,
            owner_phone: r.contact_phone ?? undefined,
            owner_email: r.contact_email ?? undefined,
            owner_name: r.contact_name ?? undefined,
            images: Array.isArray(r.images) ? r.images : undefined,
            cover_image_url: r.cover_image_url ?? r.image_url ?? undefined,
            arv,
            repairs,
            spread,
            roi,
            featured: r.featured,
            featured_until: r.featured_until
          };
        });
        setAllListings(items);

        const pts: MapPoint[] = [];
        for (const r of data || []) {
          const lat = r.latitude ?? r.lat;
          const lng = r.longitude ?? r.lng ?? r.lon;
          
          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
            pts.push({ 
              id: String(r.id), 
              lat, 
              lng, 
              price: toNum(r.price),
              featured: r.featured,
              featured_until: r.featured_until
            });
          }
        }
        
        if (!cancelled) {
          setAllPoints(pts);
          setLoading(false);
          setHasLoaded(true);
        }
        
      } catch (err) {
        console.error('Error loading listings:', err);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [filters.minPrice, filters.maxPrice, filters.minBeds, filters.maxBeds, filters.minBaths, filters.maxBaths, filters.minSqft, filters.maxSqft, filters.sortBy, searchQuery, activeMapBounds]);

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
    
    // Debounce the bounds change by 1000ms (increased from 500ms)
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
        // Use a much larger threshold to prevent any tiny changes from triggering updates
        const threshold = 0.01; // About 1 kilometer - much more aggressive
        if (!mapBounds || 
            Math.abs(mapBounds.south - typedBounds.south) > threshold ||
            Math.abs(mapBounds.north - typedBounds.north) > threshold ||
            Math.abs(mapBounds.west - typedBounds.west) > threshold ||
            Math.abs(mapBounds.east - typedBounds.east) > threshold) {
          
          console.log('Bounds changed significantly, applying spatial filter for bounds:', typedBounds);
          
          // Update bounds state without triggering re-renders during processing
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
        
        // Apply existing filters using the provided filters
        if (filtersToUse.minPrice) query = query.gte('price', filtersToUse.minPrice);
        if (filtersToUse.maxPrice) query = query.lte('price', filtersToUse.maxPrice);
        if (filtersToUse.minBeds) {
          query = query.or(`beds.gte.${filtersToUse.minBeds},bedrooms.gte.${filtersToUse.minBeds}`);
        }
        if (filtersToUse.maxBeds) {
          console.log('🔍 Map bounds: Applying maxBeds filter:', filtersToUse.maxBeds);
          query = query.lte('bedrooms', filtersToUse.maxBeds);
        }
        if (filtersToUse.minBaths) query = query.gte('baths', filtersToUse.minBaths);
        if (filtersToUse.maxBaths) query = query.lte('baths', filtersToUse.maxBaths);
        if (filtersToUse.minSqft) query = query.gte('sqft', filtersToUse.minSqft);
        if (filtersToUse.maxSqft) query = query.lte('sqft', filtersToUse.maxSqft);
        
        if (searchQuery.trim()) {
          query = query.or(`address.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%,zip.ilike.%${searchQuery}%`);
        }
        
        // Apply sorting using the provided filters
        console.log('🔄 Map bounds: Applying sorting:', filtersToUse.sortBy);
        if (filtersToUse.sortBy === 'price_asc') {
          console.log('📊 Sorting by price ascending');
          query = query.order('price', { ascending: true, nullsFirst: false });
        } else if (filtersToUse.sortBy === 'price_desc') {
          console.log('📊 Sorting by price descending');
          query = query.order('price', { ascending: false, nullsFirst: false });
        } else if (filtersToUse.sortBy === 'sqft_asc') {
          console.log('📊 Sorting by sqft ascending');
          query = query.order('sqft', { ascending: true, nullsFirst: false });
        } else if (filtersToUse.sortBy === 'sqft_desc') {
          console.log('📊 Sorting by sqft descending');
          query = query.order('sqft', { ascending: false, nullsFirst: false });
        } else {
          console.log('📊 Sorting by newest (default)');
          query = query.order('created_at', { ascending: false, nullsFirst: false });
        }

        const { data: boundedData, error: boundedError } = await query;
        
        if (boundedError) {
          console.error('Bounded query error:', boundedError);
          return;
        }
        
        if (boundedData) {
          const rows = boundedData as unknown as Row[];
          
          console.log('📊 Query results for sorting debug:', rows.map(item => ({
            id: item.id,
            title: item.title,
            price: item.price,
            sqft: item.sqft,
            created_at: item.created_at
          })));
          
          console.log(`Found ${rows.length} listings within bounds`);
          
          const items: ListItem[] = rows.map((r) => {
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
              bedrooms: r.bedrooms ?? r.beds ?? undefined,
              bathrooms: r.baths ?? undefined,
              home_sqft: toNum(r.sqft),
              lot_size: toNum(r.lot_size),
              garage: r.garage ?? undefined,
              year_built: r.year_built ?? undefined,
              assignment_fee: toNum(r.assignment_fee),
              description: r.description ?? undefined,
              owner_phone: r.contact_phone ?? undefined,
              owner_email: r.contact_email ?? undefined,
              owner_name: r.contact_name ?? undefined,
              images: Array.isArray(r.images) ? r.images : undefined,
              cover_image_url: r.cover_image_url ?? r.image_url ?? undefined,
              arv,
              repairs,
              spread,
              roi,
              featured: r.featured,
              featured_until: r.featured_until
            };
          });
          setAllListings(items);

          const pts: MapPoint[] = [];
          for (const r of rows) {
            const lat = r.latitude ?? r.lat;
            const lng = r.longitude ?? r.lng ?? r.lon;
            
            if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
              pts.push({ 
                id: String(r.id), 
                lat, 
                lng, 
                price: toNum(r.price),
                featured: r.featured,
                featured_until: r.featured_until
              });
            }
          }
          setAllPoints(pts);
        } else {
          console.log('Bounds unchanged (within threshold), skipping update to prevent flicker');
        }
      } catch (err) {
        console.error('Error in spatial filtering:', err);
      } finally {
        // Always reset the processing flag
        isProcessingBoundsRef.current = false;
      }
    }, 1000); // Increased debounce to 1000ms
  }, [searchQuery]);
  
  const handleMapBoundsChange = useCallback(async (bounds: unknown) => {
    return handleMapBoundsChangeWithFilters(bounds, filters);
  }, [handleMapBoundsChangeWithFilters, filters]);

  // Memoize map component to prevent re-renders
  const MapComponent = useMemo(() => {
    return (props: any) => (
      <GoogleMapWrapper
        {...props}
        points={allPoints}
        onBoundsChange={handleMapBoundsChange}
        onPolygonComplete={(polygon) => {
          const paths = polygon.getPath().getArray().map(latLng => ({
            lat: latLng.lat(),
            lng: latLng.lng(),
          }));
          console.log('Polygon completed with paths:', paths);
        }}
      />
    );
  }, [allPoints, handleMapBoundsChange]);

  // Filter listings for display in the list view
  const filteredListings = useMemo(() => {
    // If map bounds are active, allListings already contains the spatially filtered data
    let currentListings = [...allListings];

    // Apply client-side sorting if Supabase didn't handle it or for additional client-side control
    if (filters.sortBy === 'price_asc') {
      currentListings.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (filters.sortBy === 'price_desc') {
      currentListings.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (filters.sortBy === 'sqft_asc') {
      currentListings.sort((a, b) => (a.home_sqft ?? 0) - (b.home_sqft ?? 0));
    } else if (filters.sortBy === 'sqft_desc') {
      currentListings.sort((a, b) => (b.home_sqft ?? 0) - (a.home_sqft ?? 0));
    }

    return currentListings;
  }, [allListings, filters.sortBy]);

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
          listings={filteredListings}
          onBoundsChange={handleMapBoundsChange}
          MapComponent={MapComponent} 
        />
      </div>
    </div>
  );
}
