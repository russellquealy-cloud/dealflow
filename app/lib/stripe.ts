import Stripe from 'stripe';

// Initialize Stripe only if the secret key is available
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    })
  : null;

export const STRIPE_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'View all listings',
      'Basic map search',
      'Contact 5 listings/month',
    ],
    limits: {
      listings: 0, // Cannot create listings
      contacts: 5,
      ai_analyses: 0,
    },
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    stripe_price_id: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    features: [
      'Unlimited listings',
      'AI property analysis',
      'Unlimited contacts',
      'Priority support',
    ],
    limits: {
      listings: -1, // Unlimited
      contacts: -1, // Unlimited
      ai_analyses: 50,
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    stripe_price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'API access',
      'Custom integrations',
      'Dedicated support',
    ],
    limits: {
      listings: -1, // Unlimited
      contacts: -1, // Unlimited
      ai_analyses: -1, // Unlimited
    },
  },
} as const;

export type SubscriptionTier = keyof typeof STRIPE_PLANS;
export type PlanLimits = {
  readonly listings: number;
  readonly contacts: number;
  readonly ai_analyses: number;
};
