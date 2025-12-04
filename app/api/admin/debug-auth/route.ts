import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { cookies } from "next/headers";

/**
 * GET /api/admin/debug-auth
 * 
 * Debug endpoint to show exactly what the API sees for authentication.
 * Always returns JSON describing session, profile, and admin status.
 * Uses requireAdminApi() which uses the same auth mechanism as all other admin routes.
 * 
 * TODO: When auth is confirmed stable in production, remove this endpoint.
 */
export async function GET() {
  // Get cookie info for debugging
  const cookieStore = await cookies();
  const cookieList = cookieStore.getAll().map((c) => ({
    name: c.name,
    hasValue: !!c.value && c.value.length > 0,
    valueLength: c.value?.length ?? 0,
  }));

  const auth = await requireAdminApi();

  console.log('[admin/debug-auth] endpoint result', {
    status: auth.status,
    ok: auth.ok,
    hasUser: !!auth.user,
    userId: auth.user?.id ?? null,
    email: auth.user?.email ?? null,
    profileRole: auth.profile?.role ?? null,
    profileSegment: auth.profile?.segment ?? null,
    profileTier: auth.profile?.tier ?? null,
    message: auth.ok ? null : auth.message,
  });

  const payload = {
    ok: auth.ok,
    status: auth.status,
    sessionSummary: {
      hasSession: !!auth.user,
      userId: auth.user?.id ?? null,
      email: auth.user?.email ?? null,
    },
    profileSummary: auth.profile
      ? {
          id: auth.profile.id ?? null,
          role: auth.profile.role ?? null,
          segment: auth.profile.segment ?? null,
          tier: auth.profile.tier ?? null,
          membership_tier: auth.profile.membership_tier ?? null,
        }
      : null,
    isAdmin: auth.ok,
    error: auth.ok ? null : auth.message,
    // Include cookie info for debugging (names only, no values)
    cookieInfo: {
      count: cookieList.length,
      cookies: cookieList,
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(payload, { status: auth.status });
}

