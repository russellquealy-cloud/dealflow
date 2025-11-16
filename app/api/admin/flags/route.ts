import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { isAdmin } from '@/lib/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * GET /api/admin/flags
 * Get flags/reports (admin only)
 * Query params: status, targetType
 */
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(user.id, supabase);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const targetType = searchParams.get('targetType');

    let query = supabase
      .from('flags')
      .select(`
        *,
        reporter:profiles!flags_reporter_id_fkey(id, email, full_name),
        resolver:profiles!flags_resolved_by_fkey(id, email, full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (status) {
      query = query.eq('status', status);
    }

    if (targetType) {
      query = query.eq('target_type', targetType);
    }

    const { data: flags, error } = await query;

    if (error) {
      logger.error('Error fetching flags', { error });
      return NextResponse.json({ error: 'Failed to fetch flags' }, { status: 500 });
    }

    return NextResponse.json({ flags: flags || [] });
  } catch (error) {
    logger.error('Error in admin/flags GET', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/flags
 * Update flag status (admin only)
 * Body: { flagId, status: 'pending' | 'reviewing' | 'resolved' | 'dismissed', resolutionNotes? }
 */
export async function PUT(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIsAdmin = await isAdmin(user.id, supabase);
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { flagId, status, resolutionNotes } = body;

    if (!flagId || !status) {
      return NextResponse.json({ error: 'flagId and status required' }, { status: 400 });
    }

    if (!['pending', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      status,
      resolved_by: status === 'resolved' || status === 'dismissed' ? user.id : null,
      resolved_at: status === 'resolved' || status === 'dismissed' ? new Date().toISOString() : null,
    };

    if (resolutionNotes) {
      updateData.resolution_notes = resolutionNotes;
    }

    const { data: updatedFlag, error: updateError } = await supabase
      .from('flags')
      .update(updateData)
      .eq('id', flagId)
      .select('*')
      .single();

    if (updateError) {
      logger.error('Error updating flag', { error: updateError, flagId });
      return NextResponse.json({ error: 'Failed to update flag' }, { status: 500 });
    }

    // Log to audit log
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'admin_flag_update',
        resource_type: 'flag',
        resource_id: flagId,
        details: { status, resolutionNotes },
      });

    if (auditError) {
      logger.error('Error logging audit', { error: auditError });
    }

    return NextResponse.json({ success: true, flag: updatedFlag });
  } catch (error) {
    logger.error('Error in admin/flags PUT', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/flags
 * Create a flag/report (any authenticated user)
 * Body: { targetType, targetId, reason, description? }
 */
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetType, targetId, reason, description } = body;

    if (!targetType || !targetId || !reason) {
      return NextResponse.json({ error: 'targetType, targetId, and reason required' }, { status: 400 });
    }

    if (!['listing', 'user', 'message', 'profile'].includes(targetType)) {
      return NextResponse.json({ error: 'Invalid targetType' }, { status: 400 });
    }

    const { data: flag, error: insertError } = await supabase
      .from('flags')
      .insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason,
        description: description || null,
        status: 'pending',
      })
      .select('*')
      .single();

    if (insertError) {
      logger.error('Error creating flag', { error: insertError });
      return NextResponse.json({ error: 'Failed to create flag' }, { status: 500 });
    }

    // Log to audit log
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'flag_created',
        resource_type: targetType,
        resource_id: targetId,
        details: { reason, description },
      });

    if (auditError) {
      logger.error('Error logging audit', { error: auditError });
    }

    return NextResponse.json({ success: true, flag });
  } catch (error) {
    logger.error('Error in admin/flags POST', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

