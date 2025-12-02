import { NextRequest, NextResponse } from "next/server";
import { requireAdminServer } from "@/lib/admin";
import { createServerClient } from "@/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * GET /api/admin/diagnose
 * Admin diagnostics endpoint with robust auth support (cookies + session + Authorization header)
 * 
 * Uses requireAdminServer() helper which handles cookie-based auth with session fallback.
 * Also supports Authorization header for RSC prefetch scenarios where cookies may not be available.
 */
export async function GET(request: NextRequest) {
  try {
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
          console.error('[admin/diagnose] Failed to validate token from Authorization header:', tokenError);
        }
      }
    }

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
        admin: true,
        adminProfile: admin.profile,
        authUser: admin.user,
        authError: null,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[admin/diagnose] Error:', error);
    return NextResponse.json(
      {
        error: "Internal server error",
        reason: "server-error",
        status: 500,
      },
      { status: 500 }
    );
  }
}
