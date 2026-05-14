"use client";

import { useEffect, useState } from "react";
import { BrandmarkParticleCanvas } from "@/components/brand/BrandmarkParticleField";
import {
  DEFAULT_TINT,
  DAWN_TINT,
  useBrandmarkParticleStore,
} from "@/lib/stores/brandmarkParticleStore";

/**
 * /test/brandmark-particle — dev preview for the brandmark particle
 * artifact engine (ADR-011, Phase A).
 *
 * Mounts the shared particle canvas with a single `backdrop` station
 * and lets us scrub density, dispersion, opacity, tint, and the
 * target rect's size + position via sliders. This is the lab — tune
 * here, copy the numbers into `PARTICLE_BACKDROP_DEFAULTS` in
 * `useSigilChoreography.ts` (or future per-station defaults).
 *
 * Internal route — blocked from production by `middleware.ts`.
 */

export default function BrandmarkParticlePreviewPage() {
  // Engine controls (UI state — fed into the store on change)
  const [density, setDensity] = useState(0.22);
  const [dispersion, setDispersion] = useState(0.42);
  const [opacity, setOpacity] = useState(1);
  const [pointSize, setPointSize] = useState(3);
  const [tintMode, setTintMode] = useState<"gold" | "dawn">("gold");
  // Target rect (centered, with a configurable size)
  const [rectSize, setRectSize] = useState(520);
  const [rectX, setRectX] = useState(50);
  const [rectY, setRectY] = useState(50);

  // Push the store into particle mode for this page so the canvas
  // mounts regardless of the production gating.
  useEffect(() => {
    useBrandmarkParticleStore.getState().setMode("particle");
    return () => {
      useBrandmarkParticleStore.getState().clearStations();
      // Don't force the mode back to svg — the choreography hook
      // owns that, and this route never coexists with the marketing
      // page in the same tab session.
    };
  }, []);

  // Continuously write the backdrop station snapshot. The rect math
  // converts the percent-based controls into viewport pixel coords.
  useEffect(() => {
    const write = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cx = (rectX / 100) * vw;
      const cy = (rectY / 100) * vh;
      const halfSize = rectSize / 2;
      useBrandmarkParticleStore.getState().setStation("backdrop", {
        rect: {
          left: cx - halfSize,
          top: cy - halfSize,
          width: rectSize,
          height: rectSize,
        },
        opacity,
        density,
        dispersion,
        tint: (tintMode === "gold" ? DEFAULT_TINT : DAWN_TINT) as [number, number, number],
      });
    };
    write();
    window.addEventListener("resize", write);
    return () => window.removeEventListener("resize", write);
  }, [density, dispersion, opacity, tintMode, rectSize, rectX, rectY, pointSize]);

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
        stations={["backdrop"]}
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
          label="Point size"
          value={pointSize}
          min={1}
          max={8}
          step={0.5}
          onChange={setPointSize}
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

        <div style={{ marginTop: 14 }}>
          <label
            style={{
              display: "block",
              color: "var(--dawn-70, rgba(236,227,214,0.7))",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              fontSize: 10,
            }}
          >
            Tint
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <TintButton
              active={tintMode === "gold"}
              onClick={() => setTintMode("gold")}
              label="Gold"
            />
            <TintButton
              active={tintMode === "dawn"}
              onClick={() => setTintMode("dawn")}
              label="Dawn"
            />
          </div>
        </div>

        <p
          style={{
            marginTop: 18,
            fontSize: 10,
            color: "rgba(236, 227, 214, 0.45)",
            lineHeight: 1.6,
          }}
        >
          Phase A target: density ≈ 0.22, dispersion ≈ 0.42 for the asking-gap backdrop. Crank
          density to 1.0 to verify the full-density mode reads as a solid mark.
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

function TintButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "8px 12px",
        background: active ? "var(--gold-15, rgba(202,165,84,0.15))" : "transparent",
        border: `1px solid ${active ? "var(--gold, #caa554)" : "var(--dawn-08, rgba(236,227,214,0.08))"}`,
        color: active ? "var(--gold, #caa554)" : "var(--dawn-70, rgba(236,227,214,0.7))",
        fontFamily: "inherit",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.16em",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
