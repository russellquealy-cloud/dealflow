import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getAuthUser } from "@/lib/auth/server";
import { STRIPE_PRICES, getStripe } from "@/lib/stripe";
import { getOrCreateStripeCustomerId } from "@/lib/billing/stripeCustomer";

export const runtime = "nodejs";

function resolvePriceId(
  segment: "investor" | "wholesaler",
  tier: "basic" | "pro",
  period: "monthly" | "yearly"
) {
  if (segment === "investor") {
    if (tier === "basic") {
      return period === "yearly"
        ? STRIPE_PRICES.INVESTOR_BASIC_YEARLY
        : STRIPE_PRICES.INVESTOR_BASIC;
    }
    return period === "yearly"
      ? STRIPE_PRICES.INVESTOR_PRO_YEARLY
      : STRIPE_PRICES.INVESTOR_PRO;
  }

  if (tier === "basic") {
    return period === "yearly"
      ? STRIPE_PRICES.WHOLESALER_BASIC_YEARLY
      : STRIPE_PRICES.WHOLESALER_BASIC;
  }
  return period === "yearly"
    ? STRIPE_PRICES.WHOLESALER_PRO_YEARLY
    : STRIPE_PRICES.WHOLESALER_PRO;
}

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const rawSegment = body?.segment as string | undefined;
    const rawTier = body?.tier as string | undefined;
    const rawPeriod = (body?.period as string | undefined) ?? "monthly";

    if (
      !rawSegment ||
      !rawTier ||
      !["investor", "wholesaler"].includes(rawSegment) ||
      !["basic", "pro"].includes(rawTier) ||
      !["monthly", "yearly"].includes(rawPeriod)
    ) {
      return NextResponse.json(
        { error: "Missing or invalid segment, tier, or period" },
        { status: 400 }
      );
    }

    const segment = rawSegment as "investor" | "wholesaler";
    const tier = rawTier as "basic" | "pro";
    const period = rawPeriod as "monthly" | "yearly";

    const priceId = resolvePriceId(segment, tier, period);

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID not configured" },
        { status: 500 }
      );
    }

    // Get or create Stripe customer ID
    const stripeCustomerId = await getOrCreateStripeCustomerId({ user, supabase });

    if (!stripeCustomerId && !user.email) {
      return NextResponse.json(
        { error: "Missing email address" },
        { status: 400 }
      );
    }

    // Get profile for metadata and role validation
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, segment, tier")
      .eq("id", user.id)
      .single();

    // CRITICAL: Validate that user's role matches the requested segment
    // Prevent mismatches (e.g., investor trying to buy wholesaler plan)
    const userRole = profile?.segment || profile?.role;
    const isAdmin = userRole === 'admin';
    
    if (!isAdmin && userRole !== segment) {
      return NextResponse.json(
        { 
          error: `Role mismatch: You are registered as ${userRole}, but trying to purchase ${segment} plan. Please contact support if you need to change your account type.` 
        },
        { status: 403 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;

    if (!baseUrl) {
      console.error("Missing NEXT_PUBLIC_SITE_URL or NEXT_PUBLIC_APP_URL");
      return NextResponse.json(
        { error: "Configuration error" },
        { status: 500 }
      );
    }

    // Get product name and description based on segment and tier
    // Reserved for future use:
    // const getProductInfo = () => {
    //   const segmentName = segment === 'investor' ? 'Investor' : 'Wholesaler';
    //   const tierName = tier === 'basic' ? 'Basic' : 'Pro';
    //   const periodName = period === 'monthly' ? 'Monthly' : 'Yearly';
    //   
    //   return {
    //     name: `Off Axis Deals - ${segmentName} ${tierName} (${periodName})`,
    //     description: segment === 'investor'
    //       ? tier === 'basic'
    //         ? 'Access to property listings, basic search filters, and direct messaging with wholesalers.'
    //         : 'Advanced analytics, lead conversion tracking, geographic heatmaps, and CSV/API export capabilities.'
    //       : tier === 'basic'
    //         ? 'List your properties, receive buyer inquiries, and manage your deals efficiently.'
    //         : 'Advanced analytics, lead tracking, performance insights, and priority listing placement.',
    //   };
    // };

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ 
        price: priceId, 
        quantity: 1,
      }],
      metadata: {
        supabase_user_id: user.id,
        requested_segment: segment,
        requested_tier: tier,
        profile_role: profile?.role ?? "",
        profile_segment: profile?.segment ?? "",
        profile_tier: profile?.tier ?? "",
        // Ensure role and tier are consistently linked
        user_role: userRole ?? "",
        subscription_role: segment,
        subscription_tier: tier,
      },
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      payment_method_types: ['card'],
      // Enable promo codes in Stripe checkout
      // Users can enter promo codes during checkout in the Stripe-hosted page
      // Promo codes must be created in Stripe Dashboard → Products → Coupons
      allow_promotion_codes: true,
      // Note: invoice_creation can only be enabled for 'payment' mode, not 'subscription' mode
      // Invoices are automatically created for subscriptions, so we don't need to set this
    };

    // CRITICAL: Never set both customer and customer_email
    // If we have a Stripe customer ID, use it; otherwise use email
    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
      // Explicitly do NOT set customer_email when customer is set
      delete sessionParams.customer_email; // Ensure it's not set
    } else {
      // Only set customer_email if we don't have a customer ID
      if (user.email) {
        sessionParams.customer_email = user.email;
      }
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
