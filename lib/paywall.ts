// lib/paywall.ts
// Paywall modal and upgrade prompts

import { UserProfile, UsageCounts, getUpgradeRecommendation } from './tierPolicy';

export interface PaywallReason {
  code: string;
  title: string;
  message: string;
  suggestedTier: string;
  suggestedSegment?: string;
}

export const PAYWALL_REASONS: Record<string, PaywallReason> = {
  LISTING_VIEW_LIMIT: {
    code: 'LISTING_VIEW_LIMIT',
    title: 'Monthly View Limit Reached',
    message: 'You\'ve reached your monthly listing view limit. Upgrade to continue browsing properties.',
    suggestedTier: 'basic',
    suggestedSegment: 'investor',
  },
  CONTACT_REQUIRED: {
    code: 'CONTACT_REQUIRED',
    title: 'Contact Information Locked',
    message: 'Contact information is available with paid plans. Upgrade to connect with property owners.',
    suggestedTier: 'basic',
    suggestedSegment: 'investor',
  },
  AI_LIMIT: {
    code: 'AI_LIMIT',
    title: 'AI Analysis Limit Reached',
    message: 'You\'ve reached your monthly AI analysis limit. Upgrade to Pro for unlimited AI tools.',
    suggestedTier: 'pro',
    suggestedSegment: 'investor',
  },
  LISTING_POST_LIMIT: {
    code: 'LISTING_POST_LIMIT',
    title: 'Listing Limit Reached',
    message: 'You\'ve reached your monthly listing limit. Upgrade to post more properties.',
    suggestedTier: 'basic',
    suggestedSegment: 'wholesaler',
  },
  EXPORT_REQUIRED: {
    code: 'EXPORT_REQUIRED',
    title: 'Export Feature Locked',
    message: 'Export features are available with Pro plans. Upgrade to download reports and data.',
    suggestedTier: 'pro',
  },
  ENTERPRISE_FEATURE: {
    code: 'ENTERPRISE_FEATURE',
    title: 'Enterprise Feature',
    message: 'This feature is available for Enterprise customers. Contact sales for pricing.',
    suggestedTier: 'enterprise',
  },
  DRAW_TOOL_LOCKED: {
    code: 'DRAW_TOOL_LOCKED',
    title: 'Draw Tool Locked',
    message: 'Map drawing tools are available with paid plans. Upgrade to draw custom search areas.',
    suggestedTier: 'basic',
    suggestedSegment: 'investor',
  },
  SATELLITE_LOCKED: {
    code: 'SATELLITE_LOCKED',
    title: 'Satellite View Locked',
    message: 'Satellite view is available with paid plans. Upgrade to access satellite imagery.',
    suggestedTier: 'basic',
    suggestedSegment: 'investor',
  },
  FAVORITES_LOCKED: {
    code: 'FAVORITES_LOCKED',
    title: 'Favorites Locked',
    message: 'Save favorites and create watchlists with paid plans. Upgrade to organize your searches.',
    suggestedTier: 'basic',
    suggestedSegment: 'investor',
  },
  ALERTS_LOCKED: {
    code: 'ALERTS_LOCKED',
    title: 'Alerts Locked',
    message: 'Property alerts are available with paid plans. Upgrade to get notified of new listings.',
    suggestedTier: 'basic',
    suggestedSegment: 'investor',
  },
  ANALYTICS_LOCKED: {
    code: 'ANALYTICS_LOCKED',
    title: 'Analytics Locked',
    message: 'Property analytics are available with paid plans. Upgrade to see detailed insights.',
    suggestedTier: 'basic',
    suggestedSegment: 'wholesaler',
  },
  FEATURED_LOCKED: {
    code: 'FEATURED_LOCKED',
    title: 'Featured Listing Locked',
    message: 'Featured listings are available with Pro plans. Upgrade to highlight your properties.',
    suggestedTier: 'pro',
    suggestedSegment: 'wholesaler',
  },
  CHAT_LOCKED: {
    code: 'CHAT_LOCKED',
    title: 'Investor Chat Locked',
    message: 'Direct messaging with investors is available with Pro plans. Upgrade to connect directly.',
    suggestedTier: 'pro',
    suggestedSegment: 'wholesaler',
  },
  VERIFIED_BADGE_LOCKED: {
    code: 'VERIFIED_BADGE_LOCKED',
    title: 'Verified Badge Locked',
    message: 'Verified badges are available with Pro plans. Upgrade to build trust with investors.',
    suggestedTier: 'pro',
    suggestedSegment: 'wholesaler',
  },
};

