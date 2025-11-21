// app/api/admin/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdminServer } from "@/app/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdminServer();
  if (!admin.ok) {
    return NextResponse.json(
      { error: "Unauthorized", reason: admin.reason, status: admin.status },
      { status: admin.status },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Reports endpoint is available. Use POST to generate reports.",
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

  // Keep this minimal for now – just return a stub "report"
  // so the front-end stops throwing "Failed to generate report: Unauthorized"
  const now = new Date().toISOString();

  return NextResponse.json(
    {
      ok: true,
      generatedAt: now,
      summary: "Admin reporting stub in place – replace with real implementation later.",
    },
    { status: 200 },
  );
}
