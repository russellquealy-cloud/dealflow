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
        console.error('watchlists select error (single)', error);
        if (error.code === '42501') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
      }

      return NextResponse.json({ isInWatchlist: !!watchlist });
    }

    const { data: watchlistRows, error: watchlistError } = await supabase
      .from('watchlists')
      .select('id, user_id, property_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (watchlistError) {
      console.error('watchlists select error', watchlistError);
      if (watchlistError.code === '42501') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Failed to fetch watchlists' }, { status: 500 });
    }

    const items = (watchlistRows ?? []) as WatchlistRow[];
    const propertyIds = Array.from(new Set(items.map((item) => item.property_id).filter(Boolean)));

    type ListingWithOwner = ReturnType<typeof sanitizeListing> & { owner_profile: Record<string, unknown> | null };
    let listingsMap = new Map<string, ListingWithOwner | null>();

    if (propertyIds.length > 0) {
        const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select(
            'id, owner_id, title, address, city, state, zip, price, bedrooms, bathrooms, home_sqft, arv, repairs, spread, roi, images, cover_image_url, featured, featured_until'
        )
        .in('id', propertyIds);

      if (listingsError) {
        console.error('listings select error (watchlists enrichment)', listingsError);
        if (listingsError.code === '42501') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else if (listingsData) {
        const listingsArray = listingsData as Array<Record<string, unknown>>;
        const ownerIds = Array.from(
          new Set(
            listingsArray
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
            console.error('Owner profile fetch error (watchlists)', ownerError);
          } else if (ownerProfiles) {
            ownerProfiles.forEach((profileRow) => {
              ownerProfilesMap.set(profileRow.id, profileRow);
            });
          }
        }

        const mapEntries: Array<[string, ListingWithOwner | null]> = listingsArray
          .map((listing) => {
            const ownerId = typeof listing.owner_id === 'string' ? listing.owner_id : undefined;
            const core = sanitizeListing(listing as ListingSummary);
            const ownerProfile = ownerId ? ownerProfilesMap.get(ownerId) ?? null : null;
            const listingId = typeof listing.id === 'string' ? listing.id : String(listing.id ?? '');
            if (!listingId) return null;
            return [listingId, { ...core, owner_profile: ownerProfile }] as [string, ListingWithOwner | null];
          })
          .filter((entry): entry is [string, ListingWithOwner | null] => entry !== null);
        
        listingsMap = new Map(mapEntries);
      }
    }

    const enriched = items.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      property_id: item.property_id,
      created_at: item.created_at,
      listing: listingsMap.get(item.property_id) ?? null,
    }));

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
      console.error('watchlists insert error', error);
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
      console.error('watchlists delete error', error);
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

