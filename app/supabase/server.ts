import { cookies } from 'next/headers';
import { createServerClient as createSupabaseSSRClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Server-side Supabase client for API routes
 * Uses @supabase/ssr which properly handles Next.js 15 async cookies
 */
export async function createServerClient() {
  const cookieStore = await cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Handle cookie setting in route handlers
          console.error('Error setting cookie:', error);
        }
      },
      remove(name: string, options) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Handle cookie removal in route handlers
          console.error('Error removing cookie:', error);
        }
      },
    },
  });
}
