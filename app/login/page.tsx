'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

async function sendLink(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setMsg(null);

  // Preserve ?next=/post if present, otherwise default to /
  const search = new URLSearchParams(window.location.search);
  const next = search.get('next') || '/';
  const redirect = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirect },
  });

  setMsg(error ? error.message : 'Check your email for the login link.');
}

  return (
    <main className="container">
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Login</h1>
      <form onSubmit={sendLink} style={{ display:'grid', gap: 10, maxWidth: 360 }}>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
          style={{ padding:'10px 12px', border:'1px solid var(--ring)', borderRadius: 10 }}
        />
        <button className="btnPrimary">Send Magic Link</button>
        {msg && <div>{msg}</div>}
      </form>
    </main>
  );
}
