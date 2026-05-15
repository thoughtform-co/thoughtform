"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import {
  ALL_STATION_KINDS,
  useBrandmarkParticleStore,
  type StationKind,
} from "@/lib/stores/brandmarkParticleStore";
import { BrandmarkParticleStation } from "./BrandmarkParticleStation";

/**
 * BrandmarkParticleCanvas — single shared R3F canvas that paints
 * every brandmark on the page from particles.
 *
 * Mounts once at the v7 landing root. Inside, it renders one
 * `BrandmarkParticleStation` per station listed in `stations`. The
 * v7 landing wires all five (sigil + miss + substrate + rail +
 * orbit); other consumers (e.g. the dev preview at
 * `/test/brandmark-particle`) may opt into a subset via the
 * `stations` prop.
 *
 * Sit at z-index `23` so it sits just under the fixed
 * `.tf-brandmark-actor` (z=24). That keeps the SVG actor as the top
 * layer when it paints during transit, and the particle field as a
 * sub-layer that the actor's CSS gate (`opacity: 0`) reveals when the
 * journey hands ownership to particles.
 *
 * The canvas is gated by `prefers-reduced-motion` and by WebGL
 * capability — if either fails the component renders nothing and the
 * existing SVG actor + portal'd glyphs paint unchanged via the
 * `mode === "svg"` branch of the store. See ADR-011 for the fallback
 * policy.
 */

export interface BrandmarkParticleCanvasProps {
  /** Stations to render. Defaults to `substrate` only — the dev
   *  preview's typical scope. Pass `ALL_STATION_KINDS` (or an
   *  explicit list) to enable every station, as the v7 landing does. */
  stations?: readonly StationKind[];
  /** Optional className for the wrapper div. */
  className?: string;
  /** Force-mount the canvas even when the store is in `"svg"` mode.
   *  Useful for the dev preview page where we want to show particles
   *  regardless of reduced-motion / WebGL capability. */
  forceMount?: boolean;
}

export function BrandmarkParticleCanvas({
  stations = ["substrate"],
  className,
  forceMount = false,
}: BrandmarkParticleCanvasProps) {
  const mode = useBrandmarkParticleStore((s) => s.mode);
  const [webglOK, setWebglOK] = useState<boolean | null>(null);

  // Probe WebGL capability once on mount. Three.js will throw on
  // canvas-context acquire if WebGL is unavailable; we'd rather know
  // upfront so we can keep the SVG fallback as the painter.
  useEffect(() => {
    setWebglOK(probeWebGL());
  }, []);

  // Wait for the probe to land before mounting Three. Returning
  // `null` here is fine — the choreography hook keeps writing to the
  // store but no station mesh exists to read the snapshots, so the
  // SVG actor continues to paint via its `mode === "svg"` branch.
  if (webglOK === null) return null;
  if (!webglOK) return null;
  if (!forceMount && mode !== "particle") return null;

  // Inline positioning so the wrapper renders correctly even on
  // routes that don't import `landing.css`. The CSS class layered on
  // top controls only the gated fade (opacity 0 → 1 driven by
  // `[data-brand-particle-backdrop]` on documentElement). For the
  // dev preview (`forceMount`), opacity stays 1 via inline override.
  const baseStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    // z:23 sits just under `.tf-brandmark-actor` (z:24). See
    // `landing.css` § Brandmark particle artifact.
    zIndex: 23,
  };
  if (forceMount) {
    baseStyle.opacity = 1;
  }

  return (
    <div
      aria-hidden="true"
      className={className ?? "tf-brandmark-particle-canvas tf-brandmark-particle-canvas--default"}
      style={baseStyle}
    >
      {/* R3F's inner wrapper element installs `pointer-events: auto`
          on itself so its raycaster can pick up canvas events. We
          don't use any pointer interaction in the particle field
          (it's purely visual chrome), and a full-viewport canvas
          with `pointer-events: auto` would eat clicks meant for the
          page content beneath it. Override the wrapper + the inner
          `<canvas>` element here so the particle field is always
          pass-through. */}
      <style>{`
        .tf-brandmark-particle-canvas > div,
        .tf-brandmark-particle-canvas--default > div,
        .tf-brandmark-particle-canvas--preview > div,
        .tf-brandmark-particle-canvas > div > canvas,
        .tf-brandmark-particle-canvas--default > div > canvas,
        .tf-brandmark-particle-canvas--preview > div > canvas {
          pointer-events: none !important;
        }
      `}</style>
      <Canvas
        orthographic
        camera={{
          // Identity projection — the vertex shader does pixel-to-NDC
          // conversion directly via the `uViewport` uniform, so the
          // camera matrix should not transform our gl_Position. An
          // orthographic camera with zoom 1 at origin is the
          // simplest no-op transform.
          position: [0, 0, 10],
          near: -100,
          far: 100,
          zoom: 1,
        }}
        dpr={[1, 2]}
        gl={{
          alpha: true,
          antialias: false,
          premultipliedAlpha: false,
          powerPreference: "low-power",
          preserveDrawingBuffer: false,
        }}
        // `frameloop="always"` is the default; we keep it explicit so
        // the per-frame uniform sync inside `BrandmarkParticleStation`
        // runs even when no React state changes.
        frameloop="always"
        // R3F installs `pointer-events: auto` on its inner wrapper
        // by default so it can run its raycaster. We don't need any
        // pointer interactivity (the particle field is purely visual
        // chrome), and leaving it auto means the full-viewport
        // canvas eats clicks meant for buttons / links beneath it.
        // Forcing `none` keeps the canvas pass-through.
        style={{ background: "transparent", pointerEvents: "none" }}
      >
        <ParticleStations stations={stations} />
      </Canvas>
    </div>
  );
}

function ParticleStations({ stations }: { stations: readonly StationKind[] }) {
  // Dedup + sanity. ALL_STATION_KINDS is referenced so a typo in the
  // caller's list surfaces as a type error rather than a silent miss.
  const list = useMemo(() => {
    const set = new Set(stations.filter((s) => ALL_STATION_KINDS.includes(s)));
    return Array.from(set);
  }, [stations]);
  return (
    <>
      {list.map((kind) => (
        <BrandmarkParticleStation key={kind} stationKind={kind} />
      ))}
    </>
  );
}

/** One-shot WebGL feasibility probe. Returns `true` if a WebGL 2
 *  context (or WebGL 1 fallback) can be acquired. We don't keep the
 *  probe context around — Three creates its own. */
function probeWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    return ctx != null;
  } catch {
    return false;
  }
}
