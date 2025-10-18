'use client';

import React from 'react';
import Link from 'next/link';

export default function BrowsePage() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Browse Properties</h1>
      <p>This is a placeholder browse page. You can customize this later.</p>
      <Link href="/listings" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>
        ← Back to Listings
      </Link>
    </div>
  );
}