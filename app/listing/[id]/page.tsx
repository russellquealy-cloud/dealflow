// app/listing/[id]/page.tsx
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
  created_at?: string;

  bedrooms: number | null;
  bathrooms: number | null;
  home_sqft: number | null;
  lot_size: number | null;
  lot_unit: 'sqft' | 'acre' | null;
  garage: number | null;
  description: string | null;

  // NEW contact fields
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
};

type ExtraImage = { id: string; url: string };

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const listingId = params?.id;

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<ExtraImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) return;
    (async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('listings')
        .select(
          [
            'id','address','city','state','zip','price','arv','repairs','image_url',
            'status','created_at','bedrooms','bathrooms','home_sqft','lot_size',
            'lot_unit','garage','description',
            // contact
            'contact_name','contact_phone','contact_email',
          ].join(',')
        )
        .eq('id', listingId)
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setListing(data as Listing);

      const { data: imgs } = await supabase
        .from('listing_images')
        .select('id, url')
        .eq('listing_id', listingId);

      setImages(imgs || []);
      setLoading(false);
    })();
  }, [listingId]);

  if (loading) {
    return (
      <main style={wrapper}>
        <div style={{ color: '#fff' }}>Loading…</div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main style={wrapper}>
        <div style={{ color: '#fecaca' }}>{error || 'Listing not found.'}</div>
        <div style={{ marginTop: 8 }}>
          <Link href="/" style={linkBtn}>Back to Deals</Link>
        </div>
      </main>
    );
  }

  const phone = normPhone(listing.contact_phone);
  const email = (listing.contact_email || '').trim();
  const name = (listing.contact_name || '').trim();

  return (
    <main style={wrapper}>
      <div style={container}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          {/* Title + price */}
          <h1 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 800 }}>
            ${Number(listing.price).toLocaleString()}
          </h1>
          <div style={{ color: '#cbd5e1' }}>
            {listing.address}
            {listing.city ? `, ${listing.city}` : ''}
            {listing.state ? `, ${listing.state}` : ''} {listing.zip || ''}
          </div>

          {/* Hero image */}
          {listing.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.image_url}
              alt=""
              style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 12, border: '1px solid #27272a' }}
            />
          ) : null}

          {/* Contact buttons */}
          {(phone || email) ? (
            <section style={card}>
              <h2 style={sectionH2}>Contact</h2>
              <div style={{ color: '#cbd5e1', marginBottom: 8 }}>
                {name ? name : 'Wholesaler'}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {phone ? (
                  <>
                    <a href={`tel:${phone}`} style={btnPrimary} title="Call">
                      📞 Call
                    </a>
                    <a href={`sms:${phone}`} style={btnSecondary} title="Text">
                      💬 Text
                    </a>
                  </>
                ) : null}
                {email ? (
                  <a
                    href={`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Regarding your listing')}`}
                    style={btnSecondary}
                    title="Email"
                  >
                    ✉️ Email
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Extra images */}
          {images.length ? (
            <div>
              <h2 style={sectionH2}>Photos</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {images.map((im) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={im.id}
                    src={im.url}
                    alt=""
                    style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid #27272a', background: '#0b0f1a' }}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Specs */}
          <section style={card}>
            <h2 style={sectionH2}>Property Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              <Spec label="Bedrooms" value={numOrDash(listing.bedrooms)} />
              <Spec label="Bathrooms" value={numOrDash(listing.bathrooms)} />
              <Spec label="Home Sq Ft" value={numOrDash(listing.home_sqft)} />
              <Spec
                label="Lot Size"
                value={
                  listing.lot_size
                    ? `${Number(listing.lot_size).toLocaleString()} ${listing.lot_unit || ''}`.trim()
                    : '—'
                }
              />
              <Spec label="Garage" value={numOrDash(listing.garage)} />
              <Spec label="ARV" value={moneyOrDash(listing.arv)} />
              <Spec label="Repairs" value={moneyOrDash(listing.repairs)} />
              <Spec label="Status" value={listing.status || '—'} />
            </div>
          </section>

          {/* Description */}
          {listing.description ? (
            <section style={card}>
              <h2 style={sectionH2}>Description</h2>
              <p style={{ margin: 0, color: '#e5e7eb', whiteSpace: 'pre-wrap' }}>{listing.description}</p>
            </section>
          ) : null}

          <div>
            <Link href="/" style={linkBtn}>← Back to Deals</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---- small pieces ---- */
function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#0b1220', border: '1px solid #334155', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ color: '#9ca3af', fontSize: 12 }}>{label}</div>
      <div style={{ color: '#fff', fontWeight: 700 }}>{value}</div>
    </div>
  );
}
function numOrDash(n: number | null) {
  return typeof n === 'number' && Number.isFinite(n) ? String(n) : '—';
}
function moneyOrDash(n: number | null) {
  return typeof n === 'number' && Number.isFinite(n) ? `$${n.toLocaleString()}` : '—';
}
function normPhone(raw: string | null) {
  if (!raw) return '';
  return raw.replace(/[^\d+]/g, ''); // keep digits and +
}

/* ---- styles ---- */
const wrapper: React.CSSProperties = { minHeight: '100vh', background: '#0f172a', color: '#fff', padding: 16 };
const container: React.CSSProperties = { maxWidth: 900, margin: '0 auto' };
const sectionH2: React.CSSProperties = { margin: '0 0 8px', fontSize: 18, fontWeight: 800 };
const card: React.CSSProperties = { background: '#111827', border: '1px solid #27272a', borderRadius: 12, padding: 12 };
const linkBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  borderRadius: 10,
  textDecoration: 'none',
  background: '#0b0f1a',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.12)',
};
const btnPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 12px',
  borderRadius: 10,
  background: '#0ea5e9',
  color: '#fff',
  border: '0',
  fontWeight: 700,
  textDecoration: 'none',
};
const btnSecondary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 12px',
  borderRadius: 10,
  background: '#0b1220',
  color: '#fff',
  border: '1px solid #334155',
  fontWeight: 700,
  textDecoration: 'none',
};
