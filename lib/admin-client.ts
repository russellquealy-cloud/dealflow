// lib/admin-client.ts
// Client-side admin helpers (no server-side imports)
// Use this in client components ('use client')

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

