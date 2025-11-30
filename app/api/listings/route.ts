import { NextRequest, NextResponse } from 'next/server';
import { getListingsForSearch, type ListingsQueryParams } from '@/lib/listings';
import { createServerClient } from '@/supabase/server';
import { isAdmin } from '@/lib/admin';
import { geocodeAddress } from '@/lib/geocoding';

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

    // Get Supabase client and user for owner profiles and admin checks
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userIsAdmin = user ? isAdmin(user.email || user.id) : false;

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
          const profileId = (profileRow as { id?: string }).id;
          if (profileId) {
            ownerProfilesMap.set(profileId, profileRow);
          }
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

/**
 * POST /api/listings
 * Create a new listing with automatic geocoding
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      address,
      city,
      state,
      zip,
      title,
      price,
      arv,
      repairs,
      // Canonical fields
      beds,
      baths,
      sqft,
      lot_sqft,
      garage_spaces,
      year_built,
      property_type,
      age_restricted,
      description,
      status = 'live',
      contact_name,
      contact_phone,
      contact_email,
      // Legacy fields (supported during transition, converted to canonical)
      bedrooms,
      bathrooms,
      home_sqft,
      lot_size,
      garage,
    } = body;

    // Validate required fields
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Geocode the address server-side using address components
    const addressParts = [address, city, state, zip].filter(Boolean) as string[];
    const fullAddress = addressParts.join(', ');
    
    let coordinates: { lat: number; lng: number } | null = null;
    if (fullAddress) {
      try {
        coordinates = await geocodeAddress(address || '', city, state, zip);
        if (coordinates) {
          console.log('✅ Geocoding successful:', { address: fullAddress, lat: coordinates.lat, lng: coordinates.lng });
        } else {
          console.error('❌ Geocoding failed: No coordinates returned for address:', fullAddress);
        }
      } catch (geocodeError) {
        console.error('❌ Geocoding error:', {
          address: fullAddress,
          error: geocodeError instanceof Error ? geocodeError.message : String(geocodeError),
        });
        // Continue without coordinates - listing will be saved but won't show on map
      }
    } else {
      console.warn('⚠️ No address provided for geocoding');
    }

    // Prepare listing payload with canonical fields only
    const listingPayload: Record<string, unknown> = {
      owner_id: user.id,
      title: title?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      zip: zip?.trim() || null,
      price: typeof price === 'number' ? price : typeof price === 'string' ? parseFloat(price) || 0 : 0,
      arv: typeof arv === 'number' ? arv : typeof arv === 'string' ? parseFloat(arv) || null : null,
      repairs: typeof repairs === 'number' ? repairs : typeof repairs === 'string' ? parseFloat(repairs) || null : null,
      // Canonical fields - prefer direct values, fallback to legacy during transition
      beds: typeof beds === 'number' ? beds : typeof beds === 'string' ? parseInt(beds, 10) || null : typeof bedrooms === 'number' ? bedrooms : typeof bedrooms === 'string' ? parseInt(bedrooms, 10) || null : null,
      baths: typeof baths === 'number' ? baths : typeof baths === 'string' ? parseInt(baths, 10) || null : typeof bathrooms === 'number' ? bathrooms : typeof bathrooms === 'string' ? parseInt(bathrooms, 10) || null : null,
      sqft: typeof sqft === 'number' ? sqft : typeof sqft === 'string' ? parseInt(sqft, 10) || null : typeof home_sqft === 'number' ? home_sqft : typeof home_sqft === 'string' ? parseInt(home_sqft, 10) || null : null,
      lot_sqft: typeof lot_sqft === 'number' ? lot_sqft : typeof lot_sqft === 'string' ? parseFloat(lot_sqft) || null : typeof lot_size === 'number' ? lot_size : typeof lot_size === 'string' ? parseFloat(lot_size) || null : null,
      garage_spaces: typeof garage_spaces === 'number' ? garage_spaces : typeof garage_spaces === 'string' ? parseInt(garage_spaces, 10) || null : typeof garage === 'boolean' ? (garage ? 1 : null) : typeof garage === 'number' ? (garage > 0 ? garage : null) : typeof garage === 'string' ? (parseInt(garage, 10) > 0 ? parseInt(garage, 10) : null) : null,
      year_built: typeof year_built === 'number' ? year_built : typeof year_built === 'string' ? parseInt(year_built, 10) || null : null,
      property_type: property_type || null,
      age_restricted: typeof age_restricted === 'boolean' ? age_restricted : age_restricted === 'true' || age_restricted === true ? true : false,
      description: description?.trim() || null,
      status: status || 'live',
      latitude: coordinates?.lat || null,
      longitude: coordinates?.lng || null,
      contact_name: contact_name?.trim() || null,
      contact_phone: contact_phone?.trim() || null,
      contact_email: contact_email?.trim() || null,
    };

    // Update geom using PostGIS - we'll use RPC or let database trigger handle it
    // For now, we set latitude/longitude and geom will be updated via trigger or RPC

    // Insert listing
    const { data: insertedListing, error: insertError } = await supabase
      .from('listings')
      .insert(listingPayload as never)
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating listing:', {
        error: insertError,
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        userId: user.id,
        payloadKeys: Object.keys(listingPayload),
      });
      
      // Provide user-friendly error messages
      if (insertError.code === '42501' || insertError.message.includes('permission denied') || insertError.message.includes('RLS')) {
        return NextResponse.json(
          { error: 'You do not have permission to create listings. Please contact support.' },
          { status: 403 }
        );
      }
      
      if (insertError.code === '23505' || insertError.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'A listing with these details already exists.' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: insertError.message || 'Failed to create listing. Please try again.' },
        { status: 500 }
      );
    }

    // Update geom using PostGIS - try RPC first, fallback gracefully
    // Note: Database trigger should also handle this automatically
    if (coordinates && insertedListing) {
      try {
        const listingId = (insertedListing as { id?: string }).id;
        if (listingId) {
          // RPC might not be in generated types - use type assertion
          const { error: geomError } = await (supabase.rpc as any)('update_listing_geom', {
            listing_id: listingId,
            lng: coordinates.lng,
            lat: coordinates.lat,
          });

          if (geomError) {
            console.warn('Failed to update geom via RPC (non-critical, trigger should handle it):', geomError);
          }
        }
      } catch (rpcError) {
        // RPC might not exist yet - non-critical
        // Database trigger should handle geom update automatically when latitude/longitude are set
        console.warn('RPC function might not exist (non-critical, trigger should handle geom):', rpcError);
      }
    }

    const listingId = (insertedListing as { id?: string }).id;
    
    return NextResponse.json({
      id: listingId,
      latitude: coordinates?.lat || null,
      longitude: coordinates?.lng || null,
      message: coordinates 
        ? 'Listing created successfully with geocoded coordinates' 
        : 'Listing created successfully, but geocoding failed (listing saved without coordinates)',
    });
  } catch (error) {
    console.error('Error in listings POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

