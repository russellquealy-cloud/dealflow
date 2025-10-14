"use client";

import Image from "next/image";
import Link from "next/link";

/** Minimal shape the card needs. Adjust/extend freely. */
type ListingCardData = {
  id: string | number;
  price?: number | string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  beds?: number | string;
  baths?: number | string;
  sqft?: number | string;
  arv?: number | string;
  repairs?: number | string;
  spread?: number | string;
  roi?: number | string;
  images?: string[];
  imageUrl?: string; // alternate single URL field
};

type Props = { listing: ListingCardData };

function toNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function currency(n: unknown): string {
  return toNumber(n).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function ListingCard({ listing }: Props) {
  const addr1 = listing.address ?? "";
  const city  = listing.city ?? "";
  const state = listing.state ?? "";
  const zip   = listing.zip ?? "";
  const address = [addr1, city, state, zip].filter(Boolean).join(", ");

  const beds  = toNumber(listing.beds);
  const baths = toNumber(listing.baths);
  const sqft  = toNumber(listing.sqft);

  const imageSrc =
    listing.imageUrl ||
    (listing.images && listing.images.length > 0 ? listing.images[0] : undefined);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Image */}
      <div className="relative h-44 w-full bg-gray-100">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={address || "Listing photo"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
            No image
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">{currency(listing.price)}</div>
          <Link
            href={`/listing/${listing.id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            View
          </Link>
        </div>

        <div className="text-sm text-gray-600">{address || "—"}</div>

        <div className="text-xs text-gray-500">
          {beds ? `${beds} bd` : ""}{beds && baths ? " • " : ""}
          {baths ? `${baths} ba` : ""}{(beds || baths) && sqft ? " • " : ""}
          {sqft ? `${sqft.toLocaleString()} sq ft` : ""}
        </div>

        {/* Chips */}
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {toNumber(listing.arv) > 0 && (
            <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">
              ARV {currency(listing.arv)}
            </span>
          )}
          {toNumber(listing.repairs) > 0 && (
            <span className="rounded-full bg-orange-50 px-2 py-1 text-orange-700">
              Repairs {currency(listing.repairs)}
            </span>
          )}
          {toNumber(listing.spread) > 0 && (
            <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">
              Spread {currency(listing.spread)}
            </span>
          )}
          {toNumber(listing.roi) > 0 && (
            <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-700">
              ROI {toNumber(listing.roi)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
