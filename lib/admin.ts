import { createSupabaseRouteClient } from "@/lib/auth/server";

export type AdminProfile = {
  id: string;
  email: string | null;
  role: string | null;
  segment: string | null;
  tier: string | null;
  membership_tier: string | null;
};

export function isAdmin(
  input:
    | AdminProfile
    | { role?: string | null; segment?: string | null; tier?: string | null; membership_tier?: string | null; email?: string | null }
    | string
    | null
    | undefined
): boolean {
  if (!input) return false;

  // If input is a string, treat it as either an email or a role/tier value
  if (typeof input === "string") {
    const value = input.toLowerCase();

    // Email-based override
    if (value === "admin@offaxisdeals.com") return true;

    // Role/tier-based checks
    if (value === "admin" || value === "enterprise") return true;

    return false;
  }

  // If input looks like a profile-like object
  const email = "email" in input ? input.email ?? null : null;
  const role = "role" in input ? input.role ?? null : null;
  const segment = "segment" in input ? input.segment ?? null : null;
  const tier = "tier" in input ? input.tier ?? null : null;
  const membershipTier =
    "membership_tier" in input ? input.membership_tier ?? null : null;

  if (email && email.toLowerCase() === "admin@offaxisdeals.com") {
    return true;
  }

  if (
    role === "admin" ||
    segment === "admin" ||
    tier === "enterprise" ||
    membershipTier === "enterprise"
  ) {
    return true;
  }

  return false;
}

export async function requireAdminServer() {
  const supabase = createSupabaseRouteClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false as const,
      status: 401 as const,
      reason: "no-user",
      user: null,
      profile: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,role,segment,tier,membership_tier")
    .eq("id", user.id)
    .single<AdminProfile>();

  if (profileError || !profile) {
    return {
      ok: false as const,
      status: 403 as const,
      reason: "no-profile",
      user,
      profile: null,
    };
  }

  const isAdmin =
    profile.role === "admin" ||
    profile.segment === "admin" ||
    profile.tier === "enterprise" ||
    profile.membership_tier === "enterprise" ||
    profile.email === "admin@offaxisdeals.com";

  if (!isAdmin) {
    return {
      ok: false as const,
      status: 403 as const,
      reason: "not-admin",
      user,
      profile,
    };
  }

  return {
    ok: true as const,
    status: 200 as const,
    reason: "ok",
    user,
    profile,
  };
}
