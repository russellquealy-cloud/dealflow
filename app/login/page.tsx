'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';


export const dynamic = 'force-dynamic';

function LoginInner() {
  const params = useSearchParams();
  const next = (params ? params.get('next') : null) ?? '/';

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) setMessage(error.message);
      else setMessage('Check your email for the sign-in link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 16, maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 12px' }}>Sign in</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 13, color: '#374151' }}>Email</label>
        <input
          type="email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          style={{ height: 40, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 10px' }}
        />
        <button
          disabled={loading}
          style={{ height: 40, borderRadius: 8, border: '1px solid #0ea5e9', background: '#0ea5e9', color: '#fff' }}
        >
          {loading ? 'Sending…' : 'Send magic link'}
        </button>
        {message && <p style={{ fontSize: 13, color: '#374151' }}>{message}</p>}
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
