import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseRouteClient } from "../../app/lib/supabaseRoute";
import type { Database } from "@/types/supabase";

/**
 * Server-side auth utilities
 * 
 * All functions use the PKCE-aware Supabase client (getSupabaseRouteClient)
 * which correctly reads dealflow-auth-token cookies matching the browser client.
 */

export async function createSupabaseRouteClient() {
  // Use the PKCE-aware route client for consistency
  return await getSupabaseRouteClient();
}

/**
 * Get the authenticated user from server-side session
 * 
 * Uses PKCE-aware client that reads dealflow-auth-token cookies.
 * Includes getSession() fallback if getUser() fails.
 * 
 * @returns { user: User | null, error: AuthError | null, supabase: SupabaseClient }
 */
export async function getAuthUserServer() {
  const supabase = await getSupabaseRouteClient();
  
  // Try getUser first (standard approach)
  let { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // Fallback to getSession if getUser fails (helps with some edge cases)
  if (userError || !user) {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (session && !sessionError) {
      user = session.user;
      userError = null;
    }
  }

  if (userError || !user) {
    return { user: null, error: userError, supabase };
  }

  return { user, error: null, supabase };
}

/**
 * Require authentication - redirects to login if not authenticated
 * 
 * Use this in server components and route handlers that need auth.
 * Automatically preserves the current URL in the 'next' parameter.
 * 
 * @param currentPath - Current request path (use request.nextUrl.pathname in route handlers, or pathname from usePathname() in server components)
 * @returns { user, supabase } - Never returns null user (redirects instead)
 * 
 * Redirect rules:
 * - If no session: redirect to /login?next=<currentPath>
 * - Never redirects if already on /login (prevents loops)
 */
export async function requireAuthServer(currentPath: string = '/') {
  // Prevent redirect loops - don't redirect if we're already on login
  if (currentPath.startsWith('/login')) {
    return { user: null, error: new Error('Already on login page'), supabase: await getSupabaseRouteClient() };
  }

  const { user, error, supabase } = await getAuthUserServer();
  
  if (!user || error) {
    console.log('[requireAuthServer] No auth, redirecting to login', {
      currentPath,
      hasUser: !!user,
      error: error?.message,
    });
    // Preserve query params if they exist
    const searchParams = currentPath.includes('?') 
      ? currentPath.substring(currentPath.indexOf('?'))
      : '';
    redirect(`/login?next=${encodeURIComponent(currentPath + searchParams)}`);
  }

  return { user, supabase };
}
