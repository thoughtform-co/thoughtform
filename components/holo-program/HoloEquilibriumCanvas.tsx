"use client";

/**
 * HoloEquilibriumCanvas — the workshop opener's canvas host (ADR-143 U7).
 *
 * `HoloProgramCanvas`'s shell (ADR-080): a lazily-imported module, the quality
 * governor's dpr ceiling, a `glEpoch` remount on context restore, a demand
 * frameloop pumped only while the object is on screen, real `OrbitControls`
 * with zoom and pan off, and the reference's bloom and grain.
 *
 * ⚠ A REAL PERSPECTIVE CAMERA, AT ONE REST POSE. The figure box holds the
 * figure's frame aspect and the lens is its camera's (`equilibriumFigures`),
 * so the hologram at rest is exactly the static drawing the server projected
 * from the same numbers, and the DOM words seated over it land on it. The reader may turn it inside
 * a band (the figure's `drag`); the words follow through the anchor channel.
 *
 * ⚠ BARE ON THE PAGE (ADR-143 U11, owner 2026-10-05: "remove the background
 * and grid; i want this to blend as elegantly as possible with the rest of
 * the site"). `bare` clears the canvas to transparent, paints no ground, runs
 * the grain and the vignette at zero, and has the instrument draw no floor,
 * no dust of its own and no bokeh: the page's own starfield behind the
 * station is the object's air, as it is the About's. Bloom stays, on the
 * object alone. The lab's river keeps its ground (it is a diorama, a block
 * with a ground of its own).
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

import { cameraPosition } from "./eqCamera";
import { EQ_FIGURES, type EqFigureId } from "./equilibriumFigures";
import { HoloEquilibriumScene } from "./HoloEquilibriumScene";
import { HoloRiverScene } from "./HoloRiverScene";
import { holoGroundCss, resolveHoloPalette } from "./holoPalette";
import { POST } from "./holoProgramGeom";

const RAD = Math.PI / 180;
/** The bloom's spread on the page (ADR-143 U11): the glow stays on the lines. */
export const BARE_BLOOM_RADIUS = 0.5;

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
  /** Which figure (ADR-143 U8 instrument, U9 river); the camera follows it. */
  variant?: EqFigureId;
  /** Where the eye is, reported by the scene each frame (the bearing readout). */
  onView?: (azDeg: number, elDeg: number) => void;
  /** Blend into the page (ADR-143 U11): a transparent canvas, no ground, no
   *  grain or vignette, and the instrument without its floor, dust or bokeh. */
  bare?: boolean;
}

export function HoloEquilibriumCanvas({
  channel,
  armed = true,
  still = false,
  ground,
  onReady,
  className = "tw-eq__gl-canvas",
  variant = "instrument",
  onView,
  bare = false,
}: HoloEquilibriumCanvasProps) {
  const figure = EQ_FIGURES[variant];
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
      position: cameraPosition(figure.camera),
      fov: figure.camera.fovDeg,
      near: 0.1,
      far: 60,
    }),
    [figure]
  );
  const { camera: cam, drag, bloom } = figure;
  const polarRest = (90 - cam.elevationDeg) * RAD;
  /* A free turn (U10): no azimuth clamp, and a quicker hand, so a full turn
     is one easy drag rather than four. */
  const freeTurn = !Number.isFinite(drag.azimuthDeg);

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
      style={{ background: bare ? "transparent" : groundCss, touchAction: "none" }}
    >
      <CanvasErrorBoundary fallback={null}>
        <Canvas
          key={`${variant}-${bare ? "bare" : "ground"}-${glEpoch}`}
          camera={cameraProps}
          dpr={[1, dprCeiling]}
          gl={{ antialias: true, alpha: bare, powerPreference: "high-performance" }}
          frameloop="demand"
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            canvas.addEventListener("webglcontextlost", (e: Event) => e.preventDefault(), false);
            canvas.addEventListener("webglcontextrestored", () => setGlEpoch((n) => n + 1), false);
          }}
        >
          {bare ? null : <color attach="background" args={[groundCss]} />}
          <LifePump active={onScreen} />
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.075}
            /* Zoom off: no wheel listener, the page scrolls over the object.
               Pan off: it cannot be dragged out of its own frame. */
            enablePan={false}
            enableZoom={false}
            minAzimuthAngle={freeTurn ? -Infinity : (cam.azimuthDeg - drag.azimuthDeg) * RAD}
            maxAzimuthAngle={freeTurn ? Infinity : (cam.azimuthDeg + drag.azimuthDeg) * RAD}
            minPolarAngle={polarRest - drag.polarDeg * RAD}
            maxPolarAngle={polarRest + drag.polarDeg * RAD}
            minDistance={cam.distance}
            maxDistance={cam.distance}
            rotateSpeed={freeTurn ? 0.5 : 0.22}
          />

          {variant === "river" ? (
            <HoloRiverScene
              key={`${variant}-${mode}`}
              palette={palette}
              armed={armed}
              still={still}
              onReady={handleReady}
              channel={channel}
              onView={onView}
            />
          ) : (
            <HoloEquilibriumScene
              key={`${variant}-${mode}`}
              palette={palette}
              armed={armed}
              still={still}
              onReady={handleReady}
              channel={channel}
              onView={onView}
              bare={bare}
            />
          )}

          <EffectComposer multisampling={0} enableNormalPass={false}>
            {/* The bright arcs and the gold motes are the only things above
                the threshold on void; on paper nothing is brighter than the
                paper, so 0.97 leaves bloom nothing to lift (ADR-140). */}
            <Bloom
              intensity={bloom.intensity * palette.bloomScale}
              luminanceThreshold={palette.additive ? bloom.threshold : 0.97}
              luminanceSmoothing={POST.bloomRadius}
              /* Bare, a tighter glow: at the figure's 0.86 the widest mips
                 lift the whole slot ~1.6 levels even 100px off any line
                 (measured, canvas shown against hidden), and a lift that
                 wide meets the slot's edge and draws its box (U11). */
              radius={bare ? Math.min(bloom.radius, BARE_BLOOM_RADIUS) : bloom.radius}
              mipmapBlur
            />
            {/* ⚠ NO GRAIN ON PAPER. The pass blends by SCREEN, which only
                lightens: on parchment it lifted the canvas ~0.8 of a unit over
                the page and its box showed as a rectangle (measured). On void
                it is the reference's grain. Mounted in both, at zero on paper,
                so the composer's child count never changes. */}
            {/* Bare, both at zero: grain over a transparent canvas would
                draw the canvas's box back onto the page. */}
            <Noise
              opacity={palette.additive && !bare ? POST.grain * palette.grainScale : 0}
              premultiply
            />
            <Vignette
              offset={0.2}
              darkness={palette.additive && !bare ? POST.vignette * palette.vignetteScale : 0}
              eskil={false}
            />
          </EffectComposer>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}

export default HoloEquilibriumCanvas;
