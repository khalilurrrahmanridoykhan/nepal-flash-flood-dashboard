"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { riverCoordinates, timelineEvents } from "@/lib/incident-data";
import { trisuliRiver } from "@/data/trisuli-river";

type Point = { x: number; y: number };
type Props = { progress: number; activeEvent: number };
const nearestRiverIndex = (target: [number, number]) => { let found = 0, distance = Infinity; trisuliRiver.forEach((coordinate, index) => { const next = Math.hypot(coordinate[0] - target[0], coordinate[1] - target[1]); if (next < distance) { distance = next; found = index; } }); return found; };

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

export default function CinematicScene({ progress: stageProgress, activeEvent }: Props) {
  const container = useRef<HTMLDivElement>(null); const mapRef = useRef<Map | null>(null); const flowMarkers = useRef<maplibregl.Marker[]>([]); const [eventPoints, setEventPoints] = useState<Point[]>([]); const [ready, setReady] = useState(false);
  useEffect(() => {
    const host = container.current; if (!host || mapRef.current) return;
    const map = new maplibregl.Map({ container: host, style: terrainStyle, center: [85.27, 28.07], zoom: 11.4, pitch: 62, bearing: -22, maxPitch: 80, attributionControl: false, canvasContextAttributes: { antialias: true } });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right"); map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    const project = () => { setEventPoints(riverCoordinates.map((coordinate) => map.project(coordinate))); };
    map.on("style.load", () => {
      host.dataset.riverVertices = String(trisuliRiver.length); setReady(true); project();
    }); map.on("move", project); map.on("resize", project); mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => { const map = mapRef.current, event = timelineEvents[activeEvent]; if (!map || !event) return; const previous = timelineEvents[Math.max(0, activeEvent - 1)].coordinates; const bearing = Math.atan2(event.coordinates[0] - previous[0], event.coordinates[1] - previous[1]) * 180 / Math.PI; map.flyTo({ center: event.coordinates, zoom: activeEvent === 0 ? 14.6 : 15.2, pitch: 48, bearing: Number.isFinite(bearing) && activeEvent > 0 ? bearing : -22, duration: 1500, essential: true }); }, [activeEvent]);
  useEffect(() => {
    const map = mapRef.current; if (!map || !ready) return; flowMarkers.current.forEach((marker) => marker.remove()); flowMarkers.current = []; if (stageProgress === 0) return;
    const currentIndex = nearestRiverIndex(timelineEvents[activeEvent].coordinates), previousIndex = nearestRiverIndex(timelineEvents[Math.max(0, activeEvent - 1)].coordinates), low = Math.max(0, Math.min(previousIndex, currentIndex) - 3), high = Math.min(trisuliRiver.length - 1, Math.max(previousIndex, currentIndex) + 1); let segment = trisuliRiver.slice(low, high + 1); if (currentIndex < previousIndex) segment = segment.reverse(); if (segment.length < 2) return;
    const markers: maplibregl.Marker[] = []; for (let index = 0; index < 14; index++) { const wrapper = document.createElement("span"), particle = document.createElement("span"); wrapper.className = "water-marker"; particle.className = "water-particle"; particle.style.animationDelay = `${-index * .11}s`; wrapper.appendChild(particle); markers.push(new maplibregl.Marker({ element: wrapper, anchor: "center" }).setLngLat(segment[0]).addTo(map)); } flowMarkers.current = markers;
    let frame = 0, active = true; const started = performance.now(); const animate = (now: number) => { if (!active) return; const elapsed = (now - started) / 2600; markers.forEach((marker, index) => { const cursor = ((elapsed + index / markers.length) % 1) * (segment.length - 1), base = Math.min(segment.length - 2, Math.floor(cursor)), mix = cursor - Math.floor(cursor), a = segment[base], b = segment[base + 1]; if (a && b) marker.setLngLat([a[0] + (b[0] - a[0]) * mix, a[1] + (b[1] - a[1]) * mix]); }); frame = requestAnimationFrame(animate); }; frame = requestAnimationFrame(animate);
    return () => { active = false; cancelAnimationFrame(frame); markers.forEach((marker) => marker.remove()); if (flowMarkers.current === markers) flowMarkers.current = []; };
  }, [stageProgress, activeEvent, ready]);
  return <div className="real-terrain" data-testid="cinematic-scene"><div ref={container} className="real-terrain-map" />
    {ready && <svg className="terrain-evidence" aria-label="Stepwise flood flow and reported locations on real satellite terrain">
      {eventPoints.map((point, index) => <g key={timelineEvents[index].id} className={`terrain-point ${index === activeEvent ? "active" : ""}`} transform={`translate(${point.x} ${point.y})`}><circle r={index === activeEvent ? 7 : 4} /><text y="18" textAnchor="middle">{timelineEvents[index].place}</text></g>)}
    </svg>}
    <div className="scene-event"><strong>{activeEvent === 0 ? "08:37 · COLLAPSE SIGNAL" : "DOCUMENTED FLOOD CORRIDOR"}</strong><span>{activeEvent === 0 ? "Real terrain and satellite context · suspected ice-and-rock collapse" : "Camera position follows reported locations"}</span></div>
    <div className="scene-label"><span>Satellite imagery draped over elevation-derived terrain</span><strong>REAL-WORLD 3D CONTEXT</strong></div>
  </div>;
}
