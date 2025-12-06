import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/notifications/mark-read
 * Marks all unread notifications as read for the authenticated user
 * Sets read_at = now() for all notifications WHERE user_id = auth.uid() AND read_at IS NULL
 */
export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(req);

    // Update all unread notifications to set read_at = now()
    // Also update is_read = true for backward compatibility
    const { error } = await supabase
      .from('notifications')
      .update({
        read_at: new Date().toISOString(),
        is_read: true,
      } as never)
      .eq('user_id', user.id)
      .is('read_at', null);

    if (error) {
      console.error('[notifications/mark-read] Failed to update notifications', error);
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    // Handle 401 Response from getUserFromRequest
    if (err instanceof Response) {
      return err;
    }
    console.error('[notifications/mark-read] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

