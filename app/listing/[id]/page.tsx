// /app/listing/[id]/page.tsx
export const dynamic = "force-dynamic"; // and optionally: export const revalidate = 0;

import React from "react";
import { supabase } from "@/lib/supabaseClient";
import { Listing } from "@/types";
import { formatCurrency } from "@/lib/format";
import ContactButtons from "@/components/ContactButtons";
import { coverUrlFromListing, galleryFromListing } from "@/lib/images";

const siteBg = "#fafafa";

// Outer wrapper to match site background
const shellOuter: React.CSSProperties = { background: siteBg, minHeight: "100vh" };

// Inner content container
const shell: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: 16,
  display: "grid",
  gap: 16,
};

const titleStyle: React.CSSProperties = { fontWeight: 900, fontSize: 24 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 16 };
const panel: React.CSSProperties = { border: "1px solid #e5e5e5", borderRadius: 14, background: "#fff", overflow: "hidden" };
const panelBody: React.CSSProperties = { padding: 14, display: "grid", gap: 10 };
const imgMainWrap: React.CSSProperties = { width: "100%", aspectRatio: "16 / 10", background: "#f5f5f5", overflow: "hidden" };
const imgMain: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };
const thumbs: React.CSSProperties = { display: "flex", gap: 8, overflowX: "auto", padding: "8px 12px", borderTop: "1px solid #eee" };
const thumb: React.CSSProperties = { width: 90, height: 70, borderRadius: 8, overflow: "hidden", border: "1px solid #ddd", flex: "0 0 auto" };
const thumbImg: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };

const stickyFooter: React.CSSProperties = {
  position: "sticky",
  bottom: 0,
  background: "rgba(255,255,255,0.98)",
  backdropFilter: "blur(4px)",
  borderTop: "1px solid #eee",
  padding: "10px 0",
  zIndex: 10,
};

import type { Json } from '@/app/types';
type Listing = {
  id: string;
  address?: string | null; city?: string | null; state?: string | null; zip?: string | null;
  price?: number | null; beds?: number | null; baths?: number | null; sqft?: number | null;
  lat?: number | null; lng?: number | null;
  [k: string]: Json | null | undefined;
};
// replace any variables with `Listing | null` or `unknown` and narrow as needed


function Address({ l }: { l: Listing }) {
  const parts = [l.address, l.city, l.state, l.zip].filter(Boolean).join(", ");
  return <span>{parts}</span>;
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const { data, error } = await supabase.from("listings").select("*").eq("id", params.id).single();
  if (error) console.error(error);

  const l = (data ?? null) as Listing | null;

  if (!l) {
    return (
      <main style={shellOuter}>
        <div style={shell}>
          <div>Listing not found.</div>
        </div>
      </main>
    );
  }

  const cover = coverUrlFromListing(l);
  const gallery = galleryFromListing(l);

  const beds =
    nb(l.beds ?? l.bedrooms ?? l.bed_count ?? l.num_beds ?? l.br);
  const baths =
    nb(l.baths ?? l.bathrooms ?? l.bath_count ?? l.num_baths ?? l.ba);
  const sqft =
    nb(l.sqft ?? l.square_feet ?? l.square_footage ?? l.living_area ?? l.sq_feet);

  return (
    <main style={shellOuter}>
      <div style={shell}>
        {/* Title only (no top contact row) */}
        <div style={titleStyle}>{l.title ?? "Property"}</div>

        <div style={grid as React.CSSProperties}>
          {/* Left: media + description */}
          <section style={panel}>
            {cover ? (
              <div style={imgMainWrap}>
                <img src={cover} alt={l.title ?? "Listing"} style={imgMain} />
              </div>
            ) : null}

            {gallery.length > 1 ? (
              <div style={thumbs}>
                {gallery.slice(1).map((src, i) => (
                  <div key={i} style={thumb}>
                    <img src={src} alt={`Photo ${i + 2}`} style={thumbImg} />
                  </div>
                ))}
              </div>
            ) : null}

            <div style={panelBody}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{formatCurrency(l.price)}</div>
              <div style={{ color: "#333" }}>
                <Address l={l} />
              </div>
              <div style={{ fontWeight: 600 }}>
                {beds ?? "—"} bd • {baths ?? "—"} ba • {sqft ? `${sqft.toLocaleString()} sqft` : "—"} •{" "}
                {l.lot_size ? `${Number(l.lot_size).toLocaleString()} lot` : "—"}
              </div>
              {l.description ? (
                <div style={{ lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{l.description}</div>
              ) : null}
            </div>
          </section>

          {/* Right: facts + sticky mobile contact */}
          <aside style={panel}>
            <div style={{ ...panelBody, gap: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>Facts & Features</div>
              <div><strong>Beds:</strong> {beds ?? "—"}</div>
              <div><strong>Baths:</strong> {baths ?? "—"}</div>
              <div><strong>Home Sq Ft:</strong> {sqft ? sqft.toLocaleString() : "—"}</div>
              <div><strong>Lot Size:</strong> {l.lot_size ? Number(l.lot_size).toLocaleString() : "—"}</div>
            </div>

            <div style={stickyFooter} className="mobile-contact">
              <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>
                <ContactButtons phone={l.contact_phone ?? undefined} email={l.contact_email ?? undefined} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
