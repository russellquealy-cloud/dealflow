// app/post/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

type FormState = {
  address: string;
  city: string;
  state: string;
  zip: string;
  price: string;
  arv: string;
  repairs: string;
  bedrooms: string;
  bathrooms: string;
  home_sqft: string;
  lot_size: string;
  lot_unit: 'sqft' | 'acre';
  garage: string;
  description: string;
  imageFile: File | null;
  // NEW
  contact_name: string;
  contact_phone: string;
  contact_email: string;
};

export default function PostDealPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    address: '',
    city: '',
    state: '',
    zip: '',
    price: '',
    arv: '',
    repairs: '',
    bedrooms: '',
    bathrooms: '',
    home_sqft: '',
    lot_size: '',
    lot_unit: 'sqft',
    garage: '',
    description: '',
    imageFile: null,
    contact_name: '',
    contact_phone: '',
    contact_email: '',
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) router.replace('/login');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (field: keyof FormState, value: string | File | null) => {
    setForm((f) => ({ ...f, [field]: value } as FormState));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setSubmitting(true);
    setError(null);

    try {
      // Insert listing row first
      const payload = {
        owner_id: userId,
        address: form.address.trim(),
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        zip: form.zip.trim() || null,
        price: numOrNull(form.price) ?? 0,
        arv: numOrNull(form.arv),
        repairs: numOrNull(form.repairs),
        bedrooms: numOrNull(form.bedrooms),
        bathrooms: numOrNull(form.bathrooms),
        home_sqft: numOrNull(form.home_sqft),
        lot_size: numOrNull(form.lot_size),
        lot_unit: form.lot_size.trim() ? form.lot_unit : null,
        garage: numOrNull(form.garage),
        description: form.description.trim() || null,
        status: 'live' as const,
        image_url: null as string | null,
        // NEW contact fields
        contact_name: form.contact_name.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        contact_email: form.contact_email.trim() || null,
      };

      const { data: inserted, error: insErr } = await supabase
        .from('listings')
        .insert(payload)
        .select('id')
        .single();

      if (insErr) throw insErr;
      const listingId = inserted!.id as string;

      // Primary image upload (optional)
      if (form.imageFile) {
        const file = form.imageFile;

        if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed.');
        const maxMB = 15;
        if (file.size > maxMB * 1024 * 1024) throw new Error(`Image too large. Max ${maxMB} MB.`);

        const ext = extOf(file.name) || 'jpg';
        const fileName = `listing-${listingId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const { error: upErr } = await supabase
          .storage
          .from('listing-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage
          .from('listing-images')
          .getPublicUrl(fileName);

        const url = urlData?.publicUrl;
        if (!url) throw new Error('Could not resolve public URL for image.');

        await supabase.from('listings').update({ image_url: url }).eq('id', listingId);
        await supabase.from('listing_images').insert({ listing_id: listingId, url });
      }

      router.replace(`/listing/${listingId}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || 'Failed to post listing');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={pageWrap}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Post Deal</h1>
        <p style={{ color: '#9ca3af', marginTop: 6 }}>
          Upload a primary photo, enter the basics, and publish your deal.
        </p>

        {error ? <div style={errBox}>{error}</div> : null}

        <form onSubmit={onSubmit} style={{ marginTop: 12, display: 'grid', gap: 12 }}>
          {/* Address */}
          <section style={card}>
            <h2 style={sectionH2}>Address</h2>
            <Grid cols={2}>
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => onChange('address', e.target.value)}
                  required
                  placeholder="123 Main St"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={(e) => onChange('city', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) => onChange('state', e.target.value)}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              <div>
                <Label htmlFor="zip">ZIP</Label>
                <Input id="zip" value={form.zip} onChange={(e) => onChange('zip', e.target.value)} />
              </div>
            </Grid>
          </section>

          {/* Numbers */}
          <section style={card}>
            <h2 style={sectionH2}>Numbers</h2>
            <Grid cols={3}>
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input id="price" inputMode="numeric" value={form.price} onChange={(e) => onChange('price', e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="arv">ARV</Label>
                <Input id="arv" inputMode="numeric" value={form.arv} onChange={(e) => onChange('arv', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="repairs">Repairs</Label>
                <Input id="repairs" inputMode="numeric" value={form.repairs} onChange={(e) => onChange('repairs', e.target.value)} />
              </div>
            </Grid>
          </section>

          {/* Specs */}
          <section style={card}>
            <h2 style={sectionH2}>Property Specs</h2>
            <Grid cols={3}>
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input id="bedrooms" inputMode="numeric" value={form.bedrooms} onChange={(e) => onChange('bedrooms', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input id="bathrooms" inputMode="numeric" value={form.bathrooms} onChange={(e) => onChange('bathrooms', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="home_sqft">Home Sq Ft</Label>
                <Input id="home_sqft" inputMode="numeric" value={form.home_sqft} onChange={(e) => onChange('home_sqft', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="lot_size">Lot Size</Label>
                <Input id="lot_size" inputMode="numeric" value={form.lot_size} onChange={(e) => onChange('lot_size', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="lot_unit">Lot Unit</Label>
                <Select
                  id="lot_unit"
                  value={form.lot_unit}
                  onChange={(e) => onChange('lot_unit', e.target.value as 'sqft' | 'acre')}
                  options={[{ value: 'sqft', label: 'Sq Ft' }, { value: 'acre', label: 'Acre' }]}
                />
              </div>
              <div>
                <Label htmlFor="garage">Garage (spaces)</Label>
                <Input id="garage" inputMode="numeric" value={form.garage} onChange={(e) => onChange('garage', e.target.value)} />
              </div>
            </Grid>
          </section>

          {/* Contact */}
          <section style={card}>
            <h2 style={sectionH2}>Contact</h2>
            <Grid cols={3}>
              <div>
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input id="contact_name" value={form.contact_name} onChange={(e) => onChange('contact_name', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="contact_phone">Phone</Label>
                <Input id="contact_phone" value={form.contact_phone} onChange={(e) => onChange('contact_phone', e.target.value)} placeholder="+1 555 555 5555" />
              </div>
              <div>
                <Label htmlFor="contact_email">Email</Label>
                <Input id="contact_email" type="email" value={form.contact_email} onChange={(e) => onChange('contact_email', e.target.value)} />
              </div>
            </Grid>
          </section>

          {/* Description */}
          <section style={card}>
            <h2 style={sectionH2}>Description</h2>
            <Textarea rows={5} value={form.description} onChange={(e) => onChange('description', e.target.value)} placeholder="Notes about the property, condition, access, timeline…" />
          </section>

          {/* Primary image */}
          <section style={card}>
            <h2 style={sectionH2}>Primary Photo</h2>
            <p style={{ marginTop: 0, color: '#9ca3af' }}>
              Choose an image from your phone (camera or gallery). JPG/PNG up to 15 MB.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0] ?? null;
                onChange('imageFile', file);
              }}
            />
            {form.imageFile ? (
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
                Selected: {form.imageFile.name}
              </div>
            ) : null}
          </section>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              disabled={submitting || !userId}
              style={{
                ...btnPrimary,
                opacity: submitting ? 0.7 : 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Posting…' : 'Post Deal'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

/* ---------------- helpers & UI bits ---------------- */

function numOrNull(v: string): number | null {
  const t = v?.trim?.() ?? '';
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
function extOf(name: string) {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

function Grid(props: { cols?: number; children: React.ReactNode }) {
  const { cols = 2, children } = props;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 10 }}>
      {children}
    </div>
  );
}

function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  const { style, ...rest } = props;
  return (
    <label
      {...rest}
      style={{
        display: 'block',
        marginBottom: 6,
        color: '#cbd5e1',
        fontSize: 13,
        fontWeight: 600,
        ...(style || {}),
      }}
    />
  );
}
function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & { style?: React.CSSProperties }
) {
  const base: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #334155',
    borderRadius: 10,
    background: '#0b1220',
    color: '#fff',
    outline: 'none',
  };
  const { style, ...rest } = props;
  return <input {...rest} style={{ ...base, ...(style || {}) }} />;
}
function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { style?: React.CSSProperties }
) {
  const base: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #334155',
    borderRadius: 10,
    background: '#0b1220',
    color: '#fff',
    outline: 'none',
    resize: 'vertical',
  };
  const { style, ...rest } = props;
  return <textarea {...rest} style={{ ...base, ...(style || {}) }} />;
}
function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    options: { value: string; label: string }[];
  }
) {
  const { options, style, ...rest } = props;
  const base: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #334155',
    borderRadius: 10,
    background: '#0b1220',
    color: '#fff',
    outline: 'none',
    appearance: 'none',
  };
  return (
    <select {...rest} style={{ ...base, ...(style || {}) }}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ color: '#111' }}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/* ---------------- styles ---------------- */
const pageWrap: React.CSSProperties = { minHeight: '100vh', background: '#0f172a', color: '#fff', padding: 16 };
const card: React.CSSProperties = { background: '#111827', border: '1px solid #27272a', borderRadius: 12, padding: 12 };
const sectionH2: React.CSSProperties = { margin: '0 0 8px', fontSize: 18, fontWeight: 800 };
const btnPrimary: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, background: '#0ea5e9', color: '#fff', border: '0', fontWeight: 700 };
const errBox: React.CSSProperties = { background: '#7f1d1d', color: '#fecaca', border: '1px solid #991b1b', padding: '10px 12px', borderRadius: 10, marginTop: 12 };
