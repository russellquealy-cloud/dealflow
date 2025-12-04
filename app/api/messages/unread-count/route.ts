import { NextRequest, NextResponse } from "next/server";
import { getAuthUserServer } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * GET /api/messages/unread-count
 * Returns the count of unread messages for the authenticated user.
 * Always returns HTTP 200 with { count: number }.
 * Returns { count: 0 } if user is not authenticated or on error.
 * This endpoint is designed to never return 401 - it's safe to call from layout/header.
 */
export async function GET(request: NextRequest) {
  try {
    // Use PKCE-aware auth helper that correctly reads dealflow-auth-token cookies
    const { user, supabase, error: userError } = await getAuthUserServer();
    
    // If user is not authenticated, return count 0 (not an error)
    // This is expected behavior - no need to log
    if (userError || !user) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    // Query unread messages: messages where recipient is current user and read_at is null
    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("to_id", user.id)
      .is("read_at", null);

    if (error) {
      // Only log in development - RLS or DB errors should not crash the UI
      if (process.env.NODE_ENV === 'development') {
        console.error("Error counting unread messages:", error);
      }
      // Return count 0 instead of error - UI should gracefully handle this
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    return NextResponse.json({ count: count ?? 0 }, { status: 200 });
  } catch (error) {
    // Only log in development - unexpected errors should not crash the UI
    if (process.env.NODE_ENV === 'development') {
      console.error("Error in unread count", error);
    }
    // Return count 0 instead of error - UI should gracefully handle this
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
