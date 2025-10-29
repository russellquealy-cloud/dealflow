// app/lib/paywall.ts
export type PaywallReason = 
  | 'contact_limit_reached'
  | 'ai_analysis_limit_reached'
  | 'listing_limit_reached'
  | 'feature_not_available'
  | 'subscription_required';

export interface PaywallConfig {
  reason: PaywallReason;
  currentCount?: number;
  limit?: number;
  feature?: string;
  upgradeUrl?: string;
}

export function getPaywallMessage(config: PaywallConfig): string {
  switch (config.reason) {
    case 'contact_limit_reached':
      return `You've reached your contact limit of ${config.limit}. Upgrade to contact more property owners.`;
    case 'ai_analysis_limit_reached':
      return `You've reached your AI analysis limit of ${config.limit}. Upgrade for unlimited AI analyses.`;
    case 'listing_limit_reached':
      return `You've reached your listing limit of ${config.limit}. Upgrade to post more listings.`;
    case 'feature_not_available':
      return `${config.feature} is only available with a paid plan. Upgrade to access this feature.`;
    case 'subscription_required':
      return 'This feature requires a subscription. Please upgrade your account.';
    default:
      return 'This feature requires an upgrade. Please upgrade your account.';
  }
}
