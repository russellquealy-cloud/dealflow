'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

function SignupInner() {
  const params = useSearchParams();
  const next = (params ? params.get('next') : null) ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
        }
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Check your email to confirm your account, then you can sign in.');
      }
    } catch (err) {
      setMessage('An unexpected error occurred. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 16, maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 12px' }}>Sign up</h1>
      
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 13, color: '#374151' }}>Email</label>
        <input
          type="email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={{ height: 40, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 10px' }}
        />
        
        <label style={{ fontSize: 13, color: '#374151' }}>Password</label>
        <input
          type="password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
          style={{ height: 40, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 10px' }}
        />
        
        <label style={{ fontSize: 13, color: '#374151' }}>Confirm Password</label>
        <input
          type="password"
          value={confirmPassword}
          required
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ height: 40, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 10px' }}
        />
        
        <button
          disabled={loading}
          style={{ height: 40, borderRadius: 8, border: '1px solid #0ea5e9', background: '#0ea5e9', color: '#fff' }}
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
        
        {message && (
          <p style={{ 
            fontSize: 13, 
            color: message.includes('error') || message.includes('Error') ? '#dc2626' : '#374151' 
          }}>
            {message}
          </p>
        )}
        
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, textAlign: 'center' }}>
          Already have an account? <a href="/login" style={{ color: '#0ea5e9' }}>Sign in</a>
        </p>
      </form>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<main style={{ padding: 16 }}>Loading…</main>}>
      <SignupInner />
    </Suspense>
  );
}
