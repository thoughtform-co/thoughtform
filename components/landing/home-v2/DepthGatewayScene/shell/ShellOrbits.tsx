"use client";

/**
 * ShellOrbits — the inside-out layer 2 of the accreted intelligence
 * shell (Encode). A solar-system of six 3D-inclined elliptical orbits
 * around the guiding-star brandmark, each carrying its own revolving
 * judgment pip ("planet").
 *
 * Mix of round and very flat ellipses (eccentricity 0.55..0.95) and a
 * spread of XYZ tilts so the orbits visibly CROSS when seen face-on —
 * a real solar system of inclined planes, not a stack of coplanar
 * rings.
 *
 * TRIM-PATH UNFOLD (2026-06-07): each orbit sits at its FINAL size and
 * position — it never scales / flies toward the mark. Instead the ring
 * line DRAWS ITSELF along its path (After Effects "trim paths") by
 * growing the geometry's draw range from 0 → full as the orbit's
 * staggered reveal ramps. Staggered with `petalStagger` so the six
 * orbits draw on in a cascade as the camera enters Encode. Rendered as
 * open `THREE.Line` primitives (a `lineLoop` would chord-close a
 * partial trim); the ellipse geometry's last vertex coincides with the
 * first, so a full draw range closes the loop cleanly.
 *
 * Pip revolution uses each orbit's own period + direction + phase so
 * the field reads as multi-body rather than one coordinated sweep. Each
 * pip grows in place (scale 0 → 1) as its orbit draws on, then revolves.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  buildFilledDiamondGeometry,
  makeLineMaterial,
  makeMeshMaterial,
} from "@/components/landing/intelligence-artifact/artifactPrimitives";
import { buildTiltedRingLineLoop } from "@/components/landing/v7/intelligence-layer/celestialRingUtils";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers } from "../sceneGeom";
import { EMERGE_EPSILON, petalStagger, SHELL_ORBITS, type ShellOrbit } from "./shellGeom";

interface ShellOrbitsProps {
  layerKey: "orbits";
  /** When true, autonomous pip revolution is disabled (pips snap
   *  to their starting `phaseRad`). */
  reducedMotion?: boolean;
}

/** Ellipse tessellation. `getPoints(segments)` yields `segments + 1`
 *  vertices (last == first), so a full draw range closes the loop. */
const RING_SEGMENTS = 96;

/** Per-orbit stagger overlap inside the parent orbits reveal window
 *  (see `petalStagger` in shellGeom.ts). 0.5 reads as a clear sequential
 *  cascade through all 6 orbits as the camera enters Encode (matches the
 *  Navigate compass unfold overlap). */
const ORBITS_OVERLAP = 0.5;

/** Smootherstep — eases the trim draw so each path accelerates in and
 *  decelerates as it closes, rather than drawing at constant speed. */
