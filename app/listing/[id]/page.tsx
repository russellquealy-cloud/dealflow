// app/listing/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Listing = {
  id: string
  title: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  price?: number | null
  beds?: number | null
  baths?: number | null
  sqft?: number | null
  lot_size?: number | null
  arv?: number | null
  repairs?: number | null
  contact_phone?: string | null
  contact_email?: string | null
  image_url?: string | null
  latitude?: number | null
  longitude?: number | null
}

export default function ListingPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<Listing | null>(null)
  const [images, setImages] = useState<{ url: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const n = (v: any): number | null =>
      v === null || v === undefined || v === '' || Number.isNaN(Number(v))
        ? null
        : Number(v)

    async function load() {
      setLoading(true)
      setError(null)

      // 1) fetch the listing row safely
      const { data, error } = await supabase
        .from('listings')
        .select(
          [
            'id', 'title', 'address', 'city', 'state',
            'price', 'beds', 'baths', 'sqft', 'lot_size',
            'arv', 'repairs', 'contact_phone', 'contact_email',
            'image_url', 'latitude', 'longitude'
          ].join(',')
        )
        .eq('id', params.id)
        .single()

      if (error || !data) {
        setError('Listing not found')
        setLoading(false)
        return
      }

      // 2) map the raw row to our Listing type (no casts)
      const row: Listing = {
        id: String((data as any).id),
        title: (data as any).title ?? null,
        address: (data as any).address ?? null,
        city: (data as any).city ?? null,
        state: (data as any).state ?? null,
        price: n((data as any).price),
        beds: n((data as any).beds),
        baths: n((data as any).baths),
        sqft: n((data as any).sqft),
        lot_size: n((data as any).lot_size),
        arv: n((data as any).arv),
        repairs: n((data as any).repairs),
        contact_phone: (data as any).contact_phone ?? null,
        contact_email: (data as any).contact_email ?? null,
        image_url: (data as any).image_url ?? null,
        latitude: n((data as any).latitude),
        longitude: n((data as any).longitude),
      }

      setListing(row)

      // 3) optional images table
      const { data: imgs } = await supabase
        .from('listing_images')
        .select('url, sort_index')
        .eq('listing_id', params.id)
        .order('sort_index', { ascending: true })

      if (imgs && Array.isArray(imgs)) {
        setImages(imgs.map((r: any) => ({ url: r.url as string })))
      }

      setLoading(false)
    }

    load()
  }, [params.id])

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>
  if (error)   return <div style={{ padding: 24, color: '#ef4444' }}>{error}</div>
  if (!listing) return null

  const addr = [listing.address, listing.city, listing.state].filter(Boolean).join(', ')

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
        {listing.title || 'Listing'}
      </h1>
      <div style={{ color: '#4b5563', marginBottom: 16 }}>{addr}</div>

      {/* Images */}
      {images.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 10, marginBottom: 16 }}>
          {images.map((im, i) => (
            <img key={i} src={im.url} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12 }} />
          ))}
        </div>
      ) : listing.image_url ? (
        <img src={listing.image_url} alt="" style={{ width: '100%', height: 360, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} />
      ) : null}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        {stat('Price', money(listing.price))}
        {stat('Beds', num(listing.beds))}
        {stat('Baths', num(listing.baths))}
        {stat('Sqft', sqft(listing.sqft))}
        {stat('Lot', sqft(listing.lot_size))}
        {stat('ARV', money(listing.arv))}
        {stat('Repairs', money(listing.repairs))}
        {stat('ROI', roi(listing.arv, listing.price, listing.repairs))}
      </div>
    </main>
  )
}

function stat(label: string, value?: string) {
  return (
    <div style={{ padding: 12, borderRadius: 10, background: '#0b1220', color: '#e5e7eb', border: '1px solid #111827' }}>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{value || '—'}</div>
    </div>
  )
}

function money(v?: number | null) {
  return v == null ? '' : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
}
function num(v?: number | null) { return v == null ? '' : String(v) }
function sqft(v?: number | null) { return v == null ? '' : `${v.toLocaleString()} ft²` }
function roi(arv?: number | null, price?: number | null, repairs?: number | null) {
  if (arv == null || price == null) return ''
  const net = arv - (price || 0) - (repairs || 0)
  return `${Math.round((net / price) * 100)}%`
}
