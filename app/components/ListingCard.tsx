import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { Listing } from "@/types";

/**
 * Safe getters so we don't need `any`.
 */
function asNumber(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}
function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/**
 * Card for a single listing
 */
export default function ListingCard({ listing }: { listing: Listing }) {
  // Basic fields (the Listing type should already include these)
  const price = (listing as Listing).price ?? null;
  const beds = (listing as Listing).beds ?? null;
  const baths = (listing as Listing).baths ?? null;
  const sqft = (listing as Listing).sqft ?? null;

  // Optional metrics often present on your cards
  const arv = (listing as Partial<Listing> & Record<string, unknown>).arv as number | undefined;
  const repairs = (listing as Partial<Listing> & Record<string, unknown>).repairs as number | undefined;
  const spread = (listing as Partial<Listing> & Record<string, unknown>).spread as number | undefined;
  const roi = (listing as Partial<Listing> & Record<string, unknown>).roi as number | undefined;

  // Address parts (fall back to blank strings to avoid "undefined, , ,")
  const addr1 = (listing as Partial<Listing> & Record<string, unknown>).address as string | undefined;
  const city  = (listing as Partial<Listing> & Record<string, unknown>).city as string | undefined;
  const state = (listing as Partial/List­ing> & Record<string, unknown>).state as string | undefined;
  const zip   = (listing as Partial<Listing> & Record<string, unknown>).zip as string | undefined;

  const address = [addr1, city, state, zip].filter(Boolean).join(", ");

  // Best-effort cover image without introducing `any`
  const bag = listing as unknown as Record<string, unknown>;
  const cover =
    (bag["coverUrl"] as string | undefined) ||
    (bag["cover_url"] as string | undefined) ||
    (Array.isArray(bag["images"]) && typeof (bag["images"] as unknown[])[0] === "string"
      ? (bag["images"] as string[])[0]
      : undefined);

  return (
    <article className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* media */}
      <div className="relative h-44 w-full bg-neutral-100">
        {cover ? (
          <Image
            src={cover}
            alt={address || "Listing photo"}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
            priority={false}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-neutral-400">
            No image
          </div>
        )}
      </div>

      {/* content */}
      <div className="p-4 space-y-2">
        <div className="text-xl font-semibold">
          {price != null ? formatCurrency(price) : "—"}
        </div>

        <div className="text-sm text-neutral-600">
          {beds ?? "—"} bd • {baths ?? "—"} ba • {sqft ?? "—"} sq ft
        </div>

        {/* badges row */}
        <div className="flex flex-wrap gap-2 pt-1">
          {typeof arv === "number" && (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              ARV {formatCurrency(arv)}
            </span>
          )}
          {typeof repairs === "number" && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              Repairs {formatCurrency(repairs)}
            </span>
          )}
          {typeof spread === "number" && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Spread {formatCurrency(spread)}
            </span>
          )}
          {typeof roi === "number" && (
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
              ROI {roi}%
            </span>
          )}
        </div>

        <div className="mt-1 text-sm text-neutral-700">
          {address || asString(bag["display_address"])}
        </div>

        {/* detail link (keep simple; your routing may vary) */}
        <div className="pt-2">
          <Link
            href={`/listing/${(listing as Listing).id}`}
            className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
