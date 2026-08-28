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
const eventRiverIndices = timelineEvents.map((event) => nearestRiverIndex(event.coordinates));

const terrainStyle: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics and contributors",
      maxzoom: 17,
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
  const container = useRef<HTMLDivElement>(null); const mapRef = useRef<Map | null>(null); const stageProgressRef = useRef(stageProgress); const flowMarkers = useRef<maplibregl.Marker[]>([]); const [eventPoints, setEventPoints] = useState<Point[]>([]); const [ready, setReady] = useState(false);
  useEffect(() => { stageProgressRef.current = stageProgress; }, [stageProgress]);
  useEffect(() => {
    const host = container.current; if (!host || mapRef.current) return;
    const map = new maplibregl.Map({ container: host, style: terrainStyle, center: [85.25, 28.10], zoom: 10.35, minZoom: 8, maxZoom: 17, pitch: 48, bearing: -12, maxPitch: 80, attributionControl: false, canvasContextAttributes: { antialias: true } });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right"); map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    const project = () => { setEventPoints(riverCoordinates.map((coordinate) => map.project(coordinate))); };
    map.on("style.load", () => {
      host.dataset.riverVertices = String(trisuliRiver.length); setReady(true); project();
    }); map.on("move", project); map.on("resize", project); mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => {
    const map = mapRef.current; if (!map || !ready) return; flowMarkers.current.forEach((marker) => marker.remove()); flowMarkers.current = []; const route = trisuliRiver.filter((coordinate) => Number.isFinite(coordinate[0]) && Number.isFinite(coordinate[1])); if (route.length < 2) return; const anchors = eventRiverIndices.map((index) => Math.max(0, Math.min(route.length - 1, index)));
    const markers: maplibregl.Marker[] = []; for (let index = 0; index < 144; index++) { const wrapper = document.createElement("span"), particle = document.createElement("span"); wrapper.className = "water-marker"; particle.className = "water-particle"; particle.style.animationDelay = `${-index * .035}s`; wrapper.appendChild(particle); markers.push(new maplibregl.Marker({ element: wrapper, anchor: "center" }).setLngLat(route[0]).addTo(map)); } flowMarkers.current = markers;
    let frame = 0, active = true; const started = performance.now(); const animate = (now: number) => { if (!active) return; const progress = Math.max(0, Math.min(1, Number.isFinite(stageProgressRef.current) ? stageProgressRef.current : 0)), totalMinutes = timelineEvents.at(-1)!.minutes, elapsedMinutes = progress * totalMinutes; let step = 0; while (step < timelineEvents.length - 2 && elapsedMinutes >= timelineEvents[step + 1].minutes) step++; const from = timelineEvents[step], to = timelineEvents[Math.min(timelineEvents.length - 1, step + 1)], local = Math.min(1, Math.max(0, (elapsedMinutes - from.minutes) / Math.max(1, to.minutes - from.minutes))), routeStart = anchors[0], rawCursor = anchors[step] + (anchors[Math.min(anchors.length - 1, step + 1)] - anchors[step]) * local, maxCursor = Math.max(routeStart, Math.min(route.length - 1, Number.isFinite(rawCursor) ? rawCursor : routeStart)), covered = maxCursor - routeStart, fullLength = Math.max(1, anchors.at(-1)! - routeStart), visibleCount = Math.max(0, Math.min(markers.length, Math.ceil(covered / fullLength * markers.length))), drift = ((now - started) / 5000) % 1; markers.forEach((marker, index) => { const element = marker.getElement(); if (index >= visibleCount || progress <= .002) { element.style.display = "none"; return; } element.style.display = "block"; const raw = routeStart + (index / Math.max(1, visibleCount - 1)) * covered + drift, cursor = Math.max(0, Math.min(route.length - 1.000001, Number.isFinite(raw) ? raw : routeStart)), base = Math.max(0, Math.min(route.length - 2, Math.floor(cursor))), mix = cursor - Math.floor(cursor), a = route[base], b = route[base + 1]; if (a && b) marker.setLngLat([a[0] + (b[0] - a[0]) * mix, a[1] + (b[1] - a[1]) * mix]); }); frame = requestAnimationFrame(animate); }; frame = requestAnimationFrame(animate);
    return () => { active = false; cancelAnimationFrame(frame); markers.forEach((marker) => marker.remove()); if (flowMarkers.current === markers) flowMarkers.current = []; };
  }, [ready]);
  return <div className="real-terrain" data-testid="cinematic-scene"><div ref={container} className="real-terrain-map" />
    {ready && <svg className="terrain-evidence" aria-label="Stepwise flood flow and reported locations on real satellite terrain">
      {eventPoints.map((point, index) => <g key={timelineEvents[index].id} className={`terrain-point ${index === activeEvent ? "active" : ""}`} transform={`translate(${point.x} ${point.y})`}><circle r={index === activeEvent ? 7 : 4} /><text y="18" textAnchor="middle">{timelineEvents[index].place}</text></g>)}
    </svg>}
    <div className="scene-event"><strong>{activeEvent === 0 ? "08:37 · COLLAPSE SIGNAL" : "CONTINUOUS FLOOD PROGRESSION"}</strong><span>{activeEvent === 0 ? "Real terrain and satellite context · suspected ice-and-rock collapse" : "Fixed overview · reconstructed water front advances downstream"}</span></div>
    <div className="scene-label"><span>Satellite imagery draped over elevation-derived terrain</span><strong>REAL-WORLD 3D CONTEXT</strong></div>
  </div>;
}
