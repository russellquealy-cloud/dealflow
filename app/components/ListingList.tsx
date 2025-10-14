'use client'

import type { Listing } from '@/types';
import { useRouter } from 'next/navigation'
import React from 'react'

export type ListItem = {
  id: string
  title: string
  address?: string
  price?: number | null
  beds?: number | null
  baths?: number | null
  sqft?: number | null
  lot_size?: number | null
  arv?: number | null
  repairs?: number | null
  image_url?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  lon?: number
  lat?: number
}

export default function ListingList({
  items, selectedId, hoveredId, onSelect, onHover
}: {
  items: ListItem[]
  selectedId?: string | null
  hoveredId?: string | null
  onSelect?: (it: ListItem) => void
  onHover?: (id: string | null) => void
}) {
  const router = useRouter()

  return (
    <div style={{ overflowY:'auto', height:'100%', padding:12, background:'#f8fafc' }}>
      {items.map(it => {
        const isSel = it.id === selectedId
        const isHover = it.id === hoveredId

        const borderColor = isSel ? '#111827' : isHover ? '#3b82f6' : '#e5e7eb'
        const glow = isSel
          ? '0 0 0 2px rgba(17,24,39,.9), 0 8px 24px rgba(0,0,0,.15)'
          : isHover
          ? '0 0 0 2px rgba(59,130,246,.65), 0 8px 24px rgba(59,130,246,.15)'
          : 'none'
        const bg = isSel ? '#eef2ff' : isHover ? '#f0f9ff' : '#fff'

        const bathsTxt = it.baths != null ? `${Number(it.baths).toFixed(Number(it.baths) % 1 ? 1 : 0)} ba` : '—'
        const bedsTxt  = it.beds  != null ? `${Number(it.beds)} bd` : '—'
        const sqftTxt  = it.sqft  != null ? `${Number(it.sqft).toLocaleString()} sqft` : ''
        const ppsf     = it.price && it.sqft ? it.price / it.sqft : null

        const spread = it.arv!=null && it.price!=null && it.repairs!=null
          ? it.arv - it.price - it.repairs
          : null
        const roi = spread!=null && it.price!>0 ? spread / it.price! : null

        const go = () => {
          onSelect?.(it)
          router.push(`/listing/${it.id}`)
        }

        return (
          <div
            key={it.id}
            role="link"
            tabIndex={0}
            onClick={go}
            onKeyDown={(e)=>{ if (e.key==='Enter' || e.key===' ') { e.preventDefault(); go() } }}
            onMouseEnter={()=>onHover?.(it.id)}
            onMouseLeave={()=>onHover?.(null)}
            style={{
              border:`2px solid ${borderColor}`,
              boxShadow: glow,
              borderRadius:14,
              overflow:'hidden',
              marginBottom:12,
              cursor:'pointer',
              background:bg,
              transition:'box-shadow .15s ease, border-color .15s ease, background-color .15s ease'
            }}
          >
            {/* Image */}
            <div style={{ width:'100%', height:168, background:'#f3f4f6' }}>
              {it.image_url
                ? <img src={it.image_url} alt={it.title} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : <div style={{ width:'100%', height:'100%', display:'grid', placeItems:'center', color:'#9ca3af' }}>No image</div>}
            </div>

            {/* Content */}
            <div style={{ padding:12 }}>
              {/* Price + address */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                <div style={{ fontWeight:900, fontSize:18, color:'#111' }}>
                  {money(it.price)}
                </div>
                <div style={{ fontSize:12, color:'#6b7280', textAlign:'right' }}>{it.address || ''}</div>
              </div>

              {/* Stats */}
              <div style={{ marginTop:6, fontSize:13, color:'#111' }}>
                {bedsTxt} · {bathsTxt}
                {sqftTxt ? ` · ${sqftTxt}` : ''}
                {ppsf ? ` · ${money(ppsf)} / sqft` : ''}
                {it.lot_size ? ` · Lot ${formatLot(it.lot_size)}` : ''}
              </div>

              {/* Badges */}
              <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                {it.arv!=null && <Badge tone="indigo">ARV {money(it.arv)}</Badge>}
                {it.repairs!=null && <Badge tone="orange">Repairs {money(it.repairs)}</Badge>}
                {spread!=null && <Badge tone={spread>=0?'green':'rose'}>Spread {money(spread)}</Badge>}
                {roi!=null && <Badge tone={roi>=0?'green':'rose'}>ROI {(roi*100).toFixed(0)}%</Badge>}
              </div>

              {/* Actions (don’t navigate) */}
              <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                {it.contact_phone && <a href={`tel:${it.contact_phone}`} onClick={(e)=>e.stopPropagation()} style={btnStyle()}>Call</a>}
                {it.contact_phone && <a href={`sms:${it.contact_phone}`} onClick={(e)=>e.stopPropagation()} style={btnStyle()}>Text</a>}
                {it.contact_email && <a href={`mailto:${it.contact_email}`} onClick={(e)=>e.stopPropagation()} style={btnStyle()}>Email</a>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// put this near the top of ListingList.tsx (or where your Badge lives)
type BadgeTone = 'indigo' | 'orange' | 'green' | 'rose';

function Badge(
  { children, tone = 'indigo' }: { children: React.ReactNode; tone?: BadgeTone }
) {
  const tones: Record<BadgeTone, [string, string, string]> = {
    indigo: ['#eef2ff', '#3730a3', '#e0e7ff'],
    orange: ['#fff7ed', '#9a3412', '#ffedd5'],
    green:  ['#ecfdf5', '#065f46', '#d1fae5'],
    rose:   ['#fff1f2', '#be123c', '#ffe4e6'],
  };

  const [bg, fg, ring] = tones[tone];

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: bg, color: fg, boxShadow: `inset 0 0 0 1px ${ring}` }}
    >
      {children}
    </span>
  );
}


function money(v?:number|null){
  if (v==null) return '—'
  return new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v)
}
function formatLot(v:number|null){
  if (v==null) return ''
  const acres = Number(v)/43560
  return acres >= 1 ? `${acres.toFixed(acres<10?1:0)} ac` : `${Number(v).toLocaleString()} sqft`
}
