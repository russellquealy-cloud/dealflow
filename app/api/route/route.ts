import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache (in production, use Redis or similar)
const routeCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface RouteRequest {
  origin: { lat: number; lng: number } | string;
  destination: { lat: number; lng: number } | string;
  travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
}

interface RouteResponse {
  routes: Array<{
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      end_address: string;
      start_address: string;
      steps: Array<{
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        html_instructions: string;
        polyline: { points: string };
      }>;
    }>;
    overview_polyline: { points: string };
    summary: string;
  }>;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RouteRequest = await request.json();
    const { origin, destination, travelMode = 'DRIVING' } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination required' },
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
    const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
    const destStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;
    const cacheKey = `route:${originStr}:${destStr}:${travelMode}`;

    // Check cache
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Build Google Directions API URL
    const originParam = typeof origin === 'string' 
      ? encodeURIComponent(origin)
      : `${origin.lat},${origin.lng}`;
    const destParam = typeof destination === 'string'
      ? encodeURIComponent(destination)
      : `${destination.lat},${destination.lng}`;

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originParam}&destination=${destParam}&mode=${travelMode.toLowerCase()}&key=${apiKey}`;

    // Make request to Google Directions API
    const response = await fetch(url);
    const data: RouteResponse = await response.json();

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: `Routing failed: ${data.status}` },
        { status: 400 }
      );
    }

    // Cache the result
    routeCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    // Return minimal response
    const route = data.routes[0];
    const leg = route.legs[0];
    
    return NextResponse.json({
      distance: leg.distance,
      duration: leg.duration,
      summary: route.summary,
      overview_polyline: route.overview_polyline,
      start_address: leg.start_address,
      end_address: leg.end_address
    });

  } catch (error) {
    console.error('Routing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');

  if (!origin || !destination) {
    return NextResponse.json(
      { error: 'Origin and destination required' },
      { status: 400 }
    );
  }

  return POST(request);
}
