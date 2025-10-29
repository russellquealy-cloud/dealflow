// app/lib/stripe.ts
// Stripe integration for billing and subscriptions

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

// Price IDs from environment variables
export const STRIPE_PRICES = {
  INVESTOR_BASIC: process.env.STRIPE_PRICE_INVESTOR_BASIC || '',
  INVESTOR_PRO: process.env.STRIPE_PRICE_INVESTOR_PRO || '',
  WHOLESALER_BASIC: process.env.STRIPE_PRICE_WHOLESALER_BASIC || '',
  WHOLESALER_PRO: process.env.STRIPE_PRICE_WHOLESALER_PRO || '',
  // Yearly prices
  INVESTOR_BASIC_YEARLY: process.env.STRIPE_PRICE_INVESTOR_BASIC_YEARLY || '',
  INVESTOR_PRO_YEARLY: process.env.STRIPE_PRICE_INVESTOR_PRO_YEARLY || '',
  WHOLESALER_BASIC_YEARLY: process.env.STRIPE_PRICE_WHOLESALER_BASIC_YEARLY || '',
  WHOLESALER_PRO_YEARLY: process.env.STRIPE_PRICE_WHOLESALER_PRO_YEARLY || '',
} as const;

// Map price ID to plan details
export function getPlanFromPriceId(priceId: string): {
  segment: 'investor' | 'wholesaler';
  tier: 'basic' | 'pro';
} | null {
  switch (priceId) {
    case STRIPE_PRICES.INVESTOR_BASIC:
    case STRIPE_PRICES.INVESTOR_BASIC_YEARLY:
      return { segment: 'investor', tier: 'basic' };
    case STRIPE_PRICES.INVESTOR_PRO:
    case STRIPE_PRICES.INVESTOR_PRO_YEARLY:
      return { segment: 'investor', tier: 'pro' };
    case STRIPE_PRICES.WHOLESALER_BASIC:
    case STRIPE_PRICES.WHOLESALER_BASIC_YEARLY:
      return { segment: 'wholesaler', tier: 'basic' };
    case STRIPE_PRICES.WHOLESALER_PRO:
    case STRIPE_PRICES.WHOLESALER_PRO_YEARLY:
      return { segment: 'wholesaler', tier: 'pro' };
    default:
      return null;
  }
}

// Create checkout session
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      priceId,
    },
  });

  return session;
}

// Create customer portal session
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

// Get subscription details
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return null;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    await stripe.subscriptions.cancel(subscriptionId);
    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
}

// Update subscription
export async function updateSubscription({
  subscriptionId,
  priceId,
}: {
  subscriptionId: string;
  priceId: string;
}): Promise<boolean> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });
    
    return true;
  } catch (error) {
    console.error('Error updating subscription:', error);
    return false;
  }
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

// Types for subscription system
export type SubscriptionTier = 'FREE' | 'INVESTOR_BASIC' | 'INVESTOR_PRO' | 'WHOLESALER_BASIC' | 'WHOLESALER_PRO';

export interface PlanLimits {
  contacts: number;
  ai_analyses: number;
  listings: number;
}

export interface PlanFeatures {
  contact_info: boolean;
  ai_tools: boolean;
  advanced_search: boolean;
  priority_support: boolean;
  api_access: boolean;
  white_label: boolean;
}

export interface Plan {
  name: string;
  price: number;
  limits: PlanLimits;
  features: PlanFeatures;
}

// Plan definitions
export const STRIPE_PLANS: Record<SubscriptionTier, Plan> = {
  FREE: {
    name: 'Free',
    price: 0,
    limits: {
      contacts: 5,
      ai_analyses: 2,
      listings: 1,
    },
    features: {
      contact_info: false,
      ai_tools: false,
      advanced_search: false,
      priority_support: false,
      api_access: false,
      white_label: false,
    },
  },
  INVESTOR_BASIC: {
    name: 'Investor Basic',
    price: 29,
    limits: {
      contacts: 50,
      ai_analyses: 20,
      listings: 5,
    },
    features: {
      contact_info: true,
      ai_tools: true,
      advanced_search: true,
      priority_support: false,
      api_access: false,
      white_label: false,
    },
  },
  INVESTOR_PRO: {
    name: 'Investor Pro',
    price: 59,
    limits: {
      contacts: 200,
      ai_analyses: 100,
      listings: 20,
    },
    features: {
      contact_info: true,
      ai_tools: true,
      advanced_search: true,
      priority_support: true,
      api_access: true,
      white_label: false,
    },
  },
  WHOLESALER_BASIC: {
    name: 'Wholesaler Basic',
    price: 49,
    limits: {
      contacts: 100,
      ai_analyses: 50,
      listings: 10,
    },
    features: {
      contact_info: true,
      ai_tools: true,
      advanced_search: true,
      priority_support: false,
      api_access: false,
      white_label: false,
    },
  },
  WHOLESALER_PRO: {
    name: 'Wholesaler Pro',
    price: 99,
    limits: {
      contacts: 500,
      ai_analyses: 200,
      listings: 50,
    },
    features: {
      contact_info: true,
      ai_tools: true,
      advanced_search: true,
      priority_support: true,
      api_access: true,
      white_label: true,
    },
  },
};