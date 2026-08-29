"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { riverCoordinates, timelineEvents } from "@/lib/incident-data";
import { trisuliRiver } from "@/data/trisuli-river";

type Point = { x: number; y: number };
type Props = { progress: number; activeEvent: number };
const nearestRiverIndex = (target: [number, number]) => { let found = 0, distance = Infinity; trisuliRiver.forEach((coordinate, index) => { const next = Math.hypot(coordinate[0] - target[0], coordinate[1] - target[1]); if (next < distance) { distance = next; found = index; } }); return found; };
const eventRiverIndices = timelineEvents.map((event) => nearestRiverIndex(event.coordinates));
const emptyFlow = (coordinate: [number, number]) => ({ type: "Feature" as const, properties: {}, geometry: { type: "LineString" as const, coordinates: [coordinate, coordinate] } });

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
  const container = useRef<HTMLDivElement>(null); const mapRef = useRef<Map | null>(null); const stageProgressRef = useRef(stageProgress); const [eventPoints, setEventPoints] = useState<Point[]>([]); const [ready, setReady] = useState(false);
  useEffect(() => { stageProgressRef.current = stageProgress; }, [stageProgress]);
  useEffect(() => {
    const host = container.current; if (!host || mapRef.current) return;
    const map = new maplibregl.Map({ container: host, style: terrainStyle, center: [85.25, 28.10], zoom: 10.35, minZoom: 8, maxZoom: 17, pitch: 48, bearing: -12, maxPitch: 80, attributionControl: false, canvasContextAttributes: { antialias: true } });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right"); map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    const project = () => { setEventPoints(riverCoordinates.map((coordinate) => map.project(coordinate))); };
    map.on("style.load", () => {
      const start = trisuliRiver[eventRiverIndices[0]] ?? trisuliRiver[0];
      map.addSource("flood-surface", { type: "geojson", lineMetrics: true, data: emptyFlow(start) });
      map.addLayer({ id: "flood-shadow", type: "line", source: "flood-surface", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#302a23", "line-width": ["interpolate", ["linear"], ["zoom"], 8, 5, 12, 8, 17, 12], "line-blur": 2, "line-opacity": .42 } });
      map.addLayer({ id: "flood-water", type: "line", source: "flood-surface", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-gradient": ["interpolate", ["linear"], ["line-progress"], 0, "#326c73", .72, "#367f86", 1, "#9b8060"], "line-width": ["interpolate", ["linear"], ["zoom"], 8, 3, 12, 5, 17, 8], "line-blur": .35, "line-opacity": .78 } });
      map.addLayer({ id: "flood-current", type: "line", source: "flood-surface", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#b9e6df", "line-width": ["interpolate", ["linear"], ["zoom"], 8, .45, 12, .75, 17, 1.2], "line-opacity": .46, "line-dasharray": [1, 4] } });
      host.dataset.riverVertices = String(trisuliRiver.length); host.dataset.waterSurface = "terrain-aligned"; setReady(true); project();
    }); map.on("move", project); map.on("resize", project); mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => {
    const map = mapRef.current; if (!map || !ready) return; const route = trisuliRiver.filter((coordinate) => Number.isFinite(coordinate[0]) && Number.isFinite(coordinate[1])); if (route.length < 2) return; const anchors = eventRiverIndices.map((index) => Math.max(0, Math.min(route.length - 1, index))); let frame = 0, active = true, previousBase = -1, previousMix = -1;
    const animate = () => { if (!active) return; const progress = Math.max(0, Math.min(1, Number.isFinite(stageProgressRef.current) ? stageProgressRef.current : 0)), elapsedMinutes = progress * timelineEvents.at(-1)!.minutes; let step = 0; while (step < timelineEvents.length - 2 && elapsedMinutes >= timelineEvents[step + 1].minutes) step++; const from = timelineEvents[step], to = timelineEvents[Math.min(timelineEvents.length - 1, step + 1)], local = Math.min(1, Math.max(0, (elapsedMinutes - from.minutes) / Math.max(1, to.minutes - from.minutes))), routeStart = anchors[0], rawCursor = anchors[step] + (anchors[Math.min(anchors.length - 1, step + 1)] - anchors[step]) * local, cursor = Math.max(routeStart, Math.min(route.length - 1.000001, Number.isFinite(rawCursor) ? rawCursor : routeStart)), base = Math.max(routeStart, Math.min(route.length - 2, Math.floor(cursor))), mix = cursor - Math.floor(cursor); if (base !== previousBase || Math.abs(mix - previousMix) > .015) { const a = route[base], b = route[base + 1], front: [number, number] = [a[0] + (b[0] - a[0]) * mix, a[1] + (b[1] - a[1]) * mix], coordinates = progress <= .002 ? [route[routeStart], route[routeStart]] : [...route.slice(routeStart, base + 1), front]; (map.getSource("flood-surface") as GeoJSONSource | undefined)?.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } }); previousBase = base; previousMix = mix; } frame = requestAnimationFrame(animate); }; frame = requestAnimationFrame(animate);
    return () => { active = false; cancelAnimationFrame(frame); };
  }, [ready]);
  return <div className="real-terrain" data-testid="cinematic-scene"><div ref={container} className="real-terrain-map" />
    {ready && <svg className="terrain-evidence" aria-label="Stepwise flood flow and reported locations on real satellite terrain">
      {eventPoints.map((point, index) => <g key={timelineEvents[index].id} className={`terrain-point ${index === activeEvent ? "active" : ""}`} transform={`translate(${point.x} ${point.y})`}><circle r={index === activeEvent ? 7 : 4} /><text y="18" textAnchor="middle">{timelineEvents[index].place}</text></g>)}
    </svg>}
    <div className="scene-event"><strong>{activeEvent === 0 ? "08:37 · COLLAPSE SIGNAL" : "CONTINUOUS FLOOD PROGRESSION"}</strong><span>{activeEvent === 0 ? "Real terrain and satellite context · suspected ice-and-rock collapse" : "Fixed overview · reconstructed water front advances downstream"}</span></div>
    <div className="scene-label"><span>Satellite imagery draped over elevation-derived terrain</span><strong>REAL-WORLD 3D CONTEXT</strong></div>
  </div>;
}
