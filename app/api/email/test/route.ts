import { NextRequest, NextResponse } from "next/server";
import { requireAdminServer } from "@/lib/admin";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Check if user is admin with robust auth support
 * Uses requireAdminServer() helper and falls back to Authorization header if needed
 */
async function checkAdminAuth(request: NextRequest) {
  // Try standard admin auth check first (uses cookies with session fallback)
  let admin = await requireAdminServer(request);

  // If cookie/session auth fails, try Authorization header as fallback
  if (!admin.ok && admin.reason === "no-user") {
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
            // Fetch profile to check admin status using token client
            const { data: profile, error: profileError } = await tokenClient
              .from("profiles")
              .select("id,email,role,segment,tier,membership_tier")
              .eq("id", headerUser.id)
              .single<{
                id: string;
                email: string | null;
                role: string | null;
                segment: string | null;
                tier: string | null;
                membership_tier: string | null;
              }>();

            if (!profileError && profile) {
              const isAdmin =
                profile.role === "admin" ||
                profile.segment === "admin" ||
                profile.tier === "enterprise" ||
                profile.membership_tier === "enterprise" ||
                profile.email === "admin@offaxisdeals.com";

              if (isAdmin) {
                admin = {
                  ok: true as const,
                  status: 200 as const,
                  reason: "ok",
                  user: headerUser,
                  profile,
                };
              }
            }
          }
        }
      } catch (tokenError) {
        console.error('[email/test] Failed to validate token from Authorization header:', tokenError);
      }
    }
  }

  return admin;
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
