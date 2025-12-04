import { NextRequest, NextResponse } from "next/server";
import { getSupabaseRouteClient } from "../../lib/supabaseRoute";
import { getProOrAdminContext } from "@/lib/adminAuth";
import type { UserAnalytics } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics
 *
 * Returns per-user analytics for Pro tier users or admins.
 * Returns user-specific metrics like listings posted, views received, saved properties, etc.
 */
export async function GET(request: NextRequest) {
  try {
    // Use shared auth helper - allows Pro tier or admin
    const ctx = await getProOrAdminContext(request);

    console.log('[api/analytics]', {
      status: ctx.status,
      email: ctx.session?.user.email,
      tier: ctx.profile?.tier,
      isAdmin: ctx.isAdmin,
      isProOrAdmin: ctx.isProOrAdmin,
      error: ctx.error,
    });

    if (ctx.status !== 200 || !ctx.isProOrAdmin) {
      return NextResponse.json(
        { 
          error: ctx.error || "Pro tier or admin access required to view analytics.",
          reason: ctx.status === 401 ? "unauthorized" : "forbidden",
        },
        { status: ctx.status }
      );
    }

    // Get user and supabase client for queries
    const user = ctx.session.user;
    const supabase = await getSupabaseRouteClient();

    // Use profile from context (already fetched)
    const profile = ctx.profile;
    const tierValue = (profile?.tier || profile?.membership_tier || '').toLowerCase();
    const isPro = tierValue.includes('pro') || tierValue.includes('enterprise') || ctx.isAdmin;

    // Query user-specific analytics in parallel
    const [listingsResult, viewsResult, watchlistsResult, messagesResult, savedSearchesResult, alertsResult] = await Promise.all([
      // Total listings posted by this user
      supabase
        .from('listings')
        .select('id, views, status', { count: 'exact', head: false })
        .eq('owner_id', user.id),
      
      // Total views across all user's listings (including null/zero views)
      supabase
        .from('listings')
        .select('views')
        .eq('owner_id', user.id),
      
      // Watchlists (saved properties) for this user
      supabase
        .from('watchlists')
        .select('id', { count: 'exact', head: false })
        .eq('user_id', user.id),
      
      // Messages sent/received by this user
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: false })
        .or(`from_id.eq.${user.id},to_id.eq.${user.id}`),
      
      // Saved searches for this user
      supabase
        .from('saved_searches')
        .select('id', { count: 'exact', head: false })
        .eq('user_id', user.id),
      
      // Alerts for this user
      supabase
        .from('alerts')
        .select('id', { count: 'exact', head: false })
        .eq('user_id', user.id)
        .eq('active', true),
    ]);

    // Calculate total views received (sum of views from all user's listings)
    const totalViewsReceived = viewsResult.data?.reduce((sum, listing) => {
      const views = (listing as { views?: number | null }).views ?? 0;
      return sum + views;
    }, 0) ?? 0;

    // Count listings by status
    const listingsByStatus: Record<string, number> = {};
    listingsResult.data?.forEach((listing) => {
      const status = (listing as { status?: string | null }).status || 'unknown';
      listingsByStatus[status] = (listingsByStatus[status] || 0) + 1;
    });

    const activeListings = listingsByStatus['live'] || 0;
    const totalListings = listingsResult.count ?? 0;

    // Get top viewed listings (for wholesalers, their own listings)
    const topViewedListings = listingsResult.data
      ?.map((listing) => ({
        id: (listing as { id: string }).id,
        views: (listing as { views?: number | null }).views ?? 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10) || [];

    // Build analytics response - only include fields defined in UserAnalytics type
    const stats: UserAnalytics = {
      userId: user.id,
      totalLogins: undefined, // Not tracked yet
      lastLoginAt: undefined, // Not tracked yet
      propertiesViewed: undefined, // Could track via listing_views table if it exists
      savedProperties: watchlistsResult.count ?? 0,
      messagesSent: messagesResult.count ?? 0,
      aiAnalysesRun: undefined, // Could query from ai_analysis_logs if it exists
    };

    // Add additional fields as Record<string, unknown> for flexibility
    // These will be accessible but not strictly typed in UserAnalytics
    const extendedStats = {
      ...stats,
      listingsPosted: totalListings,
      viewsReceived: totalViewsReceived,
      activeListings: activeListings,
      savedSearches: savedSearchesResult.count ?? 0,
      activeAlerts: alertsResult.count ?? 0,
      topViewedListings: topViewedListings, // Top 10 listings by view count
      averageViewsPerListing: totalListings > 0 ? Math.round(totalViewsReceived / totalListings) : 0,
    };

    return NextResponse.json(
      { 
        stats: extendedStats,
        isPro 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in /api/analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
