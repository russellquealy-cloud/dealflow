import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";

/**
 * GET /api/email/test
 * Returns a simple status to prevent 405 errors from RSC prefetching
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi();

  console.log('[email/test] GET', {
    status: auth.status,
    ok: auth.ok,
    email: auth.user?.email,
    isAdmin: auth.ok,
    message: auth.ok ? null : auth.message,
  });

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
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi();

  console.log('[email/test] POST', {
    status: auth.status,
    ok: auth.ok,
    email: auth.user?.email,
    isAdmin: auth.ok,
    message: auth.ok ? null : auth.message,
  });

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

  // Stub — you can add your real email service here.
  return NextResponse.json(
    {
      ok: true,
      message: "Test email endpoint reachable",
    },
    { status: 200 }
  );
}
