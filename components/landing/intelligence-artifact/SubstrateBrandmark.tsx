"use client";

/**
 * SubstrateBrandmark — the shared 3D substrate core used by every
 * artifact variant.
 *
 * Two fixes vs. the first iteration:
 *
 *   1. **Canonical gold tint.** Uses `COLOR_GOLD = #caa554`
 *      (the same value used by `BrandmarkGlyph` and the gateway
 *      cloud, exported from `lib/stores/brandmarkJourneyStore.ts` as
 *      `DEFAULT_TINT`). Replaces the brighter `COLOR_GOLD_RIM` that
 *      blew out where additive points overlapped.
 *
 *   2. **Real 3D depth.** The brandmark cloud is no longer a flat
 *      camera-locked billboard. Each particle is placed in a shallow
 *      spherical cap (bulge toward camera) plus a tiny extrusion
 *      jitter so the mark has actual thickness. A second sparse rear
 *      layer adds parallax. The cloud rotates with the parent group
 *      so the artifact's slow auto-rotation reveals the depth — the
 *      mark visibly turns rather than staying glued to the screen.
 *
 * The component renders three R3F children:
 *
 *   - outer geodesic icosphere edges (substrate skin)
 *   - tighter inner geodesic edges (inner shell suggestion)
 *   - the brandmark particle cloud (front layer + back layer)
 *
 * Materials are sized for the substrate ratio and use additive
 * blending only where intersections are sparse enough to stay
 * un-blown-out. The brandmark cloud itself uses normal blending.
 *
 * The parent group passes `presence ∈ [0,1]` (driven by phase
 * envelopes) so each variant can fade the substrate in alongside
 * whatever other choreography is happening.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import { BRANDMARK_FULL_PATHS, BRANDMARK_SHAPE_KEYS } from "@/lib/brandmark/shapes";
import {
  BRANDMARK_HALF_EXTENT,
  BRANDMARK_PARTICLE_COUNT,
  COLOR_DAWN,
  COLOR_GOLD,
  COLOR_GOLD_RIM,
  SUBSTRATE_DETAIL,
  SUBSTRATE_INNER_DETAIL,
  SUBSTRATE_RADIUS,
} from "./artifactGeom";
import { buildGeodesicEdges, makeLineMaterial, makePointsMaterial } from "./artifactPrimitives";

// ── Shape contract ───────────────────────────────────────────────────

const BRANDMARK_VIEWBOX = { x: 0, y: 0, width: 430.99, height: 436 } as const;

/** Forward bulge applied to the brandmark cloud at r = 0 (centre). At
 *  the cloud's edge the depth drops to 0 so the mark reads as a
 *  shallow dome rather than a hemisphere — enough thickness to show
 *  rotation, not enough to obscure the silhouette. */
const BRANDMARK_BULGE = 0.18;

/** Per-particle thickness jitter (front-to-back). Adds real volumetric
 *  spread so the cloud has a "fog of points" feel rather than reading
 *  as a single shell. Seeded by `aSeed.x` for determinism. */
const BRANDMARK_THICKNESS = 0.06;

/** Rear ghost layer Z offset, dimmer + recessed. Gives the brandmark
 *  parallax when the artifact rotates. */
const BRANDMARK_REAR_Z = -0.12;

/** Rear-layer opacity multiplier (relative to the front layer). */
const BRANDMARK_REAR_OPACITY_MUL = 0.42;

/** Particle size in world units. Tighter than the first iteration
 *  (0.038) so dense overlap looks like a solid mark rather than a
 *  glow. The fragment falloff inside `PointsMaterial` already does
 *  the soft-edge work. */
const BRANDMARK_POINT_SIZE = 0.028;

// ── Build the cloud once ─────────────────────────────────────────────

interface BrandmarkCloudData {
  frontGeom: THREE.BufferGeometry;
  rearGeom: THREE.BufferGeometry;
  count: number;
}

