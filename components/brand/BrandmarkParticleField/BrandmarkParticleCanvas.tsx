"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";
import { probeWebGL } from "@/lib/webgl/probe";
import { BrandmarkParticleStation } from "./BrandmarkParticleStation";
import { BrandmarkSilhouettePoints } from "./BrandmarkSilhouettePoints";

/**
 * BrandmarkParticleCanvas — the single shared R3F canvas that paints
 * the v7 brandmark from particles.
 *
 * ADR-013: previously this component took a `stations` prop and
 * mounted one `BrandmarkParticleStation` per kind. Now there is ONE
 * brandmark and ONE painter — the canvas renders a single
 * `BrandmarkParticleStation` that reads the journey transform from
 * `brandmarkJourneyStore` every frame.
 *
 * Sit at z-index `23` so it sits just under the (legacy) fixed
 * `.tf-brandmark-actor` slot (z=24). The actor is retired in
 * particle mode by `BrandmarkSystem`; the z-order is preserved for
 * SVG-fallback mode.
 *
 * Gated by `prefers-reduced-motion` and WebGL capability — if either
 * fails the component renders nothing and the SVG fallback paints
 * via the `mode === "svg"` branch of the store.
 */

export interface BrandmarkParticleCanvasProps {
  /** Optional className for the wrapper div. */
  className?: string;
  /** Force-mount the canvas even when the journey store is in `"svg"`
   *  mode. Useful for the dev preview page where we want to show
   *  particles regardless of reduced-motion / WebGL capability. */
  forceMount?: boolean;
}

export function BrandmarkParticleCanvas({
  className,
  forceMount = false,
}: BrandmarkParticleCanvasProps = {}) {
  const mode = useBrandmarkJourneyStore((s) => s.mode);
  const [webglOK, setWebglOK] = useState<boolean | null>(null);
  // W4 (plan 03adb0dd) — corridor handoff hardening. The home-v2
  // depth corridor sets `data-brandmark-mode="off"` on `<html>`
  // whenever its engagement is armed/active (see HomeCorridor.tsx),
  // signalling that the corridor's `ProjectedBrandmarkActor` owns
  // the brandmark and the global particle canvas must NOT paint.
  // Previously this attribute only suppressed via the journey
  // store's `visible:false` math — but that depended on the
  // rail-fade-in window, leaving a small risk that the global
  // station could double-paint over the corridor. Reading the
  // attribute directly (subscribed via MutationObserver) is the
  // explicit guard: when "off", the canvas unmounts entirely.
  const [corridorOff, setCorridorOff] = useState<boolean>(false);

  // Probe WebGL capability once on mount. Three.js will throw on
  // canvas-context acquire if WebGL is unavailable; we'd rather know
  // upfront so we can keep the SVG fallback as the painter.
  useEffect(() => {
    setWebglOK(probeWebGL());
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    const read = () => setCorridorOff(html.getAttribute("data-brandmark-mode") === "off");
    read();
    const observer = new MutationObserver(read);
    observer.observe(html, { attributes: true, attributeFilter: ["data-brandmark-mode"] });
    return () => observer.disconnect();
  }, []);

  // Wait for the probe to land before mounting Three. Returning
  // `null` here is fine — the journey hook keeps writing to the
  // store but no painter exists to read the transform, so the SVG
  // actor continues to paint via its `mode === "svg"` branch.
  if (webglOK === null) return null;
  if (!webglOK) return null;
  if (!forceMount && mode !== "particle") return null;
  // Corridor owns the mark; do not double-paint. `forceMount` (used
  // on the dev preview page) intentionally bypasses this so previews
  // still render regardless of whichever route mounted the corridor.
  if (!forceMount && corridorOff) return null;

  // Inline positioning so the wrapper renders correctly even on
  // routes that don't import `landing.css`. In particle mode the
  // wrapper is always visible (no `data-brand-particle-backdrop`
  // gate — that attribute fabric was retired in ADR-013); the
  // brandmark cloud's own opacity uniform controls visibility per
  // the journey transform.
  const baseStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 23,
  };

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
        frameloop="always"
        style={{ background: "transparent", pointerEvents: "none" }}
      >
        <BrandmarkParticleStation />
        {/* ADR-019: silhouette point cloud that paints the brandmark
            from Diagnostic onward. Reads the SAME journey transform
            as the atmosphere station; renders only when
            `transform.silhouetteMorph > 0`. Fades out automatically
            during the substrate window so the intelligence-layer
            canvas's own silhouette → sphere mesh owns the morph. */}
        <BrandmarkSilhouettePoints />
      </Canvas>
    </div>
  );
}
