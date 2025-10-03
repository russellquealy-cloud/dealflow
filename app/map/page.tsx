// app/map/page.tsx
'use client'

import { useEffect, useRef } from 'react'
import maplibregl, { StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export default function MapTest() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    // sanity log: should print "pk_…" if the env was loaded
    console.log(
      'NEXT_PUBLIC_MAPTILER_KEY:',
      (process.env.NEXT_PUBLIC_MAPTILER_KEY || '').slice(0, 10) +
        (process.env.NEXT_PUBLIC_MAPTILER_KEY ? '…' : ' (undefined)')
    )

    const key = process.env.NEXT_PUBLIC_MAPTILER_KEY
    const style: string | StyleSpecification =
      key && key.length > 0
        ? `https://api.maptiler.com/maps/streets/style.json?key=${key}`
        : {
            version: 8,
            sources: {
              osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors'
              }
            },
            layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
          }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [-110.9265, 32.2217], // Tucson/Vail
      zoom: 10
    })

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    map.on('error', (e) => console.error('MapLibre error:', e?.error || e))

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <main style={{ width: '100%', height: '100dvh' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </main>
  )
}
