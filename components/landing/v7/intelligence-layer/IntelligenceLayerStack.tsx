"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useIlayerProgressStore } from "./useIlayerProgress";

/**
 * IntelligenceLayerStack — the R3F scene that paints the layered
 * intelligence-layer artifact (ADR-012 v2).
 *
 * Three nested ring meshes (Navigate top / Encode middle / Build
 * bottom) plus a thin vertical thread connecting their centres. As
 * the section's scroll progress climbs from 0 to 1:
 *
 *   - the whole group rotates from a near-head-on coin (looks like
 *     one ring) to a tilted perspective view (~26 degrees on X)
 *   - the navigate disc lifts above and the build disc drops below
 *     the encode disc, exposing the three-layer stack
 *   - opacities fade in over the first quarter of progress
 *
 * Each disc is rendered as two concentric ring meshes: a wide,
 * low-opacity fill (the "halo") and a narrow, high-opacity edge
 * (the hairline). This gives the HUD-grammar "luminous ring"
 * read without needing a separate `<line>` primitive (whose JSX
 * intrinsic clashes with the SVG `<line>` element under TS).
 *
 * The brandmark substrate dock anchor (DOM, sibling of this
 * canvas) sits dead-centre over the encode disc. The encode ring's
 * inner radius is wide enough that the brandmark sits inside its
 * hole, not on top of it — the disc reads as a luminous halo
 * around the canonical SVG glyph.
 *
 * Compositing: this canvas mounts inside `.ilayer__inner` (a
 * positioned descendant of the opaque `.ilayer` shield), with
 * `pointer-events: none` so it never blocks scroll. ADR-008 holds.
 */

const RING_GEOM = {
  navigate: { outerR: 0.92, innerR: 0.5, splitY: 1.05 },
  encode: { outerR: 1.1, innerR: 0.62, splitY: 0 },
  build: { outerR: 0.92, innerR: 0.5, splitY: -1.05 },
} as const;

// Hairline edge ring widths (outer - inner). Small enough to read as
// a stroke rather than a band.
const EDGE_RING_WIDTH = 0.018;

// Per-disc base opacities. The fill alpha is multiplied by the
// scroll-progress fade-in envelope; the edge alpha gives the
// hairline halo its punch.
const DISC_TARGET_ALPHA = {
  navigate: { fill: 0.16, edge: 0.85 },
  encode: { fill: 0.28, edge: 1.0 },
  build: { fill: 0.16, edge: 0.7 },
} as const;
const THREAD_TARGET_ALPHA = 0.32;

// Thoughtform palette (matches `--gold`, `--dawn`, `--gold-warm` in
// landing tokens). Three.js wants linear-RGB; the default colour
// management converts sRGB hex to linear under the hood, so passing
// hex strings is fine.
const COLOURS = {
  gold: "#caa554",
  dawn: "#ece3d6",
  dawnDeep: "#a99e8a",
  thread: "#caa554",
} as const;

/** Smooth easing for opacity ramps. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * One layered disc — a wide low-opacity fill ring + a hairline
 * edge ring sitting on top. Materials are exposed via refs so the
 * top-level `useFrame` can animate their opacity without the
 * React-19 "modifying memoized value" warning.
 */
