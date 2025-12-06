import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/debug-messages-state
 * 
 * Debug endpoint to inspect messaging state for the current user.
 * Returns:
 * - Current authenticated user info
 * - Listings owned by the user
 * - Messages where user is sender or recipient
 * - Notifications for the user
 * 
 * This endpoint is accessible to any logged-in user (no admin check required).
 */
export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(req);

    const userId = user.id;

    // Fetch all data in parallel
    const [listingsRes, messagesRes, notificationsRes] = await Promise.all([
      supabase
        .from('listings')
        .select('id, title, price, owner_id, address')
        .eq('owner_id', userId)
        .limit(20)
        .order('created_at', { ascending: false }),

      supabase
        .from('messages')
        .select('id, listing_id, from_id, to_id, body, created_at, read_at, thread_id')
        .or(`from_id.eq.${userId},to_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(50),

      supabase
        .from('notifications')
        .select('id, type, user_id, listing_id, metadata, is_read, created_at, title, body')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    return NextResponse.json(
      {
        ok: true,
        userId,
        email: user.email,
        listings: listingsRes.data ?? [],
        messages: messagesRes.data ?? [],
        notifications: notificationsRes.data ?? [],
        errors: {
          listings: listingsRes.error
            ? {
                message: listingsRes.error.message,
                code: listingsRes.error.code,
                details: listingsRes.error.details,
              }
            : null,
          messages: messagesRes.error
            ? {
                message: messagesRes.error.message,
                code: messagesRes.error.code,
                details: messagesRes.error.details,
              }
            : null,
          notifications: notificationsRes.error
            ? {
                message: notificationsRes.error.message,
                code: notificationsRes.error.code,
                details: notificationsRes.error.details,
              }
            : null,
        },
        counts: {
          listingsOwned: listingsRes.data?.length ?? 0,
          messagesInvolvingUser: messagesRes.data?.length ?? 0,
          notificationsForUser: notificationsRes.data?.length ?? 0,
          unreadNotifications: (notificationsRes.data ?? []).filter((n: { is_read: boolean }) => !n.is_read).length,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    // Handle 401 Response from getUserFromRequest
    if (err instanceof Response) {
      return err;
    }
    console.error('[debug-messages-state] Error:', err);
    return NextResponse.json(
      {
        ok: false,
        reason: 'unauthenticated',
        error: err instanceof Error ? err.message : 'Unknown error',
        userId: null,
        email: null,
        listings: [],
        messages: [],
        notifications: [],
        errors: {},
        counts: {},
      },
      { status: 401 }
    );
  }
}

