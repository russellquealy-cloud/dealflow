'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function LocationSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = React.useState('');

  // Helper: make a mutable copy of current query params (handles null safely)
  const cloneParams = () =>
    new URLSearchParams(params ? Array.from(params.entries()) : []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    // If user pasted a bbox like "south,west,north,east"
    const raw = q.trim();
    const bb = raw.includes(',') ? raw.split(',') : null;

    if (bb && bb.length === 4) {
      const south = parseFloat(bb[0]);
      const west  = parseFloat(bb[1]);
      const north = parseFloat(bb[2]);
      const east  = parseFloat(bb[3]);

      if ([south, west, north, east].every(Number.isFinite)) {
        const s = cloneParams();
        s.set('bbox', [south, west, north, east].join(','));
        router.push(`${pathname}?${s.toString()}`);
        return;
      }
    }

    // Otherwise, dispatch to MapViewClient geocoder (it listens for 'df:geocode')
    window.dispatchEvent(new CustomEvent('df:geocode', { detail: { q: raw } }));
  };

  const clear = () => {
    const s = cloneParams();
    s.delete('bbox');
    router.push(`${pathname}?${s.toString()}`);
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="flex-1 rounded border px-3 py-2"
        placeholder='Search city/zip or "south,west,north,east" bbox'
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button type="submit" className="rounded border px-3 py-2">Go</button>
      <button type="button" onClick={clear} className="rounded border px-3 py-2">
        Clear
      </button>
    </form>
  );
}
