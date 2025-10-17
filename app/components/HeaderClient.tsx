'use client';

import Link from 'next/link';
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';

export default function HeaderClient() {
  const pathname = usePathname();
  const user = useUser();
  const supabase = useSupabaseClient();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #e5e7eb',
        background: 'white',
      }}
    >
      <Link href="/listings" style={{ fontWeight: 900 }}>
        Deal Flow
      </Link>

      <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/listings">Browse</Link>
        <Link href="/my-listings">My Listings</Link>

        {/* Always visible: takes unauth users to login first */}
        <Link
          href={user ? '/my-listings/new' : `/login?next=/my-listings/new`}
          className="border px-3 py-1 rounded"
        >
          Post a Deal
        </Link>

        {user ? (
          <form action="/auth/signout" method="post">
  <button type="submit" className="px-3 py-2 rounded hover:opacity-80">
    Sign out
  </button>
</form>

        ) : (
          <Link href={`/login?next=${encodeURIComponent(pathname || '/listings')}`} className="border px-3 py-1 rounded">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
