import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { logger } from '@/lib/logger';
import { notifyBuyerInterest } from '@/lib/notifications';

type WatchlistRow = {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
};

type ListingSummary = {
  id: string;
  title?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  price?: number | null;
  beds?: number | null;  // Alternative column name
  bedrooms?: number | null;
  baths?: number | null;  // Alternative column name
  bathrooms?: number | null;
  sqft?: number | null;  // Alternative column name
  home_sqft?: number | null;
  arv?: number | null;
  repairs?: number | null;
  spread?: number | null;
  roi?: number | null;
  images?: unknown;
  cover_image_url?: string | null;
  featured?: boolean | null;
  featured_until?: string | null;
  status?: string | null;
  owner_id?: string | null;
  owner_profile?: Record<string, unknown> | null;
};

function sanitizeListing(listing: ListingSummary | null | undefined) {
  if (!listing) return null;
  const imagesValue = (() => {
    if (Array.isArray(listing.images)) return listing.images as string[];
    if (typeof listing.images === 'string') return [listing.images];
    return [];
  })();

  // Handle both beds/bedrooms and baths/bathrooms column names for compatibility
  // ROOT CAUSE FIX: Database may use 'beds'/'baths' while API expects 'bedrooms'/'bathrooms'
  const beds = listing.beds ?? listing.bedrooms ?? null;
  const baths = listing.baths ?? listing.bathrooms ?? null;
  const sqft = listing.sqft ?? listing.home_sqft ?? null;

  return {
    id: listing.id,
    title: listing.title ?? null,
    address: listing.address ?? null,
    city: listing.city ?? null,
    state: listing.state ?? null,
    zip: listing.zip ?? null,
    price: listing.price ?? null,
    bedrooms: typeof beds === 'number' ? beds : listing.bedrooms ?? null,
    beds: typeof beds === 'number' ? beds : null,
    baths: typeof baths === 'number' ? baths : listing.bathrooms ?? null,
    bathrooms: typeof baths === 'number' ? baths : listing.bathrooms ?? null,
    home_sqft: typeof sqft === 'number' ? sqft : listing.home_sqft ?? null,
    sqft: typeof sqft === 'number' ? sqft : null,
    arv: listing.arv ?? null,
    repairs: listing.repairs ?? null,
    spread: listing.spread ?? null,
    roi: listing.roi ?? null,
    images: imagesValue,
    cover_image_url: listing.cover_image_url ?? null,
    featured: listing.featured ?? false,
    featured_until: listing.featured_until ?? null,
    owner_id: listing.owner_id ?? null,
    owner_profile: listing.owner_profile ?? null,
  };
}

