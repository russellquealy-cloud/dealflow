import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';

/**
 * POST /api/listings/polygon-search
 * Search listings within a polygon boundary (GeoJSON)
 * 
 * Body: {
 *   polygon: GeoJSON Polygon object,
 *   filters?: { minPrice, maxPrice, minBeds, ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { polygon, filters } = await request.json();

    if (!polygon || !polygon.type || polygon.type !== 'Polygon') {
      return NextResponse.json(
        { error: 'Invalid GeoJSON polygon. Expected type: Polygon' },
        { status: 400 }
      );
    }

    // Convert GeoJSON coordinates to PostGIS format
    // GeoJSON: [[lng, lat], [lng, lat], ...]
    // PostGIS: POLYGON((lng lat, lng lat, ...))
    const coordinates = polygon.coordinates[0]; // First ring (exterior)
    const postgisCoords = coordinates
      .map((coord: number[]) => `${coord[0]} ${coord[1]}`)
      .join(', ');

    // Build query with PostGIS spatial filter
    let query = supabase
      .from('listings')
      .select('*, latitude, longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    // Apply spatial filter using PostGIS ST_Within
    // Note: This requires PostGIS extension in Supabase
    // If PostGIS is not available, fall back to bounding box + client-side filtering
    const bounds = {
      minLng: Math.min(...coordinates.map((c: number[]) => c[0])),
      maxLng: Math.max(...coordinates.map((c: number[]) => c[0])),
      minLat: Math.min(...coordinates.map((c: number[]) => c[1])),
      maxLat: Math.max(...coordinates.map((c: number[]) => c[1])),
    };

    // Use bounding box for initial filter (PostGIS support varies by Supabase plan)
    query = query
      .gte('latitude', bounds.minLat)
      .lte('latitude', bounds.maxLat)
      .gte('longitude', bounds.minLng)
      .lte('longitude', bounds.maxLng);

    // Apply additional filters if provided
    if (filters) {
      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
      if (filters.minBeds) {
        query = query.or(`beds.gte.${filters.minBeds},bedrooms.gte.${filters.minBeds}`);
      }
      if (filters.maxBeds) query = query.lte('bedrooms', filters.maxBeds);
      if (filters.minBaths) query = query.gte('baths', filters.minBaths);
      if (filters.maxBaths) query = query.lte('baths', filters.maxBaths);
      if (filters.minSqft) query = query.gte('sqft', filters.minSqft);
      if (filters.maxSqft) query = query.lte('sqft', filters.maxSqft);
      if (filters.propertyType) query = query.eq('property_type', filters.propertyType);
      if (filters.status) query = query.eq('status', filters.status);
    }

    const { data: listings, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error in polygon search:', error);
      return NextResponse.json(
        { error: 'Failed to search listings' },
        { status: 500 }
      );
    }

    // Client-side polygon filtering (more accurate than bounding box)
    // Check if point is inside polygon using ray casting algorithm
    const filteredListings = listings?.filter((listing) => {
      if (!listing.latitude || !listing.longitude) return false;
      return pointInPolygon([listing.longitude, listing.latitude], coordinates);
    }) || [];

    return NextResponse.json({
      listings: filteredListings,
      count: filteredListings.length,
      bounds,
    });
  } catch (error) {
    console.error('Error in polygon-search POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Ray casting algorithm to check if point is inside polygon
 * @param point [lng, lat]
 * @param polygon Array of [lng, lat] coordinates
 */
function pointInPolygon(point: number[], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

