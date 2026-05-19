"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CelestialBody } from "./CelestialBody";
import { CometStream } from "./CometStream";
import { InterSphereTrajectories } from "./InterSphereTrajectories";
import { pipLocalPosition } from "./celestialRingUtils";
import {
  BODY_PIPS,
  BODY_POSITIONS,
  BODY_RING_RADIUS,
  BODY_RING_TILTS,
  BODY_SCALES,
  type BodyId,
  screenSpaceForBody,
  screenSpaceForPoint,
} from "./intelligenceLayerGeom";

/**
 * TriadScene — three celestial bodies, inter-sphere trajectories, comet (ADR-016).
 * Writes body + pip CSS vars on `#intelligence-layer` for HUD captions and labels.
 */
export function TriadScene() {
  const { camera, scene } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const worldPositions = useMemo(() => {
    const map = new Map<BodyId, THREE.Vector3>();
    (Object.keys(BODY_POSITIONS) as BodyId[]).forEach((id) => {
      const [x, y, z] = BODY_POSITIONS[id];
      map.set(id, new THREE.Vector3(x, y, z));
    });
    return map;
  }, []);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const pipScratch = useMemo(() => new THREE.Vector3(), []);
  const lastWrite = useRef<Record<string, string>>({});

  const pipLocals = useMemo(() => {
    const map = new Map<string, THREE.Vector3>();
    (Object.keys(BODY_PIPS) as BodyId[]).forEach((bodyId) => {
      const tilt = BODY_RING_TILTS[bodyId][0]!;
      BODY_PIPS[bodyId].forEach((pip, i) => {
        map.set(
          `${bodyId}-${i}`,
          pipLocalPosition(pip.angleDeg, pip.radiusMul, BODY_RING_RADIUS, tilt)
        );
      });
    });
    return map;
  }, []);

  const setVar = (section: HTMLElement, key: string, val: string) => {
    if (lastWrite.current[key] !== val) {
      section.style.setProperty(key, val);
      lastWrite.current[key] = val;
    }
  };

  useFrame(() => {
    const section = document.getElementById("intelligence-layer");
    if (!section) return;
    const canvas = section.querySelector<HTMLCanvasElement>(".ilayer__stack__canvas canvas");
    if (!canvas) return;

    scene.updateMatrixWorld();
    const parentMatrix = groupRef.current?.matrixWorld ?? null;

    (Object.keys(BODY_POSITIONS) as BodyId[]).forEach((id) => {
      scratch.copy(worldPositions.get(id)!);
      if (parentMatrix) scratch.applyMatrix4(parentMatrix);

      const projected = screenSpaceForBody(camera, canvas, scratch, BODY_SCALES[id]);
      if (!projected) return;

      setVar(section, `--ilayer-body-${id}-x`, `${projected.x.toFixed(2)}%`);
      setVar(section, `--ilayer-body-${id}-y`, `${projected.y.toFixed(2)}%`);
      setVar(section, `--ilayer-body-${id}-scale`, projected.scale.toFixed(3));
      setVar(
        section,
        `--ilayer-body-${id}-diameter`,
        `calc(var(--ilayer-ring-diameter) * ${projected.scale.toFixed(3)})`
      );

      const bodyLocal = worldPositions.get(id)!;
      BODY_PIPS[id].forEach((_, i) => {
        const local = pipLocals.get(`${id}-${i}`);
        if (!local) return;
        pipScratch.copy(local).multiplyScalar(BODY_SCALES[id]).add(bodyLocal);
        if (parentMatrix) pipScratch.applyMatrix4(parentMatrix);
        const pipProj = screenSpaceForPoint(camera, canvas, pipScratch);
        if (!pipProj) return;
        setVar(section, `--ilayer-pip-${id}-${i}-x`, `${pipProj.x.toFixed(2)}%`);
        setVar(section, `--ilayer-pip-${id}-${i}-y`, `${pipProj.y.toFixed(2)}%`);
      });
    });
  });

  return (
    <group ref={groupRef}>
      <InterSphereTrajectories />
      <CelestialBody
        id="sources"
        position={BODY_POSITIONS.sources}
        scale={BODY_SCALES.sources}
        atmosphereCount={340}
      />
      <CelestialBody
        id="substrate"
        position={BODY_POSITIONS.substrate}
        scale={BODY_SCALES.substrate}
        atmosphereCount={520}
      />
      <CelestialBody
        id="surfaces"
        position={BODY_POSITIONS.surfaces}
        scale={BODY_SCALES.surfaces}
        atmosphereCount={340}
      />
      <CometStream />
    </group>
  );
}
