import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserServer, createSupabaseRouteClient } from '@/lib/auth/server';

/**
 * Debug endpoint to verify watchlist data and listings
 * GET /api/debug/watchlist?watchlistId=xxx&propertyId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthUserServer();
    const supabase = createSupabaseRouteClient();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const watchlistId = searchParams.get('watchlistId');
    const propertyId = searchParams.get('propertyId');

    const debug: Record<string, unknown> = {
      user: {
        id: user.id,
        email: user.email
      }
    };

    // If specific IDs provided, check those
    if (watchlistId || propertyId) {
      if (watchlistId) {
        const { data: watchlistRow, error: watchlistError } = await supabase
          .from('watchlists')
          .select('*')
          .eq('id', watchlistId)
          .eq('user_id', user.id)
          .maybeSingle<{ property_id: string | null; [key: string]: unknown }>();

        debug.watchlistRow = {
          data: watchlistRow,
          error: watchlistError ? {
            code: watchlistError.code,
            message: watchlistError.message
          } : null
        };

        if (watchlistRow?.property_id) {
          const { data: listingRow, error: listingError } = await supabase
            .from('listings')
            .select('id, title, status, owner_id, created_at')
            .eq('id', watchlistRow.property_id)
            .maybeSingle();

          debug.listingRow = {
            propertyId: watchlistRow.property_id,
            data: listingRow,
            error: listingError ? {
              code: listingError.code,
              message: listingError.message
            } : null
          };
        }
      }

      if (propertyId) {
        const { data: listingRow, error: listingError } = await supabase
          .from('listings')
          .select('id, title, status, owner_id, created_at, latitude, longitude')
          .eq('id', propertyId)
          .maybeSingle();

        debug.listingByPropertyId = {
          propertyId,
          data: listingRow,
          error: listingError ? {
            code: listingError.code,
            message: listingError.message
          } : null
        };
      }
    } else {
      // Get all watchlist items for user
      const { data: watchlistRows, error: watchlistError } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
        .returns<{ property_id: string | null; [key: string]: unknown }[]>();

      debug.watchlistRows = {
        count: watchlistRows?.length || 0,
        data: watchlistRows,
        error: watchlistError ? {
          code: watchlistError.code,
          message: watchlistError.message
        } : null
      };

      if (watchlistRows && watchlistRows.length > 0) {
        const propertyIds = watchlistRows.map(w => w.property_id).filter(Boolean) as string[];
        
        const { data: listingsData, error: listingsError } = await supabase
          .from('listings')
          .select('id, title, status, owner_id, created_at')
          .in('id', propertyIds)
          .returns<{ id: string; title: string | null; status: string | null; owner_id: string; created_at: string; [key: string]: unknown }[]>();

        debug.listingsQuery = {
          requestedPropertyIds: propertyIds,
          foundCount: listingsData?.length || 0,
          foundIds: listingsData?.map(l => l.id) || [],
          missingIds: propertyIds.filter(id => !listingsData?.some(l => l.id === id)),
          data: listingsData,
          error: listingsError ? {
            code: listingsError.code,
            message: listingsError.message
          } : null
        };
      }
    }

    return NextResponse.json(debug);
  } catch (error) {
    console.error('Debug watchlist error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

