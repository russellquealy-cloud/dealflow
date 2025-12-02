import { getSupabaseRouteClient } from "../app/lib/supabaseRoute";
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
    // Log cookie names BEFORE creating Supabase client
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieList = cookieStore.getAll().map((c) => c.name);
    
    // Get cookie values for Supabase auth cookies (for debugging)
    const supabaseCookies = cookieList
      .filter(name => name.includes('sb-') || name.includes('supabase') || name.includes('auth-token'))
      .map(name => ({
        name,
        hasValue: !!cookieStore.get(name)?.value,
        valueLength: cookieStore.get(name)?.value?.length ?? 0,
      }));
    
    console.log('[adminAuth] cookies seen in route handler:', cookieList);
    console.log('[adminAuth] supabase cookies detail:', supabaseCookies);
    
    // Log server Supabase config to compare with client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log('[adminAuth] server Supabase config', {
      url: supabaseUrl,
      keyPrefix: supabaseAnonKey ? supabaseAnonKey.slice(0, 20) + '...' : null,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      // Check for mismatched env vars
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
    });

    const supabase = await getSupabaseRouteClient();

    // Try getUser() first (preferred for Next.js 15)
    let { data: { user }, error: userError } = await supabase.auth.getUser();

    // If getUser() fails, try getSession() as fallback (for RSC prefetch scenarios)
    let session: { user: { id: string; email?: string | null }; access_token?: string } | null = null;
    if (userError || !user) {
      console.log('[adminAuth] getUser() failed, trying getSession()', {
        userError: userError?.message,
        errorCode: userError?.status,
        hasUser: !!user,
      });
      
      const { data: { session: sessionData }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('[adminAuth] getSession() result', {
        hasSession: !!sessionData,
        sessionError: sessionError?.message,
        sessionErrorCode: sessionError?.status,
        // Check what cookies Supabase client can see
        sessionUser: sessionData?.user?.id ? 'present' : 'missing',
      });
      
      if (sessionData && !sessionError) {
        console.log('[adminAuth] got session from getSession()', {
          userId: sessionData.user.id,
          email: sessionData.user.email,
          accessTokenPresent: !!sessionData.access_token,
        });
        session = {
          user: sessionData.user,
          access_token: sessionData.access_token,
        };
        user = sessionData.user;
        userError = null;
      } else {
        console.log('[adminAuth] getSession() also failed - no valid session', {
          sessionError: sessionError?.message,
          sessionErrorCode: sessionError?.status,
          hasSession: !!sessionData,
        });
      }
    } else {
      // If getUser() succeeded, construct session-like object
      console.log('[adminAuth] got user from getUser()', {
        userId: user.id,
        email: user.email,
      });
      session = {
        user: user,
        access_token: undefined, // getUser doesn't return token
      };
    }

    if (userError || !user || !session) {
      console.log('[adminAuth] no session from supabase.auth.getSession()', {
        error: userError?.message,
        hasSession: !!session,
      });
      return {
        status: 401,
        session: null,
        profile: null,
        isAdmin: false,
        error: userError?.message ?? "Auth session missing!",
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

    console.log('[adminAuth] got session and profile', {
      userId: session.user.id,
      email: session.user.email,
      profileRole: profile.role,
      profileSegment: profile.segment,
      isAdmin: adminCheck,
    });

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

