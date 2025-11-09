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
  padding: "12px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
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
  top: "58px",
  left: 0,
  right: 0,
  background: "#ffffff",
  boxShadow: "0 12px 24px rgba(15, 23, 42, 0.18)",
  padding: "18px 16px 24px",
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  zIndex: 90,
  borderBottomLeftRadius: 16,
  borderBottomRightRadius: 16,
  maxHeight: "calc(100vh - 70px)",
  overflowY: "auto",
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
  const [notificationCount, setNotificationCount] = React.useState<number>(0);
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
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/messages/unread-count", {
        cache: "no-store",
        credentials: "include",
        headers,
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
  }, [userId, refreshSession, session?.access_token]);

  const loadNotificationCount = React.useCallback(async () => {
    if (!userId) {
      setNotificationCount(0);
      return;
    }

    try {
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch("/api/notifications/unread-count", {
        cache: "no-store",
        credentials: "include",
        headers,
      });

      if (response.status === 401) {
        setNotificationCount(0);
        await refreshSession();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.count || 0);
      }
    } catch (error) {
      logger.error("Header: error loading notification count", error);
    }
  }, [userId, session?.access_token, refreshSession]);

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

  React.useEffect(() => {
    if (!userId) {
      return;
    }

    loadNotificationCount();
    const interval = setInterval(loadNotificationCount, 45000);
    return () => clearInterval(interval);
  }, [userId, loadNotificationCount]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handler = () => loadNotificationCount();
    window.addEventListener("notifications:updated", handler);
    return () => {
      window.removeEventListener("notifications:updated", handler);
    };
  }, [loadNotificationCount]);

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
        <Link key="notifications" href="/notifications" style={{ ...linkStyles, position: "relative" }}>
          🔔 Notifications
          {notificationCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-10px",
                background: "#2563eb",
                color: "white",
                borderRadius: "10px",
                padding: "1px 6px",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </Link>
      );

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
  }, [email, userRole, unreadCount, notificationCount]);

  const mobileLinkStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    color: "#1f2937",
    textDecoration: "none",
    fontWeight: 600,
    background: "#f9fafb",
  };

  const mobileLinks = React.useMemo(() => {
    const items: React.ReactNode[] = [];

    items.push(
      <Link key="pricing" href="/pricing" onClick={closeMobile} style={mobileLinkStyle}>
        Pricing
      </Link>
    );

    if (email && userRole === "wholesaler") {
      items.push(
        <Link key="my-listings" href="/my-listings" onClick={closeMobile} style={mobileLinkStyle}>
          My Listings
        </Link>
      );
    }

    if (email && userRole && userRole !== "wholesaler") {
      items.push(
        <Link key="watchlists" href="/watchlists" onClick={closeMobile} style={mobileLinkStyle}>
          ⭐ Watchlist
        </Link>
      );
      items.push(
        <Link key="saved" href="/saved-searches" onClick={closeMobile} style={mobileLinkStyle}>
          🔍 Saved
        </Link>
      );
      items.push(
        <Link key="alerts" href="/alerts" onClick={closeMobile} style={mobileLinkStyle}>
          🔔 Alerts
        </Link>
      );
    }

    if (email && userRole === "wholesaler") {
      items.push(
        <Link key="alerts-wholesaler" href="/alerts" onClick={closeMobile} style={mobileLinkStyle}>
          🔔 Alerts
        </Link>
      );
    }

    if (email) {
      items.push(
        <Link key="analyzer" href="/tools/analyzer" onClick={closeMobile} style={mobileLinkStyle}>
          <span>🔧 Analyzer</span>
        </Link>
      );
      items.push(
        <Link key="notifications" href="/notifications" onClick={closeMobile} style={mobileLinkStyle}>
          <span>🔔 Notifications</span>
          {notificationCount > 0 && (
            <span style={{ fontSize: 12, color: "#2563eb" }}>{notificationCount > 99 ? "99+" : notificationCount}</span>
          )}
        </Link>
      );
      items.push(
        <Link key="messages" href="/messages" onClick={closeMobile} style={mobileLinkStyle}>
          <span>💬 Messages</span>
          {unreadCount > 0 && (
            <span style={{ fontSize: 12, color: "#dc2626" }}>{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </Link>
      );
      items.push(
        <Link key="account" href="/account" onClick={closeMobile} style={mobileLinkStyle}>
          Account
        </Link>
      );
    }

    if (userRole === "admin") {
      items.push(
        <Link
          key="admin"
          href="/admin"
          onClick={closeMobile}
          style={{ ...mobileLinkStyle, borderColor: "#dc2626", color: "#dc2626" }}
        >
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
            ...mobileLinkStyle,
            borderColor: "#dc2626",
            background: "#dc2626",
            color: "white",
            cursor: signingOut ? "not-allowed" : "pointer",
            justifyContent: "center",
          }}
          disabled={signingOut}
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      );
    } else {
      items.push(
        <Link key="sign-in" href="/login" onClick={closeMobile} style={mobileLinkStyle}>
          Sign in
        </Link>
      );
    }

    return items;
  }, [email, userRole, unreadCount, notificationCount, closeMobile, signOut, signingOut, mobileLinkStyle]);

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
          {userRole === "wholesaler" && <PostDealButton fullWidth />}
          {mobileLinks}
        </div>
      )}
    </header>
  );
}