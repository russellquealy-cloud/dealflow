// app/api/billing/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, STRIPE_PRICES } from '@/lib/stripe';
import { supabase } from '@/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { segment, tier } = await request.json();

    if (!segment || !tier) {
      return NextResponse.json(
        { error: 'Missing segment or tier' },
        { status: 400 }
      );
    }

    // Get user from session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get price ID
    let priceId: string;
    if (segment === 'investor') {
      priceId = tier === 'basic' ? STRIPE_PRICES.INVESTOR_BASIC : STRIPE_PRICES.INVESTOR_PRO;
    } else {
      priceId = tier === 'basic' ? STRIPE_PRICES.WHOLESALER_BASIC : STRIPE_PRICES.WHOLESALER_PRO;
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured' },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    let customerId: string;
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single();

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    } else {
      // Create Stripe customer
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          supabase_user_id: session.user.id,
        },
      });
      customerId = customer.id;

      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', session.user.id);
    }

    // Create checkout session
    const session_url = await createCheckoutSession({
      customerId,
      priceId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/cancel`,
    });

    return NextResponse.json({ url: session_url.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
