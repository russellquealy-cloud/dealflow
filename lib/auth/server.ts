import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseRouteClient } from "../../app/lib/supabaseRoute";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { AuthError } from "@supabase/supabase-js";

/**
 * Server-side auth utilities
 * 
 * All functions use the PKCE-aware Supabase client (getSupabaseRouteClient)
 * which correctly reads dealflow-auth-token cookies matching the browser client.
 */

export async function createSupabaseRouteClient(): Promise<SupabaseClient<Database>> {
  // Use the PKCE-aware route client for consistency
  return await getSupabaseRouteClient();
}

// Alias for backward compatibility (some files may still import this)
export const createSupabaseServerComponent = createSupabaseRouteClient;

/**
 * Get the authenticated user from server-side session
 * 
 * Uses PKCE-aware client that reads dealflow-auth-token cookies.
 * Includes getSession() fallback if getUser() fails.
 * 
 * @returns { user: User | null, error: AuthError | null, supabase: SupabaseClient }
 */
export async function getAuthUserServer(): Promise<{
  user: User | null;
  error: AuthError | null;
  supabase: SupabaseClient<Database>;
}> {
  const supabase = await getSupabaseRouteClient();
  
  // Enhanced logging for debugging
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const dealflowToken = cookieStore.get('dealflow-auth-token');
  
  // Try getUser first (standard approach)
  let { data: { user }, error: userError } = await supabase.auth.getUser();
  
  console.log('[getAuthUserServer] getUser result', {
    hasUser: !!user,
    userEmail: user?.email,
    error: userError?.message,
    errorCode: userError?.status,
    hasDealflowCookie: !!dealflowToken,
  });
  
  // Fallback to getSession if getUser fails (helps with some edge cases)
  if (userError || !user) {
    console.log('[getAuthUserServer] Trying getSession fallback...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('[getAuthUserServer] getSession result', {
      hasSession: !!session,
      sessionUser: session?.user?.email,
      sessionError: sessionError?.message,
    });
    
    if (session && !sessionError) {
      user = session.user;
      userError = null;
      console.log('[getAuthUserServer] Using session user from getSession fallback');
    }
  }

  if (userError || !user) {
    // Log detailed cookie info for debugging
    console.log('[getAuthUserServer] No user found', {
      userError: userError?.message,
      cookieNames: cookieStore.getAll().map(c => c.name),
      hasDealflowCookie: !!dealflowToken,
      dealflowTokenPreview: dealflowToken?.value?.substring(0, 100),
    });
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
export async function requireAuthServer(currentPath: string = '/'): Promise<{
  user: User;
  supabase: SupabaseClient<Database>;
}> {
  // Prevent redirect loops - don't redirect if we're already on login
  // This case should rarely happen in practice, but we handle it to prevent loops
  if (currentPath.startsWith('/login')) {
    const supabase = await getSupabaseRouteClient();
    // This should not happen in normal flow, but TypeScript needs a return value
    throw new Error('Cannot require auth on login page - this indicates a redirect loop');
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

  // TypeScript knows user is non-null here because of the redirect above
  return { user, supabase };
}
