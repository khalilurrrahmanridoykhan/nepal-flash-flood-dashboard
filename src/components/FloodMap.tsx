"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { infrastructure, riverCoordinates, timelineEvents } from "@/lib/incident-data";

type Point = { x: number; y: number };
type Props = { progress: number; activeEvent: number; onSelectEvent: (index: number) => void; visibleLayers: Record<string, boolean> };

const mapStyle = {
  version: 8 as const,
  sources: {
    osm: { type: "raster" as const, tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" },
    satellite: { type: "raster" as const, tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, attribution: "Tiles © Esri" },
  },
  layers: [
    { id: "background", type: "background" as const, paint: { "background-color": "#081116" } },
    { id: "osm", type: "raster" as const, source: "osm", paint: { "raster-saturation": -0.9, "raster-brightness-max": 0.42, "raster-contrast": 0.25 } },
    { id: "satellite-raster", type: "raster" as const, source: "satellite", layout: { visibility: "none" as const }, paint: { "raster-saturation": -0.25, "raster-brightness-max": 0.7, "raster-contrast": 0.15 } },
  ],
};

export default function FloodMap({ progress, activeEvent, onSelectEvent, visibleLayers }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [routePoints, setRoutePoints] = useState<Point[]>([]);
  const [infrastructurePoints, setInfrastructurePoints] = useState<Point[]>([]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new maplibregl.Map({ container: mapContainer.current, style: mapStyle, center: [85.28, 28.07], zoom: 9.2, pitch: 48, bearing: -18, attributionControl: false });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    const projectEvidence = () => {
      setRoutePoints(riverCoordinates.map((coordinates) => map.project(coordinates)));
      setInfrastructurePoints(infrastructure.map((item) => map.project(item.coordinates as [number, number])));
    };
    map.on("style.load", () => { if (mapContainer.current) mapContainer.current.dataset.mapReady = "true"; projectEvidence(); });
    map.on("move", projectEvidence);
    map.on("resize", projectEvidence);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current; const event = timelineEvents[activeEvent];
    if (map && event) map.easeTo({ center: event.coordinates, zoom: activeEvent === 0 ? 10.5 : 10, duration: 1200, essential: true });
  }, [activeEvent]);

  useEffect(() => {
    const map = mapRef.current; if (!map?.getLayer("satellite-raster")) return;
    map.setLayoutProperty("satellite-raster", "visibility", visibleLayers.satellite ? "visible" : "none");
    map.setPaintProperty("osm", "raster-opacity", visibleLayers.satellite ? 0 : 1);
  }, [visibleLayers.satellite]);

  const lastPoint = Math.max(1, Math.ceil(progress * (routePoints.length - 1)));
  const completedRoute = routePoints.slice(0, lastPoint + 1).map((point) => `${point.x},${point.y}`).join(" ");
  const fullRoute = routePoints.map((point) => `${point.x},${point.y}`).join(" ");

  return <div className="map-root">
    <div ref={mapContainer} className="map-canvas" aria-label="Interactive map of the Bhotekoshi–Trishuli flood corridor" />
    <svg className="evidence-overlay" aria-label="Flood route and evidence locations">
      {visibleLayers.route && <>
        <polyline className="route-halo" points={fullRoute} />
        <polyline className="route-base" points={fullRoute} />
        <polyline className="route-progress" points={completedRoute} />
      </>}
      {visibleLayers.places && routePoints.map((point, index) => <g key={timelineEvents[index].id} className={`evidence-marker ${timelineEvents[index].status} ${index === activeEvent ? "active" : ""}`} transform={`translate(${point.x} ${point.y})`} onClick={() => onSelectEvent(index)} role="button" aria-label={`Select ${timelineEvents[index].place}`}>
        <circle className="marker-glow" r="13" /><circle className="marker-dot" r="5" /><text y="20" textAnchor="middle">{timelineEvents[index].place}</text>
      </g>)}
      {visibleLayers.infrastructure && infrastructurePoints.map((point, index) => <g key={infrastructure[index].id} className="infrastructure-marker" transform={`translate(${point.x} ${point.y})`}><rect x="-5" y="-5" width="10" height="10" rx="2" /><text y="-12" textAnchor="middle">{infrastructure[index].name}</text></g>)}
    </svg>
  </div>;
}
