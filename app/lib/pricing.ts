// app/lib/pricing.ts
export type PlanId = 
  | 'investor_free' 
  | 'wholesaler_free' 
  | 'investor_basic' 
  | 'investor_pro' 
  | 'wholesaler_basic' 
  | 'wholesaler_pro' 
  | 'enterprise';

export type PlanRole = 'investor' | 'wholesaler' | 'team';

export interface Plan {
  id: PlanId;
  name: string;
  role: PlanRole;
  price: {
    monthly: number;
    yearly: number;
  };
  description: string;
  features: string[];
  limitations: string[];
  purpose: string;
  // Numeric constraints
  max_listings_per_month: number; // -1 = unlimited
  max_active_listings: number; // -1 = unlimited
  // Feature flags
  has_contact_access: boolean;
  has_ai_tools: boolean;
  ai_analysis_limit: number; // -1 = unlimited
  has_analytics: boolean;
  has_chat: boolean;
  featured: boolean;
  has_team: boolean;
  has_branding: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  investor_free: {
    id: 'investor_free',
    name: 'Investor Free',
    role: 'investor',
    price: { monthly: 0, yearly: 0 },
    description: 'Entry tier for investors to explore listings only',
    features: [
      'View map and all listings',
      'Basic filters',
      'Perfect for browsing deals'
    ],
    limitations: [
      'No contact data access',
      'No posting allowed',
      'No saved searches or comps',
      'No AI analysis'
    ],
    purpose: 'Entry tier for investors to explore listings only',
    max_listings_per_month: 0,
    max_active_listings: 0,
    has_contact_access: false,
    has_ai_tools: false,
    ai_analysis_limit: 0,
    has_analytics: false,
    has_chat: false,
    featured: false,
    has_team: false,
    has_branding: false
  },

  wholesaler_free: {
    id: 'wholesaler_free',
    name: 'Wholesaler Free',
    role: 'wholesaler',
    price: { monthly: 0, yearly: 0 },
    description: 'Hook tier for new wholesalers to test visibility',
    features: [
      '1 listing per month',
      'Basic listing form (address, price, images)'
    ],
    limitations: [
      'No analytics (views, interest)',
      'No featured placement',
      'No buyer contact data',
      'No AI tools',
      'No investor chat'
    ],
    purpose: 'Hook tier for new wholesalers to test visibility before upgrading',
    max_listings_per_month: 1,
    max_active_listings: 1,
    has_contact_access: false,
    has_ai_tools: false,
    ai_analysis_limit: 0,
    has_analytics: false,
    has_chat: false,
    featured: false,
    has_team: false,
    has_branding: false
  },

  investor_basic: {
    id: 'investor_basic',
    name: 'Investor Basic',
    role: 'investor',
    price: { monthly: 25, yearly: 300 },
    description: 'Entry-level investor plan enabling communication',
    features: [
      'Unlimited viewing',
      'Unlimited contact info access',
      'Full property details',
      'Comps preview',
      'Save/favorite searches',
      'Message wholesalers directly'
    ],
    limitations: [
      'Cannot post deals',
      'No AI analyzer',
      'No downloadable reports',
      'Standard support only'
    ],
    purpose: 'Entry-level investor plan enabling communication but limited analytics',
    max_listings_per_month: 0,
    max_active_listings: 0,
    has_contact_access: true,
    has_ai_tools: false,
    ai_analysis_limit: 0,
    has_analytics: false,
    has_chat: true,
    featured: false,
    has_team: false,
    has_branding: false
  },

