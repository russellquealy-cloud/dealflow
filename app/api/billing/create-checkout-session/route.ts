import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/server";
import { STRIPE_PRICES, getStripe } from "@/lib/stripe";

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, role, tier")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("create-checkout-session profile error", profileError);
      return NextResponse.json(
        { error: "Failed to load profile" },
        { status: 500 }
      );
    }

    let stripeCustomerId = profile?.stripe_customer_id ?? null;

    const stripe = getStripe();

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          supabase_user_id: user.id,
          requested_segment: segment,
          requested_tier: tier,
        },
      });

      stripeCustomerId = customer.id;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);

      if (updateError) {
        console.error("Failed to update stripe_customer_id", updateError);
      }
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

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        supabase_user_id: user.id,
        requested_segment: segment,
        requested_tier: tier,
        profile_role: profile?.role ?? "",
        profile_tier: profile?.tier ?? "",
      },
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
    };

    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    } else if (user.email) {
      sessionParams.customer_email = user.email;
    }

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
