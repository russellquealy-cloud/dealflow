'use client';
import MinMaxSelect from './MinMaxSelect';
import { price, beds, baths, sqft } from '@/lib/filterOptions';

type Opt = string | number;
type Filters = {
  minBeds?: Opt; maxBeds?: Opt;
  minBaths?: Opt; maxBaths?: Opt;
  minPrice?: Opt; maxPrice?: Opt;
  minSqft?: Opt; maxSqft?: Opt;
};
export default function FiltersBar({
  value, onChange
}: {
  value: Filters;
  onChange: (v: Filters) => void;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MinMaxSelect label="Min Beds (1+)" options={beds}
        minValue={value.minBeds} onChange={(v)=>set({minBeds:v.min})} />
      <MinMaxSelect label="Max Beds" options={beds}
        maxValue={value.maxBeds} onChange={(v)=>set({maxBeds:v.max})} />
      <MinMaxSelect label="Min Baths (1+)" options={baths}
        minValue={value.minBaths} onChange={(v)=>set({minBaths:v.min})} />
      <MinMaxSelect label="Max Baths" options={baths}
        maxValue={value.maxBaths} onChange={(v)=>set({maxBaths:v.max})} />
      <MinMaxSelect label="Min Price" options={price}
        minValue={value.minPrice} onChange={(v)=>set({minPrice:v.min})} />
      <MinMaxSelect label="Max Price" options={price}
        maxValue={value.maxPrice} onChange={(v)=>set({maxPrice:v.max})} />
      <MinMaxSelect label="Min SqFt" options={sqft}
        minValue={value.minSqft} onChange={(v)=>set({minSqft:v.min})} />
      <MinMaxSelect label="Max SqFt" options={sqft}
        maxValue={value.maxSqft} onChange={(v)=>set({maxSqft:v.max})} />
    </div>
  );
}
