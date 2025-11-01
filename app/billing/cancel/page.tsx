'use client';

import Link from 'next/link';

export default function BillingCancelPage() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: '#f9fafb'
    }}>
      <div style={{
        maxWidth: '600px',
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '24px' }}>❌</div>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#1a1a1a',
          marginBottom: '16px'
        }}>
          Checkout Cancelled
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          Your checkout was cancelled. No charges were made to your account.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/pricing"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            Return to Pricing
          </Link>
          <Link
            href="/account"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'transparent',
              color: '#3b82f6',
              border: '2px solid #3b82f6',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px'
            }}
          >
            View Account
          </Link>
        </div>
      </div>
    </div>
  );
}

