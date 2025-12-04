import { createServerClient } from "@/supabase/server";
import { getSupabaseRouteClient } from "../app/lib/supabaseRoute";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type AdminProfile = {
  id: string;
  email: string | null;
  role: string | null;
  segment: string | null;
  tier: string | null;
  membership_tier: string | null;
};

export function isAdmin(
  input:
    | AdminProfile
    | { role?: string | null; segment?: string | null; tier?: string | null; membership_tier?: string | null; email?: string | null }
    | string
    | null
    | undefined
): boolean {
  if (!input) return false;

  // If input is a string, treat it as either an email or a role/tier value
  if (typeof input === "string") {
    const value = input.toLowerCase();

    // Email-based override
    if (value === "admin@offaxisdeals.com") return true;

    // Role/tier-based checks
    if (value === "admin" || value === "enterprise") return true;

    return false;
  }

  // If input looks like a profile-like object
  const email = "email" in input ? input.email ?? null : null;
  const role = "role" in input ? input.role ?? null : null;
  const segment = "segment" in input ? input.segment ?? null : null;
  const tier = "tier" in input ? input.tier ?? null : null;
  const membershipTier =
    "membership_tier" in input ? input.membership_tier ?? null : null;

  if (email && email.toLowerCase() === "admin@offaxisdeals.com") {
    return true;
  }

  if (
    role === "admin" ||
    segment === "admin" ||
    tier === "enterprise" ||
    membershipTier === "enterprise"
  ) {
    return true;
  }

  return false;
}

/**
 * Require Admin API Result
 * Simple return type for requireAdminApi helper
 */
export type RequireAdminApiResult =
  | {
      ok: true;
      status: 200;
      user: User;
      profile: AdminProfile;
      supabase: SupabaseClient<Database>;
    }
  | {
      ok: false;
      status: 401 | 403;
      message: string;
      user?: User | null;
      profile?: AdminProfile | null;
    };

/**
 * Require Admin API
 * 
 * Single source of truth for admin authentication in API route handlers.
 * 
 * IMPORTANT: This function now uses PKCE-aware authentication that:
 * 1. Reads the dealflow-auth-token cookie (base64-encoded JSON)
 * 2. Extracts the access_token from the decoded JSON
 * 3. Calls supabase.auth.getUser(accessToken) with the token
 * 
 * This is necessary because @supabase/ssr's cookie mechanism doesn't work
 * with our custom PKCE cookie format in production.
 * 
 * @returns RequireAdminApiResult with either ok: true and user/profile/supabase, or ok: false with error details
 */
export async function requireAdminApi(): Promise<RequireAdminApiResult> {
  // Use the PKCE-aware helper from lib/pkceAuth
  const { requireAdminApi: pkceRequireAdminApi } = await import('@/lib/pkceAuth');
  const result = await pkceRequireAdminApi();

  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      message: result.message,
      user: null,
      profile: null,
    };
  }

  // Convert to the expected return type
  return {
    ok: true,
    status: 200,
    user: result.user,
    profile: result.profile as AdminProfile,
    supabase: result.supabase,
  };
}

/**
 * Legacy requireAdminApi implementation (kept for reference)
 * Now delegates to PKCE-aware implementation above
 */
