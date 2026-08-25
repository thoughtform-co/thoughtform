"use client";

/**
 * HoloProgramCanvas — the trajectory instrument's canvas host.
 *
 * The `ServicesHologramCanvas` template: a lazily-imported module (so the
 * three + postprocessing stack never reaches the arc route's First Load JS),
 * a demand frameloop, a dpr ceiling from the quality governor, and a
 * `glEpoch` remount on context restore.
 *
 * ⚠ THE PLATE IS PAINTED IN-CANVAS AND IT IS A KEPT-DARK LITERAL. Grain and
 * vignette have to cover the whole field uniformly — premultiplied noise over
 * alpha-0 pixels simply vanishes, and bloom over a transparent edge halos —
 * so the ground is an opaque `<color attach="background">` rather than a CSS
 * plate behind a transparent canvas. It does NOT flip with the theme: a
 * hologram reads on void, and this is the ADR-058 Lane-0 decision the film
 * stills and card faces already carry. The wrapper repeats the same literal
 * so the plate exists before the first frame and after a context loss.
 */

import { Canvas, useThree } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { HoloProgramScene } from "./HoloProgramScene";
import { CAM_FOV, CAM_POS, CAM_TARGET, type HoloWaypoint } from "./holoProgramGeom";
import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import { useDprCeiling } from "@/lib/hooks/useQualityTier";

/** The kept-dark plate. A literal on purpose — `--arc-plate` re-pins to
 *  parchment in light, and a token here would wash the instrument out the
 *  moment someone flips the theme. */
export const HOLO_PLATE = "#0d0b08";

/** Points the camera at the instrument once. The rig owns pose; the camera
 *  only has to look at the middle of the axis. */
function CameraAim() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    camera.lookAt(CAM_TARGET[0], CAM_TARGET[1], CAM_TARGET[2]);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

/** One frame on demand whenever the box changes — a resize re-solves the
 *  layout, and nothing else would ask for the frame that draws it. */
function ResizePump() {
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  useEffect(() => {
    invalidate();
  }, [size.width, size.height, invalidate]);
  return null;
}

export interface HoloProgramCanvasProps {
  waypoints: readonly HoloWaypoint[];
  /** Arms the arrival — the beat is held behind the hero's curtain until
   *  the reader has actually uncovered it. */
  armed?: boolean;
  /** Resolve the drawing without choreography (reduced motion, lab rest). */
  still?: boolean;
  /** First committed frame. The arc mount promotes `data-holo` on this. */
  onReady?: () => void;
  replayToken?: number;
  className?: string;
}

export function HoloProgramCanvas({
  waypoints,
  armed = true,
  still = false,
  onReady,
  replayToken = 0,
  className = "holo-program",
}: HoloProgramCanvasProps) {
  const [glEpoch, setGlEpoch] = useState(0);
  const dprCeiling = useDprCeiling();
  const readyFired = useRef(false);

  /**
   * The aberration offset — a Vector2 the effect keeps a reference to, so
   * rebuilding it every render would thrash the pass.
   *
   * ⚠ 0.00012, NOT the lab's 0.0006. The reference's rainbow comes from a
   * faint fringe on a FEW very bright arcs; applied at that strength to a
   * drawing made almost entirely of hairlines it separates every line in
   * the picture into red/green/blue and the instrument reads as broken
   * rather than as bloomed. Measured on the first capture: at 0.0006 the
   * graticule, the rails and all seven rings were visibly tripled.
   */
  const aberration = useMemo(() => new THREE.Vector2(0.00012, 0.00012), []);

  const handleReady = () => {
    if (readyFired.current) return;
    readyFired.current = true;
    onReady?.();
  };

  return (
    <div className={className} aria-hidden="true" style={{ background: HOLO_PLATE }}>
      <CanvasErrorBoundary fallback={null}>
        <Canvas
          key={glEpoch}
          camera={{
            position: [...CAM_POS] as [number, number, number],
            fov: CAM_FOV,
            near: 0.1,
            far: 40,
          }}
          dpr={[1, dprCeiling]}
          gl={{ antialias: true, alpha: false, powerPreference: "low-power" }}
          frameloop="demand"
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            const onLost = (e: Event) => e.preventDefault();
            const onRestored = () => setGlEpoch((n) => n + 1);
            canvas.addEventListener("webglcontextlost", onLost as EventListener, false);
            canvas.addEventListener("webglcontextrestored", onRestored, false);
          }}
        >
          <color attach="background" args={[HOLO_PLATE]} />
          <CameraAim />
          <ResizePump />
          <HoloProgramScene
            waypoints={waypoints}
            armed={armed}
            still={still}
            onReady={handleReady}
            replayToken={replayToken}
          />
          <EffectComposer multisampling={0} enableNormalPass={false}>
            <Bloom intensity={0.3} luminanceThreshold={0.42} luminanceSmoothing={0.9} mipmapBlur />
            <ChromaticAberration offset={aberration} />
            <Noise opacity={0.05} premultiply />
            <Vignette offset={0.22} darkness={0.42} eskil={false} />
          </EffectComposer>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}

export default HoloProgramCanvas;
