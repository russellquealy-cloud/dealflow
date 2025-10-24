'use client';
import { createBrowserClient } from '@supabase/ssr';

// Debug environment variables
console.log('🔍 Environment variables check:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing',
  googleMaps: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'present' : 'missing'
});

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lwhxmwvvostzlidmnays.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3aHhtd3Z2b3N0emxpZG1uYXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTg2NDYsImV4cCI6MjA3NDM5NDY0Nn0.YeXIZyYKuxVictEKcWe9GRsgMlVoFQJAPawdsIy8ye8',
  {
    auth: {
      autoRefreshToken: false, // CRITICAL: Disable auto-refresh to prevent rate limiting
      detectSessionInUrl: false // CRITICAL: Prevent URL-based session detection
    },
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined;
        
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${name}=`))
          ?.split('=')[1];
        
        // CRITICAL: Reduce logging to prevent console spam
        // Removed excessive auth cookie logging
        return value;
      },
      set(name: string, value: string, options: Record<string, unknown> = {}) {
        if (typeof document === 'undefined') return;
        
        try {
          // Enhanced cookie options for mobile compatibility
          const cookieOptions = {
            path: '/',
            domain: window.location.hostname,
            secure: window.location.protocol === 'https:',
            sameSite: 'lax' as const,
            maxAge: 60 * 60 * 24 * 7, // 7 days
            ...options
          };
          
          // Handle mobile-specific cookie setting
          let cookieString = `${name}=${value}`;
          
          if (cookieOptions.maxAge) {
            const expires = new Date(Date.now() + cookieOptions.maxAge * 1000);
            cookieString += `; expires=${expires.toUTCString()}`;
          }
          
          if (cookieOptions.path) cookieString += `; path=${cookieOptions.path}`;
          if (cookieOptions.domain) cookieString += `; domain=${cookieOptions.domain}`;
          if (cookieOptions.secure) cookieString += `; secure`;
          if (cookieOptions.sameSite) cookieString += `; samesite=${cookieOptions.sameSite}`;
          
          document.cookie = cookieString;
          // CRITICAL: Reduce logging to prevent console spam
          // Removed excessive auth cookie logging
        } catch (error) {
          console.error('Error setting mobile cookie:', error);
        }
      },
      remove(name: string, options: Record<string, unknown> = {}) {
        if (typeof document === 'undefined') return;
        
        try {
          const cookieOptions = {
            path: '/',
            domain: window.location.hostname,
            ...options
          };
          
          let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
          if (cookieOptions.path) cookieString += `; path=${cookieOptions.path}`;
          if (cookieOptions.domain) cookieString += `; domain=${cookieOptions.domain}`;
          
          document.cookie = cookieString;
          // CRITICAL: Reduce logging to prevent console spam
          // Removed excessive auth cookie logging
        } catch (error) {
          console.error('Error removing mobile cookie:', error);
        }
      }
    }
  }
);
