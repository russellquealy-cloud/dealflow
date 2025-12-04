/**
 * DEBUG MODE: Pure auth debug endpoint
 * Temporarily removed Stripe logic to debug 401 authentication issues
 * 
 * This endpoint uses the EXACT same auth pattern as /api/alerts which works.
 * Once this returns 200 with user data, we'll restore the Stripe checkout logic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('[billing] create-checkout-session DEBUG route hit');

    // Read cookies (same as working routes)
    const cookieStore = await cookies();
    
    // Log cookie info for debugging
    const allCookies = cookieStore.getAll();
    console.log('[billing] cookies in route', {
      count: allCookies.length,
      cookieNames: allCookies.map(c => c.name),
      hasAuthCookies: allCookies.some(c => 
        c.name.includes('auth') || c.name.includes('supabase') || c.name.includes('dealflow')
      ),
    });

    // Use the EXACT same pattern as /api/alerts which works
    const supabase = await createServerClient();
    
    console.log('[billing] created supabase client');

    // Call getUser (same pattern as /api/alerts)
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log('[billing] supabase.getUser result', {
      hasUser: !!user,
      userId: user?.id || null,
      userEmail: user?.email || null,
      error: error?.message || null,
      errorStatus: error?.status || null,
    });

    // If getUser fails, try getSession as fallback
    let session = null;
    if (error || !user) {
      console.log('[billing] getUser failed, trying getSession');
      const { data: { session: sessionData }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('[billing] supabase.getSession result', {
        hasSession: !!sessionData,
        sessionUserId: sessionData?.user?.id || null,
        sessionEmail: sessionData?.user?.email || null,
        sessionError: sessionError?.message || null,
      });
      
      session = sessionData;
    }

    // Return debug payload
    return NextResponse.json(
      {
        user: user ? {
          id: user.id,
          email: user.email,
        } : null,
        error: error ? {
          message: error.message,
          status: error.status,
        } : null,
        session: session ? {
          user: {
            id: session.user.id,
            email: session.user.email,
          },
          expires_at: session.expires_at,
        } : null,
        cookies: {
          count: allCookies.length,
          names: allCookies.map(c => c.name),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[billing] Error in debug route', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
