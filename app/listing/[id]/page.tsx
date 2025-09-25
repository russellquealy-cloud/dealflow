'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

type Listing = {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number;
  arv: number | null;
  repairs: number | null;
  image_url: string | null;
  status: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

export default function ListingDetail({ params }: { params: { id: string } }) {
  const [l, setL] = useState<Listing | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('listings').select('*').eq('id', params.id).single();
        if (error) throw error;
        setL(data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setErr(msg);
      }
    })();
  }, [params.id]);

  if (err) return <main style={{ padding: 16 }}>Error: {err}</main>;
  if (!l) return <main style={{ padding: 16 }}>Loading…</main>;

  const mailto = l.contact_email ? `mailto:${l.contact_email}?subject=Interested in ${encodeURIComponent(l.address)}` : null;
  const tel = l.contact_phone ? `tel:${l.contact_phone.replace(/[^+\d]/g, '')}` : null;

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
      <div style={{ height: 220, background: '#f2f2f2', borderRadius: 12, overflow: 'hidden' }}>
        {l.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 12 }}>${Number(l.price).toLocaleString()}</h1>
      <div style={{ opacity: 0.8, marginBottom: 8 }}>
        {l.address}{l.city ? `, ${l.city}` : ''}{l.state ? `, ${l.state}` : ''}{l.zip ? ` ${l.zip}` : ''}
      </div>

      <div style={{ display: 'grid', gap: 4, fontSize: 14 }}>
        <div>ARV: ${Number(l.arv || 0).toLocaleString()}</div>
        <div>Repairs: ${Number(l.repairs || 0).toLocaleString()}</div>
        <div>Status: {l.status}</div>
        {l.contact_name && <div>Contact: {l.contact_name}</div>}
        {l.contact_phone && <div>Phone: {l.contact_phone}</div>}
        {l.contact_email && <div>Email: {l.contact_email}</div>}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {mailto && (
          <a href={mailto} style={{ padding: '10px 14px', background: '#198754', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>
            Email Seller
          </a>
        )}
        {tel && (
          <a href={tel} style={{ padding: '10px 14px', background: '#e9ecef', color: '#000', borderRadius: 8, textDecoration: 'none' }}>
            Call/Text
          </a>
        )}
        <Link href="/" style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, textDecoration: 'none' }}>
          Back
        </Link>
      </div>
    </main>
  );
}
