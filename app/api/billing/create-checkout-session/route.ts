/**
 * POST /api/billing/create-checkout-session
 * 
 * Creates a Stripe Checkout Session for upgrading subscription plans.
 * 
 * This endpoint uses the SAME auth pattern as /api/admin/debug-auth which works:
 * - Uses createSupabaseServer from @/lib/createSupabaseServer
 * - Calls supabase.auth.getUser() with fallback to getSession()
 * - Ensures cookies are properly read via @supabase/ssr cookie adapter
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServer } from '@/lib/createSupabaseServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('[billing] create-checkout-session route hit');

    // Read cookies for debugging
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    console.log('[billing] cookies in route', {
      count: allCookies.length,
      cookieNames: allCookies.map(c => c.name),
    });

    // Use the SAME helper as /api/admin/debug-auth which works
    const supabase = await createSupabaseServer();

    // Try getUser first (same pattern as debug-auth and admin layout)
    let { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log('[billing] supabase.getUser result', {
      hasUser: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      error: userError?.message || null,
      errorStatus: userError?.status || null,
    });

    // Fallback to getSession if getUser fails (same as debug-auth)
    if (userError || !user) {
      console.log('[billing] getUser failed, trying getSession', {
        error: userError?.message,
        errorCode: userError?.status,
      });

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (session && !sessionError) {
        user = session.user;
        userError = null;
        console.log('[billing] got session from getSession', {
          userId: user.id,
          email: user.email,
        });
      } else {
        console.log('[billing] getSession also failed', {
          sessionError: sessionError?.message,
          hasSession: !!session,
        });
      }
    }

    // No user found - return 401 with debug info
    if (userError || !user) {
      console.error('[billing] no server user in create-checkout-session', {
        user: null,
        error: userError?.message || 'No error but no user',
        errorStatus: userError?.status,
        cookieNames: allCookies.map(c => c.name),
      });

      return NextResponse.json(
        {
          ok: false,
          error: 'Not authenticated on server',
          user: null,
          userError: userError ? {
            message: userError.message,
            status: userError.status,
          } : null,
          cookieNames: allCookies.map(c => c.name),
        },
        { status: 401 }
      );
    }

    // User found - return success with debug info for now
    console.log('[billing] User authenticated successfully', {
      userId: user.id,
      userEmail: user.email,
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
        },
        error: null,
        cookieNames: allCookies.map(c => c.name),
      },
      { status: 200 }
    );

    // TODO: Once auth is confirmed working, restore Stripe checkout logic here
    // The Stripe logic should:
    // 1. Parse segment/tier/period from request body
    // 2. Map to Stripe Price ID using resolvePriceId()
    // 3. Create Stripe Checkout Session
    // 4. Return { checkoutUrl: session.url } or { url: session.url }
  } catch (error) {
    console.error('[billing] Error in create-checkout-session', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
