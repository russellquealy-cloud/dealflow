import { NextRequest, NextResponse } from "next/server";
import { getProOrAdminContext } from "@/lib/adminAuth";
import { createServerClient } from "@/supabase/server";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/export
 *
 * Pro tier or admin-only endpoint to export analytics data.
 * Currently implemented as a safe stub that you can extend later.
 */
export async function GET(request: NextRequest) {
  const ctx = await getProOrAdminContext(request);

  console.log('[api/analytics/export]', {
    status: ctx.status,
    email: ctx.session?.user.email,
    tier: ctx.profile?.tier,
    isAdmin: ctx.isAdmin,
    isProOrAdmin: ctx.isProOrAdmin,
    error: ctx.error,
  });

  if (ctx.status !== 200 || !ctx.isProOrAdmin) {
    return NextResponse.json(
      {
        error: ctx.error || "Unauthorized",
        reason: ctx.status === 401 ? "unauthorized" : "forbidden",
        status: ctx.status,
      },
      { status: ctx.status }
    );
  }

  const supabase = await createServerClient();

  try {
    // Example: load some basic aggregated usage data.
    // You can replace this with real queries later.
    const [usersResult, usageResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, tier, segment, created_at")
        .limit(1000),
      supabase
        .from("ai_usage")
        .select("user_id, analyses_used, period_start, period_end")
        .limit(5000),
    ]);

    if (usersResult.error) {
      logger.error("Error loading users for analytics export", {
        error: usersResult.error,
      });
    }

    if (usageResult.error) {
      logger.error("Error loading AI usage for analytics export", {
        error: usageResult.error,
      });
    }

    const users = usersResult.data ?? [];
    const usage = usageResult.data ?? [];

    // For now, return JSON. Later you can generate CSV here.
    return NextResponse.json(
      {
        ok: true,
        exportedAt: new Date().toISOString(),
        users,
        usage,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Unhandled error in analytics export endpoint", { error });
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to export analytics data",
      },
      { status: 500 }
    );
  }
}
