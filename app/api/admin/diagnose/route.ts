import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminAuth";

/**
 * GET /api/admin/diagnose
 * Admin diagnostics endpoint using shared auth helper
 * 
 * Uses getAdminContext() as single source of truth for admin auth.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAdminContext(request);

    console.log('[admin/diagnose]', {
      status: ctx.status,
      email: ctx.session?.user.email,
      isAdmin: ctx.isAdmin,
      error: ctx.error,
    });

    if (ctx.status !== 200) {
      return NextResponse.json(
        {
          ok: false,
          error: ctx.error,
          reason: ctx.status === 401 ? "no-user" : "not-admin",
          status: ctx.status,
        },
        { status: ctx.status }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        admin: true,
        adminProfile: ctx.profile,
        authUser: ctx.session.user,
        authError: null,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[admin/diagnose] Error:', error);
    return NextResponse.json(
      {
        error: "Internal server error",
        reason: "server-error",
        status: 500,
      },
      { status: 500 }
    );
  }
}
