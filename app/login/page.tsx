// app/login/page.tsx
/* eslint-disable @typescript-eslint/no-unused-vars */


'use client';
import React, { useState } from 'react';
import { supabase } from '@/supabase/client';
import { useSearchParams, useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const search = useSearchParams();
  const next = search.get('next') || '/';
  const router = useRouter();

  const styles: Record<string, React.CSSProperties> = {
    wrap: { maxWidth: 420, margin: '64px auto', padding: 24, border: '1px solid #e5e7eb', borderRadius: 12 },
    h: { margin: 0, marginBottom: 16, fontSize: 22 },
    label: { display: 'block', fontSize: 14, marginBottom: 6 },
    input: { width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8, marginBottom: 12 },
    btn: { width: '100%', padding: 12, border: '1px solid #111827', background: '#111827', color: '#fff', borderRadius: 8, cursor: 'pointer' },
    btnAlt: { width: '100%', padding: 12, border: '1px solid #d1d5db', background: '#fff', color: '#111827', borderRadius: 8, cursor: 'pointer', marginTop: 8 }
  };

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMessage(null);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` }
    });
    setSending(false);
    if (error) setMessage(error.message);
    else setMessage('Check your email for the login link.');
  }

  async function signInWithGoogle() {
    setSending(true);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` }
    });
    if (error) { setSending(false); setMessage(error.message); }
    // For OAuth, the browser will navigate away.
  }

  return (
    <div style={styles.wrap}>
      <h1 style={styles.h}>Login</h1>
      <form onSubmit={signInWithEmail}>
        <label style={styles.label}>Email</label>
        <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <button style={styles.btn} disabled={sending} type="submit">{sending ? 'Sending…' : 'Send Magic Link'}</button>
      </form>
      <button style={styles.btnAlt} onClick={signInWithGoogle} disabled={sending}>Continue with Google</button>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}
