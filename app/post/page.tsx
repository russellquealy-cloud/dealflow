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
  status: 'live' | 'draft';

  bedrooms: string;
  bathrooms: string;
  home_sqft: string;
  lot_size: string;
  lot_unit: 'sqft' | 'acre';
  garage: string;
  description: string;

  imageFile: File | null;
};

export default function PostDealPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) router.replace('/login');
    })();
  }, [router]);

  const [form, setForm] = useState<FormState>({
    address: '',
    city: '',
    state: '',
    zip: '',
    price: '',
    arv: '',
    repairs: '',
    status: 'live',

    bedrooms: '',
    bathrooms: '',
    home_sqft: '',
    lot_size: '',
    lot_unit: 'sqft',
    garage: '',
    description: '',

    imageFile: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function uploadImage(file: File): Promise<string | null> {
    const ext = (() => {
      const dot = file.name.lastIndexOf('.');
      return dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : 'jpg';
    })();
    const fileName = `listing-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from('listing-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (uploadErr) {
      setError('Failed to upload image.');
      return null;
    }
    const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(fileName);
    return urlData?.publicUrl ?? null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return; // still checking auth

    setSubmitting(true);
    setError(null);

    if (!form.address.trim()) {
      setError('Address is required.');
      setSubmitting(false);
      return;
    }
    if (!form.price.trim() || isNaN(Number(form.price))) {
      setError('Valid price is required.');
      setSubmitting(false);
      return;
    }

    let imageUrl: string | null = null;
    if (form.imageFile) {
      imageUrl = await uploadImage(form.imageFile);
      if (!imageUrl) {
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      owner_id: userId, // ← tie to current user
      address: form.address.trim(),
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      zip: form.zip.trim() || null,
      price: Number(form.price),
      arv: safeNumOrNull(form.arv),
      repairs: safeNumOrNull(form.repairs),
      image_url: imageUrl,
      status: form.status,

      bedrooms: safeNumOrNull(form.bedrooms),
      bathrooms: safeNumOrNull(form.bathrooms),
      home_sqft: safeNumOrNull(form.home_sqft),
      lot_size: safeNumOrNull(form.lot_size),
      lot_unit: (form.lot_size.trim() ? form.lot_unit : null) as 'sqft' | 'acre' | null,
      garage: safeNumOrNull(form.garage),
      description: form.description.trim() || null,
    };

    const { data, error } = await supabase.from('listings').insert(payload).select('id').single();
    if (error) {
      setError(error.message || 'Failed to post deal.');
      setSubmitting(false);
      return;
    }

    router.push(`/listing/${data!.id}`);
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: 16 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>Post Deal</h1>
        <p style={{ color: '#9ca3af', marginTop: 6 }}>
          Required: <strong>Address</strong> and <strong>Price</strong>. You must be signed in.
        </p>

        <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
          {/* Property Location */}
          <Card title="Property Location">
            <Grid cols={2}>
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input id="address" value={form.address} onChange={(e) => onChange('address', e.target.value)} placeholder="123 Main St" />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={(e) => onChange('city', e.target.value)} placeholder="Tucson" />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(e) => onChange('state', e.target.value.toUpperCase())}
                  placeholder="AZ"
                  style={{ textTransform: 'uppercase' }}
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="zip">ZIP</Label>
                <Input id="zip" value={form.zip} onChange={(e) => onChange('zip', e.target.value)} placeholder="85747" inputMode="numeric" />
              </div>
            </Grid>
          </Card>

          {/* Deal Numbers */}
          <Card title="Deal Numbers">
            <Grid cols={3}>
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input id="price" value={form.price} onChange={(e) => onChange('price', e.target.value)} placeholder="250000" inputMode="numeric" />
              </div>
              <div>
                <Label htmlFor="arv">ARV</Label>
                <Input id="arv" value={form.arv} onChange={(e) => onChange('arv', e.target.value)} placeholder="325000" inputMode="numeric" />
              </div>
              <div>
                <Label htmlFor="repairs">Repairs</Label>
                <Input id="repairs" value={form.repairs} onChange={(e) => onChange('repairs', e.target.value)} placeholder="25000" inputMode="numeric" />
              </div>
            </Grid>
          </Card>

          {/* Property Specs */}
          <Card title="Property Specs">
            <Grid cols={3}>
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input id="bedrooms" value={form.bedrooms} onChange={(e) => onChange('bedrooms', e.target.value)} placeholder="3" inputMode="numeric" />
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input id="bathrooms" value={form.bathrooms} onChange={(e) => onChange('bathrooms', e.target.value)} placeholder="2" inputMode="numeric" />
              </div>
              <div>
                <Label htmlFor="home_sqft">Home Sq Ft</Label>
                <Input id="home_sqft" value={form.home_sqft} onChange={(e) => onChange('home_sqft', e.target.value)} placeholder="1680" inputMode="numeric" />
              </div>

              <div>
                <Label htmlFor="lot_size">Lot Size</Label>
                <Input id="lot_size" value={form.lot_size} onChange={(e) => onChange('lot_size', e.target.value)} placeholder="7405" inputMode="numeric" />
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
                <Input id="garage" value={form.garage} onChange={(e) => onChange('garage', e.target.value)} placeholder="2" inputMode="numeric" />
              </div>
            </Grid>
          </Card>

          {/* Image & Status */}
          <Card title="Property Image & Status">
            <Grid cols={2}>
              <div>
                <Label htmlFor="image">Upload Image</Label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => onChange('imageFile', e.target.files?.[0] || null)}
                  style={{ display: 'block', marginTop: 6, color: '#fff' }}
                />
                {form.imageFile ? <p style={{ color: '#9ca3af', marginTop: 6 }}>{form.imageFile.name}</p> : null}
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={form.status}
                  onChange={(e) => onChange('status', e.target.value as FormState['status'])}
                  options={[{ value: 'live', label: 'Live' }, { value: 'draft', label: 'Draft' }]}
                />
              </div>
            </Grid>
          </Card>

          {/* Description */}
          <Card title="Description">
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Notes about the property, highlights, access info, etc."
              rows={6}
            />
          </Card>

          {/* Errors */}
          {error ? (
            <div style={{ background: '#7f1d1d', color: '#fecaca', border: '1px solid #991b1b', padding: '10px 12px', borderRadius: 10, marginTop: 12 }}>
              {error}
            </div>
          ) : null}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              type="submit"
              disabled={submitting || !userId}
              style={{ ...btnPrimary, opacity: submitting || !userId ? 0.7 : 1, cursor: submitting || !userId ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? 'Posting…' : 'Post Deal'}
            </button>
            <button type="button" disabled={submitting} onClick={() => router.push('/')} style={{ ...btnGhost, opacity: submitting ? 0.7 : 1 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

/* --------------- helpers & small UI primitives --------------- */
function safeNumOrNull(v: string): number | null {
  const trimmed = v.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: '#111827', border: '1px solid #27272a', borderRadius: 12, padding: 12, marginTop: 12 }}>
      <h2 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 700 }}>{title}</h2>
      {children}
    </section>
  );
}
function Grid({ cols, children }: { cols: 2 | 3; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: cols === 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 10 }}>{children}</div>;
}
function Label(props: React.HTMLAttributes<HTMLLabelElement>) {
  return <label {...props} style={{ display: 'block', marginBottom: 6, color: '#cbd5e1', fontSize: 13, fontWeight: 600 }} />;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { style?: React.CSSProperties }) {
  const base: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #334155', borderRadius: 10, background: '#0b1220', color: '#fff', outline: 'none' };
  return <input {...props} style={{ ...base, ...(props.style || {}) }} />;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { style?: React.CSSProperties }) {
  const base: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #334155', borderRadius: 10, background: '#0b1220', color: '#fff', outline: 'none', resize: 'vertical' };
  return <textarea {...props} style={{ ...base, ...(props.style || {}) }} />;
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }) {
  const { options, ...rest } = props;
  return (
    <select {...rest} style={{ width: '100%', padding: '10px 12px', border: '1px solid #334155', borderRadius: 10, background: '#0b1220', color: '#fff', outline: 'none', appearance: 'none' }}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ color: '#111' }}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
const btnPrimary: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, background: '#0ea5e9', color: '#fff', border: '0', fontWeight: 700 };
const btnGhost: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, background: '#0b1220', color: '#fff', border: '1px solid #334155', fontWeight: 700 };
