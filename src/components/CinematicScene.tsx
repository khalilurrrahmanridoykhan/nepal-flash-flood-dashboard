"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { riverCoordinates, timelineEvents } from "@/lib/incident-data";
import { trisuliRiver } from "@/data/trisuli-river";

type Point = { x: number; y: number };
type Props = { progress: number; activeEvent: number };

const terrainStyle: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics and contributors",
      maxzoom: 18,
    },
    terrainSource: { type: "raster-dem", url: "https://tiles.mapterhorn.com/tilejson.json", tileSize: 512 },
    hillshadeSource: { type: "raster-dem", url: "https://tiles.mapterhorn.com/tilejson.json", tileSize: 512 },
  },
  terrain: { source: "terrainSource", exaggeration: 1.18 },
  layers: [
    { id: "satellite", type: "raster", source: "satellite", paint: { "raster-saturation": -.08, "raster-contrast": .08, "raster-brightness-min": .06, "raster-brightness-max": .98 } },
    { id: "terrain-shade", type: "hillshade", source: "hillshadeSource", paint: { "hillshade-shadow-color": "#17301f", "hillshade-highlight-color": "#fff4d5", "hillshade-exaggeration": .18 } },
  ],
};

export default function CinematicScene({ progress, activeEvent }: Props) {
  const container = useRef<HTMLDivElement>(null); const mapRef = useRef<Map | null>(null); const [eventPoints, setEventPoints] = useState<Point[]>([]); const [ready, setReady] = useState(false);
  useEffect(() => {
    const host = container.current; if (!host || mapRef.current) return;
    const map = new maplibregl.Map({ container: host, style: terrainStyle, center: [85.27, 28.07], zoom: 11.4, pitch: 62, bearing: -22, maxPitch: 80, attributionControl: false, canvasContextAttributes: { antialias: true } });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right"); map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    const project = () => setEventPoints(riverCoordinates.map((coordinate) => map.project(coordinate)));
    map.on("style.load", () => {
      map.addSource("river-route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: trisuliRiver } } });
      map.addLayer({ id: "river-reference", type: "line", source: "river-route", paint: { "line-color": "#c6edf2", "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.2, 16, 4], "line-opacity": .52, "line-dasharray": [2, 3] } });
      map.addSource("flood-progress", { type: "geojson", lineMetrics: true, data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: trisuliRiver.slice(0, 2) } } });
      map.addLayer({ id: "flood-shadow", type: "line", source: "flood-progress", paint: { "line-color": "#24150e", "line-width": ["interpolate", ["linear"], ["zoom"], 10, 9, 16, 28], "line-opacity": 0 } });
      map.addLayer({ id: "flood-water", type: "line", source: "flood-progress", paint: { "line-color": "#8b5c38", "line-width": ["interpolate", ["linear"], ["zoom"], 10, 6, 16, 22], "line-opacity": 0, "line-blur": 1.2 } });
      map.addLayer({ id: "flood-foam", type: "line", source: "flood-progress", paint: { "line-color": "#f1e5cf", "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1, 16, 3], "line-opacity": 0, "line-dasharray": [1, 5] } });
      host.dataset.riverVertices = String(trisuliRiver.length); setReady(true); project();
    }); map.on("move", project); map.on("resize", project); mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => { const map = mapRef.current, event = timelineEvents[activeEvent]; if (!map || !event) return; const previous = timelineEvents[Math.max(0, activeEvent - 1)].coordinates; const bearing = Math.atan2(event.coordinates[0] - previous[0], event.coordinates[1] - previous[1]) * 180 / Math.PI; map.flyTo({ center: event.coordinates, zoom: activeEvent === 0 ? 16.1 : 16.7, pitch: 50, bearing: Number.isFinite(bearing) && activeEvent > 0 ? bearing : -22, duration: 1800, essential: true }); }, [activeEvent]);
  useEffect(() => { const map = mapRef.current; const source = map?.getSource("flood-progress") as GeoJSONSource | undefined; if (!map || !source) return; const target = timelineEvents[activeEvent].coordinates; let nearestIndex = 0, nearestDistance = Infinity; trisuliRiver.forEach((coordinate, index) => { const distance = Math.hypot(coordinate[0] - target[0], coordinate[1] - target[1]); if (distance < nearestDistance) { nearestDistance = distance; nearestIndex = index; } }); source.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: trisuliRiver.slice(0, Math.max(2, nearestIndex + 1)) } }); ["flood-shadow", "flood-water", "flood-foam"].forEach((id) => map.setPaintProperty(id, "line-opacity", progress === 0 ? 0 : id === "flood-shadow" ? .55 : id === "flood-water" ? .78 : .7)); }, [progress, activeEvent]);
  return <div className="real-terrain" data-testid="cinematic-scene"><div ref={container} className="real-terrain-map" />
    {ready && <svg className="terrain-evidence" aria-label="Reported flood locations">
      {eventPoints.map((point, index) => <g key={timelineEvents[index].id} className={`terrain-point ${index === activeEvent ? "active" : ""}`} transform={`translate(${point.x} ${point.y})`}><circle r={index === activeEvent ? 7 : 4} /><text y="18" textAnchor="middle">{timelineEvents[index].place}</text></g>)}
    </svg>}
    <div className="scene-event"><strong>{activeEvent === 0 ? "08:37 · COLLAPSE SIGNAL" : "DOCUMENTED FLOOD CORRIDOR"}</strong><span>{activeEvent === 0 ? "Real terrain and satellite context · suspected ice-and-rock collapse" : "Camera position follows reported locations"}</span></div>
    <div className="scene-label"><span>Satellite imagery draped over elevation-derived terrain</span><strong>REAL-WORLD 3D CONTEXT</strong></div>
  </div>;
}
