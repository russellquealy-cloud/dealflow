import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';

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
  bedrooms?: number | null;
  bathrooms?: number | null;
  home_sqft?: number | null;
  arv?: number | null;
  repairs?: number | null;
  spread?: number | null;
  roi?: number | null;
  images?: unknown;
  cover_image_url?: string | null;
  featured?: boolean | null;
  featured_until?: string | null;
  owner_profile?: Record<string, unknown> | null;
};

function sanitizeListing(listing: ListingSummary | null | undefined) {
  if (!listing) return null;
  const imagesValue = (() => {
    if (Array.isArray(listing.images)) return listing.images as string[];
    if (typeof listing.images === 'string') return [listing.images];
    return [];
  })();

  return {
    id: listing.id,
    title: listing.title ?? null,
    address: listing.address ?? null,
    city: listing.city ?? null,
    state: listing.state ?? null,
    zip: listing.zip ?? null,
    price: listing.price ?? null,
    bedrooms: listing.bedrooms ?? null,
    baths: listing.bathrooms ?? null,
    bathrooms: listing.bathrooms ?? null,
    home_sqft: listing.home_sqft ?? null,
    arv: listing.arv ?? null,
    repairs: listing.repairs ?? null,
    spread: listing.spread ?? null,
    roi: listing.roi ?? null,
    images: imagesValue,
    cover_image_url: listing.cover_image_url ?? null,
    featured: listing.featured ?? false,
    featured_until: listing.featured_until ?? null,
  };
}

// GET: Fetch user's watchlist
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser(request);

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If listingId provided, check if it's in watchlist
    if (listingId) {
      const { data: watchlist, error } = await supabase
        .from('watchlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('property_id', listingId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('watchlists select error (single)', {
          table: 'watchlists',
          error_code: error.code,
          error_message: error.message,
          user_id: user.id,
        });
        if (error.code === '42501') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
      }

      return NextResponse.json({ isInWatchlist: !!watchlist });
    }

    // First, get all watchlist items for the user
    const { data: watchlistRows, error: watchlistError } = await supabase
      .from('watchlists')
      .select('id, user_id, property_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (watchlistError) {
      console.error('watchlists select error', {
        table: 'watchlists',
        error_code: watchlistError.code,
        error_message: watchlistError.message,
        user_id: user.id,
      });
      if (watchlistError.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to fetch watchlists' }, { status: 500 });
    }

    if (!watchlistRows || watchlistRows.length === 0) {
      return NextResponse.json({ watchlists: [] });
    }

    // Get all listing IDs
    const listingIds = watchlistRows.map((w) => w.property_id).filter(Boolean) as string[];

    if (listingIds.length === 0) {
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
      console.log('📋 Fetching listings for watchlist:', {
        listingIds: listingIds,
        listingCount: listingIds.length,
        userId: user.id,
        userEmail: user.email,
      });

      // Query listings without status filter - users should see listings they saved regardless of status
      // This is different from the main listings API which only shows 'live' listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('id, owner_id, title, address, city, state, zip, price, bedrooms, bathrooms, home_sqft, arv, repairs, spread, roi, images, cover_image_url, featured, featured_until, status')
        .in('id', listingIds);

      if (listingsError) {
        console.error('❌ listings select error (for watchlist)', {
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
        console.log('✅ Fetched listings for watchlist:', {
          requestedIds: listingIds.length,
          foundListings: listingsData?.length || 0,
          foundListingIds: listingsData?.map(l => l.id) || [],
          missingListingIds: listingIds.filter(id => !listingsData?.some(l => l.id === id)),
          listingStatuses: listingsData?.map(l => ({ id: l.id, status: (l as any).status })) || [],
        });
        
        // Log if any listings are missing
        const missingIds = listingIds.filter(id => !listingsData?.some(l => l.id === id));
        if (missingIds.length > 0) {
          console.warn('⚠️ Some listings not found:', {
            missingIds,
            possibleReasons: [
              'Listing was deleted',
              'RLS policy blocking access',
              'Listing ID mismatch',
              'Listing status prevents access (check RLS policies)',
            ],
          });
          
          // Try to verify if listings exist by checking with a direct query (for debugging)
          console.log('🔍 Attempting to verify listing existence...');
          for (const missingId of missingIds) {
            const { data: checkData, error: checkError } = await supabase
              .from('listings')
              .select('id, status, owner_id')
              .eq('id', missingId)
              .maybeSingle();
            
            if (checkError) {
              console.error(`❌ Cannot access listing ${missingId}:`, {
                error_code: checkError.code,
                error_message: checkError.message,
                likelyCause: checkError.code === '42501' ? 'RLS policy blocking access' : 'Other error',
              });
            } else if (checkData) {
              console.log(`✅ Listing ${missingId} exists but wasn't returned in batch query:`, {
                status: checkData.status,
                owner_id: checkData.owner_id,
                note: 'This suggests an RLS policy issue or query filter problem',
              });
            } else {
              console.log(`❌ Listing ${missingId} does not exist in database`);
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
        console.warn('⚠️ Watchlist item has no listing data:', {
          watchlistId: item.id,
          propertyId: item.property_id,
          listingInMap: !!listingData,
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

    console.log('📋 Returning enriched watchlists:', {
      totalItems: enriched.length,
      itemsWithListings: enriched.filter(e => e.listing).length,
      itemsWithoutListings: enriched.filter(e => !e.listing).length,
    });

    // Include diagnostic info to help debug watchlist issues
    // Always include for now to diagnose the issue, can be removed later
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
    console.error('Error in watchlists GET:', error);
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

    const { data: existing } = await supabase
      .from('watchlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', listingId)
      .single();

    if (existing) {
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
      console.error('watchlists insert error', {
        table: 'watchlists',
        error_code: error.code,
        error_message: error.message,
        user_id: user.id,
      });
      if (error.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
    }

    let listing = null;
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select(
        'id, owner_id, title, address, city, state, zip, price, bedrooms, bathrooms, home_sqft, arv, repairs, spread, roi, images, cover_image_url, featured, featured_until'
      )
      .eq('id', listingId)
      .maybeSingle();

    if (listingError) {
      console.error('listings select error (single for watchlist)', listingError);
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
    console.error('Error in watchlists POST:', error);
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

    const { error } = await supabase
      .from('watchlists')
      .delete()
      .eq('user_id', user.id)
      .eq('property_id', listingId);

    if (error) {
      console.error('watchlists delete error', {
        table: 'watchlists',
        error_code: error.code,
        error_message: error.message,
        user_id: user.id,
      });
      if (error.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Removed from watchlist' });
  } catch (error) {
    console.error('Error in watchlists DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

