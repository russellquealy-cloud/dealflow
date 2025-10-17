'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function LocationSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = React.useState('');

  const submit = () => {
    const s = new URLSearchParams(params ? params.toString() : '');
    if (q.trim()) s.set('q', q.trim());
    router.push(`${pathname}?${s.toString()}`);
  };

  const resetView = () => {
    const s = new URLSearchParams(params ? params.toString() : '');
    s.delete('bbox'); // clear drawn box
    router.push(`${pathname}?${s.toString()}`);
  };

  return (
    <div className="flex gap-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search city or address"
        className="border rounded px-3 py-2 w-[360px]"
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <button className="border px-3 rounded" onClick={submit}>
        Search
      </button>
      <button className="border px-3 rounded" onClick={resetView}>
        Reset view
      </button>
    </div>
  );
}
