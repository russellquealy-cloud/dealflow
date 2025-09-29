// app/login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

type View = 'login' | 'sent';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [view, setView] = useState<View>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserEmail(data.user?.email ?? null);
    })();
  }, []);

  function msg(err: unknown) {
    return err instanceof Error ? err.message : String(err);
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/`
              : undefined,
        },
      });
      if (error) throw error;
      setView('sent');
    } catch (err: unknown) {
      setError(msg(err) || 'Could not send magic link.');
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:
            typeof window !== 'undefined'
              ? `${window.location.origin}/`
              : undefined,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(msg(err) || 'Google sign-in failed.');
      setLoading(false);
    }
  }

  async function signOut() {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUserEmail(null);
    } catch (err: unknown) {
      setError(msg(err) || 'Sign out failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: 16 }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Link href="/" style={navBtn}>Deals</Link>
          <Link href="/post" style={navBtn}>Post Deal</Link>
          <Link href="/listings" style={navBtn}>My Listings</Link>
          <Link href="/login" style={{ ...navBtn, background: '#111827' }}>Login</Link>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Login</h1>

        {userEmail ? (
          <section style={card}>
            <div style={{ marginBottom: 8 }}>Signed in as <strong>{userEmail}</strong></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={signOut} disabled={loading} style={btnDanger}>
                {loading ? 'Signing out…' : 'Sign out'}
              </button>
              <Link href="/" style={{ ...btnSecondary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                ← Back to Deals
              </Link>
            </div>
          </section>
        ) : (
          <section style={card}>
            {error ? <div style={errBox}>{error}</div> : null}

            {view === 'login' ? (
              <>
                <form onSubmit={sendMagicLink} style={{ display: 'grid', gap: 10 }}>
                  <div>
                    <label htmlFor="email" style={labelStyle}>Email</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={inputStyle}
                    />
                  </div>
                  <button type="submit" disabled={loading} style={btnPrimary}>
                    {loading ? 'Sending…' : 'Send magic link'}
                  </button>
                </form>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />

                <button onClick={signInWithGoogle} disabled={loading} style={btnSecondary}>
                  {loading ? 'Opening…' : 'Continue with Google'}
                </button>
              </>
            ) : (
              <div>
                <div style={{ marginBottom: 8 }}>
                  Check your email for a magic link to sign in.
                </div>
                <button onClick={() => setView('login')} style={btnGhost}>Use a different email</button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

/* styles */
const card: React.CSSProperties = { background: '#111827', border: '1px solid #27272a', borderRadius: 12, padding: 12 };
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, color: '#cbd5e1', fontSize: 13, fontWeight: 600 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #334155', borderRadius: 10, background: '#0b1220', color: '#fff', outline: 'none' };
const btnPrimary: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, background: '#0ea5e9', color: '#fff', border: '0', fontWeight: 700, cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, background: '#0b1220', color: '#fff', border: '1px solid #334155', fontWeight: 700, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, background: '#0b1220', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, cursor: 'pointer' };
const btnDanger: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, background: '#7f1d1d', color: '#fff', border: '1px solid #991b1b', fontWeight: 700, cursor: 'pointer' };
const navBtn: React.CSSProperties = { padding: '8px 12px', borderRadius: 10, background: '#0b1220', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', textDecoration: 'none', fontWeight: 700, fontSize: 14 };
const errBox: React.CSSProperties = { background: '#7f1d1d', color: '#fecaca', border: '1px solid #991b1b', padding: '10px 12px', borderRadius: 10, marginBottom: 10 };