function buildBrandmarkCloud(): BrandmarkCloudData {
  const sample = sampleShape({
    shapeKey: BRANDMARK_SHAPE_KEYS.full,
    paths: BRANDMARK_FULL_PATHS,
    viewBox: BRANDMARK_VIEWBOX,
    count: BRANDMARK_PARTICLE_COUNT,
  });

  const n = sample.count;
  const safeN = Math.max(1, n);
  const frontPos = new Float32Array(safeN * 3);
  const rearPos = new Float32Array(Math.max(1, Math.floor(safeN * 0.45)) * 3);
  const rearCount = Math.floor(safeN * 0.45);

  if (n > 0) {
    const half = BRANDMARK_HALF_EXTENT;
    for (let i = 0; i < n; i++) {
      // sampleShape returns home in [-0.5, 0.5] with (0,0) = viewBox
      // centre. Y is screen-down; flip so the brandmark reads upright.
      const nx = sample.home[i * 2];
      const ny = -sample.home[i * 2 + 1];
      const x = nx * half * 2;
      const y = ny * half * 2;

      // Radial parameter (0 at centre, ~1 at the cloud edge). The
      // bulge dome falls off with r²: full forward at centre, zero at
      // the edges.
      const r2 = nx * nx + ny * ny; // ∈ [0, 0.5]
      const rNorm = Math.min(1, r2 * 4); // remap so 0..0.25 → 0..1
      const dome = BRANDMARK_BULGE * (1 - rNorm);

      // Per-particle deterministic thickness jitter. seed.x is the
      // stable PRNG output from sampleShape (already in [0, 1000]);
      // wrap it into [-0.5, 0.5] via a simple modulo.
      const seedX = (sample.seed[i * 2] % 1) - 0.5;
      const thickness = seedX * BRANDMARK_THICKNESS;

      frontPos[i * 3] = x;
      frontPos[i * 3 + 1] = y;
      frontPos[i * 3 + 2] = dome + thickness;
    }

    for (let i = 0; i < rearCount; i++) {
      // Spread rear-layer samples across the front samples by stride.
      // We can reuse the same xy positions at a recessed Z so the
      // ghost lines up with the main mark.
      const src = (i * 2) % n;
      const nx = sample.home[src * 2];
      const ny = -sample.home[src * 2 + 1];
      const half = BRANDMARK_HALF_EXTENT;
      const x = nx * half * 2;
      const y = ny * half * 2;
      rearPos[i * 3] = x;
      rearPos[i * 3 + 1] = y;
      rearPos[i * 3 + 2] = BRANDMARK_REAR_Z;
    }
  }

  const front = new THREE.BufferGeometry();
  front.setAttribute("position", new THREE.BufferAttribute(frontPos, 3));
  const rear = new THREE.BufferGeometry();
  rear.setAttribute("position", new THREE.BufferAttribute(rearPos, 3));

  return { frontGeom: front, rearGeom: rear, count: n };
}

// ── Component ────────────────────────────────────────────────────────

interface SubstrateBrandmarkProps {
  /** Substrate phase presence [0, 1]. Multiplied into every material's
   *  opacity so the core fades in cleanly. */
  presence: number;
  /** Resolved-phase presence [0, 1]. Used to lift the rear ghost layer
   *  + outer sphere slightly so the depth reads strongest once the
   *  artifact has fully formed. */
  resolved?: number;
  /** Optional Y rotation applied per frame. When omitted the substrate
   *  spins gently on its own so the depth is always visible. */
  spinRate?: number;
  /** When true, all autonomous motion is disabled. */
  reducedMotion?: boolean;
  /** Radius override. Defaults to `SUBSTRATE_RADIUS`. */
  radius?: number;
  /** When true, render the inner geodesic shell. Defaults to true. */
  showInnerShell?: boolean;
}

export function SubstrateBrandmark({
  presence,
  resolved = 0,
  spinRate = 0.18,
  reducedMotion = false,
  radius = SUBSTRATE_RADIUS,
  showInnerShell = true,
}: SubstrateBrandmarkProps) {
  const groupRef = useRef<THREE.Group>(null);

  // ── Geometries ─────────────────────────────────────────────────
  const geoms = useMemo(() => {
    const outerEdges = buildGeodesicEdges(radius, SUBSTRATE_DETAIL);
    const innerEdges = buildGeodesicEdges(radius * 0.62, SUBSTRATE_INNER_DETAIL);
    const brandmark = buildBrandmarkCloud();
    return { outerEdges, innerEdges, brandmark };
  }, [radius]);

  // ── Materials ──────────────────────────────────────────────────
  const mats = useMemo(() => {
    return {
      outerEdge: makeLineMaterial(COLOR_GOLD, 0, true),
      innerEdge: makeLineMaterial(COLOR_DAWN, 0, false),
      brandFront: makePointsMaterial(COLOR_GOLD, 0, BRANDMARK_POINT_SIZE, false),
      brandRear: makePointsMaterial(COLOR_GOLD_RIM, 0, BRANDMARK_POINT_SIZE * 1.15, false),
    };
  }, []);

  // ── Dispose ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      geoms.outerEdges.dispose();
      geoms.innerEdges.dispose();
      geoms.brandmark.frontGeom.dispose();
      geoms.brandmark.rearGeom.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [geoms, mats]);

  // ── Per-frame: opacities + spin ────────────────────────────────
  useFrame(() => {
    mats.outerEdge.opacity = presence * 0.85;
    mats.innerEdge.opacity = presence * 0.4 * (showInnerShell ? 1 : 0);
    // Front layer: solid gold, no blow-out.
    mats.brandFront.opacity = presence * 0.92;
    // Rear ghost: dimmer + scaled with resolved so it intensifies
    // once the artifact has settled.
    mats.brandRear.opacity = presence * BRANDMARK_REAR_OPACITY_MUL * (0.4 + 0.6 * resolved);

    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y += spinRate * (1 / 60) * (0.6 + 0.4 * resolved);
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={geoms.outerEdges} material={mats.outerEdge} frustumCulled={false} />
      {showInnerShell && (
        <lineSegments geometry={geoms.innerEdges} material={mats.innerEdge} frustumCulled={false} />
      )}
      {geoms.brandmark.count > 0 && (
        <>
          <points
            geometry={geoms.brandmark.frontGeom}
            material={mats.brandFront}
            frustumCulled={false}
          />
          <points
            geometry={geoms.brandmark.rearGeom}
            material={mats.brandRear}
            frustumCulled={false}
          />
        </>
      )}
    </group>
  );
}
