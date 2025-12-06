/**
 * API route Supabase client creator
 * 
 * Creates a Supabase client that authenticates using the Authorization header
 * (Bearer token) instead of cookies. This is specifically for API routes that
 * receive explicit Authorization headers from the client.
 * 
 * This does NOT replace or change any existing cookie-based auth helpers.
 * Use this only for API routes that need to authenticate via Authorization header.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
}

/**
 * Create a Supabase client authenticated via Authorization header
 * 
 * @param authHeader - The Authorization header value (e.g., "Bearer <token>") or null
 * @returns A Supabase client configured to use the Authorization header for auth
 * 
 * If authHeader is null or empty, the client will still be created but
 * auth.getUser() will fail. The caller should handle this gracefully.
 */
export function createApiSupabaseFromAuthHeader(authHeader: string | null): SupabaseClient<Database> {
  const headers: Record<string, string> = {};
  
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers,
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

