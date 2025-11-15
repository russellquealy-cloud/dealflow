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
export function isInvestorPro(profile: UserProfile | null): boolean {
  if (!profile) return false;
  
  const role = (profile.role || profile.segment || '').toLowerCase();
  const tier = (profile.tier || profile.membership_tier || '').toLowerCase();
  
  return role === 'investor' && (tier === 'pro' || tier === 'enterprise');
}

/**
 * Get upgrade redirect URL for non-Pro users
 */
export function getUpgradeUrl(segment?: string | null): string {
  const userSegment = (segment || 'investor').toLowerCase();
  return `/pricing?segment=${userSegment}&tier=pro&highlight=pro`;
}

