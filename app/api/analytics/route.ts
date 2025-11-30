import { NextRequest, NextResponse } from "next/server";

import { getAuthUserServer } from "@/lib/auth/server";

import type { UserAnalytics } from "@/lib/analytics";

export const runtime = "nodejs";

/**
 * GET /api/analytics
 *
 * Returns basic per-user analytics.
 * Currently implemented as a minimal stub; you can expand it later.
 */
export async function GET(_request: NextRequest) {
  const { user } = await getAuthUserServer();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Minimal stub: return an empty analytics object typed as UserAnalytics.
  // You can later replace this with a real implementation that queries Supabase.
  const analytics = {} as UserAnalytics;

  return NextResponse.json(analytics, { status: 200 });
}
