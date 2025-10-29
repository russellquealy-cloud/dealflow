// lib/tierPolicy.ts
// Precise plan guards and usage tracking

import { supabase } from '@/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  segment: 'investor' | 'wholesaler';
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  verified: boolean;
  stripe_customer_id?: string;
  active_price_id?: string;
  current_period_end?: string;
}

export interface UsageCounts {
  listing_views: number;
  contacts: number;
  ai_runs: number;
  listings_posted: number;
  exports: number;
}

// Plan limits configuration
export const PLAN_LIMITS = {
  investor: {
    free: {
      listing_views: 20,
      contacts: 0,
      ai_runs: 0,
      can_save_favorites: false,
      can_use_draw: false,
      can_use_satellite: false,
      can_export: false,
      can_use_alerts: false,
    },
    basic: {
      listing_views: -1, // unlimited
      contacts: -1, // unlimited
      ai_runs: 10,
      can_save_favorites: true,
      can_use_draw: true,
      can_use_satellite: true,
      can_export: false,
      can_use_alerts: true,
    },
    pro: {
      listing_views: -1, // unlimited
      contacts: -1, // unlimited
      ai_runs: -1, // unlimited
      can_save_favorites: true,
      can_use_draw: true,
      can_use_satellite: true,
      can_export: true,
      can_use_alerts: true,
    },
    enterprise: {
      listing_views: -1, // unlimited
      contacts: -1, // unlimited
      ai_runs: -1, // unlimited
      can_save_favorites: true,
      can_use_draw: true,
      can_use_satellite: true,
      can_export: true,
      can_use_alerts: true,
    },
  },
  wholesaler: {
    free: {
      listings_posted: 2,
      can_analytics: false,
      can_featured: false,
      can_chat: false,
      can_verified_badge: false,
    },
    basic: {
      listings_posted: 10,
      can_analytics: true,
      can_featured: false,
      can_chat: false,
      can_verified_badge: false,
    },
    pro: {
      listings_posted: 30,
      can_analytics: true,
      can_featured: true,
      can_chat: true,
      can_verified_badge: true,
    },
    enterprise: {
      listings_posted: -1, // unlimited
      can_analytics: true,
      can_featured: true,
      can_chat: true,
      can_verified_badge: true,
    },
  },
} as const;

// Get user profile with usage counts
export async function getUserProfileWithUsage(userId: string): Promise<{
  profile: UserProfile | null;
  usage: UsageCounts;
}> {
  try {
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      return { profile: null, usage: getDefaultUsage() };
    }

    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    const { data: usageData } = await supabase
      .from('usage_counters')
      .select('metric, count')
      .eq('user_id', userId)
      .eq('period_start', currentMonth);

    const usage: UsageCounts = {
      listing_views: 0,
      contacts: 0,
      ai_runs: 0,
      listings_posted: 0,
      exports: 0,
    };

    usageData?.forEach((row) => {
      if (row.metric in usage) {
        usage[row.metric as keyof UsageCounts] = row.count;
      }
    });

    return { profile, usage };
  } catch (error) {
    console.error('Error getting user profile with usage:', error);
    return { profile: null, usage: getDefaultUsage() };
  }
}

function getDefaultUsage(): UsageCounts {
  return {
    listing_views: 0,
    contacts: 0,
    ai_runs: 0,
    listings_posted: 0,
    exports: 0,
  };
}

// Increment usage counter
export async function incrementUsage(
  userId: string,
  metric: keyof UsageCounts,
  delta: number = 1
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_metric: metric,
      p_delta: delta,
    });

    if (error) {
      console.error('Error incrementing usage:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return 0;
  }
}

// Check if user can perform an action
export function canViewListing(profile: UserProfile, usage: UsageCounts): boolean {
  if (!profile) return false;
  
  const limits = PLAN_LIMITS[profile.segment][profile.tier];
  if ('listing_views' in limits && limits.listing_views === -1) return true; // unlimited
  
  return 'listing_views' in limits ? usage.listing_views < limits.listing_views : true;
}

export function canSeeContact(profile: UserProfile, usage: UsageCounts): boolean {
  if (!profile) return false;
  
  const limits = PLAN_LIMITS[profile.segment][profile.tier];
  if ('contacts' in limits && limits.contacts === -1) return true; // unlimited
  
  return 'contacts' in limits ? usage.contacts < limits.contacts : true;
}

