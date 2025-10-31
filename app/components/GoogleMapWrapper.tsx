'use client';

import dynamic from 'next/dynamic';
import ErrorBoundary from './ErrorBoundary';
import { Point } from './GoogleMapComponent';

// Dynamically import the Google Maps component with SSR disabled
const GoogleMapComponent = dynamic(() => import('./GoogleMapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading Google Maps...</p>
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
