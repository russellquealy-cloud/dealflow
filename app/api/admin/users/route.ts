import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin";

export async function GET() {
  const auth = await requireAdminApi();

  if (!auth.ok) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        reason: auth.message,
        status: auth.status,
      },
      { status: auth.status }
    );
  }

  // Use the supabase client from requireAdminApi (already authenticated)
  const supabase = auth.supabase;

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