  investor_pro: {
    id: 'investor_pro',
    name: 'Investor Pro',
    role: 'investor',
    price: { monthly: 49, yearly: 588 },
    description: 'Full investor toolset for active buyers',
    features: [
      'Everything in Investor Basic',
      'AI analyzer (ARV, repair, MAO)',
      'Saved comps and downloadable reports (PDF)',
      'Priority support'
    ],
    limitations: [
      'Cannot post deals'
    ],
    purpose: 'Full investor toolset for active buyers and data-driven analysis',
    max_listings_per_month: 0,
    max_active_listings: 0,
    has_contact_access: true,
    has_ai_tools: true,
    ai_analysis_limit: -1, // unlimited
    has_analytics: true,
    has_chat: true,
    featured: false,
    has_team: false,
    has_branding: false
  },

  wholesaler_basic: {
    id: 'wholesaler_basic',
    name: 'Wholesaler Basic',
    role: 'wholesaler',
    price: { monthly: 25, yearly: 300 },
    description: 'Starter plan for active wholesalers',
    features: [
      '5 listings per month',
      'Up to 5 active deals at once',
      'Basic analytics (views, interest)'
    ],
    limitations: [
      'No buyer contact data',
      'No AI tools',
      'No featured placement',
      'No chat access'
    ],
    purpose: 'Starter plan for active wholesalers posting limited deals',
    max_listings_per_month: 5,
    max_active_listings: 5,
    has_contact_access: false,
    has_ai_tools: false,
    ai_analysis_limit: 0,
    has_analytics: true,
    has_chat: false,
    featured: false,
    has_team: false,
    has_branding: false
  },

  wholesaler_pro: {
    id: 'wholesaler_pro',
    name: 'Wholesaler Pro',
    role: 'wholesaler',
    price: { monthly: 49, yearly: 588 },
    description: 'Professional wholesaler plan for regular high-volume posting',
    features: [
      '20 listings per month',
      'AI repair estimator',
      'Investor demand analytics by ZIP',
      'Featured placement',
      'Verified badge',
      'Investor chat unlocked'
    ],
    limitations: [
      'No team seats',
      'No CRM or bulk investor lists'
    ],
    purpose: 'Professional wholesaler plan for regular high-volume posting',
    max_listings_per_month: 20,
    max_active_listings: 20,
    has_contact_access: true,
    has_ai_tools: true,
    ai_analysis_limit: -1, // unlimited
    has_analytics: true,
    has_chat: true,
    featured: true,
    has_team: false,
    has_branding: false
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    role: 'team',
    price: { monthly: 99, yearly: 1188 },
    description: 'For brokerages or large wholesaler teams',
    features: [
      'Unlimited listings',
      'Team seats (multi-user management)',
      'CRM export',
      'Off-market data feed',
      'Bulk investor lists',
      'Custom branding / white-label',
      'Priority 1 support'
    ],
    limitations: [],
    purpose: 'For brokerages or large wholesaler teams requiring branding and data export',
    max_listings_per_month: -1, // unlimited
    max_active_listings: -1, // unlimited
    has_contact_access: true,
    has_ai_tools: true,
    ai_analysis_limit: -1, // unlimited
    has_analytics: true,
    has_chat: true,
    featured: true,
    has_team: true,
    has_branding: true
  }
};

// Helper functions
export function getPlanById(id: PlanId): Plan {
  return PLANS[id];
}

export function getPlansByRole(role: PlanRole): Plan[] {
  return Object.values(PLANS).filter(plan => plan.role === role);
}

export function canUserAccessFeature(userPlan: PlanId, feature: keyof Pick<Plan, 'has_contact_access' | 'has_ai_tools' | 'has_analytics' | 'has_chat' | 'featured' | 'has_team' | 'has_branding'>): boolean {
  const plan = getPlanById(userPlan);
  return plan[feature];
}

export function canUserPostListing(userPlan: PlanId): boolean {
  const plan = getPlanById(userPlan);
  return plan.max_listings_per_month > 0;
}

export function getMaxListingsForPlan(planId: PlanId): number {
  const plan = getPlanById(planId);
  return plan.max_listings_per_month;
}

export function getMaxActiveListingsForPlan(planId: PlanId): number {
  const plan = getPlanById(planId);
  return plan.max_active_listings;
}
