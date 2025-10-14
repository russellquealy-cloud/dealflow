'use client';
import React from 'react';

export type Opt = string | number;

export default function MinMaxSelect({
  label,
  options,
  minValue,
  maxValue,
  onChange,
}: {
  label: string;
  options: Opt[];
  minValue?: Opt;
  maxValue?: Opt;
  onChange: (v: { min?: Opt; max?: Opt }) => void;
}) {
  const styles: Record<string, React.CSSProperties> = {
    wrap: { display: 'flex', gap: 8, alignItems: 'center' },
    sel: { padding: 8, border: '1px solid #d1d5db', borderRadius: 8 },
  };

  return (
    <div style={styles.wrap}>
      <span style={{ width: 110 }}>{label}</span>

      <select
        style={styles.sel}
        value={minValue === undefined ? '' : String(minValue)}
        onChange={(e) =>
          onChange({ min: e.target.value === '' ? undefined : (isNaN(+e.target.value) ? e.target.value : +e.target.value) })
        }
      >
        <option value="">Min</option>
        {options.map((o, i) => (
          <option key={i} value={String(o)}>
            {String(o)}
          </option>
        ))}
      </select>

      <select
        style={styles.sel}
        value={maxValue === undefined ? '' : String(maxValue)}
        onChange={(e) =>
          onChange({ max: e.target.value === '' ? undefined : (isNaN(+e.target.value) ? e.target.value : +e.target.value) })
        }
      >
        <option value="">Max</option>
        {options.map((o, i) => (
          <option key={i} value={String(o)}>
            {String(o)}
          </option>
        ))}
      </select>
    </div>
  );
}