// GET: Fetch user's watchlist
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser(request);

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!user) {
      logger.warn('Watchlist GET: Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.log('📋 Watchlist GET: Starting request', {
      userId: user.id,
      userEmail: user.email,
      listingId: listingId || null,
    });

    // If listingId provided, check if it's in watchlist
    if (listingId) {
      const { data: watchlist, error } = await supabase
        .from('watchlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('property_id', listingId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('❌ Watchlist GET: Error checking single watchlist item', {
          table: 'watchlists',
          error_code: error.code,
          error_message: error.message,
          user_id: user.id,
          listing_id: listingId,
        });
        if (error.code === '42501') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
      }

      return NextResponse.json({ isInWatchlist: !!watchlist });
    }

    // First, get all watchlist items for the user
    logger.log('📋 Watchlist GET: Fetching watchlist rows', {
      userId: user.id,
    });

    const { data: watchlistRows, error: watchlistError } = await supabase
      .from('watchlists')
      .select('id, user_id, property_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (watchlistError) {
      logger.error('❌ Watchlist GET: Error fetching watchlist rows', {
        table: 'watchlists',
        error_code: watchlistError.code,
        error_message: watchlistError.message,
        error_details: watchlistError.details,
        error_hint: watchlistError.hint,
        user_id: user.id,
      });
      if (watchlistError.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to fetch watchlists' }, { status: 500 });
    }

    logger.log('✅ Watchlist GET: Fetched watchlist rows', {
      count: watchlistRows?.length || 0,
      watchlistIds: watchlistRows?.map(w => w.id) || [],
      propertyIds: watchlistRows?.map(w => w.property_id) || [],
    });

    if (!watchlistRows || watchlistRows.length === 0) {
      logger.log('📋 Watchlist GET: No watchlist items found', {
        userId: user.id,
      });
      return NextResponse.json({ watchlists: [] });
    }

    // Get all listing IDs
    const listingIds = watchlistRows.map((w) => w.property_id).filter(Boolean) as string[];

    if (listingIds.length === 0) {
      logger.warn('⚠️ Watchlist GET: Watchlist rows exist but no property_ids found', {
        watchlistRows: watchlistRows.length,
        userId: user.id,
      });
      return NextResponse.json({ 
        watchlists: watchlistRows.map((w) => ({
          id: w.id,
          user_id: w.user_id,
          property_id: w.property_id,
          created_at: w.created_at,
          listing: null,
        }))
      });
    }

    // Fetch listings separately to avoid join issues
    // Use the authenticated user's Supabase client to ensure RLS policies work correctly
    // NOTE: Watchlist should show ALL saved listings regardless of status (live, draft, archived, etc.)
    logger.log('📋 Watchlist GET: Fetching listings for watchlist', {
      listingIds: listingIds,
      listingCount: listingIds.length,
      userId: user.id,
      userEmail: user.email,
    });

    // Query listings without status filter - users should see listings they saved regardless of status
    // This is different from the main listings API which only shows 'live' listings
    // NOTE: Watchlist items link to listings.id via watchlists.property_id
    // We query by listings.id using the property_id values from watchlist rows
    // ROOT CAUSE FIX: Query all columns including both beds/bedrooms and baths/bathrooms for compatibility
    const { data: listingsData, error: listingsError } = await supabase
      .from('listings')
      .select('id, owner_id, title, address, city, state, zip, price, beds, bedrooms, baths, bathrooms, sqft, home_sqft, arv, repairs, spread, roi, images, cover_image_url, featured, featured_until, status')
      .in('id', listingIds);
    
    // If query returns empty but we have listingIds, check if RLS is blocking
    if (!listingsError && (!listingsData || listingsData.length === 0) && listingIds.length > 0) {
      logger.warn('⚠️ Watchlist GET: No listings returned but listingIds provided', {
        listingIds,
        possibleCauses: [
          'RLS policy blocking access',
          'Listings do not exist',
          'ID type mismatch (UUID vs text)',
        ],
      });
      
      // Try to verify one listing exists (for debugging)
      const testId = listingIds[0];
      const { data: testListing, error: testError } = await supabase
        .from('listings')
        .select('id, status, owner_id')
        .eq('id', testId)
        .maybeSingle();
      
      if (testError) {
        logger.error('❌ Watchlist GET: Cannot access test listing', {
          listingId: testId,
          error_code: testError.code,
          error_message: testError.message,
          likelyCause: testError.code === '42501' ? 'RLS policy blocking' : 'Other error',
        });
      } else if (testListing) {
        logger.log('✅ Watchlist GET: Test listing exists but not returned in batch query', {
          listingId: testId,
          status: testListing.status,
          owner_id: testListing.owner_id,
          note: 'This suggests RLS or query filter issue',
        });
      } else {
        logger.log('❌ Watchlist GET: Test listing does not exist', {
          listingId: testId,
        });
      }
    }

    if (listingsError) {
      logger.error('❌ Watchlist GET: Error fetching listings', {
        error_code: listingsError.code,
        error_message: listingsError.message,
        error_details: listingsError.details,
        error_hint: listingsError.hint,
        listing_ids: listingIds,
        user_id: user.id,
        user_email: user.email,
      });
      // Continue even if listings fail - return watchlist items with null listings
    } else {
      logger.log('✅ Watchlist GET: Fetched listings for watchlist', {
        requestedIds: listingIds.length,
        foundListings: listingsData?.length || 0,
        foundListingIds: listingsData?.map(l => l.id) || [],
        missingListingIds: listingIds.filter(id => !listingsData?.some(l => l.id === id)),
        listingStatuses: (listingsData as ListingSummary[] | undefined)?.map(l => ({ id: l.id, status: l.status ?? null })) || [],
      });
      
      // Log if any listings are missing
      const missingIds = listingIds.filter(id => !listingsData?.some(l => l.id === id));
      if (missingIds.length > 0) {
        logger.warn('⚠️ Watchlist GET: Some listings not found', {
          missingIds,
          possibleReasons: [
            'Listing was deleted',
            'RLS policy blocking access',
            'Listing ID mismatch',
            'Listing status prevents access (check RLS policies)',
          ],
        });
        
        // Try to verify if listings exist by checking with a direct query (for debugging)
        logger.log('🔍 Watchlist GET: Attempting to verify listing existence...');
        for (const missingId of missingIds) {
          const { data: checkData, error: checkError } = await supabase
            .from('listings')
            .select('id, status, owner_id')
            .eq('id', missingId)
            .maybeSingle();
          
          if (checkError) {
            logger.error(`❌ Watchlist GET: Cannot access listing ${missingId}`, {
              error_code: checkError.code,
              error_message: checkError.message,
              likelyCause: checkError.code === '42501' ? 'RLS policy blocking access' : 'Other error',
            });
          } else if (checkData) {
            logger.log(`✅ Watchlist GET: Listing ${missingId} exists but wasn't returned in batch query`, {
              status: checkData.status,
              owner_id: checkData.owner_id,
              note: 'This suggests an RLS policy issue or query filter problem',
            });
          } else {
            logger.log(`❌ Watchlist GET: Listing ${missingId} does not exist in database`);
          }
        }
      }
    }

    // Create a map of listing ID to listing data
    const listingsMap = new Map<string, ListingSummary>();
    (listingsData || []).forEach((listing) => {
      listingsMap.set(listing.id, listing as ListingSummary);
    });

    // Enrich watchlist items with listing data
    const enriched = watchlistRows.map((item) => {
      const listingData = listingsMap.get(item.property_id);
      const listing = listingData ? sanitizeListing(listingData) : null;
      
      if (!listing) {
        logger.warn('⚠️ Watchlist GET: Watchlist item has no listing data', {
          watchlistId: item.id,
          propertyId: item.property_id,
          listingInMap: !!listingData,
          listingIdsInMap: Array.from(listingsMap.keys()),
        });
      }
      
      return {
        id: item.id,
        user_id: item.user_id,
        property_id: item.property_id,
        created_at: item.created_at,
        listing,
      };
    });

    logger.log('📋 Watchlist GET: Returning enriched watchlists', {
      totalItems: enriched.length,
      itemsWithListings: enriched.filter(e => e.listing).length,
      itemsWithoutListings: enriched.filter(e => !e.listing).length,
      sampleItem: enriched[0] ? {
        id: enriched[0].id,
        property_id: enriched[0].property_id,
        hasListing: !!enriched[0].listing,
        listingId: enriched[0].listing?.id,
        listingTitle: enriched[0].listing?.title,
      } : null,
    });

    // Include diagnostic info to help debug watchlist issues
    const includeDiagnostics = true;
    
    const response: {
      watchlists: typeof enriched;
      diagnostics?: {
        requestedListingIds: string[];
        foundListingIds: string[];
        missingListingIds: string[];
        errorDetails?: {
          code?: string;
          message?: string;
        };
      };
    } = {
      watchlists: enriched,
    };

    if (includeDiagnostics) {
      response.diagnostics = {
        requestedListingIds: listingIds,
        foundListingIds: listingsData?.map(l => l.id) || [],
        missingListingIds: listingIds.filter(id => !listingsData?.some(l => l.id === id)),
        errorDetails: listingsError ? {
          code: listingsError.code,
          message: listingsError.message,
        } : undefined,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error('❌ Watchlist GET: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add listing to watchlist
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
    }

    logger.log('📋 Watchlist POST: Adding listing to watchlist', {
      userId: user.id,
      listingId,
    });

    const { data: existing } = await supabase
      .from('watchlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', listingId)
      .single();

    if (existing) {
      logger.log('📋 Watchlist POST: Listing already in watchlist', {
        userId: user.id,
        listingId,
      });
      return NextResponse.json({ message: 'Already in watchlist', watchlist: existing });
    }

    const { data: watchlistRow, error } = await supabase
      .from('watchlists')
      .insert({
        user_id: user.id,
        property_id: listingId,
      })
      .select('id, user_id, property_id, created_at')
      .single();

    if (error) {
      logger.error('❌ Watchlist POST: Error inserting watchlist', {
        table: 'watchlists',
        error_code: error.code,
        error_message: error.message,
        error_details: error.details,
        user_id: user.id,
        listing_id: listingId,
      });
      if (error.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
    }

    logger.log('✅ Watchlist POST: Successfully added to watchlist', {
      userId: user.id,
      listingId,
      watchlistId: watchlistRow?.id,
    });

    // Notify listing owner of buyer interest
    try {
      const { data: listingData } = await supabase
        .from('listings')
        .select('owner_id, title')
        .eq('id', listingId)
        .maybeSingle();

      if (listingData?.owner_id && listingData.owner_id !== user.id) {
        await notifyBuyerInterest({
          ownerId: listingData.owner_id,
          listingTitle: typeof listingData.title === 'string' ? listingData.title : null,
          buyerEmail: user.email ?? null,
          listingId,
          action: 'saved',
          supabaseClient: supabase,
        });
        logger.log('📧 Buyer interest notification sent', {
          ownerId: listingData.owner_id,
          listingId,
          buyerId: user.id,
        });
      }
    } catch (notificationError) {
      logger.error('Failed to send buyer interest notification', {
        error: notificationError,
        listingId,
        userId: user.id,
      });
      // Don't fail the request if notification fails
    }

    let listing = null;
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select(
        'id, owner_id, title, address, city, state, zip, price, beds, bedrooms, baths, bathrooms, sqft, home_sqft, arv, repairs, spread, roi, images, cover_image_url, featured, featured_until'
      )
      .eq('id', listingId)
      .maybeSingle();

    if (listingError) {
      logger.error('❌ Watchlist POST: Error fetching listing', {
        error_code: listingError.code,
        error_message: listingError.message,
        listing_id: listingId,
      });
      if (listingError.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      const ownerId = listingData?.owner_id as string | undefined;
      let ownerProfile = null;
      if (ownerId) {
        const { data: ownerProfileRow } = await supabase
          .from('profiles')
          .select(
            'id, role, segment, full_name, company_name, profile_photo_url, phone_verified, is_pro_subscriber, buy_markets, buy_property_types, buy_price_min, buy_price_max, buy_strategy, buy_condition, capital_available, wholesale_markets, deal_arbands, deal_discount_target, assignment_methods, avg_days_to_buyer'
          )
          .eq('id', ownerId)
          .maybeSingle();
        ownerProfile = ownerProfileRow ?? null;
      }
      const core = sanitizeListing(listingData as ListingSummary | null | undefined);
      listing = core ? { ...core, owner_profile: ownerProfile } : null;
    }

    return NextResponse.json({
      watchlist: {
        ...(watchlistRow as WatchlistRow),
        listing,
      },
    });
  } catch (error) {
    logger.error('❌ Watchlist POST: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove listing from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
    }

    logger.log('📋 Watchlist DELETE: Removing listing from watchlist', {
      userId: user.id,
      listingId,
    });

    const { error } = await supabase
      .from('watchlists')
      .delete()
      .eq('user_id', user.id)
      .eq('property_id', listingId);

    if (error) {
      logger.error('❌ Watchlist DELETE: Error deleting watchlist', {
        table: 'watchlists',
        error_code: error.code,
        error_message: error.message,
        user_id: user.id,
        listing_id: listingId,
      });
      if (error.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
    }

    logger.log('✅ Watchlist DELETE: Successfully removed from watchlist', {
      userId: user.id,
      listingId,
    });

    return NextResponse.json({ message: 'Removed from watchlist' });
  } catch (error) {
    logger.error('❌ Watchlist DELETE: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
