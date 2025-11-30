import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { isAdmin } from '@/lib/admin';

/**
 * Diagnostic endpoint to check listing data and RLS policies
 * GET /api/debug/listings
 * Query params: ?city=Miami&state=FL or ?city=Tucson&state=AZ
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    const userIsAdmin = user ? isAdmin(user.email || user.id) : false;

    // Note: city and state filters could be added here if needed for future filtering
    // const { searchParams } = new URL(request.url);

    // Get total count
    const { count: totalCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true });

    // Get listings with coordinates
    const { count: withCoordsCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    // Get Miami listings
    const { data: miamiListings, count: miamiCount } = await supabase
      .from('listings')
      .select('id, title, city, state, status, latitude, longitude, owner_id, created_at', { count: 'exact' })
      .eq('city', 'Miami')
      .eq('state', 'FL');

    // Get Tucson listings
    const { data: tucsonListings, count: tucsonCount } = await supabase
      .from('listings')
      .select('id, title, city, state, status, latitude, longitude, owner_id, created_at', { count: 'exact' })
      .eq('city', 'Tucson')
      .eq('state', 'AZ');

    // Get listings by status
    const { count: liveCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .or('status.eq.live,status.is.null');

    // Get listings matching API query conditions (what the API would return)
    let apiQuery = supabase
      .from('listings')
      .select('id, title, city, state, status, latitude, longitude', { count: 'exact' })
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (!userIsAdmin) {
      apiQuery = apiQuery.or('status.eq.live,status.is.null');
    }

    const { data: apiListings, count: apiCount } = await apiQuery;

    return NextResponse.json({
      user: {
        id: user?.id || null,
        email: user?.email || null,
        isAdmin: userIsAdmin
      },
      counts: {
        total: totalCount || 0,
        withCoordinates: withCoordsCount || 0,
        liveOrNull: liveCount || 0,
        matchingApiQuery: apiCount || 0
      },
      miami: {
        count: miamiCount || 0,
        listings: miamiListings || []
      },
      tucson: {
        count: tucsonCount || 0,
        listings: tucsonListings || []
      },
      apiQueryResults: {
        count: apiCount || 0,
        sample: (apiListings || []).slice(0, 10) // First 10 for debugging
      },
      note: 'This endpoint shows what data exists and what the API query would return'
    });
  } catch (error) {
    console.error('Debug listings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

