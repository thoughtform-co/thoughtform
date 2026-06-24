"use client";

/**
 * HologramOrbits — the three service orbits as REAL 3D rings sharing the
 * scene camera with the artifact.
 *
 * This is the fix for the v7 Services orbits being a flat 2D SVG overlay
 * (separate coordinate space, faked tilts, no depth relationship to the
 * mark). Here each orbit is a tilted great circle in true 3D: it passes in
 * front of and behind the armillary because it lives in the SAME perspective
 * scene. Each carries a drifting node — the future anchor for a scan-line
 * connector to its HUD card.
 *
 * Tilts reinterpret `celestialData`'s 2D recipe as distinct 3D planes so the
 * three cross and wrap the mark in depth (equatorial · meridian · diagonal),
 * matching the armillary read of the gold-rings reference.
 */

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export interface OrbitConfig {
  id: string;
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

/** Three distinct 3D planes — wide equatorial · tall meridian · diagonal. */
export const DEFAULT_ORBITS: readonly OrbitConfig[] = [
  // Keynote — wide equatorial ring, seen slightly from above.
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
  // Workshop — tall meridian standing toward the viewer (lead service, boldest).
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
  // Embedded — inclined diagonal dotted dawn ring crossing the other two.
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

const SEGMENTS = 160;

function ringPoints(radius: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const a = (i / SEGMENTS) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  return pts;
}

function OrbitRing({ config, scale }: { config: OrbitConfig; scale: number }) {
  const nodeRef = useRef<THREE.Group>(null);
  const points = useMemo(() => ringPoints(config.radius), [config.radius]);
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

  return (
    <group rotation={config.tilt} scale={scale}>
      <Line
        points={points}
        color={config.color}
        lineWidth={config.lineWidth}
        transparent
        opacity={config.opacity}
        dashed={config.dashed ?? false}
        dashSize={config.dashed ? 0.06 : undefined}
        gapSize={config.dashed ? 0.14 : undefined}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
      {/* Drifting node — the connector anchor for the HUD card (phase 2). */}
      <group ref={nodeRef}>
        <mesh>
          <sphereGeometry args={[0.019, 12, 12]} />
          <meshBasicMaterial
            color={config.color}
            transparent
            opacity={Math.min(0.85, config.opacity + 0.05)}
            blending={THREE.AdditiveBlending}
            toneMapped
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

export interface HologramOrbitsProps {
  orbits?: readonly OrbitConfig[];
  /** Uniform scale applied to all orbits (so they grow with the artifact). */
  scale?: number;
  /** Speed (rad/s) the whole orbital armature rotates about Y. This is what
   *  conveys the 3D — the orbits sweep around the (billboarded) mark. */
  rotateSpeed?: number;
}

export function HologramOrbits({
  orbits = DEFAULT_ORBITS,
  scale = 1,
  rotateSpeed = 0.06,
}: HologramOrbitsProps) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += rotateSpeed * delta;
  });
  return (
    <group ref={groupRef}>
      {orbits.map((o) => (
        <OrbitRing key={o.id} config={o} scale={scale} />
      ))}
    </group>
  );
}
