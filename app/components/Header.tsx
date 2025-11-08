'use client';

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/supabase/client";
import { logger } from "@/lib/logger";
import { useAuth } from "@/providers/AuthProvider";
import PostDealButton from "./PostDealButton";

const wrap: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "10px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  background: "#fff",
  position: "sticky",
  top: 0,
  zIndex: 100,
};

const desktopNavStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const toggleStyles: React.CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
};

const mobileMenuStyles: React.CSSProperties = {
  position: "absolute",
  top: "56px",
  left: 0,
  right: 0,
  background: "#ffffff",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.18)",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  zIndex: 90,
};

const linkStyles: React.CSSProperties = {
  textDecoration: "none",
  color: "#333",
  fontWeight: 600,
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { session, refreshSession } = useAuth();
  const email = session?.user?.email ?? null;
  const userId = session?.user?.id ?? null;
  const [userRole, setUserRole] = React.useState<string>("");
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [signingOut, setSigningOut] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const closeMobile = React.useCallback(() => setMobileOpen(false), []);

  React.useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const loadProfile = React.useCallback(async () => {
    if (!userId) {
      setUserRole("");
      return;
    }

    logger.log("Header: loading profile", { userId });
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, segment")
        .eq("id", userId)
        .single();

      if (error) {
        logger.error("Header: error loading profile", error);
        return;
      }

      if (profile) {
        const role = profile.segment || profile.role || "";
        setUserRole(role);
      }
    } catch (error) {
      logger.error("Header: exception loading profile", error);
    }
  }, [userId]);

  const loadUnreadCount = React.useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch("/api/messages/unread-count", {
        cache: "no-store",
        credentials: "include",
      });
      if (response.status === 401) {
        setUnreadCount(0);
        await refreshSession();
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      logger.error("Header: error loading unread count", error);
    }
  }, [userId, refreshSession]);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  React.useEffect(() => {
    if (!userId) {
      return;
    }

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userId, loadUnreadCount]);

  const signOut = React.useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);

    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch (error) {
      logger.warn("Header: local signOut failed", error);
    }

    try {
      const response = await fetch("/auth/signout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        logger.warn("Header: sign-out route responded with non-OK status", { status: response.status });
      }
    } catch (error) {
      logger.warn("Header: error calling sign-out route", error);
    } finally {
      await refreshSession();
      setSigningOut(false);
      closeMobile();
      router.replace("/login");
    }
  }, [router, refreshSession, signingOut, closeMobile]);

  const desktopLinks = React.useMemo(() => {
    const links: React.ReactNode[] = [];

    links.push(
      <Link key="pricing" href="/pricing" style={linkStyles}>
        Pricing
      </Link>
    );

    if (email && userRole === "wholesaler") {
      links.push(
        <Link key="my-listings" href="/my-listings" style={linkStyles}>
          My Listings
        </Link>
      );
    }

    if (email && userRole && userRole !== "wholesaler") {
      links.push(
        <Link key="watchlists" href="/watchlists" style={linkStyles}>
          ⭐ Watchlist
        </Link>
      );
      links.push(
        <Link key="saved" href="/saved-searches" style={linkStyles}>
          🔍 Saved
        </Link>
      );
      links.push(
        <Link key="alerts" href="/alerts" style={linkStyles}>
          🔔 Alerts
        </Link>
      );
    }

    if (email && userRole === "wholesaler") {
      links.push(
        <Link key="alerts-wholesaler" href="/alerts" style={linkStyles}>
          🔔 Alerts
        </Link>
      );
    }

    if (email) {
      links.push(
        <Link key="analyzer" href="/tools/analyzer" style={linkStyles}>
          🔧 Analyzer
        </Link>
      );
    }

    if (email) {
      links.push(
        <Link key="messages" href="/messages" style={{ ...linkStyles, position: "relative" }}>
          💬 Messages
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-10px",
                background: "#dc2626",
                color: "white",
                borderRadius: "10px",
                padding: "1px 6px",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
      );

      links.push(
        <Link key="account" href="/account" style={linkStyles}>
          Account
        </Link>
      );
    }

    if (userRole === "admin") {
      links.push(
        <Link key="admin" href="/admin" style={{ ...linkStyles, color: "#dc2626" }}>
          🔒 Admin
        </Link>
      );
    }

    return links;
  }, [email, userRole, unreadCount]);

  const mobileLinks = React.useMemo(() => {
    const items: React.ReactNode[] = [];

    items.push(
      <Link key="pricing" href="/pricing" onClick={closeMobile} style={linkStyles}>
        Pricing
      </Link>
    );

    if (email && userRole === "wholesaler") {
      items.push(
        <Link key="my-listings" href="/my-listings" onClick={closeMobile} style={linkStyles}>
          My Listings
        </Link>
      );
    }

    if (email && userRole && userRole !== "wholesaler") {
      items.push(
        <Link key="watchlists" href="/watchlists" onClick={closeMobile} style={linkStyles}>
          ⭐ Watchlist
        </Link>
      );
      items.push(
        <Link key="saved" href="/saved-searches" onClick={closeMobile} style={linkStyles}>
          🔍 Saved
        </Link>
      );
      items.push(
        <Link key="alerts" href="/alerts" onClick={closeMobile} style={linkStyles}>
          🔔 Alerts
        </Link>
      );
    }

    if (email && userRole === "wholesaler") {
      items.push(
        <Link key="alerts-wholesaler" href="/alerts" onClick={closeMobile} style={linkStyles}>
          🔔 Alerts
        </Link>
      );
    }

    if (email) {
      items.push(
        <Link key="analyzer" href="/tools/analyzer" onClick={closeMobile} style={linkStyles}>
          🔧 Analyzer
        </Link>
      );
      items.push(
        <Link key="messages" href="/messages" onClick={closeMobile} style={linkStyles}>
          💬 Messages {unreadCount > 0 ? `(${unreadCount})` : ""}
        </Link>
      );
      items.push(
        <Link key="account" href="/account" onClick={closeMobile} style={linkStyles}>
          Account
        </Link>
      );
    }

    if (userRole === "admin") {
      items.push(
        <Link key="admin" href="/admin" onClick={closeMobile} style={{ ...linkStyles, color: "#dc2626" }}>
          🔒 Admin
        </Link>
      );
    }

    if (email) {
      items.push(
        <button
          key="sign-out"
          type="button"
          onClick={signOut}
          style={{
            ...linkStyles,
            border: "none",
            background: "#dc2626",
            color: "white",
            padding: "10px 14px",
            borderRadius: 8,
            cursor: signingOut ? "not-allowed" : "pointer",
          }}
          disabled={signingOut}
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      );
    } else {
      items.push(
        <Link key="sign-in" href="/login" onClick={closeMobile} style={linkStyles}>
          Sign in
        </Link>
      );
    }

    return items;
  }, [email, userRole, unreadCount, closeMobile, signOut, signingOut]);

  return (
    <header style={wrap}>
      <Link href="/listings" style={{ fontWeight: 900, textDecoration: "none", color: "#111" }}>
        Off Axis Deals
      </Link>

      <nav className="nav-desktop" style={desktopNavStyles}>
        {desktopLinks}
        {email && userRole === "wholesaler" && <PostDealButton />}
        {email && (
          <span style={{ color: "#666", fontSize: 14 }}>{email}</span>
        )}
        {email ? (
          <button
            type="button"
            onClick={signOut}
            style={{
              border: "1px solid #dc2626",
              borderRadius: 10,
              padding: "8px 12px",
              background: "#dc2626",
              color: "#fff",
              fontWeight: 600,
              cursor: signingOut ? "not-allowed" : "pointer",
              opacity: signingOut ? 0.7 : 1,
            }}
            disabled={signingOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        ) : (
          <Link href="/login" style={{ ...linkStyles, border: "1px solid #ddd", borderRadius: 10, padding: "8px 12px" }}>
            Sign in
          </Link>
        )}
      </nav>

      <button
        type="button"
        className="nav-toggle"
        style={toggleStyles}
        aria-label="Toggle navigation"
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      {mobileOpen && (
        <div className="nav-mobile" style={mobileMenuStyles}>
          {email && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>Signed in as</span>
              <span style={{ fontWeight: 600 }}>{email}</span>
            </div>
          )}
          {userRole === "wholesaler" && <PostDealButton />}
          {mobileLinks}
        </div>
      )}
    </header>
  );
}