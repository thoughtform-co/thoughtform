"use client";

import { useEffect, useRef, useState } from "react";
import {
  BrandmarkParticleCanvas,
  BrandmarkAtmosphereCanvas as _BrandmarkAtmosphereCanvas,
} from "@/components/brand/BrandmarkParticleField";
import { BrandmarkVectorActor } from "@/components/brand/BrandmarkVectorActor";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

void _BrandmarkAtmosphereCanvas;

/**
 * /test/brandmark-vector — dev preview for the vector-first brandmark
 * model (successor to ADR-013).
 *
 * Mounts both painters side-by-side:
 *
 *   - `BrandmarkVectorActor`     — the crisp inline SVG actor that
 *                                  owns the brandmark shape end-to-end.
 *   - `BrandmarkParticleCanvas`  — the atmosphere field (soft radial
 *                                  dots + additive blending) that
 *                                  paints luminous dust around the
 *                                  vector mark.
 *
 * Both read the single `BrandmarkTransform` in `brandmarkJourneyStore`.
 * Sliders below drive the transform directly so you can scrub
 * density, dispersion, shapeBlend, opacity, rotation, and rect
 * independently — useful when tuning the substrate atmosphere or
 * the transit exhaust amplitude.
 *
 * Internal route — blocked from production by `middleware.ts`.
 */
export default function BrandmarkVectorPreviewPage() {
  // Engine controls.
  const [density, setDensity] = useState(0.15);
  const [dispersion, setDispersion] = useState(0.35);
  const [opacity, setOpacity] = useState(1);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [shapeBlend, setShapeBlend] = useState(0);
  const [rectSize, setRectSize] = useState(420);
  const [rectX, setRectX] = useState(50);
  const [rectY, setRectY] = useState(50);

  // Synthetic scrubbable journey — moves the rect through five
  // keyframe-like positions on a 0..1 timeline. Useful for sanity-
  // checking that the vector actor + atmosphere both lerp smoothly
  // through the full journey without scrolling the real page.
  const [synth, setSynth] = useState(0);
  const synthEnabledRef = useRef(false);

  useEffect(() => {
    useBrandmarkJourneyStore.getState().setMode("particle");
    return () => {
      useBrandmarkJourneyStore.getState().reset();
    };
  }, []);

  useEffect(() => {
    const write = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (synthEnabledRef.current) {
        // Synthetic five-station journey: sigil (small, top) → miss
        // (small, mid-upper) → substrate (large, mid) → rail (tiny,
        // lower-mid) → orbit (small, bottom). Lerps along the 0..1
        // timeline.
        const stations = [
          { x: 0.5, y: 0.3, size: 220, blend: 0, density: 0 },
          { x: 0.5, y: 0.45, size: 200, blend: 0, density: 0.05 },
          { x: 0.5, y: 0.5, size: 480, blend: 1, density: 0.15 },
          { x: 0.5, y: 0.65, size: 110, blend: 0, density: 0.05 },
          { x: 0.5, y: 0.78, size: 160, blend: 0, density: 0 },
        ];
        const t = synth * (stations.length - 1);
        const i = Math.min(stations.length - 2, Math.floor(t));
        const localT = t - i;
        const a = stations[i];
        const b = stations[i + 1];
        const lerp = (p: number, q: number) => p + (q - p) * localT;
        const cx = lerp(a.x, b.x) * vw;
        const cy = lerp(a.y, b.y) * vh;
        const size = lerp(a.size, b.size);
        const blend = lerp(a.blend, b.blend);
        const synthDensity = lerp(a.density, b.density);
        useBrandmarkJourneyStore.getState().setTransform({
          rect: {
            left: cx - size / 2,
            top: cy - size / 2,
            width: size,
            height: size,
          },
          opacity: 1,
          density: synthDensity,
          dispersion: Math.sin(Math.PI * (localT % 1)) * 0.3,
          rotationY: 0,
          ringsActive: false,
          ringProgress: 0,
          shapeBlend: blend,
          vectorOpacity: 1,
          visible: true,
          parkedAt: null,
        });
        return;
      }

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
        shapeBlend,
        vectorOpacity: 1,
        visible: opacity > 0.001,
        parkedAt: null,
      });
    };
    write();
    const id = setInterval(write, 16);
    window.addEventListener("resize", write);
    return () => {
      clearInterval(id);
      window.removeEventListener("resize", write);
    };
  }, [density, dispersion, opacity, rotationDeg, shapeBlend, rectSize, rectX, rectY, synth]);

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
      <BrandmarkVectorActor />
      <BrandmarkParticleCanvas
        forceMount
        className="tf-brandmark-particle-canvas tf-brandmark-particle-canvas--preview"
      />

      <style jsx>{`
        :global(.tf-brandmark-particle-canvas--preview) {
          opacity: 1 !important;
        }
      `}</style>

      <div
        aria-hidden
        style={{
          position: "fixed",
          left: `calc(${rectX}% - ${rectSize / 2}px)`,
          top: `calc(${rectY}% - ${rectSize / 2}px)`,
          width: rectSize,
          height: rectSize,
          border: "1px dashed rgba(202, 165, 84, 0.18)",
          zIndex: 22,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 24,
          right: 24,
          width: 340,
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
          Brandmark Vector Lab
        </h1>

        <SectionLabel>Shape</SectionLabel>
        <ControlSlider
          label="Shape blend (full → ring)"
          value={shapeBlend}
          min={0}
          max={1}
          step={0.01}
          onChange={setShapeBlend}
        />

        <SectionLabel>Atmosphere</SectionLabel>
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

        <SectionLabel>Geometry</SectionLabel>
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
          min={80}
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

        <SectionLabel>Synthetic journey</SectionLabel>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <input
            type="checkbox"
            onChange={(e) => {
              synthEnabledRef.current = e.target.checked;
              setSynth((s) => s);
            }}
            style={{ accentColor: "var(--gold, #caa554)" }}
          />
          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em" }}>
            Enable scrub
          </span>
        </label>
        <ControlSlider
          label="Journey progress"
          value={synth}
          min={0}
          max={1}
          step={0.005}
          onChange={setSynth}
        />

        <p
          style={{
            marginTop: 18,
            fontSize: 10,
            color: "rgba(236, 227, 214, 0.45)",
            lineHeight: 1.6,
          }}
        >
          Vector-first model: <strong style={{ color: "var(--dawn)" }}>BrandmarkVectorActor</strong>{" "}
          paints the brandmark as inline SVG; the particle canvas paints atmospheric grain (soft
          radial dots + additive blending). Shape blend crossfades full→ring topology of the vector
          mark itself.
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 14,
        marginBottom: 6,
        fontSize: 9,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: "var(--gold-70, rgba(202,165,84,0.7))",
        borderTop: "1px dashed rgba(202, 165, 84, 0.2)",
        paddingTop: 8,
      }}
    >
      {children}
    </div>
  );
}
