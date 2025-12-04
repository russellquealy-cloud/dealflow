/**
 * POST /api/billing/create-checkout-session
 * 
 * Creates a Stripe Checkout Session for upgrading subscription plans.
 * 
 * WHAT WAS BROKEN:
 * - Route was not correctly reading Supabase auth session from cookies
 * - Using wrong Supabase server client helper
 * - Missing getSession() fallback that /api/admin/debug-auth uses
 * - Frontend was redirecting to login for all 401s, causing redirect loops
 * - Not returning structured error codes to distinguish auth vs business errors
 * 
 * HOW AUTH IS NOW BEING READ:
 * - Uses getSupabaseRouteClient from @/app/lib/supabaseRoute (matches PKCE flow with dealflow-auth-token)
 * - This helper properly configures flowType: 'pkce' to match browser client
 * - Calls supabase.auth.getUser() first
 * - Falls back to supabase.auth.getSession() if getUser() fails (same pattern as /api/admin/debug-auth)
 * - Cookie adapter ensures cookies are available to all routes with path: '/'
 * - Returns NOT_AUTHENTICATED error code only when truly unauthenticated
 * 
 * RESPONSE FORMAT:
 * - Success (200): { checkoutUrl: string, url: string } - Stripe Checkout URL
 * - Unauthenticated (401): { error: "NOT_AUTHENTICATED", message: string }
 * - Invalid params (400): { error: "INVALID_PARAMETERS", message: string }
 * - Forbidden (403): { error: "UPGRADE_NOT_ALLOWED", message: string }
 * - Server error (500): { error: "STRIPE_ERROR" | "CONFIGURATION_ERROR" | "INTERNAL_ERROR", message: string }
 * 
 * FRONTEND BEHAVIOR:
 * - Only redirects to /login when response.status === 401 AND error === "NOT_AUTHENTICATED"
 * - For all other errors (403, 400, 500), shows alert message and stays on pricing page
 * - This prevents redirect loops when user is authenticated but upgrade fails for business reasons
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type Stripe from 'stripe';
import { getSupabaseRouteClient } from '../../../lib/supabaseRoute';
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

    // Log cookies for debugging (check if auth cookies are present)
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieNames = allCookies.map(c => c.name);
    
    // TEMPORARY DEBUG: Log all cookie details to diagnose auth issue
    const authCookieNames = cookieNames.filter(name => 
      name.includes('auth') || name.includes('supabase') || name.includes('dealflow') || name.startsWith('sb-')
    );
    
    console.log('[billing] cookies in route - DETAILED DEBUG', {
      count: allCookies.length,
      cookieNames,
      authCookieNames,
      hasAuthCookies: authCookieNames.length > 0,
      // Log cookie values (mask sensitive parts)
      authCookieDetails: authCookieNames.map(name => {
        const cookie = allCookies.find(c => c.name === name);
        return {
          name,
          hasValue: !!cookie?.value,
          valueLength: cookie?.value?.length || 0,
          valuePrefix: cookie?.value?.substring(0, 30) || null,
        };
      }),
    });

    // Use getSupabaseRouteClient which properly handles PKCE flow
    // This matches the browser client's PKCE configuration (app/supabase/client.ts)
    // Extract project ref to understand expected cookie names
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : null;
    const expectedCookieName = projectRef ? `sb-${projectRef}-auth-token` : null;
    
    console.log('[billing] Expected Supabase PKCE cookie name', {
      projectRef,
      expectedCookieName,
      hasExpectedCookie: expectedCookieName ? !!cookieStore.get(expectedCookieName)?.value : false,
      actualCookiesPresent: cookieNames,
    });
    
    const supabase = await getSupabaseRouteClient();

    // Also check if Authorization header is present as a fallback
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    console.log('[billing] Auth methods available', {
      hasCookieSession: !!cookieStore.get('dealflow-auth-token')?.value,
      hasBearerToken: !!bearerToken,
      bearerTokenPreview: bearerToken ? bearerToken.substring(0, 20) + '...' : null,
    });

    // Try getUser first (same pattern as /api/admin/debug-auth)
    // This will use cookies (which we've mapped from dealflow-auth-token)
    let { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // If getUser fails but we have a bearer token, try using it directly
    if ((userError || !user) && bearerToken) {
      console.log('[billing] Cookie auth failed, trying bearer token');
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(bearerToken);
      if (tokenUser && !tokenError) {
        user = tokenUser;
        userError = null;
        console.log('[billing] Bearer token auth succeeded', { userId: user.id });
      } else {
        console.log('[billing] Bearer token auth also failed', { error: tokenError?.message });
      }
    }

    console.log('[billing] supabase.auth.getUser result', {
      hasUser: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      error: userError?.message || null,
      errorStatus: userError?.status || null,
      errorCode: userError?.code || null,
    });

    // Fallback to getSession if getUser fails (same as /api/admin/debug-auth)
    if (userError || !user) {
      console.log('[billing] getUser failed, trying getSession fallback', {
        error: userError?.message,
        errorCode: userError?.status,
      });

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (session && !sessionError) {
        user = session.user;
        userError = null;
        console.log('[billing] got session from getSession fallback', {
          userId: user.id,
          email: user.email,
        });
      } else {
        console.log('[billing] getSession fallback also failed', {
          sessionError: sessionError?.message,
          hasSession: !!session,
        });
      }
    }

    // No user found - return 401 with specific error code
    if (userError || !user) {
      // TEMPORARY DEBUG: Log detailed cookie info to diagnose auth issue
      console.error('[billing] User not authenticated - DEBUG INFO', {
        error: userError?.message || 'No error but no user',
        errorStatus: userError?.status,
        errorCode: userError?.code || null,
        cookieNames,
        cookieCount: allCookies.length,
        // Log actual cookie values (mask sensitive parts)
        cookieDetails: allCookies.map(c => ({
          name: c.name,
          hasValue: !!c.value,
          valueLength: c.value?.length || 0,
          valuePrefix: c.value?.substring(0, 20) || null,
        })),
      });

      // Determine expected cookie name from project reference
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : null;
      const expectedCookieName = projectRef ? `sb-${projectRef}-auth-token` : null;
      const expectedCodeVerifierName = projectRef ? `sb-${projectRef}-auth-token-code-verifier` : null;
      
      // Get all auth-related cookies to see what's actually present
      const authCookies = allCookies.filter(c => 
        c.name.includes('auth') || c.name.includes('supabase') || c.name.includes('dealflow') || c.name.startsWith('sb-')
      );
      
      return NextResponse.json(
        { 
          error: 'NOT_AUTHENTICATED',
          message: 'Not authenticated',
          // TEMPORARY DEBUG: Include cookie info in response for debugging
          debug: {
            cookieCount: allCookies.length,
            cookieNames, // Full list for debugging
            // Show ALL auth-related cookies with details
            authCookieDetails: authCookies.map(c => ({
              name: c.name,
              hasValue: !!c.value,
              valueLength: c.value?.length || 0,
              matchesExpected: c.name === expectedCookieName || c.name === expectedCodeVerifierName,
            })),
            // Expected cookie names based on project reference
            projectRef,
            expectedCookieName,
            expectedCodeVerifierName,
            hasExpectedCookie: expectedCookieName ? !!cookieStore.get(expectedCookieName)?.value : false,
            hasExpectedCodeVerifier: expectedCodeVerifierName ? !!cookieStore.get(expectedCodeVerifierName)?.value : false,
            // Also check for dealflow-auth-token (browser client's storageKey)
            hasDealflowToken: !!cookieStore.get('dealflow-auth-token')?.value,
            hasUserError: !!userError,
            errorMessage: userError?.message || null,
            errorCode: userError?.code || null,
            // Show what Supabase SSR is looking for
            supabaseUrl: supabaseUrl ? new URL(supabaseUrl).hostname : null,
          }
        },
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
        { error: 'INVALID_PARAMETERS', message: 'Missing or invalid segment, tier, or period' },
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
        { 
          error: 'CONFIGURATION_ERROR',
          message: 'Price ID not configured for this plan' 
        },
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
        { 
          error: 'INVALID_PARAMETERS',
          message: 'Missing email address' 
        },
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
          error: 'UPGRADE_NOT_ALLOWED',
          message: `Role mismatch: You are registered as ${userRole}, but trying to purchase ${segment} plan. Please contact support if you need to change your account type.`,
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
        { 
          error: 'CONFIGURATION_ERROR',
          message: 'Configuration error: Missing NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL' 
        },
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
          error: 'STRIPE_ERROR',
          message: 'Failed to create checkout session. Please try again or contact support.',
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
        { 
          error: 'STRIPE_ERROR',
          message: 'Failed to create checkout session URL' 
        },
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
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
