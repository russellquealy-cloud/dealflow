import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";

/**
 * GET /api/admin/diagnose
 * Admin diagnostics endpoint using shared auth helper
 * 
 * Uses requireAdminApi() as single source of truth for admin auth.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminApi();

    console.log('[admin/diagnose]', {
      status: auth.status,
      ok: auth.ok,
      email: auth.user?.email,
      isAdmin: auth.ok,
      message: auth.ok ? null : auth.message,
    });

    if (!auth.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: auth.message,
          reason: auth.status === 401 ? "no-user" : "not-admin",
          status: auth.status,
        },
        { status: auth.status }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        admin: true,
        adminProfile: auth.profile,
        authUser: auth.user,
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
