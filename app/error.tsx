'use client';

// Error pages cannot be prerendered, they are always dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Only log on client side to avoid build-time issues
  if (typeof window !== 'undefined' && error) {
    console.error('Application error:', error);
  }

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
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        Something went wrong!
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        {error?.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '12px 24px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500'
        }}
      >
        Try again
      </button>
    </div>
  );
}
