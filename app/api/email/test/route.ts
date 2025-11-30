import { NextResponse } from "next/server";

import { requireAdminServer } from "@/lib/admin";

export async function POST() {
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

  // Stub — you can add your real email service here.
  return NextResponse.json(
    {
      ok: true,
      message: "Test email endpoint reachable",
    },
    { status: 200 }
  );
}
