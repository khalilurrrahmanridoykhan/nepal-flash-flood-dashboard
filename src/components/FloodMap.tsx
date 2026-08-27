"use client";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { riverCoordinates, timelineEvents } from "@/lib/incident-data";

type Props = { progress: number; activeEvent: number; onSelectEvent: (index: number) => void; visibleLayers: Record<string, boolean> };
const mapStyle = { version: 8 as const, sources: { osm: { type: "raster" as const, tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } }, layers: [{ id: "background", type: "background" as const, paint: { "background-color": "#081116" } }, { id: "osm", type: "raster" as const, source: "osm", paint: { "raster-saturation": -0.9, "raster-brightness-max": 0.42, "raster-contrast": 0.25 } }] };

export default function FloodMap({ progress, activeEvent, onSelectEvent, visibleLayers }: Props) {
  const container = useRef<HTMLDivElement>(null); const mapRef = useRef<Map | null>(null);
  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({ container: container.current, style: mapStyle, center: [85.28, 28.07], zoom: 9.2, pitch: 48, bearing: -18, attributionControl: false });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right"); map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    map.on("load", () => {
      const line = { type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: riverCoordinates } };
      map.addSource("river", { type: "geojson", data: line });
      map.addLayer({ id: "river-halo", type: "line", source: "river", paint: { "line-color": "#05141d", "line-width": 11, "line-opacity": 0.88 } });
      map.addLayer({ id: "river-route", type: "line", source: "river", paint: { "line-color": "#35b9ff", "line-width": 5, "line-opacity": 0.9, "line-dasharray": [1, 1.2] } });
      map.addSource("progress", { type: "geojson", lineMetrics: true, data: line });
      map.addLayer({ id: "progress-line", type: "line", source: "progress", paint: { "line-color": "#b9efff", "line-width": 8, "line-opacity": 0.95 } });
      map.addSource("events", { type: "geojson", data: { type: "FeatureCollection", features: timelineEvents.map((event, index) => ({ type: "Feature", properties: { index, place: event.place, status: event.status }, geometry: { type: "Point", coordinates: event.coordinates } })) } });
      map.addLayer({ id: "event-glow", type: "circle", source: "events", paint: { "circle-radius": 13, "circle-color": "#35b9ff", "circle-opacity": 0.16 } });
      map.addLayer({ id: "event-points", type: "circle", source: "events", paint: { "circle-radius": 5, "circle-color": ["match", ["get", "status"], "estimated", "#ffb454", "#d4ff62"], "circle-stroke-color": "#071116", "circle-stroke-width": 2 } });
      map.addLayer({ id: "event-labels", type: "symbol", source: "events", layout: { "text-field": ["get", "place"], "text-size": 12, "text-offset": [0, 1.4], "text-anchor": "top" }, paint: { "text-color": "#f4f8fa", "text-halo-color": "#071116", "text-halo-width": 1.5 } });
      map.on("click", "event-points", (e) => { const f = e.features?.[0]; if (f) onSelectEvent(Number(f.properties?.index)); });
      map.on("mouseenter", "event-points", () => { map.getCanvas().style.cursor = "pointer"; }); map.on("mouseleave", "event-points", () => { map.getCanvas().style.cursor = ""; });
    }); mapRef.current = map; return () => { map.remove(); mapRef.current = null; };
  }, [onSelectEvent]);
  useEffect(() => { const map = mapRef.current; if (!map?.isStyleLoaded()) return; const count = Math.max(2, Math.ceil(progress * (riverCoordinates.length - 1)) + 1); (map.getSource("progress") as GeoJSONSource | undefined)?.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: riverCoordinates.slice(0, count) } }); }, [progress]);
  useEffect(() => { const map = mapRef.current; const event = timelineEvents[activeEvent]; if (map && event) map.easeTo({ center: event.coordinates, zoom: activeEvent === 0 ? 10.5 : 10, duration: 1200, essential: true }); }, [activeEvent]);
  useEffect(() => { const map = mapRef.current; if (!map?.isStyleLoaded()) return; ["river-halo", "river-route", "progress-line"].forEach((id) => map.getLayer(id) && map.setLayoutProperty(id, "visibility", visibleLayers.route ? "visible" : "none")); ["event-glow", "event-points", "event-labels"].forEach((id) => map.getLayer(id) && map.setLayoutProperty(id, "visibility", visibleLayers.places ? "visible" : "none")); }, [visibleLayers]);
  return <div ref={container} className="map-canvas" aria-label="Interactive map of the Bhotekoshi–Trishuli flood corridor" />;
}
