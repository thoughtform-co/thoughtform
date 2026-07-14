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
import { SERVICES_GOLD, TENSOR_ACCENT } from "@/lib/home-v2/goldPalette";

export interface OrbitConfig {
  /** ServiceId for a service ring; any unique key for a decorative shell. */
  id: ServiceId | string;
  /** Ring radius in world units. */
  radius: number;
  /** Plane orientation [x, y, z] in radians. */
  tilt: [number, number, number];
  color: string;
  opacity: number;
  lineWidth: number;
  dashed?: boolean;
  /** Ellipse squash: ry = radius * eccentricity. Default 0.9 (slightly elliptical,
   *  matching the corridor's cascading shells). */
  eccentricity?: number;
  /** false = decorative shell — drawn for depth, but carries no drifting node and
   *  publishes no HUD anchor. Default true (a service ring). */
  node?: boolean;
  /** Optional dash tuning for decorative latitude / cartography rings. */
  dashSize?: number;
  gapSize?: number;
  /** Node drift speed in rad/s (sign = direction). Service rings only. */
  speed?: number;
  /** Resting parametric angle in radians. */
  phase0?: number;
  /** Draw-on window in `--corridor-dissipate` units. When set it overrides the
   *  index-based `REVEAL_WINDOWS` stagger — required for ring sets shorter than
   *  the default (the windows are otherwise position-coupled to DEFAULT_ORBITS'
   *  seven-ring order). Unset = the original index fallback, so DEFAULT_ORBITS
   *  and the labs stay byte-identical. */
  reveal?: readonly [number, number];
}

/** Default ellipse squash — the cascading shells are gently elliptical, not
 *  perfect circles (echoes the corridor sphere's ring set, ecc ≈ 0.92). */
const DEFAULT_ECC = 0.9;

// A genuine 3D ARMILLARY centred on the mark: diverse FIXED orbital planes
// (one ~horizontal, one ~vertical/meridian, one diagonal) that cross and weave
// THROUGH the mark — each ring's near arc sweeps in front, its far arc behind.
// A tight near-horizontal "Saturn" waist-ring anchors the mark as the body. The
// planes never gyrate (the rig owns orientation); only the nodes travel. Three
// rings carry a drifting service node + HUD anchor; the waist + outer rings are
// decorative (no node). All gold — one system with the mark.
// Weights lifted 2026-07-06 ("one holographic instrument" pass): opacities
// ≈ +40% decorative / +20% service, line widths one step up, so the armillary
// reads as deliberate line-work next to the denser parked mark + glass plates.
export const DEFAULT_ORBITS: readonly OrbitConfig[] = [
  // Saturn waist-ring — thin near-horizontal ellipse hugging the mark's waist.
  {
    id: "shell-waist",
    radius: 1.06,
    tilt: [1.48, 0.0, 0.05],
    color: TENSOR_ACCENT,
    opacity: 0.68,
    lineWidth: 2.0,
    eccentricity: 0.96,
    node: false,
  },
  // Service A — keynote: wide, low-inclination orbit.
  {
    id: "latitude-inner",
    radius: 1.28,
    tilt: [1.32, 0.18, -0.18],
    color: SERVICES_GOLD,
    opacity: 0.28,
    lineWidth: 0.95,
    dashed: true,
    dashSize: 0.03,
    gapSize: 0.115,
    eccentricity: 0.9,
    node: false,
  },
  {
    id: "keynote",
    radius: 1.52,
    tilt: [1.05, -0.18, 0.22],
    color: SERVICES_GOLD,
    opacity: 0.62,
    lineWidth: 1.7,
    eccentricity: 0.78,
    speed: 0.12,
    phase0: 3.5,
  },
  // Service B — workshop: vertical meridian orbit (the lead — brightest/boldest).
  {
    id: "workshop",
    radius: 1.78,
    tilt: [0.12, 1.42, -0.18],
    color: SERVICES_GOLD,
    opacity: 0.74,
    lineWidth: 2.2,
    eccentricity: 0.72,
    speed: -0.09,
    phase0: 5.0,
  },
  // Service C — embedded: inclined diagonal orbit crossing the other two.
  {
    id: "embedded",
    radius: 2.02,
    tilt: [0.72, 0.68, 0.72],
    color: SERVICES_GOLD,
    opacity: 0.58,
    lineWidth: 1.5,
    eccentricity: 0.86,
    speed: 0.075,
    phase0: 0.7,
  },
  {
    id: "latitude-outer",
    radius: 2.12,
    tilt: [1.18, -0.24, 0.34],
    color: TENSOR_ACCENT,
    opacity: 0.22,
    lineWidth: 0.85,
    dashed: true,
    dashSize: 0.022,
    gapSize: 0.16,
    eccentricity: 0.82,
    node: false,
  },
  // Faint outer decorative ring for depth.
  {
    id: "shell-outer",
    radius: 2.36,
    tilt: [1.08, 0.28, -0.1],
    color: SERVICES_GOLD,
    opacity: 0.26,
    lineWidth: 1.0,
    dashed: true,
    dashSize: 0.06,
    gapSize: 0.2,
    eccentricity: 0.78,
    node: false,
  },
];

