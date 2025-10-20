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
  const [, setMapBounds] = useState<{ south: number; north: number; west: number; east: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load all listings from database with filtering
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      console.log('=== LOADING LISTINGS FROM DATABASE ===');
      setLoading(true);
      
      try {
        console.log('🔍 Supabase client:', !!supabase);
        console.log('🔍 Environment check:', {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        });
        
        // Start with a simple query to test connection
        console.log('🔍 Testing basic connection...');
        const { data: testData, error: testError } = await supabase.from('listings').select('id').limit(1);
        console.log('🔍 Test query result:', { testData, testError });
        
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
        console.log('Database query result:', { data, error, count: data?.length });
        
        if (error) {
          console.error('❌ Database error:', error);
          console.error('❌ Error details:', JSON.stringify(error, null, 2));
          setLoading(false);
          return;
        }
        if (!data || cancelled) {
          console.log('No data or cancelled');
          setLoading(false);
          return;
        }

        console.log('✅ Database query successful, got', data.length, 'listings');

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
          
          console.log(`🔍 Point data for listing ${r.id}:`, { lat, lng, hasLatitude: !!r.latitude, hasLat: !!r.lat, hasLongitude: !!r.longitude, hasLng: !!r.lng, hasLon: !!r.lon });
          
          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
            pts.push({ id: String(r.id), lat, lng, price: toNum(r.price) });
            console.log(`✅ Added point for listing ${r.id}:`, { lat, lng });
          } else {
            console.log(`⚠️ Skipped listing ${r.id} - invalid coordinates:`, { lat, lng });
          }
        }

        console.log('✅ Processed data:', { items: items.length, points: pts.length });
        console.log('📋 Sample item:', items[0]);
        console.log('📍 Sample point:', pts[0]);
        console.log('📍 All points:', pts);
        
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
            console.log('🧪 Test data created:', { listings: testListings.length, points: testPoints.length });
          } else {
            setAllListings(items);
            setAllPoints(pts);
            
            // If no points found, create some test points for debugging
            if (pts.length === 0 && items.length > 0) {
              console.log('⚠️ No points found, creating test points for debugging');
              const testPoints: MapPoint[] = items.slice(0, 3).map((item, index) => ({
                id: item.id,
                lat: 32.2226 + (index * 0.01), // Tucson area with slight offset
                lng: -110.9747 + (index * 0.01),
                price: toNum(item.price)
              }));
              console.log('🧪 Test points created:', testPoints);
              setAllPoints(testPoints);
            }
          }
          
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
  }, [filters, searchQuery]); // Re-added dependencies for filtering

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

  const handleMapBoundsChange = async (bounds: { south: number; north: number; west: number; east: number }) => {
    console.log('Map bounds changed:', bounds);
    setMapBounds(bounds);
    
    // Don't filter if the map is too zoomed out (showing too much area)
    const boundsSize = Math.abs(bounds.north - bounds.south) + Math.abs(bounds.east - bounds.west);
    if (boundsSize > 50) {
      console.log('Map bounds too large, not filtering listings');
      return;
    }
    
    // Filter listings by map bounds - query the database with spatial constraints
    try {
      let query = supabase
        .from('listings')
        .select('*, latitude, longitude')
        .gte('latitude', bounds.south)
        .lte('latitude', bounds.north)
        .gte('longitude', bounds.west)
        .lte('longitude', bounds.east);
      
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
      
      console.log('Bounded query result:', boundedData?.length, 'listings in view');
      
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
      console.error('Error fetching bounded data:', error);
    }
  };

  // Only show loading on initial load, not when navigating back
  if (loading && !hasLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 65px)' }}>
        <div>Loading listings...</div>
      </div>
    );
  }

  // Debug: Show what we have
  console.log('=== RENDER DEBUG ===');
  console.log('Loading:', loading);
  console.log('Has loaded:', hasLoaded);
  console.log('All listings:', allListings.length);
  console.log('All points:', allPoints.length);
  console.log('Filtered listings:', filteredListings.length);

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
                 MapComponent={(props) => {
                   console.log('🗺️ Passing points to MapViewClient:', props.points);
                   console.log('🗺️ Points length:', props.points?.length || 0);
                   return <MapViewClient {...props} onBoundsChange={handleMapBoundsChange} />;
                 }} 
               />
      </div>
    </div>
  );
}