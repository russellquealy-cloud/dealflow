import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { getSupabaseServiceRole } from '@/lib/supabase/service';

type WatchlistRow = {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
  listing?: ListingSummary | null;
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

    // If no user, return false for watchlist status (don't return 401 to prevent console errors)
    if (!user) {
      if (listingId) {
        return NextResponse.json({ isInWatchlist: false });
      }
      return NextResponse.json({ watchlists: [] });
    }

    // If listingId provided, check if it's in watchlist
    if (listingId) {
      const { data: watchlist, error } = await supabase
        .from('watchlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('property_id', listingId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking watchlist:', error);
        return NextResponse.json({ isInWatchlist: false }); // Return false instead of error
      }

      return NextResponse.json({ isInWatchlist: !!watchlist });
    }

    // Otherwise, fetch all watchlists
    const { data: watchlists, error } = await supabase
      .from('watchlists')
      .select(
        `
        id,
        user_id,
        property_id,
        created_at,
        listing:property_id (
          id,
          title,
          address,
          city,
          state,
          zip,
          price,
          bedrooms,
          bathrooms,
          home_sqft,
          arv,
          repairs,
          spread,
          roi,
          images,
          cover_image_url,
          featured,
          featured_until
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlists:', error);
      return NextResponse.json({ error: 'Failed to fetch watchlists' }, { status: 500 });
    }

    const items = (watchlists ?? []) as WatchlistRow[];
    const propertyIds = Array.from(new Set(items.map((item) => item.property_id).filter(Boolean)));

    let listingsMap = new Map<string, ReturnType<typeof sanitizeListing>>();

    if (propertyIds.length > 0) {
      let resolved = false;
      try {
        const serviceSupabase = await getSupabaseServiceRole();
        const { data: listingsData, error: listingsError } = await serviceSupabase
          .from('listings')
          .select(
            'id, title, address, city, state, zip, price, bedrooms, bathrooms, home_sqft, arv, repairs, spread, roi, images, cover_image_url, featured, featured_until'
          )
          .in('id', propertyIds);

        if (listingsError) {
          console.error('Error loading listings for watchlists via service role:', listingsError);
        } else if (listingsData) {
          listingsMap = new Map(
            listingsData.map((listing) => [listing.id, sanitizeListing(listing as ListingSummary)])
          );
          resolved = true;
        }
      } catch (serviceError) {
        console.error('Service role unavailable for watchlists:', serviceError);
      }

      if (!resolved) {
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select(
            'id, title, address, city, state, zip, price, bedrooms, bathrooms, home_sqft, arv, repairs, spread, roi, images, cover_image_url, featured, featured_until'
          )
          .in('id', propertyIds);

        if (listingsError) {
          console.error('Error loading listings for watchlists with user context:', listingsError);
        } else if (listingsData) {
          listingsMap = new Map(
            listingsData.map((listing) => [listing.id, sanitizeListing(listing as ListingSummary)])
          );
        }
      }
    }

    const enriched = items.map((item) => {
      const joinedListing = item.listing ? sanitizeListing(item.listing) : null;
      return {
        id: item.id,
        user_id: item.user_id,
        property_id: item.property_id,
        created_at: item.created_at,
        listing: joinedListing ?? listingsMap.get(item.property_id) ?? null,
      };
    });

    return NextResponse.json({ watchlists: enriched });
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

    // Check if already in watchlist
    const { data: existing } = await supabase
      .from('watchlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', listingId)
      .single();

    if (existing) {
      return NextResponse.json({ message: 'Already in watchlist', watchlist: existing });
    }

    // Add to watchlist
    const { data: watchlistRow, error } = await supabase
      .from('watchlists')
      .insert({
        user_id: user.id,
        property_id: listingId
      })
      .select('id, user_id, property_id, created_at')
      .single();

    if (error) {
      console.error('Error adding to watchlist:', error);
      return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
    }

    let listing = null;
    try {
      const serviceSupabase = await getSupabaseServiceRole();
      const { data: listingData, error: listingError } = await serviceSupabase
        .from('listings')
        .select(
          'id, title, address, city, state, zip, price, bedrooms, bathrooms, home_sqft, arv, repairs, spread, roi, images, cover_image_url, featured, featured_until'
        )
        .eq('id', listingId)
        .maybeSingle();

      if (listingError) {
        console.error('Error fetching listing for watchlist response:', listingError);
      }
      listing = sanitizeListing(listingData as ListingSummary | null | undefined);
    } catch (serviceError) {
      console.error('Service role unavailable fetching watchlist listing:', serviceError);
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
      console.error('Error removing from watchlist:', error);
      return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Removed from watchlist' });
  } catch (error) {
    console.error('Error in watchlists DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

