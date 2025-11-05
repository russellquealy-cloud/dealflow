'use client';
import { createBrowserClient } from '@supabase/ssr';
import { logger } from '@/lib/logger';

// Debug environment variables
logger.log('🔍 Environment variables check:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing',
  googleMaps: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'present' : 'missing'
});

// Singleton pattern to prevent multiple client instances
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

// Token refresh debouncing
let refreshInProgress = false;
let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL = 60000; // 60 seconds minimum between refreshes

export const supabase = (() => {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lwhxmwvvostzlidmnays.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3aHhtd3Z2b3N0emxpZG1uYXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTg2NDYsImV4cCI6MjA3NDM5NDY0Nn0.YeXIZyYKuxVictEKcWe9GRsgMlVoFQJAPawdsIy8ye8',
      {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: false, // CRITICAL: Prevent URL-based session detection
          persistSession: true,
          flowType: 'pkce',
          storageKey: 'dealflow-auth-token', // Prevent conflicts
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
        cookies: {
          get(name: string) {
            if (typeof document === 'undefined') return undefined;
            
            const value = document.cookie
              .split('; ')
              .find(row => row.startsWith(`${name}=`))
              ?.split('=')[1];
            
            return value;
          },
          set(name: string, value: string, options: Record<string, unknown> = {}) {
            if (typeof document === 'undefined') return;
            
            try {
              const hostname = window.location.hostname;
              const cookieOptions: Record<string, unknown> = {
                path: '/',
                secure: window.location.protocol === 'https:',
                sameSite: 'lax' as const,
                maxAge: 60 * 60 * 24 * 7, // 7 days
                ...options
              };
              
              let cookieString = `${name}=${value}`;
              
              if (cookieOptions.maxAge) {
                const expires = new Date(Date.now() + (cookieOptions.maxAge as number) * 1000);
                cookieString += `; expires=${expires.toUTCString()}`;
              }
              
              if (cookieOptions.path) cookieString += `; path=${cookieOptions.path}`;
              if (cookieOptions.secure) cookieString += `; secure`;
              if (cookieOptions.sameSite) cookieString += `; sameSite=${cookieOptions.sameSite}`;
              
              document.cookie = cookieString;
            } catch (error) {
              // Silent fail on cookie setting errors
            }
          },
          remove(name: string) {
            if (typeof document === 'undefined') return;
            try {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            } catch (error) {
              // Silent fail on cookie removal errors
            }
          }
        }
      }
    );

    // Wrap getSession to add debouncing
    const originalGetSession = supabaseClient.auth.getSession.bind(supabaseClient.auth);
    supabaseClient.auth.getSession = async () => {
      const now = Date.now();
      if (refreshInProgress || (now - lastRefreshTime < MIN_REFRESH_INTERVAL)) {
        // Return cached session if refresh is in progress or too soon
        return originalGetSession();
      }
      refreshInProgress = true;
      lastRefreshTime = now;
      try {
        return await originalGetSession();
      } finally {
        refreshInProgress = false;
      }
    };

    // Handle auth state changes to prevent excessive refreshes
    supabaseClient.auth.onAuthStateChange((event, session) => {
      // Only log significant events, not every token refresh
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        logger.log(`🔐 Auth state changed: ${event}`);
      }
    });
  }
  
  return supabaseClient;
})();
