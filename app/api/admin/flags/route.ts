import { NextRequest, NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin";

import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// GET: return current feature flags / settings (stubbed for now)
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
