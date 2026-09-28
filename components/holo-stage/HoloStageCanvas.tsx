"use client";

/**
 * HoloStageCanvas — the stage's canvas host.
 *
 * `HoloProgramCanvas`'s shell (ADR-080), with the object swapped for a spec:
 * a lazily-imported module, the quality governor's dpr ceiling, a `glEpoch`
 * remount on context restore, `frameloop="demand"` with a pump gated on the
 * beat being on screen, and the reference's own post strengths.
 *
 * ⚠ NOTHING DRAGS (ADR-130 U4, owner 2026-09-28: "I can drag it around but how
 * … should people be able to discern what this represents?"). The camera is a
 * fixed orthographic view that frames the SVG fallback's own crop, so the
 * canvas binds no pointer listener, no wheel listener, and cannot be turned
 * into a pose the reader cannot read.
 *
 * ⚠ IT PAINTS THE PAGE'S OWN GROUND. A canvas that paints anything else draws
 * a RECTANGLE across the beat — ADR-080 U2 measured that at three units of
 * difference, invisible as a colour and perfectly visible as an edge.
 */

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
import { stageCameraPosition, stageFrustum } from "./stageFit";
import type { HoloStageSpec } from "./stageGeom";

/**
 * The camera, fitted to the crop.
 *
 * ⚠ THE FRUSTUM IS THE SVG's VIEWBOX, NOT A SOLVE. The drawing is framed by
 * the same numbers the fallback is, so the hologram is that drawing and the
 * DOM words seated over it by fraction land on it at every width. The stage
 * box holds the crop's aspect, so the mapping is uniform; were it not, an
 * orthographic frustum stretches exactly as `preserveAspectRatio="none"` does.
 *
 * ⚠ `manual`, SO R3F LEAVES IT ALONE ON RESIZE. R3F rewrites an orthographic
 * camera's left/right/top/bottom from the canvas size unless it is told the
 * camera is managed — which would put the whole drawing at one world unit
 * per pixel, off the canvas.
 */
function StageFit({ spec }: { spec: HoloStageSpec }) {
  const camera = useThree((s) => s.camera);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!height || !width) return;
    const cam = camera as THREE.OrthographicCamera & { manual?: boolean };
    const f = stageFrustum(spec.frame);
    const pos = stageCameraPosition();
    /* eslint-disable-next-line react-hooks/immutability --
       A three camera IS mutable state the renderer reads each frame; this is
       how `HoloProgramCanvas`'s own `HoloFit` drives it (ADR-080 U3), applied
       here rather than as props because R3F re-applies camera PROPS. */
    cam.manual = true;
    cam.left = f.left;
    cam.right = f.right;
    cam.top = f.top;
    cam.bottom = f.bottom;
    cam.zoom = 1;
    cam.up.set(0, 1, 0);
    cam.position.set(pos[0], pos[1], pos[2]);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
    invalidate();
  }, [camera, width, height, invalidate, spec]);
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
}

export function HoloStageCanvas({
  spec,
  channel,
  armed = true,
  still = false,
  onReady,
  className = "arc-holo__gl",
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
    () => ({ position: [...camPos] as [number, number, number], near: 0.1, far: 100, zoom: 1 }),
    [camPos]
  );

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
    <div className={className} ref={wrapRef} style={{ background: groundCss }}>
      <CanvasErrorBoundary fallback={null}>
        <Canvas
          key={glEpoch}
          orthographic
          /* ⚠ MEMOISED. R3F re-applies changed camera PROPS, so a fresh object
             literal would clobber the frustum `StageFit` set. */
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
          <StageFit spec={spec} />
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
            <Vignette
              offset={0.22}
              darkness={POST.vignette * palette.vignetteScale}
              eskil={false}
            />
          </EffectComposer>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}

export default HoloStageCanvas;
