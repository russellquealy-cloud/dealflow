// /app/components/Header.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
  // end client session
  await supabase.auth.signOut();
  // also hit server route to clear cookies if set
  await fetch('/auth/signout', { method: 'POST' }).catch(() => {});
  router.push('/'); // back home
  router.refresh();
};

  const handlePostDeal = async () => {
    try {
      // Check session more thoroughly with better error handling
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('Post Deal - Session check:', { session: !!session, user: !!session?.user, error });
      
      if (error) {
        console.error('Session check error:', error);
        // If there's an error checking session, redirect to login
        router.push('/login?next=/my-listings/new');
        return;
      }
      
      if (session && session.user) {
        console.log('User is signed in, redirecting to new listing');
        // User is signed in, go to new listing page
        router.push('/my-listings/new');
      } else {
        console.log('User not signed in, redirecting to login');
        // User is not signed in, go to login page with redirect
        router.push('/login?next=/my-listings/new');
      }
    } catch (err) {
      console.error('Error in handlePostDeal:', err);
      // If there's any error, redirect to login
      router.push('/login?next=/my-listings/new');
    }
  };

  return (
    <header style={wrap}>
      <Link href="/listings" style={link}>Deal Flow</Link>
      <div style={right}>
        <Link href="/browse" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>Browse</Link>
        <Link href="/my-listings" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>My Listings</Link>
        <button 
          onClick={handlePostDeal}
          style={{ 
            ...btn, 
            background: "#10b981", 
            color: "#fff", 
            border: "1px solid #10b981",
            fontWeight: 600 
          }}
        >
          Post a Deal
        </button>
        {email ? (
          <>
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