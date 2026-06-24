"use client";

/**
 * HologramOrbits — the service orbits as real 3D rings sharing the Services
 * brandmark hologram's perspective camera.
 *
 * Each ring is ONE continuous Line with per-vertex depth shading (front bright,
 * back dim) so it weaves through the hologram volume. On scroll-in the rings
 * WRAP around the mark via a stroke DRAW-ON — solid rings reveal segment-by-
 * segment through `geometry.instanceCount`; the dashed ring fades on (a dash
 * pattern can't draw-on) — staggered and driven by the corridor-exit dissipate
 * clock, echoing the corridor sphere enveloping the brandmark. Parked / lab /
 * no dissipate clock → fully drawn (reveal = 1).
 */

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ComponentRef, type RefObject, useMemo, useRef } from "react";
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

/** Per-ring draw-on windows in `--corridor-dissipate` units, staggered so the
 *  rings wrap around the mark in sequence as it forms (echoing the corridor
 *  sphere envelop). Indexed by orbit order; extra orbits reuse the last. */
const REVEAL_WINDOWS: ReadonlyArray<readonly [number, number]> = [
  [0.45, 0.82],
  [0.53, 0.9],
  [0.61, 0.98],
];

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Ken Perlin smootherstep (C2-continuous). */
function smootherstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** One continuous closed ring (ordered from `phase0` around 2π, so the draw-on
 *  emanates from the node) plus per-vertex depth colours (front bright, back
 *  dim) baked from the tilt — same depth read the old front/back split gave. */
function buildRing(
  radius: number,
  tilt: [number, number, number],
  color: string,
  phase0: number
): { points: THREE.Vector3[]; colors: [number, number, number][] } {
  const euler = new THREE.Euler(tilt[0], tilt[1], tilt[2], "XYZ");
  const base = new THREE.Color(color);
  const scratch = new THREE.Vector3();
  const points: THREE.Vector3[] = [];
  const colors: [number, number, number][] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const a = phase0 + (i / SEGMENTS) * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0);
    points.push(p);
    const rz = scratch.copy(p).applyEuler(euler).z;
    const frontness = clamp01((rz / radius) * 0.5 + 0.5); // 0 back .. 1 front
    const b = 0.3 + 0.7 * frontness;
    colors.push([base.r * b, base.g * b, base.b * b]);
  }
  return { points, colors };
}

function OrbitRing({
  active,
  config,
  scale,
  dissipateRef,
  revealStart,
  revealEnd,
}: {
  active: boolean;
  config: OrbitConfig;
  scale: number;
  dissipateRef: RefObject<number>;
  revealStart: number;
  revealEnd: number;
}) {
  const nodeRef = useRef<THREE.Group>(null);
  const nodeMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const lineRef = useRef<ComponentRef<typeof Line>>(null);
  const { points, colors } = useMemo(
    () => buildRing(config.radius, config.tilt, config.color, config.phase0),
    [config.radius, config.tilt, config.color, config.phase0]
  );
  const angle = useRef(config.phase0);

  const baseOpacity = Math.min(1, config.opacity * (active ? 1.2 : 1));
  const nodeBaseOpacity = active ? 0.95 : Math.min(0.78, config.opacity + 0.05);

  useFrame((_, delta) => {
    angle.current += config.speed * delta;
    if (nodeRef.current) {
      nodeRef.current.position.set(
        Math.cos(angle.current) * config.radius,
        Math.sin(angle.current) * config.radius,
        0
      );
    }

    const d = dissipateRef.current < 0 ? 1 : dissipateRef.current;
    const reveal = smootherstep(revealStart, revealEnd, d);

    const line = lineRef.current;
    if (line) {
      if (config.dashed) {
        // Dashed ring can't stroke-draw-on; reveal by fading in (matches the
        // SVG orbit-map's dotted ring).
        line.material.opacity = baseOpacity * reveal;
      } else {
        // Solid ring: stroke draw-on around the mark via the instanced
        // segment count (fat lines render one instance per segment).
        line.geometry.instanceCount = Math.max(0, Math.ceil(reveal * SEGMENTS));
        line.material.opacity = baseOpacity;
      }
    }
    if (nodeMatRef.current) {
      // The node body appears once its ring has nearly finished wrapping.
      nodeMatRef.current.opacity = nodeBaseOpacity * smootherstep(revealEnd - 0.18, revealEnd, d);
    }
  });

  return (
    <group rotation={config.tilt} scale={scale}>
      <Line
        ref={lineRef}
        points={points}
        vertexColors={colors}
        lineWidth={config.lineWidth * (active ? 1.12 : 1)}
        transparent
        opacity={baseOpacity}
        dashed={config.dashed ?? false}
        dashSize={config.dashed ? 0.055 : undefined}
        gapSize={config.dashed ? 0.16 : undefined}
        depthWrite={false}
        depthTest
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
      <group ref={nodeRef}>
        <mesh>
          <sphereGeometry args={[active ? 0.026 : 0.019, 12, 12]} />
          <meshBasicMaterial
            ref={nodeMatRef}
            color={config.color}
            transparent
            opacity={nodeBaseOpacity}
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
  /** "scroll" = draw the rings on around the mark off `--corridor-dissipate`
   *  (production seam); "off" = fully drawn (lab / static). Default "off". */
  entrance?: "scroll" | "off";
}

export function HologramOrbits({
  activeServiceId,
  orbits = DEFAULT_ORBITS,
  publishAnchors,
  rotateSpeed = 0.06,
  scale = 1,
  entrance = "off",
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
  // Damped dissipate clock (−1 sentinel = snap on first frame). 1 when parked.
  const scrollEntrance = entrance === "scroll";
  const dissipateRef = useRef(scrollEntrance ? -1 : 1);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Read + damp the corridor-exit dissipate clock (parked / absent → 1).
    let target = 1;
    if (scrollEntrance) {
      const raw = parseFloat(
        document.documentElement.style.getPropertyValue("--corridor-dissipate")
      );
      target = Number.isFinite(raw) ? raw : 1;
    }
    if (dissipateRef.current < 0) dissipateRef.current = target;
    else dissipateRef.current += (target - dissipateRef.current) * Math.min(1, delta * 8);

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
      {orbits.map((o, i) => {
        const win = REVEAL_WINDOWS[Math.min(i, REVEAL_WINDOWS.length - 1)];
        return (
          <OrbitRing
            key={o.id}
            active={activeServiceId === o.id}
            config={o}
            scale={scale}
            dissipateRef={dissipateRef}
            revealStart={win[0]}
            revealEnd={win[1]}
          />
        );
      })}
    </group>
  );
}
