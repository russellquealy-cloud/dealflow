// /app/components/CreateListingForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Props = { ownerId: string };

const card: React.CSSProperties = { border: "1px solid #eee", borderRadius: 12, background: "#fff", padding: 16, display: "grid", gap: 12 };
const row: React.CSSProperties = { display: "grid", gap: 6 };
const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#444" };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" };
const area: React.CSSProperties = { ...input, minHeight: 100 } as React.CSSProperties;
const actions: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 };
const btnPrimary: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 10, padding: "10px 14px", fontWeight: 800, background: "#111", color: "#fff", cursor: "pointer" };
const btn: React.CSSProperties = { ...btnPrimary, background: "#fff", color: "#111" };

export default function CreateListingForm({ ownerId }: Props) {
  const router = useRouter();
  const [form, setForm] = React.useState({
    title: "", address: "", city: "", state: "", zip: "",
    price: "", beds: "", baths: "", sqft: "", lot_size: "",
    description: "", contact_phone: "", contact_email: "",
  });
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [saving, setSaving] = React.useState(false);
  const bucket = process.env.NEXT_PUBLIC_LISTING_IMAGES_BUCKET;

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    // Upload images (optional)
    const imagePaths: string[] = [];
    if (files && files.length > 0) {
      if (!bucket) {
        alert("Missing NEXT_PUBLIC_LISTING_IMAGES_BUCKET");
        setSaving(false);
        return;
      }
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${ownerId}/${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
        if (upErr) {
          setSaving(false);
          alert(`Upload failed: ${upErr.message}`);
          return;
        }
        imagePaths.push(path);
      }
    }

    function toNum(v: unknown): number | undefined {
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (typeof v === 'string') {
    const n = Number(v.replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

  return (
    <form onSubmit={onSubmit} style={card}>
      <div style={row}><label style={label}>Title</label><input style={input} name="title" value={form.title} onChange={onChange} placeholder="123 Main St wholesale deal" /></div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1.2fr 0.8fr 0.6fr 0.6fr" }}>
        <div style={row}><label style={label}>Address</label><input style={input} name="address" value={form.address} onChange={onChange} /></div>
        <div style={row}><label style={label}>City</label><input style={input} name="city" value={form.city} onChange={onChange} /></div>
        <div style={row}><label style={label}>State</label><input style={input} name="state" value={form.state} onChange={onChange} /></div>
        <div style={row}><label style={label}>ZIP</label><input style={input} name="zip" value={form.zip} onChange={onChange} /></div>
      </div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
        <div style={row}><label style={label}>Price</label><input style={input} name="price" value={form.price} onChange={onChange} inputMode="numeric" /></div>
        <div style={row}><label style={label}>Beds</label><input style={input} name="beds" value={form.beds} onChange={onChange} inputMode="numeric" /></div>
        <div style={row}><label style={label}>Baths</label><input style={input} name="baths" value={form.baths} onChange={onChange} inputMode="numeric" /></div>
        <div style={row}><label style={label}>Sq Ft</label><input style={input} name="sqft" value={form.sqft} onChange={onChange} inputMode="numeric" /></div>
      </div>

      <div style={row}><label style={label}>Lot Size (sq ft or acres)</label><input style={input} name="lot_size" value={form.lot_size} onChange={onChange} inputMode="numeric" /></div>

      <div style={row}><label style={label}>Description</label><textarea style={area} name="description" value={form.description} onChange={onChange} placeholder="Notes about the property, timeline, assignment, etc." /></div>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
        <div style={row}><label style={label}>Contact Phone</label><input style={input} name="contact_phone" value={form.contact_phone} onChange={onChange} inputMode="tel" placeholder="+15205551234" /></div>
        <div style={row}><label style={label}>Contact Email</label><input style={input} name="contact_email" value={form.contact_email} onChange={onChange} inputMode="email" placeholder="you@example.com" /></div>
      </div>

      <div style={row}>
        <label style={label}>Photos</label>
        <input type="file" accept="image/*" multiple capture="environment" onChange={(e) => setFiles(e.target.files)} style={input} />
      </div>

      <div style={actions}>
        <button type="submit" style={btnPrimary} disabled={saving}>{saving ? "Saving…" : "Create Listing"}</button>
        <button type="button" style={btn} onClick={() => history.back()}>Cancel</button>
      </div>
    </form>
  );
}

function s(v: string) { const t = v.trim(); return t === "" ? null : t; }
function n(v: string) { const x = Number(v); return Number.isFinite(x) ? x : null; }
function digitsOrPlus(s: string) { return s.replace(/[^\d+]/g, ""); }
