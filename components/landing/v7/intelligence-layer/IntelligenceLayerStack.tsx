"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  BRAND_MORPH,
  CAMERA_PARAMS,
  DISC_GEOM,
  type DiscGeom,
  type DiscKind,
  smoothstep,
  tiltEnvelope,
  useIlayerGeomStore,
} from "./intelligenceLayerGeom";
import { useIlayerProgressStore } from "./useIlayerProgress";

/**
 * IntelligenceLayerStack — the R3F scene that paints the
 * intelligence-layer "podium" artifact (ADR-012 v4).
 *
 * Sleep-well-creatives.com section-05 pattern: three real 3D discs
 * (short cylinders with visible rim thickness) stacked at the bottom
 * of the viewport, read from a slightly elevated perspective camera.
 * The brandmark morphs INTO the middle (encode) disc — the SVG mark
 * descends + scales + fades while the encode disc fades in at the
 * same screen rect.
 *
 *   build    (bottom, widest, ~full viewport width) ── outerR 1.00
 *   encode   (middle, brandmark target)             ── outerR 0.62
 *   navigate (top, narrowest)                       ── outerR 0.36
 *
 * Animation arc, driven by the section's scroll progress (0..1):
 *
 *   progress 0.00            head-on framing, all discs collapsed
 *                            (scale.y 0, opacity 0). Camera pitch 0.
 *   progress 0.10 → 0.55     camera pitches from head-on to ~15deg
 *                            elevation. Discs deploy sequentially:
 *                            build [0.18..0.42], encode [0.30..0.55],
 *                            navigate [0.42..0.65]. Encode's reveal
 *                            is synced with the brandmark's fade-out
 *                            so the SVG mark "becomes" the encode
 *                            disc at the same screen rect.
 *   progress 0.55 → 0.85     hold at full deployment + full pitch.
 *   progress 0.85 → 1.00     pitch eases back ~3deg toward neutral
 *                            so the substrate → rail handoff reads
 *                            against an axis-aligned encode disc.
 *
 * Per frame the encode disc's screen-projected rect (top-face centre
 * + radius) is written into `useIlayerGeomStore` so the progress
 * hook can land the brandmark anchor exactly on top of it,
 * regardless of viewport size or camera pitch.
 */

/** Sequential reveal — each disc opens across its own
 *  `DISC_GEOM[kind].reveal` window. */
function discReveal(progress: number, geom: DiscGeom): number {
  return smoothstep(geom.reveal.in, geom.reveal.out, progress);
}

/**
 * Disc — one short vertical-axis cylinder. Geometry is created once
 * via `useMemo`; `useFrame` walks the group + material refs to drive
 * the deploy + opacity envelopes.
 */
