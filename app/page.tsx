'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import ListingList, { ListItem } from './components/ListingList'

const DealMap = dynamic(() => import('./components/DealMapClient'), { ssr: false })

type Feature = { geometry:{ type:'Point', coordinates:[number,number] }, properties:any }

export default function Home() {
  const [query, setQuery] = useState('')
  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [minBeds,  setMinBeds ] = useState<number | null>(null)
  const [minBaths, setMinBaths] = useState<number | null>(null)
  const [mapAreaOnly, setMapAreaOnly] = useState(true)

  const [features, setFeatures] = useState<Feature[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [isMobileListOpen, setIsMobileListOpen] = useState(false)

  const viewRef = useRef<{lng:number;lat:number;zoom:number}>({ lng:-110.9265, lat:32.2217, zoom:10 })

  // Pull initial state from URL once
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    if (sp.get('q')) setQuery(sp.get('q')!)
    if (sp.get('minPrice')) setMinPrice(Number(sp.get('minPrice')))
    if (sp.get('maxPrice')) setMaxPrice(Number(sp.get('maxPrice')))
    if (sp.get('minBeds')) setMinBeds(Number(sp.get('minBeds')))
    if (sp.get('minBaths')) setMinBaths(Number(sp.get('minBaths')))
    if (sp.get('area')) setMapAreaOnly(sp.get('area') === '1')
    if (sp.get('lng') && sp.get('lat') && sp.get('z')) {
      viewRef.current = { lng: Number(sp.get('lng')), lat: Number(sp.get('lat')), zoom: Number(sp.get('z')) }
    }
  }, [])

  // Persist state to URL
  useEffect(() => {
    const v = viewRef.current
    const sp = new URLSearchParams()
    if (query) sp.set('q', query)
    if (minPrice != null) sp.set('minPrice', String(minPrice))
    if (maxPrice != null) sp.set('maxPrice', String(maxPrice))
    if (minBeds  != null) sp.set('minBeds',  String(minBeds))
    if (minBaths != null) sp.set('minBaths', String(minBaths))
    sp.set('area', mapAreaOnly ? '1' : '0')
    sp.set('lng', String(v.lng)); sp.set('lat', String(v.lat)); sp.set('z', String(Math.round(v.zoom*10)/10))
    const url = `${window.location.pathname}?${sp.toString()}`
    window.history.replaceState({}, '', url)
  }, [query, minPrice, maxPrice, minBeds, minBaths, mapAreaOnly, features])

  // Coerce numerics from GeoJSON props
  const num = (v:any) => (v === null || v === undefined || v === '' ? null : Number(v))

  const items: ListItem[] = useMemo(() => features.map((f:any) => ({
    id: f.properties.id,
    title: f.properties.title,
    address: f.properties.address,
    price:  num(f.properties.price),
    beds:   num(f.properties.beds),
    baths:  num(f.properties.baths),
    sqft:   num(f.properties.sqft),
    lot_size: num(f.properties.lot_size),
    arv:    num(f.properties.arv),
    repairs: num(f.properties.repairs),
    image_url: f.properties.image_url || null,
    contact_phone: f.properties.contact_phone,
    contact_email: f.properties.contact_email,
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  })), [features])

  const isMobile = typeof window !== 'undefined'
    ? window.matchMedia('(max-width: 900px)').matches
    : false

  const reset = () => {
    setQuery(''); setMinPrice(null); setMaxPrice(null); setMinBeds(null); setMinBaths(null); setMapAreaOnly(true)
  }

  return (
    <main style={{ width:'100%', height:'100dvh', display:'flex', flexDirection:'column', background:'#0b1220' }}>
      {/* Filters */}
      <div style={{ padding:10, borderBottom:'1px solid #0f172a', display:'grid', gap:8,
                    gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr repeat(5,1fr) auto auto', background:'#0b1220' }}>
        <input placeholder="Address / city / state / zip" value={query} onChange={e=>setQuery(e.target.value)} style={inpt}/>
        {!isMobile && <>
          <input placeholder="Min $" value={minPrice ?? ''} onChange={e=>setMinPrice(e.target.value?Number(e.target.value):null)} style={inpt}/>
          <input placeholder="Max $" value={maxPrice ?? ''} onChange={e=>setMaxPrice(e.target.value?Number(e.target.value):null)} style={inpt}/>
          <input placeholder="Beds ≥" value={minBeds ?? ''} onChange={e=>setMinBeds(e.target.value?Number(e.target.value):null)} style={inpt}/>
          <input placeholder="Baths ≥" value={minBaths ?? ''} onChange={e=>setMinBaths(e.target.value?Number(e.target.value):null)} style={inpt}/>
          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#e2e8f0' }}>
            <input type="checkbox" checked={mapAreaOnly} onChange={e=>setMapAreaOnly(e.target.checked)}/> Only show in map area
          </label>
        </>}
        <button onClick={()=>{}} style={btnPrimary}>Search</button>
        <button onClick={reset} style={btnSecondary}>Reset</button>
        {isMobile && (
          <button onClick={()=>setIsMobileListOpen(v=>!v)} style={btnSecondary}>
            {isMobileListOpen ? 'Hide List' : 'Show List'}
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ position:'relative', flex:1 }}>
        {/* Desktop split */}
        <div style={{ display: isMobile ? 'none' : 'grid', gridTemplateColumns:'minmax(520px,60%) 1fr', height:'100%' }}>
          <div style={{ position:'relative', borderRight:'1px solid #0f172a' }}>
            <DealMap
              query={query}
              minPrice={minPrice} maxPrice={maxPrice}
              minBeds={minBeds} minBaths={minBaths}
              mapAreaOnly={mapAreaOnly}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={(id)=>setSelectedId(id)}
              onHover={(id)=>setHoveredId(id)}
              onData={(fs:any)=>setFeatures(fs)}
              onViewChange={(v)=>{ viewRef.current = v }}
              initialCenter={[viewRef.current.lng, viewRef.current.lat]}
              initialZoom={viewRef.current.zoom}
            />
          </div>
          <div>
            <ListingList
              items={items}
              selectedId={selectedId}
              hoveredId={hoveredId}
              onSelect={(it)=>setSelectedId(it.id)}
              onHover={(id)=>setHoveredId(id)}
            />
          </div>
        </div>

        {/* Mobile: map + bottom sheet */}
        {isMobile && (
          <>
            <div style={{ position:'absolute', inset:0 }}>
              <DealMap
                query={query}
                minPrice={minPrice} maxPrice={maxPrice}
                minBeds={minBeds} minBaths={minBaths}
                mapAreaOnly={mapAreaOnly}
                selectedId={selectedId}
                hoveredId={hoveredId}
                onSelect={(id)=>{ setSelectedId(id); setIsMobileListOpen(true) }}
                onHover={(id)=>setHoveredId(id)}
                onData={(fs:any)=>setFeatures(fs)}
                onViewChange={(v)=>{ viewRef.current = v }}
                initialCenter={[viewRef.current.lng, viewRef.current.lat]}
                initialZoom={viewRef.current.zoom}
              />
            </div>
            <div style={{
              position:'absolute', left:0, right:0,
              bottom: isMobileListOpen ? 0 : '-65%', height:'65%',
              background:'#fff', borderTopLeftRadius:16, borderTopRightRadius:16,
              boxShadow:'0 -10px 25px rgba(0,0,0,.15)', transition:'bottom .25s ease'
            }}>
              <div style={{ padding:8, textAlign:'center', cursor:'pointer' }} onClick={()=>setIsMobileListOpen(v=>!v)}>
                <div style={{ width:40, height:4, background:'#ddd', borderRadius:999, margin:'6px auto' }} />
              </div>
              <div style={{ height:'calc(100% - 20px)' }}>
                <ListingList
                  items={items}
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  onSelect={(it)=>setSelectedId(it.id)}
                  onHover={(id)=>setHoveredId(id)}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

const inpt = { border:'1px solid #1f2937', background:'#111827', color:'#e5e7eb',
  borderRadius:8, padding:'10px 12px', fontSize:14, outline:'none' } as React.CSSProperties
const btnPrimary = { border:'none', borderRadius:8, padding:'10px 12px', background:'#e5e7eb', color:'#111',
  fontWeight:700, cursor:'pointer' } as React.CSSProperties
const btnSecondary = { border:'1px solid #1f2937', borderRadius:8, padding:'10px 12px', background:'#0b1220',
  color:'#e5e7eb', cursor:'pointer' } as React.CSSProperties
