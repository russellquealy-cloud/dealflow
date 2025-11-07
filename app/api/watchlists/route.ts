import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Fetch user's watchlist
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    // If no user, return false for watchlist status (don't return 401 to prevent console errors)
    if (userError || !user) {
      if (listingId) {
        return NextResponse.json({ isInWatchlist: false });
      }
      return NextResponse.json({ watchlists: [] });
    }

    // If listingId provided, check if it's in watchlist
    if (listingId) {
      const { data: watchlist, error } = await supabase
        .from('watchlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('property_id', listingId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking watchlist:', error);
        return NextResponse.json({ isInWatchlist: false }); // Return false instead of error
      }

      return NextResponse.json({ isInWatchlist: !!watchlist });
    }

    // Otherwise, fetch all watchlists
    const { data: watchlists, error } = await supabase
      .from('watchlists')
      .select('*, listing:listings(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlists:', error);
      return NextResponse.json({ error: 'Failed to fetch watchlists' }, { status: 500 });
    }

    return NextResponse.json({ watchlists: watchlists || [] });
  } catch (error) {
    console.error('Error in watchlists GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add listing to watchlist
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
    }

    // Check if already in watchlist
    const { data: existing } = await supabase
      .from('watchlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', listingId)
      .single();

    if (existing) {
      return NextResponse.json({ message: 'Already in watchlist', watchlist: existing });
    }

    // Add to watchlist
    const { data: watchlist, error } = await supabase
      .from('watchlists')
      .insert({
        user_id: user.id,
        property_id: listingId
      })
      .select('*, listing:listings(*)')
      .single();

    if (error) {
      console.error('Error adding to watchlist:', error);
      return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
    }

    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error('Error in watchlists POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove listing from watchlist
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('watchlists')
      .delete()
      .eq('user_id', user.id)
      .eq('property_id', listingId);

    if (error) {
      console.error('Error removing from watchlist:', error);
      return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Removed from watchlist' });
  } catch (error) {
    console.error('Error in watchlists DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

