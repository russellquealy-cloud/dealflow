import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/server';
import { isAdmin } from '@/lib/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * GET /api/admin/users
 * Get users list with moderation status (admin only)
 * Query params: search, suspended, banned, verified
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
    const search = searchParams.get('search');
    const suspended = searchParams.get('suspended');
    const banned = searchParams.get('banned');
    const verified = searchParams.get('verified');

    let query = supabase
      .from('profiles')
      .select('id, email, full_name, company_name, role, segment, tier, suspended, banned, verified_by_admin, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,company_name.ilike.%${search}%`);
    }

    if (suspended === 'true') {
      query = query.eq('suspended', true);
    }

    if (banned === 'true') {
      query = query.eq('banned', true);
    }

    if (verified === 'true') {
      query = query.eq('verified_by_admin', true);
    }

    const { data: users, error } = await query;

    if (error) {
      logger.error('Error fetching users', { error });
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    logger.error('Error in admin/users GET', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/users
 * Update user moderation status (admin only)
 * Body: { userId, action: 'suspend' | 'ban' | 'verify' | 'unverify', reason?, durationDays? }
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
    const { userId, action, reason, durationDays, notes } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action required' }, { status: 400 });
    }

    if (!['suspend', 'ban', 'verify', 'unverify'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    const moderationAction: {
      moderator_id: string;
      action_type: string;
      target_type: string;
      target_id: string;
      reason?: string;
      notes?: string;
      duration_days?: number;
    } = {
      moderator_id: user.id,
      action_type: action,
      target_type: 'user',
      target_id: userId,
    };

    if (action === 'suspend') {
      updateData.suspended = true;
      if (durationDays && typeof durationDays === 'number' && durationDays > 0) {
        const suspendedUntil = new Date();
        suspendedUntil.setDate(suspendedUntil.getDate() + durationDays);
        updateData.suspended_until = suspendedUntil.toISOString();
        moderationAction.duration_days = durationDays;
      }
      if (reason) {
        updateData.suspended_reason = reason;
        moderationAction.reason = reason;
      }
    } else if (action === 'ban') {
      updateData.banned = true;
      updateData.banned_at = new Date().toISOString();
      if (reason) {
        updateData.banned_reason = reason;
        moderationAction.reason = reason;
      }
    } else if (action === 'verify') {
      updateData.verified_by_admin = true;
      updateData.verified_at = new Date().toISOString();
      updateData.verified_by_user_id = user.id;
    } else if (action === 'unverify') {
      updateData.verified_by_admin = false;
      updateData.verified_at = null;
      updateData.verified_by_user_id = null;
    }

    if (notes) {
      moderationAction.notes = notes;
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, full_name, suspended, banned, verified_by_admin')
      .single();

    if (updateError) {
      logger.error('Error updating user', { error: updateError, userId, action });
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Log moderation action
    const { error: actionError } = await supabase
      .from('moderation_actions')
      .insert(moderationAction);

    if (actionError) {
      logger.error('Error logging moderation action', { error: actionError });
      // Don't fail the request if logging fails
    }

    // Log to audit log
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: `admin_${action}`,
        resource_type: 'user',
        resource_id: userId,
        details: { action, reason, durationDays, notes },
      });

    if (auditError) {
      logger.error('Error logging audit', { error: auditError });
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      message: `User ${action}${action === 'suspend' && durationDays ? ` for ${durationDays} days` : ''} successfully`
    });
  } catch (error) {
    logger.error('Error in admin/users PUT', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

