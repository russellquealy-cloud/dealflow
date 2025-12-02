import { NextResponse } from "next/server";
import { requireAdminServer } from "@/lib/admin";

/**
 * GET /api/email/test
 * Returns a simple status to prevent 405 errors from RSC prefetching
 */
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

  return NextResponse.json(
    {
      ok: true,
      message: "Email test endpoint reachable. Use POST to send test emails.",
    },
    { status: 200 }
  );
}

/**
 * POST /api/email/test
 * Sends a test email (stub implementation)
 */
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
