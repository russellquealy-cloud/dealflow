import { cookies } from 'next/headers';
import { createServerClient as createSupabaseSSRClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// Module-level flag to log config only once
let configLogged = false;

/**
 * Centralized route-handler Supabase client
 * 
 * IMPORTANT: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY MUST match
 * the values used in the browser client (app/supabase/client.ts) for cookie-based
 * authentication to work correctly.
 * 
 * This ensures all route handlers use the same configuration.
 */
export async function getSupabaseRouteClient() {
  const cookieStore = await cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Log config on first call only (to avoid log spam)
  if (!configLogged) {
    console.log('[supabaseRoute] creating route client', {
      url: supabaseUrl,
      keyPrefix: supabaseAnonKey ? supabaseAnonKey.slice(0, 20) + '...' : null,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
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

  return createSupabaseSSRClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        try {
          cookieStore.set({ name, value, ...options });
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

