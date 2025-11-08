import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("to_id", user.id)
      .is("read_at", null);

    if (error) {
      console.error("Error counting unread messages:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    return NextResponse.json({ count: count ?? 0 });
  } catch (error) {
    console.error("Error in unread count", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
