'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/supabase/client';
import { Session } from '@supabase/supabase-js';

export default function DebugAuthPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [cookies, setCookies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔐 Debug Auth - Session:', session);
        console.log('🔐 Debug Auth - Error:', error);
        
        setSession(session);
        
        // Check cookies
        const allCookies = document.cookie.split(';');
        const supabaseCookies = allCookies.filter(c => c.includes('supabase'));
        console.log('🍪 Debug Auth - All cookies:', allCookies);
        console.log('🍪 Debug Auth - Supabase cookies:', supabaseCookies);
        
        setCookies(supabaseCookies);
        
      } catch (err) {
        console.error('Debug Auth Error:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const testSignIn = async () => {
    try {
      console.log('🧪 Testing sign in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'russell.quealy@gmail.com',
        password: 'test123' // You'll need to enter your actual password
      });
      console.log('🧪 Sign in result:', data, error);
    } catch (err) {
      console.error('🧪 Sign in error:', err);
    }
  };

  const testMagicLink = async () => {
    try {
      console.log('🧪 Testing magic link...');
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const redirectTo = `${siteUrl}/login`;
      const { data, error } = await supabase.auth.signInWithOtp({
        email: 'russell.quealy@gmail.com',
        options: {
          emailRedirectTo: redirectTo
        }
      });
      console.log('🧪 Magic link result:', { data, error, redirectTo });
    } catch (err) {
      console.error('🧪 Magic link error:', err);
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading auth debug info...</div>;
  }

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>Authentication Debug</h1>
      
      <div style={{ marginBottom: 20, padding: 15, border: '1px solid #ccc', borderRadius: 8 }}>
        <h2>Current Session</h2>
        <pre style={{ background: '#f5f5f5', padding: 10, borderRadius: 4, overflow: 'auto' }}>
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: 20, padding: 15, border: '1px solid #ccc', borderRadius: 8 }}>
        <h2>Supabase Cookies</h2>
        <p>Found {cookies.length} Supabase cookies:</p>
        {cookies.length > 0 ? (
          <ul>
            {cookies.map((cookie, index) => (
              <li key={index} style={{ fontFamily: 'monospace', fontSize: 12 }}>
                {cookie}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'red' }}>No Supabase cookies found!</p>
        )}
      </div>

      <div style={{ marginBottom: 20, padding: 15, border: '1px solid #ccc', borderRadius: 8 }}>
        <h2>Test Authentication</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            onClick={testSignIn}
            style={{ padding: '8px 16px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 4 }}
          >
            Test Sign In
          </button>
          <button 
            onClick={testMagicLink}
            style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 4 }}
          >
            Test Magic Link
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 20, padding: 15, border: '1px solid #ccc', borderRadius: 8 }}>
        <h2>Environment Variables</h2>
        <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</p>
        <p>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
      </div>
    </main>
  );
}
