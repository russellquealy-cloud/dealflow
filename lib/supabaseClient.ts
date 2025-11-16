/**
 * Browser-side Supabase client
 * Use this in client components only ('use client')
 * 
 * Singleton pattern to prevent multiple instances
 */
'use client';

import { createBrowserClient } from '@supabase/ssr';

// Singleton pattern to prevent multiple client instances
let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

// Token refresh debouncing
let refreshInProgress = false;
let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL = 60000; // 60 seconds minimum between refreshes

export const supabaseClient = (() => {
  if (!clientInstance) {
    clientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
          flowType: 'implicit',
          storageKey: 'dealflow-auth-token',
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
            } catch {
              // Silent fail on cookie setting errors
            }
          },
          remove(name: string) {
            if (typeof document === 'undefined') return;
            try {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            } catch {
              // Silent fail on cookie removal errors
            }
          }
        }
      }
    );

    // Wrap getSession to add debouncing
    const originalGetSession = clientInstance.auth.getSession.bind(clientInstance.auth);
    clientInstance.auth.getSession = async () => {
      const now = Date.now();
      if (refreshInProgress || (now - lastRefreshTime < MIN_REFRESH_INTERVAL)) {
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
  }
  
  return clientInstance;
})();