export function canRunAI(profile: UserProfile, usage: UsageCounts): boolean {
  if (!profile) return false;
  
  const limits = PLAN_LIMITS[profile.segment][profile.tier];
  if ('ai_runs' in limits && limits.ai_runs === -1) return true; // unlimited
  
  return 'ai_runs' in limits ? usage.ai_runs < limits.ai_runs : true;
}

export function canExport(profile: UserProfile): boolean {
  if (!profile) return false;
  
  const limits = PLAN_LIMITS[profile.segment][profile.tier];
  return 'can_export' in limits ? limits.can_export : false;
}

export function canPostListing(profile: UserProfile, usage: UsageCounts): boolean {
  if (!profile) return false;
  
  const limits = PLAN_LIMITS[profile.segment][profile.tier];
  if ('listings_posted' in limits && limits.listings_posted === -1) return true; // unlimited
  
  return 'listings_posted' in limits ? usage.listings_posted < limits.listings_posted : true;
}

export function canUseDraw(profile: UserProfile): boolean {
  if (!profile) return false;
  
  const limits = PLAN_LIMITS[profile.segment][profile.tier];
  return 'can_use_draw' in limits ? limits.can_use_draw : false;
}

export function canUseSatellite(profile: UserProfile): boolean {
  if (!profile) return false;
  
  const limits = PLAN_LIMITS[profile.segment][profile.tier];
  return 'can_use_satellite' in limits ? limits.can_use_satellite : false;
}

export function canSaveFavorites(profile: UserProfile): boolean {
  if (!profile) return false;
  
  const limits = PLAN_LIMITS[profile.segment][profile.tier];
  return 'can_save_favorites' in limits ? limits.can_save_favorites : false;
}

export function canUseAlerts(profile: UserProfile): boolean {
  if (!profile) return false;
  
  const limits = PLAN_LIMITS[profile.segment][profile.tier];
  return 'can_use_alerts' in limits ? limits.can_use_alerts : false;
}

export function canAnalytics(profile: UserProfile): boolean {
  if (!profile) return false;
  
  const limits = PLAN_LIMITS[profile.segment][profile.tier];
  return 'can_analytics' in limits ? limits.can_analytics : false;
}

export function canFeatured(profile: UserProfile): boolean {
  if (!profile) return false;
  
  const limits = PLAN_LIMITS[profile.segment][profile.tier];
  return 'can_featured' in limits ? limits.can_featured : false;
}

export function canChat(profile: UserProfile): boolean {
  if (!profile) return false;
  
  const limits = PLAN_LIMITS[profile.segment][profile.tier];
  return 'can_chat' in limits ? limits.can_chat : false;
}

export function canVerifiedBadge(profile: UserProfile): boolean {
  if (!profile) return false;
  
  const limits = PLAN_LIMITS[profile.segment][profile.tier];
  return 'can_verified_badge' in limits ? limits.can_verified_badge : false;
}

// Check if organization has available seats
export async function seatAvailable(orgId: string): Promise<boolean> {
  try {
    const { data: org } = await supabase
      .from('orgs')
      .select('seats')
      .eq('id', orgId)
      .single();

    if (!org) return false;

    const { count } = await supabase
      .from('org_members')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    return (count || 0) < org.seats;
  } catch (error) {
    console.error('Error checking seat availability:', error);
    return false;
  }
}

// Get upgrade recommendation
export function getUpgradeRecommendation(profile: UserProfile, usage: UsageCounts): {
  reason: string;
  suggestedTier: string;
  suggestedSegment?: string;
} | null {
  if (!profile) return null;

  // Check if user is hitting limits
  if (profile.segment === 'investor') {
    if (!canViewListing(profile, usage)) {
      return {
        reason: 'You\'ve reached your monthly listing view limit',
        suggestedTier: 'basic',
        suggestedSegment: 'investor',
      };
    }
    
    if (!canSeeContact(profile, usage)) {
      return {
        reason: 'Contact information requires a paid plan',
        suggestedTier: 'basic',
        suggestedSegment: 'investor',
      };
    }
    
    if (!canRunAI(profile, usage)) {
      return {
        reason: 'You\'ve reached your monthly AI analysis limit',
        suggestedTier: 'pro',
        suggestedSegment: 'investor',
      };
    }
  } else if (profile.segment === 'wholesaler') {
    if (!canPostListing(profile, usage)) {
      return {
        reason: 'You\'ve reached your monthly listing limit',
        suggestedTier: 'basic',
        suggestedSegment: 'wholesaler',
      };
    }
  }

  return null;
}
