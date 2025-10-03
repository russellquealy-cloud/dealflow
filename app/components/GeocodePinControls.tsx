// app/components/GeocodePinControls.tsx
'use client'

import { useState } from 'react'
import { geocodeAddress } from '@/actions/geocode'

export default function GeocodePinControls({
  address,
  latitude,
  longitude,
  onChangeLatLon,
}: {
  address?: string
  latitude?: number | null
  longitude?: number | null
  onChangeLatLon: (lat: number, lon: number) => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleGeocode() {
    if (!address || !address.trim()) {
      setErr('Enter an address first')
      return
    }
    setBusy(true)
    setErr(null)
    const res = await geocodeAddress(address)
    setBusy(false)
    if (!res) {
      setErr('Could not geocode address')
      return
    }
    onChangeLatLon(res.lat, res.lon)
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={handleGeocode}
        disabled={busy}
        style={btn()}
        aria-busy={busy ? 'true' : 'false'}
      >
        {busy ? 'Geocoding…' : 'Set pin from address'}
      </button>

      {latitude != null && longitude != null && (
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          lat {latitude.toFixed(5)} · lon {longitude.toFixed(5)}
        </span>
      )}

      {err && <span style={{ color: '#ef4444', fontSize: 12 }}>{err}</span>}
    </div>
  )
}

function btn() {
  return {
    padding: '8px 12px',
    borderRadius: 8,
    background: '#111827',
    color: '#fff',
    border: '1px solid #1f2937',
    cursor: 'pointer',
  } as React.CSSProperties
}
