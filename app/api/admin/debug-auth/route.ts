import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminAuth";

/**
 * GET /api/admin/debug-auth
 * 
 * Debug endpoint to show exactly what the API sees for authentication.
 * Always returns JSON describing session, profile, and admin status.
 * 
 * TODO: When auth is confirmed stable in production, remove this endpoint.
 */
export async function GET() {
  const ctx = await getAdminContext();

  console.log('[admin/debug-auth]', {
    status: ctx.status,
    hasSession: !!ctx.session,
    userId: ctx.session?.user.id ?? null,
    email: ctx.session?.user.email ?? null,
    isAdmin: ctx.isAdmin,
    profileRole: ctx.profile?.role ?? null,
    profileSegment: ctx.profile?.segment ?? null,
    profileTier: ctx.profile?.tier ?? null,
    error: ctx.error,
  });

  const payload = {
    ok: ctx.status === 200,
    status: ctx.status,
    sessionSummary: {
      hasSession: !!ctx.session,
      userId: ctx.session?.user.id ?? null,
      email: ctx.session?.user.email ?? null,
    },
    profileSummary: ctx.profile
      ? {
          id: ctx.profile.id ?? null,
          role: ctx.profile.role ?? null,
          segment: ctx.profile.segment ?? null,
          tier: ctx.profile.tier ?? null,
          membership_tier: ctx.profile.membership_tier ?? null,
        }
      : null,
    isAdmin: ctx.isAdmin,
    error: ctx.error,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(payload, { status: ctx.status });
}

