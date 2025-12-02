import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * GET /api/admin/diagnose
 * Admin diagnostics endpoint with dual auth support (cookies + Authorization header)
 */
export async function GET(request: NextRequest) {
  try {
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
          console.error('[admin/diagnose] Failed to validate token from Authorization header:', tokenError);
        }
      }
    }

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          reason: "no-user",
          status: 401,
        },
        { status: 401 }
      );
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
      return NextResponse.json(
        {
          error: "Unauthorized",
          reason: "no-profile",
          status: 403,
        },
        { status: 403 }
      );
    }

    // Check if user is admin
    const isAdmin =
      profile.role === "admin" ||
      profile.segment === "admin" ||
      profile.tier === "enterprise" ||
      profile.membership_tier === "enterprise" ||
      profile.email === "admin@offaxisdeals.com";

    if (!isAdmin) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          reason: "not-admin",
          status: 403,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        admin: true,
        adminProfile: profile,
        authUser: user,
        authError: null,
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
