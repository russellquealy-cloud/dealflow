'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import FiltersBar, { type Filters } from '@/components/FiltersBar';
import ListingsSplitClient, { type MapPoint, type ListItem } from '@/components/ListingsSplitClient';
import { supabase } from '@/supabase/client';

const GoogleMapWrapper = dynamic(() => import('@/components/GoogleMapWrapper'), { ssr: false });

type Row = {
  id: string;
  address: string | null;
  title?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  price?: number | string | null;
  bedrooms?: number | null;
  beds?: number | null;
  bathrooms?: number | null;
  baths?: number | null;
  home_sqft?: number | null;
  square_feet?: number | null;
  sqft?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  lon?: number | null; // Added for spatial function
  images?: string[] | null;
  image_url?: string | null;
  cover_image_url?: string | null;
  arv?: number | string | null;
  repairs?: number | string | null;
  repair_costs?: number | string | null;
  spread?: number | string | null;
  roi?: number | string | null;
  lot_size?: number | null;
  garage?: number | null;
  year_built?: number | null;
  assignment_fee?: number | string | null;
  description?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  contact_name?: string | null;
  owner_phone?: string | null;
  owner_email?: string | null;
  owner_name?: string | null;
};

// Removed SpatialRow type as it's no longer used - we query listings table directly

const toNum = (v: unknown): number | undefined => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

