import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';

export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Vercel max duration

interface ListingsQueryParams {
  limit?: number;
  offset?: number;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  maxBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  city?: string;
  state?: string;
  search?: string;
  sortBy?: string;
  south?: number;
  north?: number;
  west?: number;
  east?: number;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 8000); // 8 second timeout

  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const params: ListingsQueryParams = {
      limit: parseInt(searchParams.get('limit') || '40'),
      offset: parseInt(searchParams.get('offset') || '0'),
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      minBeds: searchParams.get('minBeds') ? parseInt(searchParams.get('minBeds')!) : undefined,
      maxBeds: searchParams.get('maxBeds') ? parseInt(searchParams.get('maxBeds')!) : undefined,
      minBaths: searchParams.get('minBaths') ? parseInt(searchParams.get('minBaths')!) : undefined,
      maxBaths: searchParams.get('maxBaths') ? parseInt(searchParams.get('maxBaths')!) : undefined,
      minSqft: searchParams.get('minSqft') ? parseInt(searchParams.get('minSqft')!) : undefined,
      maxSqft: searchParams.get('maxSqft') ? parseInt(searchParams.get('maxSqft')!) : undefined,
      city: searchParams.get('city') || undefined,
      state: searchParams.get('state') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      south: searchParams.get('south') ? parseFloat(searchParams.get('south')!) : undefined,
      north: searchParams.get('north') ? parseFloat(searchParams.get('north')!) : undefined,
      west: searchParams.get('west') ? parseFloat(searchParams.get('west')!) : undefined,
      east: searchParams.get('east') ? parseFloat(searchParams.get('east')!) : undefined,
    };

    const supabase = await createSupabaseServer();
    
    // Build query with timeout signal
    let query = supabase
      .from('listings')
      .select('id, owner_id, title, address, city, state, zip, price, beds, bedrooms, baths, sqft, latitude, longitude, arv, repairs, year_built, lot_size, description, images, created_at, featured, featured_until', { count: 'exact' })
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .range(params.offset!, params.offset! + params.limit! - 1);

    if (
      params.south !== undefined &&
      params.north !== undefined &&
      params.west !== undefined &&
      params.east !== undefined
    ) {
      query = query
        .gte('latitude', params.south)
        .lte('latitude', params.north)
        .gte('longitude', params.west)
        .lte('longitude', params.east);
    }

    // Apply filters only when present (avoid unindexed wildcard searches)
    if (params.minPrice !== undefined) {
      query = query.gte('price', params.minPrice);
    }
    if (params.maxPrice !== undefined) {
      query = query.lte('price', params.maxPrice);
    }
    if (params.minBeds !== undefined) {
      query = query.gte('beds', params.minBeds);
    }
    if (params.maxBeds !== undefined) {
      query = query.lte('beds', params.maxBeds);
    }
    if (params.minBaths !== undefined) {
      query = query.gte('baths', params.minBaths);
    }
    if (params.maxBaths !== undefined) {
      query = query.lte('baths', params.maxBaths);
    }
    if (params.minSqft !== undefined) {
      query = query.gte('sqft', params.minSqft);
    }
    if (params.maxSqft !== undefined) {
      query = query.lte('sqft', params.maxSqft);
    }
    
    // Use exact match for city/state (indexed), avoid ilike wildcards
    if (params.city) {
      query = query.eq('city', params.city);
    }
    if (params.state) {
      query = query.eq('state', params.state);
    }
    
    // For search, only search in indexed fields (address, city, state) with prefix match
    // Avoid '%...%' wildcard searches across many columns
    if (params.search && params.search.trim()) {
      const rawSearch = params.search.trim();

      // Extract potential city/state parts when the search includes commas (e.g. "Salem, MA")
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

      // Handle inputs like "Salem MA" (space-separated tokens)
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
          .replace(/[%_]/g, '') // remove wildcard modifiers
          .replace(/[^A-Za-z0-9\s]/g, ' ') // strip punctuation (commas, etc.)
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

    query = query.order('featured', { ascending: false, nullsFirst: false });

    const sortBy = params.sortBy || 'newest';
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

    // Execute query with timeout
    const queryPromise = query;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout after 8 seconds')), 8000);
    });

    let result;
    try {
      result = await Promise.race([queryPromise, timeoutPromise]);
    } catch (error) {
      console.error('Listings query failed or timed out', error);
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      console.error(`⏱️ Listings query timed out after ${elapsed}ms`);
      return NextResponse.json(
        {
          items: [],
          count: 0,
          error: {
            message: 'Query timeout - database took too long to respond',
            code: 'TIMEOUT',
            elapsed: elapsed
          }
        },
        { status: 408 } // Request Timeout
      );
    }

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    const { data, error, count } = result as { data: unknown[] | null; error: { message: string; code?: string } | null; count: number | null };

    if (error) {
      console.error('❌ Listings query error:', error);
      return NextResponse.json(
        {
          items: [],
          count: 0,
          error: {
            message: error.message,
            code: error.code || 'QUERY_ERROR',
            elapsed: elapsed
          }
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          items: [],
          count: 0,
          error: {
            message: 'No data returned from database',
            code: 'NO_DATA',
            elapsed: elapsed
          }
        },
        { status: 500 }
      );
    }

    const listings = data as Array<Record<string, unknown>>;
    const ownerIds = Array.from(
      new Set(
        listings
          .map((listing) => listing.owner_id)
          .filter((ownerId): ownerId is string => typeof ownerId === 'string' && ownerId.length > 0)
      )
    );

    const ownerProfilesMap = new Map<string, Record<string, unknown>>();
    if (ownerIds.length > 0) {
      const { data: ownerProfiles, error: ownerError } = await supabase
        .from('profiles')
        .select(
          'id, role, segment, full_name, company_name, profile_photo_url, phone_verified, is_pro_subscriber, buy_markets, buy_property_types, buy_price_min, buy_price_max, buy_strategy, buy_condition, capital_available, wholesale_markets, deal_arbands, deal_discount_target, assignment_methods, avg_days_to_buyer'
        )
        .in('id', ownerIds);

      if (ownerError) {
        console.error('Owner profile fetch error', ownerError);
      } else if (ownerProfiles) {
        ownerProfiles.forEach((profileRow) => {
          ownerProfilesMap.set(profileRow.id, profileRow);
        });
      }
    }

    const enrichedListings = listings.map((listing) => {
      const ownerId = typeof listing.owner_id === 'string' ? listing.owner_id : undefined;
      const ownerProfile = ownerId ? ownerProfilesMap.get(ownerId) ?? null : null;
      return {
        ...listing,
        owner_profile: ownerProfile,
      };
    });

    console.log(`✅ Listings query completed in ${elapsed}ms: ${listings.length} items, total count: ${count || 0}`);

    return NextResponse.json({
      items: enrichedListings,
      count: count || data.length,
      error: null
    });

  } catch (error) {
    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    console.error('❌ Listings API error:', error);
    
    return NextResponse.json(
      {
        items: [],
        count: 0,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'UNKNOWN_ERROR',
          elapsed: elapsed
        }
      },
      { status: 500 }
    );
  }
}

