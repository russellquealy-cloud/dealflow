'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PostPage() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
    };

    try {
      const { data, error } = await supabase
        .from('listings')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw error;
      window.location.href = `/listing/${data.id}`;
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  // simple helper to render inputs without React state
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
        style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }}
      />
    );
  }

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: 16 }}>
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
        {input('image_url', 'Image URL (optional)')}
        {input('contact_name', 'Your Name (optional)')}
        {input('contact_email', 'Your Email', 'email', true)}
        {input('contact_phone', 'Your Phone (optional)')}

        <button disabled={busy} style={{ padding: '12px 16px', background: '#198754', color: '#fff', borderRadius: 8, border: 0 }}>
          {busy ? 'Posting…' : 'Post Deal'}
        </button>
        {msg && <div style={{ color: 'crimson' }}>{msg}</div>}
        <Link href="/" style={{ textDecoration: 'none' }}>
          Back to Deals
        </Link>
      </form>
    </main>
  );
}
