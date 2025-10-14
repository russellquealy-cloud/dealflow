import Image from "next/image";
import React from "react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { coverUrlFromListing, galleryFromListing } from "@/lib/images";
import type { Json } from "@/types";

type ListingRecord = {
  id: string | number;
  price?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  lat?: number | null;
  lng?: number | null;
  [k: string]: Json | null | undefined;
};

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", params.id)
    .single();

  const listing = (data ?? null) as unknown as ListingRecord | null;

  if (error || !listing) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Listing not found</h1>
        {error && <p className="mt-2 text-sm text-red-600">{String(error.message ?? error)}</p>}
      </main>
    );
  }

  const gallery = galleryFromListing(listing);
  const hero = gallery[0] || coverUrlFromListing(listing);
  const address = [listing.address, listing.city, listing.state, listing.zip]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media */}
        <div className="lg:col-span-2">
          <div className="relative w-full h-72 rounded-xl overflow-hidden border">
            {hero ? (
              <Image
                src={hero}
                alt={address || "Listing photo"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority={false}
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-neutral-400">No image</div>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {gallery.slice(1, 7).map((src, i) => (
                <div key={i} className="relative h-24 w-full rounded-lg overflow-hidden border">
                  <Image src={src} alt={`Photo ${i + 2}`} fill className="object-cover" sizes="33vw" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Facts */}
        <aside className="space-y-3">
          <h1 className="text-2xl font-semibold">
            {typeof listing.price === "number" ? formatCurrency(listing.price) : "—"}
          </h1>
          <div className="text-neutral-700">{address || "—"}</div>
          <div className="text-sm text-neutral-600">
            {listing.beds ?? "—"} bd • {listing.baths ?? "—"} ba •{" "}
            {listing.sqft ? listing.sqft.toLocaleString() : "—"} sq ft
          </div>
          {/* Add contact/actions here if needed */}
        </aside>
      </div>

      {/* Description / details section placeholder */}
      <section className="prose max-w-none">
        <h2>Details</h2>
        <p>More property details coming soon.</p>
      </section>
    </main>
  );
}
