"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SIGIL_RING_MORPHS } from "@/lib/celestial/orbits";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { STATION_THOUGHTFORM } from "../sceneGeom";

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
 * Visibility envelope (gate self-managed):
 *
 *   - 0 before progress 0.00.
 *   - Ramps 0 -> 1 across [0.00, 0.04] (paint-in at parked rest).
 *   - Holds at 1 across [0.04, 0.20] (parked Thoughtform + start of
 *     passthrough-01).
 *   - Fades 1 -> 0 across [0.20, 0.34] (camera passes through).
 *   - 0 after 0.34.
 */

/** Ring radii in world units. Scaled from v7 SVG units by 1/150 so
 *  the largest ring at world r = 1.0 fits comfortably inside
 *  STATION_THOUGHTFORM.halfExtent (1.6) with margin for the diamond
 *  outline + phase node markers. */
const RING_RADII = SIGIL_RING_MORPHS.map((r) => r.ringRadius / 150);
const RING_SEGMENTS = 96;

/** Diamond outline ring radius — sits just outside the largest ring,
 *  matching the v7 `.sigil__diamond` overlay's read. */
const DIAMOND_R = 1.05;

/** Phase node positions relative to the compass centre, at 3 evenly
 *  spaced angles (top, lower-left, lower-right). Matches the
 *  `thoughtform.phase.{navigate,encode,build}` COPY_ANCHORS. */
const PHASE_NODES = [
  { id: "navigate", offset: [0, 0.95, 0.05] as [number, number, number] },
  { id: "encode", offset: [-0.82, -0.48, 0.05] as [number, number, number] },
  { id: "build", offset: [0.82, -0.48, 0.05] as [number, number, number] },
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

  // ── Per-frame visibility envelope ────────────────────────────
  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const { progress, active } = useDepthGatewayStore.getState().transform;
    if (!active) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Visibility envelope:
    //   0           -> 0.20 : full (1)  — already present when the
    //                                     user reaches Thoughtform
    //                                     (the depth-stage `active`
    //                                     flag gates everything off
    //                                     during the hero scroll, so
    //                                     we don't need a paint-in
    //                                     here).
    //   0.20        -> 0.34 : fade 1 -> 0 (camera passing through)
    //   0.34        -> ...  : 0
    let opacity = 0;
    if (progress <= 0.2) opacity = 1;
    else if (progress <= 0.34) opacity = 1 - (progress - 0.2) / 0.14;

    for (let i = 0; i < ringMats.length; i++) {
      const m = ringMats[i];
      const base = (m.userData as { baseAlpha: number }).baseAlpha;
      m.opacity = opacity * base;
    }
    diamondMat.opacity = opacity * 0.85;
    phaseNodeMat.opacity = opacity * 0.95;

    // Slow self-rotation around Z — the v7 compass has a subtle
    // breath animation (`@keyframes sigilBreath`); a hairline Z-spin
    // gives the same "alive" cue without the radius modulation
    // (which would conflict with the perspective scale as the camera
    // approaches).
    group.rotation.z = state.clock.elapsedTime * 0.012;
  });

  return (
    <group ref={groupRef} position={STATION_THOUGHTFORM.position} visible={false}>
      {ringGeoms.map((g, i) => (
        <lineLoop key={`ring-${i}`} geometry={g} material={ringMats[i]} />
      ))}
      <lineLoop geometry={diamondGeom} material={diamondMat} />
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
