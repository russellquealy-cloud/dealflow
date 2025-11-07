"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { logger } from "@/lib/logger";

export default function HeaderClient() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, refreshSession } = useAuth();

  const email = session?.user?.email ?? null;
  const nextParam = encodeURIComponent(pathname || "/");

  const handleSignOut = useCallback(async () => {
    try {
      const response = await fetch("/auth/signout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        logger.warn("HeaderClient: sign-out route responded with non-OK status", { status: response.status });
      }
    } catch (error) {
      logger.warn("HeaderClient: error calling sign-out route", error);
    } finally {
      await refreshSession();
      router.replace("/login");
    }
  }, [refreshSession, router]);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderBottom: "1px solid #e5e7eb",
        background: "#fff",
      }}
    >
      <Link href="/listings" style={{ fontWeight: 900, textDecoration: "none", color: "#111" }}>
        Off Axis Deals
      </Link>

      <nav style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Link href="/listings">Listings</Link>
        <Link href="/my-listings">My Listings</Link>
        <Link href="/post">Post Deal</Link>

        <span style={{ color: "#6b7280", fontSize: 13 }}>
          {email ?? "Not Logged In"}
        </span>

        {email ? (
          <button type="button" className="border px-3 py-1 rounded" onClick={handleSignOut}>
            Sign out
          </button>
        ) : (
          <Link href={`/login?next=${nextParam}`} className="border px-3 py-1 rounded">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
