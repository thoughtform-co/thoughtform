"use client";

/**
 * HoloProgramCanvas — the artifact's canvas host.
 *
 * The `ServicesHologramCanvas` template (lazily-imported module, dpr ceiling
 * from the quality governor, `glEpoch` remount on context restore), with the
 * round-2 additions: real `OrbitControls`, depth of field, and the
 * reference's own post strengths.
 *
 * ⚠ THE READER DRAGS THIS OBJECT. The wrapper takes pointer events, which is
 * the one place on this estate where a canvas does. Three things keep that
 * safe: `enableZoom={false}` means OrbitControls never binds a wheel
 * listener, so the page scrolls over the object exactly as it does over any
 * other pixel; `enablePan={false}` means the object cannot be dragged out of
 * its own frame; and the polar angle is clamped, so it can never be viewed
 * from underneath the floor grid.
 *
 * ⚠ THE PLATE IS PAINTED IN-CANVAS, AND IT DOES FLIP WITH THE THEME.
 * The ground is an opaque `<color attach="background">` rather than a CSS
 * plate behind a transparent canvas, because grain and vignette have to
 * cover the field uniformly — premultiplied noise over alpha-0 pixels
 * vanishes, and bloom over a transparent edge halos.
 *
 * ⚠ IT WAS KEPT-DARK IN BOTH THEMES UNTIL 2026-08-25 (owner: "now do the
 * light mode"). That earlier call was ADR-058's Lane 0 — the film stills'
 * kept-dark precedent — and it was defensible while this was a small panel
 * inset into a page. As a full-bleed artifact a dark box across the whole
 * beat is a different proposition, so the object now has two genuinely
 * different drawings: see `holoPalette.ts` for why light is not a token
 * swap (additive blending cannot darken, dawn on parchment is invisible,
 * bloom has nothing to lift, and raw gold is ~1.2:1 on paper).
 */

import { OrbitControls } from "@react-three/drei";
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
import { holoGroundCss, resolveHoloPalette } from "./holoPalette";
import {
  AUTO_ROTATE_SPEED,
  CAM_DISTANCE,
  CAM_FOV,
  HOLO_PLATE,
  ORBIT_DAMPING,
  POLAR_MAX,
  POLAR_MIN,
  POST,
  restCameraPosition,
  type HoloPost,
  type HoloWaypoint,
} from "./holoProgramGeom";
import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import { useDprCeiling } from "@/lib/hooks/useQualityTier";
import { useThemeStore } from "@/lib/stores/themeStore";

export { HOLO_PLATE };

/** Pumps the loop only while the object is on screen AND the tab is visible.
 *  The artifact is alive by owner ruling, so this gate is where the cost of
 *  that life is actually reclaimed. */
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

export interface HoloProgramCanvasProps {
  waypoints: readonly HoloWaypoint[];
  armed?: boolean;
  still?: boolean;
  onReady?: () => void;
  replayToken?: number;
  className?: string;
  /** Lab overrides. Production passes nothing and uses the constants. */
  life?: { breathe?: number; flicker?: number; twinkle?: number };
  post?: Partial<HoloPost>;
  autoRotate?: boolean;
}

