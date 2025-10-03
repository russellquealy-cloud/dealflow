// pages/api/geocode.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const address = (req.query.address as string) || ''
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY
  if (!address) return res.status(400).json({ error: 'Missing address' })
  if (!key)     return res.status(500).json({ error: 'Missing MapTiler key' })

  try {
    const q = encodeURIComponent(address)
    const r = await fetch(`https://api.maptiler.com/geocoding/${q}.json?key=${key}&limit=1`)
    if (!r.ok) return res.status(r.status).json({ error: 'MapTiler error' })
    const j = await r.json()
    const f = j?.features?.[0]
    if (f?.center && Array.isArray(f.center)) {
      const [lon, lat] = f.center
      return res.status(200).json({ lat, lon })
    }
    return res.status(404).json({ error: 'No result' })
  } catch (e) {
    return res.status(500).json({ error: 'Geocode failed' })
  }
}
