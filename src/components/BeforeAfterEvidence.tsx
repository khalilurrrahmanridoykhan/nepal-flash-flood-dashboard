"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { trisuliRiver } from "@/data/trisuli-river";

const IMAGE_WIDTH = 3200;
const IMAGE_HEIGHT = 4500;
const imageBounds = { west: 85.08, east: 85.4, south: 27.86, north: 28.31 };
const floodRoute = trisuliRiver
  .filter(
    ([longitude, latitude]) =>
      longitude >= imageBounds.west &&
      longitude <= imageBounds.east &&
      latitude >= imageBounds.south &&
      latitude <= imageBounds.north,
  )
  .map(
    ([longitude, latitude], index) =>
      `${index ? "L" : "M"}${(((longitude - imageBounds.west) / (imageBounds.east - imageBounds.west)) * IMAGE_WIDTH).toFixed(1)},${(((imageBounds.north - latitude) / (imageBounds.north - imageBounds.south)) * IMAGE_HEIGHT).toFixed(1)}`,
  )
  .join("");

export default function BeforeAfterEvidence() {
  const [divider, setDivider] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const viewport = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  const transform = `translate(${offset.x}px,${offset.y}px) scale(${zoom})`;
  const constrain = (x: number, y: number, scale = zoom) => {
    const bounds = viewport.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    const baseWidth = Math.max(
        bounds.width,
        (bounds.height * IMAGE_WIDTH) / IMAGE_HEIGHT,
      ),
      baseHeight = Math.max(
        bounds.height,
        (bounds.width * IMAGE_HEIGHT) / IMAGE_WIDTH,
      ),
      maxX = Math.max(0, (baseWidth * scale - bounds.width) / 2),
      maxY = Math.max(0, (baseHeight * scale - bounds.height) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };
  const changeZoom = (delta: number) => {
    const next = Math.max(1, Math.min(2, zoom + delta));
    setZoom(next);
    setOffset((value) => constrain(value.x, value.y, next));
  };

  return (
    <section
      className="comparison-view"
      ref={viewport}
      data-testid="before-after-evidence"
      onWheel={(event) => {
        event.preventDefault();
        changeZoom(event.deltaY < 0 ? 0.2 : -0.2);
      }}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("button,input")) return;
        drag.current = {
          x: event.clientX,
          y: event.clientY,
          ox: offset.x,
          oy: offset.y,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (drag.current && zoom > 1)
          setOffset(
            constrain(
              drag.current.ox + event.clientX - drag.current.x,
              drag.current.oy + event.clientY - drag.current.y,
            ),
          );
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
    >
      <div className="comparison-image after-image">
        <Image
          fill
          unoptimized
          sizes="100vw"
          src="/media/rasuwa-after-2026-08-27.webp"
          alt="Sentinel-2 image acquired after the flood on 27 August 2026"
          draggable={false}
          style={{ transform }}
        />
      </div>
      <div
        className="comparison-image before-image"
        style={{ clipPath: `inset(0 ${100 - divider}% 0 0)` }}
      >
        <Image
          fill
          unoptimized
          sizes="100vw"
          src="/media/rasuwa-before-2026-08-24.webp"
          alt="Sentinel-2 image acquired before the flood on 24 August 2026"
          draggable={false}
          style={{ transform }}
        />
      </div>
      <svg
        className="comparison-route"
        viewBox={`0 0 ${IMAGE_WIDTH} ${IMAGE_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ transform }}
        aria-label="Highlighted flash-flood route"
      >
        <path className="comparison-route-halo" d={floodRoute} />
        <path className="comparison-route-flow" d={floodRoute} />
      </svg>
      <input
        className="swipe-control"
        aria-label="Before and after comparison divider"
        type="range"
        min="2"
        max="98"
        value={divider}
        onChange={(event) => setDivider(Number(event.target.value))}
      />
      <div className="swipe-divider" style={{ left: `${divider}%` }}>
        <i />
      </div>
      <h1 className="comparison-side-title before-title">Before flood</h1>
      <h1 className="comparison-side-title after-title">After flood</h1>
      <span className="route-legend">Flash-flood route</span>
      <div className="comparison-tools glass-panel">
        <button
          disabled={zoom >= 2}
          onClick={() => changeZoom(0.25)}
          aria-label="Zoom comparison in"
        >
          <Plus size={15} />
        </button>
        <strong>
          {zoom >= 2 ? "Native max" : `${Math.round(zoom * 100)}%`}
        </strong>
        <button
          disabled={zoom <= 1}
          onClick={() => changeZoom(-0.25)}
          aria-label="Zoom comparison out"
        >
          <Minus size={15} />
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setOffset({ x: 0, y: 0 });
            setDivider(50);
          }}
          aria-label="Reset comparison"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </section>
  );
}
