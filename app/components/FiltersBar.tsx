'use client';
import MinMaxSelect, { Opt } from './MinMaxSelect';
import { price, beds, baths, sqft } from '@/lib/filterOptions';

export type Filters = {
  minBeds?: Opt; maxBeds?: Opt;
  minBaths?: Opt; maxBaths?: Opt;
  minPrice?: Opt; maxPrice?: Opt;
  minSqft?: Opt; maxSqft?: Opt;
};

export default function FiltersBar({
  value,
  onChange,
}: {
  value: Filters;
  onChange: (v: Filters) => void;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      <MinMaxSelect
        label="Beds"
        options={beds}
        minValue={value.minBeds}
        maxValue={value.maxBeds}
        onChange={(v) => set({ minBeds: v.min, maxBeds: v.max })}
      />
      <MinMaxSelect
        label="Baths"
        options={baths}
        minValue={value.minBaths}
        maxValue={value.maxBaths}
        onChange={(v) => set({ minBaths: v.min, maxBaths: v.max })}
      />
      <MinMaxSelect
        label="Price ($)"
        options={price}
        minValue={value.minPrice}
        maxValue={value.maxPrice}
        onChange={(v) => set({ minPrice: v.min, maxPrice: v.max })}
      />
      <MinMaxSelect
        label="Sq Ft"
        options={sqft}
        minValue={value.minSqft}
        maxValue={value.maxSqft}
        onChange={(v) => set({ minSqft: v.min, maxSqft: v.max })}
      />
    </div>
  );
}
