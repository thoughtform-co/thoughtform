"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { createAtmosphereMaterial, createSphereCloudMaterial } from "./celestialMaterials";
import {
  buildInflowArcGeometry,
  buildOutflowRailGeometry,
  buildSphereCloudGeometry,
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
  /** Render the legacy Fibonacci-sphere `<points>` cloud as part of
   *  this body. Defaults to `true`. The substrate body sets this to
   *  `false` because its cloud is now painted by the morph-capable
   *  `<SubstrateMorphPoints>` mesh (ADR-017) — that mesh is the
   *  brandmark cloud at `substrateMorph = 0` and the sphere cloud
   *  at `substrateMorph = 1`, so a parallel sphere here would
   *  double-paint the same particles. Rings, diamonds, satellites,
   *  inflow/outflow, and the atmosphere shell are unaffected. */
  renderCloud?: boolean;
}

const DAWN_LINE = new THREE.Color("#ebe3d6");
const GOLD_LINE = new THREE.Color("#caa554");
const DAWN_RIM = new THREE.Color("#f3ecdb");
const GOLD_RIM = new THREE.Color("#e9c97a");

const BODY_CLOUD_COUNT: Record<BodyId, number> = {
  sources: 1100,
  substrate: 1900,
  surfaces: 1100,
};

const BODY_CLOUD_POINT_SIZE: Record<BodyId, number> = {
  sources: 3.6,
  substrate: 4.2,
  surfaces: 3.6,
};

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
  renderCloud = true,
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

  /** Satellite-pip 3D markers for Sources and Surfaces — small diamonds
   *  pinned at the END of each inflow arc / outflow rail so the DOM
   *  pip labels read as tags attached to a visible satellite rather
   *  than as floating text annotations. */
  const satellitePositions = useMemo(() => {
    if (id === "substrate") return [] as THREE.Vector3[];
    return BODY_PIPS[id].map((pip) =>
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

  const satelliteMats = useMemo(
    () =>
      satellitePositions.map(
        () =>
          new THREE.MeshBasicMaterial({
            color: id === "surfaces" ? GOLD_LINE : DAWN_LINE,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
          })
      ),
    [id, satellitePositions.length]
  );

  // R3F v9 / React 19 / @types/react 19: the lowercase `<line>` JSX
  // intrinsic clashes with SVG's `<line>` element type, and TS picks
  // the SVG variant — which doesn't accept `geometry` / `material`
  // props. Pre-build `THREE.Line` instances and mount them via
  // `<primitive object={...}>`, which has no namespace conflict.
  // `<lineLoop>` is unaffected because there is no SVG element by
  // that name.
  const inflowLines = useMemo(
    () => inflowGeoms.map((geom, i) => new THREE.Line(geom, inflowMats[i])),
    [inflowGeoms, inflowMats]
  );
  const outflowLines = useMemo(
    () => outflowGeoms.map((geom, i) => new THREE.Line(geom, outflowMats[i])),
    [outflowGeoms, outflowMats]
  );

  const cloudGeom = useMemo(() => buildSphereCloudGeometry(0.46, BODY_CLOUD_COUNT[id]), [id]);
  const cloudMat = useMemo(() => {
    const isSubstrate = id === "substrate";
    return createSphereCloudMaterial(
      isSubstrate ? GOLD_LINE : DAWN_LINE,
      isSubstrate ? GOLD_RIM : DAWN_RIM,
      isSubstrate ? 0.95 : 0.78,
      BODY_CLOUD_POINT_SIZE[id]
    );
  }, [id]);
  const atmosphereMat = useMemo(
    () =>
      createAtmosphereMaterial(
        id === "substrate" ? GOLD_LINE : DAWN_LINE,
        id === "substrate" ? 0.5 : 0.34
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
      const r = ringRadius * 1.14 * (0.94 + seed * 0.16);
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

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const progress = useBrandmarkJourneyStore.getState().transform.ringProgress;
    const emerge = orbitEmerge(progress);
    const presence = 0.55 + emerge * 0.45;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.03 * (id === "substrate" ? 1 : 0.65);
    }

    cloudMat.uniforms.uTime.value = t;
    cloudMat.uniforms.uPresence.value = presence;
    cloudMat.uniforms.uPixelRatio.value = state.viewport.dpr;
    atmosphereMat.uniforms.uTime.value = t;
    atmosphereMat.uniforms.uOpacity.value = presence * (id === "substrate" ? 0.7 : 0.5);
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
    satelliteMats.forEach((mat) => {
      mat.opacity = presence * 0.82;
    });
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {renderCloud && <points geometry={cloudGeom} material={cloudMat} />}
      {ringGeoms.map((geom, i) => (
        <lineLoop key={`ring-${i}`} geometry={geom} material={ringMats[i]} />
      ))}
      {inflowLines.map((line, i) => (
        <primitive key={`inflow-${i}`} object={line} />
      ))}
      {outflowLines.map((line, i) => (
        <primitive key={`outflow-${i}`} object={line} />
      ))}
      {diamondPositions.map((pos, i) => (
        <mesh key={`diamond-${i}`} position={pos} material={diamondMats[i]}>
          <octahedronGeometry args={[0.022, 0]} />
        </mesh>
      ))}
      {satellitePositions.map((pos, i) => (
        <mesh key={`satellite-${i}`} position={pos} material={satelliteMats[i]}>
          <octahedronGeometry args={[0.018, 0]} />
        </mesh>
      ))}
      <points geometry={atmosphereGeom} material={atmosphereMat} />
    </group>
  );
}
