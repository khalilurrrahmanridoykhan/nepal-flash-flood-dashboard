"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { riverCoordinates, timelineEvents } from "@/lib/incident-data";

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
  const container = useRef<HTMLDivElement>(null); const mapRef = useRef<Map | null>(null); const [points, setPoints] = useState<Point[]>([]); const [ready, setReady] = useState(false);
  useEffect(() => {
    const host = container.current; if (!host || mapRef.current) return;
    const map = new maplibregl.Map({ container: host, style: terrainStyle, center: [85.27, 28.07], zoom: 11.4, pitch: 62, bearing: -22, maxPitch: 80, attributionControl: false, canvasContextAttributes: { antialias: true } });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right"); map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    const project = () => setPoints(riverCoordinates.map((coordinate) => map.project(coordinate)));
    map.on("style.load", () => { setReady(true); project(); }); map.on("move", project); map.on("resize", project); mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => { const map = mapRef.current, event = timelineEvents[activeEvent]; if (!map || !event) return; const previous = timelineEvents[Math.max(0, activeEvent - 1)].coordinates; const bearing = Math.atan2(event.coordinates[0] - previous[0], event.coordinates[1] - previous[1]) * 180 / Math.PI; map.flyTo({ center: event.coordinates, zoom: activeEvent === 0 ? 12.5 : 12.1, pitch: 62, bearing: Number.isFinite(bearing) && activeEvent > 0 ? bearing : -22, duration: 1800, essential: true }); }, [activeEvent]);
  const visibleCount = progress === 0 ? 1 : Math.max(2, Math.ceil(progress * (points.length - 1)) + 1); const full = points.map((point) => `${point.x},${point.y}`).join(" "); const travelled = points.slice(0, visibleCount).map((point) => `${point.x},${point.y}`).join(" ");
  return <div className="real-terrain" data-testid="cinematic-scene"><div ref={container} className="real-terrain-map" />
    {ready && <svg className="terrain-evidence" aria-label="Reconstructed flood corridor">
      <defs><linearGradient id="flood-water" x1="0" x2="1"><stop offset="0" stopColor="#66432e" /><stop offset=".58" stopColor="#9a6b45" /><stop offset="1" stopColor="#d8c0a0" /></linearGradient></defs>
      <polyline className="terrain-corridor" points={full} /><polyline className="terrain-flood" points={travelled} />
      {points.map((point, index) => <g key={timelineEvents[index].id} className={`terrain-point ${index === activeEvent ? "active" : ""}`} transform={`translate(${point.x} ${point.y})`}><circle r={index === activeEvent ? 7 : 4} /><text y="18" textAnchor="middle">{timelineEvents[index].place}</text></g>)}
    </svg>}
    <div className="scene-event"><strong>{activeEvent === 0 ? "08:37 · COLLAPSE SIGNAL" : "DOCUMENTED FLOOD CORRIDOR"}</strong><span>{activeEvent === 0 ? "Real terrain and satellite context · suspected ice-and-rock collapse" : "Camera position follows reported locations"}</span></div>
    <div className="scene-label"><span>Satellite imagery draped over elevation-derived terrain</span><strong>REAL-WORLD 3D CONTEXT</strong></div>
  </div>;
}
