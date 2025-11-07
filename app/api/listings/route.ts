import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';

export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Vercel max duration

interface ListingsQueryParams {
  limit?: number;
  offset?: number;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number;
  minBaths?: number;
  maxBaths?: number;
  minSqft?: number;
  maxSqft?: number;
  city?: string;
  state?: string;
  search?: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 8000); // 8 second timeout

  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const params: ListingsQueryParams = {
      limit: parseInt(searchParams.get('limit') || '40'),
      offset: parseInt(searchParams.get('offset') || '0'),
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      minBeds: searchParams.get('minBeds') ? parseInt(searchParams.get('minBeds')!) : undefined,
      maxBeds: searchParams.get('maxBeds') ? parseInt(searchParams.get('maxBeds')!) : undefined,
      minBaths: searchParams.get('minBaths') ? parseInt(searchParams.get('minBaths')!) : undefined,
      maxBaths: searchParams.get('maxBaths') ? parseInt(searchParams.get('maxBaths')!) : undefined,
      minSqft: searchParams.get('minSqft') ? parseInt(searchParams.get('minSqft')!) : undefined,
      maxSqft: searchParams.get('maxSqft') ? parseInt(searchParams.get('maxSqft')!) : undefined,
      city: searchParams.get('city') || undefined,
      state: searchParams.get('state') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const supabase = await createSupabaseServer();
    
    // Build query with timeout signal
    let query = supabase
      .from('listings')
      .select('id, title, address, city, state, zip, price, beds, bedrooms, baths, sqft, latitude, longitude, arv, repairs, year_built, lot_size, description, images, created_at, featured, featured_until', { count: 'exact' })
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .order('created_at', { ascending: false })
      .range(params.offset!, params.offset! + params.limit! - 1);

    // Apply filters only when present (avoid unindexed wildcard searches)
    if (params.minPrice !== undefined) {
      query = query.gte('price', params.minPrice);
    }
    if (params.maxPrice !== undefined) {
      query = query.lte('price', params.maxPrice);
    }
    if (params.minBeds !== undefined) {
      query = query.gte('beds', params.minBeds);
    }
    if (params.maxBeds !== undefined) {
      query = query.lte('beds', params.maxBeds);
    }
    if (params.minBaths !== undefined) {
      query = query.gte('baths', params.minBaths);
    }
    if (params.maxBaths !== undefined) {
      query = query.lte('baths', params.maxBaths);
    }
    if (params.minSqft !== undefined) {
      query = query.gte('sqft', params.minSqft);
    }
    if (params.maxSqft !== undefined) {
      query = query.lte('sqft', params.maxSqft);
    }
    
    // Use exact match for city/state (indexed), avoid ilike wildcards
    if (params.city) {
      query = query.eq('city', params.city);
    }
    if (params.state) {
      query = query.eq('state', params.state);
    }
    
    // For search, only search in indexed fields (address, city, state) with prefix match
    // Avoid '%...%' wildcard searches across many columns
    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim();
      // Use OR for multiple indexed fields, but keep it simple
      query = query.or(`address.ilike.${searchTerm}%,city.ilike.${searchTerm}%,state.ilike.${searchTerm}%`);
    }

    // Execute query with timeout
    const queryPromise = query;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Query timeout after 8 seconds')), 8000);
    });

    let result;
    try {
      result = await Promise.race([queryPromise, timeoutPromise]);
    } catch (timeoutError) {
      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;
      console.error(`⏱️ Listings query timed out after ${elapsed}ms`);
      return NextResponse.json(
        {
          items: [],
          count: 0,
          error: {
            message: 'Query timeout - database took too long to respond',
            code: 'TIMEOUT',
            elapsed: elapsed
          }
        },
        { status: 408 } // Request Timeout
      );
    }

    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;

    const { data, error, count } = result as { data: unknown[] | null; error: { message: string; code?: string } | null; count: number | null };

    if (error) {
      console.error('❌ Listings query error:', error);
      return NextResponse.json(
        {
          items: [],
          count: 0,
          error: {
            message: error.message,
            code: error.code || 'QUERY_ERROR',
            elapsed: elapsed
          }
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          items: [],
          count: 0,
          error: {
            message: 'No data returned from database',
            code: 'NO_DATA',
            elapsed: elapsed
          }
        },
        { status: 500 }
      );
    }

    console.log(`✅ Listings query completed in ${elapsed}ms: ${data.length} items, total count: ${count || 0}`);

    return NextResponse.json({
      items: data,
      count: count || data.length,
      error: null
    });

  } catch (error) {
    clearTimeout(timeoutId);
    const elapsed = Date.now() - startTime;
    console.error('❌ Listings API error:', error);
    
    return NextResponse.json(
      {
        items: [],
        count: 0,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'UNKNOWN_ERROR',
          elapsed: elapsed
        }
      },
      { status: 500 }
    );
  }
}

