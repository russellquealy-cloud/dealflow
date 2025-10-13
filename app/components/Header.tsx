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
    // hit the server route to clear httpOnly cookie
    await fetch("/auth/signout", { method: "POST" });
    router.refresh();
    router.push("/"); // send them home
  };

  return (
    <header style={wrap}>
      <Link href="/listings" style={link}>Deal Flow</Link>
      <div style={right}>
        <Link href="/listings" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>Browse</Link>
        <Link href="/my-listings" style={{ textDecoration: "none", color: "#333", fontWeight: 600 }}>My Listings</Link>
        {email ? (
          <>
            <span style={{ color: "#666" }}>{email}</span>
            <button style={btn} onClick={signOut}>Sign out</button>
          </>
        ) : (
          <Link href="/login" style={btn as React.CSSProperties}>Sign in</Link>
        )}
      </div>
    </header>
  );
}
