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

  const now = new Date().toISOString();

  // Stub implementation so the UI stops failing with "Failed to generate report: Unauthorized".
  // You can later replace this with real reporting logic.
  return NextResponse.json(
    {
      ok: true,
      generatedAt: now,
      summary: "Admin reporting stub in place – replace with real implementation later.",
    },
    { status: 200 }
  );
}
