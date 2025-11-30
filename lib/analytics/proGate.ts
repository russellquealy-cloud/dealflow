// lib/analytics/proGate.ts

// Simple helper: determines if a subscription tier is Pro or Enterprise.
export function isPro(tier: string | null | undefined): boolean {
  if (!tier) return false;

  const normalized = tier.toLowerCase();
  return normalized === "pro" || normalized === "enterprise";
}

// Get upgrade URL based on user segment and tier
export function getUpgradeUrl(segment?: string | null, tier?: string | null): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  return `${baseUrl}/pricing`;
}

