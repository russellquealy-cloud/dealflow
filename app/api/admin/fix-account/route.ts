// app/api/admin/fix-account/route.ts
import { NextResponse } from "next/server";
import { requireAdminServer } from "@/lib/admin";
import { createSupabaseRouteClient } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "This endpoint is for POST requests to fix admin accounts. GET is for diagnostics only.",
  });
}

export async function POST() {
  const admin = await requireAdminServer();
  if (!admin.ok) {
    return NextResponse.json(
      { error: "Unauthorized", reason: admin.reason, status: admin.status },
      { status: admin.status },
    );
  }

  const supabase = createSupabaseRouteClient();

  // Optional: ensure the current admin profile is correctly flagged as admin
  const { user } = admin;
  if (!user) {
    return NextResponse.json({ error: "No user" }, { status: 400 });
  }

  // Narrow local type issue: payload shape is valid, but Supabase typings infer `never` here.
  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin", segment: "admin" } as never)
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
