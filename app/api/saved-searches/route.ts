import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';

// GET: Fetch user's saved searches
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: searches, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved searches:', error);
      return NextResponse.json({ error: 'Failed to fetch saved searches' }, { status: 500 });
    }

    return NextResponse.json({ searches: searches || [] });
  } catch (error) {
    console.error('Error in saved-searches GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create saved search
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, criteria } = await request.json();

    if (!name || !criteria) {
      return NextResponse.json({ error: 'Name and criteria required' }, { status: 400 });
    }

    const { data: search, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: user.id,
        name,
        criteria,
        active: true
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating saved search:', error);
      return NextResponse.json({ error: 'Failed to create saved search' }, { status: 500 });
    }

    return NextResponse.json({ search });
  } catch (error) {
    console.error('Error in saved-searches POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update saved search
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, criteria, active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Search ID required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    if (criteria) updateData.criteria = criteria;
    if (active !== undefined) updateData.active = active;

    const { data: search, error } = await supabase
      .from('saved_searches')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating saved search:', error);
      return NextResponse.json({ error: 'Failed to update saved search' }, { status: 500 });
    }

    return NextResponse.json({ search });
  } catch (error) {
    console.error('Error in saved-searches PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete saved search
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Search ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting saved search:', error);
      return NextResponse.json({ error: 'Failed to delete saved search' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Saved search deleted' });
  } catch (error) {
    console.error('Error in saved-searches DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

