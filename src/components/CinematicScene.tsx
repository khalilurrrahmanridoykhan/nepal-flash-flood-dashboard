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
const smoothPath = (points: Point[]) => { if (points.length < 2) return ""; if (points.length === 2) return `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}L${points[1].x.toFixed(1)},${points[1].y.toFixed(1)}`; let path = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`; for (let index = 1; index < points.length - 1; index++) { const point = points[index], next = points[index + 1], middleX = (point.x + next.x) / 2, middleY = (point.y + next.y) / 2; path += `Q${point.x.toFixed(1)},${point.y.toFixed(1)} ${middleX.toFixed(1)},${middleY.toFixed(1)}`; } const last = points.at(-1)!; return `${path}L${last.x.toFixed(1)},${last.y.toFixed(1)}`; };
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
  const container = useRef<HTMLDivElement>(null); const mapRef = useRef<Map | null>(null); const stageProgressRef = useRef(stageProgress); const waterBed = useRef<SVGPathElement>(null); const waterBody = useRef<SVGPathElement>(null); const waterCurrent = useRef<SVGPathElement>(null); const [eventPoints, setEventPoints] = useState<Point[]>([]); const [ready, setReady] = useState(false);
  useEffect(() => { stageProgressRef.current = stageProgress; }, [stageProgress]);
  useEffect(() => {
    const host = container.current; if (!host || mapRef.current) return;
    const map = new maplibregl.Map({ container: host, style: terrainStyle, center: [85.25, 28.10], zoom: 10.35, minZoom: 8, maxZoom: 17, pitch: 48, bearing: -12, maxPitch: 80, attributionControl: false, canvasContextAttributes: { antialias: true } });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right"); map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    const project = () => { setEventPoints(riverCoordinates.map((coordinate) => map.project(coordinate))); };
    map.on("style.load", () => {
      host.dataset.riverVertices = String(trisuliRiver.length); host.dataset.waterSurface = "continuous-overlay"; setReady(true); project();
    }); map.on("move", project); map.on("resize", project); mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => {
    const map = mapRef.current; if (!map || !ready) return; const route = trisuliRiver.filter((coordinate) => Number.isFinite(coordinate[0]) && Number.isFinite(coordinate[1])); if (route.length < 2) return; const anchors = eventRiverIndices.map((index) => Math.max(0, Math.min(route.length - 1, index))); let frame = 0, active = true;
    const animate = () => { if (!active) return; const progress = Math.max(0, Math.min(1, Number.isFinite(stageProgressRef.current) ? stageProgressRef.current : 0)), elapsedMinutes = progress * timelineEvents.at(-1)!.minutes; let step = 0; while (step < timelineEvents.length - 2 && elapsedMinutes >= timelineEvents[step + 1].minutes) step++; const from = timelineEvents[step], to = timelineEvents[Math.min(timelineEvents.length - 1, step + 1)], local = Math.min(1, Math.max(0, (elapsedMinutes - from.minutes) / Math.max(1, to.minutes - from.minutes))), routeStart = anchors[0], rawCursor = anchors[step] + (anchors[Math.min(anchors.length - 1, step + 1)] - anchors[step]) * local, cursor = Math.max(routeStart, Math.min(route.length - 1.000001, Number.isFinite(rawCursor) ? rawCursor : routeStart)), base = Math.max(routeStart, Math.min(route.length - 2, Math.floor(cursor))), mix = cursor - Math.floor(cursor), a = route[base], b = route[base + 1], front: [number, number] = [a[0] + (b[0] - a[0]) * mix, a[1] + (b[1] - a[1]) * mix], coordinates = progress <= .002 ? [] : [...route.slice(routeStart, base + 1), front], points = coordinates.map((coordinate) => map.project(coordinate)), path = smoothPath(points); waterBed.current?.setAttribute("d", path); waterBody.current?.setAttribute("d", path); waterCurrent.current?.setAttribute("d", path); const detail = Math.max(0, Math.min(1, (map.getZoom() - 9) / 8)); container.current?.style.setProperty("--water-width", `${5 - detail * 1.5}px`); frame = requestAnimationFrame(animate); }; frame = requestAnimationFrame(animate);
    return () => { active = false; cancelAnimationFrame(frame); };
  }, [ready]);
  return <div className="real-terrain" data-testid="cinematic-scene"><div ref={container} className="real-terrain-map" />
    <svg className="flow-surface" aria-label="Continuous reconstructed flood-water progression"><path ref={waterBed} className="surface-water-bed" /><path ref={waterBody} className="surface-water-body" /><path ref={waterCurrent} className="surface-water-current" /></svg>
    {ready && <svg className="terrain-evidence" aria-label="Stepwise flood flow and reported locations on real satellite terrain">
      {eventPoints.map((point, index) => <g key={timelineEvents[index].id} className={`terrain-point ${index === activeEvent ? "active" : ""}`} transform={`translate(${point.x} ${point.y})`}><circle r={index === activeEvent ? 7 : 4} /><text y="18" textAnchor="middle">{timelineEvents[index].place}</text></g>)}
    </svg>}
    <div className="scene-event"><strong>{activeEvent === 0 ? "08:37 · COLLAPSE SIGNAL" : "CONTINUOUS FLOOD PROGRESSION"}</strong><span>{activeEvent === 0 ? "Real terrain and satellite context · suspected ice-and-rock collapse" : "Fixed overview · reconstructed water front advances downstream"}</span></div>
    <div className="scene-label"><span>Satellite imagery draped over elevation-derived terrain</span><strong>REAL-WORLD 3D CONTEXT</strong></div>
  </div>;
}
