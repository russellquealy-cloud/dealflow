import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '../../lib/supabaseRoute';
import { logger } from '@/lib/logger';
import { notifyBuyerInterest } from '@/lib/notifications';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Watchlist API Route
// Handles GET (fetch watchlist), POST (add to watchlist), DELETE (remove from watchlist)
// All handlers use getAuthUserServer() to ensure authenticated user context for RLS

type WatchlistRow = {
  id: string;
  user_id: string;
  property_id: string | null;
  created_at: string;
};

type ListingSummary = {
  id: string;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  featured_image_url: string | null;
};

type WatchlistApiItem = WatchlistRow & {
  listing: ListingSummary | null;
};

// Type for full listing data used in POST handler (different from simplified ListingSummary)
type FullListingData = {
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

function sanitizeListing(listing: FullListingData | null | undefined) {
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
export const runtime = 'nodejs';

// GET: Fetch user's watchlist
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user using standard auth helper with bearer token fallback
    // This matches the pattern used in POST handler - must use bearer client for RLS
    let supabase = await getSupabaseRouteClient();
    
    // Try getUser first (standard approach - reads from cookies)
    let { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // If getUser fails, try Authorization header bearer token (fallback for cases where cookies aren't sent)
    // CRITICAL: When using bearer token, we need to create a new Supabase client that uses the token
    // so that RLS policies can access auth.uid() via the Authorization header
    if (userError || !user) {
      const authHeader = request.headers.get('authorization');
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      if (bearerToken) {
        console.log('[watchlists GET] Cookie auth failed, trying bearer token');
        
        // Create a new Supabase client that uses the bearer token for all requests
        // This ensures RLS policies can access auth.uid() via the Authorization header
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseAnonKey) {
          const bearerClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
            global: {
              headers: {
                Authorization: `Bearer ${bearerToken}`,
              },
            },
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          });
          
          // Validate the token by getting the user
          const { data: { user: tokenUser }, error: tokenError } = await bearerClient.auth.getUser();
          
          if (tokenUser && !tokenError) {
            user = tokenUser;
            userError = null;
            supabase = bearerClient; // Use the bearer token client for subsequent queries
            console.log('[watchlists GET] Bearer token auth succeeded, using bearer client for RLS', { userId: user.id });
          } else {
            console.warn('[watchlists GET] Bearer token validation failed', { error: tokenError?.message });
          }
        }
      }
    }
    
    // Fallback to getSession if getUser fails
    if (userError || !user) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (session && !sessionError) {
        user = session.user;
        userError = null;
        console.log('[watchlists GET] Using session user from getSession fallback');
      }
    }

    if (!user || userError) {
      logger.warn('[watchlist GET] Unauthorized - no authenticated user', {
        error: userError?.message,
        hasAuthHeader: !!request.headers.get('authorization'),
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // CRITICAL: Ignore any userId query parameter - we always use the authenticated user
    // The server must trust auth.uid()/user.id, not the query string
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

    // 2) Fetch watchlist rows for this user
    const { data: watchRows, error: watchError } = await supabase
      .from('watchlists')
      .select('id, user_id, property_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (watchError) {
      console.error('[watchlists] Failed to load watchlists', watchError);
      logger.error('Watchlist GET: Error fetching watchlist rows', {
        error_code: watchError.code,
        error_message: watchError.message,
        user_id: user.id,
      });
      if (watchError.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to fetch watchlists' }, { status: 500 });
    }

    if (!watchRows || watchRows.length === 0) {
      return NextResponse.json({ count: 0, watchlists: [] });
    }

    // 3) Collect all property_ids (we treat them as listing ids)
    const typedWatchRows = watchRows as WatchlistRow[];
    const listingIds = Array.from(
      new Set(
        typedWatchRows
          .map((row) => row.property_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    // 4) Fetch listings in one query
    const { data: listingRows, error: listingError } = await supabase
      .from('listings')
      .select('id, title, address, city, state, zip, price, beds, baths, sqft, images')
      .in('id', listingIds);

    if (listingError) {
      console.error('[watchlists] Failed to load listings', listingError);
      logger.error('Watchlist GET: Error fetching listings', {
        error_code: listingError.code,
        error_message: listingError.message,
        user_id: user.id,
      });
      // Continue anyway - we'll mark listings as unavailable
    }

    // Create a map of listing ID -> listing data
    const listingMap = new Map<string, ListingSummary>();

    if (listingRows && Array.isArray(listingRows)) {
      listingRows.forEach((listing: unknown) => {
        const row = listing as {
          id: string;
          title?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          price?: number | null;
          beds?: number | null;
          baths?: number | null;
          sqft?: number | null;
          images?: unknown;
        };
        if (row && row.id) {
          // Extract first image from images array if it exists
          const featuredImageUrl = Array.isArray(row.images) && row.images.length > 0
            ? (row.images[0] as string)
            : null;

          listingMap.set(row.id, {
            id: row.id,
            title: row.title ?? null,
            address: row.address ?? null,
            city: row.city ?? null,
            state: row.state ?? null,
            zip: row.zip ?? null,
            price: row.price ?? null,
            beds: row.beds ?? null,
            baths: row.baths ?? null,
            sqft: row.sqft ?? null,
            featured_image_url: featuredImageUrl,
          });
        }
      });
    }

    // 5) Build final payload
    const items: WatchlistApiItem[] = typedWatchRows.map((row) => ({
      ...row,
      listing: row.property_id ? listingMap.get(row.property_id) ?? null : null,
    }));

    logger.log('Watchlist GET: Fetched watchlist rows with listings', {
      count: items.length,
      withListing: items.filter((w) => w.listing).length,
      withoutListing: items.filter((w) => !w.listing).length,
    });

    const responseData = {
      count: items.length,
      watchlists: items,
    };

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[api/watchlists] response', JSON.stringify(responseData, null, 2));
    }

    return NextResponse.json(responseData);
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
    // Get authenticated user using standard auth helper with bearer token fallback
    // This matches the pattern used in /api/notifications and /api/messages routes
    let supabase = await getSupabaseRouteClient();
    
    // Try getUser first (standard approach - reads from cookies)
    let { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // If getUser fails, try Authorization header bearer token (fallback for cases where cookies aren't sent)
    // CRITICAL: When using bearer token, we need to create a new Supabase client that uses the token
    // so that RLS policies can access auth.uid() via the Authorization header
    if (userError || !user) {
      const authHeader = request.headers.get('authorization');
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      if (bearerToken) {
        console.log('[watchlists POST] Cookie auth failed, trying bearer token');
        
        // Create a new Supabase client that uses the bearer token for all requests
        // This ensures RLS policies can access auth.uid() via the Authorization header
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseAnonKey) {
          const bearerClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
            global: {
              headers: {
                Authorization: `Bearer ${bearerToken}`,
              },
            },
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          });
          
          // Validate the token by getting the user
          const { data: { user: tokenUser }, error: tokenError } = await bearerClient.auth.getUser();
          
          if (tokenUser && !tokenError) {
            user = tokenUser;
            userError = null;
            supabase = bearerClient; // Use the bearer token client for subsequent queries
            console.log('[watchlists POST] Bearer token auth succeeded, using bearer client for RLS', { userId: user.id });
          } else {
            console.warn('[watchlists POST] Bearer token validation failed', { error: tokenError?.message });
          }
        }
      }
    }
    
    // Fallback to getSession if getUser fails
    if (userError || !user) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (session && !sessionError) {
        user = session.user;
        userError = null;
        console.log('[watchlists POST] Using session user from getSession fallback');
      }
    }

    if (!user || userError) {
      logger.warn('[watchlist POST] Unauthorized - no authenticated user', {
        error: userError?.message,
        hasAuthHeader: !!request.headers.get('authorization'),
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { listingId } = await request.json();

    if (!listingId || typeof listingId !== 'string') {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
    }

    logger.log('Watchlist POST: Adding listing to watchlist', {
      userId: user.id,
      listingId,
    });

    // Check if already in watchlist (handle unique constraint gracefully)
    const { data: existing } = await supabase
      .from('watchlists')
      .select('id, user_id, property_id, created_at')
      .eq('user_id', user.id)
      .eq('property_id', listingId)
      .maybeSingle();

    if (existing) {
      logger.log('Watchlist POST: Listing already in watchlist', {
        userId: user.id,
        listingId,
      });
      return NextResponse.json({ 
        message: 'Already in watchlist', 
        watchlist: existing 
      }, { status: 200 });
    }

    // Insert new watchlist entry
    // user_id is set from authenticated user - never trust client input
    // RLS policy watchlists_insert_own will verify: WITH CHECK (auth.uid() = user_id)
    const { data: watchlistRowData, error } = await supabase
      .from('watchlists')
      .insert({
        user_id: user.id,  // Must match auth.uid() for RLS to pass
        property_id: listingId,
      } as never)
      .select('id, user_id, property_id, created_at')
      .single();
    
    const watchlistRow = watchlistRowData as WatchlistRow | null;

    if (error) {
      logger.error('Watchlist POST: Error inserting watchlist', {
        error_code: error.code,
        error_message: error.message,
        error_details: error.details,
        error_hint: error.hint,
        user_id: user.id,
        listing_id: listingId,
      });
      
      // Handle unique constraint violation (race condition)
      if (error.code === '23505') {
        // Duplicate key - someone else or race condition added it
        const { data: existingRow } = await supabase
          .from('watchlists')
          .select('id, user_id, property_id, created_at')
          .eq('user_id', user.id)
          .eq('property_id', listingId)
          .maybeSingle();
        if (existingRow) {
          return NextResponse.json({ 
            message: 'Already in watchlist', 
            watchlist: existingRow 
          }, { status: 200 });
        }
      }
      
      // RLS policy violation
      if (error.code === '42501') {
        return NextResponse.json({ 
          error: 'Forbidden',
          details: error.details || 'Row Level Security policy prevented this operation.',
          hint: error.hint || 'Check RLS policies on watchlists table'
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to add to watchlist', 
        details: error.message 
      }, { status: 500 });
    }

    logger.log('Watchlist POST: Successfully added to watchlist', {
      userId: user.id,
      listingId,
      watchlistId: watchlistRow?.id,
    });

    // Notify listing owner using the simple helper (as requested)
    try {
      const { data: listingData } = await supabase
        .from('listings')
        .select('owner_id, title')
        .eq('id', listingId)
        .maybeSingle<{ owner_id: string | null; title: string | null }>();

      if (listingData?.owner_id && listingData.owner_id !== user.id) {
        const { createNotification } = await import('@/lib/notifications');
        await createNotification(listingData.owner_id, 'saved', listingId);
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
      .maybeSingle<ListingSummary>();

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
      const ownerId = (listingData as FullListingData | null)?.owner_id as string | undefined;
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
      const core = sanitizeListing(listingData as FullListingData | null | undefined);
      listing = core ? { ...core, owner_profile: ownerProfile } : null;
    }

    return NextResponse.json({
      watchlist: watchlistRow ? {
        id: watchlistRow.id,
        user_id: watchlistRow.user_id,
        property_id: watchlistRow.property_id,
        created_at: watchlistRow.created_at,
        listings: listing,
      } : null,
    }, { status: 201 });
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
    // Get authenticated user using standard auth helper with bearer token fallback
    // This matches the pattern used in /api/notifications and /api/messages routes
    let supabase = await getSupabaseRouteClient();
    
    // Try getUser first (standard approach - reads from cookies)
    let { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // If getUser fails, try Authorization header bearer token (fallback for cases where cookies aren't sent)
    // CRITICAL: When using bearer token, we need to create a new Supabase client that uses the token
    // so that RLS policies can access auth.uid() via the Authorization header
    if (userError || !user) {
      const authHeader = request.headers.get('authorization');
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
      
      if (bearerToken) {
        console.log('[watchlists DELETE] Cookie auth failed, trying bearer token');
        
        // Create a new Supabase client that uses the bearer token for all requests
        // This ensures RLS policies can access auth.uid() via the Authorization header
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseAnonKey) {
          const bearerClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
            global: {
              headers: {
                Authorization: `Bearer ${bearerToken}`,
              },
            },
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          });
          
          // Validate the token by getting the user
          const { data: { user: tokenUser }, error: tokenError } = await bearerClient.auth.getUser();
          
          if (tokenUser && !tokenError) {
            user = tokenUser;
            userError = null;
            supabase = bearerClient; // Use the bearer token client for subsequent queries
            console.log('[watchlists DELETE] Bearer token auth succeeded, using bearer client for RLS', { userId: user.id });
          } else {
            console.warn('[watchlists DELETE] Bearer token validation failed', { error: tokenError?.message });
          }
        }
      }
    }
    
    // Fallback to getSession if getUser fails
    if (userError || !user) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (session && !sessionError) {
        user = session.user;
        userError = null;
        console.log('[watchlists DELETE] Using session user from getSession fallback');
      }
    }

    if (!user || userError) {
      logger.warn('[watchlist DELETE] Unauthorized - no authenticated user', {
        error: userError?.message,
        hasAuthHeader: !!request.headers.get('authorization'),
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
