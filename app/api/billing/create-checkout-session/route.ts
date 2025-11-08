import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuthUser } from "@/lib/auth/server";
import { STRIPE_PRICES } from "@/lib/stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

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
    const { user, supabase } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const segment = body?.segment as string | undefined;
    const tier = body?.tier as string | undefined;
    const period = (body?.period as string | undefined) ?? "monthly";

    if (
      !segment ||
      !tier ||
      !["investor", "wholesaler"].includes(segment) ||
      !["basic", "pro"].includes(tier) ||
      !["monthly", "yearly"].includes(period)
    ) {
      return NextResponse.json(
        { error: "Missing or invalid segment, tier, or period" },
        { status: 400 }
      );
    }

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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email ?? undefined,
      customer: stripeCustomerId ?? undefined,
      metadata: {
        supabase_user_id: user.id,
        requested_segment: segment,
        requested_tier: tier,
        profile_role: profile?.role ?? "",
        profile_tier: profile?.tier ?? "",
      },
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
