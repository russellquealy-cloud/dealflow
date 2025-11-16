// app/api/billing/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, getPlanFromPriceId } from '@/lib/stripe';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import Stripe from 'stripe';
import { notifySubscriptionRenewal } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = await createSupabaseServer();
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  const priceId = session.metadata?.priceId;

  if (!customerId || !subscriptionId || !priceId) {
    console.error('Missing required data in checkout session');
    return;
  }

  // Get plan details from price ID
  const plan = getPlanFromPriceId(priceId);
  if (!plan) {
    console.error('Invalid price ID:', priceId);
    return;
  }

  // Get user ID from customer metadata
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const customer = await stripe.customers.retrieve(customerId as string);
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id;

  if (!userId) {
    console.error('No user ID found in customer metadata');
    return;
  }

  // Update user profile
  // Update user profile
  await supabase
    .from('profiles')
    .update({
      tier: plan.tier,
      segment: plan.segment,
      active_price_id: priceId,
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    })
    .eq('id', userId);

  console.log(`Updated user ${userId} to ${plan.segment} ${plan.tier}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = await createSupabaseServer();
  const customerId = subscription.customer;
  const priceId = subscription.items.data[0]?.price.id;

  if (!customerId || !priceId) {
    console.error('Missing required data in subscription update');
    return;
  }

  // Get plan details
  const plan = getPlanFromPriceId(priceId);
  if (!plan) {
    console.error('Invalid price ID:', priceId);
    return;
  }

  // Get user ID
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const customer = await stripe.customers.retrieve(customerId as string);
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id;

  if (!userId) {
    console.error('No user ID found in customer metadata');
    return;
  }

  // Update user profile
  // Update user profile
  await supabase
    .from('profiles')
    .update({
      tier: plan.tier,
      segment: plan.segment,
      active_price_id: priceId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
    })
    .eq('id', userId);

  console.log(`Updated user ${userId} subscription to ${plan.segment} ${plan.tier}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = await createSupabaseServer();
  const customerId = subscription.customer;

  // Get user ID
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const customer = await stripe.customers.retrieve(customerId as string);
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id;

  if (!userId) {
    console.error('No user ID found in customer metadata');
    return;
  }

  // Downgrade user to free
  // Update user profile
  await supabase
    .from('profiles')
    .update({
      tier: 'free',
      active_price_id: null,
      current_period_end: null,
    })
    .eq('id', userId);

  console.log(`Downgraded user ${userId} to free plan`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const supabase = await createSupabaseServer();
  const customerId = invoice.customer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionId = (invoice as any).subscription;

  if (!customerId || !subscriptionId) {
    console.error('Missing required data in payment succeeded');
    return;
  }

  // Get subscription details
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    console.error('No price ID found in subscription');
    return;
  }

  // Get plan details
  const plan = getPlanFromPriceId(priceId);
  if (!plan) {
    console.error('Invalid price ID:', priceId);
    return;
  }

  // Get user ID
  const customer = await stripe.customers.retrieve(customerId as string);
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id;

  if (!userId) {
    console.error('No user ID found in customer metadata');
    return;
  }

  // Update current period end
  // Update user profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodEnd = new Date((subscription as any).current_period_end * 1000);
  await supabase
    .from('profiles')
    .update({
      current_period_end: periodEnd.toISOString(),
    })
    .eq('id', userId);

  console.log(`Updated user ${userId} payment period`);

  // Send renewal confirmation notification
  try {
    await notifySubscriptionRenewal({
      ownerId: userId,
      title: 'Subscription Renewed Successfully',
      body: `Your ${plan.segment} ${plan.tier} subscription has been renewed. Thank you for your continued support!`,
      supabaseClient: supabase,
    });
  } catch (notificationError) {
    console.error('Failed to send renewal notification', notificationError);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = await createSupabaseServer();
  const customerId = invoice.customer;
  
  // Get user ID
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const customer = await stripe.customers.retrieve(customerId as string);
  const userId = (customer as Stripe.Customer).metadata?.supabase_user_id;

  if (!userId) {
    console.error('No user ID found in customer metadata');
    return;
  }

  console.log(`Payment failed for user ${userId}`);

  // Send payment failure notification
  try {
    await notifySubscriptionRenewal({
      ownerId: userId,
      title: 'Payment Failed - Action Required',
      body: 'We were unable to process your subscription payment. Please update your payment method to avoid service interruption.',
      supabaseClient: supabase,
    });
  } catch (notificationError) {
    console.error('Failed to send payment failure notification', notificationError);
  }
}
