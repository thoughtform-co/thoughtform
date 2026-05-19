"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  createAtmosphereMaterial,
  createSphereMaterial,
  SHARED_ICO_SPHERE,
} from "./celestialMaterials";
import {
  buildInflowArcGeometry,
  buildOutflowRailGeometry,
  buildTiltedRingLineLoop,
  pipLocalPosition,
} from "./celestialRingUtils";
import {
  BODY_PIPS,
  BODY_RING_RADIUS,
  BODY_RING_TILTS,
  SOURCES_INFLOW_START_MUL,
  type BodyId,
  orbitEmerge,
} from "./intelligenceLayerGeom";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

export type CelestialBodyId = BodyId;

export interface CelestialBodyProps {
  id: CelestialBodyId;
  position: readonly [number, number, number];
  scale: number;
  atmosphereCount: number;
  ringRadius?: number;
}

const DAWN_LINE = new THREE.Color("#ebe3d6");
const GOLD_LINE = new THREE.Color("#caa554");

function hairlineMaterial(color: THREE.Color, opacity: number) {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
}

export function CelestialBody({
  id,
  position,
  scale,
  atmosphereCount,
  ringRadius = BODY_RING_RADIUS,
}: CelestialBodyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const primaryTilt =
    BODY_RING_TILTS[id][0] ?? ([14 * (Math.PI / 180), 0, 6 * (Math.PI / 180)] as const);

  const ringGeoms = useMemo(() => {
    if (id === "substrate") {
      return [0.36, 0.52, 0.68, 1.0].map((f) =>
        buildTiltedRingLineLoop(ringRadius * f, primaryTilt)
      );
    }
    return [buildTiltedRingLineLoop(ringRadius, primaryTilt)];
  }, [id, ringRadius, primaryTilt]);

  const inflowGeoms = useMemo(() => {
    if (id !== "sources") return [] as THREE.BufferGeometry[];
    return BODY_PIPS.sources.map((pip) =>
      buildInflowArcGeometry(
        pip.angleDeg,
        ringRadius * SOURCES_INFLOW_START_MUL,
        ringRadius * pip.radiusMul,
        primaryTilt
      )
    );
  }, [id, ringRadius, primaryTilt]);

  const outflowGeoms = useMemo(() => {
    if (id !== "surfaces") return [] as THREE.BufferGeometry[];
    return BODY_PIPS.surfaces.map((pip) =>
      buildOutflowRailGeometry(pip.angleDeg, ringRadius, ringRadius * pip.radiusMul, primaryTilt)
    );
  }, [id, ringRadius, primaryTilt]);

  const diamondPositions = useMemo(() => {
    if (id !== "substrate") return [] as THREE.Vector3[];
    return BODY_PIPS.substrate.map((pip) =>
      pipLocalPosition(pip.angleDeg, pip.radiusMul, ringRadius, primaryTilt)
    );
  }, [id, ringRadius, primaryTilt]);

  const ringMats = useMemo(() => {
    const ringBase = id === "substrate" ? 0.5 : 0.4;
    return ringGeoms.map((_, i) => {
      const isOuter = id !== "substrate" || i === ringGeoms.length - 1;
      return hairlineMaterial(
        isOuter ? GOLD_LINE : DAWN_LINE,
        isOuter ? ringBase : ringBase * 0.65
      );
    });
  }, [id, ringGeoms]);

  const inflowMats = useMemo(
    () => inflowGeoms.map(() => hairlineMaterial(DAWN_LINE, 0.28)),
    [inflowGeoms.length]
  );
  const outflowMats = useMemo(
    () => outflowGeoms.map(() => hairlineMaterial(GOLD_LINE, 0.35)),
    [outflowGeoms.length]
  );

  const diamondMats = useMemo(
    () =>
      diamondPositions.map(
        () =>
          new THREE.MeshBasicMaterial({
            color: GOLD_LINE,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
          })
      ),
    [diamondPositions.length]
  );

  const sphereMat = useMemo(
    () => createSphereMaterial(id === "substrate" ? GOLD_LINE : DAWN_LINE),
    [id]
  );
  const atmosphereMat = useMemo(
    () =>
      createAtmosphereMaterial(
        id === "substrate" ? GOLD_LINE : DAWN_LINE,
        id === "substrate" ? 0.62 : 0.42
      ),
    [id]
  );

  const atmosphereGeom = useMemo(() => {
    const positions = new Float32Array(atmosphereCount * 3);
    const seeds = new Float32Array(atmosphereCount);
    const shells = new Float32Array(atmosphereCount);
    for (let i = 0; i < atmosphereCount; i++) {
      const seed = (i * 0.6180339887) % 1;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / atmosphereCount);
      const theta = Math.PI * 2 * seed;
      const r = ringRadius * 1.08 * (0.92 + seed * 0.14);
      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      positions[i * 3 + 2] = Math.cos(phi) * r;
      seeds[i] = seed;
      shells[i] = 0.35 + seed * 0.65;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geom.setAttribute("aShell", new THREE.BufferAttribute(shells, 1));
    return geom;
  }, [atmosphereCount, ringRadius]);

  const wireGeom = useMemo(() => new THREE.WireframeGeometry(SHARED_ICO_SPHERE), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const progress = useBrandmarkJourneyStore.getState().transform.ringProgress;
    const emerge = orbitEmerge(progress);
    const presence = 0.55 + emerge * 0.45;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.03 * (id === "substrate" ? 1 : 0.65);
    }

    sphereMat.uniforms.uTime.value = t;
    sphereMat.uniforms.uOpacity.value = presence * (id === "substrate" ? 0.95 : 0.78);
    atmosphereMat.uniforms.uTime.value = t;
    atmosphereMat.uniforms.uOpacity.value = presence * (id === "substrate" ? 0.82 : 0.58);
    atmosphereMat.uniforms.uPixelRatio.value = state.viewport.dpr;

    ringMats.forEach((mat, i) => {
      const stagger = i * 0.06;
      const fill = Math.min(1, 0.5 + progress * 0.9 - stagger);
      const base = id === "substrate" ? (i === ringMats.length - 1 ? 0.5 : 0.32) : 0.4;
      mat.opacity = presence * base * (0.65 + fill * 0.35);
    });
    inflowMats.forEach((mat) => {
      mat.opacity = presence * 0.28;
    });
    outflowMats.forEach((mat) => {
      mat.opacity = presence * 0.35;
    });
    diamondMats.forEach((mat) => {
      mat.opacity = presence * 0.85;
    });
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh geometry={SHARED_ICO_SPHERE} material={sphereMat} />
      <lineSegments geometry={wireGeom}>
        <lineBasicMaterial color="#e9d8a6" transparent opacity={0.14} depthWrite={false} />
      </lineSegments>
      {ringGeoms.map((geom, i) => (
        <lineLoop key={`ring-${i}`} geometry={geom} material={ringMats[i]} />
      ))}
      {inflowGeoms.map((geom, i) => (
        <line key={`inflow-${i}`} geometry={geom} material={inflowMats[i]} />
      ))}
      {outflowGeoms.map((geom, i) => (
        <line key={`outflow-${i}`} geometry={geom} material={outflowMats[i]} />
      ))}
      {diamondPositions.map((pos, i) => (
        <mesh key={`diamond-${i}`} position={pos} material={diamondMats[i]}>
          <octahedronGeometry args={[0.022, 0]} />
        </mesh>
      ))}
      <points geometry={atmosphereGeom} material={atmosphereMat} />
    </group>
  );
}
