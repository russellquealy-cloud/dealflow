import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,       // you already have these in .env.local
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!   // anon is fine for SELECT with your read policy
    )

    const num = (v: string | null) => (v == null ? null : Number(v))
    const p = (k: string) => url.searchParams.get(k)

    const { data, error } = await supabase.rpc('listings_in_bbox', {
      q: p('q') ?? '',
      minx: num(p('minX')),
      miny: num(p('minY')),
      maxx: num(p('maxX')),
      maxy: num(p('maxY')),
      min_price: num(p('minPrice')),
      max_price: num(p('maxPrice')),
      min_beds:  num(p('minBeds')),
      min_baths: num(p('minBaths')),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const features = (data ?? []).map((row: any) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [row.lon, row.lat] },
properties: {
  id: row.id,
  title: row.title ?? 'Property',
  price: row.price,
  beds: row.beds,
  baths: row.baths,
  sqft: row.sqft,
  lot_size: row.lot_size,
  address: row.address,
  contact_phone: row.contact_phone,
  contact_email: row.contact_email,
  // NEW:
  image_url: row.image_url,
  arv: row.arv,
  repairs: row.repairs,
}

    }))

    return NextResponse.json({ type: 'FeatureCollection', features })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
