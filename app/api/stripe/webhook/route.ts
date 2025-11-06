import { NextRequest, NextResponse } from 'next/server';
import { getStripe, getPlanFromPriceId } from '@/lib/stripe';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Stripe webhook handler with idempotency and profile updates
 * Handles: checkout.session.completed, subscription.updated, subscription.deleted, invoice.payment_failed
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createSupabaseServer();
  
  // Idempotency: Check if we've processed this event
  const eventId = event.id;
  const { data: existingEvent } = await supabase
    .from('stripe_webhook_events')
    .select('id')
    .eq('stripe_event_id', eventId)
    .single();

  if (existingEvent) {
    console.log(`Webhook event ${eventId} already processed, skipping`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Record event for idempotency (create table if needed)
  try {
    await supabase
      .from('stripe_webhook_events')
      .insert({
        stripe_event_id: eventId,
        event_type: event.type,
        processed_at: new Date().toISOString(),
      });
  } catch (error) {
    // Table might not exist yet, log but continue
    console.warn('Could not record webhook event (table may not exist):', error);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const priceId = session.metadata?.priceId;

        if (!customerId || !subscriptionId) {
          console.error('Missing customer or subscription ID in checkout session');
          break;
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const activePriceId = subscription.items.data[0]?.price.id || priceId;

        if (!activePriceId) {
          console.error('No price ID found in subscription');
          break;
        }

        // Get plan details
        const plan = getPlanFromPriceId(activePriceId);
        
        // Get user ID from customer metadata
        const customer = await stripe.customers.retrieve(customerId as string);
        const userId = (customer as Stripe.Customer).metadata?.supabase_user_id || 
                       (customer as Stripe.Customer).metadata?.user_id;

        if (!userId) {
          console.error('No user ID found in customer metadata');
          break;
        }

        // Update subscriptions table
        // Type assertion needed because retrieve() may return expanded response type
        // Use any type for property access to bypass TypeScript strict checking
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = subscription as any;
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: activePriceId,
            status: sub.status,
            current_period_start: new Date((sub.current_period_start as number) * 1000).toISOString(),
            current_period_end: new Date((sub.current_period_end as number) * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'stripe_subscription_id',
          });

        // Update profile with subscription tier
        if (plan) {
          await supabase
            .from('profiles')
            .update({
              tier: plan.tier,
              segment: plan.segment,
              active_price_id: activePriceId,
              current_period_end: new Date((sub.current_period_end as number) * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }

        console.log(`Subscription created for user ${userId}: ${subscriptionId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price.id;

        if (!priceId) {
          console.error('No price ID in subscription update');
          break;
        }

        const plan = getPlanFromPriceId(priceId);

        // Get user ID from customer
        const customerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(customerId);
        const userId = (customer as Stripe.Customer).metadata?.supabase_user_id || 
                       (customer as Stripe.Customer).metadata?.user_id;

        if (!userId) {
          console.error('No user ID found in customer metadata');
          break;
        }

        // Update subscriptions table
        await supabase
          .from('subscriptions')
          .update({
            stripe_price_id: priceId,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        // Update profile
        if (plan) {
          await supabase
            .from('profiles')
            .update({
              tier: plan.tier,
              segment: plan.segment,
              active_price_id: priceId,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }

        console.log(`Subscription updated for user ${userId}: ${subscription.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Get user ID from customer
        const customerId = subscription.customer as string;
        const customer = await stripe.customers.retrieve(customerId);
        const userId = (customer as Stripe.Customer).metadata?.supabase_user_id || 
                       (customer as Stripe.Customer).metadata?.user_id;

        if (!userId) {
          console.error('No user ID found in customer metadata');
          break;
        }

        // Update subscriptions table
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        // Downgrade profile to free
        await supabase
          .from('profiles')
          .update({
            tier: 'free',
            active_price_id: null,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        console.log(`Subscription canceled for user ${userId}: ${subscription.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) {
          console.error('No subscription ID in payment failed invoice');
          break;
        }

        // Update subscription status
        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        console.log(`Payment failed for subscription: ${subscriptionId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
