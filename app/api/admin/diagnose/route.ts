import { NextResponse } from "next/server";
import { requireAdminServer } from "@/lib/admin";
import { createServerClient } from "@/supabase/server";

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

  const supabase = await createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  return NextResponse.json(
    {
      ok: true,
      admin: true,
      adminProfile: admin.profile,
      authUser: user,
      authError: authError?.message ?? null,
    },
    { status: 200 }
  );
}
