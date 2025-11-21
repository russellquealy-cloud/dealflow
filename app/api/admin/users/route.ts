// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdminServer } from "@/app/lib/admin";
import { createSupabaseRouteClient } from "@/app/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const admin = await requireAdminServer();
  if (!admin.ok) {
    return NextResponse.json(
      { error: "Unauthorized", reason: admin.reason, status: admin.status },
      { status: admin.status },
    );
  }

  const supabase = createSupabaseRouteClient();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const suspended = searchParams.get("suspended");
  const banned = searchParams.get("banned");
  const verified = searchParams.get("verified");

  let query = supabase
    .from("profiles")
    .select("id,email,role,segment,tier,membership_tier,created_at,updated_at")
    .order("email", { ascending: true })
    .limit(100);

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,company_name.ilike.%${search}%`);
  }

  if (suspended === "true") {
    query = query.eq("suspended", true);
  }

  if (banned === "true") {
    query = query.eq("banned", true);
  }

  if (verified === "true") {
    query = query.eq("verified_by_admin", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [] }, { status: 200 });
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdminServer();
  if (!admin.ok) {
    return NextResponse.json(
      { error: "Unauthorized", reason: admin.reason, status: admin.status },
      { status: admin.status },
    );
  }

  const supabase = createSupabaseRouteClient();

  try {
    const body = await request.json();
    const { userId, action, reason, durationDays } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action required" }, { status: 400 });
    }

    if (!["suspend", "ban", "verify", "unverify"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (action === "suspend") {
      updateData.suspended = true;
      if (durationDays && typeof durationDays === "number" && durationDays > 0) {
        const suspendedUntil = new Date();
        suspendedUntil.setDate(suspendedUntil.getDate() + durationDays);
        updateData.suspended_until = suspendedUntil.toISOString();
      }
      if (reason) {
        updateData.suspended_reason = reason;
      }
    } else if (action === "ban") {
      updateData.banned = true;
      updateData.banned_at = new Date().toISOString();
      if (reason) {
        updateData.banned_reason = reason;
      }
    } else if (action === "verify") {
      updateData.verified_by_admin = true;
      updateData.verified_at = new Date().toISOString();
      updateData.verified_by_user_id = admin.user.id;
    } else if (action === "unverify") {
      updateData.verified_by_admin = false;
      updateData.verified_at = null;
      updateData.verified_by_user_id = null;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select("id,email,suspended,banned,verified_by_admin")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User ${action}${action === "suspend" && durationDays ? ` for ${durationDays} days` : ""} successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
