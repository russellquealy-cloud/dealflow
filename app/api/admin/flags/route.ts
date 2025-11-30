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

// GET: return current feature flags / settings (stubbed for now)
export async function GET(_req: NextRequest) {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard.response;

  // If you later store flags in a table, query them here.
  // For now, return a simple stub payload.
  return NextResponse.json(
    {
      ok: true,
      flags: {
        // example flags; replace with real ones later
        proAnalyticsEnabled: true,
        heatmapEnabled: true,
        leadConversionEnabled: true,
      },
    },
    { status: 200 }
  );
}

// POST: update feature flags (stubbed; logs payload only)
export async function POST(req: NextRequest) {
  const guard = await ensureAdmin();
  if (!guard.ok) return guard.response;

  const supabase = createSupabaseRouteClient();

  try {
    const body = await req.json().catch(() => ({}));

    // In a real implementation you would persist this to a "feature_flags" table.
    // For now, just log the payload so the endpoint is safe and debuggable.
    logger.info?.("Admin flags update stub", { body });

    // Example of where you might upsert flags in the future:
    // await supabase.from("feature_flags").upsert({...});

    return NextResponse.json(
      {
        ok: true,
        message: "Flags endpoint stub – no changes persisted.",
        received: body,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error?.("Error in admin flags endpoint", { error });
    return NextResponse.json(
      {
        error: "Failed to process flags update",
      },
      { status: 500 }
    );
  }
}
