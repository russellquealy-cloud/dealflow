import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/support-tickets
 * List support tickets (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(user.id, supabase);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        user:profiles!support_tickets_user_id_fkey(id, email, full_name, company_name)
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: tickets, error } = await query;

    if (error) {
      console.error('Error fetching tickets:', error);
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
    }

    return NextResponse.json({ tickets: tickets || [] });
  } catch (error) {
    console.error('Error in support tickets GET:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/support-tickets
 * Create a new support ticket (admin can create for any user)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(user.id, supabase);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { subject, description, category, priority, userId, userEmail } = body;

    if (!subject || !description) {
      return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 });
    }

    // Determine user_id - use provided userId, or find by email, or use current admin user
    let targetUserId = userId;
    if (!targetUserId && userEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();
      targetUserId = profile?.id;
    }
    if (!targetUserId) {
      targetUserId = user.id; // Default to admin creating ticket for themselves
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: targetUserId,
        subject,
        description,
        category: category || 'general',
        priority: priority || 'medium',
        status: 'open',
        created_by: user.id,
      })
      .select(`
        *,
        user:profiles!support_tickets_user_id_fkey(id, email, full_name, company_name)
      `)
      .single();

    if (error) {
      console.error('Error creating ticket:', error);
      return NextResponse.json({ error: 'Failed to create ticket', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ ticket, message: 'Ticket created successfully' });
  } catch (error) {
    console.error('Error in support tickets POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/support-tickets
 * Update ticket status, priority, or assign
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(user.id, supabase);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { ticketId, status, priority, assignedTo, notes } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assignedTo) updates.assigned_to = assignedTo;
    if (notes) updates.admin_notes = notes;
    updates.updated_at = new Date().toISOString();

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId)
      .select(`
        *,
        user:profiles!support_tickets_user_id_fkey(id, email, full_name, company_name)
      `)
      .single();

    if (error) {
      console.error('Error updating ticket:', error);
      return NextResponse.json({ error: 'Failed to update ticket', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ ticket, message: 'Ticket updated successfully' });
  } catch (error) {
    console.error('Error in support tickets PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

