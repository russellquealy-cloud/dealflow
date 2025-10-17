'use client';

import * as React from 'react';

export default function AIAnalyzer() {
  const [form, setForm] = React.useState({ price: '', arv: '', repairs: '', sqft: '', lot_sqft: '' });
  const [out, setOut] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);

  const run = async () => {
    setBusy(true);
    setOut(null);
    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        price: Number(form.price) || 0,
        arv: Number(form.arv) || 0,
        repairs: Number(form.repairs) || 0,
        sqft: Number(form.sqft) || 0,
        lot_sqft: Number(form.lot_sqft) || 0,
      }),
    });
    setOut(await res.json());
    setBusy(false);
  };

  const Input = (k: keyof typeof form, label: string) => (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
      <input
        className="border rounded px-3 py-2"
        value={form[k]}
        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
        inputMode="numeric"
      />
    </label>
  );

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Input('price', 'Price')}
        {Input('arv', 'ARV')}
        {Input('repairs', 'Repairs')}
        {Input('sqft', 'Sq Ft')}
        {Input('lot_sqft', 'Lot Sq Ft')}
      </div>
      <button className="border rounded px-3 py-2" onClick={run} disabled={busy}>
        {busy ? 'Analyzing…' : 'Run Analyzer'}
      </button>
      {out && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
          <div>Spread: ${out.spread?.toLocaleString?.() ?? out.spread}</div>
          <div>ROI: {out.roi}%</div>
          {out.notes?.length ? (
            <ul style={{ marginTop: 8, color: '#6b7280' }}>
              {out.notes.map((n: string, i: number) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
