// app/listings/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

type ImageRow = { id: string; listing_id: string; url: string };

type Listing = {
  id: string;
  owner_id: string | null;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number;
  arv: number | null;
  repairs: number | null;
  image_url: string | null;
  status: 'live' | 'draft' | 'sold';
  created_at?: string;
  bedrooms: number | null;
  bathrooms: number | null;
  home_sqft: number | null;
  lot_size: number | null;
  lot_unit: 'sqft' | 'acre' | null;
  garage: number | null;
  description: string | null;
  images?: { id: string; url: string }[];
};

type Editable = {
  price: string;
  arv: string;
  repairs: string;
  status: 'live' | 'draft' | 'sold';
  description: string;
  bedrooms: string;
  bathrooms: string;
  home_sqft: string;
  lot_size: string;
  lot_unit: 'sqft' | 'acre';
  garage: string;
};

export default function MyListingsPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingPhotoId, setAddingPhotoId] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<Listing[]>([]);
  const [edit, setEdit] = useState<Record<string, Editable>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        router.replace('/login');
        return;
      }
      await load(uid);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(uid: string) {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('listings')
      .select(
        [
          'id','owner_id','address','city','state','zip','price','arv','repairs',
          'image_url','status','created_at','bedrooms','bathrooms','home_sqft',
          'lot_size','lot_unit','garage','description',
        ].join(',')
      )
      .eq('owner_id', uid)
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // TS-safe narrowing for Vercel strict types
    const listings: Listing[] = Array.isArray(data)
      ? (data as unknown as Listing[])
      : [];

    // fetch thumbnails for these listings
    const ids = listings.map((d) => d.id);
    const imagesByListing: Record<string, { id: string; url: string }[]> = {};
    if (ids.length) {
      const { data: imgData } = await supabase
        .from('listing_images')
        .select('id, listing_id, url')
        .in('listing_id', ids);

      (Array.isArray(imgData) ? imgData : []).forEach((im) => {
        const row = im as ImageRow;
        (imagesByListing[row.listing_id] ||= []).push({ id: row.id, url: row.url });
      });
    }

    const withImgs: Listing[] = listings.map((d) => ({
      ...d,
      images: imagesByListing[d.id] || [],
    }));

    setRows(withImgs);

    const seed: Record<string, Editable> = {};
    withImgs.forEach((l) => {
      seed[l.id] = {
        price: l.price?.toString() ?? '',
        arv: l.arv?.toString() ?? '',
        repairs: l.repairs?.toString() ?? '',
        status: l.status || 'live',
        description: l.description || '',
        bedrooms: nOrEmpty(l.bedrooms),
        bathrooms: nOrEmpty(l.bathrooms),
        home_sqft: nOrEmpty(l.home_sqft),
        lot_size: nOrEmpty(l.lot_size),
        lot_unit: (l.lot_unit as 'sqft' | 'acre') || 'sqft',
        garage: nOrEmpty(l.garage),
      };
    });
    setEdit(seed);

    setLoading(false);
  }

  const onEdit = (id: string, patch: Partial<Editable>) =>
    setEdit((e) => ({ ...e, [id]: { ...e[id], ...patch } }));

  const saveRow = async (l: Listing) => {
    const e = edit[l.id];
    if (!e) return;
    setSavingId(l.id);
    setError(null);

    const payload = {
      price: safeNumOrNull(e.price) ?? l.price,
      arv: safeNumOrNull(e.arv),
      repairs: safeNumOrNull(e.repairs),
      status: e.status,
      description: e.description.trim() || null,
      bedrooms: safeNumOrNull(e.bedrooms),
      bathrooms: safeNumOrNull(e.bathrooms),
      home_sqft: safeNumOrNull(e.home_sqft),
      lot_size: safeNumOrNull(e.lot_size),
      lot_unit: (e.lot_size.trim() ? e.lot_unit : null) as 'sqft' | 'acre' | null,
      garage: safeNumOrNull(e.garage),
    };

    const { error } = await supabase.from('listings').update(payload).eq('id', l.id);
    if (error) setError(error.message);

    const { data } = await supabase.from('listings').select('*').eq('id', l.id).single();
    if (data) {
      setRows((rows) => rows.map((r) => (r.id === l.id ? { ...r, ...(data as unknown as Listing) } : r)));
    }
    setSavingId(null);
  };

  const markSold = async (l: Listing) => {
    setSavingId(l.id);
    setError(null);
    const { error } = await supabase.from('listings').update({ status: 'sold' }).eq('id', l.id);
    if (error) setError(error.message);
    else {
      setRows((rows) => rows.map((r) => (r.id === l.id ? { ...r, status: 'sold' } : r)));
      onEdit(l.id, { status: 'sold' });
    }
    setSavingId(null);
  };

  const deleteRow = async (l: Listing) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    setDeletingId(l.id);
    setError(null);
    const { error } = await supabase.from('listings').delete().eq('id', l.id);
    if (error) setError(error.message);
    else setRows((rows) => rows.filter((r) => r.id !== l.id));
    setDeletingId(null);
  };

  const storagePathFromPublicUrl = (url: string) => {
    const marker = '/storage/v1/object/public/listing-images/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length);
  };

  const addPhoto = async (l: Listing, file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Only images are allowed.');
      return;
    }
    const maxMB = 15;
    if (file.size > maxMB * 1024 * 1024) {
      setError(`File is too large. Max ${maxMB} MB.`);
      return;
    }

    setAddingPhotoId(l.id);
    setUploadPct(0);
    setError(null);

    try {
      const ext = extOf(file.name) || 'jpg';
      const fileName = `listing-${l.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      setUploadPct(25);
      const { error: upErr } = await supabase
        .storage
        .from('listing-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;

      setUploadPct(60);
      const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(fileName);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error('Could not resolve public URL for image');

      setUploadPct(85);
      const { data: inserted, error: rpcErr } = await supabase.rpc(
        'fn_add_listing_image',
        { p_listing_id: l.id, p_url: publicUrl }
      );
      if (rpcErr) throw rpcErr;

      const newArray = Array.isArray(inserted) ? inserted : [];
      if (newArray.length > 0) {
        const first = newArray[0] as { id: string; listing_id: string; url: string };
        setRows((rows) =>
          rows.map((r) =>
            r.id === l.id ? { ...r, images: [...(r.images || []), { id: first.id, url: first.url }] } : r
          )
        );
      }

      setUploadPct(100);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || 'Image upload failed');
    } finally {
      setAddingPhotoId(null);
      setTimeout(() => setUploadPct(0), 600);
    }
  };

  const removePhoto = async (l: Listing, imgId: string, url: string) => {
    if (!confirm('Remove this photo?')) return;
    setAddingPhotoId(l.id);
    setError(null);

    const { error } = await supabase.from('listing_images').delete().eq('id', imgId);
    if (error) {
      setError(error.message);
      setAddingPhotoId(null);
      return;
    }

    const path = storagePathFromPublicUrl(url);
    if (path) {
      await supabase.storage.from('listing-images').remove([path]);
    }

    setRows((rows) =>
      rows.map((r) =>
        r.id === l.id ? { ...r, images: (r.images || []).filter((im) => im.id !== imgId) } : r
      )
    );
    setAddingPhotoId(null);
  };

  const makePrimary = async (l: Listing, url: string) => {
    setSavingId(l.id);
    setError(null);
    const { error } = await supabase.from('listings').update({ image_url: url }).eq('id', l.id);
    if (error) setError(error.message);
    else {
      setRows((rows) => rows.map((r) => (r.id === l.id ? { ...r, image_url: url } : r)));
    }
    setSavingId(null);
  };

  const hasRows = useMemo(() => rows.length > 0, [rows]);

  return (
    <main style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: 16 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>My Listings</h1>
          <Link
            href="/"
            aria-label="Back to Deals"
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              background: '#0b0f1a',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.12)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            ← Back to Deals
          </Link>
        </div>

        <p style={{ color: '#9ca3af', marginTop: 6 }}>
          Edit price, ARV, repairs, description, specs — add/remove photos — or delete a listing.
        </p>

        {error ? <div style={errBox}>{error}</div> : null}

        {loading ? (
          <div style={{ marginTop: 12, opacity: 0.85 }}>Loading…</div>
        ) : !hasRows ? (
          <div style={{ marginTop: 12, opacity: 0.85 }}>No listings yet.</div>
        ) : (
          <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
            {rows.map((l) => {
              const e = edit[l.id];
              return (
                <section key={l.id} style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>
                        {l.address}{l.city ? `, ${l.city}` : ''}{l.state ? `, ${l.state}` : ''} {l.zip || ''}
                      </div>
                      <div style={{ opacity: 0.8, fontSize: 13 }}>
                        Created {l.created_at ? new Date(l.created_at).toLocaleString() : '—'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => markSold(l)} disabled={savingId === l.id} style={btnSecondary} title="Mark Sold">
                        {savingId === l.id ? 'Saving…' : 'Mark Sold'}
                      </button>
                      <button onClick={() => deleteRow(l)} disabled={deletingId === l.id} style={btnDanger} title="Delete">
                        {deletingId === l.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  {/* price + ARV + repairs + status */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 12 }}>
                    <div><Label>Price</Label><Input value={e?.price ?? ''} onChange={(ev) => onEdit(l.id, { price: ev.target.value })} inputMode="numeric" /></div>
                    <div><Label>ARV</Label><Input value={e?.arv ?? ''} onChange={(ev) => onEdit(l.id, { arv: ev.target.value })} inputMode="numeric" /></div>
                    <div><Label>Repairs</Label><Input value={e?.repairs ?? ''} onChange={(ev) => onEdit(l.id, { repairs: ev.target.value })} inputMode="numeric" /></div>
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={e?.status ?? 'live'}
                        onChange={(ev) => onEdit(l.id, { status: ev.target.value as Editable['status'] })}
                        options={[{ value: 'live', label: 'Live' }, { value: 'draft', label: 'Draft' }, { value: 'sold', label: 'Sold' }]}
                      />
                    </div>
                  </div>

                  {/* specs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}>
                    <div><Label>Bedrooms</Label><Input value={e?.bedrooms ?? ''} onChange={(ev) => onEdit(l.id, { bedrooms: ev.target.value })} inputMode="numeric" /></div>
                    <div><Label>Bathrooms</Label><Input value={e?.bathrooms ?? ''} onChange={(ev) => onEdit(l.id, { bathrooms: ev.target.value })} inputMode="numeric" /></div>
                    <div><Label>Home Sq Ft</Label><Input value={e?.home_sqft ?? ''} onChange={(ev) => onEdit(l.id, { home_sqft: ev.target.value })} inputMode="numeric" /></div>
                    <div><Label>Lot Size</Label><Input value={e?.lot_size ?? ''} onChange={(ev) => onEdit(l.id, { lot_size: ev.target.value })} inputMode="numeric" /></div>
                    <div>
                      <Label>Lot Unit</Label>
                      <Select
                        value={e?.lot_unit ?? 'sqft'}
                        onChange={(ev) => onEdit(l.id, { lot_unit: ev.target.value as 'sqft' | 'acre' })}
                        options={[{ value: 'sqft', label: 'Sq Ft' }, { value: 'acre', label: 'Acre' }]}
                      />
                    </div>
                    <div><Label>Garage (spaces)</Label><Input value={e?.garage ?? ''} onChange={(ev) => onEdit(l.id, { garage: ev.target.value })} inputMode="numeric" /></div>
                  </div>

                  {/* description */}
                  <div style={{ marginTop: 10 }}>
                    <Label>Description</Label>
                    <Textarea value={e?.description ?? ''} onChange={(ev) => onEdit(l.id, { description: ev.target.value })} rows={4} />
                  </div>

                  {/* images */}
                  <div style={{ marginTop: 10 }}>
                    <Label>Images</Label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {l.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={l.image_url} alt="" style={{ ...thumbImg, outline: '2px solid #0ea5e9' }} />
                      ) : (
                        <span style={{ opacity: 0.6, fontSize: 13 }}>No primary image</span>
                      )}
                      {(l.images || []).map((im) => (
                        <div key={im.id} style={{ position: 'relative' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={im.url} alt="" style={thumbImg} />
                          <div style={{ position: 'absolute', left: 6, bottom: 6, display: 'flex', gap: 6 }}>
                            <button onClick={() => makePrimary(l, im.url)} style={miniBtn} title="Set as primary">Set primary</button>
                            <button onClick={() => removePhoto(l, im.id, im.url)} style={miniDanger} title="Remove photo">×</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={addingPhotoId === l.id}
                        onChange={async (ev) => {
                          const input = ev.currentTarget;
                          const files = Array.from(input.files || []);
                          input.value = '';
                          for (const file of files) {
                            await addPhoto(l, file);
                          }
                        }}
                      />
                      {addingPhotoId === l.id ? (
                        <span style={{ marginLeft: 8, opacity: 0.9 }}>
                          Uploading… {uploadPct ? `${uploadPct}%` : ''}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* save */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => saveRow(l)}
                      disabled={savingId === l.id}
                      style={{ ...btnPrimary, opacity: savingId === l.id ? 0.7 : 1, cursor: savingId === l.id ? 'not-allowed' : 'pointer' }}
                      title="Save changes"
                    >
                      {savingId === l.id ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

/* ---------- UI bits ---------- */
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
function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }
) {
  const { options, style, ...rest } = props;
  const base: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #334155', borderRadius: 10, background: '#0b1220', color: '#fff', outline: 'none', appearance: 'none' };
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

/* ---------- helpers ---------- */
function nOrEmpty(n: number | null): string {
  return typeof n === 'number' && Number.isFinite(n) ? String(n) : '';
}
function safeNumOrNull(v: string): number | null {
  const t = v?.trim?.() ?? '';
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
function extOf(name: string) {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/* ---------- styles ---------- */
const card: React.CSSProperties = { background: '#111827', border: '1px solid #27272a', borderRadius: 12, padding: 12 };
const errBox: React.CSSProperties = { background: '#7f1d1d', color: '#fecaca', border: '1px solid #991b1b', padding: '10px 12px', borderRadius: 10, marginTop: 12 };
const btnPrimary: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, background: '#0ea5e9', color: '#fff', border: '0', fontWeight: 700 };
const btnSecondary: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, background: '#0b1220', color: '#fff', border: '1px solid #334155', fontWeight: 700 };
const btnDanger: React.CSSProperties = { padding: '10px 14px', borderRadius: 10, background: '#7f1d1d', color: '#fff', border: '1px solid #991b1b', fontWeight: 700 };
const thumbImg: React.CSSProperties = { width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #27272a', background: '#0b0f1a' };
const miniBtn: React.CSSProperties = { padding: '2px 6px', borderRadius: 6, border: '1px solid #334155', background: '#0b1220', color: '#fff', fontSize: 12, cursor: 'pointer' };
const miniDanger: React.CSSProperties = { padding: '2px 6px', borderRadius: 6, border: '1px solid #991b1b', background: '#7f1d1d', color: '#fff', fontSize: 12, cursor: 'pointer' };