export function HoloProgramCanvas({
  waypoints,
  armed = true,
  still = false,
  onReady,
  replayToken = 0,
  className = "holo-program",
  life,
  post,
  /** ⚠ OFF (owner, 2026-08-25). A held instrument does not turn itself; the
   *  reader turns it. The lab keeps a toggle for comparison. */
  autoRotate = false,
}: HoloProgramCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [glEpoch, setGlEpoch] = useState(0);
  const [onScreen, setOnScreen] = useState(false);
  const dprCeiling = useDprCeiling();
  const readyFired = useRef(false);

  /* ⚠ A SCALAR SELECTOR. `useThemeStore((s) => s.mode)` returns a string, so
     the snapshot is stable — unlike `useQualityTier()`, whose fresh object
     tore this tree down with "Maximum update depth exceeded". A theme flip
     is rare, so re-rendering the canvas subtree on it is the cheap and
     honest way to re-colour a scene full of module constants. */
  const mode = useThemeStore((s) => s.mode);
  const palette = useMemo(() => resolveHoloPalette(mode), [mode]);
  const groundCss = useMemo(() => holoGroundCss(mode), [mode]);

  const P = { ...POST, ...post };
  const aberration = useMemo(() => new THREE.Vector2(P.aberration, P.aberration), [P.aberration]);
  const camPos = useMemo(() => restCameraPosition(), []);

  /* ⚠ Depth of field and the aberration are the first things to go on a weak
     GPU — the most expensive passes and the least load-bearing. The object
     still reads without them; it does not read without bloom.
     ⚠ Gated on the DPR ceiling ALONE, which is a reactive SCALAR. Do not
     reach for `useQualityTier()` here: its selector builds a fresh object
     every call, so `useSyncExternalStore` never sees a stable snapshot and
     React tears the tree down with "Maximum update depth exceeded" — which
     is exactly how this canvas failed to mount on its first run. The
     governor spends its DPR rungs before its count rungs anyway, so this is
     also the earlier signal. */
  const heavyPost = dprCeiling > 1.2;

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
      /* The object is grabbable. `touch-action: none` is what lets a touch
         drag rotate it instead of scrolling the page — and it is safe only
         because this canvas never mounts below the desktop tier. */
      style={{ background: groundCss, touchAction: "none", cursor: "grab" }}
    >
      <CanvasErrorBoundary fallback={null}>
        <Canvas
          key={glEpoch}
          camera={{
            position: [...camPos] as [number, number, number],
            fov: CAM_FOV,
            near: 0.1,
            far: 60,
          }}
          dpr={[1, dprCeiling]}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          frameloop="demand"
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            const onLost = (e: Event) => e.preventDefault();
            const onRestored = () => setGlEpoch((n) => n + 1);
            canvas.addEventListener("webglcontextlost", onLost as EventListener, false);
            canvas.addEventListener("webglcontextrestored", onRestored, false);
          }}
        >
          <color attach="background" args={[groundCss]} />
          <LifePump active={onScreen} />

          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={ORBIT_DAMPING}
            /* ⚠ Both false on purpose. Zoom off means no wheel listener is
               ever bound, so the page keeps scrolling over the object; pan
               off means it cannot be dragged out of its own frame. */
            enablePan={false}
            enableZoom={false}
            minPolarAngle={POLAR_MIN}
            maxPolarAngle={POLAR_MAX}
            minDistance={CAM_DISTANCE}
            maxDistance={CAM_DISTANCE}
            autoRotate={autoRotate && !still}
            autoRotateSpeed={AUTO_ROTATE_SPEED}
            rotateSpeed={0.55}
          />

          <HoloProgramScene
            key={mode}
            waypoints={waypoints}
            armed={armed}
            still={still}
            onReady={handleReady}
            replayToken={replayToken}
            life={life}
            palette={palette}
          />

          <EffectComposer multisampling={0} enableNormalPass={false}>
            {/* ⚠ DEPTH OF FIELD IS RETIRED (owner: "a bit too much blur").
                It was the most expensive pass AND the one softening the
                whole object — a wireframe instrument wants its lines sharp,
                and the reference's own blur reads on solid bodies rather
                than on hairlines. The `heavyPost` gate now guards the
                aberration alone. */}
            {/* ⚠ The threshold has to sit ABOVE the structure and BELOW the
                accent arcs, or bloom stops being a highlight and becomes a
                blur applied to everything. */}
            {/* ⚠ On a light ground bloom lifts nothing and only washes the
                page, so the palette scales it to a trace rather than the
                pass being conditionally mounted — swapping the composer's
                child COUNT between themes remounts every effect under it. */}
            <Bloom
              intensity={P.bloom * palette.bloomScale}
              luminanceThreshold={0.62}
              luminanceSmoothing={P.bloomRadius}
              mipmapBlur
            />
            {heavyPost ? <ChromaticAberration offset={aberration} /> : <></>}
            <Noise opacity={P.grain * palette.grainScale} premultiply />
            <Vignette offset={0.2} darkness={P.vignette * palette.vignetteScale} eskil={false} />
          </EffectComposer>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}

export default HoloProgramCanvas;
