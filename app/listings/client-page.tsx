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
import type { BoundsPayload } from '@/components/GoogleMapImpl';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';

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
  const [mapBounds, setMapBounds] = useState<BoundsPayload | null>(null);
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
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [savingSearch, setSavingSearch] = useState(false);
  const { session } = useAuth();
  const router = useRouter();

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

        const typedBounds = bounds as BoundsPayload;
        
        // Only update state if bounds actually changed to prevent infinite loops
        const threshold = 0.005; // About 500 meters - more sensitive
        const normalizedBounds: BoundsPayload = {
          south: typedBounds.south,
          north: typedBounds.north,
          west: typedBounds.west,
          east: typedBounds.east,
          ...(typedBounds.polygon ? { polygon: typedBounds.polygon } : {}),
        };
        if (!mapBounds || 
            Math.abs(mapBounds.south - normalizedBounds.south) > threshold ||
            Math.abs(mapBounds.north - normalizedBounds.north) > threshold ||
            Math.abs(mapBounds.west - normalizedBounds.west) > threshold ||
            Math.abs(mapBounds.east - normalizedBounds.east) > threshold) {
          
          // Update bounds state - this will trigger the filteredListings useMemo
          setMapBounds(normalizedBounds);
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
      console.error('Failed to persist current search state', err);
    }
  }, [filters, searchQuery, mapBounds, activeMapBounds]);

  const handleSaveSearch = async () => {
    if (!session) {
      router.push('/login?next=/listings');
      return;
    }

    if (!saveSearchName.trim()) {
      alert('Please enter a name for this search');
      return;
    }

    setSavingSearch(true);
    try {
      const currentState = {
        filters,
        searchQuery,
        bounds: activeMapBounds ? mapBounds : null,
      };

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: saveSearchName.trim(),
          criteria: currentState,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to save search');
        return;
      }

      setShowSaveSearchModal(false);
      setSaveSearchName('');
      alert('Search saved successfully!');
    } catch (error) {
      console.error('Error saving search:', error);
      alert('Failed to save search');
    } finally {
      setSavingSearch(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>Loading listings...</div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Connecting to database...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      minWidth: 0
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '16px',
        flexShrink: 0,
        background: '#fff',
        zIndex: 30,
        position: 'relative'
      }}>
        <style>{`
          @media (min-width: 1024px) {
            .listings-header {
              flex-direction: row !important;
              align-items: center !important;
              justify-content: space-between !important;
              padding: 16px 24px !important;
            }
          }
        `}</style>
        <div className="listings-header" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h1 style={{
              fontSize: 'clamp(20px, 5vw, 24px)',
              fontWeight: 700,
              color: '#111827',
              margin: 0
            }}>
              Find Deals
            </h1>
            {session && (
              <button
                onClick={() => setShowSaveSearchModal(true)}
                style={{
                  padding: '10px 16px',
                  minHeight: '44px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  touchAction: 'manipulation',
                  whiteSpace: 'nowrap'
                }}
              >
                💾 Save Search
              </button>
            )}
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%'
          }}>
            <style>{`
              @media (min-width: 1024px) {
                .search-container {
                  flex-direction: row !important;
                  align-items: center !important;
                  width: 320px !important;
                }
              }
            `}</style>
            <div className="search-container" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%'
            }}>
              <SearchBarClient
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by address, city, or state..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* filters */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        flexShrink: 0,
        background: '#fff',
        zIndex: 20,
        position: 'relative',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <style>{`
          @media (min-width: 1024px) {
            .filters-container {
              padding: 12px 24px !important;
            }
          }
        `}</style>
        <div className="filters-container">
          <FiltersBar value={filters} onChange={handleFiltersChange} />
        </div>
      </div>

      {/* the split fills the rest of the viewport - NO SCROLL */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflow: 'hidden'
      }}>
        <ListingsSplitClient
          points={allPoints}
          listings={filteredListings}
          onBoundsChange={handleMapBoundsChange}
          MapComponent={GoogleMapWrapper}
        />
      </div>

      <PostDealButton />

      {/* Save Search Modal */}
      {showSaveSearchModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onClick={() => setShowSaveSearchModal(false)}
        >
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20, fontWeight: 700 }}>Save Current Search</h2>
            <p style={{ margin: '0 0 16px 0', fontSize: 14, color: '#6b7280' }}>
              Save your current filters and search criteria for quick access later.
            </p>
            <input
              type="text"
              placeholder="Enter a name for this search (e.g., 'Miami Under $100k')"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveSearch()}
              style={{
                width: '100%',
                padding: '12px',
                minHeight: '44px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: '14px',
                marginBottom: '16px',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSaveSearchModal(false);
                  setSaveSearchName('');
                }}
                style={{
                  padding: '10px 20px',
                  minHeight: '44px',
                  background: '#fff',
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  color: '#374151',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={savingSearch || !saveSearchName.trim()}
                style={{
                  padding: '10px 20px',
                  minHeight: '44px',
                  background: savingSearch || !saveSearchName.trim() ? '#9ca3af' : '#3b82f6',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: savingSearch || !saveSearchName.trim() ? 'not-allowed' : 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                {savingSearch ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
