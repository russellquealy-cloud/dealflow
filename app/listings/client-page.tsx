'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/supabase/client';
import FiltersBar, { type Filters } from '@/components/FiltersBar';
import ListingsSplitClient from '@/components/ListingsSplitClient';
import GoogleMapWrapper from '@/components/GoogleMapWrapper';
import SearchBarClient from '@/components/SearchBarClient';
import PostDealButton from '@/components/PostDealButton';
import { toNum } from '@/lib/format';
import type { ListItem, MapPoint } from '@/components/ListingsSplitClient';

interface Props {
  initialListings?: ListItem[];
  initialPoints?: MapPoint[];
}

interface ListingData {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  home_sqft?: number;
  created_at?: string;
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
  garage?: boolean;
  property_type?: string;
  description?: string;
  owner_phone?: string;
  owner_email?: string;
  owner_name?: string;
  images?: string[];
  cover_image_url?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  updated_at?: string;
  featured?: boolean;
  featured_until?: string;
}

export default function ListingsClient({ initialListings = [], initialPoints = [] }: Props) {
  const [allListings, setAllListings] = useState<ListItem[]>(initialListings);
  const [allPoints, setAllPoints] = useState<MapPoint[]>(initialPoints);
  const [loading, setLoading] = useState(initialListings.length === 0);
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

  // Debounce bounds changes to prevent excessive updates
  const boundsChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Optimized map bounds change handler - CLIENT-SIDE ONLY
  const handleMapBoundsChangeWithFilters = useCallback((bounds: unknown) => {
    // Clear any existing timeout
    if (boundsChangeTimeoutRef.current) {
      clearTimeout(boundsChangeTimeoutRef.current);
    }

    // Debounce the bounds change by 150ms (very fast response)
    boundsChangeTimeoutRef.current = setTimeout(() => {
      try {
        // Handle bounds clearing (null)
        if (bounds === null) {
          setActiveMapBounds(false);
          setMapBounds(null);
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
          return;
        }

        const typedBounds = bounds as { south: number; north: number; west: number; east: number };
        
        // Only update state if bounds actually changed to prevent infinite loops
        const threshold = 0.005; // About 500 meters - more sensitive
        if (!mapBounds || 
            Math.abs(mapBounds.south - typedBounds.south) > threshold ||
            Math.abs(mapBounds.north - typedBounds.north) > threshold ||
            Math.abs(mapBounds.west - typedBounds.west) > threshold ||
            Math.abs(mapBounds.east - typedBounds.east) > threshold) {
          
          // Update bounds state - this will trigger the filteredListings useMemo
          setMapBounds(typedBounds);
          setActiveMapBounds(true);
        }
      } catch (err) {
        console.error('Error in map bounds change:', err);
      }
    }, 150); // Very fast response time
  }, [mapBounds]);

  const handleMapBoundsChange = useCallback((bounds: unknown) => {
    return handleMapBoundsChangeWithFilters(bounds);
  }, [handleMapBoundsChangeWithFilters]);

  // Load all listings on mount (only if no initial data provided)
  useEffect(() => {
    // If we already have initial data, don't load again
    if (initialListings.length > 0) {
      setLoading(false);
      return;
    }

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
          const items: ListItem[] = rows.map((r) => {
            const price = toNum(r.price);
            const arv = toNum(r.arv);
            const repairs = toNum(r.repairs ?? r.repair_costs);
            const spread = arv && price ? arv - price - (toNum(r.assignment_fee) || 0) : undefined;
            const roi = arv && price ? ((arv - price) / price) * 100 : undefined;

            return {
              id: String(r.id),
              title: r.title || `${r.bedrooms || 0} bed, ${r.baths || 0} bath`,
              address: r.address || `${r.city || ''}, ${r.state || ''} ${r.zip || ''}`.trim(),
              city: r.city,
              state: r.state,
              zip: r.zip,
              price,
              bedrooms: r.bedrooms || r.beds,
              bathrooms: r.baths,
              home_sqft: r.sqft,
              lot_size: r.lot_size,
              garage: r.garage,
              year_built: r.year_built,
              assignment_fee: r.assignment_fee,
              description: r.description,
              owner_phone: r.owner_phone,
              owner_email: r.owner_email,
              owner_name: r.owner_name,
              images: r.images || [],
              cover_image_url: r.cover_image_url,
              arv,
              repairs,
              spread,
              roi,
              featured: r.featured,
              featured_until: r.featured_until,
              latitude: r.latitude,
              longitude: r.longitude,
              created_at: r.created_at,
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

          setAllListings(items);
          setAllPoints(pts);
        }
      } catch (err) {
        console.error('Error loading listings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, [initialListings]);

  // Apply filters to listings - OPTIMIZED CLIENT-SIDE FILTERING
  const filteredListings = useMemo(() => {
    let filtered = allListings;

    // Apply map bounds filtering FIRST (most important)
    if (activeMapBounds && mapBounds) {
      filtered = filtered.filter(listing => {
        const lat = (listing as ListingData).latitude;
        const lng = (listing as ListingData).longitude;
        
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

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(listing => {
        const address = (listing as ListingData).address;
        const city = (listing as ListingData).city;
        const state = (listing as ListingData).state;
        const zip = (listing as ListingData).zip;
        return (address && address.toLowerCase().includes(query)) ||
               (city && city.toLowerCase().includes(query)) ||
               (state && state.toLowerCase().includes(query)) ||
               (zip && zip.toLowerCase().includes(query));
      });
    }

    // Apply filters
    if (filters.minPrice) filtered = filtered.filter(l => ((l as ListingData).price ?? 0) >= filters.minPrice!);
    if (filters.maxPrice) filtered = filtered.filter(l => ((l as ListingData).price ?? 0) <= filters.maxPrice!);
    if (filters.minBeds) filtered = filtered.filter(l => ((l as ListingData).bedrooms ?? 0) >= filters.minBeds!);
    if (filters.maxBeds) filtered = filtered.filter(l => ((l as ListingData).bedrooms ?? 0) <= filters.maxBeds!);
    if (filters.minBaths) filtered = filtered.filter(l => ((l as ListingData).bathrooms ?? 0) >= filters.minBaths!);
    if (filters.maxBaths) filtered = filtered.filter(l => ((l as ListingData).bathrooms ?? 0) <= filters.maxBaths!);
    if (filters.minSqft) filtered = filtered.filter(l => ((l as ListingData).home_sqft ?? 0) >= filters.minSqft!);
    if (filters.maxSqft) filtered = filtered.filter(l => ((l as ListingData).home_sqft ?? 0) <= filters.maxSqft!);

    // Apply sorting
    if (filters.sortBy === 'price_asc') {
      filtered.sort((a, b) => ((a as ListingData).price ?? 0) - ((b as ListingData).price ?? 0));
    } else if (filters.sortBy === 'price_desc') {
      filtered.sort((a, b) => ((b as ListingData).price ?? 0) - ((a as ListingData).price ?? 0));
    } else if (filters.sortBy === 'sqft_asc') {
      filtered.sort((a, b) => ((a as ListingData).home_sqft ?? 0) - ((b as ListingData).home_sqft ?? 0));
    } else if (filters.sortBy === 'sqft_desc') {
      filtered.sort((a, b) => ((b as ListingData).home_sqft ?? 0) - ((a as ListingData).home_sqft ?? 0));
    } else {
      filtered.sort((a, b) => new Date((b as ListingData).created_at ?? '').getTime() - new Date((a as ListingData).created_at ?? '').getTime());
    }

    return filtered;
  }, [allListings, searchQuery, filters, activeMapBounds, mapBounds]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    
    // If map bounds are active, trigger a refresh
    if (activeMapBounds && mapBounds) {
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
        onBoundsChange={handleMapBoundsChange}
        points={allPoints}
      />
    );
    MapComponentInner.displayName = 'MapComponent';
    return MapComponentInner;
  }, [handleMapBoundsChange, allPoints]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg mb-2">Loading listings...</div>
          <div className="text-sm text-gray-500">Connecting to database...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
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
          MapComponent={MapComponent}
        />
      </div>

      <PostDealButton />
    </div>
  );
}
