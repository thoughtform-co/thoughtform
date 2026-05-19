"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import {
  BODY_TINTS,
  createAtmosphereMaterial,
  createRingDashMaterial,
  createSphereMaterial,
  SHARED_ICO_SPHERE,
} from "./celestialMaterials";
import { BODY_RING_TILTS, RING_SEGMENTS, orbitEmerge } from "./intelligenceLayerGeom";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

export type CelestialBodyId = "sources" | "substrate" | "surfaces";

export interface CelestialBodyProps {
  id: CelestialBodyId;
  position: readonly [number, number, number];
  scale: number;
  ringCount: number;
  atmosphereCount: number;
  /** Primary ring radius in local space (before group scale). */
  ringRadius?: number;
}

function buildTiltedRingGeometry(
  radius: number,
  tilt: readonly [number, number, number],
  segments = RING_SEGMENTS
): THREE.BufferGeometry {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.92, 0, Math.PI * 2, false, 0);
  const pts2d = curve.getPoints(segments);
  const euler = new THREE.Euler(tilt[0], tilt[1], tilt[2]);
  const pathPoints = pts2d.map((p) => new THREE.Vector3(p.x, p.y, 0).applyEuler(euler));
  const path = new THREE.CatmullRomCurve3(pathPoints, true);
  const tubular = segments;
  const radial = 6;
  const tube = new THREE.TubeGeometry(path, tubular, 0.013, radial, true);
  const count = tube.attributes.position.count;
  const along = new Float32Array(count);
  const vertsPerRing = radial + 1;
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    for (let j = 0; j <= radial; j++) {
      const idx = i * vertsPerRing + j;
      if (idx < count) along[idx] = t;
    }
  }
  tube.setAttribute("aAlong", new THREE.BufferAttribute(along, 1));
  return tube;
}

function buildAtmosphereGeometry(count: number, shellRadius: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const shells = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const seed = (i * 0.6180339887) % 1;
    const phi = Math.acos(1 - 2 * ((i + 0.5) / count));
    const theta = Math.PI * 2 * seed;
    const r = shellRadius * (0.92 + seed * 0.14);
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
}

export function CelestialBody({
  id,
  position,
  scale,
  ringCount,
  atmosphereCount,
  ringRadius = 0.52,
}: CelestialBodyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pipRef = useRef<THREE.Mesh>(null);
  const sphereMat = useMemo(() => createSphereMaterial(BODY_TINTS[id].sphere), [id]);
  const ringMats = useMemo(
    () =>
      Array.from({ length: ringCount }, (_, i) =>
        createRingDashMaterial(BODY_TINTS[id].ring, 0.45 + (ringCount - i) * 0.12)
      ),
    [id, ringCount]
  );
  const atmosphereMat = useMemo(
    () => createAtmosphereMaterial(BODY_TINTS[id].atmosphere, id === "substrate" ? 0.62 : 0.42),
    [id]
  );

  const ringGeoms = useMemo(() => {
    const tilts = BODY_RING_TILTS[id];
    return Array.from({ length: ringCount }, (_, i) => {
      const r = ringRadius * (1 - i * 0.14);
      const tilt = tilts[Math.min(i, tilts.length - 1)];
      return buildTiltedRingGeometry(r, tilt);
    });
  }, [id, ringCount, ringRadius]);

  const atmosphereGeom = useMemo(
    () => buildAtmosphereGeometry(atmosphereCount, ringRadius * 1.05),
    [atmosphereCount, ringRadius]
  );

  const wireGeom = useMemo(() => new THREE.WireframeGeometry(SHARED_ICO_SPHERE), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const progress = useBrandmarkJourneyStore.getState().transform.ringProgress;
    const emerge = orbitEmerge(progress);
    const ringFill = Math.min(1, progress * 1.15);

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.04 * (id === "substrate" ? 1 : 0.7);
      groupRef.current.visible = emerge > 0.01;
    }

    sphereMat.uniforms.uTime.value = t;
    sphereMat.uniforms.uOpacity.value = 0.55 * emerge + (id === "substrate" ? 0.2 : 0.12);
    atmosphereMat.uniforms.uTime.value = t;
    atmosphereMat.uniforms.uOpacity.value = emerge * (id === "substrate" ? 0.65 : 0.45);
    atmosphereMat.uniforms.uPixelRatio.value = state.viewport.dpr;

    ringMats.forEach((mat, i) => {
      const stagger = i * 0.08;
      mat.uniforms.uProgress.value = Math.max(0, Math.min(1, ringFill - stagger));
      mat.uniforms.uOpacity.value = emerge * (0.5 + (ringCount - i) * 0.15);
    });

    if (pipRef.current) {
      const angle = t * 0.35;
      const r = ringRadius;
      pipRef.current.position.set(Math.cos(angle) * r, Math.sin(angle) * r * 0.92, 0.02);
      pipRef.current.visible = emerge > 0.25;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh geometry={SHARED_ICO_SPHERE} material={sphereMat} />
      <lineSegments geometry={wireGeom}>
        <lineBasicMaterial color="#e9d8a6" transparent opacity={0.06} depthWrite={false} />
      </lineSegments>
      {ringGeoms.map((geom, i) => (
        <mesh key={i} geometry={geom} material={ringMats[i]} />
      ))}
      <points geometry={atmosphereGeom} material={atmosphereMat} />
      <mesh ref={pipRef}>
        <octahedronGeometry args={[0.028, 0]} />
        <meshBasicMaterial
          color="#caa554"
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
