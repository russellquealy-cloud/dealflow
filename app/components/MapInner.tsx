"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import * as React from "react";
import { useRouter } from "next/navigation";
import type { Point } from "./MapViewClient";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type BBox = [number, number, number, number];

function FitToPoints({ points }: { points: Point[] }) {
  const map = useMap();
  React.useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds.pad(0.2));
  }, [map, points]);
  return null;
}

function Controls({
  bbox,
  showRect,
  onBboxDrawn,
  onBboxViewport,
  onClear,
}: {
  bbox?: BBox;
  showRect: boolean;
  onBboxDrawn?: (bbox: BBox) => void;
  onBboxViewport?: (bbox: BBox) => void;
  onClear?: () => void;
}) {
  const map = useMap();

  // stable refs for callbacks
  const drawnRef = React.useRef(onBboxDrawn);
  const viewportRef = React.useRef(onBboxViewport);
  const clearRef = React.useRef(onClear);
  React.useEffect(() => { drawnRef.current = onBboxDrawn; }, [onBboxDrawn]);
  React.useEffect(() => { viewportRef.current = onBboxViewport; }, [onBboxViewport]);
  React.useEffect(() => { clearRef.current = onClear; }, [onClear]);

  const rectRef = React.useRef<L.Rectangle | null>(null);
  const barRef = React.useRef<L.Control | null>(null);
  const drawToolRef = React.useRef<any | null>(null);
  const mountedRef = React.useRef(false);
  const drawLoadedRef = React.useRef(false);
  const debounceRef = React.useRef<number | null>(null);

  const removeRect = React.useCallback(() => {
    if (rectRef.current) {
      map.removeLayer(rectRef.current);
      rectRef.current = null;
    }
  }, [map]);

  // mount once
  React.useEffect(() => {
    let disposed = false;

    (async () => {
      if (!drawLoadedRef.current) {
        (window as any).L = L;
        await import("leaflet-draw");
        drawLoadedRef.current = true;
      }
      if (disposed) return;

      // 1) Drawing rectangles (user action)
      const onCreated = (e: any) => {
        removeRect();
        rectRef.current = e.layer as L.Rectangle;
        rectRef.current.addTo(map);
        const b = rectRef.current.getBounds();
        drawnRef.current?.([b.getSouth(), b.getWest(), b.getNorth(), b.getEast()]);
      };
      map.on((L as any).Draw.Event.CREATED, onCreated);

      // 2) Viewport filter (debounced, no rectangle)
      const scheduleViewport = () => {
        if (rectRef.current) return; // respect active drawn area
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
          const b = map.getBounds();
          viewportRef.current?.([b.getSouth(), b.getWest(), b.getNorth(), b.getEast()]);
        }, 250);
      };
      map.on("moveend", scheduleViewport);
      map.on("zoomend", scheduleViewport);

      // 3) Toolbar top-right
      const Bar: any = L.Control.extend({
        options: { position: "topright" },
        onAdd() {
          const wrap = L.DomUtil.create("div", "leaflet-bar");
          wrap.style.display = "flex";
          wrap.style.gap = "6px";
          wrap.style.alignItems = "center";
          wrap.style.padding = "6px";
          wrap.style.background = "#fff";
          wrap.style.border = "1px solid #ccc";
          wrap.style.borderRadius = "8px";
          wrap.style.boxShadow = "0 1px 4px rgba(0,0,0,.08)";

          const mk = (label: string, solid = true) => {
            const a = L.DomUtil.create("a", "", wrap);
            a.href = "#";
            a.innerText = label;
            a.style.padding = "6px 10px";
            a.style.borderRadius = "6px";
            a.style.font = "600 12px/18px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
            a.style.textDecoration = "none";
            a.style.border = "1px solid #ddd";
            if (solid) { a.style.background = "#111"; a.style.color = "#fff"; }
            else { a.style.background = "#fff"; a.style.color = "#111"; }
            return a;
          };

          const drawBtn = mk("Draw", true);
          const clearBtn = mk("Clear", false);

          L.DomEvent.on(drawBtn, "click", (ev: Event) => {
            L.DomEvent.stop(ev);
            const Rect = (L as any).Draw.Rectangle;
            drawToolRef.current = new Rect(map, { shapeOptions: { color: "#111" } });
            drawToolRef.current.enable();
          });

          L.DomEvent.on(clearBtn, "click", (ev: Event) => {
            L.DomEvent.stop(ev);
            removeRect();
            drawToolRef.current?.disable?.();
            clearRef.current?.(); // removes bbox + drawn
          });

          return wrap;
        },
      });

      barRef.current = new Bar();
      map.addControl(barRef.current);
      mountedRef.current = true;

      return () => {
        map.off((L as any).Draw.Event.CREATED, onCreated);
        map.off("moveend", scheduleViewport);
        map.off("zoomend", scheduleViewport);
        if (barRef.current) map.removeControl(barRef.current);
        removeRect();
        drawToolRef.current?.disable?.();
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        barRef.current = null;
        rectRef.current = null;
        drawToolRef.current = null;
      };
    })();

    return () => { disposed = true; };
  }, [map, removeRect]);

  // Sync rectangle with URL (only when "drawn=1")
  React.useEffect(() => {
    if (!mountedRef.current) return;
    if (showRect && bbox) {
      removeRect();
      const bounds = L.latLngBounds([L.latLng(bbox[0], bbox[1]), L.latLng(bbox[2], bbox[3])]);
      rectRef.current = L.rectangle(bounds, { color: "#111" }).addTo(map);
    } else {
      removeRect();
    }
  }, [map, showRect, bbox?.[0], bbox?.[1], bbox?.[2], bbox?.[3], removeRect]);

  return null;
}

export default function MapInner({
  points,
  bbox,
  showRect,
  onBboxDrawn,
  onBboxViewport,
  onClear,
}: {
  points: Point[];
  bbox?: BBox;
  showRect: boolean;
  onBboxDrawn?: (bbox: BBox) => void;
  onBboxViewport?: (bbox: BBox) => void;
  onClear?: () => void;
}) {
  const router = useRouter();
  const fallback = { lat: 39.5, lng: -98.35 };
  const center = points.length ? { lat: points[0].lat, lng: points[0].lng } : fallback;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={points.length ? 11 : 4}
      style={{ width: "100%", height: "100%", borderRadius: 12, border: "1px solid #eee" }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap contributors © CARTO'
      />

      <FitToPoints points={points} />
      <Controls
        bbox={bbox}
        showRect={showRect}
        onBboxDrawn={onBboxDrawn}
        onBboxViewport={onBboxViewport}
        onClear={onClear}
      />

      {points.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={icon}
          eventHandlers={{ click: () => router.push(`/listing/${p.id}`) }}
        />
      ))}
    </MapContainer>
  );
}
