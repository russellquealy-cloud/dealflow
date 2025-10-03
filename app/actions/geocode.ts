'use server'
export async function geocodeAddress(address: string) {
  const key = process.env.MAPTILER_KEY
  if (key) {
    const u = `https://api.maptiler.com/geocoding/${encodeURIComponent(address)}.json?key=${key}&limit=1`
    const r = await fetch(u, { cache: 'no-store' })
    if (r.ok) {
      const j = await r.json()
      const f = j?.features?.[0]
      if (f?.center?.length === 2) return { lat: f.center[1], lon: f.center[0], source: 'maptiler' }
    }
  }
  return { lat: null, lon: null, source: 'maptiler', error: 'No result' }
}