export default function ListingsPage() {
  const [filters, setFilters] = useState<Filters>({
    minBeds: null, maxBeds: null,
    minBaths: null, maxBaths: null,
    minPrice: null, maxPrice: null,
    minSqft: null, maxSqft: null,
    sortBy: 'newest',
  });

  const [allListings, setAllListings] = useState<ListItem[]>([]);
  const [allPoints, setAllPoints] = useState<MapPoint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapBounds, setMapBounds] = useState<{ south: number; north: number; west: number; east: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load all listings from database with filtering
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Only set loading if we haven't loaded yet
      if (!hasLoaded) {
        setLoading(true);
      }
      
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
        
       // Don't apply map bounds filtering on initial load - let the map emit bounds first
       // This prevents filtering out all listings when the map hasn't properly initialized
        
        // Apply filters
        if (filters.minPrice) {
          query = query.gte('price', filters.minPrice);
        }
        if (filters.maxPrice) {
          query = query.lte('price', filters.maxPrice);
        }
        if (filters.minBeds) {
          query = query.gte('beds', filters.minBeds);
        }
        if (filters.maxBeds) {
          query = query.lte('beds', filters.maxBeds);
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
        
        // Apply search query if provided
        if (searchQuery.trim()) {
          query = query.or(`address.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%,zip.ilike.%${searchQuery}%`);
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
        
        if (error) {
          console.error('❌ Database error:', error);
          setLoading(false);
          return;
        }
        if (!data || cancelled) {
          if (!hasLoaded) {
            setLoading(false);
          }
          return;
        }

      const rows = data as unknown as Row[];

      const items: ListItem[] = rows.map((r) => {
        const price = toNum(r.price);
        const arv = toNum(r.arv);
        const repairs = toNum(r.repairs ?? r.repair_costs);
        const spread = toNum(r.spread) ?? (arv !== undefined && price !== undefined && repairs !== undefined ? arv - price - repairs : undefined);
        const roi = toNum(r.roi) ?? (spread !== undefined && price !== undefined ? Math.round((spread / price) * 100) : undefined);

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
        };
      });

        const pts: MapPoint[] = [];
        for (const r of rows) {
          // Try multiple column name variations for latitude/longitude
          const lat = r.latitude ?? r.lat;
          const lng = r.longitude ?? r.lng ?? r.lon;
          
          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
            pts.push({ id: String(r.id), lat, lng, price: toNum(r.price) });
          }
        }
        
        if (!cancelled) {
          // If no data found, create some test data
          if (items.length === 0) {
            console.log('⚠️ No listings found, creating test data');
            const testListings: ListItem[] = [
              {
                id: 'test-1',
                title: 'Beautiful Historic Home',
                address: '123 E Broadway Blvd',
                city: 'Tucson',
                state: 'AZ',
                zip: '85701',
                price: 250000,
                bedrooms: 3,
                bathrooms: 2,
                home_sqft: 1800,
                lot_size: 0.25,
                garage: 1,
                year_built: 1920,
                description: 'Charming historic home in downtown Tucson',
                images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'],
                cover_image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
              },
              {
                id: 'test-2',
                title: 'Modern Desert Oasis',
                address: '456 N Campbell Ave',
                city: 'Tucson',
                state: 'AZ',
                zip: '85719',
                price: 450000,
                bedrooms: 4,
                bathrooms: 3,
                home_sqft: 2400,
                lot_size: 0.5,
                garage: 1,
                year_built: 2015,
                description: 'Stunning modern home with mountain views',
                images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'],
                cover_image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
              },
              {
                id: 'test-3',
                title: 'Mountain View Ranch',
                address: '789 E Speedway Blvd',
                city: 'Tucson',
                state: 'AZ',
                zip: '85719',
                price: 350000,
                bedrooms: 3,
                bathrooms: 2,
                home_sqft: 2000,
                lot_size: 0.3,
                garage: 1,
                year_built: 1995,
                description: 'Spacious ranch with mountain views',
                images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'],
                cover_image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
              }
            ];
            
            const testPoints: MapPoint[] = [
              { id: 'test-1', lat: 32.2226, lng: -110.9747, price: 250000 },
              { id: 'test-2', lat: 32.2326, lng: -110.9847, price: 450000 },
              { id: 'test-3', lat: 32.2426, lng: -110.9947, price: 350000 }
            ];
            
            setAllListings(testListings);
            setAllPoints(testPoints);
          } else {
            setAllListings(items);
            setAllPoints(pts);
            
            // If no points found, create some test points for debugging
            if (pts.length === 0 && items.length > 0) {
              const testPoints: MapPoint[] = items.slice(0, 3).map((item, index) => ({
                id: item.id,
                lat: 32.2226 + (index * 0.01), // Tucson area with slight offset
                lng: -110.9747 + (index * 0.01),
                price: toNum(item.price)
              }));
              setAllPoints(testPoints);
            }
          }
          
          if (!hasLoaded) {
            setLoading(false);
            setHasLoaded(true);
          }
        }
      } catch (err) {
        console.error('Error loading listings:', err);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
      }, [filters, searchQuery, mapBounds, hasLoaded]); // Re-added dependencies for filtering

  // No need for manual filtering - spatial function handles it
  const filteredListings = allListings;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      console.log('Searching for:', searchQuery);
      
      // Use OpenStreetMap Nominatim for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const results = await response.json();
      
      if (results && results.length > 0) {
        const { lat, lon, display_name } = results[0];
        console.log('Geocoding result:', { lat, lon, display_name });
        
        // Update map center to search result
        // We'll need to pass this to the map component
        const searchCenter = { lat: parseFloat(lat), lng: parseFloat(lon) };
        
        // Store search center for map to use
        localStorage.setItem('dealflow-search-center', JSON.stringify(searchCenter));
        
        // Trigger a reload with the search query
        setSearchQuery(searchQuery);
      } else {
        console.log('No geocoding results found for:', searchQuery);
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    }
  };

  const handleReset = () => {
    // Clear cache and reload
    localStorage.removeItem('dealflow-listings');
    localStorage.removeItem('dealflow-points');
    setHasLoaded(false);
    setLoading(true);
  };

  // Debounce bounds changes to prevent excessive API calls
  const boundsChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleMapBoundsChange = useCallback(async (bounds: unknown) => {
    // Clear any existing timeout
    if (boundsChangeTimeoutRef.current) {
      clearTimeout(boundsChangeTimeoutRef.current);
    }
    
    // Debounce the bounds change by 500ms
    boundsChangeTimeoutRef.current = setTimeout(async () => {
    // Validate bounds to prevent undefined values
    if (!bounds || 
        typeof bounds !== 'object' ||
        !bounds ||
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
      return;
    }
    
    const typedBounds = bounds as { south: number; north: number; west: number; east: number };
    
    // Always update map bounds for UI state
    setMapBounds(typedBounds);
    
    // Calculate bounds size for better filtering logic
    const latRange = Math.abs(typedBounds.north - typedBounds.south);
    const lngRange = Math.abs(typedBounds.east - typedBounds.west);
    const boundsSize = latRange + lngRange;
    
    // More intelligent filtering based on bounds size
    // Allow city-level viewing (boundsSize ~2-5 degrees)
    // Prevent country-level viewing (boundsSize > 25 degrees)
    // Allow point-level viewing for detailed inspection (boundsSize < 0.005 degrees)
    if (boundsSize > 25) {
      // For very large bounds, don't filter - show all listings
      return;
    }
    
    // For very small bounds, still filter but with a buffer
    // const buffer = boundsSize < 0.01 ? 0.01 : 0; // Add buffer for small bounds
    
    // Filter listings by map bounds - query the database with spatial constraints
    try {
      let query = supabase
        .from('listings')
        .select('*, latitude, longitude')
        .gte('latitude', typedBounds.south)
        .lte('latitude', typedBounds.north)
        .gte('longitude', typedBounds.west)
        .lte('longitude', typedBounds.east);
      
      // Apply existing filters
      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
      if (filters.minBeds) query = query.gte('beds', filters.minBeds);
      if (filters.maxBeds) query = query.lte('beds', filters.maxBeds);
      if (filters.minBaths) query = query.gte('baths', filters.minBaths);
      if (filters.maxBaths) query = query.lte('baths', filters.maxBaths);
      if (filters.minSqft) query = query.gte('sqft', filters.minSqft);
      if (filters.maxSqft) query = query.lte('sqft', filters.maxSqft);
      
      if (searchQuery.trim()) {
        query = query.or(`address.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%,zip.ilike.%${searchQuery}%`);
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
        query = query.order('created_at', { ascending: false, nullsFirst: false });
      }

      const { data: boundedData, error: boundedError } = await query;
      
      if (boundedError) {
        console.error('Bounded query error:', boundedError);
        return;
      }
      
      if (boundedData) {
        const rows = boundedData as unknown as Row[];
        
        const items: ListItem[] = rows.map((r) => {
          const price = toNum(r.price);
          const arv = toNum(r.arv);
          const repairs = toNum(r.repairs ?? r.repair_costs);
          const spread = toNum(r.spread) ?? (arv !== undefined && price !== undefined && repairs !== undefined ? arv - price - repairs : undefined);
          const roi = toNum(r.roi) ?? (spread !== undefined && price !== undefined ? Math.round((spread / price) * 100) : undefined);

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
          };
        });
        
        const pts: MapPoint[] = [];
        for (const r of rows) {
          const lat = r.latitude ?? r.lat;
          const lng = r.longitude ?? r.lng ?? r.lon;
          
          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
            pts.push({ id: String(r.id), lat, lng, price: toNum(r.price) });
          }
        }
        
        setAllListings(items);
        setAllPoints(pts);
      }
    } catch (error) {
      console.error('❌ Error fetching bounded data:', error);
    }
    }, 500); // Close setTimeout with 500ms delay
  }, [filters, searchQuery]); // Add dependencies for useCallback

  // Memoize map component to prevent re-renders
  const MapComponent = useMemo(() => {
    const MapComponent = (props: { points: MapPoint[]; onBoundsChange?: (bounds: unknown) => void }) => {
      return <GoogleMapWrapper {...props} />;
    };
    MapComponent.displayName = 'MapComponent';
    return MapComponent;
  }, []);

  // Only show loading on initial load, not when navigating back
  if (loading && !hasLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 65px)' }}>
        <div>Loading listings...</div>
      </div>
    );
  }

  // Debug: Show what we have (only in development) - reduced frequency
  if (process.env.NODE_ENV === 'development' && hasLoaded) {
    console.log('=== RENDER DEBUG ===');
    console.log('Loading:', loading);
    console.log('Has loaded:', hasLoaded);
    console.log('All listings:', allListings.length);
    console.log('All points:', allPoints.length);
    console.log('Filtered listings:', filteredListings.length);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* header + search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 lg:px-6 lg:py-4 gap-4 flex-shrink-0 bg-white z-30 relative">
        <h2 className="text-2xl lg:text-3xl font-bold m-0">Find Deals</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <input 
            aria-label="Search city or address" 
            placeholder="Search city or address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 h-10 border border-gray-300 rounded-lg px-3 text-sm lg:text-base" 
          />
          <div className="flex gap-2">
            <button 
              onClick={handleSearch}
              className="h-10 px-4 border border-gray-800 rounded-lg bg-gray-800 text-white text-sm font-medium"
            >
              Search
            </button>
            <button 
              onClick={handleReset}
              className="h-10 px-3 border border-gray-200 rounded-lg bg-white text-gray-700 text-sm font-medium"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* filters */}
      <div className="px-4 lg:px-6 py-3 border-b border-gray-200 flex-shrink-0 bg-white z-20 relative shadow-sm">
        <FiltersBar value={filters} onChange={setFilters} />
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