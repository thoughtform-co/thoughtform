"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  CLUSTER_RING_OPACITIES,
  clamp01,
  lerp,
  orbitEmerge,
  splitEnvelope,
} from "../intelligenceLayerGeom";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

/**
 * SplitRing — the geometric bridge between the brandmark vector ring
 * and the three orbital clusters (ADR-014 v5).
 *
 * Renders THREE arcs that morph across the substrate scroll window:
 *
 *   - At `split = 0` (HANDOFF phase): all three arcs are stacked at
 *     the substrate centre, each spanning 120° so together they form
 *     a complete ring at the brandmark's outer-ring radius. Visually
 *     identical to the brandmark vector ring it just took over from
 *     (the vector actor faded out across the same window).
 *
 *   - At `split = 1` (end of SPLIT phase): each arc has translated to
 *     its target chamber centre AND expanded its angular span from
 *     120° to 360°, becoming a complete ring at the chamber position.
 *     Same radius throughout — the morph is pure position + angular
 *     span; no scale change. This is what hands off into each
 *     OrbitalCluster's outermost ring.
 *
 * The three arcs map to the three chambers:
 *
 *   - Arc 0 → left chamber  (home angle 210°, translates left)
 *   - Arc 1 → right chamber (home angle 330°, translates right)
 *   - Arc 2 → mid chamber   (home angle  90°, no translation; mid
 *                            stays at substrate centre)
 *
 * The three 120° home arcs tile to 360° with no overlap and no gap
 * (30°-150°, 150°-270°, 270°-30°), so the unified-ring read at
 * split = 0 is a clean full circle without visible seams.
 *
 * Two scalar inputs drive the per-frame state:
 *
 *   - `handoff` (0-1): overall opacity multiplier. Ramps 0 → 1 across
 *     the HANDOFF phase as the vector ring fades out, holds at 1
 *     through SPLIT, ramps 1 → 0 across the first part of RESOLVE so
 *     the cluster's outer ring (driven by `outerScalar` in
 *     `OrbitalCluster`) takes over without a visible discontinuity.
 *
 *   - `split` (0-1): geometric progress. Drives both the arc
 *     translation (substrate centre → target centres) and the angular
 *     span expansion (120° → 360°).
 *
 * The fade-out timing of `handoff` and the fade-in timing of the
 * cluster's outermost ring (via `outerScalar`) are tuned so the two
 * scalars are 0.5 at the same scroll point — a clean midpoint
 * crossfade between SplitRing and OrbitalCluster.
 */

/** Number of vertices per arc. Higher than the cluster's RING_SEGMENTS
 *  because each arc is a `Line` (not a `LineLoop`) — when the angular
 *  span is small (early in SPLIT), the same vertex count needs to
 *  cover less arc, so the curve stays smooth. */
const ARC_VERTICES = 128;

/** Initial angular span (degrees). Three arcs × 120° = 360° (a complete
 *  ring at the substrate centre with no overlap or gap). */
const ARC_INITIAL_SPAN_DEG = 120;

/** Final angular span (degrees). 360° = a complete ring at the
 *  chamber position. */
const ARC_FINAL_SPAN_DEG = 360;

export interface SplitRingProps {
  /** Substrate centre — the arcs start here at split = 0. */
  substrateCentre: readonly [number, number, number];
  /** Target chamber centres — the arcs translate here as split goes
   *  0 → 1. Indexed: [left, right, mid]. */
  targetCentres: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number],
  ];
  /** Home angles (degrees, 0 = right, ccw) per arc. Each arc's
   *  angular span is centred on its home angle and grows symmetrically
   *  outward. Indexed: [left, right, mid]. */
  arcHomeAnglesDeg: readonly [number, number, number];
  /** Outer-ring radius in scene units. Same as the cluster's
   *  outermost ring so the handoff is seamless. */
  radius: number;
}

interface ArcHandles {
  line: THREE.Line;
  material: THREE.LineBasicMaterial;
  geometry: THREE.BufferGeometry;
  positionAttr: THREE.BufferAttribute;
}

/** Build a single arc with `ARC_VERTICES` vertices. The vertex
 *  positions are placeholders (origin) — `updateArc()` rewrites them
 *  every frame from the per-arc home angle + current span + current
 *  position. */
