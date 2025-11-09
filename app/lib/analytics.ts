'use server';

import { getSupabaseServiceRole } from '@/lib/supabase/service';

export type UserRole = 'investor' | 'wholesaler';

export interface CoreStats {
  savedListings: number;
  contactsMade: number;
  aiAnalyses: number;
  watchlists: number;
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

  const savedListings = await countRows(
    () =>
      supabase
        .from('watchlists')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
  );

  const aiAnalyses = await countRows(
    () =>
      supabase
        .from('ai_analysis_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
  );

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

  const savedListings = await countRows(
    () =>
      supabase
        .from('watchlists')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
  );

  const aiAnalyses = await countRows(
    () =>
      supabase
        .from('ai_analysis_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
  );

  const { data: contactsRows } = await supabase
    .from('messages')
    .select('from_id')
    .eq('to_id', userId);

  const contactsMade = new Set(
    (contactsRows || [])
      .map((row) => (row as { from_id?: string | null }).from_id)
      .filter(Boolean)
  ).size;

  const watchlistsCount = savedListings;

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

  const { data: responseRows } = await supabase
    .from('messages')
    .select('created_at, read_at')
    .eq('to_id', userId)
    .not('read_at', 'is', null);

  let totalResponseHours = 0;
  let responseSamples = 0;
  (responseRows || []).forEach((row) => {
    const record = row as { created_at: string; read_at?: string | null };
    if (!record.read_at) return;
    const created = new Date(record.created_at).getTime();
    const read = new Date(record.read_at).getTime();
    if (Number.isNaN(created) || Number.isNaN(read) || read < created) return;
    const diffHours = (read - created) / (1000 * 60 * 60);
    if (Number.isFinite(diffHours)) {
      totalResponseHours += diffHours;
      responseSamples += 1;
    }
  });

  const avgResponseTimeHours =
    responseSamples > 0 ? Number((totalResponseHours / responseSamples).toFixed(1)) : null;

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
  };
}

export async function getUserAnalytics(userId: string, role: UserRole): Promise<UserAnalytics> {
  if (role === 'investor') {
    return loadInvestorAnalytics(userId);
  }
  return loadWholesalerAnalytics(userId);
}


