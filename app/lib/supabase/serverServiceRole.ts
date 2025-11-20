import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase service role configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

/**
 * Create a Supabase client with service role key (bypasses RLS)
 * 
 * WARNING: Only use this for backend operations where RLS should be bypassed.
 * Examples: Admin operations, system queries, watchlist listings (user already has access via watchlist).
 * 
 * DO NOT use this for user-facing queries that should respect RLS.
 */
export function createSupabaseServerServiceRole() {
  // TypeScript now knows these are strings after the check above
  return createClient(supabaseUrl as string, serviceRoleKey as string, {
    auth: {
      persistSession: false,
    },
  });
}
