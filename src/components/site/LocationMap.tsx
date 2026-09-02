import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

const KARACHI: [number, number] = [24.8607, 67.0011];

type Props = {
  lat: number | null;
  lng: number | null;
  /** When provided, the marker is draggable and map clicks move the pin. */
  onPick?: (lat: number, lng: number) => void;
  className?: string;
  zoom?: number;
};

/**
 * Interactive OpenStreetMap + Leaflet map. Leaflet is imported dynamically inside
 * an effect so this module stays safe during server rendering.
 */
export function LocationMap({ lat, lng, onPick, className, zoom = 14 }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;
    let map: LeafletMap | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !boxRef.current || mapRef.current) return;

      const center: [number, number] = lat != null && lng != null ? [lat, lng] : KARACHI;
      map = L.map(boxRef.current, { center, zoom, scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#E31E24;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker(center, { icon, draggable: !!pickRef.current }).addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        pickRef.current?.(p.lat, p.lng);
      });
      map.on("click", (e) => {
        if (!pickRef.current) return;
        marker.setLatLng(e.latlng);
        pickRef.current(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      setTimeout(() => map?.invalidateSize(), 60);
    })().catch(() => {
      /* map is optional — manual address entry still works */
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lat == null || lng == null || !mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], Math.max(mapRef.current.getZoom(), 15));
  }, [lat, lng]);

  return <div ref={boxRef} className={className ?? "h-64 w-full rounded-xl border border-border"} aria-label="Delivery location map" />;
}
