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

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
      setLoading(false);
    })();
  }, []);

  if (loading) return <main className="container"><p>Loading…</p></main>;

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

    // Optional: handle image upload to Supabase Storage (bucket: listing-images)
    let image_url: string | null =
      (fd.get('image_url') ? String(fd.get('image_url')) : null) || null;

    const file = fd.get('image_file') as File | null;
    if (file && file.size > 0) {
      const filePath = `u_${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const { error: upErr } = await supabase.storage.from('listing-images').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (upErr) {
        setMsg(`Image upload failed: ${upErr.message}`);
        setBusy(false);
        return;
      }
      const { data: pub } = supabase.storage.from('listing-images').getPublicUrl(filePath);
      image_url = pub?.publicUrl || null;
    }

    // Helper to coerce optional numeric inputs
    const asNum = (v: FormDataEntryValue | null) => {
      if (v === null || v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const payload = {
      address: String(fd.get('address') ?? ''),
      city: String(fd.get('city') ?? ''),
      state: String(fd.get('state') ?? ''),
      zip: String(fd.get('zip') ?? ''),
      price: Number(fd.get('price') ?? 0),
      arv: asNum(fd.get('arv')),
      repairs: asNum(fd.get('repairs')),
      image_url,

      // NEW FIELDS
      bedrooms: asNum(fd.get('bedrooms')),
      bathrooms: asNum(fd.get('bathrooms')), // allow decimals (e.g. 1.5)
      garage_spaces: asNum(fd.get('garage_spaces')),
      home_sqft: asNum(fd.get('home_sqft')),
      lot_sqft: asNum(fd.get('lot_sqft')),
      description: (fd.get('description') ? String(fd.get('description')) : null) as string | null,

      contact_name: (fd.get('contact_name') ? String(fd.get('contact_name')) : null) as string | null,
      contact_email: String(fd.get('contact_email') ?? ''),
      contact_phone: (fd.get('contact_phone') ? String(fd.get('contact_phone')) : null) as string | null,

      status: 'live' as const,
      owner_id: user.id,
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

  // quick styled input
  const input = (
    name: string,
    placeholder: string,
    type: 'text' | 'email' | 'number' = 'text',
    required = false,
    step?: string
  ) => (
    <input
      name={name}
      required={required}
      type={type}
      step={step}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: '1px solid var(--ring)',
        borderRadius: 10,
        background: '#0b1220',
        color: '#fff',
      }}
    />
  );

  return (
    <main className="container" style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Post a Deal</h1>

      <form onSubmit={submit} style={{ display: 'grid', gap: 10 }}>
        {input('address', 'Address', 'text', true)}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 100px', gap: 8 }}>
          {input('city','City')}
          {input('state','State')}
          {input('zip','Zip')}
        </div>

        {input('price','Asking Price','number', true)}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
          {input('arv','ARV','number')}
          {input('repairs','Estimated Repairs','number')}
        </div>

        {/* NEW: property details */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
          {input('bedrooms','Bedrooms','number')}
          {input('bathrooms','Bathrooms (e.g. 1.5)','number', false, '0.1')}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
          {input('garage_spaces','Garage Spaces','number')}
          {input('home_sqft','Home Sq Ft','number')}
        </div>
        {input('lot_sqft','Lot Size (sq ft)','number')}

        <textarea
          name="description"
          placeholder="Description (optional)"
          rows={5}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid var(--ring)',
            borderRadius: 10,
            background: '#0b1220',
            color: '#fff',
          }}
        />

        {/* Image — either URL or upload */}
        {input('image_url','Image URL (optional)')}
        <div style={{ fontSize: 12, opacity: 0.8 }}>— or —</div>
        <input name="image_file" type="file" accept="image/*" />

        {/* Contact (email still required to enable Email button) */}
        {input('contact_name','Your Name (optional)')}
        {input('contact_email','Your Email','email', true)}
        {input('contact_phone','Your Phone (optional)')}

        <button disabled={busy} className="btnPrimary" style={{ border: 0 }}>
          {busy ? 'Posting…' : 'Post Deal'}
        </button>
        {msg && <div style={{ color:'crimson' }}>{msg}</div>}
        <Link href="/" className="btnGhost">Back to Deals</Link>
      </form>
    </main>
  );
}
