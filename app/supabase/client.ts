'use client';
import { createBrowserClient } from '@supabase/ssr';
import { logger } from '@/lib/logger';
import type { Session } from '@supabase/supabase-js';

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

const getCookieDomain = () => {
  const envDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
  if (envDomain) return envDomain;

  if (typeof window === 'undefined') return undefined;

  const hostname = window.location.hostname;

  // Skip localhost or IP addresses
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
  ) {
    return undefined;
  }

  const parts = hostname.split('.');
  if (parts.length <= 2) {
    return `.${hostname}`;
  }

  const baseDomain = parts.slice(-2).join('.');
  return `.${baseDomain}`;
};

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
              const domain = options.domain ?? getCookieDomain();
              const cookieOptions: Record<string, unknown> = {
                path: '/',
                secure: window.location.protocol === 'https:',
                sameSite: 'lax' as const,
                maxAge: 60 * 60 * 24 * 7, // 7 days
                ...(domain ? { domain } : {}),
                ...options
              };
              
              let cookieString = `${name}=${value}`;
              
              if (cookieOptions.maxAge) {
                const expires = new Date(Date.now() + (cookieOptions.maxAge as number) * 1000);
                cookieString += `; expires=${expires.toUTCString()}`;
              }
              
              if (cookieOptions.path) cookieString += `; path=${cookieOptions.path}`;
              if (cookieOptions.secure) cookieString += `; Secure`;
              if (cookieOptions.sameSite) cookieString += `; SameSite=${cookieOptions.sameSite}`;
              if (cookieOptions.domain) cookieString += `; Domain=${cookieOptions.domain}`;
              
              document.cookie = cookieString;
            } catch (error) {
              // Silent fail on cookie setting errors
            }
          },
          remove(name: string) {
            if (typeof document === 'undefined') return;
            try {
              const domain = getCookieDomain();
              let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
              if (domain) {
                cookieString += `; Domain=${domain}`;
              }
              document.cookie = cookieString;
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
    supabaseClient.auth.onAuthStateChange((event: string, session: Session | null) => {
      // Only log significant events, not every token refresh
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        logger.log(`🔐 Auth state changed: ${event}`);
      }
    });
  }
  
  return supabaseClient;
})();
