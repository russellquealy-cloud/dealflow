"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HeaderClient() {
  const pathname = usePathname();
  const [isAuthed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthed(!!data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const nextParam = encodeURIComponent(pathname || "/listings");

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid #e5e7eb",
        background: "white",
      }}
    >
      <Link href="/listings" style={{ fontWeight: 900 }}>
        Deal Flow
      </Link>

      <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Link href="/listings">Browse</Link>
        <Link href="/my-listings">My Listings</Link>

        {/* Post a Deal—route unauth users through login */}
        <Link
          href={isAuthed ? "/my-listings/new" : `/login?next=/my-listings/new`}
          className="border px-3 py-1 rounded"
        >
          Post a Deal
        </Link>

        {!isAuthed ? (
          <Link href={`/login?next=${nextParam}`} className="border px-3 py-1 rounded">
            Sign in
          </Link>
        ) : (
          <form action="/auth/signout" method="post">
            <button type="submit" className="border px-3 py-1 rounded">
              Sign out
            </button>
          </form>
        )}
      </nav>
    </header>
  );
}
