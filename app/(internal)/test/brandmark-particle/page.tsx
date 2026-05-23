"use client";

import { useEffect, useState } from "react";
import { BrandmarkParticleCanvas } from "@/components/brand/BrandmarkParticleField";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

/**
 * /test/brandmark-particle — dev preview for the brandmark particle
 * artifact engine (ADR-011 / ADR-012 / ADR-013).
 *
 * Mounts the shared particle canvas and writes a single
 * `BrandmarkTransform` into `brandmarkJourneyStore` driven by the
 * controls panel. This is the lab — tune here, copy the numbers into
 * the keyframe `parked` attrs in `lib/brandmark/journey.ts`.
 *
 * Internal route — blocked from production by `middleware.ts`.
 */

export default function BrandmarkParticlePreviewPage() {
  // Engine controls (UI state — fed into the journey store on change).
  const [density, setDensity] = useState(1);
  const [dispersion, setDispersion] = useState(0);
  const [opacity, setOpacity] = useState(1);
  // Rotation in degrees (for human-friendly control); converted to
  // radians when written into the transform.
  const [rotationDeg, setRotationDeg] = useState(0);
  // Target rect (centered, with a configurable size)
  const [rectSize, setRectSize] = useState(520);
  const [rectX, setRectX] = useState(50);
  const [rectY, setRectY] = useState(50);

  // Push the store into particle mode for this page so the canvas
  // mounts regardless of the production gating.
  useEffect(() => {
    useBrandmarkJourneyStore.getState().setMode("particle");
    return () => {
      useBrandmarkJourneyStore.getState().reset();
    };
  }, []);

  // Continuously write the transform. The rect math converts the
  // percent-based controls into viewport pixel coords.
  useEffect(() => {
    const write = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cx = (rectX / 100) * vw;
      const cy = (rectY / 100) * vh;
      const halfSize = rectSize / 2;
      useBrandmarkJourneyStore.getState().setTransform({
        rect: {
          left: cx - halfSize,
          top: cy - halfSize,
          width: rectSize,
          height: rectSize,
        },
        opacity,
        density,
        dispersion,
        rotationY: (rotationDeg * Math.PI) / 180,
        ringsActive: false,
        ringProgress: 0,
        shapeBlend: 0,
        vectorOpacity: 1,
        substrateMorph: 0,
        silhouetteMorph: 0,
        visible: opacity > 0.001,
        parkedAt: null,
      });
    };
    write();
    window.addEventListener("resize", write);
    return () => window.removeEventListener("resize", write);
  }, [density, dispersion, opacity, rotationDeg, rectSize, rectX, rectY]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--surface-0, #0a0908)",
        color: "var(--dawn, #ece3d6)",
        fontFamily: "var(--font-pp-neue-montreal, ui-sans-serif), sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* The canvas is fixed-position so it sits above the controls
          chrome by default. We give the controls panel a higher
          z-index so it stays interactive. */}
      <BrandmarkParticleCanvas
        forceMount
        className="tf-brandmark-particle-canvas tf-brandmark-particle-canvas--preview"
      />

      <style jsx>{`
        :global(.tf-brandmark-particle-canvas--preview) {
          opacity: 1 !important;
        }
      `}</style>

      {/* Target rect overlay (1px outline of the rect we're feeding
          into the snapshot) so we can see the bounds the particles
          are clouding within. */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: `calc(${rectX}% - ${rectSize / 2}px)`,
          top: `calc(${rectY}% - ${rectSize / 2}px)`,
          width: rectSize,
          height: rectSize,
          border: "1px dashed rgba(202, 165, 84, 0.3)",
          zIndex: 22, // just under the canvas
          pointerEvents: "none",
        }}
      />

      {/* Controls panel */}
      <div
        style={{
          position: "fixed",
          top: 24,
          right: 24,
          width: 320,
          padding: 20,
          background: "rgba(15, 14, 12, 0.92)",
          border: "1px solid rgba(202, 165, 84, 0.35)",
          color: "var(--dawn, #ece3d6)",
          zIndex: 50,
          fontFamily: "var(--font-pt-mono, ui-monospace), monospace",
          fontSize: 11,
          letterSpacing: "0.04em",
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: 16,
            fontSize: 13,
            color: "var(--gold, #caa554)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Brandmark Particle Lab
        </h1>

        <ControlSlider
          label="Density"
          value={density}
          min={0}
          max={1}
          step={0.01}
          onChange={setDensity}
        />
        <ControlSlider
          label="Dispersion"
          value={dispersion}
          min={0}
          max={1.5}
          step={0.01}
          onChange={setDispersion}
        />
        <ControlSlider
          label="Opacity"
          value={opacity}
          min={0}
          max={1}
          step={0.01}
          onChange={setOpacity}
        />
        <ControlSlider
          label="Rotation Y (deg)"
          value={rotationDeg}
          min={-90}
          max={90}
          step={1}
          onChange={setRotationDeg}
        />
        <ControlSlider
          label="Rect size (px)"
          value={rectSize}
          min={120}
          max={1200}
          step={10}
          onChange={setRectSize}
        />
        <ControlSlider
          label="Rect X (%)"
          value={rectX}
          min={0}
          max={100}
          step={1}
          onChange={setRectX}
        />
        <ControlSlider
          label="Rect Y (%)"
          value={rectY}
          min={0}
          max={100}
          step={1}
          onChange={setRectY}
        />

        <p
          style={{
            marginTop: 18,
            fontSize: 10,
            color: "rgba(236, 227, 214, 0.45)",
            lineHeight: 1.6,
          }}
        >
          Drives the single `BrandmarkTransform` in `brandmarkJourneyStore` directly. Rotation Y
          uses the 2D squash shader (ADR-013) — at +/-90deg the brandmark collapses to a vertical
          strip.
        </p>
      </div>
    </main>
  );
}

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function ControlSlider({ label, value, min, max, step, onChange }: ControlSliderProps) {
  return (
    <label
      style={{
        display: "block",
        marginBottom: 10,
        color: "var(--dawn-70, rgba(236,227,214,0.7))",
      }}
    >
      <span
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          fontSize: 10,
        }}
      >
        <span>{label}</span>
        <span style={{ color: "var(--gold, #caa554)" }}>{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "var(--gold, #caa554)" }}
      />
    </label>
  );
}
