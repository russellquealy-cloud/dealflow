import { cookies } from 'next/headers';
import { createServerClient as createSupabaseSSRClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// Module-level flag to log config only once
let configLogged = false;

/**
 * Server-side Supabase client for API routes
 * Uses @supabase/ssr which properly handles Next.js 15 async cookies
 * 
 * IMPORTANT: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY MUST match
 * the values used in the browser client (app/supabase/client.ts) for cookie-based
 * authentication to work correctly.
 */
export async function createServerClient() {
  const cookieStore = await cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Log server config for debugging (only first call to avoid spam)
  if (!configLogged) {
    console.log('[supabase-server] server config', {
      url: supabaseUrl,
      keyPrefix: supabaseAnonKey ? supabaseAnonKey.slice(0, 20) + '...' : null,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      // Also check for old env var names that might conflict
      hasOldSupabaseUrl: !!process.env.SUPABASE_URL,
      hasOldSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
    });
    configLogged = true;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }

  return createSupabaseSSRClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        try {
          // Ensure cookies are available to all paths (including /api/billing/*)
          cookieStore.set({ 
            name, 
            value, 
            ...options,
            path: '/', // Critical: ensures cookies are available to all routes
          });
        } catch (error) {
          // Handle cookie setting in route handlers
          console.error('Error setting cookie:', error);
        }
      },
      remove(name: string, options) {
        try {
          // Ensure cookie removal works for all paths
          cookieStore.set({ 
            name, 
            value: '', 
            ...options,
            path: '/', // Critical: ensures cookies can be removed from all routes
          });
        } catch (error) {
          // Handle cookie removal in route handlers
          console.error('Error removing cookie:', error);
        }
      },
    },
  });
}
