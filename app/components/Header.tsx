// app/components/Header.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

type UserBits = {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
};

const headerStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  width: '100%',
  backgroundColor: '#111827',
  borderBottom: '1px solid #1f2937',
};
const headerInnerStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};
const brandStyle: React.CSSProperties = {
  color: '#ffffff',
  textDecoration: 'none',
  fontSize: 18,
  fontWeight: 600,
  letterSpacing: 0.3,
};
const navStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  alignItems: 'center',
};
const navBlockStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px 12px',
  borderRadius: 10,
  textDecoration: 'none',
  backgroundColor: '#0b0f1a',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 600,
  border: '1px solid rgba(255,255,255,0.12)',
};
const greetingStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  borderRadius: 10,
  backgroundColor: '#0b0f1a',
  color: '#ffffff',
  border: '1px solid rgba(255,255,255,0.12)',
  fontSize: 14,
  fontWeight: 600,
};
const btnGhost: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 10,
  background: '#0b1220',
  color: '#fff',
  border: '1px solid #334155',
  fontWeight: 700,
  cursor: 'pointer',
};

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<UserBits | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ? extractBits(data.user) : null);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUser(session?.user ? extractBits(session.user) : null);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/'); // back to Deals
  }

  const isAuthed = !!user?.id;
  const displayName = user?.name || user?.email || user?.phone || 'Account';

  return (
    <header style={headerStyle}>
      <div style={headerInnerStyle}>
        <Link href="/" style={brandStyle} aria-label="DealFlow Home">
          DealFlow
        </Link>

        <nav style={navStyle} aria-label="Primary">
          <Link href="/post" style={navBlockStyle}>Post Deal</Link>
          <Link href="/listings" style={navBlockStyle}>My Listings</Link>
          <Link href="/" style={navBlockStyle}>Deals</Link>

          {!isAuthed ? (
            <Link href="/login" style={navBlockStyle}>Login</Link>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={greetingStyle}>Hi, {displayName}</span>
              <button onClick={signOut} style={btnGhost} title="Sign out">Sign out</button>
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}

function extractBits(u: any): UserBits {
  const name =
    u?.user_metadata?.full_name ||
    u?.user_metadata?.name ||
    u?.user_metadata?.preferred_username ||
    null;
  return {
    id: u?.id,
    email: u?.email ?? null,
    phone: u?.phone ?? null,
    name,
  };
}
