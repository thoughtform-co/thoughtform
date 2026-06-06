"use client";

/**
 * ShellSources — the inside-out layer 2 of the accreted intelligence
 * shell. A solar-system of six 3D-inclined elliptical orbits around
 * the guiding-star brandmark, each carrying its own revolving
 * source pip ("planet").
 *
 * Mix of round and very flat ellipses (eccentricity 0.4..0.95) and a
 * spread of XYZ tilts so the orbits visibly CROSS when seen face-on —
 * a real solar system of inclined planes, not a stack of coplanar
 * rings.
 *
 * FOLD-IN UNFOLD (2026-06-06 wrap-around revision): each orbit is
 * rendered inside its OWN sub-group (ring lineLoop + pip mesh
 * co-located) and DEPLOYS via `foldEmerge`: the sub-group appears at
 * an OVERSIZED scale (FOLD_OVERSHOOT ~ 1.45x the final radius, sitting
 * clearly outside the mark + cage) and CLOSES IN to scale 1.0 to its
 * final radius. Staggered with `petalStagger` so the six orbits don't
 * all close in lock-step — reads as a cascade of orbital planes
 * folding inward to wrap the mark, rather than orbits growing
 * through the mark from its centre. The pip mesh sits inside the
 * same sub-group so it travels with its orbit naturally — no extra
 * math.
 *
 * Pip revolution uses each orbit's own period + direction + phase so
 * the field reads as multi-body rather than one coordinated sweep.
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
import {
  EMERGE_EPSILON,
  foldEmerge,
  petalStagger,
  SHELL_ORBITS,
  type ShellOrbit,
} from "./shellGeom";

interface ShellSourcesProps {
  /** Which accretion layer this component represents. Hard-coded to
   *  `"sources"` for `ShellSources` but kept explicit so callers can
   *  see the wiring at the shell composition site. */
  layerKey: "sources";
  /** When true, autonomous pip revolution is disabled (pips snap
   *  to their starting `phaseRad`). */
  reducedMotion?: boolean;
}

/** Per-orbit stagger overlap inside the parent sources reveal window
 *  (see `petalStagger` in shellGeom.ts). 0.6 reads as a tight cascade
 *  through all 6 orbits — they unfold quickly enough to feel like one
 *  burst, but with visible per-orbit character. */
const SOURCES_ORBIT_OVERLAP = 0.6;

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

export function ShellSources({ layerKey, reducedMotion = false }: ShellSourcesProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const orbitGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const pipRefs = useRef<(THREE.Mesh | null)[]>([]);

  // ── Geometries ─────────────────────────────────────────────────
  const ringGeoms = useMemo(
    () => SHELL_ORBITS.map((o) => buildTiltedRingLineLoop(o.rx, o.tilt, 96, o.eccentricity)),
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

    const reveal = getBrandmarkAccretionLayers(paintProgress).sources;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Revolve each pip along its orbit. While reduced-motion is on,
    // pips snap to their starting phase so the field stays static
    // but still legible as a multi-body constellation.
    const t = reducedMotion ? 0 : clock.elapsedTime;

    // ── Per-orbit fold-in unfold ─────────────────────────────────
    // Each orbit's sub-group deploys via foldEmerge: appears at an
    // oversized scale (FOLD_OVERSHOOT) and closes in to scale 1.0.
    // Because the orbit ring + pip live inside the same sub-group,
    // scaling the parent scales the orbit's radius too — so at
    // scale 1.45 the orbit is at 1.45x its final radius (sitting
    // outside the mark + cage) and closes in to its final orbital
    // path. Reads as the planes folding inward to wrap the mark.
    for (let i = 0; i < SHELL_ORBITS.length; i++) {
      const orbit = SHELL_ORBITS[i];
      const orbitGroup = orbitGroupRefs.current[i];
      const pip = pipRefs.current[i];
      if (!orbitGroup) continue;

      const stagger = petalStagger(reveal, i, SHELL_ORBITS.length, SOURCES_ORBIT_OVERLAP);
      const { scale } = foldEmerge(stagger);
      if (scale <= EMERGE_EPSILON) {
        orbitGroup.visible = false;
        continue;
      }
      orbitGroup.visible = true;
      orbitGroup.scale.setScalar(scale);

      if (pip) {
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
          <lineLoop geometry={ringGeoms[i]} material={ringMats[i]} frustumCulled={false} />
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