/**
 * STRUCTURAL_ORBITS — the production armillary thinned to its bones
 * (ADR-025 Update 8, "wireframe seeds + structural armillary").
 *
 * With the seed plates re-cut as gold-ink schematics, three service rings
 * re-representing the same three services became redundant diagram ink —
 * and the rings lost their production anchor role on 2026-07-02 (leader
 * lines land on points ON the mark's wireframe; `CorridorArmillary`
 * projects `brandmarkScanAnchorPointsRef`, not orbit nodes). What remains
 * is the minimum for the armillary read: the Saturn waist-ring that mounts
 * the mark as a body, plus ONE crossing meridian (workshop's plane,
 * re-purposed as structure — no node, no service id) so a ring still
 * weaves through the mark's volume (near arc in front, far arc behind).
 *
 * `reveal` windows are explicit — the index-based REVEAL_WINDOWS stagger
 * is coupled to the seven-ring DEFAULT_ORBITS order. The wrap keeps its
 * inner→outer sequence and completes before `--svc-content-in` finishes.
 *
 * DEFAULT_ORBITS stays as the LAB set (/test/services-demo,
 * /test/services-hologram): full armillary, three drifting nodes, the
 * orbit-node `publishAnchors` path.
 */
export const STRUCTURAL_ORBITS: readonly OrbitConfig[] = [
  {
    id: "shell-waist",
    radius: 1.06,
    tilt: [1.48, 0.0, 0.05],
    color: TENSOR_ACCENT,
    opacity: 0.68,
    lineWidth: 2.0,
    eccentricity: 0.96,
    node: false,
    reveal: [0.45, 0.82],
  },
  {
    id: "shell-meridian",
    radius: 1.78,
    tilt: [0.12, 1.42, -0.18],
    color: SERVICES_GOLD,
    opacity: 0.5,
    lineWidth: 1.8,
    eccentricity: 0.72,
    node: false,
    reveal: [0.55, 0.95],
  },
];

const SEGMENTS = 180;

/** Per-ring draw-on windows in `--corridor-dissipate` units, staggered so the
 *  shells wrap around the mark inner→outer in sequence as it forms (echoing the
 *  corridor sphere envelop). Indexed by orbit order; extra orbits reuse the last. */
