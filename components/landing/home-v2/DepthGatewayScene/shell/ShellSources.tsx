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
 * rings. Replaces the four flat coplanar ellipses of the retired
 * `DiagnosticOrbitGate` AND the single Saturn-style band of the
 * standalone `NestedShellSphere` sources.
 *
 * Emerges geometrically (group `scale` 0 -> 1 via `splitEmerge`) during
 * the Encode phase and PERSISTS through Build so the constellation
 * accumulates around the traveling mark and lands fully formed at the
 * Build station.
 *
 * Pip revolution uses each orbit's own period + direction + phase so
 * the field reads as multi-body rather than one coordinated sweep
 * (mirrors the per-orbit-pip pattern from the retired DiagnosticOrbitGate).
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
import { EMERGE_EPSILON, SHELL_ORBITS, type ShellOrbit, splitEmerge } from "./shellGeom";

interface ShellSourcesProps {
  /** Which accretion layer this component represents. Hard-coded to
   *  `"sources"` for `ShellSources` but kept explicit so callers can
   *  see the wiring at the shell composition site. */
  layerKey: "sources";
  /** When true, autonomous pip revolution is disabled (pips snap
   *  to their starting `phaseRad`). */
  reducedMotion?: boolean;
}

/** Compute a 3D point on an XY ellipse at the given parametric angle
 *  after applying the orbit's tilt. Mirrors the math `buildTiltedRingLineLoop`
 *  uses for its segments so the pip rides exactly on its orbit. */
function pipPositionOnOrbit(orbit: ShellOrbit, parametricRad: number): THREE.Vector3 {
  const lx = orbit.rx * Math.cos(parametricRad);
  const ly = orbit.rx * orbit.eccentricity * Math.sin(parametricRad);
  const euler = new THREE.Euler(orbit.tilt[0], orbit.tilt[1], orbit.tilt[2]);
  return new THREE.Vector3(lx, ly, 0).applyEuler(euler);
}

export function ShellSources({ layerKey, reducedMotion = false }: ShellSourcesProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
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
    group.scale.setScalar(splitEmerge(reveal));

    // Revolve each pip along its orbit. While reduced-motion is on,
    // pips snap to their starting phase so the field stays static
    // but still legible as a multi-body constellation.
    const t = reducedMotion ? 0 : clock.elapsedTime;
    for (let i = 0; i < SHELL_ORBITS.length; i++) {
      const orbit = SHELL_ORBITS[i];
      const ref = pipRefs.current[i];
      if (!ref) continue;
      const parametricRad = orbit.phaseRad + orbit.dir * (t / orbit.periodSec) * Math.PI * 2;
      const pos = pipPositionOnOrbit(orbit, parametricRad);
      ref.position.set(pos.x, pos.y, pos.z);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {SHELL_ORBITS.map((orbit, i) => (
        <lineLoop
          key={`orbit-${orbit.id}`}
          geometry={ringGeoms[i]}
          material={ringMats[i]}
          frustumCulled={false}
        />
      ))}
      {SHELL_ORBITS.map((orbit, i) => (
        <mesh
          key={`pip-${orbit.id}`}
          ref={(node) => {
            pipRefs.current[i] = node;
          }}
          geometry={pipGeoms[i]}
          material={pipMats[i]}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
