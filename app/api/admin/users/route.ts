import { NextResponse } from "next/server";

import { requireAdminServer } from "@/lib/admin";

import { createSupabaseRouteClient } from "@/lib/auth/server";

export async function GET() {
  const admin = await requireAdminServer();

  if (!admin.ok) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        reason: admin.reason,
        status: admin.status,
      },
      { status: admin.status }
    );
  }

  const supabase = createSupabaseRouteClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,role,segment,tier,membership_tier")
    .order("email", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { users: data ?? [] },
    { status: 200 }
  );
}