// Check if user should see paywall
export function shouldShowPaywall(
  profile: UserProfile | null,
  usage: UsageCounts,
  action: string
): PaywallReason | null {
  if (!profile) {
    // Not logged in - show basic upgrade prompt
    return PAYWALL_REASONS.CONTACT_REQUIRED;
  }

  // Check specific action limits
  switch (action) {
    case 'view_listing':
      if (!canViewListing(profile, usage)) {
        return PAYWALL_REASONS.LISTING_VIEW_LIMIT;
      }
      break;
    case 'contact':
      if (!canSeeContact(profile, usage)) {
        return PAYWALL_REASONS.CONTACT_REQUIRED;
      }
      break;
    case 'ai_analysis':
      if (!canRunAI(profile, usage)) {
        return PAYWALL_REASONS.AI_LIMIT;
      }
      break;
    case 'post_listing':
      if (!canPostListing(profile, usage)) {
        return PAYWALL_REASONS.LISTING_POST_LIMIT;
      }
      break;
    case 'export':
      if (!canExport(profile)) {
        return PAYWALL_REASONS.EXPORT_REQUIRED;
      }
      break;
    case 'draw_tool':
      if (!canUseDraw(profile)) {
        return PAYWALL_REASONS.DRAW_TOOL_LOCKED;
      }
      break;
    case 'satellite':
      if (!canUseSatellite(profile)) {
        return PAYWALL_REASONS.SATELLITE_LOCKED;
      }
      break;
    case 'favorites':
      if (!canSaveFavorites(profile)) {
        return PAYWALL_REASONS.FAVORITES_LOCKED;
      }
      break;
    case 'alerts':
      if (!canUseAlerts(profile)) {
        return PAYWALL_REASONS.ALERTS_LOCKED;
      }
      break;
    case 'analytics':
      if (!canAnalytics(profile)) {
        return PAYWALL_REASONS.ANALYTICS_LOCKED;
      }
      break;
    case 'featured':
      if (!canFeatured(profile)) {
        return PAYWALL_REASONS.FEATURED_LOCKED;
      }
      break;
    case 'chat':
      if (!canChat(profile)) {
        return PAYWALL_REASONS.CHAT_LOCKED;
      }
      break;
    case 'verified_badge':
      if (!canVerifiedBadge(profile)) {
        return PAYWALL_REASONS.VERIFIED_BADGE_LOCKED;
      }
      break;
  }

  // Check for general upgrade recommendation
  const recommendation = getUpgradeRecommendation(profile, usage);
  if (recommendation) {
    return {
      code: 'UPGRADE_RECOMMENDED',
      title: 'Upgrade Recommended',
      message: recommendation.reason,
      suggestedTier: recommendation.suggestedTier,
      suggestedSegment: recommendation.suggestedSegment,
    };
  }

  return null;
}

// Helper functions (re-exported from tierPolicy for convenience)
function canViewListing(profile: UserProfile, usage: UsageCounts): boolean {
  const limits = profile.segment === 'investor' 
    ? { listing_views: profile.tier === 'free' ? 20 : -1 }
    : { listing_views: -1 };
  
  return limits.listing_views === -1 || usage.listing_views < limits.listing_views;
}

function canSeeContact(profile: UserProfile, usage: UsageCounts): boolean {
  if (profile.segment !== 'investor') return true;
  
  const limits = profile.tier === 'free' 
    ? { contacts: 0 }
    : { contacts: -1 };
  
  return limits.contacts === -1 || usage.contacts < limits.contacts;
}

function canRunAI(profile: UserProfile, usage: UsageCounts): boolean {
  if (profile.segment !== 'investor') return false;
  
  const limits = profile.tier === 'free' 
    ? { ai_runs: 0 }
    : profile.tier === 'basic'
    ? { ai_runs: 10 }
    : { ai_runs: -1 };
  
  return limits.ai_runs === -1 || usage.ai_runs < limits.ai_runs;
}

function canPostListing(profile: UserProfile, usage: UsageCounts): boolean {
  if (profile.segment !== 'wholesaler') return false;
  
  const limits = profile.tier === 'free' 
    ? { listings_posted: 2 }
    : profile.tier === 'basic'
    ? { listings_posted: 10 }
    : { listings_posted: -1 };
  
  return limits.listings_posted === -1 || usage.listings_posted < limits.listings_posted;
}

function canExport(profile: UserProfile): boolean {
  return profile.tier === 'pro' || profile.tier === 'enterprise';
}

function canUseDraw(profile: UserProfile): boolean {
  return profile.tier !== 'free';
}

function canUseSatellite(profile: UserProfile): boolean {
  return profile.tier !== 'free';
}

function canSaveFavorites(profile: UserProfile): boolean {
  return profile.tier !== 'free';
}

function canUseAlerts(profile: UserProfile): boolean {
  return profile.tier !== 'free';
}

function canAnalytics(profile: UserProfile): boolean {
  if (profile.segment !== 'wholesaler') return false;
  return profile.tier !== 'free';
}

function canFeatured(profile: UserProfile): boolean {
  if (profile.segment !== 'wholesaler') return false;
  return profile.tier === 'pro' || profile.tier === 'enterprise';
}

function canChat(profile: UserProfile): boolean {
  if (profile.segment !== 'wholesaler') return false;
  return profile.tier === 'pro' || profile.tier === 'enterprise';
}

function canVerifiedBadge(profile: UserProfile): boolean {
  if (profile.segment !== 'wholesaler') return false;
  return profile.tier === 'pro' || profile.tier === 'enterprise';
}

// Get paywall message from reason
export function getPaywallMessage({ reason }: { reason: PaywallReason }): string {
  return reason.message;
}