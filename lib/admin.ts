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
 * Uses the same Supabase SSR client (getSupabaseRouteClient) that reads from
 * dealflow-auth-token cookie, matching the browser client.
 * 
 * This ensures route handlers see the same session as the client-side admin checks.
 * 
 * @returns RequireAdminApiResult with either ok: true and user/profile/supabase, or ok: false with error details
 */
export async function requireAdminApi(): Promise<RequireAdminApiResult> {
  try {
    // Use the centralized route client that reads from dealflow-auth-token
    const supabase = await getSupabaseRouteClient();

    // Try getUser() first (preferred for Next.js 15)
    let {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // If getUser() fails, try getSession() as fallback
    if (userError || !user) {
      console.log('[requireAdminApi] getUser() failed, trying getSession()', {
        userError: userError?.message,
        errorCode: userError?.status,
      });
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
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
 * Legacy requireAdminServer - now uses the same route client
 * Kept for backward compatibility but wraps requireAdminApi internally
 */
export async function requireAdminServer(request?: { headers: Headers }) {
  const result = await requireAdminApi();
  
  if (!result.ok) {
    return {
      ok: false as const,
      status: result.status as 401 | 403,
      reason: result.status === 401 ? "no-user" : "not-admin",
      user: result.user ?? null,
      profile: result.profile ?? null,
    };
  }

  return {
    ok: true as const,
    status: 200 as const,
    reason: "ok" as const,
    user: result.user,
    profile: result.profile,
  };
}
