// lib/analytics.ts

// Provide the exact type expected by account page and UserAnalyticsDashboard.
// Expand these fields later if needed; this unblocks the build.

export type UserAnalytics = {
  userId?: string;
  totalLogins?: number;
  lastLoginAt?: string | null;
  propertiesViewed?: number;
  savedProperties?: number;
  messagesSent?: number;
  aiAnalysesRun?: number;
};

export type CoreStats = {
  totalLogins?: number;
  lastLoginAt?: string | null;
  propertiesViewed?: number;
  savedProperties?: number;
  savedListings?: number;
  messagesSent?: number;
  aiAnalysesRun?: number;
  aiAnalyses?: number;
  watchlists?: number;
  [key: string]: unknown;
};

export type InvestorStats = {
  propertiesViewed?: number;
  savedProperties?: number;
  aiAnalysesRun?: number;
  activityScore?: number;
  dealsViewed?: TrendStat;
  hotMarkets?: { label: string; value: number }[];
  roiEstimate?: number | null;
  [key: string]: unknown;
};

export type WholesalerStats = {
  listingsPosted?: number | TrendStat;
  messagesReceived?: number;
  viewsReceived?: number;
  savedListings?: number;
  contactsMade?: number;
  aiAnalyses?: number;
  listingStatusBreakdown?: { total: number; active: number; pending: number; sold: number };
  leadsGenerated?: TrendStat;
  avgResponseTimeHours?: number | null;
  conversionRate?: number | null;
  [key: string]: unknown;
};

export type TrendStat = {
  label: string;
  value: number;
  current: number;
  previous: number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
};
