import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache (in production, use Redis or similar)
const geocodeCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface GeocodeRequest {
  address?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
}

interface GeocodeResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    place_id: string;
    types: string[];
  }>;
  status: string;
}

async function performGeocode({ address, placeId, lat, lng }: GeocodeRequest) {
  const latValid = lat !== undefined && !Number.isNaN(lat);
  const lngValid = lng !== undefined && !Number.isNaN(lng);

  if (!placeId && !address && (!latValid || !lngValid)) {
    return NextResponse.json(
      { error: 'Place ID, address, or coordinates required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  const cacheKey = placeId
    ? `geocode:place:${placeId}`
    : address
    ? `geocode:${address.toLowerCase().trim()}`
    : `geocode:${lat},${lng}`;

  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }

  let url: string;
  if (placeId) {
    const encodedPlace = encodeURIComponent(placeId);
    url = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodedPlace}&key=${apiKey}`;
  } else if (address) {
    const encodedAddress = encodeURIComponent(address);
    url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
  } else {
    url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  }

  const response = await fetch(url);
  const data: GeocodeResponse = await response.json();

  if (data.status !== 'OK') {
    return NextResponse.json(
      { error: `Geocoding failed: ${data.status}` },
      { status: 400 }
    );
  }

  geocodeCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });

  const result = data.results[0];
  return NextResponse.json({
    formatted_address: result.formatted_address,
    location: result.geometry.location,
    place_id: result.place_id,
    types: result.types,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: GeocodeRequest = await request.json();
    return performGeocode(body);
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address') ?? undefined;
  const placeId = searchParams.get('placeId') ?? undefined;
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const lat = latParam ? Number.parseFloat(latParam) : undefined;
  const lng = lngParam ? Number.parseFloat(lngParam) : undefined;

  return performGeocode({
    address,
    placeId,
    lat: latValid ? lat : undefined,
    lng: lngValid ? lng : undefined,
  });
}
