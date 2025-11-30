import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/messages/unread-count
 * Returns the count of unread messages for the authenticated user.
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

    // Query unread messages: messages where recipient is current user and read_at is null
    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("to_id", user.id)
      .is("read_at", null);

    if (error) {
      console.error("Error counting unread messages:", error);
      // Return count 0 instead of error
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    return NextResponse.json({ count: count ?? 0 }, { status: 200 });
  } catch (error) {
    console.error("Error in unread count", error);
    // Return count 0 instead of error
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
