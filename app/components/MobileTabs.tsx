'use client';

type Tab = 'list' | 'map';

export default function MobileTabs({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
      {(['list', 'map'] as Tab[]).map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            flex: 1,
            padding: '10px 0',
            background: active === t ? '#0ea5e9' : '#fff',
            color: active === t ? '#fff' : '#111',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {t === 'list' ? 'Listings' : 'Map'}
        </button>
      ))}
    </div>
  );
}
