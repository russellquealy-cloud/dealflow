/**
 * Helper functions for Pro feature gating
 */

export type UserRole = 'investor' | 'wholesaler';
export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export interface UserProfile {
  role?: string | null;
  segment?: string | null;
  tier?: string | null;
  membership_tier?: string | null;
}

/**
 * Check if user is Investor Pro
 */
export function isInvestorPro(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  
  const role = (profile.role || profile.segment || '').toLowerCase();
  const tier = (profile.tier || profile.membership_tier || '').toLowerCase();
  
  // Check if tier contains 'pro' or 'enterprise' (handles formats like "investor.pro", "pro", etc.)
  const isProTier = tier.includes('pro') || tier.includes('enterprise');
  
  return role === 'investor' && isProTier;
}

/**
 * Check if user is Wholesaler Pro
 */
export function isWholesalerPro(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  
  const role = (profile.role || profile.segment || '').toLowerCase();
  const tier = (profile.tier || profile.membership_tier || '').toLowerCase();
  
  // Check if tier contains 'pro' or 'enterprise' (handles formats like "wholesaler.pro", "pro", etc.)
  const isProTier = tier.includes('pro') || tier.includes('enterprise');
  
  return role === 'wholesaler' && isProTier;
}

/**
 * Check if user is Pro (either Investor or Wholesaler)
 * Note: Admins are considered to have Pro access but this function doesn't check for admin
 * (admin check should be done separately using isAdmin helper)
 */
export function isPro(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  
  // Check if user is admin (admins have Pro access)
  const role = (profile.role || profile.segment || '').toLowerCase();
  if (role === 'admin') {
    return true;
  }
  
  return isInvestorPro(profile) || isWholesalerPro(profile);
}

/**
 * Get upgrade redirect URL for non-Pro users
 */
export function getUpgradeUrl(segment?: string | null): string {
  const userSegment = (segment || 'investor').toLowerCase();
  return `/pricing?segment=${userSegment}&tier=pro&highlight=pro`;
}

