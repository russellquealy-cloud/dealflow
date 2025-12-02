import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/adminAuth";

/**
 * GET /api/email/test
 * Returns a simple status to prevent 405 errors from RSC prefetching
 */
export async function GET(request: NextRequest) {
  const ctx = await getAdminContext(request);

  console.log('[email/test] GET', {
    status: ctx.status,
    email: ctx.session?.user.email,
    isAdmin: ctx.isAdmin,
    error: ctx.error,
  });

  if (ctx.status !== 200) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        reason: ctx.error,
        status: ctx.status,
      },
      { status: ctx.status }
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
  const ctx = await getAdminContext(request);

  console.log('[email/test] POST', {
    status: ctx.status,
    email: ctx.session?.user.email,
    isAdmin: ctx.isAdmin,
    error: ctx.error,
  });

  if (ctx.status !== 200) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        reason: ctx.error,
        status: ctx.status,
      },
      { status: ctx.status }
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
