'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import FiltersBar, { type Filters } from '@/components/FiltersBar';
import ListingsSplitClient, { type MapPoint, type ListItem } from '@/components/ListingsSplitClient';
import { supabase } from '@/lib/supabaseClient';

const MapViewClient = dynamic(() => import('@/components/MapViewClient'), { ssr: false });

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
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  images?: string[] | null;
  image_url?: string | null;
  cover_image_url?: string | null;
  arv?: number | string | null;
  repairs?: number | string | null;
  repair_costs?: number | string | null;
  spread?: number | string | null;
  roi?: number | string | null;
  lot_size?: number | null;
  garage?: boolean | null;
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
  const [mapBounds, setMapBounds] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load cached data on mount
  useEffect(() => {
    console.log('=== CHECKING CACHED DATA ===');
    const cachedListings = localStorage.getItem('dealflow-listings');
    const cachedPoints = localStorage.getItem('dealflow-points');
    
    if (cachedListings && cachedPoints) {
      try {
        const listings = JSON.parse(cachedListings);
        const points = JSON.parse(cachedPoints);
        console.log('✅ Loading cached data:', { listings: listings.length, points: points.length });
        setAllListings(listings);
        setAllPoints(points);
        setLoading(false);
        setHasLoaded(true);
      } catch (err) {
        console.log('❌ Error loading cached data:', err);
      }
    } else {
      console.log('⚠️ No cached data found, will load from database');
    }
  }, []);

  // Load all listings based on filters and search
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      console.log('=== LOADING LISTINGS FROM DATABASE ===');
      
      // Always show loading on initial load
      if (!hasLoaded) {
        setLoading(true);
      }
      
      try {
        let query = supabase.from('listings').select('*');
        
        // Apply search filter
        if (searchQuery.trim()) {
          query = query.or(`address.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%`);
        }

        // Apply property filters
        if (filters.minBeds) query = query.gte('bedrooms', filters.minBeds);
        if (filters.maxBeds) query = query.lte('bedrooms', filters.maxBeds);
        if (filters.minBaths) query = query.gte('bathrooms', filters.minBaths);
        if (filters.maxBaths) query = query.lte('bathrooms', filters.maxBaths);
        if (filters.minPrice) query = query.gte('price', filters.minPrice);
        if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
        if (filters.minSqft) query = query.gte('home_sqft', filters.minSqft);
        if (filters.maxSqft) query = query.lte('home_sqft', filters.maxSqft);

        // Apply sorting
        if (filters.sortBy === 'price_asc') query = query.order('price', { ascending: true });
        else if (filters.sortBy === 'price_desc') query = query.order('price', { ascending: false });
        else if (filters.sortBy === 'sqft_asc') query = query.order('home_sqft', { ascending: true });
        else if (filters.sortBy === 'sqft_desc') query = query.order('home_sqft', { ascending: false });
        else query = query.order('created_at', { ascending: false }); // newest

        const { data, error } = await query.limit(200);
        console.log('Database query result:', { data, error, count: data?.length });
        
        if (error) {
          console.error('Database error:', error);
          setLoading(false);
          return;
        }
        if (!data || cancelled) {
          setLoading(false);
          return;
        }

        const rows = data as unknown as Row[];
        console.log('Raw rows:', rows.length);

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
            bedrooms: (r.bedrooms ?? r.beds) ?? undefined,
            bathrooms: (r.bathrooms ?? r.baths) ?? undefined,
            home_sqft: (r.home_sqft ?? r.square_feet) ?? undefined,
            lot_size: toNum(r.lot_size),
            garage: r.garage ?? undefined,
            year_built: r.year_built ?? undefined,
            assignment_fee: toNum(r.assignment_fee),
            description: r.description ?? undefined,
            owner_phone: r.contact_phone ?? r.owner_phone ?? undefined,
            owner_email: r.contact_email ?? r.owner_email ?? undefined,
            owner_name: r.contact_name ?? r.owner_name ?? undefined,
            images: Array.isArray(r.images) ? r.images : undefined,
            cover_image_url: r.image_url ?? r.cover_image_url ?? undefined,
            arv,
            repairs,
            spread,
            roi,
          };
        });

        const pts: MapPoint[] = rows
          .map((r) => {
            // Try both latitude/longitude and lat/lng
            const lat = r.latitude ?? r.lat;
            const lng = r.longitude ?? r.lng;
            return typeof lat === 'number' && typeof lng === 'number'
              ? { id: String(r.id), lat, lng, price: toNum(r.price) }
              : null;
          })
          .filter((x): x is MapPoint => !!x);

        console.log('✅ Processed data:', { items: items.length, points: pts.length });
        console.log('📋 Sample item:', items[0]);
        console.log('📍 Sample point:', pts[0]);
        
        if (!cancelled) {
          setAllListings(items);
          setAllPoints(pts);
          setLoading(false);
          setHasLoaded(true);
          
          // Cache the data for persistence
          try {
            localStorage.setItem('dealflow-listings', JSON.stringify(items));
            localStorage.setItem('dealflow-points', JSON.stringify(pts));
            console.log('💾 Data cached successfully');
          } catch (err) {
            console.log('❌ Error caching data:', err);
          }
        }
      } catch (err) {
        console.error('Error loading listings:', err);
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [filters, searchQuery, hasLoaded]);

  // FIXED: Show all listings initially, then filter by map bounds
  const filteredListings = React.useMemo(() => {
    console.log('=== FILTERING LISTINGS ===');
    console.log('📊 All listings:', allListings.length);
    console.log('🗺️ Map bounds:', !!mapBounds);
    
    // FIXED: Always show all listings initially, don't filter by map bounds unless explicitly set
    if (!mapBounds || allListings.length === 0) {
      console.log('No map bounds or no listings, showing all listings:', allListings.length);
      return allListings;
    }

    const { south, north, west, east } = mapBounds;
    console.log('Map bounds:', { south, north, west, east });
    
    const filtered = allListings.filter((listing) => {
      // Find the corresponding point for this listing
      const point = allPoints.find(p => p.id === listing.id);
      if (!point) {
        console.log('No point found for listing:', listing.id);
        return true; // FIXED: Show listing even if no point found
      }

      // Check if point is within map bounds
      const inBounds = point.lat >= south && point.lat <= north && point.lng >= west && point.lng <= east;
      return inBounds;
    });
    
    console.log('✅ Filtered listings:', filtered.length);
    return filtered;
  }, [allListings, allPoints, mapBounds]);

  const handleSearch = () => {
    // Trigger a reload with the search query
    setSearchQuery(searchQuery);
  };

  const handleReset = () => {
    // Clear cache and reload
    localStorage.removeItem('dealflow-listings');
    localStorage.removeItem('dealflow-points');
    setHasLoaded(false);
    setLoading(true);
  };

  const handleMapBoundsChange = (bounds: unknown) => {
    console.log('Map bounds changed:', bounds);
    setMapBounds(bounds);
  };

  // Only show loading on initial load, not when navigating back
  if (loading && !hasLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 65px)' }}>
        <div>Loading listings...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
      {/* header + search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 8px 18px', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Find Deals</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input 
            aria-label="Search city or address" 
            placeholder="Search city or address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{ height: 36, width: 360, maxWidth: '62vw', border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 10px' }} 
          />
          <button 
            onClick={handleSearch}
            style={{ height: 36, padding: '0 14px', border: '1px solid #111', borderRadius: 8, background: '#111', color: '#fff' }}
          >
            Search
          </button>
          <button 
            onClick={handleReset}
            style={{ height: 36, padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}
          >
            Reset view
          </button>
        </div>
      </div>

      {/* filters */}
      <div style={{ padding: '6px 18px 12px 18px', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
        <FiltersBar value={filters} onChange={setFilters} />
      </div>

      {/* the split fills the rest of the viewport - NO SCROLL */}
      <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
        <ListingsSplitClient 
          points={allPoints} 
          listings={filteredListings} 
          MapComponent={(props) => <MapViewClient {...props} onBoundsChange={handleMapBoundsChange} />} 
        />
      </div>
    </div>
  );
}