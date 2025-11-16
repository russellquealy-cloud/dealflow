import { NextRequest, NextResponse } from 'next/server';
import { getListingsForSearch, type ListingsQueryParams } from '@/lib/listings';

export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Vercel max duration

// Note: ListingsQueryParams is imported from @/lib/listings

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
      sortBy: (searchParams.get('sortBy') as 'newest' | 'price_asc' | 'price_desc' | 'sqft_asc' | 'sqft_desc' | undefined) || undefined,
      south: searchParams.get('south') ? parseFloat(searchParams.get('south')!) : undefined,
      north: searchParams.get('north') ? parseFloat(searchParams.get('north')!) : undefined,
      west: searchParams.get('west') ? parseFloat(searchParams.get('west')!) : undefined,
      east: searchParams.get('east') ? parseFloat(searchParams.get('east')!) : undefined,
    };

    // Use unified listings helper - single source of truth for map and list views
    const queryParams: ListingsQueryParams = {
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      minBeds: params.minBeds,
      maxBeds: params.maxBeds,
      minBaths: params.minBaths,
      maxBaths: params.maxBaths,
      minSqft: params.minSqft,
      maxSqft: params.maxSqft,
      city: params.city,
      state: params.state,
      search: params.search,
      south: params.south,
      north: params.north,
      west: params.west,
      east: params.east,
      limit: params.limit,
      offset: params.offset,
      sortBy: (params.sortBy as 'newest' | 'price_asc' | 'price_desc' | 'sqft_asc' | 'sqft_desc') || 'newest',
      requireCoordinates: true, // Map/list views require coordinates
      includeDrafts: false // Only admins can see drafts via admin flag
    };

    // Execute unified query with timeout
    const queryPromise = getListingsForSearch(queryParams);
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

    const { data, error, count } = result;

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

    const listings = data as unknown as Array<Record<string, unknown>>;
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

    console.log(`✅ Listings query completed in ${elapsed}ms: ${listings.length} items, total count: ${count || 0}${userIsAdmin ? ' (admin view - all statuses)' : ' (public view - live only)'}`);

    // Log diagnostic info for admins
    if (userIsAdmin && listings.length === 0) {
      console.log('⚠️ Admin query returned 0 listings. Possible reasons:');
      console.log('  - No listings have latitude/longitude coordinates');
      console.log('  - All listings are outside the current map bounds');
      console.log('  - RLS policies may be blocking access');
    }

    return NextResponse.json({
      items: enrichedListings,
      count: count || data.length,
      error: null,
      debug: userIsAdmin ? {
        isAdmin: true,
        totalListings: count || 0,
        filteredListings: listings.length,
        note: 'Admin can see all listings regardless of status'
      } : undefined
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

