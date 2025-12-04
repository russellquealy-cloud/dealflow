import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin";

import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/support-tickets
 * Returns a list of support tickets (stub-safe).
 */
export async function GET(_req: NextRequest) {
  const auth = await requireAdminApi();

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

  // Use the supabase client from requireAdminApi (already authenticated)
  const supabase = auth.supabase;

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
  const auth = await requireAdminApi();
  
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
