"use client";

/**
 * HoloStageCanvas — the stage's canvas host.
 *
 * `HoloProgramCanvas`'s shell (ADR-080), with the object swapped for a spec:
 * a lazily-imported module, the quality governor's dpr ceiling, a `glEpoch`
 * remount on context restore, `frameloop="demand"` with a pump gated on the
 * beat being on screen, and the reference's own post strengths.
 *
 * ⚠ THE READER DRAGS THIS OBJECT, and three things keep that safe:
 * `enableZoom={false}` binds no wheel listener, so the page scrolls over it
 * exactly as over any other pixel; `enablePan={false}` keeps it inside its own
 * frame; and both angles are clamped, so the record can never be turned into a
 * pose it cannot be read in.
 *
 * ⚠ IT PAINTS THE PAGE'S OWN GROUND. A canvas that paints anything else draws
 * a RECTANGLE across the beat — ADR-080 U2 measured that at three units of
 * difference, invisible as a colour and perfectly visible as an edge.
 */

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import { holoGroundCss, resolveHoloPalette } from "@/components/holo-program/holoPalette";
import { POST } from "@/components/holo-program/holoProgramGeom";
import { useDprCeiling } from "@/lib/hooks/useQualityTier";
import { useThemeStore } from "@/lib/stores/themeStore";

import { HoloStageScene } from "./HoloStageScene";
import type { AnchorChannel } from "./stageAnchors";
import {
  ORBIT_DAMPING_STAGE,
  STAGE_AZIMUTH_MAX,
  STAGE_AZIMUTH_MIN,
  STAGE_DISTANCE,
  STAGE_FOV,
  STAGE_POLAR_MAX,
  STAGE_POLAR_MIN,
  solveStageFit,
  stageCameraPosition,
} from "./stageFit";
import type { HoloStageSpec } from "./stageGeom";

/**
 * The lens, solved from the canvas the object is actually given.
 *
 * ⚠ THREE'S `fov` IS VERTICAL (ADR-080 U3). Without this the visible height at
 * the target is a constant and every pixel of width the beat owns is empty
 * world by construction — measured there at 23.9 % of the frame filled.
 *
 * ⚠ SOLVED ONCE PER CANVAS SIZE, AT THE REST POSE. Re-solving under the drag
 * would make the lens breathe, which reads as the drawing resisting the hand.
 */
function StageFit({ spec, gutters }: { spec: HoloStageSpec; gutters: { top: number; bottom: number } }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target?: THREE.Vector3; update?: () => void } | null;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!height || !width) return;
    const cam = camera as THREE.PerspectiveCamera;
    const { fov, offsetY, target } = solveStageFit(spec.bounds, width, height, gutters);
    /* eslint-disable-next-line react-hooks/immutability --
       A three camera IS mutable state the renderer reads each frame; this is
       how `HoloProgramCanvas`'s own `HoloFit` drives it (ADR-080 U3). The
       solved value is applied here rather than passed as a prop precisely
       because R3F re-applies camera PROPS and would clobber it. */
    cam.fov = fov;
    const rest = stageCameraPosition();
    cam.position.set(rest[0] + target[0], rest[1] + target[1], rest[2] + target[2]);
    if (controls?.target) {
      controls.target.set(target[0], target[1], target[2]);
      controls.update?.();
    }
    /* ⚠ SHIFT THE FRUSTUM, NOT THE OBJECT. The published anchors go through
       this same projection matrix, so the DOM labels follow for free. */
    cam.setViewOffset(width, height, 0, -offsetY, width, height);
    cam.updateProjectionMatrix();
    invalidate();
    return () => {
      cam.clearViewOffset();
    };
  }, [camera, controls, width, height, invalidate, spec, gutters]);
  return null;
}

/** Pumps the loop only while the object is on screen AND the tab is visible. */
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

export interface HoloStageCanvasProps {
  spec: HoloStageSpec;
  channel: AnchorChannel;
  armed?: boolean;
  still?: boolean;
  onReady?: () => void;
  className?: string;
  gutters?: { top: number; bottom: number };
}

export function HoloStageCanvas({
  spec,
  channel,
  armed = true,
  still = false,
  onReady,
  className = "arc-holo__gl",
  gutters = { top: 0, bottom: 0 },
}: HoloStageCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [glEpoch, setGlEpoch] = useState(0);
  const [onScreen, setOnScreen] = useState(false);
  const dprCeiling = useDprCeiling();
  const readyFired = useRef(false);

  /* ⚠ A SCALAR SELECTOR. `useQualityTier()` returns a fresh object, so
     `useSyncExternalStore` never sees a stable snapshot and React tears the
     tree down with "Maximum update depth exceeded" — how ADR-080's canvas
     failed to mount on its first run. */
  const mode = useThemeStore((s) => s.mode);
  const palette = useMemo(() => resolveHoloPalette(mode), [mode]);
  const groundCss = useMemo(() => holoGroundCss(mode), [mode]);

  const camPos = useMemo(() => stageCameraPosition(), []);
  const cameraProps = useMemo(
    () => ({ position: [...camPos] as [number, number, number], fov: STAGE_FOV, near: 0.1, far: 60 }),
    [camPos]
  );
  const gut = useMemo(() => gutters, [gutters.top, gutters.bottom]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className={className} ref={wrapRef} style={{ background: groundCss, touchAction: "none" }}>
      <CanvasErrorBoundary fallback={null}>
        <Canvas
          key={glEpoch}
          /* ⚠ MEMOISED. R3F re-applies changed camera PROPS, so a fresh object
             literal would clobber the fov `StageFit` solved. */
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
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={ORBIT_DAMPING_STAGE}
            enablePan={false}
            enableZoom={false}
            minPolarAngle={STAGE_POLAR_MIN}
            maxPolarAngle={STAGE_POLAR_MAX}
            minAzimuthAngle={STAGE_AZIMUTH_MIN}
            maxAzimuthAngle={STAGE_AZIMUTH_MAX}
            minDistance={STAGE_DISTANCE}
            maxDistance={STAGE_DISTANCE}
            /* ⚠ 0.22. Three's `rotateLeft` is `2π·dx/clientHeight·speed`, so at
               the default a short drag slams the clamp and the object feels
               broken rather than bounded (ADR-080 U3's measurement). */
            rotateSpeed={0.22}
          />
          <StageFit spec={spec} gutters={gut} />
          <LifePump active={onScreen} />

          <HoloStageScene
            key={`${spec.id}-${mode}`}
            spec={spec}
            palette={palette}
            channel={channel}
            armed={armed}
            still={still}
            onReady={handleReady}
          />

          <EffectComposer multisampling={0} enableNormalPass={false}>
            {/* ⚠ The threshold sits ABOVE the structure and BELOW the donors,
                or bloom stops being a highlight and becomes a blur on
                everything. On a light ground it scales to a trace rather than
                being unmounted — swapping the composer's child COUNT between
                themes remounts every effect under it. */}
            <Bloom
              intensity={POST.bloom * palette.bloomScale}
              luminanceThreshold={0.62}
              luminanceSmoothing={POST.bloomRadius}
              mipmapBlur
            />
            <Noise opacity={POST.grain * palette.grainScale} premultiply />
            <Vignette offset={0.22} darkness={POST.vignette * palette.vignetteScale} eskil={false} />
          </EffectComposer>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}

export default HoloStageCanvas;
