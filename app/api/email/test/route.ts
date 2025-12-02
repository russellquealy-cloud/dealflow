import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Check if user is admin with dual auth support
 */
async function checkAdminAuth(request: NextRequest) {
  // Try to get user from cookies first (standard approach)
  let supabase = await createServerClient();
  let { data: { user }, error: userError } = await supabase.auth.getUser();

  // If cookie-based auth fails, try Authorization header as fallback
  if (userError || !user) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseAnonKey) {
          const tokenClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          });
          const { data: { user: headerUser }, error: headerError } = await tokenClient.auth.getUser(token);
          if (headerUser && !headerError) {
            user = headerUser;
            userError = null;
            supabase = tokenClient;
          }
        }
      } catch (tokenError) {
        console.error('[email/test] Failed to validate token from Authorization header:', tokenError);
      }
    }
  }

  if (userError || !user) {
    return { ok: false as const, status: 401 as const, reason: "no-user", user: null, profile: null };
  }

  // Fetch profile to check admin status
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,role,segment,tier,membership_tier")
    .eq("id", user.id)
    .single<{
      id: string;
      email: string | null;
      role: string | null;
      segment: string | null;
      tier: string | null;
      membership_tier: string | null;
    }>();

  if (profileError || !profile) {
    return { ok: false as const, status: 403 as const, reason: "no-profile", user, profile: null };
  }

  // Check if user is admin
  const isAdmin =
    profile.role === "admin" ||
    profile.segment === "admin" ||
    profile.tier === "enterprise" ||
    profile.membership_tier === "enterprise" ||
    profile.email === "admin@offaxisdeals.com";

  if (!isAdmin) {
    return { ok: false as const, status: 403 as const, reason: "not-admin", user, profile };
  }

  return { ok: true as const, status: 200 as const, reason: "ok", user, profile };
}

/**
 * GET /api/email/test
 * Returns a simple status to prevent 405 errors from RSC prefetching
 */
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);

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
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request);

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
