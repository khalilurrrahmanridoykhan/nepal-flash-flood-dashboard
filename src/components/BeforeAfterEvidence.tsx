"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

export default function BeforeAfterEvidence() {
  const [divider, setDivider] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  const transform = `translate(${offset.x}px,${offset.y}px) scale(${zoom})`;

  return (
    <section
      className="comparison-view"
      data-testid="before-after-evidence"
      onWheel={(event) => {
        event.preventDefault();
        setZoom((value) =>
          Math.max(1, Math.min(2, value + (event.deltaY < 0 ? 0.2 : -0.2))),
        );
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
          setOffset({
            x: drag.current.ox + event.clientX - drag.current.x,
            y: drag.current.oy + event.clientY - drag.current.y,
          });
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
        <span>After · 27 Aug 2026</span>
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
        <span>Before · 24 Aug 2026</span>
      </div>
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
      <header className="comparison-title">
        <span>Observed satellite comparison</span>
        <h1>Rasuwa river corridor</h1>
        <p>Drag the divider · scroll to zoom · drag the image to pan</p>
      </header>
      <div className="comparison-tools glass-panel">
        <button
          disabled={zoom >= 2}
          onClick={() => setZoom((value) => Math.min(2, value + 0.25))}
          aria-label="Zoom comparison in"
        >
          <Plus size={15} />
        </button>
        <strong>
          {zoom >= 2 ? "Native max" : `${Math.round(zoom * 100)}%`}
        </strong>
        <button
          disabled={zoom <= 1}
          onClick={() => setZoom((value) => Math.max(1, value - 0.25))}
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
      <aside className="comparison-meta glass-panel">
        <strong>Sentinel-2 L2A · True colour</strong>
        <span>Before: S2A_45RUL/45RUM_20260824</span>
        <span>After: S2B_45RUL/45RUM_20260827</span>
        <span>10 m source resolution · native-detail zoom capped at 200%</span>
      </aside>
      <p className="comparison-note">
        High cloud cover affects both acquisitions. Differences may reflect
        cloud, shadow, atmosphere, alignment, or processing and are not
        automatically confirmed flood damage.
      </p>
    </section>
  );
}
