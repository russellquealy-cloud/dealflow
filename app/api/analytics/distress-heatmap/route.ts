import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';
import { calculateDistressScore, calculateDaysOnMarket, calculatePricePerSqft } from '@/lib/analytics/distress';

export const runtime = 'nodejs';

/**
 * GET /api/analytics/distress-heatmap
 * Returns listing locations with distress scores for heatmap visualization.
 * 
 * For wholesalers: Shows their own listings with distress scores.
 * For investors: Shows all live listings with distress scores.
 * 
 * Distress score is computed based on:
 * - Days on market
 * - Price per sqft vs market average
 * - Market-level indicators (price cuts, days to close)
 * 
 * Returns: [{ lat, lng, distressScore, listingId, address, city, state, zip, listingCount }]
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role to determine data scope
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, segment')
      .eq('id', user.id)
      .maybeSingle<{ role: string | null; segment: string | null }>();

    const roleValue = (profile?.role || profile?.segment || 'investor').toLowerCase();
    const isWholesaler = roleValue === 'wholesaler';

    // Fetch listings with location and price/sqft data
    let query = supabase
      .from('listings')
      .select('id, latitude, longitude, price, sqft, address, city, state, zip, status, created_at')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .not('price', 'is', null);

    // Wholesalers see their own listings; investors see all live listings
    if (isWholesaler) {
      query = query.eq('owner_id', user.id);
    } else {
      query = query.eq('status', 'live');
    }

    const { data: listings, error: listingsError } = await query;

    if (listingsError) {
      console.error('Error fetching listings for distress heatmap:', listingsError);
      return NextResponse.json(
        { error: 'Failed to fetch listings for distress heatmap' },
        { status: 500 }
      );
    }

    if (!listings || listings.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    // Fetch market snapshot data for relevant regions
    // We'll match by state_name and region_name (city or MSA)
    const { data: marketData } = await supabase
      .from('market_snapshots')
      .select('region_name, state_name, pct_listings_price_cut, median_days_to_close, zhvi_mid_sfr')
      .in('region_type', ['msa', 'city', 'metro']);

    // Create a map of location -> market data
    const marketMap = new Map<string, {
      priceCutPct: number | null;
      daysToClose: number | null;
      pricePerSqft: number | null;
    }>();

    marketData?.forEach((market: {
      region_name: string | null;
      state_name: string | null;
      pct_listings_price_cut: number | null;
      median_days_to_close: number | null;
      zhvi_mid_sfr: number | null;
    }) => {
      if (market.state_name && market.region_name) {
        // Create keys for both exact match and state-only fallback
        const exactKey = `${market.state_name}|${market.region_name.toLowerCase()}`;
        const stateKey = `${market.state_name}|`;
        // Estimate price per sqft from ZHVI (divide by ~2000 sqft average home size)
        const estimatedPricePerSqft = market.zhvi_mid_sfr ? market.zhvi_mid_sfr / 2000 : null;
        const marketInfo = {
          priceCutPct: market.pct_listings_price_cut,
          daysToClose: market.median_days_to_close,
          pricePerSqft: estimatedPricePerSqft,
        };
        // Store for exact match
        marketMap.set(exactKey, marketInfo);
        // Store for state-only fallback (only if not already set)
        if (!marketMap.has(stateKey)) {
          marketMap.set(stateKey, marketInfo);
        }
      }
    });

    // Calculate distress scores for each listing
    type ListingRow = {
      id: string;
      latitude: number | null;
      longitude: number | null;
      price: number | null;
      sqft: number | null;
      address: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
      status: string | null;
      created_at: string | null;
    };

    const heatmapData = ((listings || []) as ListingRow[])
      .filter((listing) => listing.latitude != null && listing.longitude != null && listing.price != null)
      .map((listing) => {
        const daysOnMarket = calculateDaysOnMarket(listing.created_at);
        const pricePerSqft = calculatePricePerSqft(listing.price, listing.sqft);
        
        // Get market data for this location (try exact match first, then state-only)
        const locationKey = listing.state && listing.city 
          ? `${listing.state}|${listing.city.toLowerCase()}`
          : listing.state 
          ? `${listing.state}|`
          : null;
        
        const marketInfo = locationKey ? marketMap.get(locationKey) : null;
        
        // Calculate distress score
        const distressScore = calculateDistressScore({
          daysOnMarket,
          pricePerSqft,
          marketPricePerSqft: marketInfo?.pricePerSqft ?? null,
          marketPriceCutPct: marketInfo?.priceCutPct ?? null,
          marketDaysToClose: marketInfo?.daysToClose ?? null,
          hasPriceReduction: false, // TODO: Track price reductions if we add that field
        });

        return {
          lat: listing.latitude as number,
          lng: listing.longitude as number,
          distressScore,
          listingId: listing.id,
          address: listing.address || null,
          city: listing.city || null,
          state: listing.state || null,
          zip: listing.zip || null,
          listingCount: 1, // For individual listings, count is always 1
        };
      });

    return NextResponse.json({ data: heatmapData }, { status: 200 });
  } catch (error) {
    console.error('Error in distress heatmap API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
