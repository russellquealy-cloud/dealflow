import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { UserAnalytics } from "@/lib/analytics";
import type { Database } from "@/types/supabase";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics
 *
 * Returns per-user analytics for any authenticated user (investor, wholesaler, admin).
 * Returns user-specific metrics like listings posted, views received, saved properties, etc.
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get user from cookies first (standard approach)
    let supabase = await createServerClient();
    let { data: { user }, error: userError } = await supabase.auth.getUser();

    // If cookie-based auth fails, try Authorization header as fallback
    if (userError || !user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        try {
          // Create a regular Supabase client with the token (not SSR client)
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          if (supabaseUrl && supabaseAnonKey) {
            const tokenClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
              global: {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            });
            const { data: { user: headerUser }, error: headerError } = await tokenClient.auth.getUser(token);
            if (headerUser && !headerError) {
              user = headerUser;
              userError = null;
              // Use the token client for subsequent queries so RLS works correctly
              supabase = tokenClient;
            }
          }
        } catch (tokenError) {
          console.error('[analytics] Failed to validate token from Authorization header:', tokenError);
        }
      }
    }

    // Log auth status for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('[analytics] Auth check:', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        error: userError?.message,
        authMethod: user ? (request.headers.get('authorization') ? 'header' : 'cookie') : 'none',
      });
    }

    if (userError || !user) {
      // Log in both dev and prod for debugging (avoid logging sensitive data)
      console.error('[analytics] Unauthorized - auth check failed:', {
        hasError: !!userError,
        errorMessage: userError?.message || 'No user found',
        hasUser: !!user,
        hasAuthHeader: !!request.headers.get('authorization'),
      });
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view analytics." },
        { status: 401 }
      );
    }

    // Get user profile to determine if they're pro tier
    const { data: profileData } = await supabase
      .from('profiles')
      .select('tier, membership_tier, is_pro_subscriber, segment, role')
      .eq('id', user.id)
      .maybeSingle();

    type ProfileData = {
      tier?: string | null;
      membership_tier?: string | null;
      is_pro_subscriber?: boolean | null;
      segment?: string | null;
      role?: string | null;
    };

    const profile = profileData as ProfileData | null;
    const tierValue = (profile?.tier || profile?.membership_tier || '').toLowerCase();
    const isPro = tierValue.includes('pro') || tierValue.includes('enterprise') || profile?.is_pro_subscriber === true;

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
