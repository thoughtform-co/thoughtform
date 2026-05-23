"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SIGIL_RING_MORPHS } from "@/lib/celestial/orbits";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  STATION_THOUGHTFORM,
  getThoughtformCenterOffsetX,
  getThoughtformRingFlythrough,
} from "../sceneGeom";

/**
 * ThoughtformCompassGate — the v7 sigil compass rendered as a
 * world-rigid 3D group at `STATION_THOUGHTFORM` (ADR-018, world-owned
 * rebuild).
 *
 * Replaces the v7 DOM `.sigil__orbits` SVG end-to-end during the
 * corridor. The compass is a real 3D object: as the camera dollies
 * forward through passthrough-01, the rings grow + pass the viewport
 * edges before the Diagnostic gate emerges.
 *
 * Geometry (mirrors `SIGIL_RING_MORPHS` from `lib/celestial/orbits.ts`,
 * the canonical sigil ring radii):
 *
 *   - 4 concentric ring loops at world radii [1.00, 0.84, 0.69, 0.52]
 *     (= [150, 126, 104, 78] / 150).
 *   - Diamond outline ring (4-vertex line loop, axis-aligned) at
 *     world radius 1.05 — slightly outside the largest ring.
 *   - 3 phase node marker diamonds at NAVIGATE / ENCODE / BUILD
 *     positions (top, lower-left, lower-right). Co-located with the
 *     `thoughtform.phase.*` COPY_ANCHORS so the DOM phase labels
 *     ride the same world points.
 *
 * Visibility + motion envelope (gate self-managed):
 *
 *   - Lateral pan [0.05, 0.18]: group.position.x slides from
 *     STATION_THOUGHTFORM.position[0] (off-axis-right) to 0 via
 *     `getThoughtformCenterOffsetX`. Mirrors the offset applied to
 *     the brandmark and copy in sceneGeom.ts.
 *   - Ring flythrough [0.18, 0.335]: each ring (outer -> inner) gets
 *     its own staggered window via `getThoughtformRingFlythrough`,
 *     translating forward in world Z and fading in the final 30%
 *     of its window. The diamond rides ring 0. The four arches
 *     read as a tight sequence sweeping past the camera, not a
 *     single mass dimming at distance.
 *   - Phase node markers: parked at gate Z. Fade 1 -> 0 across
 *     [0.18, 0.234] so they vanish before the outer ring sweeps
 *     past them.
 */

/** Ring radii in world units. Scaled from v7 SVG units by 1/200 so
 *  the compass reads as the smaller, balanced two-column proportion
 *  from the v7 home page (largest ring at world r = 0.75). The
 *  earlier 1/150 scale rendered the diamond + outer rings too large
 *  to clear the left copy block; this 75% size leaves a clean gap. */
const RING_RADII = SIGIL_RING_MORPHS.map((r) => r.ringRadius / 200);
const RING_SEGMENTS = 96;

/** Diamond outline ring radius — sits just outside the largest ring,
 *  matching the v7 `.sigil__diamond` overlay's read. Scaled with the
 *  rings (was 1.05, now 0.79 ≈ 1.05 * 0.75). */
const DIAMOND_R = 0.79;

/** Phase node positions relative to the compass centre, at 3 evenly
 *  spaced angles (top, lower-left, lower-right). Matches the
 *  `thoughtform.phase.{navigate,encode,build}` COPY_ANCHORS. Scaled
 *  with the rings (0.75x of the previous radii: 0.95 -> 0.71,
 *  0.82 -> 0.62, 0.48 -> 0.36). */
const PHASE_NODES = [
  { id: "navigate", offset: [0, 0.71, 0.05] as [number, number, number] },
  { id: "encode", offset: [-0.62, -0.36, 0.05] as [number, number, number] },
  { id: "build", offset: [0.62, -0.36, 0.05] as [number, number, number] },
];

/** Phase node marker — a small 4-vertex diamond outline. */
const PHASE_NODE_R = 0.05;

/** Per-ring opacity weight (matches the v7 sigil's progressively
 *  fainter inner rings — outermost is fullest, innermost is faintest). */
const RING_ALPHA_WEIGHTS = [0.78, 0.62, 0.48, 0.36];

const GOLD = "#caa554";
const GOLD_VEC = new THREE.Color(GOLD);

function buildCircleGeometry(radius: number, segments: number): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

function buildDiamondGeometry(radius: number, z = 0.05): THREE.BufferGeometry {
  return new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, radius, z),
    new THREE.Vector3(radius, 0, z),
    new THREE.Vector3(0, -radius, z),
    new THREE.Vector3(-radius, 0, z),
    new THREE.Vector3(0, radius, z),
  ]);
}