async function _legacyRequireAdminApi(): Promise<RequireAdminApiResult> {
  try {
    // Log cookies before creating Supabase client (for debugging)
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll().map(c => ({
      name: c.name,
      hasValue: !!c.value && c.value.length > 0,
      valueLength: c.value?.length ?? 0,
    }));
    
    const dealflowCookies = allCookies.filter(c => 
      c.name.includes('dealflow') || c.name.includes('auth-token')
    );
    
    console.log('[requireAdminApi] cookies before auth:', {
      totalCookies: allCookies.length,
      dealflowCookies: dealflowCookies.map(c => c.name),
      dealflowCookiesWithValues: dealflowCookies.filter(c => c.hasValue).map(c => ({
        name: c.name,
        length: c.valueLength,
      })),
    });

    // Use the centralized route client that reads from dealflow-auth-token
    const supabase = await getSupabaseRouteClient();

    // Try getUser() first (preferred for Next.js 15)
    let {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log('[requireAdminApi] getUser() result:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      error: userError?.message,
      errorCode: userError?.status,
    });

    // If getUser() fails, try getSession() as fallback
    if (userError || !user) {
      console.log('[requireAdminApi] getUser() failed, trying getSession()', {
        userError: userError?.message,
        errorCode: userError?.status,
      });
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('[requireAdminApi] getSession() result:', {
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        sessionEmail: session?.user?.email,
        hasAccessToken: !!session?.access_token,
        error: sessionError?.message,
        errorCode: sessionError?.status,
      });
      
      if (session && !sessionError) {
        user = session.user;
        userError = null;
        console.log('[requireAdminApi] got session from getSession()', {
          userId: user.id,
          email: user.email,
        });
      } else {
        console.log('[requireAdminApi] getSession() also failed', {
          sessionError: sessionError?.message,
          hasSession: !!session,
        });
      }
    }

    if (userError || !user) {
      return {
        ok: false,
        status: 401,
        message: userError?.message ?? "Auth session missing!",
        user: null,
        profile: null,
      };
    }

    // Fetch profile to check admin status
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id,email,role,segment,tier,membership_tier")
      .eq("id", user.id)
      .single<AdminProfile>();

    if (profileError || !profile) {
      return {
        ok: false,
        status: 401,
        message: profileError?.message ?? "Profile not found",
        user,
        profile: null,
      };
    }

    // Use the shared isAdmin() helper (same logic as client-side check)
    const adminCheck = isAdmin(profile);

    console.log('[requireAdminApi] admin check result', {
      userId: user.id,
      email: user.email,
      profileRole: profile.role,
      profileSegment: profile.segment,
      isAdmin: adminCheck,
    });

    if (!adminCheck) {
      return {
        ok: false,
        status: 403,
        message: "User is not admin",
        user,
        profile,
      };
    }

    return {
      ok: true,
      status: 200,
      user,
      profile,
      supabase,
    };
  } catch (error) {
    console.error('[requireAdminApi] Error:', error);
    return {
      ok: false,
      status: 401,
      message: error instanceof Error ? error.message : "Unknown error",
      user: null,
      profile: null,
    };
  }
}

/**
 * Require Admin Server Result
 * Return type for requireAdminServer helper
 */
export type RequireAdminServerResult =
  | {
      ok: true;
      status: 200;
      user: User;
      profile: AdminProfile;
    }
  | {
      ok: false;
      status: 401 | 403;
      reason: "unauthenticated" | "forbidden";
      user?: User | null;
      profile?: AdminProfile | null;
    };

/**
 * Require Admin Server
 * 
 * Server-side helper for admin authentication in API routes.
 * Uses createServerClient from @supabase/ssr which automatically reads from cookies.
 * 
 * This function:
 * 1. Gets the current user via supabase.auth.getUser() (reads from cookies automatically)
 * 2. Fetches the user's profile from the profiles table
 * 3. Checks admin status using the same logic as the client-side checkIsAdminClient()
 * 
 * Admin check logic (matching lib/admin-client.ts checkIsAdminClient):
 * - role === "admin" OR
 * - segment === "admin" OR
 * - tier === "enterprise" OR
 * - membership_tier === "enterprise" OR
 * - email === "admin@offaxisdeals.com"
 * 
 * @returns RequireAdminServerResult with either ok: true and user/profile, or ok: false with error details
 */
export async function requireAdminServer(): Promise<RequireAdminServerResult> {
  try {
    // Use the standard Supabase SSR client that reads from cookies
    const { createServerClient } = await import('@/supabase/server');
    const supabase = await createServerClient();

    // Get current user (reads from cookies automatically via @supabase/ssr)
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('[requireAdminServer] No user found', {
        error: userError?.message,
        errorCode: userError?.status,
      });
      return {
        ok: false,
        status: 401,
        reason: "unauthenticated",
        user: null,
        profile: null,
      };
    }

    // Fetch profile with same fields as client-side check
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,email,role,segment,tier,membership_tier')
      .eq('id', user.id)
      .single<AdminProfile>();

    if (profileError || !profile) {
      console.log('[requireAdminServer] Profile not found', {
        error: profileError?.message,
        userId: user.id,
      });
      return {
        ok: false,
        status: 401,
        reason: "unauthenticated",
        user,
        profile: null,
      };
    }

    // Use the same admin check logic as client-side (lib/admin-client.ts checkIsAdminClient)
    const adminCheck = isAdmin(profile);

    console.log('[requireAdminServer] Admin check result', {
      userId: user.id,
      email: user.email,
      profileRole: profile.role,
      profileSegment: profile.segment,
      profileTier: profile.tier,
      profileMembershipTier: profile.membership_tier,
      isAdmin: adminCheck,
    });

    if (!adminCheck) {
      return {
        ok: false,
        status: 403,
        reason: "forbidden",
        user,
        profile,
      };
    }

    return {
      ok: true,
      status: 200,
      user,
      profile,
    };
  } catch (error) {
    console.error('[requireAdminServer] Error:', error);
    return {
      ok: false,
      status: 401,
      reason: "unauthenticated",
      user: null,
      profile: null,
    };
  }
}
