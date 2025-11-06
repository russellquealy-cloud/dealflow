#!/usr/bin/env tsx
/**
 * Stripe Bootstrap Script
 * 
 * Validates or creates Stripe products and prices for the subscription system.
 * Ensures all required price IDs are configured.
 * 
 * Usage:
 *   npx tsx scripts/stripe-bootstrap.ts
 * 
 * Required environment variables:
 *   STRIPE_SECRET_KEY - Your Stripe secret key
 */

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY environment variable is required');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

interface PlanConfig {
  name: string;
  description: string;
  segment: 'investor' | 'wholesaler';
  tier: 'basic' | 'pro';
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceId?: string;
  yearlyPriceId?: string;
}

const PLANS: PlanConfig[] = [
  {
    name: 'Investor Basic',
    description: 'Monthly subscription for Investor Basic plan',
    segment: 'investor',
    tier: 'basic',
    monthlyPrice: 29,
    yearlyPrice: 290, // 2 months free
  },
  {
    name: 'Investor Pro',
    description: 'Monthly subscription for Investor Pro plan',
    segment: 'investor',
    tier: 'pro',
    monthlyPrice: 99,
    yearlyPrice: 990, // 2 months free
  },
  {
    name: 'Wholesaler Basic',
    description: 'Monthly subscription for Wholesaler Basic plan',
    segment: 'wholesaler',
    tier: 'basic',
    monthlyPrice: 29,
    yearlyPrice: 290,
  },
  {
    name: 'Wholesaler Pro',
    description: 'Monthly subscription for Wholesaler Pro plan',
    segment: 'wholesaler',
    tier: 'pro',
    monthlyPrice: 99,
    yearlyPrice: 990,
  },
];

async function findOrCreateProduct(name: string, description: string): Promise<Stripe.Product> {
  // Search for existing product
  const products = await stripe.products.search({
    query: `name:'${name}' AND active:'true'`,
  });

  if (products.data.length > 0) {
    return products.data[0];
  }

  // Create new product
  console.log(`  Creating product: ${name}`);
  return await stripe.products.create({
    name,
    description,
    active: true,
  });
}

async function findOrCreatePrice(
  product: Stripe.Product,
  amount: number,
  interval: 'month' | 'year'
): Promise<Stripe.Price> {
  // Search for existing price
  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
  });

  const existingPrice = prices.data.find(
    p => p.unit_amount === amount * 100 && p.recurring?.interval === interval
  );

  if (existingPrice) {
    return existingPrice;
  }

  // Create new price
  const intervalCount = interval === 'year' ? 1 : 1;
  console.log(`    Creating ${interval} price: $${amount}`);
  
  return await stripe.prices.create({
    product: product.id,
    unit_amount: amount * 100, // Stripe uses cents
    currency: 'usd',
    recurring: {
      interval,
      interval_count: intervalCount,
    },
  });
}

async function main() {
  console.log('🚀 Stripe Bootstrap Script\n');
  console.log('Validating and creating Stripe products/prices...\n');

  const results: Record<string, string> = {};

  try {
    for (const plan of PLANS) {
      console.log(`\n📦 Processing: ${plan.name}`);
      
      // Find or create product
      const product = await findOrCreateProduct(plan.name, plan.description);
      console.log(`  Product ID: ${product.id}`);

      // Find or create monthly price
      const monthlyPrice = await findOrCreatePrice(product, plan.monthlyPrice, 'month');
      plan.monthlyPriceId = monthlyPrice.id;
      console.log(`  Monthly Price ID: ${monthlyPrice.id}`);

      // Find or create yearly price
      const yearlyPrice = await findOrCreatePrice(product, plan.yearlyPrice, 'year');
      plan.yearlyPriceId = yearlyPrice.id;
      console.log(`  Yearly Price ID: ${yearlyPrice.id}`);

      // Store results
      const prefix = plan.segment.toUpperCase() + '_' + plan.tier.toUpperCase();
      results[`STRIPE_PRICE_${prefix}`] = monthlyPrice.id;
      results[`STRIPE_PRICE_${prefix}_YEARLY`] = yearlyPrice.id;
    }

    console.log('\n✅ All products and prices configured!\n');
    console.log('📋 Environment Variables to Add:\n');
    
    Object.entries(results).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });

    console.log('\n💡 Copy these values to:');
    console.log('   - .env.local (for local development)');
    console.log('   - Vercel Dashboard → Settings → Environment Variables (for production)');
    
    console.log('\n📝 Next Steps:');
    console.log('1. Add the environment variables above to your Vercel project');
    console.log('2. Update your Stripe webhook endpoint to:');
    console.log(`   ${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/stripe/webhook`);
    console.log('3. Test checkout flow with Stripe test mode');

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe Error Details:', error.message);
    }
    process.exit(1);
  }
}

main();

