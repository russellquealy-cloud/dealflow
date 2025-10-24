import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache (in production, use Redis or similar)
const geocodeCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface GeocodeRequest {
  address: string;
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

export async function POST(request: NextRequest) {
  try {
    const body: GeocodeRequest = await request.json();
    const { address, lat, lng } = body;

    if (!address && (!lat || !lng)) {
      return NextResponse.json(
        { error: 'Address or coordinates required' },
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

    // Create cache key
    const cacheKey = address 
      ? `geocode:${address.toLowerCase().trim()}`
      : `geocode:${lat},${lng}`;

    // Check cache
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Build Google Geocoding API URL
    let url: string;
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    } else {
      url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
    }

    // Make request to Google Geocoding API
    const response = await fetch(url);
    const data: GeocodeResponse = await response.json();

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: `Geocoding failed: ${data.status}` },
        { status: 400 }
      );
    }

    // Cache the result
    geocodeCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    // Return minimal response
    const result = data.results[0];
    return NextResponse.json({
      formatted_address: result.formatted_address,
      location: result.geometry.location,
      place_id: result.place_id,
      types: result.types
    });

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
  const address = searchParams.get('address');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!address && (!lat || !lng)) {
    return NextResponse.json(
      { error: 'Address or coordinates required' },
      { status: 400 }
    );
  }

  return POST(request);
}