function smoother(t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Compute a 3D point on an XY ellipse at the given parametric angle
 *  after applying the orbit's tilt. Mirrors the math
 *  `buildTiltedRingLineLoop` uses for its segments so the pip rides
 *  exactly on its orbit. */
function pipPositionOnOrbit(orbit: ShellOrbit, parametricRad: number): THREE.Vector3 {
  const lx = orbit.rx * Math.cos(parametricRad);
  const ly = orbit.rx * orbit.eccentricity * Math.sin(parametricRad);
  const euler = new THREE.Euler(orbit.tilt[0], orbit.tilt[1], orbit.tilt[2]);
  return new THREE.Vector3(lx, ly, 0).applyEuler(euler);
}

export function ShellOrbits({ layerKey, reducedMotion = false }: ShellOrbitsProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const orbitGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const pipRefs = useRef<(THREE.Mesh | null)[]>([]);

  // ── Geometries ─────────────────────────────────────────────────
  const ringGeoms = useMemo(
    () =>
      SHELL_ORBITS.map((o) => buildTiltedRingLineLoop(o.rx, o.tilt, RING_SEGMENTS, o.eccentricity)),
    []
  );

  const pipGeoms = useMemo(
    () => SHELL_ORBITS.map((o) => buildFilledDiamondGeometry(o.pipRadius)),
    []
  );

  // ── Materials ──────────────────────────────────────────────────
  // Rings use additive blending so the crossings read as luminous
  // intersections without blowing out the line cores.
  const ringMats = useMemo(
    () => SHELL_ORBITS.map((o) => makeLineMaterial(o.color, o.baseAlpha, true)),
    []
  );
  const pipMats = useMemo(
    () => SHELL_ORBITS.map((o) => makeMeshMaterial(o.color, Math.min(1, o.baseAlpha + 0.18))),
    []
  );

  // Open `THREE.Line` per orbit so a partial draw range reads as an
  // arc tracing the path (a `lineLoop` would close the partial draw
  // with a chord). The geometry is shared with the per-frame
  // `setDrawRange` trim below.
  const ringLines = useMemo(
    () =>
      ringGeoms.map((g, i) => {
        const line = new THREE.Line(g, ringMats[i]);
        line.frustumCulled = false;
        g.setDrawRange(0, 0);
        return line;
      }),
    [ringGeoms, ringMats]
  );

  // Vertex count per ring (segments + 1) for trim math.
  const ringVertCounts = useMemo(
    () => ringGeoms.map((g) => g.attributes.position.count),
    [ringGeoms]
  );

  useEffect(() => {
    return () => {
      ringGeoms.forEach((g) => g.dispose());
      pipGeoms.forEach((g) => g.dispose());
      ringMats.forEach((m) => m.dispose());
      pipMats.forEach((m) => m.dispose());
    };
  }, [ringGeoms, pipGeoms, ringMats, pipMats]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      group.visible = false;
      return;
    }

    const reveal = getBrandmarkAccretionLayers(paintProgress).orbits;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Revolve each pip along its orbit. While reduced-motion is on,
    // pips snap to their starting phase so the field stays static
    // but still legible as a multi-body constellation.
    const t = reducedMotion ? 0 : clock.elapsedTime;

    // ── Per-orbit trim-path draw ─────────────────────────────────
    // Each orbit holds its final size + position; only the DRAWN
    // fraction of its line grows (setDrawRange), so the ring traces
    // itself in place rather than scaling/flying toward the mark.
    for (let i = 0; i < SHELL_ORBITS.length; i++) {
      const orbit = SHELL_ORBITS[i];
      const orbitGroup = orbitGroupRefs.current[i];
      const pip = pipRefs.current[i];
      if (!orbitGroup) continue;

      const stagger = petalStagger(reveal, i, SHELL_ORBITS.length, ORBITS_OVERLAP);
      const drawn = smoother(stagger);

      const count = ringVertCounts[i];
      // Draw range needs >= 2 vertices to render a segment.
      const drawnVerts = Math.round(drawn * count);
      ringGeoms[i].setDrawRange(0, drawnVerts);

      if (drawnVerts < 2) {
        orbitGroup.visible = false;
        continue;
      }
      orbitGroup.visible = true;

      if (pip) {
        // Pip grows in place as the orbit draws on, then revolves.
        pip.scale.setScalar(Math.max(drawn, 1e-4));
        const parametricRad = orbit.phaseRad + orbit.dir * (t / orbit.periodSec) * Math.PI * 2;
        const pos = pipPositionOnOrbit(orbit, parametricRad);
        pip.position.set(pos.x, pos.y, pos.z);
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {SHELL_ORBITS.map((orbit, i) => (
        <group
          key={`orbit-${orbit.id}`}
          ref={(node) => {
            orbitGroupRefs.current[i] = node;
          }}
          visible={false}
        >
          <primitive object={ringLines[i]} />
          <mesh
            ref={(node) => {
              pipRefs.current[i] = node;
            }}
            geometry={pipGeoms[i]}
            material={pipMats[i]}
            frustumCulled={false}
          />
        </group>
      ))}
    </group>
  );
}
