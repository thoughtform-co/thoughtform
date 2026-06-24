"use client";

/**
 * HologramOrbits - the service orbits as real 3D rings sharing the same
 * perspective camera as the Services brandmark hologram.
 *
 * Each orbit renders a dim back pass and a brighter front pass. It is still a
 * lightweight line system, but the opacity split gives the correct read: the
 * rings wrap through the hologram volume instead of sitting as a flat overlay.
 */

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import type { ServiceId } from "../serviceData";
import type { ConnectorAnchor } from "@/lib/stores/hologramConnectorStore";

export interface OrbitConfig {
  id: ServiceId;
  /** Ring radius in world units. */
  radius: number;
  /** Plane orientation [x, y, z] in radians. */
  tilt: [number, number, number];
  color: string;
  opacity: number;
  lineWidth: number;
  dashed?: boolean;
  /** Node drift speed in rad/s (sign = direction). */
  speed: number;
  /** Resting parametric angle in radians. */
  phase0: number;
}

export const DEFAULT_ORBITS: readonly OrbitConfig[] = [
  {
    id: "keynote",
    radius: 1.46,
    tilt: [1.32, 0.0, 0.12],
    color: "#caa554",
    opacity: 0.62,
    lineWidth: 1.3,
    speed: 0.18,
    phase0: 3.5,
  },
  {
    id: "workshop",
    radius: 1.7,
    tilt: [0.16, 0.52, 0.0],
    color: "#caa554",
    opacity: 0.82,
    lineWidth: 1.6,
    speed: -0.14,
    phase0: 5.0,
  },
  {
    id: "embedded",
    radius: 1.96,
    tilt: [0.92, 0.0, 0.95],
    color: "#ebe3d6",
    opacity: 0.52,
    lineWidth: 1.2,
    dashed: true,
    speed: 0.1,
    phase0: 0.7,
  },
];

const SEGMENTS = 180;

function ringPoint(radius: number, t: number): THREE.Vector3 {
  const a = t * Math.PI * 2;
  return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0);
}

function splitRingSegments(radius: number, tilt: [number, number, number], front: boolean) {
  const euler = new THREE.Euler(tilt[0], tilt[1], tilt[2], "XYZ");
  const segments: THREE.Vector3[][] = [];
  let current: THREE.Vector3[] = [];

  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const p = ringPoint(radius, t);
    const rotated = p.clone().applyEuler(euler);
    const isFront = rotated.z >= 0;
    if (isFront === front) {
      current.push(p);
    } else {
      if (current.length > 1) segments.push(current);
      current = [];
    }
  }

  if (current.length > 1) segments.push(current);
  return segments;
}

function OrbitRing({
  active,
  config,
  scale,
}: {
  active: boolean;
  config: OrbitConfig;
  scale: number;
}) {
  const nodeRef = useRef<THREE.Group>(null);
  const frontSegments = useMemo(
    () => splitRingSegments(config.radius, config.tilt, true),
    [config.radius, config.tilt]
  );
  const backSegments = useMemo(
    () => splitRingSegments(config.radius, config.tilt, false),
    [config.radius, config.tilt]
  );
  const angle = useRef(config.phase0);

  useFrame((_, delta) => {
    angle.current += config.speed * delta;
    if (nodeRef.current) {
      nodeRef.current.position.set(
        Math.cos(angle.current) * config.radius,
        Math.sin(angle.current) * config.radius,
        0
      );
    }
  });

  const opacityBoost = active ? 1.2 : 1;
  const lineBoost = active ? 1.12 : 1;

  return (
    <group rotation={config.tilt} scale={scale}>
      {backSegments.map((points, i) => (
        <Line
          key={`back-${i}`}
          points={points}
          color={config.color}
          lineWidth={config.lineWidth * 0.78}
          transparent
          opacity={config.opacity * 0.26}
          dashed={config.dashed ?? false}
          dashSize={config.dashed ? 0.055 : undefined}
          gapSize={config.dashed ? 0.16 : undefined}
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      ))}
      {frontSegments.map((points, i) => (
        <Line
          key={`front-${i}`}
          points={points}
          color={config.color}
          lineWidth={config.lineWidth * lineBoost}
          transparent
          opacity={Math.min(1, config.opacity * opacityBoost)}
          dashed={config.dashed ?? false}
          dashSize={config.dashed ? 0.055 : undefined}
          gapSize={config.dashed ? 0.16 : undefined}
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      ))}
      <group ref={nodeRef}>
        <mesh>
          <sphereGeometry args={[active ? 0.026 : 0.019, 12, 12]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={active ? 0.95 : Math.min(0.78, config.opacity + 0.05)}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

export interface HologramOrbitsProps {
  orbits?: readonly OrbitConfig[];
  /** Uniform scale applied to all orbits. */
  scale?: number;
  /** Speed (rad/s) the whole orbital armature rotates about Y. */
  rotateSpeed?: number;
  activeServiceId?: ServiceId;
  publishAnchors?: (anchors: ConnectorAnchor[]) => void;
}

export function HologramOrbits({
  activeServiceId,
  orbits = DEFAULT_ORBITS,
  publishAnchors,
  rotateSpeed = 0.06,
  scale = 1,
}: HologramOrbitsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const anglesRef = useRef(orbits.map((o) => o.phase0));
  const eulers = useMemo(
    () => orbits.map((o) => new THREE.Euler(o.tilt[0], o.tilt[1], o.tilt[2], "XYZ")),
    [orbits]
  );
  const local = useRef(new THREE.Vector3());
  const world = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    group.rotation.y += rotateSpeed * delta;
    group.updateMatrixWorld();

    const anchors: ConnectorAnchor[] = [];
    orbits.forEach((o, i) => {
      anglesRef.current[i] += o.speed * delta;
      const a = anglesRef.current[i];
      local.current
        .set(Math.cos(a) * o.radius, Math.sin(a) * o.radius, 0)
        .applyEuler(eulers[i])
        .multiplyScalar(scale);
      world.current.copy(local.current).applyMatrix4(group.matrixWorld);
      const projected = world.current.clone().project(camera);
      anchors.push({
        depth: projected.z,
        serviceId: o.id,
        visible: projected.z < 1 && projected.z > -1,
        x: (projected.x * 0.5 + 0.5) * size.width,
        y: (-projected.y * 0.5 + 0.5) * size.height,
      });
    });
    publishAnchors?.(anchors);
  });

  return (
    <group ref={groupRef}>
      {orbits.map((o) => (
        <OrbitRing key={o.id} active={activeServiceId === o.id} config={o} scale={scale} />
      ))}
    </group>
  );
}
