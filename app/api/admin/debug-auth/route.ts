/**
 * GET /api/admin/debug-auth
 * 
 * Admin debug endpoint for authentication sanity checks.
 * 
 * This endpoint provides diagnostic information about the current authentication
 * state for admin users. It's used by the admin dashboard to verify that server-side
 * route handlers can correctly identify authenticated admin users.
 * 
 * This endpoint relies on requireAdminServer() so all admin APIs share the same
 * authorization logic. The requireAdminServer helper:
 * - Uses createServerClient from @supabase/ssr which reads from cookies
 * - Calls supabase.auth.getUser() to get the current user
 * - Fetches the profile and checks admin status using the same logic as client-side
 * 
 * TODO: When auth is confirmed stable in production, remove this endpoint.
 */

import { NextResponse } from "next/server";
import { requireAdminServer } from "@/lib/admin";

export async function GET() {
  const result = await requireAdminServer();

  console.log("[debug-auth] result", {
    status: result.status,
    ok: result.ok,
    userEmail: result.ok ? result.user.email : null,
    userId: result.ok ? result.user.id : null,
    profileRole: result.ok ? result.profile.role : result.profile?.role ?? null,
    profileSegment: result.ok ? result.profile.segment : result.profile?.segment ?? null,
    reason: !result.ok ? result.reason : null,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        reason: result.reason,
        status: result.status,
      },
      { status: result.status }
    );
  }

  const { user, profile } = result;

  return NextResponse.json(
    {
      ok: true,
      userEmail: user.email,
      userId: user.id,
      profile: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        segment: profile.segment,
        tier: profile.tier,
        membership_tier: profile.membership_tier,
      },
    },
    { status: 200 }
  );
}