const REVEAL_WINDOWS: ReadonlyArray<readonly [number, number]> = [
  [0.42, 0.78],
  [0.45, 0.8],
  [0.48, 0.84],
  [0.52, 0.9],
  [0.56, 0.95],
  [0.6, 0.98],
  [0.64, 1.0],
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
  phase0: number,
  eccentricity: number
): { points: THREE.Vector3[]; colors: [number, number, number][] } {
  const euler = new THREE.Euler(tilt[0], tilt[1], tilt[2], "XYZ");
  const base = new THREE.Color(color);
  const scratch = new THREE.Vector3();
  const points: THREE.Vector3[] = [];
  const colors: [number, number, number][] = [];
  const ry = radius * eccentricity;
  for (let i = 0; i <= SEGMENTS; i++) {
    const a = phase0 + (i / SEGMENTS) * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * ry, 0);
    points.push(p);
    const rz = scratch.copy(p).applyEuler(euler).z;
    const frontness = clamp01((rz / radius) * 0.5 + 0.5); // 0 back .. 1 front
    const b = 0.16 + 0.84 * frontness; // strong front/back contrast → arcs weave
    colors.push([base.r * b, base.g * b, base.b * b]);
  }
  return { points, colors };
}

function OrbitRing({
  active,
  config,
  scale,
  bodySpeed,
  dissipateRef,
  revealStart,
  revealEnd,
  masterOpacityGetter,
}: {
  active: boolean;
  config: OrbitConfig;
  scale: number;
  bodySpeed: number;
  dissipateRef: RefObject<number>;
  revealStart: number;
  revealEnd: number;
  masterOpacityGetter?: () => number;
}) {
  const nodeRef = useRef<THREE.Group>(null);
  const nodeMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const lineRef = useRef<ComponentRef<typeof Line>>(null);
  const hasNode = config.node !== false;
  const ecc = config.eccentricity ?? DEFAULT_ECC;
  const { points, colors } = useMemo(
    () => buildRing(config.radius, config.tilt, config.color, config.phase0 ?? 0, ecc),
    [config.radius, config.tilt, config.color, config.phase0, ecc]
  );
  const angle = useRef(config.phase0 ?? 0);

  const baseOpacity = Math.min(1, config.opacity * (active ? 1.28 : 1));
  const nodeBaseOpacity = active ? 0.86 : Math.min(0.56, config.opacity + 0.04);

  useFrame((_, delta) => {
    angle.current += (config.speed ?? 0) * bodySpeed * delta;
    if (hasNode && nodeRef.current) {
      nodeRef.current.position.set(
        Math.cos(angle.current) * config.radius,
        Math.sin(angle.current) * config.radius * ecc,
        0
      );
    }

    const d = dissipateRef.current < 0 ? 1 : dissipateRef.current;
    const reveal = smootherstep(revealStart, revealEnd, d);
    // Decommission dim (ADR-030 Update 1) — 1 when no getter is wired
    // (labs / flag-off byte-identical). Applied to OPACITY only; the
    // solid rings' draw-on instanceCount stays reveal-owned.
    const master = masterOpacityGetter ? masterOpacityGetter() : 1;

    const line = lineRef.current;
    if (line) {
      if (config.dashed) {
        // Dashed ring can't stroke-draw-on; reveal by fading in (matches the
        // SVG orbit-map's dotted ring).
        line.material.opacity = baseOpacity * reveal * master;
      } else {
        // Solid ring: stroke draw-on around the mark via the instanced
        // segment count (fat lines render one instance per segment).
        line.geometry.instanceCount = Math.max(0, Math.ceil(reveal * SEGMENTS));
        line.material.opacity = baseOpacity * master;
      }
    }
    if (nodeMatRef.current) {
      // The node body appears once its ring has nearly finished wrapping.
      nodeMatRef.current.opacity =
        nodeBaseOpacity * smootherstep(revealEnd - 0.18, revealEnd, d) * master;
    }
  });

  return (
    <group rotation={config.tilt} scale={scale}>
      <Line
        ref={lineRef}
        points={points}
        vertexColors={colors}
        lineWidth={config.lineWidth * (active ? 1.22 : 1)}
        transparent
        opacity={baseOpacity}
        dashed={config.dashed ?? false}
        dashSize={config.dashed ? (config.dashSize ?? 0.055) : undefined}
        gapSize={config.dashed ? (config.gapSize ?? 0.16) : undefined}
        depthWrite={false}
        depthTest
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
      {hasNode && (
        <group ref={nodeRef}>
          <mesh>
            <sphereGeometry args={[active ? 0.03 : 0.02, 12, 12]} />
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
      )}
    </group>
  );
}