function Disc({
  geom,
  groupRef,
  materialRef,
  edgeMaterialRef,
}: {
  geom: DiscGeom;
  groupRef: React.RefObject<THREE.Group | null>;
  materialRef: React.RefObject<THREE.MeshStandardMaterial | null>;
  edgeMaterialRef: React.RefObject<THREE.MeshBasicMaterial | null>;
}) {
  const cylinder = useMemo(
    () => new THREE.CylinderGeometry(geom.outerR, geom.outerR, geom.height, 96),
    [geom.outerR, geom.height]
  );
  // A subtle hairline ring drawn on the top face of the cylinder so
  // the disc rim catches the eye even when the standard material's
  // specular highlight goes flat. Sits 0.001 above the top face to
  // avoid z-fighting.
  const topRing = useMemo(
    () => new THREE.RingGeometry(geom.outerR * 0.985, geom.outerR, 96),
    [geom.outerR]
  );
  // Optional inner hole on the top face (encode + navigate). Painted
  // with the void colour so it reads as a true hole punched through
  // the disc, not a darker disc on top.
  const holeGeom = useMemo(() => {
    if (geom.holeRatio <= 0) return null;
    return new THREE.CircleGeometry(geom.outerR * geom.holeRatio, 64);
  }, [geom.outerR, geom.holeRatio]);

  return (
    <group ref={groupRef} position={[0, geom.y, 0]}>
      <mesh geometry={cylinder} renderOrder={1}>
        <meshStandardMaterial
          ref={materialRef}
          color={geom.color}
          metalness={geom.metalness}
          roughness={geom.roughness}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      <mesh
        geometry={topRing}
        position={[0, geom.height / 2 + 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={2}
      >
        <meshBasicMaterial
          ref={edgeMaterialRef}
          color={geom.color}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {holeGeom && (
        <mesh
          geometry={holeGeom}
          position={[0, geom.height / 2 + 0.002, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={3}
        >
          <meshBasicMaterial
            color="#050403" // --void
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * EncodeRectReporter — projects the encode disc's screen rect into
 * `useIlayerGeomStore` each frame so the CSS brandmark anchor can
 * land on it regardless of viewport size or podium pitch.
 *
 * Lives inside the podium group so the encode disc's world matrix
 * is correctly composed with the parent's rotation. Re-projects
 * every frame (cheap — two Vector3.project calls), throttled to
 * ~30Hz so the brandmark anchor's CSS transform doesn't churn the
 * compositor.
 */
function EncodeRectReporter({
  encodeGroupRef,
}: {
  encodeGroupRef: React.RefObject<THREE.Group | null>;
}) {
  const { camera, size } = useThree();
  const setEncodeRect = useIlayerGeomStore((s) => s.setEncodeRect);
  const lastWriteRef = useRef(0);
  // Pre-allocated working vectors; we don't want to thrash the GC
  // on every frame.
  const centreLocal = useMemo(() => new THREE.Vector3(), []);
  const edgeLocal = useMemo(() => new THREE.Vector3(), []);
  const projected = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const now = performance.now();
    if (now - lastWriteRef.current < 33) return;
    const encodeGroup = encodeGroupRef.current;
    if (!encodeGroup) return;
    lastWriteRef.current = now;

    // Centre point of the encode disc's *top face*, in the disc
    // group's local space. The disc group sits at
    // `(0, geom.y * scale, 0)` and the top face is at +height/2 above
    // its origin. We sample the unscaled top-face centre because the
    // CSS anchor's y-translation is pre-scale.
    const geom = DISC_GEOM.encode;
    centreLocal.set(0, geom.height / 2, 0);
    edgeLocal.set(geom.outerR, geom.height / 2, 0);

    // Local → world via the encode group's matrix (which already
    // composes the podium's pitch rotation).
    encodeGroup.localToWorld(centreLocal);
    encodeGroup.localToWorld(edgeLocal);

    // World → NDC → CSS pixels (relative to canvas). The progress
    // hook adds the canvas's client offset so the anchor lands on
    // the right viewport coordinates.
    projected.copy(centreLocal).project(camera);
    const cx = (projected.x * 0.5 + 0.5) * size.width;
    const cy = (1 - (projected.y * 0.5 + 0.5)) * size.height;
    projected.copy(edgeLocal).project(camera);
    const edgeX = (projected.x * 0.5 + 0.5) * size.width;
    const radiusPx = Math.max(8, Math.abs(edgeX - cx));
    const diameter = radiusPx * 2;

    setEncodeRect({
      x: cx - radiusPx,
      y: cy - radiusPx,
      width: diameter,
      height: diameter,
    });
  });
  return null;
}

function StackScene() {
  const buildGroupRef = useRef<THREE.Group>(null);
  const encodeGroupRef = useRef<THREE.Group>(null);
  const navigateGroupRef = useRef<THREE.Group>(null);

  const buildMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const encodeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const navigateMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const buildEdgeRef = useRef<THREE.MeshBasicMaterial>(null);
  const encodeEdgeRef = useRef<THREE.MeshBasicMaterial>(null);
  const navigateEdgeRef = useRef<THREE.MeshBasicMaterial>(null);

  // The podium group wraps all three discs so we can pitch the
  // whole stack on X as one unit. Rotating the podium produces the
  // same visual result as pitching the camera (and is much simpler
  // to wire — the camera is set on <Canvas>, not as a scene node).
  const podiumGroupRef = useRef<THREE.Group>(null);

  const groups: Record<DiscKind, React.RefObject<THREE.Group | null>> = {
    build: buildGroupRef,
    encode: encodeGroupRef,
    navigate: navigateGroupRef,
  };
  const materials: Record<DiscKind, React.RefObject<THREE.MeshStandardMaterial | null>> = {
    build: buildMatRef,
    encode: encodeMatRef,
    navigate: navigateMatRef,
  };
  const edgeMaterials: Record<DiscKind, React.RefObject<THREE.MeshBasicMaterial | null>> = {
    build: buildEdgeRef,
    encode: encodeEdgeRef,
    navigate: navigateEdgeRef,
  };

  useFrame((_, dt) => {
    const progress = useIlayerProgressStore.getState().progress;

    // Per-disc deploy + opacity envelopes. Discs collapse vertically
    // (`scale.y 0 → 1`) and fade in across their own reveal window;
    // X / Z stay at 1 so the cylinders never shrink horizontally.
    (Object.keys(DISC_GEOM) as DiscKind[]).forEach((kind) => {
      const geom = DISC_GEOM[kind];
      const t = discReveal(progress, geom);
      const group = groups[kind].current;
      if (group) {
        group.scale.set(1, Math.max(0.001, t), 1);
        group.position.y = geom.y * (0.5 + 0.5 * t);
      }
      const mat = materials[kind].current;
      if (mat) mat.opacity = geom.targetOpacity * t;
      const edge = edgeMaterials[kind].current;
      if (edge) edge.opacity = 0.85 * t;
    });

    // Podium pitch — same envelope shape as the brandmark's
    // `--ilayer-tilt-deg` so the SVG morph and the 3D scene read
    // the same arc. We rotate the podium group on X (positive X
    // tips the discs' top faces FORWARD toward the camera, exposing
    // them — visually identical to pitching the camera DOWN).
    // Eased lerp toward target so wheel jitter doesn't snap.
    const env = tiltEnvelope(progress);
    const targetPitchRad = ((BRAND_MORPH.maxTiltDeg * Math.PI) / 180) * env;
    const podium = podiumGroupRef.current;
    if (podium) {
      const k = 1 - Math.pow(0.001, dt);
      podium.rotation.x = THREE.MathUtils.lerp(podium.rotation.x, targetPitchRad, k);
    }
  });

  return (
    <>
      {/* Lighting — required for MeshStandardMaterial. Warm key from
          upper-right, cool navy fill from lower-left, dawn ambient
          for overall lift. No shadows (cost; not visually needed
          for three small discs). */}
      <ambientLight intensity={0.55} color="#ece3d6" />
      <directionalLight position={[2, 4, 3]} intensity={1.1} color="#fff5e0" castShadow={false} />
      <directionalLight
        position={[-3, 2, -2]}
        intensity={0.35}
        color="#5c6a8a"
        castShadow={false}
      />

      {/* Podium group — wraps all three discs + the rect reporter.
          Pitched per-frame to emulate the camera looking down on
          the stack as scroll progresses. Pivot is at world origin
          (bottom disc's centre). */}
      <group ref={podiumGroupRef}>
        {/* Bottom disc — Build. Widest, anchors the floor of the
            podium, full viewport width once camera-set. */}
        <Disc
          geom={DISC_GEOM.build}
          groupRef={buildGroupRef}
          materialRef={buildMatRef}
          edgeMaterialRef={buildEdgeRef}
        />
        {/* Middle disc — Encode. The brandmark morph target. */}
        <Disc
          geom={DISC_GEOM.encode}
          groupRef={encodeGroupRef}
          materialRef={encodeMatRef}
          edgeMaterialRef={encodeEdgeRef}
        />
        {/* Top disc — Navigate. Narrowest, hint of a "target" with
            a centre hole punched through. */}
        <Disc
          geom={DISC_GEOM.navigate}
          groupRef={navigateGroupRef}
          materialRef={navigateMatRef}
          edgeMaterialRef={navigateEdgeRef}
        />

        {/* Encode rect reporter — projects the encode disc's screen
            rect into useIlayerGeomStore each frame. Lives inside
            the podium so its localToWorld picks up the parent's
            pitch rotation. */}
        <EncodeRectReporter encodeGroupRef={encodeGroupRef} />
      </group>
    </>
  );
}

/**
 * IntelligenceLayerStack — the public component. Renders an R3F
 * `<Canvas>` with a perspective camera at slight elevation and the
 * three-cylinder podium scene. Mounted by
 * {@link IntelligenceLayerPortal} into the
 * `[data-ilayer-stack-root]` placeholder in the v7 prototype HTML.
 */
export function IntelligenceLayerStack() {
  return (
    <Canvas
      camera={{
        fov: CAMERA_PARAMS.fov,
        position: CAMERA_PARAMS.position,
        near: CAMERA_PARAMS.near,
        far: CAMERA_PARAMS.far,
      }}
      onCreated={({ camera }) => {
        camera.lookAt(...CAMERA_PARAMS.lookAt);
      }}
      dpr={[1, 1.75]}
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
