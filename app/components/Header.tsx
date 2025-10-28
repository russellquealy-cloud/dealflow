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

  React.useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setEmail(session.user.email);
        // Load user role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
        }
      }
    };

    loadUserData();
    
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      // CRITICAL: Only update on actual auth changes, not token refreshes
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setEmail(session?.user?.email || null);
        if (session) {
          // Load user role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
          if (profile) {
            setUserRole(profile.role);
          }
        } else {
          setUserRole('');
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      console.log('🔐 Signing out...');
      // end client session
      await supabase.auth.signOut();
      // also hit server route to clear cookies if set
      await fetch('/auth/signout', { method: 'POST' }).catch(() => {});
      console.log('🔐 Sign out complete, redirecting...');
      router.push('/'); // back home
      router.refresh();
    } catch (error) {
      console.error('🔐 Sign out error:', error);
      // Force redirect even if sign out fails
      router.push('/');
      router.refresh();
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
        <Link href="/my-listings" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>My Listings</Link>
        <Link href="/pricing" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>Pricing</Link>
        {userRole === 'admin' && (
          <Link href="/admin" style={{ textDecoration: "none", color: "#dc2626", fontWeight: 600 }}>🔒 Admin</Link>
        )}
        <PostDealButton />
               {email ? (
                 <>
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