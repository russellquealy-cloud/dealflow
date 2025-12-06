import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/unread-count
 * Returns the count of unread notifications for the authenticated user.
 * Always returns HTTP 200 with { count: number }.
 * Returns { count: 0 } if user is not authenticated or on error.
 * This endpoint is designed to never return 401 - it's safe to call from layout/header.
 */
export async function GET(req: NextRequest) {
  try {
    // Use the unified auth helper (tries cookies first, falls back to Bearer token)
    // If user is not authenticated, return count 0 (not an error)
    let user;
    let supabase;
    
    try {
      const authResult = await getUserFromRequest(req);
      user = authResult.user;
      supabase = authResult.supabase;
    } catch (err) {
      // If getUserFromRequest throws (401), return count 0
      // This is expected for unauthenticated users - safe to call from header
      if (err instanceof Response) {
        return NextResponse.json({ count: 0 }, { status: 200 });
      }
      throw err;
    }

    // Query unread notifications: notifications where user_id matches and read_at IS NULL
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null);

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
    // This endpoint should never return 401 - safe to call from layout/header
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}


