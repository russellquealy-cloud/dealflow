'use client'

import { useEffect, useMemo, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Supercluster from 'supercluster'

type Feature = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [number, number] },
  properties: {
    id: string, title: string, price?: number, beds?: number, baths?: number, sqft?: number,
    lot_size?: number, address?: string, contact_phone?: string, contact_email?: string
  }
}
type FC = { type: 'FeatureCollection', features: Feature[] }
type BBox = { minX:number;minY:number;maxX:number;maxY:number }

export default function DealMap({
  query = '', minPrice, maxPrice, minBeds, minBaths,
  selectedId, onSelect, onBoundsChange, onData
}: {
  query?: string
  minPrice?: number | null
  maxPrice?: number | null
  minBeds?: number | null
  minBaths?: number | null
  selectedId?: string | null
  onSelect?: (id: string) => void
  onBoundsChange?: (bbox: BBox) => void
  onData?: (features: Feature[]) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const cluster = useMemo(() => new Supercluster({ radius: 60, maxZoom: 16 }), [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const key = process.env.NEXT_PUBLIC_MAPTILER_KEY
    const style = key
      ? `https://api.maptiler.com/maps/streets/style.json?key=${key}`
      : {
          version: 8,
          sources: { osm: { type:'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize:256 } },
          layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
        } as any

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [-110.9265, 32.2217],
      zoom: 10
    })
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    mapRef.current = map

    const handle = () => {
      const b = map.getBounds()
      const bbox = { minX: b.getWest(), minY: b.getSouth(), maxX: b.getEast(), maxY: b.getNorth() }
      onBoundsChange?.(bbox)
      fetchWithinBbox(bbox)
    }
    map.on('load', handle)
    map.on('moveend', handle)

    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // refetch when filters change
  useEffect(() => {
    const m = mapRef.current
    if (!m) return
    const b = m.getBounds()
    fetchWithinBbox({ minX: b.getWest(), minY: b.getSouth(), maxX: b.getEast(), maxY: b.getNorth() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, minPrice, maxPrice, minBeds, minBaths])

  async function fetchWithinBbox(bbox: BBox) {
    const params = new URLSearchParams({
      minX: String(bbox.minX), minY: String(bbox.minY), maxX: String(bbox.maxX), maxY: String(bbox.maxY)
    })
    if (query) params.set('q', query)
    if (minPrice != null) params.set('minPrice', String(minPrice))
    if (maxPrice != null) params.set('maxPrice', String(maxPrice))
    if (minBeds  != null) params.set('minBeds',  String(minBeds))
    if (minBaths != null) params.set('minBaths', String(minBaths))

    const res = await fetch(`/api/listings.geojson?${params.toString()}`, { cache: 'no-store' })
    const data: FC = await res.json()
    onData?.(data.features)
    cluster.load(data.features as any)
    drawMarkers()
  }

  function drawMarkers() {
    const m = mapRef.current
    if (!m) return
    markersRef.current.forEach(mk => mk.remove())
    markersRef.current = []

    const b = m.getBounds()
    const clusters = cluster.getClusters([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], Math.floor(m.getZoom()))

    clusters.forEach((c: any) => {
      const [lng, lat] = c.geometry.coordinates
      const isCluster = !!c.properties.cluster
      const el = document.createElement('div')
      const isSelected = !isCluster && c.properties.id === selectedId
      el.style.cssText = `
        display:flex;align-items:center;justify-content:center;cursor:pointer;
        border-radius:9999px;color:#fff;font-weight:700;
        box-shadow:0 2px 10px rgba(0,0,0,.25);
        width:${isCluster?34:18}px;height:${isCluster?34:18}px;
        background:${isCluster ? '#0a7' : (isSelected ? '#111827' : '#e11')};
        font-size:12px;`
      el.textContent = isCluster ? String(c.properties.point_count) : ''
      const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(m)
      markersRef.current.push(marker)

      if (isCluster) {
        el.onclick = () => m.easeTo({ center: [lng, lat], zoom: Math.min(cluster.getClusterExpansionZoom(c.properties.cluster_id), 18) })
      } else {
        el.onclick = () => {
          const p = c.properties
          onSelect?.(p.id)
          new maplibregl.Popup({ closeButton: true, offset: 12 })
            .setLngLat([lng, lat])
            .setHTML(`
              <div style="min-width:240px;max-width:280px;font-family:system-ui,Arial">
                <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${escape(p.title)}</div>
                <div style="font-size:12px;color:#333;margin-bottom:6px;">
                  ${p.address ? escape(p.address) : ''}<br/>
                  ${money(p.price)} • ${badge(p.beds,'bd')} ${badge(p.baths,'ba')} ${badge(p.sqft,'sqft')}
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  ${p.contact_phone ? `<a href="tel:${p.contact_phone}" style="${btn()}">Call</a>` : ''}
                  ${p.contact_phone ? `<a href="sms:${p.contact_phone}" style="${btn()}">Text</a>` : ''}
                  ${p.contact_email ? `<a href="mailto:${p.contact_email}" style="${btn()}">Email</a>` : ''}
                  <a href="/listing/${p.id}" style="${btn('secondary')}">View Details</a>
                </div>
              </div>
            `)
            .addTo(m)
        }
      }
    })
  }

  return <div ref={containerRef} style={{ position:'absolute', inset:0 }} />
}

function escape(s:string){ return s?.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m] as string)) }
function money(v?:number){ return v==null?'':new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v) }
function badge(v:any,l:string){ return v==null?'':`${v} ${l}` }
function btn(variant:'primary'|'secondary'='primary'){
  const base='display:inline-block;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700;text-decoration:none;'
  return variant==='secondary'?base+'background:#f3f4f6;color:#111;border:1px solid #e5e7eb;':base+'background:#111827;color:white;'
}
