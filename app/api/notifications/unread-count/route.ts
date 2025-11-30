import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/notifications/unread-count
 * Returns the count of unread notifications for the authenticated user.
 * Always returns HTTP 200 with { count: number }.
 * Returns { count: 0 } if user is not authenticated or on error.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // If user is not authenticated, return count 0 (not an error)
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
      console.error('Failed to load unread notification count', error);
      // Return count 0 instead of error
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    return NextResponse.json({ count: count ?? 0 }, { status: 200 });
  } catch (error) {
    console.error('Error loading unread notification count', error);
    // Return count 0 instead of error
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}


