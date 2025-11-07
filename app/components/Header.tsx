// /app/components/Header.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { supabase } from "@/supabase/client";
import { logger } from "@/lib/logger";
import PostDealButton from "./PostDealButton";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

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
  const [email, setEmail] = React.useState<string | null>(null);
  const [userRole, setUserRole] = React.useState<string>('');
  const [unreadCount, setUnreadCount] = React.useState<number>(0);

  // Load unread message count
  const loadUnreadCount = React.useCallback(async () => {
    try {
      const response = await fetch('/api/messages/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      logger.error('Error loading unread count:', error);
    }
  }, []);

  React.useEffect(() => {
    const loadUserData = async () => {
      console.log('🔍 Header - Starting to load user data...');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('🔍 Header - Session check:', { hasSession: !!session, email: session?.user?.email, error: sessionError?.message });
        
        if (sessionError) {
          logger.error('Session error:', sessionError);
          console.error('❌ Header - Session error:', sessionError);
          return;
        }
        
        if (session) {
          setEmail(session.user.email || null);
          console.log('🔍 Header - Loading profile for user:', session.user.id);
          
          // Load user role with timeout and error handling
          // Check both 'role' and 'segment' fields to support both naming conventions
          try {
            const profileStart = Date.now();
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role, segment')
              .eq('id', session.user.id)
              .single();
            const profileTime = Date.now() - profileStart;
            
            console.log(`🔍 Header - Profile query took ${profileTime}ms:`, { 
              profile, 
              error: profileError ? { message: profileError.message, code: profileError.code } : null 
            });
            
            if (profileError) {
              logger.error('Error loading profile:', profileError);
              console.error('❌ Header - Profile error:', profileError);
              // Try again after a short delay
              setTimeout(async () => {
                console.log('🔄 Header - Retrying profile load...');
                const { data: retryProfile, error: retryError } = await supabase
                  .from('profiles')
                  .select('role, segment')
                  .eq('id', session.user.id)
                  .single();
                console.log('🔄 Header - Retry result:', { profile: retryProfile, error: retryError });
                if (retryProfile) {
                  const role = retryProfile.segment || retryProfile.role || '';
                  logger.log('Retry successful - loaded role:', role);
                  console.log('✅ Header - Retry successful, role:', role);
                  setUserRole(role);
                }
              }, 1000);
            } else if (profile) {
              // Prefer 'segment' over 'role' for consistency
              // Also check email for test accounts
              const role = profile.segment || profile.role || '';
              logger.log('Loaded user role:', role, 'Profile:', { segment: profile.segment, role: profile.role, email: session.user.email });
              console.log('✅ Header - Loaded user role:', role, 'Profile:', { segment: profile.segment, role: profile.role, email: session.user.email });
              console.log('🔍 Header - Will show Post a Deal?', role === 'wholesaler');
              setUserRole(role);
              // Load unread count AFTER role is set
              loadUnreadCount();
            } else {
              console.warn('⚠️ Header - No profile found for user:', session.user.email);
              // Still load unread count even if no profile
              loadUnreadCount();
            }
          } catch (error) {
            logger.error('Error in role loading:', error);
            console.error('❌ Header - Exception loading role:', error);
            // Still try to load unread count
            loadUnreadCount();
          }
        } else {
          console.log('🔍 Header - No session found');
          setEmail(null);
          setUserRole('');
          setUnreadCount(0);
        }
      } catch (error) {
        logger.error('Error loading user data:', error);
        console.error('❌ Header - Exception loading user data:', error);
      }
    };

    loadUserData();
    
    const { data: sub } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      // CRITICAL: Only update on actual auth changes, NOT token refreshes
      // TOKEN_REFRESHED causes auto re-sign-in after sign out
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        console.log('🔍 Header - Auth state changed:', event);
        
        if (event === 'SIGNED_OUT') {
          // Clear state immediately on sign out
          console.log('🔍 Header - Signed out, clearing state');
          setEmail(null);
          setUserRole('');
          setUnreadCount(0);
          return; // Don't reload profile on sign out
        }
        
        if (session && event === 'SIGNED_IN') {
          setEmail(session.user.email || null);
          // Load user role with error handling
          // Check both 'role' and 'segment' fields to support both naming conventions
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role, segment')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) {
              logger.error('Error loading profile on auth change:', profileError);
              console.error('❌ Header - Auth change profile error:', profileError);
            } else if (profile) {
              // Prefer 'segment' over 'role' for consistency
              const role = profile.segment || profile.role || '';
              logger.log('Auth change - loaded role:', role);
              console.log('✅ Header - Auth change - loaded role:', role, 'Profile:', { segment: profile.segment, role: profile.role });
              setUserRole(role);
            } else {
              console.warn('⚠️ Header - Auth change - No profile found for user:', session.user.email);
            }
          } catch (error) {
            logger.error('Error in role loading on auth change:', error);
            console.error('❌ Header - Auth change exception:', error);
          }
          // Load unread count
          loadUnreadCount();
        }
      }
      // Ignore TOKEN_REFRESHED to prevent auto re-sign-in
    });
    
    // Poll for unread count every 30 seconds if logged in
    const pollInterval = setInterval(() => {
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          loadUnreadCount();
        }
      };
      checkSession();
    }, 30000); // 30 seconds
    
    return () => {
      sub.subscription.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [loadUnreadCount]);

  const signOut = async () => {
    try {
      console.log('🔐 Signing out...');
      logger.log('🔐 Signing out...');
      
      // Clear local state immediately FIRST
      setEmail(null);
      setUserRole('');
      setUnreadCount(0);
      
      // Sign out from Supabase client-side
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('❌ Client sign out error:', signOutError);
        logger.warn('Client-side sign out error:', signOutError);
      }
      
      // Clear localStorage to prevent auto re-sign-in
      try {
        localStorage.removeItem('dealflow-auth-token');
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
      } catch (e) {
        console.warn('Could not clear localStorage:', e);
      }
      
      // Call server-side signout endpoint
      try {
        const response = await fetch('/auth/signout', { 
          method: 'POST',
          credentials: 'include',
          redirect: 'manual'
        });
        
        console.log('🔐 Server sign out response:', response.status);
        
        // Force redirect immediately - don't wait
        window.location.href = '/welcome';
      } catch (fetchError) {
        console.warn('Server sign out fetch error:', fetchError);
        logger.warn('Server sign out fetch error (non-critical):', fetchError);
        // Force redirect even if fetch fails
        window.location.href = '/welcome';
      }
      
    } catch (error) {
      console.error('❌ Sign out error:', error);
      logger.error('🔐 Sign out error:', error);
      // Force redirect even if sign out fails
      window.location.href = '/welcome';
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
        {/* Only show "My Listings" for wholesalers, not investors */}
        {email && userRole === 'wholesaler' && (
          <Link href="/my-listings" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>My Listings</Link>
        )}
        {/* Show investor-specific items for investors (when role is not wholesaler and user is logged in) */}
        {email && userRole && userRole !== 'wholesaler' && (
          <>
            <Link href="/watchlists" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>⭐ Watchlist</Link>
            <Link href="/saved-searches" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>🔍 Saved</Link>
            <Link href="/alerts" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>🔔 Alerts</Link>
          </>
        )}
        {/* Show alerts for wholesalers */}
        {email && userRole === 'wholesaler' && (
          <Link href="/alerts" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>🔔 Alerts</Link>
        )}
        {/* Show analyzer/tools link for all logged-in users */}
        {email && (
          <Link href="/tools/analyzer" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>🔧 Analyzer</Link>
        )}
        <Link href="/pricing" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>Pricing</Link>
        {userRole === 'admin' && (
          <Link href="/admin" style={{ textDecoration: "none", color: "#dc2626", fontWeight: 600 }}>🔒 Admin</Link>
        )}
        {/* Show "Post a Deal" for ALL wholesalers regardless of tier */}
        {userRole === 'wholesaler' && <PostDealButton />}
               {email ? (
                 <>
                   {/* Messages button with unread count */}
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
                         {unreadCount > 99 ? '99+' : unreadCount}
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
                       fontWeight: 600 
                     }} 
                     onClick={signOut}
                   >
                     Sign out
                   </button>
                 </>
               ) : (
                 <Link href="/login" style={btn as React.CSSProperties}>Sign in</Link>
               )}
      </div>
    </header>
  );
}