import { createServerClient } from "@/supabase/server";
import type { AdminProfile } from "@/lib/admin";
import { isAdmin } from "@/lib/admin";

/**
 * Admin Context Type
 * Represents the result of an admin authentication check
 */
export type AdminContext =
  | {
      status: 200;
      session: { user: { id: string; email?: string | null }; access_token?: string };
      profile: AdminProfile;
      isAdmin: true;
      error: null;
    }
  | {
      status: 401 | 403;
      session: { user: { id: string; email?: string | null }; access_token?: string } | null;
      profile: AdminProfile | null;
      isAdmin: false;
      error: string;
    };

/**
 * Get Admin Context
 * 
 * Single source of truth for admin authentication in route handlers.
 * Tries multiple auth methods:
 * 1. getUser() via cookies (preferred)
 * 2. getSession() as fallback
 * 3. Authorization header (handled by route handlers if needed)
 * 
 * Returns detailed context about session, profile, and admin status.
 */
export async function getAdminContext(request?: { headers: Headers }): Promise<AdminContext> {
  try {
    const supabase = await createServerClient();

    // Try getUser() first (preferred for Next.js 15)
    let { data: { user }, error: userError } = await supabase.auth.getUser();

    // If getUser() fails, try getSession() as fallback (for RSC prefetch scenarios)
    let session: { user: { id: string; email?: string | null }; access_token?: string } | null = null;
    if (userError || !user) {
      const { data: { session: sessionData }, error: sessionError } = await supabase.auth.getSession();
      if (sessionData && !sessionError) {
        session = {
          user: sessionData.user,
          access_token: sessionData.access_token,
        };
        user = sessionData.user;
        userError = null;
      }
    } else {
      // If getUser() succeeded, construct session-like object
      session = {
        user: user,
        access_token: undefined, // getUser doesn't return token
      };
    }

    if (userError || !user || !session) {
      return {
        status: 401,
        session: null,
        profile: null,
        isAdmin: false,
        error: userError?.message ?? "No session found",
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
        status: 401,
        session,
        profile: null,
        isAdmin: false,
        error: profileError?.message ?? "Profile not found",
      };
    }

    // Check if user is admin using the shared isAdmin() helper
    const adminCheck = isAdmin(profile);

    if (!adminCheck) {
      return {
        status: 403,
        session,
        profile,
        isAdmin: false,
        error: "User is not admin",
      };
    }

    return {
      status: 200,
      session,
      profile,
      isAdmin: true,
      error: null,
    };
  } catch (error) {
    console.error('[adminAuth] Error in getAdminContext:', error);
    return {
      status: 401,
      session: null,
      profile: null,
      isAdmin: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get Pro or Admin Context
 * 
 * For routes that require Pro tier or admin access.
 * Returns context with isProOrAdmin flag.
 */
export type ProOrAdminContext =
  | {
      status: 200;
      session: { user: { id: string; email?: string | null }; access_token?: string };
      profile: AdminProfile;
      isAdmin: boolean;
      isProOrAdmin: true;
      error: null;
    }
  | {
      status: 401 | 403;
      session: { user: { id: string; email?: string | null }; access_token?: string } | null;
      profile: AdminProfile | null;
      isAdmin: boolean;
      isProOrAdmin: false;
      error: string;
    };

export async function getProOrAdminContext(request?: { headers: Headers }): Promise<ProOrAdminContext> {
  const adminCtx = await getAdminContext(request);

  // If not authenticated, return auth error
  if (adminCtx.status !== 200 || !adminCtx.profile) {
    return {
      status: adminCtx.status as 401 | 403,
      session: adminCtx.session,
      profile: adminCtx.profile,
      isAdmin: false,
      isProOrAdmin: false,
      error: adminCtx.error || 'Authentication failed',
    };
  }

  // At this point we know adminCtx.status === 200 and profile exists
  const { profile, session, isAdmin: isAdminUser } = adminCtx;

  // Check if admin (admins always have access)
  if (isAdminUser) {
    return {
      status: 200,
      session: session,
      profile: profile,
      isAdmin: true,
      isProOrAdmin: true,
      error: null,
    };
  }

  // Check if Pro tier
  const tier = profile.tier || profile.membership_tier || 'free';
  const isProTier = tier === 'pro' || tier === 'enterprise' || tier === 'basic';

  if (isProTier) {
    return {
      status: 200,
      session: session,
      profile: profile,
      isAdmin: false,
      isProOrAdmin: true,
      error: null,
    };
  }

  return {
    status: 403,
    session: session,
    profile: profile,
    isAdmin: false,
    isProOrAdmin: false,
    error: "Pro tier or admin access required",
  };
}

