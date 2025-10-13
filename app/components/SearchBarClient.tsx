'use client';

import { useState } from 'react';

export default function SearchBarClient() {
  const [q, setQ] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    window.dispatchEvent(new CustomEvent('df:geocode', { detail: { q: query } }));
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search city or address"
        className="w-80 rounded-md border px-3 py-2"
      />
      <button type="submit" className="rounded-md bg-black px-3 py-2 text-white hover:opacity-90">
        Search
      </button>
    </form>
  );
}
