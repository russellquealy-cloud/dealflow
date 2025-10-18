'use client';

import * as React from 'react';

const label: React.CSSProperties = { fontSize: 12, color: '#475569', marginBottom: 4 };
const select: React.CSSProperties = { width: '100%', height: 36, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 8px' };

const price = [ '', 25000, 50000, 75000, 100000, 125000, 150000, 175000, 200000, 250000, 300000, 400000, 500000, 750000, 1000000 ];
const sqft  = [ '', 500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000 ];
const beds  = [ '', 1, 2, 3, 4, 5, 6 ];
const baths = [ '', 1, 1.5, 2, 2.5, 3, 3.5, 4 ];

export default function FiltersBar() {
  // Wire into your store/query.
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* desktop: equal widths */}
      <div className="hidden md:grid" style={{ gridTemplateColumns: 'repeat(8, minmax(140px, 1fr))', gap: 12 }}>
        <Field label="Min Beds (1+)"><Select options={beds} /></Field>
        <Field label="Max Beds"><Select options={beds} /></Field>
        <Field label="Min Baths (1+)"><Select options={baths} /></Field>
        <Field label="Max Baths"><Select options={baths} /></Field>
        <Field label="Min Price"><Select options={price} format /></Field>
        <Field label="Max Price"><Select options={price} format /></Field>
        <Field label="Min Sqft"><Select options={sqft} /></Field>
        <Field label="Max Sqft"><Select options={sqft} /></Field>
      </div>

      {/* mobile: one button -> dropdown */}
      <div className="md:hidden" style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{ height: 40, border: '1px solid #cbd5e1', borderRadius: 10, width: '100%' }}
        >
          Filters
        </button>

        {open && (
          <div
            style={{
              position: 'absolute',
              zIndex: 20,
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
            <Field label="Min Beds (1+)"><Select options={beds} /></Field>
            <Field label="Max Beds"><Select options={beds} /></Field>
            <Field label="Min Baths (1+)"><Select options={baths} /></Field>
            <Field label="Max Baths"><Select options={baths} /></Field>
            <Field label="Min Price"><Select options={price} format /></Field>
            <Field label="Max Price"><Select options={price} format /></Field>
            <Field label="Min Sqft"><Select options={sqft} /></Field>
            <Field label="Max Sqft"><Select options={sqft} /></Field>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label: text, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <span style={label}>{text}</span>
      {children}
    </label>
  );
}

function Select({ options, format = false }: { options: (number | '')[]; format?: boolean }) {
  return (
    <select style={select} defaultValue="">
      <option value="">{'Any'}</option>
      {options
        .filter((v) => v !== '')
        .map((v) => (
          <option key={String(v)} value={String(v)}>
            {format && typeof v === 'number' ? v.toLocaleString() : String(v)}
          </option>
        ))}
    </select>
  );
}
