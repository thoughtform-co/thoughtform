"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useIlayerProgressStore } from "./useIlayerProgress";

/**
 * IntelligenceLayerStack — the R3F scene that paints the layered
 * intelligence-layer artifact (ADR-012 v3).
 *
 * The brandmark is the middle layer (painted by the DOM substrate
 * dock, which sits over the canvas in z-index:3 and shares the
 * same X-tilt via the --ilayer-tilt-deg CSS variable). This canvas
 * paints only the TWO surrounding rings — Navigate above, Build
 * below — that emerge from the brandmark's centre as the section
 * enters view.
 *
 * Animation arc, driven by the section's scroll progress (0..1):
 *
 *   progress 0.00            head-on, rings collapsed at centre
 *                            (radius 0, opacity 0). Brandmark
 *                            untilted.
 *   progress 0.10 → 0.50     rings scale from 0 → 1 and slide from
 *                            Y=0 to Y=±splitY. Group tilts from
 *                            0 to ~22 degrees on X. Opacities
 *                            ramp in.
 *   progress 0.50 → 0.85     hold at full tilt + full split.
 *   progress 0.85 → 1.00     tilt eases back to 0 and rings fade
 *                            (but stay at split-Y) so the substrate
 *                            station's choreography handoff to
 *                            rail fires against an un-rotated bbox.
 *
 * The same envelope shape that drives the R3F tilt also drives the
 * --ilayer-tilt-deg CSS variable in `useIlayerProgress`, so the
 * SVG brandmark in the DOM dock and these rings always share one
 * tilt and one motion.
 */

// Two emerging rings. Sizes are intentionally larger than the
// brandmark anchor (clamp(220px, 26vw, 320px) at the dock layer)
// so the brandmark sits inside the navigate/build rings as the
// stack opens, like a coin landing between two plates.
const RING_GEOM = {
  navigate: { outerR: 1.4, innerR: 1.18, splitY: 0.42 },
  build: { outerR: 1.4, innerR: 1.18, splitY: -0.42 },
} as const;

// Disc fill alphas (low — these read as halos, not slabs) and edge
// alphas (high — these read as the hairline strokes).
const RING_TARGET_ALPHA = {
  navigate: { fill: 0.18, edge: 0.95 },
  build: { fill: 0.18, edge: 0.7 },
} as const;

// Hairline edge ring widths (outer - inner). Small enough to read
// as a stroke rather than a band.
const EDGE_RING_WIDTH = 0.022;

// Thoughtform palette (matches `--gold`, `--dawn` in landing tokens).
const COLOURS = {
  navigate: "#ece3d6", // dawn — input lane
  build: "#a99e8a", // dawn-deep — output lane
} as const;

/** Smooth easing for opacity / scale ramps. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Tent envelope used by both the R3F group's tilt and the CSS
 * --ilayer-tilt-deg variable: ramps 0 → 1 across [0.00..0.50],
 * holds at 1 across [0.50..0.85], eases back to 0 across
 * [0.85..1.00]. Keeps the brandmark choreography handoff to rail
 * happening against an un-rotated dock bbox.
 */
export function tiltEnvelope(progress: number): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 0;
  if (progress < 0.5) return smoothstep(0.0, 0.5, progress);
  if (progress < 0.85) return 1;
  return 1 - smoothstep(0.85, 1.0, progress);
}

/** Maximum X-axis tilt at the envelope's peak (radians for R3F,
 *  degrees for CSS). Keep them in lockstep. */
export const MAX_TILT_RAD = -0.38; // ~ -22 degrees
export const MAX_TILT_DEG = 22;

/**
 * One emerging ring — a wide low-opacity halo + a hairline edge
 * ring. The whole ring lives inside a group whose Y position and
 * scale are animated per frame.
 */
