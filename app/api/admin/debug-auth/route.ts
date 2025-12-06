/**
 * GET /api/admin/debug-auth
 * 
 * Admin debug endpoint for authentication sanity checks.
 * 
 * This endpoint provides diagnostic information about the current authentication
 * state for admin users. It's used by the admin dashboard to verify that server-side
 * route handlers can correctly identify authenticated admin users.
 * 
 * This endpoint uses the same auth logic as the admin layout (app/admin/layout.tsx):
 * - Uses createSupabaseServer from @/lib/createSupabaseServer
 * - Calls supabase.auth.getUser() with fallback to getSession()
 * - Fetches profile and checks admin status using isAdmin() helper (same as client-side)
 * 
 * Returns:
 * - 200: { ok: true, email, role, segment, isAdmin: true, userId } if admin
 * - 401: { ok: false, reason: "unauthenticated", email?, role?, segment?, isAdmin: false } if no user
 * - 403: { ok: false, reason: "forbidden", email, role, segment, isAdmin: false } if user but not admin
 * 
 * TODO: When auth is confirmed stable in production, remove this endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  try {
    console.log('[admin/debug-auth] ENTER');

    // Log cookie and header info before creating client
    const cookieStore = await cookies();
    const headerStore = await import('next/headers').then(m => m.headers());
    
    console.log('[admin/debug-auth] cookie keys:', cookieStore.getAll().map(c => c.name));
    console.log('[admin/debug-auth] auth header present:', !!headerStore.get('authorization'));

    // Use the same Supabase server client as admin layout
    const supabase = await createSupabaseServer();

    // Try getUser first (same as admin layout)
    let { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log('[admin/debug-auth] getUser result', {
      userId: user?.id ?? null,
      email: user?.email ?? null,
      error: userError ? { message: userError.message, name: userError.name } : null,
    });

    // Fallback to getSession if getUser fails (same as admin layout)
    if (userError || !user) {
      console.log('[debug-auth] getUser failed, trying getSession', {
        error: userError?.message,
        errorCode: userError?.status,
      });

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (session && !sessionError) {
        user = session.user;
        userError = null;
        console.log('[debug-auth] got session from getSession', {
          userId: user.id,
          email: user.email,
        });
      } else {
        console.log('[debug-auth] getSession also failed', {
          sessionError: sessionError?.message,
          hasSession: !!session,
        });
      }
    }

    // No user found - return 401
    if (userError || !user) {
      console.log('[debug-auth] No user found', {
        error: userError?.message,
        errorCode: userError?.status,
      });

      return NextResponse.json(
        {
          ok: false,
          reason: 'unauthenticated',
          email: null,
          role: null,
          segment: null,
          isAdmin: false,
        },
        { status: 401 }
      );
    }

    // Fetch profile (same fields as client-side check)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,email,role,segment,tier,membership_tier')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('[debug-auth] Profile not found', {
        error: profileError?.message,
        userId: user.id,
      });

      return NextResponse.json(
        {
          ok: false,
          reason: 'unauthenticated',
          email: user.email,
          role: null,
          segment: null,
          isAdmin: false,
        },
        { status: 401 }
      );
    }

    // Check admin status using same logic as client-side
    const adminCheck = isAdmin(profile);

    console.log('[debug-auth] result', {
      status: adminCheck ? 200 : 403,
      ok: adminCheck,
      userEmail: user.email,
      userId: user.id,
      profileRole: profile.role,
      profileSegment: profile.segment,
      isAdmin: adminCheck,
    });

    // User found but not admin - return 403
    if (!adminCheck) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'forbidden',
          email: user.email,
          role: profile.role,
          segment: profile.segment,
          isAdmin: false,
        },
        { status: 403 }
      );
    }

    // User is admin - return 200
    return NextResponse.json(
      {
        ok: true,
        email: user.email,
        userId: user.id,
        role: profile.role,
        segment: profile.segment,
        isAdmin: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[debug-auth] Error:', error);
    return NextResponse.json(
      {
        ok: false,
        reason: 'unauthenticated',
        email: null,
        role: null,
        segment: null,
        isAdmin: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 401 }
    );
  }
}

