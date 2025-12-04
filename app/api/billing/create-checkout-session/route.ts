/**
 * POST /api/billing/create-checkout-session
 * 
 * Creates a Stripe Checkout Session for upgrading subscription plans.
 * 
 * WHAT WAS BROKEN:
 * - Route was not correctly reading Supabase auth session from cookies
 * - Using wrong Supabase server client helper
 * - Not returning checkoutUrl in the expected format
 * 
 * HOW AUTH IS NOW BEING READ:
 * - Uses createServerClient from @/supabase/server (same as /api/alerts which works)
 * - Calls supabase.auth.getUser() to get authenticated user from cookies
 * - Cookie adapter ensures cookies are available to all routes with path: '/'
 * 
 * RESPONSE FORMAT:
 * - Success (200): { checkoutUrl: string, url: string } - Stripe Checkout URL
 * - Unauthenticated (401): { error: "Not authenticated" }
 * - Invalid params (400): { error: "Missing or invalid segment, tier, or period" }
 * - Server error (500): { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createServerClient } from '@/supabase/server';
import { STRIPE_PRICES, getStripe } from '@/lib/stripe';
import { getOrCreateStripeCustomerId } from '@/lib/billing/stripeCustomer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Resolve Stripe Price ID from segment, tier, and period
 */
function resolvePriceId(
  segment: 'investor' | 'wholesaler',
  tier: 'basic' | 'pro',
  period: 'monthly' | 'yearly'
): string | null {
  if (segment === 'investor') {
    if (tier === 'basic') {
      return period === 'yearly'
        ? STRIPE_PRICES.INVESTOR_BASIC_YEARLY
        : STRIPE_PRICES.INVESTOR_BASIC;
    }
    return period === 'yearly'
      ? STRIPE_PRICES.INVESTOR_PRO_YEARLY
      : STRIPE_PRICES.INVESTOR_PRO;
  }

  if (tier === 'basic') {
    return period === 'yearly'
      ? STRIPE_PRICES.WHOLESALER_BASIC_YEARLY
      : STRIPE_PRICES.WHOLESALER_BASIC;
  }
  return period === 'yearly'
    ? STRIPE_PRICES.WHOLESALER_PRO_YEARLY
    : STRIPE_PRICES.WHOLESALER_PRO;
}

export async function POST(req: NextRequest) {
  try {
    console.log('[billing] create-checkout-session route hit');

    // Use the SAME helper as /api/alerts which successfully authenticates users
    const supabase = await createServerClient();

    // Get authenticated user (same pattern as /api/alerts)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log('[billing] supabase.auth.getUser result', {
      hasUser: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      error: userError?.message || null,
      errorStatus: userError?.status || null,
    });

    // No user found - return 401 (same pattern as /api/alerts)
    if (userError || !user) {
      console.error('[billing] User not authenticated', {
        error: userError?.message || 'No error but no user',
        errorStatus: userError?.status,
      });

      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('[billing] User authenticated successfully', {
      userId: user.id,
      userEmail: user.email,
    });

    // Parse request body
    const body = await req.json();
    const rawSegment = body?.segment as string | undefined;
    const rawTier = body?.tier as string | undefined;
    const rawPeriod = (body?.period as string | undefined) ?? 'monthly';

    // Validate parameters
    if (
      !rawSegment ||
      !rawTier ||
      !['investor', 'wholesaler'].includes(rawSegment) ||
      !['basic', 'pro'].includes(rawTier) ||
      !['monthly', 'yearly'].includes(rawPeriod)
    ) {
      console.error('[billing] Invalid parameters', {
        segment: rawSegment,
        tier: rawTier,
        period: rawPeriod,
      });

      return NextResponse.json(
        { error: 'Missing or invalid segment, tier, or period' },
        { status: 400 }
      );
    }

    const segment = rawSegment as 'investor' | 'wholesaler';
    const tier = rawTier as 'basic' | 'pro';
    const period = rawPeriod as 'monthly' | 'yearly';

    console.log('[billing] Creating checkout session', {
      userId: user.id,
      userEmail: user.email,
      segment,
      tier,
      period,
    });

    // Resolve Stripe Price ID
    const priceId = resolvePriceId(segment, tier, period);

    if (!priceId) {
      console.error('[billing] Price ID not configured', {
        segment,
        tier,
        period,
      });

      return NextResponse.json(
        { error: 'Price ID not configured for this plan' },
        { status: 500 }
      );
    }

    // Get or create Stripe customer ID
    const stripeCustomerId = await getOrCreateStripeCustomerId({ user, supabase });

    if (!stripeCustomerId && !user.email) {
      console.error('[billing] Missing email address', {
        userId: user.id,
      });

      return NextResponse.json(
        { error: 'Missing email address' },
        { status: 400 }
      );
    }

    // Get profile for metadata and role validation
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, segment, tier')
      .eq('id', user.id)
      .single<{ role: string | null; segment: string | null; tier: string | null }>();

    // Validate that user's role matches the requested segment (unless admin)
    const userRole = profile?.segment || profile?.role;
    const isAdmin = userRole === 'admin';

    if (!isAdmin && userRole && userRole !== segment) {
      console.error('[billing] Role mismatch', {
        userId: user.id,
        userRole,
        requestedSegment: segment,
      });

      return NextResponse.json(
        {
          error: `Role mismatch: You are registered as ${userRole}, but trying to purchase ${segment} plan. Please contact support if you need to change your account type.`,
        },
        { status: 403 }
      );
    }

    // Get base URL for success/cancel URLs
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;

    if (!baseUrl) {
      console.error('[billing] Missing NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL');

      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    // Create Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: user.id,
        requested_segment: segment,
        requested_tier: tier,
        profile_role: profile?.role ?? '',
        profile_segment: profile?.segment ?? '',
        profile_tier: profile?.tier ?? '',
        user_role: userRole ?? '',
        subscription_role: segment,
        subscription_tier: tier,
      },
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      payment_method_types: ['card'],
      allow_promotion_codes: true,
    };

    // CRITICAL: Never set both customer and customer_email
    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    } else if (user.email) {
      sessionParams.customer_email = user.email;
    }

    const stripe = getStripe();
    let session: Stripe.Checkout.Session;

    try {
      session = await stripe.checkout.sessions.create(sessionParams);

      console.log('[billing] Stripe checkout session created', {
        sessionId: session.id,
        hasUrl: !!session.url,
        userId: user.id,
        segment,
        tier,
        period,
      });
    } catch (stripeError) {
      console.error('[billing] Stripe error creating checkout session', {
        error: stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error',
        userId: user.id,
        segment,
        tier,
        period,
        priceId,
      });

      return NextResponse.json(
        {
          error: 'Failed to create checkout session. Please try again or contact support.',
        },
        { status: 500 }
      );
    }

    if (!session.url) {
      console.error('[billing] Stripe session created but no URL returned', {
        sessionId: session.id,
        userId: user.id,
      });

      return NextResponse.json(
        { error: 'Failed to create checkout session URL' },
        { status: 500 }
      );
    }

    // Return checkout URL (frontend will read 'checkoutUrl' field)
    return NextResponse.json(
      { 
        checkoutUrl: session.url,
        url: session.url, // Backward compatibility
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[billing] Error in create-checkout-session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
