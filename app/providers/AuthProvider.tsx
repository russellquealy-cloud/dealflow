"use client";

import React from "react";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/supabase/client";
import { logger } from "@/lib/logger";
import { mobileSessionManager } from "@/lib/mobile-session";

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [initialized, setInitialized] = React.useState(false);
  const subscriptionRef = React.useRef<{ subscription: { unsubscribe: () => void } } | null>(null);

  const refreshSession = React.useCallback(async () => {
    // Don't set loading to true if already initialized to prevent flicker
    if (!initialized) {
      setLoading(true);
    }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        logger.error("AuthProvider refreshSession error:", error);
        setSession(null);
        return;
      }
      setSession(data.session ?? null);
    } catch (error) {
      logger.error("AuthProvider refreshSession exception:", error);
      setSession(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [initialized]);

  React.useEffect(() => {
    let isMounted = true;

    const init = async () => {
      await mobileSessionManager.initialize();
      if (!isMounted) return;
      await refreshSession();
    };

    init();

    // Only set up auth state change listener once
    if (!subscriptionRef.current) {
      const { data: subscription } = supabase.auth.onAuthStateChange(
        (event: AuthChangeEvent, newSession: Session | null) => {
          // Ignore TOKEN_REFRESHED events to prevent flicker
          if (event === "TOKEN_REFRESHED") {
            return;
          }

          if (event === "SIGNED_IN" || event === "USER_UPDATED") {
            logger.log(`🔐 AuthProvider event: ${event}`);
            mobileSessionManager.handleAuthEvent(event, newSession);
            setSession(newSession);
            setLoading(false);
            setInitialized(true);
            return;
          }

          if (event === "SIGNED_OUT") {
            logger.log("🔐 AuthProvider event: SIGNED_OUT");
            mobileSessionManager.handleAuthEvent(event, null);
            setSession(null);
            setLoading(false);
            setInitialized(true);
          }
        }
      );
      subscriptionRef.current = subscription;
    }

    return () => {
      isMounted = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.subscription.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [refreshSession]);

  const value = React.useMemo<AuthContextValue>(
    () => ({ session, loading, refreshSession }),
    [session, loading, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