function Ring({
  outerR,
  innerR,
  color,
  fillRef,
  edgeRef,
}: {
  outerR: number;
  innerR: number;
  color: string;
  fillRef: React.RefObject<THREE.MeshBasicMaterial | null>;
  edgeRef: React.RefObject<THREE.MeshBasicMaterial | null>;
}) {
  const fillGeom = useMemo(() => new THREE.RingGeometry(innerR, outerR, 96), [innerR, outerR]);
  const edgeGeom = useMemo(
    () => new THREE.RingGeometry(outerR - EDGE_RING_WIDTH, outerR, 128),
    [outerR]
  );
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={fillGeom} renderOrder={1}>
        <meshBasicMaterial
          ref={fillRef}
          color={color}
          side={THREE.DoubleSide}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={edgeGeom} renderOrder={2}>
        <meshBasicMaterial
          ref={edgeRef}
          color={color}
          side={THREE.DoubleSide}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function StackScene() {
  const groupRef = useRef<THREE.Group>(null);
  const navigateRef = useRef<THREE.Group>(null);
  const buildRef = useRef<THREE.Group>(null);

  const navigateFillRef = useRef<THREE.MeshBasicMaterial>(null);
  const navigateEdgeRef = useRef<THREE.MeshBasicMaterial>(null);
  const buildFillRef = useRef<THREE.MeshBasicMaterial>(null);
  const buildEdgeRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((_, dt) => {
    const progress = useIlayerProgressStore.getState().progress;
    const env = tiltEnvelope(progress);

    // Whole-group X-tilt. Eased lerp toward target so wheel jitter
    // doesn't snap. Subtle Y-axis ambient drift keeps the highlights
    // breathing even at rest.
    const targetTiltX = MAX_TILT_RAD * env;
    const group = groupRef.current;
    if (group) {
      const k = 1 - Math.pow(0.001, dt);
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetTiltX, k);
      const t = performance.now() / 1000;
      group.rotation.y = Math.sin((t * Math.PI * 2) / 18) * 0.04;
    }

    // Rings emerge from the centre: scale 0 → 1 across [0.05..0.55],
    // slide Y from 0 to ±splitY across [0.10..0.55].
    const scaleT = smoothstep(0.05, 0.55, progress);
    const slideT = smoothstep(0.1, 0.55, progress);
    if (navigateRef.current) {
      navigateRef.current.scale.setScalar(scaleT);
      navigateRef.current.position.y = RING_GEOM.navigate.splitY * slideT;
    }
    if (buildRef.current) {
      buildRef.current.scale.setScalar(scaleT);
      buildRef.current.position.y = RING_GEOM.build.splitY * slideT;
    }

    // Opacity envelopes — ramp in over the first quarter; fade
    // slightly toward the end so the choreography handoff to rail
    // happens against a quiet artifact.
    const fadeIn = smoothstep(0, 0.25, progress);
    const fadeOut = 1 - smoothstep(0.85, 1.0, progress);
    const alphaMul = fadeIn * fadeOut;
    if (navigateFillRef.current)
      navigateFillRef.current.opacity = RING_TARGET_ALPHA.navigate.fill * alphaMul;
    if (navigateEdgeRef.current)
      navigateEdgeRef.current.opacity = RING_TARGET_ALPHA.navigate.edge * alphaMul;
    if (buildFillRef.current)
      buildFillRef.current.opacity = RING_TARGET_ALPHA.build.fill * alphaMul;
    if (buildEdgeRef.current)
      buildEdgeRef.current.opacity = RING_TARGET_ALPHA.build.edge * alphaMul;
  });

  return (
    <group ref={groupRef}>
      {/* Navigate ring (top) — emerges upward from the brandmark's
          centre. */}
      <group ref={navigateRef}>
        <Ring
          outerR={RING_GEOM.navigate.outerR}
          innerR={RING_GEOM.navigate.innerR}
          color={COLOURS.navigate}
          fillRef={navigateFillRef}
          edgeRef={navigateEdgeRef}
        />
      </group>

      {/* Build ring (bottom) — emerges downward from the brandmark's
          centre. */}
      <group ref={buildRef}>
        <Ring
          outerR={RING_GEOM.build.outerR}
          innerR={RING_GEOM.build.innerR}
          color={COLOURS.build}
          fillRef={buildFillRef}
          edgeRef={buildEdgeRef}
        />
      </group>
    </group>
  );
}

/**
 * IntelligenceLayerStack — the public component. Renders an R3F
 * `<Canvas>` with one orthographic camera and the two-ring scene.
 * Mounted by {@link IntelligenceLayerPortal} into the
 * `[data-ilayer-stack-root]` placeholder in the v7 prototype HTML.
 *
 * Camera zoom 130 places a 1.0-radius ring at ~130px on the
 * canvas's height, leaving headroom for the split travel and the
 * subtle perspective of the X-tilt without clipping at the edges.
 */
export function IntelligenceLayerStack() {
  return (
    <Canvas
      orthographic
      camera={{
        position: [0, 0, 10],
        near: -100,
        far: 100,
        zoom: 130,
      }}
      dpr={[1, 1.5]}
      gl={{
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
        powerPreference: "low-power",
        preserveDrawingBuffer: false,
      }}
      frameloop="always"
      style={{
        position: "absolute",
        inset: 0,
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      <StackScene />
    </Canvas>
  );
}
