"use client";

/**
 * ShellOrbits — Encode accretion layer. Four asymmetrical inclined
 * ellipses around the brandmark, each with a judgment pip. Rings use
 * a dual-pass stroke (core + glow) so they read thicker than hairlines.
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

interface ShellOrbitsProps {
  layerKey: "orbits";
  reducedMotion?: boolean;
}

const ORBITS_OVERLAP = 0.55;

/** Normal-blending core opacity multiplier (on top of baseAlpha). */
const CORE_STROKE_MUL = 0.72;
/** Additive glow pass multiplier — emphasis rings get a stronger halo. */
const GLOW_STROKE_MUL = 0.38;
const EMPHASIS_GLOW_MUL = 0.52;

function pipPositionOnOrbit(orbit: ShellOrbit, parametricRad: number): THREE.Vector3 {
  const lx = orbit.rx * Math.cos(parametricRad);
  const ly = orbit.rx * orbit.eccentricity * Math.sin(parametricRad);
  const euler = new THREE.Euler(orbit.tilt[0], orbit.tilt[1], orbit.tilt[2]);
  return new THREE.Vector3(lx, ly, 0).applyEuler(euler);
}

function orbitRingMaterials(orbit: ShellOrbit) {
  const glowMul = orbit.emphasis ? EMPHASIS_GLOW_MUL : GLOW_STROKE_MUL;
  return {
    core: makeLineMaterial(orbit.color, orbit.baseAlpha * CORE_STROKE_MUL, false),
    glow: makeLineMaterial(orbit.color, orbit.baseAlpha * glowMul, true),
  };
}

export function ShellOrbits({ layerKey, reducedMotion = false }: ShellOrbitsProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const orbitGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const pipRefs = useRef<(THREE.Mesh | null)[]>([]);

  const ringGeoms = useMemo(
    () => SHELL_ORBITS.map((o) => buildTiltedRingLineLoop(o.rx, o.tilt, 96, o.eccentricity)),
    []
  );

  const emphasisGeoms = useMemo(
    () =>
      SHELL_ORBITS.map((o) =>
        o.emphasis ? buildTiltedRingLineLoop(o.rx * 1.012, o.tilt, 96, o.eccentricity) : null
      ),
    []
  );

  const pipGeoms = useMemo(
    () => SHELL_ORBITS.map((o) => buildFilledDiamondGeometry(o.pipRadius)),
    []
  );

  const ringMats = useMemo(() => SHELL_ORBITS.map((o) => orbitRingMaterials(o)), []);
  const pipMats = useMemo(
    () => SHELL_ORBITS.map((o) => makeMeshMaterial(o.color, Math.min(1, o.baseAlpha + 0.22))),
    []
  );

  useEffect(() => {
    return () => {
      ringGeoms.forEach((g) => g.dispose());
      emphasisGeoms.forEach((g) => g?.dispose());
      pipGeoms.forEach((g) => g.dispose());
      ringMats.forEach(({ core, glow }) => {
        core.dispose();
        glow.dispose();
      });
      pipMats.forEach((m) => m.dispose());
    };
  }, [ringGeoms, emphasisGeoms, pipGeoms, ringMats, pipMats]);

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

    const t = reducedMotion ? 0 : clock.elapsedTime;

    for (let i = 0; i < SHELL_ORBITS.length; i++) {
      const orbit = SHELL_ORBITS[i];
      const orbitGroup = orbitGroupRefs.current[i];
      const pip = pipRefs.current[i];
      if (!orbitGroup) continue;

      const stagger = petalStagger(reveal, i, SHELL_ORBITS.length, ORBITS_OVERLAP);
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
          <lineLoop geometry={ringGeoms[i]} material={ringMats[i].glow} frustumCulled={false} />
          <lineLoop geometry={ringGeoms[i]} material={ringMats[i].core} frustumCulled={false} />
          {emphasisGeoms[i] && (
            <lineLoop
              geometry={emphasisGeoms[i]!}
              material={ringMats[i].core}
              frustumCulled={false}
            />
          )}
          <mesh
            ref={(node) => {
              pipRefs.current[i] = node;
            }}
            geometry={pipGeoms[i]}
            material={pipMats[i]}
            frustumCulled={false}
            renderOrder={2}
          />
        </group>
      ))}
    </group>
  );
}
