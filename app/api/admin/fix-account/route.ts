// app/api/admin/fix-account/route.ts
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "This endpoint is for POST requests to fix admin accounts. GET is for diagnostics only.",
  });
}

export async function POST() {
  const auth = await requireAdminApi();
  
  if (!auth.ok) {
    return NextResponse.json(
      { error: "Unauthorized", reason: auth.message, status: auth.status },
      { status: auth.status },
    );
  }

  // Use the supabase client from requireAdminApi (already authenticated)
  const supabase = auth.supabase;

  // Optional: ensure the current admin profile is correctly flagged as admin
  const { user } = auth;

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
