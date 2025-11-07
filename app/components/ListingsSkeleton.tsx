'use client';

export default function ListingsSkeleton() {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
      gap: 20,
      padding: 20 
    }}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 16,
            background: '#fff',
            minHeight: 300,
          }}
        >
          <div
            style={{
              width: '100%',
              height: 200,
              background: '#f3f4f6',
              borderRadius: 8,
              marginBottom: 12,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          <div
            style={{
              height: 20,
              background: '#f3f4f6',
              borderRadius: 4,
              marginBottom: 8,
              width: '60%',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          <div
            style={{
              height: 16,
              background: '#f3f4f6',
              borderRadius: 4,
              marginBottom: 8,
              width: '40%',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          <div
            style={{
              height: 16,
              background: '#f3f4f6',
              borderRadius: 4,
              width: '50%',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
        </div>
      ))}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