function buildArc(opacity: number): ArcHandles {
  const positions = new Float32Array(ARC_VERTICES * 3);
  const geom = new THREE.BufferGeometry();
  const positionAttr = new THREE.BufferAttribute(positions, 3);
  positionAttr.setUsage(THREE.DynamicDrawUsage);
  geom.setAttribute("position", positionAttr);
  const mat = new THREE.LineBasicMaterial({
    color: "#caa554",
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const line = new THREE.Line(geom, mat);
  return { line, material: mat, geometry: geom, positionAttr };
}

/** Rewrite an arc's vertex positions for the current frame. Each
 *  vertex's polar angle = homeAngleDeg + (vertexFraction - 0.5) ×
 *  spanDeg, so the arc grows symmetrically around its home angle as
 *  span increases. Position offset is added per-arc so each arc sits
 *  at its current scene position. */
function updateArc(
  attr: THREE.BufferAttribute,
  centreX: number,
  centreY: number,
  centreZ: number,
  homeAngleDeg: number,
  spanDeg: number,
  radius: number
): void {
  const homeRad = (homeAngleDeg * Math.PI) / 180;
  const halfSpanRad = ((spanDeg / 2) * Math.PI) / 180;
  for (let i = 0; i < ARC_VERTICES; i++) {
    const t = i / (ARC_VERTICES - 1); // 0 .. 1
    const angle = homeRad + (t - 0.5) * 2 * halfSpanRad;
    attr.setXYZ(i, centreX + Math.cos(angle) * radius, centreY + Math.sin(angle) * radius, centreZ);
  }
  attr.needsUpdate = true;
}

export function SplitRing({
  substrateCentre,
  targetCentres,
  arcHomeAnglesDeg,
  radius,
}: SplitRingProps) {
  const groupRef = useRef<THREE.Group>(null);

  const arcs = useMemo<ArcHandles[]>(() => {
    // Opacity for each arc — same base across all three. The
    // material's runtime opacity is multiplied by the per-frame
    // handoff scalar so all three arcs fade together.
    return [
      buildArc(CLUSTER_RING_OPACITIES[0]),
      buildArc(CLUSTER_RING_OPACITIES[0]),
      buildArc(CLUSTER_RING_OPACITIES[0]),
    ];
  }, []);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    // Read the journey transform once per frame and decompose the
    // substrate progress into phase scalars. SplitRing is visible
    // only inside the substrate window — when ringsActive is false
    // we hide and bail.
    const transform = useBrandmarkJourneyStore.getState().transform;
    if (!transform.ringsActive) {
      if (group.visible) group.visible = false;
      return;
    }

    const sectionPresence = clamp01(orbitEmerge(transform.ringProgress));
    if (sectionPresence <= 0.001) {
      if (group.visible) group.visible = false;
      return;
    }

    const phases = splitEnvelope(transform.ringProgress);
    // SplitRing opacity = HANDOFF (fade in 0.2→0.4) × (1 - SPLIT
    // crossfade end) so it reaches full at end of HANDOFF and fades
    // out as SPLIT lands the arcs at chamber positions. Multiplied
    // by the section-scroll envelope so SplitRing also retracts
    // cleanly at section exit.
    const handoffOpacity = clamp01(phases.handoff) * (1 - clamp01(phases.split));
    const totalOpacity = handoffOpacity * sectionPresence;
    if (totalOpacity <= 0.001) {
      if (group.visible) group.visible = false;
      return;
    }
    if (!group.visible) group.visible = true;

    const splitClamped = clamp01(phases.split);
    const spanDeg = lerp(ARC_INITIAL_SPAN_DEG, ARC_FINAL_SPAN_DEG, splitClamped);

    for (let i = 0; i < arcs.length; i++) {
      const arc = arcs[i];
      // Position lerp: substrate centre → target chamber centre.
      const target = targetCentres[i];
      const cx = lerp(substrateCentre[0], target[0], splitClamped);
      const cy = lerp(substrateCentre[1], target[1], splitClamped);
      const cz = lerp(substrateCentre[2], target[2], splitClamped);
      updateArc(arc.positionAttr, cx, cy, cz, arcHomeAnglesDeg[i], spanDeg, radius);
      arc.material.opacity = CLUSTER_RING_OPACITIES[0] * totalOpacity;
    }
  });

  // Cleanup geometries + materials on unmount.
  useEffect(() => {
    return () => {
      for (const arc of arcs) {
        arc.geometry.dispose();
        arc.material.dispose();
      }
    };
  }, [arcs]);

  return (
    <group ref={groupRef}>
      {arcs.map((arc, i) => (
        <primitive key={`arc-${i}`} object={arc.line} />
      ))}
    </group>
  );
}
