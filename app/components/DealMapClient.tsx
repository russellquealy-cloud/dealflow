// app/components/DealMapClient.tsx
'use client'

import { useEffect, useMemo, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Supercluster from 'supercluster'
// @ts-ignore – works with MapLibre
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point, polygon as turfPolygon } from '@turf/helpers'

type Feature = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [number, number] },
  properties: {
    id: string, title: string,
    price?: number, beds?: number, baths?: number, sqft?: number, lot_size?: number,
    address?: string, contact_phone?: string, contact_email?: string,
    arv?: number, repairs?: number, image_url?: string
  }
}
type FC = { type: 'FeatureCollection', features: Feature[] }
type BBox = { minX:number;minY:number;maxX:number;maxY:number }

// Custom Mapbox-GL-Draw styles without line-dasharray (MapLibre v3 friendly)
const DRAW_STYLES: any[] = [
  // Polygon fill
  {
    id: 'gl-draw-polygon-fill-inactive',
    type: 'fill',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: { 'fill-color': '#3bb2d0', 'fill-opacity': 0.1 }
  },
  {
    id: 'gl-draw-polygon-fill-active',
    type: 'fill',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Polygon']],
    paint: { 'fill-color': '#3bb2d0', 'fill-opacity': 0.1 }
  },
  // Polygon outlines
  {
    id: 'gl-draw-polygon-stroke-inactive',
    type: 'line',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#3bb2d0', 'line-width': 2 }
  },
  {
    id: 'gl-draw-polygon-stroke-active',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon'], ['==', 'active', 'true']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#fbb03b', 'line-width': 2 }
  },
  // Lines (while drawing polygons)
  {
    id: 'gl-draw-line-inactive',
    type: 'line',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#3bb2d0', 'line-width': 2 }
  },
  {
    id: 'gl-draw-line-active',
    type: 'line',
    filter: ['all', ['==', '$type', 'LineString'], ['==', 'active', 'true']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#fbb03b', 'line-width': 2 }
  },
  // Vertices & midpoints
  {
    id: 'gl-draw-polygon-midpoint',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
    paint: { 'circle-radius': 3, 'circle-color': '#fbb03b' }
  },
  {
    id: 'gl-draw-polygon-vertex-active',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'active', 'true'], ['==', 'meta', 'vertex']],
    paint: { 'circle-radius': 4, 'circle-color': '#fbb03b' }
  },
  // Static features
  {
    id: 'gl-draw-polygon-stroke-static',
    type: 'line',
    filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'Polygon']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#404040', 'line-width': 2 }
  },
  {
    id: 'gl-draw-line-static',
    type: 'line',
    filter: ['all', ['==', 'mode', 'static'], ['==', '$type', 'LineString']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#404040', 'line-width': 2 }
  }
]

// We keep refs of {container, dot, halo} for each point marker
type MarkerEls = { c: HTMLElement; d: HTMLElement; h: HTMLElement }

