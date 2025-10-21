'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/supabase/client';


export const dynamic = 'force-dynamic';

function LoginInner() {
  const params = useSearchParams();
  const next = (params ? params.get('next') : null) ?? '/';
  const error = params ? params.get('error') : null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(error);
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic-link'>('password');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      if (loginMethod === 'password') {
        // Password login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
        } else {
          // Successful login, redirect to intended page
          window.location.href = next;
        }
      } else {
        // Magic link login
        const origin = window.location.origin;
        const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        });

        if (error) setMessage(error.message);
        else setMessage('Check your email for the sign-in link.');
      }
    } catch (err) {
      setMessage('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 16, maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 12px' }}>Sign in</h1>
      
      {/* Login Method Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setLoginMethod('password')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            background: loginMethod === 'password' ? '#0ea5e9' : '#fff',
            color: loginMethod === 'password' ? '#fff' : '#374151',
            cursor: 'pointer'
          }}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod('magic-link')}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            background: loginMethod === 'magic-link' ? '#0ea5e9' : '#fff',
            color: loginMethod === 'magic-link' ? '#fff' : '#374151',
            cursor: 'pointer'
          }}
        >
          Magic Link
        </button>
      </div>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 13, color: '#374151' }}>Email</label>
        <input
          type="email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={{ height: 40, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 10px' }}
        />
        
        {loginMethod === 'password' && (
          <>
            <label style={{ fontSize: 13, color: '#374151' }}>Password</label>
            <input
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              style={{ height: 40, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 10px' }}
            />
          </>
        )}
        
        <button
          disabled={loading}
          style={{ height: 40, borderRadius: 8, border: '1px solid #0ea5e9', background: '#0ea5e9', color: '#fff' }}
        >
          {loading ? 'Signing in…' : (loginMethod === 'password' ? 'Sign in' : 'Send magic link')}
        </button>
        
        {message && (
          <p style={{ 
            fontSize: 13, 
            color: message.includes('error') || message.includes('Error') ? '#dc2626' : '#374151' 
          }}>
            {message}
          </p>
        )}
        
        {loginMethod === 'password' && (
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            Don&apos;t have an account? <a href="/signup" style={{ color: '#0ea5e9' }}>Sign up</a> or use magic link above.
          </p>
        )}
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main style={{ padding: 16 }}>Loading…</main>}>
      <LoginInner />
    </Suspense>
  );
}
