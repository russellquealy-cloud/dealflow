import { NextRequest, NextResponse } from "next/server";

import { requireAdminServer } from "@/lib/admin";

import { createSupabaseRouteClient } from "@/lib/auth/server";

import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

async function ensureAdmin() {
  const admin = await requireAdminServer();

  if (!admin.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: "Unauthorized",
          reason: admin.reason,
          status: admin.status,
        },
        { status: admin.status }
      ),
    };
  }

  return { ok: true as const, admin };
}

/**
 * GET /api/analytics/export
 *
 * Admin-only endpoint to export basic analytics data.
 * Currently implemented as a safe stub that you can extend later.
 */
export async function GET(_req: NextRequest) {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard.response;

  const supabase = createSupabaseRouteClient();

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
