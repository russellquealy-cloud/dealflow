'use client';

import { use, useEffect, useState } from 'react';
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
  owner_id: string | null;
};

export default function ListingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next 15 params must be unwrapped with React.use()
  const { id } = use(params);

  const [l, setL] = useState<Listing | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Fetch the listing
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setL(data as Listing);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [id]);

  // Determine if current user owns this listing
  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const me = userData.user;
      if (me && l?.owner_id && me.id === l.owner_id) setIsOwner(true);
      else setIsOwner(false);
    })();
  }, [l]);

  if (err) return <main className="container" style={{ padding: 16 }}>Error: {err}</main>;
  if (!l) return <main className="container" style={{ padding: 16 }}>Loading…</main>;

  const mailto = l.contact_email
    ? `mailto:${l.contact_email}?subject=Interested in ${encodeURIComponent(l.address)}`
    : null;
  const tel = l.contact_phone ? `tel:${l.contact_phone.replace(/[^+\d]/g, '')}` : null;

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
      {/* Image + SOLD badge */}
      <div
        style={{
          position: 'relative',
          height: 220,
          background: '#f2f2f2',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {l.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}

        {l.status === 'sold' && (
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              background: '#dc3545',
              color: '#fff',
              fontWeight: 700,
              padding: '6px 10px',
              borderRadius: 8,
              letterSpacing: 1,
            }}
          >
            SOLD
          </div>
        )}
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginTop: 12 }}>
        ${Number(l.price).toLocaleString()}
      </h1>
      <div style={{ opacity: 0.8, marginBottom: 8 }}>
        {l.address}
        {l.city ? `, ${l.city}` : ''}
        {l.state ? `, ${l.state}` : ''}
        {l.zip ? ` ${l.zip}` : ''}
      </div>

      <div style={{ display: 'grid', gap: 4, fontSize: 14 }}>
        <div>ARV: ${Number(l.arv || 0).toLocaleString()}</div>
        <div>Repairs: ${Number(l.repairs || 0).toLocaleString()}</div>
        <div>Status: {l.status}</div>
        {l.contact_name && <div>Contact: {l.contact_name}</div>}
        {l.contact_phone && <div>Phone: {l.contact_phone}</div>}
        {l.contact_email && <div>Email: {l.contact_email}</div>}
      </div>

      {/* Owner-only actions (styled) */}
      {isOwner && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button
            onClick={async () => {
              if (!confirm('Mark as SOLD?')) return;
              const { error } = await supabase
                .from('listings')
                .update({ status: 'sold' })
                .eq('id', l.id);
              if (error) alert(error.message);
              else window.location.href = '/';
            }}
            style={{
              padding: '10px 14px',
              background: '#28a745', // green
              color: '#fff',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Mark as Sold
          </button>

          <button
            onClick={async () => {
              if (!confirm('Delete this listing? This cannot be undone.')) return;
              const { error } = await supabase
                .from('listings')
                .delete()
                .eq('id', l.id);
              if (error) alert(error.message);
              else window.location.href = '/';
            }}
            style={{
              padding: '10px 14px',
              background: '#dc3545', // red
              color: '#fff',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {mailto && (
          <a
            href={mailto}
            style={{ padding: '10px 14px', background: '#198754', color: '#fff', borderRadius: 8, textDecoration: 'none' }}
          >
            Email Seller
          </a>
        )}
        {tel && (
          <a
            href={tel}
            style={{ padding: '10px 14px', background: '#e9ecef', color: '#000', borderRadius: 8, textDecoration: 'none' }}
          >
            Call/Text
          </a>
        )}
        <Link
          href="/"
          style={{
            padding: '10px 14px',
            background: '#e9ecef', // neutral gray
            color: '#000',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          Back
        </Link>
      </div>
    </main>
  );
}
