// app/api/billing/portal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPortalSession } from '@/lib/stripe';
import { getSupabaseRouteClient } from '../../../lib/supabaseRoute';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Use getSupabaseRouteClient which properly handles PKCE flow with dealflow-auth-token
    // This matches the browser client's PKCE configuration (app/supabase/client.ts)
    const supabase = await getSupabaseRouteClient();

    // Try getUser first (same pattern as /api/billing/create-checkout-session)
    let { data: { user }, error: userError } = await supabase.auth.getUser();

    // Fallback to getSession if getUser fails (same pattern as /api/billing/create-checkout-session)
    if (userError || !user) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (session && !sessionError) {
        user = session.user;
        userError = null;
      }
    }

    if (userError || !user) {
      console.log('[billing/portal] Auth failed', {
        hasUser: !!user,
        error: userError?.message,
      });
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single<{ stripe_customer_id: string | null }>();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 404 }
      );
    }

    // Create portal session
    const portalSession = await createPortalSession({
      customerId: profile.stripe_customer_id,
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
