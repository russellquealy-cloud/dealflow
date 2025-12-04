import { cookies } from 'next/headers';
import { createServerClient as createSupabaseSSRClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// Module-level flag to log config only once
let configLogged = false;

/**
 * Centralized route-handler Supabase client
 * 
 * IMPORTANT: This uses @supabase/ssr which reads from dealflow-auth-token cookie,
 * matching the browser client configuration (app/supabase/client.ts).
 * 
 * The client uses storageKey: 'dealflow-auth-token' and @supabase/ssr automatically
 * reads/writes cookies with that storage key. This ensures route handlers see the
 * same session as the browser.
 * 
 * Do NOT use @supabase/auth-helpers-nextjs here - it expects old cookie names
 * (sb-access-token, sb-refresh-token) which are now empty.
 */
export async function getSupabaseRouteClient() {
  const cookieStore = await cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Log config on first call only (to avoid log spam)
  if (!configLogged) {
    // Check what cookies are available
    const allCookies = cookieStore.getAll().map(c => c.name);
    const hasDealflowToken = cookieStore.get('dealflow-auth-token')?.value;
    
    console.log('[supabaseRoute] creating route client', {
      url: supabaseUrl,
      keyPrefix: supabaseAnonKey ? supabaseAnonKey.slice(0, 20) + '...' : null,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      cookieNames: allCookies,
      hasDealflowAuthToken: !!hasDealflowToken,
      dealflowTokenLength: hasDealflowToken?.length ?? 0,
      // Check for old env vars that might conflict
      hasOldSupabaseUrl: !!process.env.SUPABASE_URL,
      hasOldSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    });
    configLogged = true;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables. ' +
      'These MUST match the values used in the browser client.'
    );
  }

  // Use @supabase/ssr's createServerClient which automatically handles PKCE cookies
  // The cookie adapter we provide tells it how to read/write from Next.js cookie store
  // @supabase/ssr automatically reads cookies based on the Supabase project reference
  // For PKCE flow, cookies are named like: sb-<project-ref>-auth-token
  // 
  // CRITICAL: The auth config must match the browser client:
  // - Browser uses: flowType: 'pkce', storageKey: 'dealflow-auth-token'
  // - Server must use flowType: 'pkce' and @supabase/ssr will automatically read the right cookies
  // - storageKey is only used by browser client; server reads cookies based on project ref
  return createSupabaseSSRClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Match browser client config for PKCE flow
      flowType: 'pkce',
      // Note: storageKey is only for browser client. Server reads cookies automatically.
    },
    cookies: {
      get(name: string) {
        const value = cookieStore.get(name)?.value;
        // Log cookie reads for ALL auth-related cookies (Supabase PKCE uses sb-<project-ref>-auth-token)
        if (name.includes('auth') || name.includes('supabase') || name.includes('dealflow') || name.startsWith('sb-')) {
          console.log(`[supabaseRoute] reading cookie ${name}:`, {
            hasValue: !!value,
            valueLength: value?.length ?? 0,
            valuePreview: value ? value.substring(0, 50) + '...' : null,
          });
        }
        return value;
      },
      set(name: string, value: string, options) {
        try {
          cookieStore.set({ name, value, ...options });
          // Log cookie sets for dealflow-auth-token
          if (name.includes('dealflow') || name.includes('auth-token')) {
            console.log(`[supabaseRoute] setting cookie ${name}:`, {
              hasValue: !!value,
              valueLength: value?.length ?? 0,
            });
          }
        } catch (error) {
          // Handle cookie setting in route handlers
          console.error('[supabaseRoute] Error setting cookie:', error);
        }
      },
      remove(name: string, options) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Handle cookie removal in route handlers
          console.error('[supabaseRoute] Error removing cookie:', error);
        }
      },
    },
  });
}

