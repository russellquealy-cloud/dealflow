// app/api/admin/diagnose/route.ts
import { NextResponse } from "next/server";
import { requireAdminServer } from "@/app/lib/admin";
import { createSupabaseRouteClient } from "@/app/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdminServer();
  if (!admin.ok) {
    return NextResponse.json(
      { error: "Unauthorized", reason: admin.reason, status: admin.status },
      { status: admin.status },
    );
  }

  const supabase = createSupabaseRouteClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  return NextResponse.json(
    {
      ok: true,
      admin: true,
      adminProfile: admin.profile,
      authUser: user,
      authError: userError?.message ?? null,
    },
    { status: 200 },
  );
}
