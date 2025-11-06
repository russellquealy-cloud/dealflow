'use client';

import dynamic from 'next/dynamic';
import ErrorBoundary from './ErrorBoundary';
import { Point } from './GoogleMapComponent';

// Dynamically import the Google Maps component with SSR disabled (per guardrails)
const GoogleMapComponent = dynamic(() => import('./GoogleMapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f3f4f6'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #2563eb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 8px'
        }}></div>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading Google Maps...</p>
      </div>
    </div>
  )
});

type Props = {
  points: Point[];
  onBoundsChange?: (bounds: { south: number; north: number; west: number; east: number } | null) => void;
  onPolygonComplete?: (polygon: google.maps.Polygon) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
};

export default function GoogleMapWrapper(props: Props) {
  return (
    <ErrorBoundary>
      <GoogleMapComponent {...props} />
    </ErrorBoundary>
  );
}