export interface HologramOrbitsProps {
  orbits?: readonly OrbitConfig[];
  /** Uniform scale applied to all orbits. */
  scale?: number;
  /** Node travel-speed multiplier — bodies move across their FIXED orbits. The
   *  orbit planes never rotate (the rig owns orientation). Default 1. */
  bodySpeed?: number;
  activeServiceId?: ServiceId;
  publishAnchors?: (anchors: ConnectorAnchor[]) => void;
  /** "scroll" = draw the rings on around the mark off `--corridor-dissipate`
   *  (production seam); "off" = fully drawn (lab / static). Default "off". */
  entrance?: "scroll" | "off";
  /** Per-frame master opacity multiplier over every line/node (ADR-030
   *  Update 1: the decommission dims the armillary on the exit clock).
   *  Absent → 1 — labs and flag-off stay byte-identical. */
  masterOpacityGetter?: () => number;
}

export function HologramOrbits({
  activeServiceId,
  orbits = DEFAULT_ORBITS,
  publishAnchors,
  bodySpeed = 1,
  scale = 1,
  entrance = "off",
  masterOpacityGetter,
}: HologramOrbitsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const anglesRef = useRef(orbits.map((o) => o.phase0 ?? 0));
  const eulers = useMemo(
    () => orbits.map((o) => new THREE.Euler(o.tilt[0], o.tilt[1], o.tilt[2], "XYZ")),
    [orbits]
  );
  const local = useRef(new THREE.Vector3());
  const world = useRef(new THREE.Vector3());
  // Reused projection scratch — avoids a per-orbit, per-frame Vector3
  // allocation from the old `world.current.clone().project()` (ADR-038).
  const projected = useRef(new THREE.Vector3());
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

    // Orbit PLANES are fixed — the rig group (parent) owns all orientation, so
    // they move as one rigid object with the mark. Refresh world matrices
    // (including the rig ancestor) so projected node anchors track the rig pose.
    group.updateWorldMatrix(true, false);

    const anchors: ConnectorAnchor[] = [];
    orbits.forEach((o, i) => {
      if (o.node === false) return; // decorative shell — no drifting node / anchor
      anglesRef.current[i] += (o.speed ?? 0) * bodySpeed * delta;
      const a = anglesRef.current[i];
      const ry = o.radius * (o.eccentricity ?? DEFAULT_ECC);
      local.current
        .set(Math.cos(a) * o.radius, Math.sin(a) * ry, 0)
        .applyEuler(eulers[i])
        .multiplyScalar(scale);
      world.current.copy(local.current).applyMatrix4(group.matrixWorld);
      const p = projected.current.copy(world.current).project(camera);
      anchors.push({
        depth: p.z,
        serviceId: o.id as ServiceId,
        visible: p.z < 1 && p.z > -1,
        x: (p.x * 0.5 + 0.5) * size.width,
        y: (-p.y * 0.5 + 0.5) * size.height,
      });
    });
    publishAnchors?.(anchors);
  });

  return (
    <group ref={groupRef}>
      {orbits.map((o, i) => {
        const win = o.reveal ?? REVEAL_WINDOWS[Math.min(i, REVEAL_WINDOWS.length - 1)];
        return (
          <OrbitRing
            key={o.id}
            active={activeServiceId === o.id}
            config={o}
            scale={scale}
            bodySpeed={bodySpeed}
            dissipateRef={dissipateRef}
            revealStart={win[0]}
            revealEnd={win[1]}
            masterOpacityGetter={masterOpacityGetter}
          />
        );
      })}
    </group>
  );
}
