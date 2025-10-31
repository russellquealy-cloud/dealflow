import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';

// GET: Fetch user's alerts
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching alerts:', error);
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }

    return NextResponse.json({ alerts: alerts || [] });
  } catch (error) {
    console.error('Error in alerts GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create alert
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, criteria } = await request.json();

    if (!type || !criteria) {
      return NextResponse.json({ error: 'Type and criteria required' }, { status: 400 });
    }

    if (!['price', 'location', 'property_type', 'custom'].includes(type)) {
      return NextResponse.json({ error: 'Invalid alert type' }, { status: 400 });
    }

    const { data: alert, error } = await supabase
      .from('alerts')
      .insert({
        user_id: user.id,
        type,
        criteria,
        active: true
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating alert:', error);
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('Error in alerts POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update alert
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, type, criteria, active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (type) updateData.type = type;
    if (criteria) updateData.criteria = criteria;
    if (active !== undefined) updateData.active = active;

    const { data: alert, error } = await supabase
      .from('alerts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating alert:', error);
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('Error in alerts PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete alert
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
      return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting alert:', error);
      return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Alert deleted' });
  } catch (error) {
    console.error('Error in alerts DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

