import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/notifications/unread-count
 * Returns the count of unread notifications for the authenticated user.
 * Always returns HTTP 200 with { count: number }.
 * Returns { count: 0 } if user is not authenticated or on error.
 * This endpoint is designed to never return 401 - it's safe to call from layout/header.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // If user is not authenticated, return count 0 (not an error)
    // This is expected behavior - no need to log
    if (userError || !user) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    // Query unread notifications: notifications where user_id matches and is_read is false
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      // Only log in development - RLS or DB errors should not crash the UI
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load unread notification count', error);
      }
      // Return count 0 instead of error - UI should gracefully handle this
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    return NextResponse.json({ count: count ?? 0 }, { status: 200 });
  } catch (error) {
    // Only log in development - unexpected errors should not crash the UI
    if (process.env.NODE_ENV === 'development') {
      console.error('Error loading unread notification count', error);
    }
    // Return count 0 instead of error - UI should gracefully handle this
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}


