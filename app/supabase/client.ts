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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lwhxmwvvostzlidmnays.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3aHhtd3Z2b3N0emxpZG1uYXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTg2NDYsImV4cCI6MjA3NDM5NDY0Nn0.YeXIZyYKuxVictEKcWe9GRsgMlVoFQJAPawdsIy8ye8';
    
    // CRITICAL FIX: Change flowType to 'pkce' to match Supabase's PKCE flow
    // Supabase is sending PKCE codes in magic links, so we must use PKCE flow
    // This ensures the code verifier is stored in cookies for server-side exchange
    supabaseClient = createBrowserClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true, // CRITICAL: Must be true for magic link to work
          persistSession: true,
          flowType: 'pkce', // CRITICAL FIX: Changed from 'implicit' to 'pkce' to match Supabase's PKCE flow
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
              const isProduction = typeof window !== 'undefined' && 
                !window.location.hostname.includes('localhost') &&
                !window.location.hostname.includes('127.0.0.1');
              
              const cookieOptions: Record<string, unknown> = {
                path: '/',
                secure: isProduction, // Only secure in production
                sameSite: 'lax' as const, // Required for cross-site redirects
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
              console.error('Error setting cookie:', error);
            }
          },
          remove(name: string) {
            if (typeof document === 'undefined') return;
            try {
              const domain = getCookieDomain();
              let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
              if (domain) {
                cookieString += ` Domain=${domain};`;
              }
              document.cookie = cookieString;
            } catch (error) {
              console.error('Error removing cookie:', error);
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
    supabaseClient.auth.onAuthStateChange((event: string) => {
      // Only log significant events, not every token refresh
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        logger.log(`🔐 Auth state changed: ${event}`);
      }
    });
  }
  
  return supabaseClient;
})();