export default function DealMapClient({
  query = '',
  minPrice, maxPrice, minBeds, minBaths,
  mapAreaOnly = true,
  initialCenter = [-110.9265, 32.2217],
  initialZoom = 10,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onData,
  onViewChange
}: {
  query?: string
  minPrice?: number | null
  maxPrice?: number | null
  minBeds?: number | null
  minBaths?: number | null
  mapAreaOnly?: boolean
  initialCenter?: [number, number]
  initialZoom?: number
  selectedId?: string | null
  hoveredId?: string | null
  onSelect?: (id: string) => void
  onHover?: (id: string | null) => void
  onData?: (features: Feature[]) => void
  onViewChange?: (view: { lng:number; lat:number; zoom:number }) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const drawnPolygonRef = useRef<number[][][] | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const pointElsRef = useRef<Map<string, MarkerEls>>(new Map())
  const cluster = useMemo(() => new Supercluster({ radius: 60, maxZoom: 16 }), [])

  function getBbox(): BBox {
    const m = mapRef.current!
    const b = m.getBounds()
    return { minX: b.getWest(), minY: b.getSouth(), maxX: b.getEast(), maxY: b.getNorth() }
  }

  // Initialize map + draw control
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
      center: initialCenter,
      zoom: initialZoom
    })
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      styles: DRAW_STYLES
    })
    map.addControl(draw, 'top-left')

    const updatePolygon = () => {
      const data = draw.getAll()
      const last = data.features[data.features.length - 1]
      drawnPolygonRef.current = (last && last.geometry?.type === 'Polygon')
        ? (last.geometry as any).coordinates
        : null
      renderMarkers()
    }
    map.on('draw.create', updatePolygon)
    map.on('draw.update', updatePolygon)
    map.on('draw.delete', updatePolygon)

    const fireView = () => {
      const c = map.getCenter()
      onViewChange?.({ lng: c.lng, lat: c.lat, zoom: map.getZoom() })
    }
    const handle = () => {
      fireView()
      mapAreaOnly ? fetchWithinBbox(getBbox()) : fetchWithinBbox(null)
    }
    map.on('load', handle)
    map.on('moveend', handle)

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refetch when filters change
  useEffect(() => {
    const m = mapRef.current
    if (!m) return
    mapAreaOnly ? fetchWithinBbox(getBbox()) : fetchWithinBbox(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, minPrice, maxPrice, minBeds, minBaths, mapAreaOnly])

  // Re-apply marker styles when selection/hover changes
  useEffect(() => { applyHighlightStyles() }, [selectedId, hoveredId])

  // Fetch listings for bbox/filters, then render clusters/markers
  async function fetchWithinBbox(bbox: BBox | null) {
    const params = new URLSearchParams()
    if (bbox) {
      params.set('minX', String(bbox.minX))
      params.set('minY', String(bbox.minY))
      params.set('maxX', String(bbox.maxX))
      params.set('maxY', String(bbox.maxY))
    }
    if (query) params.set('q', query)
    if (minPrice != null) params.set('minPrice', String(minPrice))
    if (maxPrice != null) params.set('maxPrice', String(maxPrice))
    if (minBeds  != null) params.set('minBeds',  String(minBeds))
    if (minBaths != null) params.set('minBaths', String(minBaths))

    const res = await fetch(`/api/listings.geojson?${params.toString()}`, { cache: 'no-store' })
    if (!res.ok) {
      const body = await res.text()
      console.error('/api/listings.geojson failed', res.status, body)
      return
    }
    const data: FC = await res.json()

    // Client-side polygon filter (optional)
    let feats = data.features
    if (drawnPolygonRef.current) {
      const poly = turfPolygon(drawnPolygonRef.current)
      feats = feats.filter(f => booleanPointInPolygon(point(f.geometry.coordinates), poly))
    }

    onData?.(feats)
    cluster.load(feats as any)
    renderMarkers()
  }

  // Render clusters and point markers
  function renderMarkers() {
    const m = mapRef.current
    if (!m) return
    markersRef.current.forEach(mk => mk.remove())
    markersRef.current = []
    pointElsRef.current.clear()

    const b = m.getBounds()
    const clusters = cluster.getClusters(
      [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
      Math.floor(m.getZoom())
    )

    clusters.forEach((c: any) => {
      const [lng, lat] = c.geometry.coordinates
      const isCluster = !!c.properties.cluster

      // Marker container
      const el = document.createElement('div')
      el.style.position = 'relative'
      el.style.width = isCluster ? '34px' : '18px'
      el.style.height = isCluster ? '34px' : '18px'
      el.style.cursor = 'pointer'
      el.style.userSelect = 'none'

      if (isCluster) {
        const bubble = document.createElement('div')
        bubble.textContent = String(c.properties.point_count)
        bubble.style.cssText = `
          position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
          border-radius:9999px;background:#0a7;color:#fff;font-weight:800;font-size:12px;
        `
        el.appendChild(bubble)
        el.onclick = () => {
          m.easeTo({ center: [lng, lat], zoom: Math.min(cluster.getClusterExpansionZoom(c.properties.cluster_id), 18) })
        }
      } else {
        // Dot (fixed size)
        const dot = document.createElement('div')
        dot.style.cssText = `
          position:absolute;left:0;top:0;right:0;bottom:0;border-radius:9999px;background:#dc2626;
        `
        // Halo for hover/selected
        const halo = document.createElement('div')
        halo.style.cssText = `
          position:absolute;left:-6px;top:-6px;right:-6px;bottom:-6px;border-radius:9999px;
          pointer-events:none;
        `
        el.appendChild(halo)
        el.appendChild(dot)

        pointElsRef.current.set(c.properties.id, { c: el, d: dot, h: halo })

        el.onmouseenter = () => onHover?.(c.properties.id)
        el.onmouseleave = () => onHover?.(null)

        // Clicking a red dot goes straight to the listing page
        el.onclick = () => {
          const p = c.properties
          onSelect?.(p.id)
          window.location.href = `/listing/${p.id}`
        }
      }

      const marker = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(m)
      markersRef.current.push(marker)
    })

    applyHighlightStyles()
  }

  // Visual-only highlight using halo; never change size/transform.
  function applyHighlightStyles() {
    for (const [id, els] of pointElsRef.current.entries()) {
      const isSel = id === selectedId
      const isHover = id === hoveredId
      els.d.style.background = isSel ? '#111827' : '#dc2626'
      els.h.style.boxShadow = isHover ? '0 0 0 4px rgba(59,130,246,.45)' : 'none'
      els.c.style.zIndex = isSel ? '3' : isHover ? '2' : '1'
    }
  }

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
}

/* ---------- small helpers ---------- */
function escape(s:string){ return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m] as string)) }
function money(v?:number){ return v==null?'':new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v) }
function badge(v:any,l:string){ return v==null?'':`${v} ${l}` }
function btn(variant:'primary'|'secondary'='primary'){
  const base='display:inline-block;padding:8px 12px;border-radius:10px;font-size:12px;font-weight:700;text-decoration:none;'
  return variant==='secondary'?base+'background:#f3f4f6;color:#111;border:1px solid #e5e7eb;':base+'background:#111827;color:white;'
}
