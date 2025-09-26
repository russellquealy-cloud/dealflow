'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type UserLite = { id: string; email?: string | null };

export default function PostPage() {
  const [user, setUser] = useState<UserLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // On mount, check auth
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
      setLoading(false);
    })();
  }, []);

  // Not logged in → friendly prompt with Login button that preserves the return path
  if (loading) {
    return <main className="container"><p>Loading…</p></main>;
  }
  if (!user) {
    return (
      <main className="container" style={{ maxWidth: 520 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Post a Deal</h1>
        <p style={{ marginBottom: 12 }}>You need to be logged in to post a deal.</p>
        <Link href="/login?next=/post" className="btnPrimary">Login</Link>
        <div style={{ marginTop: 12 }}>
          <Link href="/" className="btnGhost">Back to Deals</Link>
        </div>
      </main>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);

    const fd = new FormData(e.currentTarget);

const payload = {
  address: String(fd.get('address') ?? ''),
  city: String(fd.get('city') ?? ''),
  state: String(fd.get('state') ?? ''),
  zip: String(fd.get('zip') ?? ''),
  price: Number(fd.get('price') ?? 0),
  arv: Number(fd.get('arv') ?? 0),
  repairs: Number(fd.get('repairs') ?? 0),
  image_url: (fd.get('image_url') ? String(fd.get('image_url')) : null) as string | null,
  contact_name: (fd.get('contact_name') ? String(fd.get('contact_name')) : null) as string | null,
  contact_email: String(fd.get('contact_email') ?? ''),
  contact_phone: (fd.get('contact_phone') ? String(fd.get('contact_phone')) : null) as string | null,
  status: 'live' as const,
  owner_id: user ? user.id : '', // <-- Fix here
};

    try {
      const { data, error } = await supabase
        .from('listings')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw error;
      window.location.href = `/listing/${data.id}`;
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  // helper to render inputs quickly
  function input(
    name: string,
    placeholder: string,
    type: 'text' | 'email' | 'number' = 'text',
    required = false
  ) {
    return (
      <input
        name={name}
        required={required}
        type={type}
        placeholder={placeholder}
        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--ring)', borderRadius: 10 }}
      />
    );
  }

  return (
    <main className="container" style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Post a Deal</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        {input('address', 'Address', 'text', true)}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: 8 }}>
          {input('city', 'City')}
          {input('state', 'State')}
          {input('zip', 'Zip')}
        </div>
        {input('price', 'Asking Price', 'number', true)}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {input('arv', 'ARV', 'number')}
          {input('repairs', 'Estimated Repairs', 'number')}
        </div>

        {/* TEMP: keep URL until we switch to real uploads in the next step */}
        {input('image_url', 'Image URL (temporary until upload is enabled)')}

        {input('contact_name', 'Your Name (optional)')}
        {input('contact_email', 'Your Email', 'email', true)}
        {input('contact_phone', 'Your Phone (optional)')}

        <button disabled={busy} className="btnPrimary" style={{ border: 0 }}>
          {busy ? 'Posting…' : 'Post Deal'}
        </button>
        {msg && <div style={{ color: 'crimson' }}>{msg}</div>}
        <Link href="/" className="btnGhost">Back to Deals</Link>
      </form>
    </main>
  );
}
