'use server';

import { getSupabaseServiceRole } from '@/lib/supabase/service';

export type UserRole = 'investor' | 'wholesaler';

export interface CoreStats {
  savedListings: number; // For investors: saved deals, For wholesalers: active deals
  contactsMade: number; // For investors: contacts made, For wholesalers: contacts received
  aiAnalyses: number; // For investors: analyses run, For wholesalers: analyses on their listings
  watchlists: number; // For investors: watchlists, For wholesalers: not used (0)
}

export interface TrendStat {
  label: string;
  current: number;
  previous: number;
}

export interface HotMarketStat {
  label: string;
  value: number;
}

export interface InvestorStats extends CoreStats {
  role: 'investor';
  dealsViewed: TrendStat;
  hotMarkets: HotMarketStat[];
  roiEstimate?: number | null;
  activityScore: number;
}

export interface WholesalerStats extends CoreStats {
  role: 'wholesaler';
  listingsPosted: TrendStat;
  leadsGenerated: TrendStat;
  avgResponseTimeHours?: number | null;
  conversionRate?: number | null;
  listingStatusBreakdown: {
    active: number;
    sold: number;
    total: number;
  };
  hotMarkets: HotMarketStat[]; // Markets where investors are searching
}

export type UserAnalytics = InvestorStats | WholesalerStats;

const DEFAULT_CORE_STATS: CoreStats = {
  savedListings: 0,
  contactsMade: 0,
  aiAnalyses: 0,
  watchlists: 0,
};

function toIsoDate(date: Date): string {
  return date.toISOString();
}

function computeActivityScore(stats: CoreStats, dealsViewedCurrent: number): number {
  const base =
    stats.savedListings * 5 +
    stats.contactsMade * 12 +
    stats.watchlists * 4 +
    stats.aiAnalyses * 8 +
    dealsViewedCurrent * 10;
  return Math.min(100, Math.round(base / 2));
}

async function countRows<T>(
  fetcher: () => Promise<{ count: number | null; error: T | null }>
): Promise<number> {
  try {
    const { count, error } = await fetcher();
    if (error) {
      console.error('Analytics count error:', error);
      return 0;
    }
    return count ?? 0;
  } catch (error) {
    console.error('Analytics count exception:', error);
    return 0;
  }
}

async function loadInvestorAnalytics(userId: string): Promise<InvestorStats> {
  const supabase = await getSupabaseServiceRole();
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  const savedListings = await countRows(async () => {
    const { count, error } = await supabase
      .from('watchlists')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    return { count, error };
  });

  const aiAnalyses = await countRows(async () => {
    const { count, error } = await supabase
      .from('ai_analysis_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    return { count, error };
  });

  const watchlistsCount = savedListings;

  const { data: contactsRows } = await supabase
    .from('messages')
    .select('listing_id')
    .eq('from_id', userId);

  const contactsMade = new Set(
    (contactsRows || [])
      .map((row) => (row as { listing_id?: string | null }).listing_id)
      .filter(Boolean)
  ).size;

  const { data: dealsCurrentRows } = await supabase
    .from('messages')
    .select('listing_id')
    .eq('from_id', userId)
    .gte('created_at', toIsoDate(thirtyDaysAgo));

  const { data: dealsPrevRows } = await supabase
    .from('messages')
    .select('listing_id')
    .eq('from_id', userId)
    .gte('created_at', toIsoDate(sixtyDaysAgo))
    .lt('created_at', toIsoDate(thirtyDaysAgo));

  const currentDealsSet = new Set(
    (dealsCurrentRows || [])
      .map((row) => (row as { listing_id?: string | null }).listing_id)
      .filter(Boolean)
  );
  const previousDealsSet = new Set(
    (dealsPrevRows || [])
      .map((row) => (row as { listing_id?: string | null }).listing_id)
      .filter(Boolean)
  );

  const { data: hotMarketRows } = await supabase
    .from('watchlists')
    .select(
      `
        created_at,
        listing:property_id (
          city,
          state,
          zip
        )
      `
    )
    .eq('user_id', userId)
    .gte('created_at', toIsoDate(sixtyDaysAgo));

  const marketCounts = new Map<string, number>();
  (hotMarketRows || []).forEach((row) => {
    const record = row as {
      listing?: { city?: string | null; state?: string | null; zip?: string | null } | null;
    };
    const city = record.listing?.city ?? '';
    const state = record.listing?.state ?? '';
    const zip = record.listing?.zip ?? '';
    const label =
      city && state ? `${city}, ${state}` : city ? city : state ? state : zip || 'Unknown Market';
    const current = marketCounts.get(label) ?? 0;
    marketCounts.set(label, current + 1);
  });

  const hotMarkets: HotMarketStat[] = Array.from(marketCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, value]) => ({ label, value }));

  const dealsViewed: TrendStat = {
    label: 'Deals Viewed',
    current: currentDealsSet.size,
    previous: previousDealsSet.size,
  };

  const coreStats: CoreStats = {
    ...DEFAULT_CORE_STATS,
    savedListings,
    contactsMade,
    aiAnalyses,
    watchlists: watchlistsCount,
  };

  const activityScore = computeActivityScore(coreStats, dealsViewed.current);

  return {
    role: 'investor',
    ...coreStats,
    dealsViewed,
    hotMarkets,
    roiEstimate: null,
    activityScore,
  };
}

