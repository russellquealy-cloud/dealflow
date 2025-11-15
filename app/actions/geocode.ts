// app/actions/geocode.ts
export type GeocodeResult = { lat: number; lon: number } | null

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  try {
    const res = await fetch(
      `/api/geocode?address=${encodeURIComponent(address)}`,
      { cache: 'no-store' }
    )
    if (!res.ok) {
      console.error('geocode API error', res.status, await res.text())
      return null
    }
    const data = await res.json() as { ok: boolean; lat?: number; lng?: number; error?: string }
    // Handle both old format (lon) and new format (lng)
    if (data.ok && typeof data.lat === 'number' && (typeof data.lng === 'number' || typeof (data as { lon?: number }).lon === 'number')) {
      return { lat: data.lat, lon: data.lng ?? (data as { lon?: number }).lon! }
    }
    return null
  } catch (err) {
    console.error('geocode fetch failed', err)
    return null
  }
}
