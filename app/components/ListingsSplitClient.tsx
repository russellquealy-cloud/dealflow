"use client";

import * as React from "react";
import MapViewClient from "./MapViewClient";
import ListingCard from "./ListingCard";

// Minimal shapes so we don't use `any`
type LatLng = { lat: number; lng: number };
type BoundsLike = { _southWest: LatLng; _northEast: LatLng } | null;

type FeaturePoint = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: Record<string, unknown>;
};

type ListingWithCoords = {
  id: string;
  lat?: number | string | null;
  lng?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lon?: number | string | null;
  long?: number | string | null;
} & Record<string, unknown>;

type Props = {
  points: FeaturePoint[];
  listings: ListingWithCoords[];
};

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function coordsFromListing(l: ListingWithCoords): { lat: number; lng: number } | null {
  const lat =
    toNumber(l.lat) ?? toNumber(l.latitude);
  const lng =
    toNumber(l.lng) ?? toNumber(l.longitude) ?? toNumber(l.lon) ?? toNumber(l.long);

  return lat !== null && lng !== null ? { lat, lng } : null;
}

export default function ListingsSplitClient({ points, listings }: Props) {
  const [bounds, setBounds] = React.useState<BoundsLike>(null);

  const visible = React.useMemo(() => {
    if (!bounds) return listings;

    const { _southWest, _northEast } = bounds;

    const within = (lat: number, lng: number) =>
      lat >= _southWest.lat &&
      lat <= _northEast.lat &&
      lng >= _southWest.lng &&
      lng <= _northEast.lng;

    return listings.filter((l) => {
      const c = coordsFromListing(l);
      return c ? within(c.lat, c.lng) : false;
    });
  }, [bounds, listings]);

  // Prevent page scroll jitter while the list scrolls
  return (
    <div
      className="grid grid-cols-12 gap-6 overflow-hidden"
      style={{ ["--df-offset" as unknown as string]: "240px" }}
    >
      {/* Map column */}
      <div className="col-span-12 lg:col-span-6 min-h-0">
        <MapViewClient points={points} onBoundsChange={setBounds} />
      </div>

      {/* List column (independent scroll) */}
      <div className="col-span-12 lg:col-span-6 min-h-0">
        <div className="h-[calc(100vh-var(--df-offset))] overflow-y-auto pr-2 space-y-4">
          {visible.map((l) => (
            <ListingCard key={String(l.id)} listing={l} />
          ))}
        </div>
      </div>
    </div>
  );
}
