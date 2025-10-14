"use client";

import * as React from "react";
import MapViewClient from "./MapViewClient";
import ListingCard from "./ListingCard";

type Bounds = { _southWest: { lat: number; lng: number }; _northEast: { lat: number; lng: number } };

type GeoPoint = {
  type: "Feature";
  id?: string | number;
  geometry: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  properties: Record<string, unknown>;
};

type MapPoint = { id: string; lat: number; lng: number };

type Listing = {
  id: string | number;
  lat?: number | string | null;
  lng?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  lon?: number | string | null;
  long?: number | string | null;
} & Record<string, unknown>;

type Props = {
  points: GeoPoint[] | MapPoint[];
  listings: Listing[];
};

const toNum = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export default function ListingsSplitClient({ points, listings }: Props) {
  const [bounds, setBounds] = React.useState<Bounds | null>(null);

  // Normalize incoming points to { id, lat, lng } for MapViewClient
  const mapPoints: MapPoint[] = React.useMemo(() => {
    if (!Array.isArray(points)) return [];
    // Already MapPoint[]
    if (points.length && "lat" in (points[0] as any) && "lng" in (points[0] as any)) {
      return (points as MapPoint[]).map((p) => ({
        id: String(p.id ?? `${p.lat},${p.lng}`),
        lat: p.lat,
        lng: p.lng,
      }));
    }
    // GeoJSON Feature[]
    return (points as GeoPoint[])
      .filter((f) => f?.geometry?.type === "Point" && Array.isArray(f.geometry.coordinates))
      .map((f, i) => {
        const [lng, lat] = f.geometry.coordinates;
        return {
          id: String(f.id ?? i),
          lat: Number(lat),
          lng: Number(lng),
        };
      });
  }, [points]);

  const visible = React.useMemo(() => {
    if (!bounds) return listings;

    const { _southWest, _northEast } = bounds;
    const within = (lat: number, lng: number) =>
      lat >= _southWest.lat &&
      lat <= _northEast.lat &&
      lng >= _southWest.lng &&
      lng <= _northEast.lng;

    return listings.filter((l) => {
      const lat =
        toNum(l.lat) ?? toNum(l.latitude);
      const lng =
        toNum(l.lng) ?? toNum(l.longitude) ?? toNum(l.lon) ?? toNum(l.long);
      return lat !== null && lng !== null && within(lat, lng);
    });
  }, [bounds, listings]);

  return (
    <div
      className="grid grid-cols-12 gap-6 overflow-hidden"
      style={{ ["--df-offset" as unknown as string]: "240px" }}
    >
      {/* Map */}
      <div className="col-span-12 lg:col-span-6 min-h-0">
        <MapViewClient points={mapPoints} onBoundsChange={setBounds} />
      </div>

      {/* List */}
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
