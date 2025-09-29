// app/components/Header.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Header() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
    })();
  }, []);

  return (
    <header
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        background: '#0f172a',
        color: '#fff',
        borderBottom: '1px solid #27272a',
      }}
    >
      <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link href="/" style={navBtn}>Deals</Link>
        <Link href="/post" style={navBtn}>Post Deal</Link>
        <Link href="/listings" style={navBtn}>My Listings</Link>
        <Link href="/login" style={navBtn}>Login</Link>
      </nav>
      <div style={{ opacity: 0.9, fontSize: 13 }}>
        {email ? `Signed in as ${email}` : 'Not signed in'}
      </div>
    </header>
  );
}

const navBtn: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 10,
  background: '#0b1220',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.12)',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 14,
};
