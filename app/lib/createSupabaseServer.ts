/**
 * Server-side Supabase client creator
 * Use this in API routes and server actions only
 * 
 * @returns Supabase client configured for server-side usage
 */
import { getSupabaseServer } from "@/lib/auth/server";

export async function createSupabaseServer() {
  return getSupabaseServer();
}

