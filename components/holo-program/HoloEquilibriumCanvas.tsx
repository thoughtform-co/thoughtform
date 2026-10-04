"use client";

/**
 * HoloEquilibriumCanvas — the workshop opener's canvas host (ADR-143 U7).
 *
 * `HoloProgramCanvas`'s shell (ADR-080): a lazily-imported module, the quality
 * governor's dpr ceiling, a `glEpoch` remount on context restore, a demand
 * frameloop pumped only while the object is on screen, real `OrbitControls`
 * with zoom and pan off, and the reference's bloom and grain.
 *
 * ⚠ A REAL PERSPECTIVE CAMERA, AT ONE REST POSE. The figure box holds
 * `EQ_FRAME`'s aspect and the lens is `EQ_CAMERA`'s, so the hologram at rest
 * is exactly the static drawing the server projected from the same numbers,
 * and the DOM words seated over it land on it. The reader may turn it inside
 * a band (`EQ_DRAG`); the words follow through the anchor channel.
 *
 * ⚠ THE LIGHT GROUND'S TWO RECTANGLES ARE CLOSED, as on the stage (ADR-140):
 * bloom's threshold sits ABOVE the paper's luminance there, and the vignette
 * is zero on paper. ⚠ No chromatic aberration: ADR-080 measured it splitting
 * fine line work and motes into coloured confetti.
 */

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";

import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import type { AnchorChannel } from "@/components/holo-stage/stageAnchors";
import { useDprCeiling } from "@/lib/hooks/useQualityTier";
import { useThemeStore } from "@/lib/stores/themeStore";

import { EQ_CAMERA, EQ_DRAG, eqCameraPosition } from "./equilibriumGeom";
import { HoloEquilibriumScene } from "./HoloEquilibriumScene";
import { holoGroundCss, resolveHoloPalette } from "./holoPalette";
import { POST } from "./holoProgramGeom";

const RAD = Math.PI / 180;

/** Pumps the loop only while the object is on screen AND the tab is visible:
 *  the object is alive, and this gate is where that life's cost is reclaimed. */
function LifePump({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const pump = () => {
      if (document.visibilityState === "visible") invalidate();
      raf = requestAnimationFrame(pump);
    };
    raf = requestAnimationFrame(pump);
    return () => cancelAnimationFrame(raf);
  }, [active, invalidate]);
  return null;
}

export interface HoloEquilibriumCanvasProps {
  channel: AnchorChannel;
  armed?: boolean;
  still?: boolean;
  /** The page's own ground under the figure, `#rrggbb` (the mount resolves it). */
  ground?: string;
  onReady?: () => void;
  className?: string;
}

export function HoloEquilibriumCanvas({
  channel,
  armed = true,
  still = false,
  ground,
  onReady,
  className = "tw-eq__gl-canvas",
}: HoloEquilibriumCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [glEpoch, setGlEpoch] = useState(0);
  const [onScreen, setOnScreen] = useState(false);
  const dprCeiling = useDprCeiling();
  const readyFired = useRef(false);

  /* ⚠ A SCALAR SELECTOR (ADR-080's own trap): a fresh object here tears the
     tree down with "Maximum update depth exceeded". */
  const mode = useThemeStore((s) => s.mode);
  const groundCss = useMemo(() => ground ?? holoGroundCss(mode), [ground, mode]);
  const palette = useMemo(() => {
    const base = resolveHoloPalette(mode);
    const hex = /^#([0-9a-f]{6})$/i.exec(groundCss);
    return hex ? { ...base, ground: parseInt(hex[1], 16) } : base;
  }, [mode, groundCss]);

  /* ⚠ MEMOISED: R3F re-applies changed camera PROPS. */
  const cameraProps = useMemo(
    () => ({
      position: eqCameraPosition(),
      fov: EQ_CAMERA.fovDeg,
      near: 0.1,
      far: 60,
    }),
    []
  );
  const polarRest = (90 - EQ_CAMERA.elevationDeg) * RAD;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), {
      rootMargin: "20% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleReady = () => {
    if (readyFired.current) return;
    readyFired.current = true;
    onReady?.();
  };

  return (
    <div
      className={className}
      ref={wrapRef}
      /* A touch drag turns the object rather than scrolling the page; safe
         because this canvas never mounts below the desktop tier. */
      style={{ background: groundCss, touchAction: "none" }}
    >
      <CanvasErrorBoundary fallback={null}>
        <Canvas
          key={glEpoch}
          camera={cameraProps}
          dpr={[1, dprCeiling]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          frameloop="demand"
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            canvas.addEventListener("webglcontextlost", (e: Event) => e.preventDefault(), false);
            canvas.addEventListener("webglcontextrestored", () => setGlEpoch((n) => n + 1), false);
          }}
        >
          <color attach="background" args={[groundCss]} />
          <LifePump active={onScreen} />
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.075}
            /* Zoom off: no wheel listener, the page scrolls over the object.
               Pan off: it cannot be dragged out of its own frame. */
            enablePan={false}
            enableZoom={false}
            minAzimuthAngle={(EQ_CAMERA.azimuthDeg - EQ_DRAG.azimuthDeg) * RAD}
            maxAzimuthAngle={(EQ_CAMERA.azimuthDeg + EQ_DRAG.azimuthDeg) * RAD}
            minPolarAngle={polarRest - EQ_DRAG.polarDeg * RAD}
            maxPolarAngle={polarRest + EQ_DRAG.polarDeg * RAD}
            minDistance={EQ_CAMERA.distance}
            maxDistance={EQ_CAMERA.distance}
            rotateSpeed={0.22}
          />

          <HoloEquilibriumScene
            key={mode}
            palette={palette}
            armed={armed}
            still={still}
            onReady={handleReady}
            channel={channel}
          />

          <EffectComposer multisampling={0} enableNormalPass={false}>
            {/* The bright arcs and the gold motes are the only things above
                the threshold on void; on paper nothing is brighter than the
                paper, so 0.97 leaves bloom nothing to lift (ADR-140). */}
            <Bloom
              intensity={POST.bloom * palette.bloomScale}
              luminanceThreshold={palette.additive ? 0.62 : 0.97}
              luminanceSmoothing={POST.bloomRadius}
              mipmapBlur
            />
            {/* ⚠ NO GRAIN ON PAPER. The pass blends by SCREEN, which only
                lightens: on parchment it lifted the canvas ~0.8 of a unit over
                the page and its box showed as a rectangle (measured). On void
                it is the reference's grain. Mounted in both, at zero on paper,
                so the composer's child count never changes. */}
            <Noise opacity={palette.additive ? POST.grain * palette.grainScale : 0} premultiply />
            <Vignette
              offset={0.2}
              darkness={palette.additive ? POST.vignette * palette.vignetteScale : 0}
              eskil={false}
            />
          </EffectComposer>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}

export default HoloEquilibriumCanvas;
