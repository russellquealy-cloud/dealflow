'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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

  // NEW
  bedrooms: number | null;
  bathrooms: number | null;   // stored as numeric(3,1)
  garage_spaces: number | null;
  home_sqft: number | null;
  lot_sqft: number | null;
  description: string | null;
};

export default function ListingDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [l, setL] = useState<Listing | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('id', String(id))
          .single();
        if (error) throw error;
        setL(data as Listing);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [id]);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const me = userData.user;
      if (me && l?.owner_id && me.id === l.owner_id) setIsOwner(true);
      else setIsOwner(false);
    })();
  }, [l]);

  if (err)
    return (
      <main style={{ padding: 16, color: '#fff', background: '#0f172a', minHeight: '100vh' }}>
        Error: {err}
      </main>
    );
  if (!l)
    return (
      <main style={{ padding: 16, color: '#fff', background: '#0f172a', minHeight: '100vh' }}>
        Loading…
      </main>
    );

  const isSold = l.status?.toLowerCase() === 'sold';
  const mailto = l.contact_email
    ? `mailto:${l.contact_email}?subject=Interested in ${encodeURIComponent(l.address)}`
    : null;
  const tel = l.contact_phone ? `tel:${l.contact_phone.replace(/[^+\d]/g, '')}` : null;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        color: '#fff',
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div
          style={{
            height: 240,
            background: '#111827',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #27272a',
            position: 'relative',
          }}
        >
          {l.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={l.image_url}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: isSold ? 'grayscale(100%)' : undefined,
              }}
            />
          )}
          {isSold && (
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                background: '#dc3545',
                color: '#fff',
                fontWeight: 800,
                letterSpacing: 1,
                padding: '6px 10px',
                borderRadius: 8,
                boxShadow: '0 2px 8px rgba(0,0,0,.2)',
              }}
            >
              SOLD
            </div>
          )}
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, marginTop: 12 }}>
          ${Number(l.price).toLocaleString()}
        </h1>

        <div style={{ opacity: 0.9, marginBottom: 10 }}>
          {l.address}
          {l.city ? `, ${l.city}` : ''}
          {l.state ? `, ${l.state}` : ''}
          {l.zip ? ` ${l.zip}` : ''}
        </div>

        {/* NEW: property details block */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            fontSize: 14,
            marginBottom: 8,
          }}
        >
          {l.bedrooms !== null && <div>Bedrooms: {l.bedrooms}</div>}
          {l.bathrooms !== null && <div>Bathrooms: {Number(l.bathrooms).toLocaleString()}</div>}
          {l.garage_spaces !== null && <div>Garage: {l.garage_spaces}</div>}
          {l.home_sqft !== null && <div>Home Sq Ft: {Number(l.home_sqft).toLocaleString()}</div>}
          {l.lot_sqft !== null && <div>Lot Size (sq ft): {Number(l.lot_sqft).toLocaleString()}</div>}
        </div>

        {l.description && (
          <div
            style={{
              background: '#111827',
              border: '1px solid #27272a',
              borderRadius: 10,
              padding: 12,
              whiteSpace: 'pre-wrap',
              marginBottom: 8,
            }}
          >
            {l.description}
          </div>
        )}

        <div style={{ display: 'grid', gap: 4, fontSize: 14 }}>
          <div>ARV: ${Number(l.arv || 0).toLocaleString()}</div>
          <div>Repairs: ${Number(l.repairs || 0).toLocaleString()}</div>
          <div>Status: {l.status}</div>
          {/* raw contact info intentionally hidden */}
        </div>

        {/* Owner-only actions */}
        {isOwner && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button
              style={{
                padding: '10px 14px',
                background: '#0ea5e9',
                color: '#fff',
                border: '0',
                borderRadius: 8,
                cursor: 'pointer',
              }}
              onClick={async () => {
                if (!confirm('Mark as SOLD?')) return;
                const { error } = await supabase
                  .from('listings')
                  .update({ status: 'sold' })
                  .eq('id', l.id);
                if (error) alert(error.message);
                else window.location.href = '/';
              }}
            >
              Mark as Sold
            </button>

            <button
              style={{
                padding: '10px 14px',
                background: '#ef4444',
                color: '#fff',
                border: '0',
                borderRadius: 8,
                cursor: 'pointer',
              }}
              onClick={async () => {
                if (!confirm('Delete this listing? This cannot be undone.')) return;
                const { error } = await supabase.from('listings').delete().eq('id', l.id);
                if (error) alert(error.message);
                else window.location.href = '/';
              }}
            >
              Delete
            </button>
          </div>
        )}

        {/* Contact buttons only (info hidden) */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {mailto && !isSold && (
            <a
              href={mailto}
              style={{
                padding: '10px 14px',
                background: '#22c55e',
                color: '#0b1220',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Email Seller
            </a>
          )}
          {tel && !isSold && (
            <a
              href={tel}
              style={{
                padding: '10px 14px',
                background: '#e2e8f0',
                color: '#0b1220',
                borderRadius: 8,
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Call/Text
            </a>
          )}
          <Link
            href="/"
            style={{
              padding: '10px 14px',
              border: '1px solid #334155',
              borderRadius: 8,
              textDecoration: 'none',
              color: '#fff',
              background: '#0b1220',
            }}
          >
            Back
          </Link>
        </div>
      </div>
    </main>
  );
}
