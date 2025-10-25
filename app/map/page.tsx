// app/map/page.tsx
'use client'

import dynamic from 'next/dynamic'

const GoogleMapWrapper = dynamic(() => import('@/components/GoogleMapWrapper'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading Google Maps...</p>
      </div>
    </div>
  )
})

export default function MapTest() {
  // Sample points for testing
  const samplePoints = [
    { id: '1', lat: 32.2226, lng: -110.9747, price: 250000, title: 'Sample Property 1' },
    { id: '2', lat: 32.2326, lng: -110.9847, price: 450000, title: 'Sample Property 2' },
    { id: '3', lat: 32.2426, lng: -110.9947, price: 350000, title: 'Sample Property 3' }
  ]

  const handleBoundsChange = (bounds: { south: number; north: number; west: number; east: number } | null) => {
    console.log('Map bounds changed:', bounds)
  }

  const handlePolygonComplete = (polygon: google.maps.Polygon) => {
    console.log('Polygon completed:', polygon)
  }

  return (
    <main style={{ width: '100%', height: '100dvh' }}>
      <GoogleMapWrapper 
        points={samplePoints}
        onBoundsChange={handleBoundsChange}
        onPolygonComplete={handlePolygonComplete}
      />
    </main>
  )
}
