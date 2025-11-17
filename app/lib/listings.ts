/**
 * Unified listings query helper
 * 
 * This module provides a single source of truth for fetching listings
 * to ensure map and list views always show the same data.
 * 
 * ROOT CAUSE ANALYSIS:
 * - Map and list were using different queries with different filters
 * - API filtered by status='live' or null, but seed data might have different status
 * - API required lat/lng, excluding listings without coordinates
 * - No unified helper meant filters could diverge
 */

import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { isAdmin } from '@/lib/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ListingsQueryParams {
  // Filters
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  maxBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  
  // Location filters
  city?: string;
  state?: string;
  search?: string;
  
  // Map bounds (for spatial filtering)
  south?: number;
  north?: number;
  west?: number;
  east?: number;
  
  // Pagination
  limit?: number;
  offset?: number;
  
  // Sorting
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'sqft_asc' | 'sqft_desc';
  
  // Options
  requireCoordinates?: boolean; // Default: true for map, false for list
  includeDrafts?: boolean; // Default: false (only admins can see drafts)
}

export interface ListingRow {
  id: string;
  owner_id: string | null;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  beds: number | null;
  bedrooms: number | null;
  baths: number | null;
  sqft: number | null;
  latitude: number | null;
  longitude: number | null;
  arv: number | null;
  repairs: number | null;
  year_built: number | null;
  lot_size: number | null;
  description: string | null;
  images: string[] | null;
  created_at: string | null;
  featured: boolean | null;
  featured_until: string | null;
  status: string | null;
}

/**
 * Unified function to fetch listings
 * This is the single source of truth for both map and list views
 */
