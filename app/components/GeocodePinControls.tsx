// components/GeocodePinControls.tsx
'use client'
import { useState } from 'react'
import { geocodeAddress } from '@/app/actions/geocode'

export default function GeocodePinControls({
  address, latitude, longitude, onChangeLatLon
}: {
  address: string
  latitude?: number | null
  longitude?: number | null
  onChangeLatLon: (lat: number | null, lon: number | null) => void
}) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function handleGeocode() {
    setBusy(true); setMsg(null)
    const res = await geocodeAddress(address)
    setBusy(false)
    if (res.lat != null && res.lon != null) {
      onChangeLatLon(res.lat, res.lon)
      setMsg(`Pinned via ${res.source}.`)
    } else {
      setMsg(res.error || 'Could not geocode.')
    }
  }

  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:12, marginTop:12 }}>
      <div style={{ fontWeight:700, marginBottom:8 }}>Location</div>
      <div style={{ fontSize:12, color:'#555', marginBottom:8 }}>
        Use your address field to set coordinates. You can fine-tune on the map later.
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <button
          type="button"
          onClick={handleGeocode}
          disabled={busy || !address?.trim()}
          style={{ border:'none', borderRadius:8, padding:'10px 12px', background:'#111827', color:'#fff', fontWeight:700, cursor:'pointer', opacity: busy? .7:1 }}
        >
          {busy ? 'Geocoding…' : 'Set pin from address'}
        </button>
        <div style={{ fontSize:12 }}>
          Lat:&nbsp;<input value={latitude ?? ''} onChange={e=>onChangeLatLon(e.target.value?parseFloat(e.target.value):null, longitude ?? null)} style={inpt}/>
          &nbsp;Lon:&nbsp;<input value={longitude ?? ''} onChange={e=>onChangeLatLon(latitude ?? null, e.target.value?parseFloat(e.target.value):null)} style={inpt}/>
        </div>
      </div>
      {msg && <div style={{ fontSize:12, marginTop:8 }}>{msg}</div>}
    </div>
  )
}
const inpt = 'width:110px;border:1px solid #e5e7eb;border-radius:6px;padding:6px 8px;font-size:12px;'
