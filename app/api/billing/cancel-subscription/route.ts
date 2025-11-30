import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserServer, createSupabaseRouteClient } from '@/lib/auth/server';
import { cancelSubscription } from '@/lib/stripe';

export const runtime = 'nodejs';

/**
 * POST /api/billing/cancel-subscription
 * 
 * Cancels a user's subscription with optional proration.
 * 
 * Body:
 * - immediately: boolean (optional) - If true, cancel immediately. If false, cancel at period end.
 * 
 * Returns:
 * - success: boolean
 * - message: string
 * - canceled_at?: string - When subscription was/will be canceled
 */
export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuthUserServer();
    const supabase = createSupabaseRouteClient();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const immediately = body?.immediately === true;

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single<{ stripe_subscription_id: string | null; status: string | null }>();

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel subscription
    const canceledSubscription = await cancelSubscription(
      subscription.stripe_subscription_id,
      { immediately }
    );

    if (!canceledSubscription) {
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    // Update subscription status in database
    if (immediately) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString(),
        } as never)
        .eq('stripe_subscription_id', subscription.stripe_subscription_id);

      // Downgrade profile to free immediately
      await supabase
        .from('profiles')
        .update({
          tier: 'free',
          active_price_id: null,
          current_period_end: null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', user.id);
    } else {
      // Subscription will cancel at period end
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('stripe_subscription_id', subscription.stripe_subscription_id);
    }

    const canceledAt = canceledSubscription.canceled_at
      ? new Date(canceledSubscription.canceled_at * 1000).toISOString()
      : canceledSubscription.cancel_at
      ? new Date(canceledSubscription.cancel_at * 1000).toISOString()
      : undefined;

    return NextResponse.json({
      success: true,
      message: immediately
        ? 'Subscription canceled immediately. Access has been revoked.'
        : 'Subscription will be canceled at the end of the current billing period. You will retain access until then.',
      canceled_at: canceledAt,
      cancel_at_period_end: !immediately,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

