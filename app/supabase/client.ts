'use client';
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined;
        
        const value = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${name}=`))
          ?.split('=')[1];
        
        console.log(`🍪 Mobile cookie get: ${name} = ${value ? 'exists' : 'missing'}`);
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
          console.log(`🍪 Mobile cookie set: ${name}`, cookieOptions);
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
          console.log(`🍪 Mobile cookie removed: ${name}`);
        } catch (error) {
          console.error('Error removing mobile cookie:', error);
        }
      }
    }
  }
);
