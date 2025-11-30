/**
 * Server-side geocoding helper
 * 
 * This module provides functions to geocode addresses using the Google Geocoding API.
 * It must only be used on the server (API routes, server components, server actions).
 * 
 * Environment variables required:
 * - GOOGLE_GEOCODE_API_KEY (preferred) or GOOGLE_MAPS_SERVER_API_KEY (fallback)
 */

/**
 * Geocode address components to latitude/longitude coordinates
 * 
 * @param address - Street address
 * @param city - City name
 * @param state - State code (e.g., "AZ")
 * @param zip - ZIP code
 * @returns Promise resolving to { lat: number, lng: number } or null if geocoding fails
 */
export async function geocodeAddress(
  address: string,
  city?: string,
  state?: string,
  zip?: string
): Promise<{ lat: number; lng: number } | null>;

/**
 * Geocode a full address string to latitude/longitude coordinates
 * 
 * @param fullAddress - Full address string (e.g., "123 Main St, Tucson, AZ 85747")
 * @returns Promise resolving to { lat: number, lng: number } or null if geocoding fails
 */
export async function geocodeAddress(
  fullAddress: string
): Promise<{ lat: number; lng: number } | null>;

/**
 * Geocode implementation - handles both overloads
 */
export async function geocodeAddress(
  addressOrFullAddress: string,
  city?: string,
  state?: string,
  zip?: string
): Promise<{ lat: number; lng: number } | null> {
  // Build full address string from components if separate params provided
  let fullAddress: string;
  if (city !== undefined || state !== undefined || zip !== undefined) {
    const addressParts = [addressOrFullAddress];
    if (city) addressParts.push(city);
    if (state) addressParts.push(state);
    if (zip) addressParts.push(zip);
    fullAddress = addressParts.filter(Boolean).join(', ') + ', USA';
  } else {
    fullAddress = addressOrFullAddress;
  }

  if (!fullAddress || !fullAddress.trim()) {
    console.warn('geocodeAddress: Empty address provided');
    return null;
  }

  // Try GOOGLE_GEOCODE_API_KEY first, then GOOGLE_MAPS_SERVER_API_KEY as fallback
  const apiKey = process.env.GOOGLE_GEOCODE_API_KEY || process.env.GOOGLE_MAPS_SERVER_API_KEY;

  if (!apiKey) {
    console.error('geocodeAddress: No API key configured. Set GOOGLE_GEOCODE_API_KEY or GOOGLE_MAPS_SERVER_API_KEY');
    return null;
  }

  try {
    const encodedAddress = encodeURIComponent(fullAddress.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    console.log('🌍 Geocoding address:', fullAddress);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('geocodeAddress: HTTP error', {
        status: response.status,
        statusText: response.statusText,
        address: fullAddress,
      });
      return null;
    }

    const data = (await response.json()) as {
      status: string;
      results?: Array<{
        geometry: {
          location: { lat: number; lng: number };
        };
      }>;
      error_message?: string;
    };

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn('geocodeAddress: No results or non-OK status', {
        status: data.status,
        error_message: data.error_message,
        address: fullAddress,
      });
      return null;
    }

    const location = data.results[0].geometry.location;
    const lat = typeof location.lat === 'number' ? location.lat : parseFloat(String(location.lat));
    const lng = typeof location.lng === 'number' ? location.lng : parseFloat(String(location.lng));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      console.warn('geocodeAddress: Invalid coordinates returned', {
        lat,
        lng,
        address: fullAddress,
      });
      return null;
    }

    console.log('✅ Geocoding success', {
      address: fullAddress,
      lat,
      lng,
    });

    return { lat, lng };
  } catch (error) {
    console.error('geocodeAddress: Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
      address: fullAddress,
    });
    return null;
  }
}

