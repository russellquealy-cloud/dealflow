// /app/components/Header.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
};

const right: React.CSSProperties = { display: "flex", gap: 10, alignItems: "center" };
const btn: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: "8px 12px",
  background: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};
const link: React.CSSProperties = { textDecoration: "none", color: "#111", fontWeight: 800, fontSize: 18 };

export default function Header() {
  const router = useRouter();
  const { session, refreshSession } = useAuth();
  const email = session?.user?.email ?? null;
  const userId = session?.user?.id ?? null;
  const [userRole, setUserRole] = React.useState<string>("");
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [signingOut, setSigningOut] = React.useState(false);

  const loadUnreadCount = React.useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch("/api/messages/unread-count", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      logger.error("Header: error loading unread count", error);
    }
  }, [userId]);

  React.useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setUserRole("");
      setUnreadCount(0);
      return;
    }

    const loadProfile = async () => {
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

        if (!cancelled && profile) {
          const role = profile.segment || profile.role || "";
          setUserRole(role);
        }
      } catch (error) {
        logger.error("Header: exception loading profile", error);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  React.useEffect(() => {
    if (!userId) {
      return;
    }

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userId, loadUnreadCount]);

  const signOut = async () => {
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
      router.replace("/login");
    }
  };

  return (
    <header style={wrap}>
      <Link 
        href="/listings" 
        style={link}
      >
        Off Axis Deals
      </Link>
      <div style={right}>
        {email && userRole === "wholesaler" && (
          <Link href="/my-listings" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>My Listings</Link>
        )}

        {email && userRole && userRole !== "wholesaler" && (
          <>
            <Link href="/watchlists" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>⭐ Watchlist</Link>
            <Link href="/saved-searches" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>🔍 Saved</Link>
            <Link href="/alerts" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>🔔 Alerts</Link>
          </>
        )}

        {email && userRole === "wholesaler" && (
          <Link href="/alerts" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>🔔 Alerts</Link>
        )}

        {email && (
          <Link href="/tools/analyzer" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>🔧 Analyzer</Link>
        )}

        <Link href="/pricing" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>Pricing</Link>

        {userRole === "admin" && (
          <Link href="/admin" style={{ textDecoration: "none", color: "#dc2626", fontWeight: 600 }}>🔒 Admin</Link>
        )}

        {userRole === "wholesaler" && <PostDealButton />}

        {email ? (
          <>
            <Link 
              href="/messages" 
              style={{ 
                textDecoration: "none", 
                color: "#333", 
                fontWeight: 600,
                position: "relative",
                padding: "8px 12px",
                borderRadius: "8px",
                display: "inline-block"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              💬 Messages
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "#dc2626",
                  color: "white",
                  borderRadius: "10px",
                  padding: "2px 6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  minWidth: "18px",
                  textAlign: "center"
                }}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            <Link href="/account" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>Account</Link>
            <span style={{ color: "#666", fontSize: 14 }}>{email}</span>
            <button 
              style={{ 
                ...btn, 
                background: "#dc2626", 
                color: "#fff", 
                border: "1px solid #dc2626",
                fontWeight: 600,
                opacity: signingOut ? 0.7 : 1,
                pointerEvents: signingOut ? "none" : "auto"
              }} 
              onClick={signOut}
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </>
        ) : (
          <Link href="/login" style={btn as React.CSSProperties}>Sign in</Link>
        )}
      </div>
    </header>
  );
}