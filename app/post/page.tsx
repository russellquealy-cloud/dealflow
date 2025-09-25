'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PostPage() {
  const [form, setForm] = useState({
    address: '', city: '', state: '', zip: '',
    price: '', arv: '', repairs: '',
    image_url: '', contact_name: '', contact_email: '', contact_phone: ''
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const payload = {
        ...form,
        price: Number(form.price || 0),
        arv: Number(form.arv || 0),
        repairs: Number(form.repairs || 0),
        status: 'live',
      };
      const { data, error } = await supabase.from('listings').insert(payload).select('id').single();
      if (error) throw error;
      window.location.href = `/listing/${data.id}`;
    } catch (err: any) {
      setMsg(err.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  function field(name: keyof typeof form, placeholder: string, type='text') {
    return (
      <input
        required={['address','price','contact_email'].includes(name)}
        type={type}
        placeholder={placeholder}
        value={(form as any)[name] ?? ''}
        onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        style={{ width:'100%', padding:'10px 12px', border:'1px solid #ddd', borderRadius:8 }}
      />
    );
  }

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Post a Deal</h1>
      <form onSubmit={submit} style={{ display:'grid', gap: 10 }}>
        {field('address','Address')}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 100px', gap: 8 }}>
          {field('city','City')}
          {field('state','State')}
          {field('zip','Zip')}
        </div>
        {field('price','Asking Price','number')}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
          {field('arv','ARV','number')}
          {field('repairs','Estimated Repairs','number')}
        </div>
        {field('image_url','Image URL (optional)')}
        {field('contact_name','Your Name (optional)')}
        {field('contact_email','Your Email','email')}
        {field('contact_phone','Your Phone (optional)')}

        <button disabled={busy} style={{ padding:'12px 16px', background:'#198754', color:'#fff', borderRadius:8, border:0 }}>
          {busy ? 'Posting…' : 'Post Deal'}
        </button>
        {msg && <div style={{ color:'crimson' }}>{msg}</div>}
        <a href="/" style={{ textDecoration:'none' }}>Back to Deals</a>
      </form>
    </main>
  );
}