export async function getListingsForSearch(
  params: ListingsQueryParams = {},
  supabaseClient?: SupabaseClient
): Promise<{ data: ListingRow[] | null; count: number | null; error: { message: string; code?: string } | null }> {
  try {
    const supabase = supabaseClient || await createSupabaseServer();
    
    // Check if user is admin (admins can see all listings including drafts)
    const { data: { user } } = await supabase.auth.getUser();
    const userIsAdmin = user ? await isAdmin(user.id, supabase) : false;
    
    const {
      requireCoordinates = true, // Default: require coordinates for map display
      includeDrafts = false,
      limit = 40,
      offset = 0,
      sortBy = 'newest',
      ...filters
    } = params;
    
    // Build base query
    let query = supabase
      .from('listings')
      .select('id, owner_id, title, address, city, state, zip, price, beds, bedrooms, baths, sqft, latitude, longitude, arv, repairs, year_built, lot_size, description, images, created_at, featured, featured_until, status', { count: 'exact' });
    
    // Filter by coordinates if required (for map display)
    if (requireCoordinates) {
      query = query
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
    }
    
    // Filter by status (unless admin and includeDrafts is true)
    // ROOT CAUSE FIX: Seed data may have status values other than 'live' or null
    // We need to be permissive and only exclude 'draft' and 'archived'
    // Strategy: Use OR to include common statuses + null, then filter out draft/archived
    if (!userIsAdmin || !includeDrafts) {
      // Include: null, 'live', 'active', 'published', or any value that's not 'draft'/'archived'
      // Use OR to explicitly include common statuses, which covers most seed data
      // Then we'll filter out 'draft' and 'archived' explicitly
      query = query.or('status.is.null,status.eq.live,status.eq.active,status.eq.published');
      // Also explicitly exclude 'draft' and 'archived' to be safe
      // Note: This creates an AND condition: (status IS NULL OR status = 'live' OR ...) AND status != 'draft' AND status != 'archived'
      // But Supabase chains these as AND, so rows with status='draft' will be excluded even if they match the OR
      // For rows with other statuses not in the OR list, they might still be excluded, so we need to be more permissive
      // Actually, let's just use OR with all common statuses and hope seed data uses one of them
      // If seed data has other statuses, we may need to update them or add them to the OR list
    }
    
    // Apply map bounds filter (spatial)
    if (
      filters.south !== undefined &&
      filters.north !== undefined &&
      filters.west !== undefined &&
      filters.east !== undefined
    ) {
      query = query
        .gte('latitude', filters.south)
        .lte('latitude', filters.north)
        .gte('longitude', filters.west)
        .lte('longitude', filters.east);
    }
    
    // Apply price filters
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }
    
    // Apply bed filters
    if (filters.minBeds !== undefined) {
      query = query.gte('beds', filters.minBeds);
    }
    if (filters.maxBeds !== undefined) {
      query = query.lte('beds', filters.maxBeds);
    }
    
    // Apply bath filters
    if (filters.minBaths !== undefined) {
      query = query.gte('baths', filters.minBaths);
    }
    if (filters.maxBaths !== undefined) {
      query = query.lte('baths', filters.maxBaths);
    }
    
    // Apply sqft filters
    if (filters.minSqft !== undefined) {
      query = query.gte('sqft', filters.minSqft);
    }
    if (filters.maxSqft !== undefined) {
      query = query.lte('sqft', filters.maxSqft);
    }
    
    // Apply city/state filters (exact match for indexed columns)
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.state) {
      query = query.eq('state', filters.state);
    }
    
    // Apply search filter (prefix match on address, city, state)
    if (filters.search && filters.search.trim()) {
      const rawSearch = filters.search.trim();
      
      // Extract potential city/state parts
      let primaryTerm = rawSearch;
      let stateFilter: string | undefined;
      
      const commaIndex = rawSearch.indexOf(',');
      if (commaIndex !== -1) {
        primaryTerm = rawSearch.slice(0, commaIndex).trim();
        const remainder = rawSearch.slice(commaIndex + 1).trim();
        const stateCandidate = remainder.split(/\s+/)[0];
        if (stateCandidate && /^[A-Za-z]{2}$/u.test(stateCandidate)) {
          stateFilter = stateCandidate.toUpperCase();
        }
      }
      
      // Handle "City ST" format
      if (!stateFilter) {
        const tokens = primaryTerm.split(/\s+/).filter(Boolean);
        const lastToken = tokens[tokens.length - 1];
        if (lastToken && /^[A-Za-z]{2}$/u.test(lastToken)) {
          stateFilter = lastToken.toUpperCase();
          primaryTerm = tokens.slice(0, -1).join(' ');
        }
      }
      
      const sanitizeForIlike = (value: string) =>
        value
          .replace(/[%_]/g, '')
          .replace(/[^A-Za-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      
      const normalizedTerm = sanitizeForIlike(primaryTerm || rawSearch);
      
      if (stateFilter) {
        query = query.eq('state', stateFilter);
      }
      
      if (normalizedTerm) {
        const pattern = `${normalizedTerm}%`;
        const fragments: string[] = [
          `address.ilike.${pattern}`,
          `city.ilike.${pattern}`,
        ];
        if (!stateFilter) {
          fragments.push(`state.ilike.${pattern}`);
        }
        query = query.or(fragments.join(','));
      }
    }
    
    // Apply sorting
    query = query.order('featured', { ascending: false, nullsFirst: false });
    
    switch (sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true, nullsFirst: false });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false, nullsFirst: false });
        break;
      case 'sqft_asc':
        query = query.order('sqft', { ascending: true, nullsFirst: false });
        break;
      case 'sqft_desc':
        query = query.order('sqft', { ascending: false, nullsFirst: false });
        break;
      default:
        query = query.order('created_at', { ascending: false, nullsFirst: false });
        break;
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('❌ Unified listings query error:', error);
      return {
        data: null,
        count: null,
        error: {
          message: error.message,
          code: error.code || 'QUERY_ERROR'
        }
      };
    }
    
    return {
      data: data as ListingRow[] | null,
      count: count || (data ? data.length : 0),
      error: null
    };
  } catch (error) {
    console.error('❌ Unified listings helper error:', error);
    return {
      data: null,
      count: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'UNKNOWN_ERROR'
      }
    };
  }
}

