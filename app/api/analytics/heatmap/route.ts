import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/analytics/heatmap
 * Returns listing locations with view counts for heatmap visualization.
 * 
 * For wholesalers: Shows their own listings with view counts (investor interest).
 * For investors: Shows all live listings with view counts (market interest).
 * 
 * Returns: [{ id, lat, lng, views, address, city, state, zip }]
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

    let query = supabase
      .from('listings')
      .select('id, latitude, longitude, views, address, city, state, zip, status')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    // Wholesalers see their own listings; investors see all live listings
    if (isWholesaler) {
      query = query.eq('owner_id', user.id);
    } else {
      query = query.eq('status', 'live');
    }

    const { data: listings, error } = await query;

    if (error) {
      console.error('Error fetching listings for heatmap:', error);
      return NextResponse.json(
        { error: 'Failed to fetch listings for heatmap' },
        { status: 500 }
      );
    }

    // Transform to heatmap data format
    type ListingRow = {
      id: string;
      latitude: number | null;
      longitude: number | null;
      views: number | null;
      address: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
      status: string | null;
    };
    
    const heatmapData = ((listings || []) as ListingRow[])
      .filter((listing) => listing.latitude != null && listing.longitude != null)
      .map((listing) => ({
        id: listing.id,
        lat: listing.latitude as number,
        lng: listing.longitude as number,
        views: listing.views ?? 0,
        address: listing.address || null,
        city: listing.city || null,
        state: listing.state || null,
        zip: listing.zip || null,
      }));

    return NextResponse.json({ data: heatmapData }, { status: 200 });
  } catch (error) {
    console.error('Error in heatmap API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

