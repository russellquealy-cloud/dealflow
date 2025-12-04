'use client';

import Link from 'next/link';

// Force dynamic rendering to prevent prerendering issues
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
        404
      </h1>
      <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
        Page Not Found
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        style={{
          padding: '12px 24px',
          backgroundColor: '#3b82f6',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '500',
          display: 'inline-block'
        }}
      >
        Go back home
      </Link>
    </div>
  );
}

