// app/components/FiltersBar.tsx
'use client';

import * as React from 'react';

export type Filters = {
  minBeds: number | null;  maxBeds: number | null;
  minBaths: number | null; maxBaths: number | null;
  minPrice: number | null; maxPrice: number | null;
  minSqft: number | null;  maxSqft: number | null;
  sortBy: string;
};

type Props = { value: Filters; onChange: (f: Filters) => void };

type Opt = { label: string; value: number };

const labelCss: React.CSSProperties = { fontSize: 12, color: '#475569', marginBottom: 4 };
const selectCss: React.CSSProperties = { width: '100%', height: 36, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 8px' };

// “+” caps included
const bedOptions: Opt[]  = [1,2,3,4,5,6,7].map((n,i,a)=>({ label: i===a.length-1?`${n}+`:`${n}`, value: n }));
const bathOptions: Opt[] = [1,1.5,2,2.5,3,3.5,4,5].map((n,i,a)=>({ label: i===a.length-1?`${n}+`:`${n}`, value: n }));
const priceOptions: Opt[] = [25000,50000,75000,100000,125000,150000,175000,200000,250000,300000,400000,500000,750000,1000000,1500000,2000000]
  .map((n,i,a)=>({ label: i>=a.length-2 ? `${n.toLocaleString()}+` : n.toLocaleString(), value: n }));
const sqftOptions: Opt[]  = [500,750,1000,1250,1500,1750,2000,2500,3000,4000,5000].map((n,i,a)=>({ label: i===a.length-1?`${n.toLocaleString()}+`:`${n.toLocaleString()}`, value: n }));

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price ↑', value: 'price_asc' },
  { label: 'Price ↓', value: 'price_desc' },
  { label: 'Sqft ↑', value: 'sqft_asc' },
  { label: 'Sqft ↓', value: 'sqft_desc' },
];

function NumberSelect({
  label, value, options, onChange,
}: { label: string; value: number | null; options: Opt[]; onChange: (v: number | null) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <span style={labelCss}>{label}</span>
      <select
        style={selectCss}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      >
        <option value="">Any</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function SortSelect({
  label, value, options, onChange,
}: { label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <span style={labelCss}>{label}</span>
      <select
        style={selectCss}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export default function FiltersBar({ value, onChange }: Props) {
  const set = (p: Partial<Filters>) => onChange({ ...value, ...p });
  const [open, setOpen] = React.useState(false);

  const desktop = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, minmax(160px, 1fr))', gap: 12 }}>
      <NumberSelect label="Min Beds (1+)" value={value.minBeds} options={bedOptions} onChange={(v) => set({ minBeds: v })} />
      <NumberSelect label="Max Beds"         value={value.maxBeds} options={bedOptions} onChange={(v) => set({ maxBeds: v })} />
      <NumberSelect label="Min Baths (1+)"  value={value.minBaths} options={bathOptions} onChange={(v) => set({ minBaths: v })} />
      <NumberSelect label="Max Baths"        value={value.maxBaths} options={bathOptions} onChange={(v) => set({ maxBaths: v })} />
      <NumberSelect label="Min Price"        value={value.minPrice} options={priceOptions} onChange={(v) => set({ minPrice: v })} />
      <NumberSelect label="Max Price"        value={value.maxPrice} options={priceOptions} onChange={(v) => set({ maxPrice: v })} />
      <NumberSelect label="Min Sqft"         value={value.minSqft} options={sqftOptions} onChange={(v) => set({ minSqft: v })} />
      <NumberSelect label="Max Sqft"         value={value.maxSqft} options={sqftOptions} onChange={(v) => set({ maxSqft: v })} />
      <SortSelect label="Sort" value={value.sortBy} options={sortOptions} onChange={(v) => set({ sortBy: v })} />
    </div>
  );

  const mobile = (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen((v) => !v)} style={{ height: 40, border: '1px solid #cbd5e1', borderRadius: 10, width: '100%' }} aria-expanded={open}>
        Filters
      </button>
      {open && (
        <div
          style={{ position: 'absolute', zIndex: 30, top: 46, left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 12, display: 'grid', gap: 10 }}
        >
          <NumberSelect label="Min Beds (1+)" value={value.minBeds} options={bedOptions} onChange={(v) => set({ minBeds: v })} />
          <NumberSelect label="Max Beds"         value={value.maxBeds} options={bedOptions} onChange={(v) => set({ maxBeds: v })} />
          <NumberSelect label="Min Baths (1+)"  value={value.minBaths} options={bathOptions} onChange={(v) => set({ minBaths: v })} />
          <NumberSelect label="Max Baths"        value={value.maxBaths} options={bathOptions} onChange={(v) => set({ maxBaths: v })} />
          <NumberSelect label="Min Price"        value={value.minPrice} options={priceOptions} onChange={(v) => set({ minPrice: v })} />
          <NumberSelect label="Max Price"        value={value.maxPrice} options={priceOptions} onChange={(v) => set({ maxPrice: v })} />
          <NumberSelect label="Min Sqft"         value={value.minSqft} options={sqftOptions} onChange={(v) => set({ minSqft: v })} />
          <NumberSelect label="Max Sqft"         value={value.maxSqft} options={sqftOptions} onChange={(v) => set({ maxSqft: v })} />
          <SortSelect label="Sort" value={value.sortBy} options={sortOptions} onChange={(v) => set({ sortBy: v })} />
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="hidden md:block">{desktop}</div>
      <div className="md:hidden">{mobile}</div>
    </>
  );
}
