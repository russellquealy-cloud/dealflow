'use client';

import * as React from 'react';

export type Filters = {
  minBeds: number | null;
  maxBeds: number | null;
  minBaths: number | null;
  maxBaths: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  minSqft: number | null;
  maxSqft: number | null;
};

type Props = {
  value: Filters;
  onChange: (f: Filters) => void;
};

const labelCss: React.CSSProperties = { fontSize: 12, color: '#475569', marginBottom: 4 };
const selectCss: React.CSSProperties = { width: '100%', height: 36, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 8px' };

const bedOptions: number[]  = [1, 2, 3, 4, 5, 6];
const bathOptions: number[] = [1, 1.5, 2, 2.5, 3, 3.5, 4];
const priceOptions: number[] = [25000, 50000, 75000, 100000, 125000, 150000, 175000, 200000, 250000, 300000, 400000, 500000, 750000, 1000000];
const sqftOptions: number[]  = [500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000];

function NumberSelect({
  label,
  value,
  options,
  onChange,
  format = false,
}: {
  label: string;
  value: number | null;
  options: number[];
  onChange: (v: number | null) => void;
  format?: boolean;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <span style={labelCss}>{label}</span>
      <select
        style={selectCss}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {format ? o.toLocaleString() : o}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function FiltersBar({ value, onChange }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });
  const [open, setOpen] = React.useState(false);

  const desktop = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(140px, 1fr))', gap: 12 }}>
      <NumberSelect label="Min Beds (1+)" value={value.minBeds} options={bedOptions} onChange={(v) => set({ minBeds: v })} />
      <NumberSelect label="Max Beds" value={value.maxBeds} options={bedOptions} onChange={(v) => set({ maxBeds: v })} />
      <NumberSelect label="Min Baths (1+)" value={value.minBaths} options={bathOptions} onChange={(v) => set({ minBaths: v })} />
      <NumberSelect label="Max Baths" value={value.maxBaths} options={bathOptions} onChange={(v) => set({ maxBaths: v })} />
      <NumberSelect label="Min Price" value={value.minPrice} options={priceOptions} onChange={(v) => set({ minPrice: v })} format />
      <NumberSelect label="Max Price" value={value.maxPrice} options={priceOptions} onChange={(v) => set({ maxPrice: v })} format />
      <NumberSelect label="Min Sqft" value={value.minSqft} options={sqftOptions} onChange={(v) => set({ minSqft: v })} />
      <NumberSelect label="Max Sqft" value={value.maxSqft} options={sqftOptions} onChange={(v) => set({ maxSqft: v })} />
    </div>
  );

  const mobile = (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ height: 40, border: '1px solid #cbd5e1', borderRadius: 10, width: '100%' }}
        aria-expanded={open}
      >
        Filters
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            zIndex: 30,
            top: 46,
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: 12,
            display: 'grid',
            gap: 10,
          }}
        >
          <NumberSelect label="Min Beds (1+)" value={value.minBeds} options={bedOptions} onChange={(v) => set({ minBeds: v })} />
          <NumberSelect label="Max Beds" value={value.maxBeds} options={bedOptions} onChange={(v) => set({ maxBeds: v })} />
          <NumberSelect label="Min Baths (1+)" value={value.minBaths} options={bathOptions} onChange={(v) => set({ minBaths: v })} />
          <NumberSelect label="Max Baths" value={value.maxBaths} options={bathOptions} onChange={(v) => set({ maxBaths: v })} />
          <NumberSelect label="Min Price" value={value.minPrice} options={priceOptions} onChange={(v) => set({ minPrice: v })} format />
          <NumberSelect label="Max Price" value={value.maxPrice} options={priceOptions} onChange={(v) => set({ maxPrice: v })} format />
          <NumberSelect label="Min Sqft" value={value.minSqft} options={sqftOptions} onChange={(v) => set({ minSqft: v })} />
          <NumberSelect label="Max Sqft" value={value.maxSqft} options={sqftOptions} onChange={(v) => set({ maxSqft: v })} />
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
