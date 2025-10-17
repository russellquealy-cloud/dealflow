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
  onChange: (v: Filters) => void;
};

const bedOptions = [1, 2, 3, 4, 5, 6];
const bathOptions = [1, 2, 3, 4, 5];
const priceOptions = [50000, 100000, 150000, 200000, 300000, 400000, 500000, 750000, 1000000];
const sqftOptions = [500, 750, 1000, 1250, 1500, 2000, 2500, 3000, 4000];

function NumberSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number | null;
  options: number[];
  onChange: (v: number | null) => void;
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="border rounded px-3 py-2"
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o.toLocaleString()}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function FiltersBar({ value, onChange }: Props) {
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <NumberSelect
        label="Min Beds (1+)"
        value={value.minBeds}
        options={bedOptions}
        onChange={(v) => set({ minBeds: v })}
      />
      <NumberSelect
        label="Max Beds"
        value={value.maxBeds}
        options={bedOptions}
        onChange={(v) => set({ maxBeds: v })}
      />
      <NumberSelect
        label="Min Baths (1+)"
        value={value.minBaths}
        options={bathOptions}
        onChange={(v) => set({ minBaths: v })}
      />
      <NumberSelect
        label="Max Baths"
        value={value.maxBaths}
        options={bathOptions}
        onChange={(v) => set({ maxBaths: v })}
      />
      <NumberSelect
        label="Min Price"
        value={value.minPrice}
        options={priceOptions}
        onChange={(v) => set({ minPrice: v })}
      />
      <NumberSelect
        label="Max Price"
        value={value.maxPrice}
        options={priceOptions}
        onChange={(v) => set({ maxPrice: v })}
      />
      <NumberSelect
        label="Min Sqft"
        value={value.minSqft}
        options={sqftOptions}
        onChange={(v) => set({ minSqft: v })}
      />
      <NumberSelect
        label="Max Sqft"
        value={value.maxSqft}
        options={sqftOptions}
        onChange={(v) => set({ maxSqft: v })}
      />
    </div>
  );
}
