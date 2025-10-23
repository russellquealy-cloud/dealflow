'use client';
import { createClient } from '@supabase/supabase-js';

export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { 
    auth: { 
      persistSession: true, 
      autoRefreshToken: false, // CRITICAL: Disable auto-refresh to prevent rate limiting
      detectSessionInUrl: false // CRITICAL: Prevent URL-based session detection
    } 
  }
);
