// app/lib/admin.ts
import { createSupabaseRouteClient } from "@/app/lib/auth/server";

export type AdminProfile = {
  id: string;
  email: string | null;
  role: string | null;
  segment: string | null;
  tier: string | null;
  membership_tier: string | null;
};

export async function requireAdminServer() {
  const supabase = createSupabaseRouteClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, status: 401 as const, reason: "no-user", user: null, profile: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,role,segment,tier,membership_tier")
    .eq("id", user.id)
    .single<AdminProfile>();

  if (profileError || !profile) {
    return { ok: false as const, status: 403 as const, reason: "no-profile", user, profile: null };
  }

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
 * Client-side helper to check if current user is admin
 * This is a pure function that can be used in client components
 */
export function checkIsAdminClient(profile: { role?: string | null; segment?: string | null; tier?: string | null; membership_tier?: string | null; email?: string | null } | null | undefined): boolean {
  if (!profile) return false;
  return (
    profile.role === "admin" ||
    profile.segment === "admin" ||
    profile.tier === "enterprise" ||
    profile.membership_tier === "enterprise" ||
    profile.email === "admin@offaxisdeals.com"
  );
}
