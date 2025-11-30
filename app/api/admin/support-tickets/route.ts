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
 * GET /api/admin/support-tickets
 * Returns a list of support tickets (stub-safe).
 */
export async function GET(_req: NextRequest) {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard.response;

  const supabase = createSupabaseRouteClient();

  try {
    // If you have a "support_tickets" table, query it here.
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, created_at, user_id, email, subject, status, priority")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error loading support tickets", { error });
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to load support tickets",
          details: error.message,
          tickets: [],
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        tickets: data ?? [],
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Unhandled error in support tickets GET", { error });
    return NextResponse.json(
      {
        ok: false,
        error: "Unexpected error loading support tickets",
        tickets: [],
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/support-tickets
 * Stub implementation for now – logs payload but does not persist changes.
 */
export async function POST(req: NextRequest) {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json().catch(() => ({}));
    logger.info("Support ticket update stub", { body });

    // Later you can implement real updates here, e.g.:
    // const supabase = createSupabaseRouteClient();
    // await supabase.from("support_tickets").update(...)

    return NextResponse.json(
      {
        ok: true,
        message: "Support tickets endpoint stub – no changes persisted.",
        received: body,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Unhandled error in support tickets POST", { error });
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to process support ticket update",
      },
      { status: 500 }
    );
  }
}
