// /app/components/Header.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase/client";
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
      console.error('Error loading unread count:', error);
    }
  }, []);

  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          return;
        }
        
        if (session) {
          setEmail(session.user.email || null);
          // Load user role with timeout and error handling
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) {
              console.error('Error loading profile:', profileError);
              // Try again after a short delay
              setTimeout(async () => {
                const { data: retryProfile } = await supabase
                  .from('profiles')
                  .select('role')
                  .eq('id', session.user.id)
                  .single();
                if (retryProfile) {
                  console.log('Retry successful - loaded role:', retryProfile.role);
                  setUserRole(retryProfile.role || '');
                }
              }, 1000);
            } else if (profile) {
              console.log('Loaded user role:', profile.role);
              setUserRole(profile.role || '');
            }
          } catch (error) {
            console.error('Error in role loading:', error);
          }
          // Load unread count
          loadUnreadCount();
        } else {
          setEmail(null);
          setUserRole('');
          setUnreadCount(0);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
    
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      // CRITICAL: Only update on actual auth changes, not token refreshes
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setEmail(session?.user?.email || null);
        if (session) {
          // Load user role with error handling
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) {
              console.error('Error loading profile on auth change:', profileError);
            } else if (profile) {
              console.log('Auth change - loaded role:', profile.role);
              setUserRole(profile.role || '');
            }
          } catch (error) {
            console.error('Error in role loading on auth change:', error);
          }
          // Load unread count
          loadUnreadCount();
        } else {
          setUserRole('');
          setUnreadCount(0);
        }
      }
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
      
      // Create a timeout to force redirect after 3 seconds
      const timeoutId = setTimeout(() => {
        console.warn('🔐 Sign out timeout, forcing redirect...');
        window.location.href = '/welcome';
      }, 3000);
      
      // Sign out from Supabase first (with timeout)
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 2000)
      );
      
      await Promise.race([signOutPromise, timeoutPromise]).catch(() => {
        console.warn('Sign out timed out or failed, continuing...');
      });
      
      // Then call server-side signout endpoint (non-blocking)
      fetch('/auth/signout', { method: 'POST' }).catch(() => {
        // Ignore errors
      });
      
      clearTimeout(timeoutId);
      console.log('🔐 Sign out complete, redirecting...');
      // Use window.location for a hard redirect to clear all state
      window.location.href = '/welcome';
    } catch (error) {
      console.error('🔐 Sign out error:', error);
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
        {userRole === 'wholesaler' && (
          <Link href="/my-listings" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>My Listings</Link>
        )}
        {email && userRole !== 'wholesaler' && (
          <>
            <Link href="/watchlists" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>⭐ Watchlist</Link>
            <Link href="/saved-searches" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>🔍 Saved</Link>
            <Link href="/alerts" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>🔔 Alerts</Link>
          </>
        )}
        {email && userRole === 'wholesaler' && (
          <Link href="/alerts" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>🔔 Alerts</Link>
        )}
        <Link href="/pricing" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>Pricing</Link>
        {userRole === 'admin' && (
          <Link href="/admin" style={{ textDecoration: "none", color: "#dc2626", fontWeight: 600 }}>🔒 Admin</Link>
        )}
        {/* Only show "Post a Deal" for wholesalers, not investors */}
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