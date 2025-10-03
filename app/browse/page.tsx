// app/browse/page.tsx
'use client'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import ListingList, { ListItem } from '@/components/ListingList'

const DealMap = dynamic(() => import('@/components/DealMap'), { ssr: false })

type Feature = {
  geometry: { type:'Point', coordinates:[number,number] }
  properties: any
}

export default function BrowsePage() {
  const [query, setQuery] = useState('')
  const [features, setFeatures] = useState<Feature[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isMobileListOpen, setIsMobileListOpen] = useState(false)
  const lastBbox = useRef<{minX:number;minY:number;maxX:number;maxY:number} | null>(null)

  async function fetchData(bbox?: {minX:number;minY:number;maxX:number;maxY:number}) {
    const b = bbox ?? lastBbox.current
    const qs = b ? `minX=${b.minX}&minY=${b.minY}&maxX=${b.maxX}&maxY=${b.maxY}` : ''
    const res = await fetch(`/api/listings.geojson?${qs}${query ? `&q=${encodeURIComponent(query)}`:''}`, { cache: 'no-store' })
    const data = await res.json()
    setFeatures(data.features ?? [])
  }

  // convert features -> list items
  const items: ListItem[] = useMemo(() => features.map((f:any) => ({
    id: f.properties.id,
    title: f.properties.title,
    address: f.properties.address,
    price: f.properties.price,
    beds: f.properties.beds,
    baths: f.properties.baths,
    sqft: f.properties.sqft,
    contact_phone: f.properties.contact_phone,
    contact_email: f.properties.contact_email,
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  })), [features])

  useEffect(() => { fetchData() }, [query])

  // mobile detection (tiny helper)
  const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 900px)').matches : false

  return (
    <main style={{ width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header with search */}
      <div style={{ padding: 10, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          placeholder="Search address or title…"
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
          onKeyDown={(e)=>{ if(e.key==='Enter') fetchData() }}
          style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, outline: 'none' }}
        />
        <button onClick={()=>fetchData()} style={{ border:'none', borderRadius:8, padding:'10px 12px', background:'#111827', color:'#fff', fontWeight:700, cursor:'pointer' }}>Search</button>
        {isMobile && (
          <button onClick={()=>setIsMobileListOpen(v=>!v)} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px', background:'#fff', cursor:'pointer' }}>
            {isMobileListOpen ? 'Hide List' : 'Show List'}
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ position:'relative', flex: 1 }}>
        {/* Desktop split */}
        <div style={{
          display: isMobile ? 'none' : 'grid',
          gridTemplateColumns: 'minmax(380px, 40%) 1fr',
          gap: 0,
          height: '100%'
        }}>
          <div style={{ borderRight: '1px solid #eee' }}>
            <ListingList
              items={items}
              selectedId={selectedId}
              onSelect={(it) => { setSelectedId(it.id); (DealMap as any).flyTo?.(it.lon!, it.lat!) }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <DealMap
              query={query}
              selectedId={selectedId ?? undefined}
              onSelect={(id)=>setSelectedId(id)}
              onBoundsChange={(bbox)=>{ lastBbox.current = bbox; fetchData(bbox) }}
            />
          </div>
        </div>

        {/* Mobile: map full-screen + bottom sheet list */}
        {!isMobile ? null : (
          <>
            <div style={{ position:'absolute', inset:0 }}>
              <DealMap
                query={query}
                selectedId={selectedId ?? undefined}
                onSelect={(id)=>{ setSelectedId(id); setIsMobileListOpen(true) }}
                onBoundsChange={(bbox)=>{ lastBbox.current = bbox; fetchData(bbox) }}
              />
            </div>
            <div style={{
              position:'absolute',
              left:0, right:0,
              bottom: isMobileListOpen ? 0 : '-65%',
              height: '65%',
              background:'#fff',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              boxShadow: '0 -10px 25px rgba(0,0,0,.15)',
              transition: 'bottom .25s ease'
            }}>
              <div style={{ padding: 8, textAlign:'center', cursor:'pointer' }} onClick={()=>setIsMobileListOpen(v=>!v)}>
                <div style={{ width: 40, height: 4, background:'#ddd', borderRadius: 999, margin:'6px auto' }} />
              </div>
              <div style={{ height: 'calc(100% - 20px)' }}>
                <ListingList
                  items={items}
                  selectedId={selectedId}
                  onSelect={(it)=>{ setSelectedId(it.id); (DealMap as any).flyTo?.(it.lon!, it.lat!) }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