async function loadWholesalerAnalytics(userId: string): Promise<WholesalerStats> {
  const supabase = await getSupabaseServiceRole();
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  // Active Deals: Count of active listings owned by this wholesaler
  const activeDeals = await countRows(async () => {
    const { count, error } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', userId)
      .neq('status', 'sold')
      .neq('status', 'closed');
    return { count, error };
  });

  // Contacts Received: Distinct investors who started conversations on this wholesaler's listings
  const { data: listingIds } = await supabase
    .from('listings')
    .select('id')
    .eq('owner_id', userId);

  const listingIdArray = (listingIds || []).map((l) => l.id).filter(Boolean);
  
  let contactsReceived = 0;
  if (listingIdArray.length > 0) {
    const { data: contactsRows } = await supabase
      .from('messages')
      .select('from_id, listing_id')
      .in('listing_id', listingIdArray);
    
    contactsReceived = new Set(
      (contactsRows || [])
        .map((row) => (row as { from_id?: string | null }).from_id)
        .filter(Boolean)
    ).size;
  }

  // AI Analyses: Number of AI analyzer runs by this wholesaler
  // Count both analyses on their listings AND analyses they ran themselves (user_id match)
  let aiAnalyses = 0;
  
  // Count analyses by user_id (wholesaler's own analyses)
  const { count: userAnalysesCount } = await supabase
    .from('ai_analysis_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  aiAnalyses = userAnalysesCount ?? 0;
  
  // Also count analyses on their listings (if any listings exist)
  // This ensures we capture all analyses related to this wholesaler
  if (listingIdArray.length > 0) {
    const { data: listingAnalysesRows } = await supabase
      .from('ai_analysis_logs')
      .select('id')
      .in('listing_id', listingIdArray);
    
    // Combine counts, but avoid double-counting (analyses with both user_id and listing_id)
    const listingAnalysesCount = (listingAnalysesRows || []).length;
    // Use the larger count to avoid double-counting analyses that match both criteria
    aiAnalyses = Math.max(aiAnalyses, listingAnalysesCount);
  }

  // Average Response Time: Time from first investor message to wholesaler's first reply
  // Get all messages on this wholesaler's listings
  let avgResponseTimeHours: number | null = null;
  
  if (listingIdArray.length > 0) {
    const { data: allMessages } = await supabase
      .from('messages')
      .select('id, from_id, to_id, listing_id, created_at')
      .in('listing_id', listingIdArray)
      .order('created_at', { ascending: true });

    if (allMessages && allMessages.length > 0) {
      // Group by conversation (listing_id + counterpart user)
      const conversations = new Map<string, Array<{ created_at: string; from_id: string; to_id: string }>>();
      
      allMessages.forEach((msg) => {
        // Determine the counterpart (investor) in this conversation
        const counterpartId = msg.from_id === userId ? msg.to_id : msg.from_id;
        const key = `${msg.listing_id || 'none'}_${counterpartId}`;
        
        if (!conversations.has(key)) {
          conversations.set(key, []);
        }
        conversations.get(key)!.push({
          created_at: msg.created_at,
          from_id: msg.from_id,
          to_id: msg.to_id,
        });
      });

      let totalResponseHours = 0;
      let responseSamples = 0;

      // For each conversation, find first investor message and first wholesaler reply
      conversations.forEach((messages) => {
        const sorted = messages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Find first message from investor (not from wholesaler)
        const firstInvestorMsg = sorted.find((m) => m.from_id !== userId);
        if (!firstInvestorMsg) return;

        // Find wholesaler's first reply after the first investor message
        const wholesalerReplies = sorted.filter(
          (m) => m.from_id === userId && new Date(m.created_at) > new Date(firstInvestorMsg.created_at)
        );
        
        if (wholesalerReplies.length > 0) {
          const firstReply = wholesalerReplies[0];
          const investorTime = new Date(firstInvestorMsg.created_at).getTime();
          const replyTime = new Date(firstReply.created_at).getTime();
          const diffHours = (replyTime - investorTime) / (1000 * 60 * 60);
          
          if (Number.isFinite(diffHours) && diffHours >= 0 && diffHours < 168) { // Max 1 week
            totalResponseHours += diffHours;
            responseSamples += 1;
          }
        }
      });

      avgResponseTimeHours =
        responseSamples > 0 ? Number((totalResponseHours / responseSamples).toFixed(1)) : null;
    }
  }

  // For CoreStats compatibility, we'll map:
  // savedListings -> activeDeals
  // contactsMade -> contactsReceived
  // aiAnalyses -> aiAnalyses (on their listings)
  // watchlists -> 0 (not relevant for wholesalers, but keep for type compatibility)

  const savedListings = activeDeals;
  const contactsMade = contactsReceived;
  const watchlistsCount = 0;

  const { data: listingsCurrentRows } = await supabase
    .from('listings')
    .select('id')
    .eq('owner_id', userId)
    .gte('created_at', toIsoDate(thirtyDaysAgo));

  const { data: listingsPrevRows } = await supabase
    .from('listings')
    .select('id')
    .eq('owner_id', userId)
    .gte('created_at', toIsoDate(sixtyDaysAgo))
    .lt('created_at', toIsoDate(thirtyDaysAgo));

  const listingsPosted: TrendStat = {
    label: 'Listings Posted',
    current: (listingsCurrentRows || []).length,
    previous: (listingsPrevRows || []).length,
  };

  const { data: leadsCurrentRows } = await supabase
    .from('messages')
    .select('from_id')
    .eq('to_id', userId)
    .gte('created_at', toIsoDate(thirtyDaysAgo));

  const { data: leadsPrevRows } = await supabase
    .from('messages')
    .select('from_id')
    .eq('to_id', userId)
    .gte('created_at', toIsoDate(sixtyDaysAgo))
    .lt('created_at', toIsoDate(thirtyDaysAgo));

  const currentLeads = new Set(
    (leadsCurrentRows || [])
      .map((row) => (row as { from_id?: string | null }).from_id)
      .filter(Boolean)
  ).size;
  const previousLeads = new Set(
    (leadsPrevRows || [])
      .map((row) => (row as { from_id?: string | null }).from_id)
      .filter(Boolean)
  ).size;

  const leadsGenerated: TrendStat = {
    label: 'Leads Generated',
    current: currentLeads,
    previous: previousLeads,
  };


  const conversionRate =
    listingsPosted.current > 0 ? Math.min(1, currentLeads / listingsPosted.current) : null;

  const { data: listingStatusRows } = await supabase
    .from('listings')
    .select('status')
    .eq('owner_id', userId);

  let activeCount = 0;
  let soldCount = 0;
  (listingStatusRows || []).forEach((row) => {
    const status = (row as { status?: string | null }).status?.toLowerCase() ?? '';
    if (status === 'sold' || status === 'closed') {
      soldCount += 1;
    } else {
      activeCount += 1;
    }
  });
  const totalListings = activeCount + soldCount;

  // Hot Markets: Aggregate investor saved searches by location
  // This shows wholesalers where investors are actively searching
  const { data: investorSearches } = await supabase
    .from('saved_searches')
    .select('criteria, profiles!inner(segment, role)')
    .eq('profiles.segment', 'investor')
    .eq('active', true)
    .gte('created_at', toIsoDate(sixtyDaysAgo));

  const marketCounts = new Map<string, number>();
  (investorSearches || []).forEach((search) => {
    const criteria = search.criteria as Record<string, unknown> | null;
    if (!criteria) return;
    
    // Extract location from criteria (could be city, state, bounds, or searchQuery)
    const city = typeof criteria.city === 'string' ? criteria.city : null;
    const state = typeof criteria.state === 'string' ? criteria.state : null;
    const searchQuery = typeof criteria.searchQuery === 'string' ? criteria.searchQuery : null;
    
    // Try to extract location from search query (e.g., "Miami, FL")
    let location = '';
    if (city && state) {
      location = `${city}, ${state}`;
    } else if (city) {
      location = city;
    } else if (state) {
      location = state;
    } else if (searchQuery) {
      // Try to parse "City, State" from search query
      const match = searchQuery.match(/([^,]+),\s*([A-Z]{2})/);
      if (match) {
        location = `${match[1].trim()}, ${match[2]}`;
      } else {
        location = searchQuery.split(',')[0]?.trim() || 'Unknown';
      }
    } else {
      return; // Skip if no location info
    }
    
    const current = marketCounts.get(location) ?? 0;
    marketCounts.set(location, current + 1);
  });

  const hotMarkets: HotMarketStat[] = Array.from(marketCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 markets

  const coreStats: CoreStats = {
    ...DEFAULT_CORE_STATS,
    savedListings,
    contactsMade,
    aiAnalyses,
    watchlists: watchlistsCount,
  };

  return {
    role: 'wholesaler',
    ...coreStats,
    listingsPosted,
    leadsGenerated,
    avgResponseTimeHours,
    conversionRate,
    listingStatusBreakdown: {
      active: activeCount,
      sold: soldCount,
      total: totalListings,
    },
    hotMarkets,
  };
}

export async function getUserAnalytics(userId: string, role: UserRole): Promise<UserAnalytics> {
  if (role === 'investor') {
    return loadInvestorAnalytics(userId);
  }
  return loadWholesalerAnalytics(userId);
}


