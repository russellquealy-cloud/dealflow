// /app/components/LocationSearch.tsx
"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const bar: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" };
const input: React.CSSProperties = { flex: "1 1 320px", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" };
const btn: React.CSSProperties = { border: "1px solid #ddd", borderRadius: 10, padding: "10px 14px", fontWeight: 800, background: "#111", color: "#fff", cursor: "pointer" };

export default function LocationSearch() {
  const [q, setQ] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      // Nominatim: basic geocode
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q.trim())}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const arr = await res.json();
      if (arr?.length) {
        const bb = arr[0].boundingbox; // [south, north, west, east] strings
        const south = parseFloat(bb[0]);
        const north = parseFloat(bb[1]);
        const west = parseFloat(bb[2]);
        const east = parseFloat(bb[3]);
        const s = new URLSearchParams(params ? Array.from(params.entries()) : []);
        s.set("bbox", [south, west, north, east].join(","));
        router.push(`${pathname}?${s.toString()}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    const s = new URLSearchParams(params.toString());
    s.delete("bbox");
    router.push(`${pathname}?${s.toString()}`);
  };

  return (
    <form onSubmit={submit} style={bar}>
      <input
        style={input}
        placeholder="Search city or address (e.g., Tucson, AZ)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button type="submit" style={btn} disabled={loading}>{loading ? "Searching…" : "Search"}</button>
      <button type="button" style={{ ...btn, background: "#fff", color: "#111" }} onClick={clear}>Clear Area</button>
    </form>
  );
}
