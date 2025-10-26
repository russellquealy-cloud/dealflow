'use client';

import { useState, useEffect } from 'react';

interface SearchBarClientProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function SearchBarClient({ value = '', onChange, placeholder = 'Search city or address' }: SearchBarClientProps) {
  const [q, setQ] = useState(value);

  useEffect(() => {
    setQ(value);
  }, [value]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    window.dispatchEvent(new CustomEvent('df:geocode', { detail: { q: query } }));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setQ(newValue);
    if (onChange) {
      onChange(newValue);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <input
        value={q}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-80 rounded-md border px-3 py-2"
      />
      <button type="submit" className="rounded-md bg-black px-3 py-2 text-white hover:opacity-90">
        Search
      </button>
    </form>
  );
}
