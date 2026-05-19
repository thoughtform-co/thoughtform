"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CelestialBody } from "./CelestialBody";
import { CometStream } from "./CometStream";
import {
  BODY_POSITIONS,
  BODY_SCALES,
  type BodyId,
  screenSpaceForBody,
} from "./intelligenceLayerGeom";

/**
 * TriadScene — three celestial bodies + comet stream (ADR-016).
 * Writes per-body CSS variables for chamber overlay positioning.
 */
export function TriadScene() {
  const { camera } = useThree();
  const worldPositions = useMemo(() => {
    const map = new Map<BodyId, THREE.Vector3>();
    (Object.keys(BODY_POSITIONS) as BodyId[]).forEach((id) => {
      const [x, y, z] = BODY_POSITIONS[id];
      map.set(id, new THREE.Vector3(x, y, z));
    });
    return map;
  }, []);
  const lastWrite = useRef<Record<string, string>>({});

  useFrame(() => {
    const section = document.getElementById("intelligence-layer");
    if (!section) return;
    const canvas = section.querySelector<HTMLCanvasElement>(".ilayer__stack__canvas canvas");
    if (!canvas) return;

    (Object.keys(BODY_POSITIONS) as BodyId[]).forEach((id) => {
      const world = worldPositions.get(id)!;
      const scale = BODY_SCALES[id];
      const projected = screenSpaceForBody(camera, canvas, world, scale);
      const vars: Record<string, string> = {
        [`--ilayer-body-${id}-x`]: `${projected.x.toFixed(2)}%`,
        [`--ilayer-body-${id}-y`]: `${projected.y.toFixed(2)}%`,
        [`--ilayer-body-${id}-scale`]: projected.scale.toFixed(3),
      };
      Object.entries(vars).forEach(([key, val]) => {
        if (lastWrite.current[key] !== val) {
          section.style.setProperty(key, val);
          lastWrite.current[key] = val;
        }
      });
    });
  });

  return (
    <group>
      <CelestialBody
        id="sources"
        position={BODY_POSITIONS.sources}
        scale={BODY_SCALES.sources}
        ringCount={1}
        atmosphereCount={280}
      />
      <CelestialBody
        id="substrate"
        position={BODY_POSITIONS.substrate}
        scale={BODY_SCALES.substrate}
        ringCount={2}
        atmosphereCount={420}
      />
      <CelestialBody
        id="surfaces"
        position={BODY_POSITIONS.surfaces}
        scale={BODY_SCALES.surfaces}
        ringCount={1}
        atmosphereCount={280}
      />
      <CometStream />
    </group>
  );
}