function Disc({
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
  const threadRef = useRef<THREE.Mesh>(null);

  const navigateFillRef = useRef<THREE.MeshBasicMaterial>(null);
  const navigateEdgeRef = useRef<THREE.MeshBasicMaterial>(null);
  const encodeFillRef = useRef<THREE.MeshBasicMaterial>(null);
  const encodeEdgeRef = useRef<THREE.MeshBasicMaterial>(null);
  const buildFillRef = useRef<THREE.MeshBasicMaterial>(null);
  const buildEdgeRef = useRef<THREE.MeshBasicMaterial>(null);
  const threadMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Per-frame: read scroll progress from the store (no React
  // re-render cost; this is a direct ref into the Zustand state) and
  // drive tilt + Y-split + opacity envelopes.
  useFrame((_, dt) => {
    const progress = useIlayerProgressStore.getState().progress;

    // Tilt the whole group on X. At rest (0): near head-on, the
    // discs collapse to thin lines. At full progress (1): ~26
    // degrees tilt so the three layers read as a stack with depth.
    // A small baseline tilt keeps the rings legible even before the
    // section enters view, hinting at the 3D shape.
    const tiltX = THREE.MathUtils.lerp(-0.08, -0.46, progress);
    const group = groupRef.current;
    if (group) {
      const cur = group.rotation.x;
      // Time-based eased lerp so wheel jitter doesn't snap.
      const k = 1 - Math.pow(0.001, dt);
      group.rotation.x = THREE.MathUtils.lerp(cur, tiltX, k);

      // Subtle Y-axis ambient drift so the highlights breathe even
      // at rest. ±0.05 rad over an 18-second cycle.
      const t = performance.now() / 1000;
      group.rotation.y = Math.sin((t * Math.PI * 2) / 18) * 0.05;
    }

    // Y-split: discs separate as progress climbs from 0.15 to 1.
    const splitT = smoothstep(0.15, 1.0, progress);
    if (navigateRef.current) {
      navigateRef.current.position.y = RING_GEOM.navigate.splitY * splitT;
    }
    if (buildRef.current) {
      buildRef.current.position.y = RING_GEOM.build.splitY * splitT;
    }

    // Thread: scale Y to match the current span of the stack so it
    // never pokes past the outermost discs.
    if (threadRef.current) {
      const span = Math.max(0.4, RING_GEOM.navigate.splitY * splitT * 2 + 0.4);
      threadRef.current.scale.y = span;
    }

    // Opacity envelopes — ramp in over the first 25% of progress so
    // the rings don't pop into view.
    const fadeIn = smoothstep(0, 0.25, progress);
    if (navigateFillRef.current)
      navigateFillRef.current.opacity = DISC_TARGET_ALPHA.navigate.fill * fadeIn;
    if (navigateEdgeRef.current)
      navigateEdgeRef.current.opacity = DISC_TARGET_ALPHA.navigate.edge * fadeIn;
    if (encodeFillRef.current)
      encodeFillRef.current.opacity = DISC_TARGET_ALPHA.encode.fill * fadeIn;
    if (encodeEdgeRef.current)
      encodeEdgeRef.current.opacity = DISC_TARGET_ALPHA.encode.edge * fadeIn;
    if (buildFillRef.current) buildFillRef.current.opacity = DISC_TARGET_ALPHA.build.fill * fadeIn;
    if (buildEdgeRef.current) buildEdgeRef.current.opacity = DISC_TARGET_ALPHA.build.edge * fadeIn;
    if (threadMatRef.current) threadMatRef.current.opacity = THREAD_TARGET_ALPHA * fadeIn;
  });

  return (
    <group ref={groupRef}>
      {/* Navigate disc (top) */}
      <group ref={navigateRef}>
        <Disc
          outerR={RING_GEOM.navigate.outerR}
          innerR={RING_GEOM.navigate.innerR}
          color={COLOURS.dawn}
          fillRef={navigateFillRef}
          edgeRef={navigateEdgeRef}
        />
      </group>

      {/* Encode disc (middle) — the substrate. Wider inner radius so
          the brandmark glyph (DOM, in front via z-index:3 on
          .ilayer__stack__dock) sits cleanly inside the hole. */}
      <group>
        <Disc
          outerR={RING_GEOM.encode.outerR}
          innerR={RING_GEOM.encode.innerR}
          color={COLOURS.gold}
          fillRef={encodeFillRef}
          edgeRef={encodeEdgeRef}
        />
      </group>

      {/* Build disc (bottom) */}
      <group ref={buildRef}>
        <Disc
          outerR={RING_GEOM.build.outerR}
          innerR={RING_GEOM.build.innerR}
          color={COLOURS.dawnDeep}
          fillRef={buildFillRef}
          edgeRef={buildEdgeRef}
        />
      </group>

      {/* Vertical thread connecting all three discs. Cylinder
          oriented along Y; scale.y is animated per frame to span
          the current stack height. */}
      <mesh ref={threadRef}>
        <cylinderGeometry args={[0.012, 0.012, 1, 8, 1, true]} />
        <meshBasicMaterial
          ref={threadMatRef}
          color={COLOURS.thread}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/**
 * IntelligenceLayerStack — the public component. Renders an R3F
 * `<Canvas>` with one orthographic camera and the StackScene group.
 * Mounted by {@link IntelligenceLayerPortal} into the
 * `[data-ilayer-stack-root]` placeholder in the v7 prototype HTML.
 *
 * The camera sits at zoom 130 — that places a 1.0-radius disc at
 * roughly 130px on a 380px canvas, leaving generous margin for the
 * Y-split travel without clipping.
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
