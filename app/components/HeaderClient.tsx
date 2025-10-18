"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HeaderClient() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setEmail(data.session?.user?.email ?? null);
    };

    // initial + keep in sync
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
      router.refresh();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  const nextParam = encodeURIComponent(pathname || "/");

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
        Deal Flow
      </Link>

      <nav style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Link href="/listings">Listings</Link>
        <Link href="/my-listings">My Listings</Link>
        <Link href="/post">Post Deal</Link>

        <span style={{ color: "#6b7280", fontSize: 13 }}>
          {email ?? "Not Logged In"}
        </span>

        {email ? (
          <form action="/auth/signout" method="post" style={{ margin: 0 }}>
            <button type="submit" className="border px-3 py-1 rounded">Sign out</button>
          </form>
        ) : (
          <Link href={`/login?next=${nextParam}`} className="border px-3 py-1 rounded">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
