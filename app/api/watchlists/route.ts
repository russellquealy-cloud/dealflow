import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { createSupabaseServerServiceRole } from '@/lib/supabase/serverServiceRole';
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
  beds?: number | null;
  bedrooms?: number | null;
  baths?: number | null;
  bathrooms?: number | null;
  sqft?: number | null;
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
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string | null;
};

function sanitizeListing(listing: ListingSummary | null | undefined) {
  if (!listing) return null;
  const imagesValue = (() => {
    if (Array.isArray(listing.images)) return listing.images as string[];
    if (typeof listing.images === 'string') return [listing.images];
    return [];
  })();

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
    status: listing.status ?? null,
    owner_id: listing.owner_id ?? null,
    owner_profile: listing.owner_profile ?? null,
    latitude: listing.latitude ?? null,
    longitude: listing.longitude ?? null,
    created_at: listing.created_at ?? null,
  };
}

export const dynamic = 'force-dynamic';

// GET: Fetch user's watchlist
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // CRITICAL FIX: Try getSession first (reads from cookies), then getUser as fallback
    // Also check Authorization header if provided
    let user = null;
    let userError = null;

    // Check for Authorization header from client
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('Watchlist GET: Using Authorization header token', {
        tokenLength: token.length,
      });
      const { data: userData, error: getUserError } = await supabase.auth.getUser(token);
      if (userData?.user) {
        user = userData.user;
        console.log('Watchlist GET: Got user from Authorization header', {
          userId: user.id,
          email: user.email,
        });
      } else {
        userError = getUserError;
      }
    }

    // If no user from header, try getSession (reads from cookies)
    if (!user) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        user = sessionData.session.user;
        console.log('Watchlist GET: Got user from session', {
          userId: user.id,
          email: user.email,
        });
      } else if (sessionError) {
        console.warn('Watchlist GET: Session error, trying getUser', {
          error: sessionError.message,
        });
        // Fallback to getUser (reads from cookies)
        const { data: userData, error: getUserError } = await supabase.auth.getUser();
        if (userData?.user) {
          user = userData.user;
        } else {
          userError = getUserError;
        }
      } else {
        // No session, try getUser
        const { data: userData, error: getUserError } = await supabase.auth.getUser();
        if (userData?.user) {
          user = userData.user;
        } else {
          userError = getUserError;
        }
      }
    }

    if (userError || !user) {
      console.error('Watchlist GET: Unauthorized', {
        getUserError: userError?.message,
        hasAuthHeader: !!authHeader,
      });
      logger.warn('Watchlist GET: Unauthorized request', {
        hasAuthHeader: !!authHeader,
        error: userError?.message,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    logger.log('Watchlist GET: Starting request', {
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
        logger.error('Watchlist GET: Error checking single watchlist item', {
          error_code: error.code,
          error_message: error.message,
          user_id: user.id,
          listing_id: listingId,
        });
        console.error('Watchlist GET: Error checking watchlist', {
          error: error.message,
          code: error.code,
        });
        if (error.code === '42501') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
      }

      return NextResponse.json({ isInWatchlist: !!watchlist });
    }

    // Fetch watchlist items for the user
    logger.log('Watchlist GET: Fetching watchlist rows', {
      userId: user.id,
    });

    const { data: watchlistRows, error: watchlistError } = await supabase
      .from('watchlists')
      .select('id, user_id, property_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (watchlistError) {
      logger.error('Watchlist GET: Error fetching watchlist rows', {
        error_code: watchlistError.code,
        error_message: watchlistError.message,
        user_id: user.id,
      });
      console.error('Watchlist GET: Error fetching watchlist rows', {
        error: watchlistError.message,
        code: watchlistError.code,
      });
      if (watchlistError.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to fetch watchlists' }, { status: 500 });
    }

    logger.log('Watchlist GET: Fetched watchlist rows', {
      count: watchlistRows?.length || 0,
      propertyIds: watchlistRows?.map(w => w.property_id) || [],
    });

    if (!watchlistRows || watchlistRows.length === 0) {
      logger.log('Watchlist GET: No watchlist items found', {
        userId: user.id,
      });
      return NextResponse.json({ watchlists: [] });
    }

    // Get all listing IDs
    const listingIds = watchlistRows.map((w) => w.property_id).filter(Boolean) as string[];

    if (listingIds.length === 0) {
      logger.warn('Watchlist GET: Watchlist rows exist but no property_ids found', {
        watchlistRows: watchlistRows.length,
        userId: user.id,
      });
      return NextResponse.json({ 
        watchlists: watchlistRows.map((w) => ({
          id: w.id,
          user_id: w.user_id,
          property_id: w.property_id,
          created_at: w.created_at,
          listings: null,
        }))
      });
    }

    // CRITICAL: Use service-role client to fetch listings (bypasses RLS)
    // This ensures users can see listings they've saved, even if RLS would normally block them
    // The user already has access to these listings via their watchlist, so this is safe
    console.log('Watchlist listingIds', listingIds);

    const serviceClient = createSupabaseServerServiceRole();

    const { data: listingsData, error: listingsError } = await serviceClient
      .from('listings')
      .select('id, owner_id, title, address, city, state, zip, price, beds, bedrooms, baths, bathrooms, sqft, home_sqft, arv, repairs, spread, roi, images, cover_image_url, featured, featured_until, status, latitude, longitude, created_at')
      .in('id', listingIds);

    if (listingsError) {
      console.error('Watchlist listings query error', {
        error: listingsError.message,
        code: listingsError.code,
        listingIds,
      });
      logger.error('Watchlist GET: Error fetching listings', {
        error_code: listingsError.code,
        error_message: listingsError.message,
        listing_ids: listingIds,
        user_id: user.id,
      });
      // Continue even if listings fail - return watchlist items with null listings
    } else {
      console.log('Watchlist listings result', {
        requestedCount: listingIds.length,
        returnedCount: listingsData?.length ?? 0,
      });
      logger.log('Watchlist GET: Fetched listings for watchlist', {
        requestedIds: listingIds.length,
        foundListings: listingsData?.length || 0,
        foundListingIds: listingsData?.map(l => l.id) || [],
        missingListingIds: listingIds.filter(id => !listingsData?.some(l => l.id === id)),
      });

      // Log missing listings for debugging
      const missingIds = listingIds.filter(id => !listingsData?.some(l => l.id === id));
      if (missingIds.length > 0) {
        logger.warn('Watchlist GET: Some listings not found (may be deleted)', {
          missingIds,
          totalRequested: listingIds.length,
          found: listingsData?.length || 0,
        });
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
        logger.warn('Watchlist GET: Watchlist item has no listing data', {
          watchlistId: item.id,
          propertyId: item.property_id,
          possibleReasons: [
            'Listing was deleted from database',
            'Listing ID mismatch',
          ],
        });
      }
      
      return {
        id: item.id,
        user_id: item.user_id,
        property_id: item.property_id,
        created_at: item.created_at,
        listings: listing,
      };
    });

    logger.log('Watchlist GET: Returning enriched watchlists', {
      totalItems: enriched.length,
      itemsWithListings: enriched.filter(e => e.listings).length,
      itemsWithoutListings: enriched.filter(e => !e.listings).length,
    });

    return NextResponse.json({ watchlists: enriched });
  } catch (error) {
    logger.error('Watchlist GET: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.error('Watchlist GET: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add listing to watchlist
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // CRITICAL FIX: Use same auth logic as GET - check Authorization header, then getSession, then getUser
    let user = null;
    let userError = null;

    // Check for Authorization header from client
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('Watchlist POST: Using Authorization header token', {
        tokenLength: token.length,
      });
      const { data: userData, error: getUserError } = await supabase.auth.getUser(token);
      if (userData?.user) {
        user = userData.user;
        console.log('Watchlist POST: Got user from Authorization header', {
          userId: user.id,
          email: user.email,
        });
      } else {
        userError = getUserError;
      }
    }

    // If no user from header, try getSession (reads from cookies)
    if (!user) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        user = sessionData.session.user;
        console.log('Watchlist POST: Got user from session', {
          userId: user.id,
          email: user.email,
        });
      } else if (sessionError) {
        console.warn('Watchlist POST: Session error, trying getUser', {
          error: sessionError.message,
        });
        // Fallback to getUser (reads from cookies)
        const { data: userData, error: getUserError } = await supabase.auth.getUser();
        if (userData?.user) {
          user = userData.user;
        } else {
          userError = getUserError;
        }
      } else {
        // No session, try getUser
        const { data: userData, error: getUserError } = await supabase.auth.getUser();
        if (userData?.user) {
          user = userData.user;
        } else {
          userError = getUserError;
        }
      }
    }

    if (userError || !user) {
      console.error('Watchlist POST: Unauthorized', {
        getUserError: userError?.message,
        hasAuthHeader: !!authHeader,
      });
      logger.warn('Watchlist POST: Unauthorized request', {
        hasAuthHeader: !!authHeader,
        error: userError?.message,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
    }

    logger.log('Watchlist POST: Adding listing to watchlist', {
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
      logger.log('Watchlist POST: Listing already in watchlist', {
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
      logger.error('Watchlist POST: Error inserting watchlist', {
        error_code: error.code,
        error_message: error.message,
        user_id: user.id,
        listing_id: listingId,
      });
      console.error('Watchlist POST: Error inserting watchlist', {
        error: error.message,
        code: error.code,
      });
      if (error.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
    }

    logger.log('Watchlist POST: Successfully added to watchlist', {
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
        logger.log('Buyer interest notification sent', {
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
    }

    let listing = null;
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select(
        'id, owner_id, title, address, city, state, zip, price, beds, bedrooms, baths, bathrooms, sqft, home_sqft, arv, repairs, spread, roi, images, cover_image_url, featured, featured_until, latitude, longitude, created_at'
      )
      .eq('id', listingId)
      .maybeSingle();

    if (listingError) {
      logger.error('Watchlist POST: Error fetching listing', {
        error_code: listingError.code,
        error_message: listingError.message,
        listing_id: listingId,
      });
      console.error('Watchlist POST: Error fetching listing', {
        error: listingError.message,
        code: listingError.code,
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
        listings: listing,
      },
    });
  } catch (error) {
    logger.error('Watchlist POST: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.error('Watchlist POST: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove listing from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();

    // CRITICAL FIX: Use same auth logic as GET - check Authorization header, then getSession, then getUser
    let user = null;
    let userError = null;

    // Check for Authorization header from client
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: userData, error: getUserError } = await supabase.auth.getUser(token);
      if (userData?.user) {
        user = userData.user;
      } else {
        userError = getUserError;
      }
    }

    // If no user from header, try getSession (reads from cookies)
    if (!user) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        user = sessionData.session.user;
      } else if (sessionError) {
        // Fallback to getUser (reads from cookies)
        const { data: userData, error: getUserError } = await supabase.auth.getUser();
        if (userData?.user) {
          user = userData.user;
        } else {
          userError = getUserError;
        }
      } else {
        // No session, try getUser
        const { data: userData, error: getUserError } = await supabase.auth.getUser();
        if (userData?.user) {
          user = userData.user;
        } else {
          userError = getUserError;
        }
      }
    }

    if (userError || !user) {
      console.error('Watchlist DELETE: Unauthorized', {
        getUserError: userError?.message,
        hasAuthHeader: !!authHeader,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
    }

    logger.log('Watchlist DELETE: Removing listing from watchlist', {
      userId: user.id,
      listingId,
    });

    const { error } = await supabase
      .from('watchlists')
      .delete()
      .eq('user_id', user.id)
      .eq('property_id', listingId);

    if (error) {
      logger.error('Watchlist DELETE: Error deleting watchlist', {
        error_code: error.code,
        error_message: error.message,
        user_id: user.id,
        listing_id: listingId,
      });
      console.error('Watchlist DELETE: Error deleting watchlist', {
        error: error.message,
        code: error.code,
      });
      if (error.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
    }

    logger.log('Watchlist DELETE: Successfully removed from watchlist', {
      userId: user.id,
      listingId,
    });

    return NextResponse.json({ message: 'Removed from watchlist' });
  } catch (error) {
    logger.error('Watchlist DELETE: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    console.error('Watchlist DELETE: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
