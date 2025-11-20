// app/lib/pricing.ts
export type PlanId = 
  | 'investor_free' 
  | 'wholesaler_free' 
  | 'investor_basic' 
  | 'investor_pro' 
  | 'investor_elite'
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
    description: 'Teaser to force upgrade',
    features: [
      'View up to 10 listings/month',
      'Basic filters',
      'Perfect for browsing deals'
    ],
    limitations: [
      'No contact data access',
      'No AI analyzer',
      'No save/favorite',
      'No draw tools',
      'No satellite view'
    ],
    purpose: 'Teaser to force upgrade',
    max_listings_per_month: 10,
    max_active_listings: 10,
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
    price: { monthly: 35, yearly: 385 }, // Unified pricing: $35/month, $385/year (11 months)
    description: 'Core conversion tier for casual investors',
    features: [
      '30 listings/month',
      '30 contacts/month',
      '10 AI Analyzer runs/month',
      'Saved searches and favorites',
      'Alerts'
    ],
    limitations: [
      'Cannot post deals',
      'Limited AI usage',
      'No exportable reports'
    ],
    purpose: 'Core conversion tier for casual investors',
    max_listings_per_month: 30,
    max_active_listings: 30,
    has_contact_access: true,
    has_ai_tools: true,
    ai_analysis_limit: 10,
    has_analytics: true,
    has_chat: true,
    featured: false,
    has_team: false,
    has_branding: false
  },

  investor_pro: {
    id: 'investor_pro',
    name: 'Investor Pro',
    role: 'investor',
    price: { monthly: 60, yearly: 660 }, // Unified pricing: $60/month, $660/year (11 months)
    description: 'Full analytics suite for active investors',
    features: [
      'Unlimited viewing and contact',
      'AI Analyzer unlimited',
      'Exportable deal reports',
      'Property watchlists',
      'Custom alerts',
      'Priority support'
    ],
    limitations: [
      'Cannot post deals'
    ],
    purpose: 'Full analytics suite for active investors',
    max_listings_per_month: -1, // unlimited
    max_active_listings: -1, // unlimited
    has_contact_access: true,
    has_ai_tools: true,
    ai_analysis_limit: -1, // unlimited
    has_analytics: true,
    has_chat: true,
    featured: false,
    has_team: false,
    has_branding: false
  },

  investor_elite: {
    id: 'investor_elite',
    name: 'Investor Elite',
    role: 'investor',
    price: { monthly: 99, yearly: 1069 },
    description: 'Expansion once data integrations mature',
    features: [
      'Everything in Investor Pro',
      'Neighborhood analytics',
      'Rent comps',
      'Off-market data feeds',
      'Early access to new listings'
    ],
    limitations: [
      'Cannot post deals'
    ],
    purpose: 'Expansion once data integrations mature',
    max_listings_per_month: -1, // unlimited
    max_active_listings: -1, // unlimited
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
    price: { monthly: 35, yearly: 385 }, // Unified pricing: $35/month, $385/year (11 months)
    description: 'Entry tier to establish legitimacy and pipeline',
    features: [
      'Up to 10 listings/month',
      'Basic analytics (views, saves)'
    ],
    limitations: [
      'No AI repair estimator',
      'No featured placement',
      'No investor chat'
    ],
    purpose: 'Entry tier to establish legitimacy and pipeline',
    max_listings_per_month: 10,
    max_active_listings: 10,
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
    price: { monthly: 60, yearly: 660 }, // Unified pricing: $60/month, $660/year (11 months)
    description: 'Maximum exposure and tools to close deals',
    features: [
      'Up to 30 listings/month',
      'AI repair estimator',
      'Investor demand heatmaps',
      'Featured placement',
      'Verified badge',
      'Investor chat'
    ],
    limitations: [
      'No team seats',
      'No CRM export'
    ],
    purpose: 'Maximum exposure and tools to close deals',
    max_listings_per_month: 30,
    max_active_listings: 30,
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
    price: { monthly: 99, yearly: 1069 },
    description: 'For larger wholesale groups and agencies',
    features: [
      'Unlimited listings',
      'Team seats (multi-user management)',
      'CRM export',
      'Off-market lead data feed',
      'White-label branding'
    ],
    limitations: [],
    purpose: 'For larger wholesale groups and agencies',
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

// Add-on pricing
export interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
  availableFor: PlanRole[];
}

export const ADD_ONS: AddOn[] = [
  {
    id: 'featured_listing',
    name: 'Featured Listing',
    price: 5,
    description: 'Per listing per week (Wholesaler)',
    availableFor: ['wholesaler']
  },
  {
    id: 'ai_repair_report',
    name: 'AI Repair Report',
    price: 5,
    description: 'Per report (Investor and Wholesaler)',
    availableFor: ['investor', 'wholesaler']
  },
  {
    id: 'off_market_data',
    name: 'Off-Market Data Feed',
    price: 20,
    description: 'Per month (Pro and Enterprise)',
    availableFor: ['team']
  }
];

// Annual billing discount
export const ANNUAL_DISCOUNT_PERCENTAGE = 10;