export function ThoughtformCompassGate() {
  const groupRef = useRef<THREE.Group>(null);
  // Per-ring mesh refs so the flythrough can translate each ring's
  // Z independently (staggered windows + overshoot past the camera).
  const ringRefs = useRef<(THREE.LineLoop | null)[]>([]);
  const diamondRef = useRef<THREE.LineLoop | null>(null);

  // ── Geometries ────────────────────────────────────────────────
  const ringGeoms = useMemo(() => RING_RADII.map((r) => buildCircleGeometry(r, RING_SEGMENTS)), []);
  const diamondGeom = useMemo(() => buildDiamondGeometry(DIAMOND_R, 0.02), []);
  const phaseNodeGeom = useMemo(() => buildDiamondGeometry(PHASE_NODE_R, 0), []);

  // ── Materials ────────────────────────────────────────────────
  const ringMats = useMemo(
    () =>
      RING_ALPHA_WEIGHTS.map(
        (alpha) =>
          new THREE.LineBasicMaterial({
            color: GOLD_VEC.clone(),
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false,
            userData: { baseAlpha: alpha },
          })
      ),
    []
  );

  const diamondMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: GOLD_VEC.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  const phaseNodeMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: GOLD_VEC.clone(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  useEffect(() => {
    return () => {
      ringGeoms.forEach((g) => g.dispose());
      diamondGeom.dispose();
      phaseNodeGeom.dispose();
      ringMats.forEach((m) => m.dispose());
      diamondMat.dispose();
      phaseNodeMat.dispose();
    };
  }, [ringGeoms, diamondGeom, phaseNodeGeom, ringMats, diamondMat, phaseNodeMat]);

  // ── Per-frame motion + visibility ─────────────────────────────
  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const { progress, active } = useDepthGatewayStore.getState().transform;
    if (!active) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Staggered flythrough: each ring gets its own [start, end]
    // window in `FLYTHROUGH_WINDOWS`. Outer ring (index 0) flies
    // first, inner ring (index 3) last, ~2.5% of scroll apart. Each
    // ring translates +Z by FLYTHROUGH_Z_DISTANCE across its window
    // and fades 1 -> 0 in the final 30%, so the four arches sweep
    // past the camera in tight sequence rather than dimming at
    // distance. Before the window opens (progress <= start) the
    // ring sits at the gate at full opacity — the depth-stage's
    // `active` flag already gates the whole compass off during the
    // hero scroll, so we don't need a paint-in here.
    for (let i = 0; i < ringMats.length; i++) {
      const mat = ringMats[i];
      const ring = ringRefs.current[i];
      const { dz, opacityT } = getThoughtformRingFlythrough(progress, i);
      if (ring) ring.position.z = dz;
      const base = (mat.userData as { baseAlpha: number }).baseAlpha;
      mat.opacity = opacityT * base;
    }

    // Diamond rides ring 0 (it's the outer frame — visually paired
    // with the outermost ring, so they sweep past together).
    const ring0 = getThoughtformRingFlythrough(progress, 0);
    const diamond = diamondRef.current;
    if (diamond) diamond.position.z = ring0.dz;
    diamondMat.opacity = ring0.opacityT * 0.85;

    // Phase node markers stay parked at gate Z — they don't ride
    // the flythrough (their DOM label siblings are parked-only).
    // Fade 1 -> 0 across [0.18, 0.234] so they vanish before the
    // outer ring sweeps past them; outside that window they're
    // either full (progress <= 0.18) or hidden (progress >= 0.234).
    let phaseOpacity = 0;
    if (progress <= 0.18) phaseOpacity = 1;
    else if (progress <= 0.234) phaseOpacity = 1 - (progress - 0.18) / 0.054;
    phaseNodeMat.opacity = phaseOpacity * 0.95;

    // Cinematic centering pan: slide the whole group laterally
    // toward dead-centre during [0.05, 0.18]. Mirrors the same
    // offset applied to the brandmark, copy, and DOM phase labels
    // in sceneGeom.ts. Note: ring Z translation is APPLIED LOCALLY
    // on each mesh, so it composes with this group-level X without
    // interference.
    group.position.x = STATION_THOUGHTFORM.position[0] + getThoughtformCenterOffsetX(progress);

    // Hairline Z-spin (the v7 compass has a subtle "breath" cue).
    group.rotation.z = state.clock.elapsedTime * 0.012;
  });

  return (
    <group ref={groupRef} position={STATION_THOUGHTFORM.position} visible={false}>
      {ringGeoms.map((g, i) => (
        <lineLoop
          key={`ring-${i}`}
          ref={(el) => {
            ringRefs.current[i] = el;
          }}
          geometry={g}
          material={ringMats[i]}
        />
      ))}
      <lineLoop ref={diamondRef} geometry={diamondGeom} material={diamondMat} />
      {PHASE_NODES.map((node) => (
        <lineLoop
          key={`phase-${node.id}`}
          geometry={phaseNodeGeom}
          material={phaseNodeMat}
          position={node.offset}
        />
      ))}
    </group>
  );
}
