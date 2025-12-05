import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/listings/[id]/view
 * Increment the view count for a listing by 1.
 * This endpoint:
 * - Works for authenticated and unauthenticated users
 * - Uses atomic SQL increment (views = views + 1)
 * - Only increments views for live listings
 * - Returns the new view count
 * - RLS policies should allow SELECT/UPDATE on views for live listings
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 400 });
    }

    const supabase = await createServerClient();
    
    // Get user if authenticated (optional - views work for everyone)
    const { data: { user } } = await supabase.auth.getUser();

    // Verify listing exists and is live
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('id, status, views')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Type assertion for the selected fields
    type ListingData = { id: string; status: string | null; views: number | null };
    const listingData = listing as ListingData;
    
    // Only increment views for live listings
    if (listingData.status !== 'live') {
      return NextResponse.json({ error: 'Listing is not live' }, { status: 400 });
    }

    // Use Postgres function to safely increment views (bypasses RLS but enforces constraints)
    const { data: functionResult, error: functionError } = await (supabase.rpc as any)(
      'increment_listing_view',
      { listing_uuid: id }
    );

    if (functionError || functionResult === null || functionResult === undefined) {
      console.error('Error incrementing view count via function:', functionError);
      
      // Fallback to direct update if function doesn't exist (for backwards compatibility)
      // This should not happen after migration is applied
      const currentViews = listingData.views ?? 0;
      const newViewsCount = currentViews + 1;
      
      const { data: updatedListing, error: updateError } = await supabase
        .from('listings')
        .update({ views: newViewsCount } as never)
        .eq('id', id)
        .eq('status', 'live')
        .select('views')
        .single();

      if (updateError || !updatedListing) {
        console.error('Error incrementing view count (fallback):', updateError);
        return NextResponse.json({ error: 'Failed to increment view count' }, { status: 500 });
      }

      const updatedViews = (updatedListing as { views: number | null }).views ?? 0;
      return NextResponse.json({ 
        views: updatedViews,
        listingId: id
      }, { status: 200 });
    }

    // Function returns the new view count directly
    const updatedViews = typeof functionResult === 'number' ? functionResult : listingData.views ?? 0;

    return NextResponse.json({ 
      views: updatedViews,
      listingId: id
    }, { status: 200 });

  } catch (error) {
    console.error('Error in view tracking endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

