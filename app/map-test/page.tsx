'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Google Maps component with SSR disabled
const GoogleMapComponent = dynamic(() => import('@/components/GoogleMapComponent'), {
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

export default function MapTestPage() {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});
  
  // Sample points for testing
  const samplePoints = [
    { id: '1', lat: 32.2226, lng: -110.9747, price: 250000, title: 'Sample Property 1' },
    { id: '2', lat: 32.2326, lng: -110.9847, price: 450000, title: 'Sample Property 2' },
    { id: '3', lat: 32.2426, lng: -110.9947, price: 350000, title: 'Sample Property 3' }
  ];

  const handleBoundsChange = (bounds: { south: number; north: number; west: number; east: number } | null) => {
    console.log('Map bounds changed:', bounds);
    setDebugInfo(prev => ({ ...prev, bounds }));
  };

  const handlePolygonComplete = (polygon: google.maps.Polygon) => {
    console.log('Polygon completed:', polygon);
    setDebugInfo(prev => ({ ...prev, polygon: 'completed' }));
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
      {/* Map */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <GoogleMapComponent 
          points={samplePoints}
          onBoundsChange={handleBoundsChange}
          onPolygonComplete={handlePolygonComplete}
        />
      </div>
      
      {/* Debug Panel */}
      <div style={{ 
        width: '300px', 
        padding: '16px', 
        backgroundColor: '#f5f5f5', 
        overflowY: 'auto',
        borderLeft: '1px solid #ddd'
      }}>
        <h3>Debug Info</h3>
        <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
          <div><strong>Environment:</strong></div>
          <div>Google Maps Key: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing'}</div>
          <div>Map ID: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'Not set'}</div>
          <div>Points: {samplePoints.length}</div>
          <div><strong>Debug Info:</strong></div>
          <pre style={{ fontSize: '10px', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
