/**
 * intelligenceLayerGeom — geometry contract for the intelligence-layer
 * R3F scene (`TriadScene`) and substrate-window choreography.
 *
 * ADR-016: three `CelestialBody` groups on a mild isometric tilt with
 * `CometStream`. DOM chambers track projected centres via CSS vars
 * written by `TriadScene` (`--ilayer-body-{id}-x/y/scale/diameter`).
 *
 * Legacy ADR-014 ring-cluster exports remain for `_legacy/` + journey
 * handoff scalars (`vectorRingOpacity`, `splitEnvelope`, etc.).
 */

import { create } from "zustand";
import * as THREE from "three";

// ────────────────────────────────────────────────────────────────────
// ADR-016 — celestial triad layout + perspective camera
// ────────────────────────────────────────────────────────────────────

export type BodyId = "sources" | "substrate" | "surfaces";

const DEG = Math.PI / 180;

/** Mild isometric tilt applied to scene group (radians). */
export const CAMERA_TILT = {
  x: -6 * DEG,
  y: 4 * DEG,
} as const;

/**
 * Perspective framing for `IntelligenceLayerStack` (ADR-016).
 *
 * Was orthographic with `zoom: 36` — at typical canvas sizes that
 * projected world `x = ±2.35` to ~45%/55% NDC and the spheres rendered
 * at ~70px. Switching to perspective gives consistent screen layout
 * across viewports without dynamic zoom math.
 */
export const CAMERA_PARAMS = {
  orthographic: false as const,
  fov: 42,
  position: [0, 0.45, 6.4] as [number, number, number],
  lookAt: [0, -0.05, 0] as [number, number, number],
  near: 0.1,
  far: 50,
};

/** Scene-space centres — triad sits below the section head (~56% viewport).
 *  Sources and Surfaces are pushed wider so the bodies breathe closer to
 *  the HUD rails on the viewport edges; substrate stays centred. */
export const BODY_POSITIONS: Record<BodyId, [number, number, number]> = {
  sources: [-2.55, -0.05, -0.25],
  substrate: [0, -0.05, 0],
  surfaces: [2.55, -0.05, -0.25],
};

export const BODY_SCALES: Record<BodyId, number> = {
  sources: 1.25,
  substrate: 1.85,
  surfaces: 1.25,
};

/** Outer orbital ring radius in body-local space (before group scale). */
export const BODY_RING_RADIUS = 0.62;

/** Per-body ring Euler tilts (radians) — rings tip toward the viewer. */
export const BODY_RING_TILTS: Record<BodyId, readonly [number, number, number][]> = {
  sources: [[16 * DEG, 0, 8 * DEG]],
  substrate: [
    [14 * DEG, 0, 6 * DEG],
    [18 * DEG, 0, -10 * DEG],
  ],
  surfaces: [[16 * DEG, 0, -8 * DEG]],
};

/** Main comet path — rides the primary inter-sphere trajectory. */
export const COMET_CURVE_POINTS: readonly [number, number, number][] = [
  [-3.9, -0.08, -0.35],
  [-2.3, 0.05, -0.2],
  [0, 0.38, 0.04],
  [2.3, 0.05, -0.2],
  [3.9, -0.08, -0.35],
];

/** Inter-sphere trajectory curves (Destiny / space-map register). */
export interface TrajectorySpec {
  id: string;
  points: readonly [number, number, number][];
  color: "dawn" | "gold";
  ghost?: boolean;
  /** Hosts the comet particle stream when true. */
  cometHost?: boolean;
}

export const TRAJECTORY_CURVES: readonly TrajectorySpec[] = [
  {
    id: "main",
    cometHost: true,
    color: "gold",
    points: [
      [-4.1, -0.22, -0.45],
      [-2.4, 0.12, -0.15],
      [0, 0.48, 0.08],
      [2.4, 0.12, -0.15],
      [4.1, -0.22, -0.45],
    ],
  },
  {
    id: "upper",
    color: "dawn",
    points: [
      [-3.8, 0.35, -0.55],
      [-2.1, 0.55, -0.25],
      [0, 0.72, 0.02],
      [2.1, 0.55, -0.25],
      [3.8, 0.35, -0.55],
    ],
  },
  {
    id: "lower",
    color: "gold",
    points: [
      [-3.9, -0.42, -0.5],
      [-2.2, -0.28, -0.35],
      [0, -0.12, -0.2],
      [2.2, -0.28, -0.35],
      [3.9, -0.42, -0.5],
    ],
  },
  {
    id: "ghost-a",
    ghost: true,
    color: "dawn",
    points: [
      [-4.2, 0.05, -0.65],
      [0, 0.28, -0.55],
      [4.2, 0.05, -0.65],
    ],
  },
  {
    id: "ghost-b",
    ghost: true,
    color: "dawn",
    points: [
      [-3.5, -0.55, -0.4],
      [0, -0.38, -0.32],
      [3.5, -0.55, -0.4],
    ],
  },
];

export function getCometTrajectoryPoints(): readonly [number, number, number][] {
  const host = TRAJECTORY_CURVES.find((t) => t.cometHost);
  return host?.points ?? COMET_CURVE_POINTS;
}

// ────────────────────────────────────────────────────────────────────
// Constellation pip layout (DOM labels track via TriadScene CSS vars)
// ────────────────────────────────────────────────────────────────────

/** Re-export of `TrajectorySpec` shape for consumers (kept stable for the
 *  `TrajectoryFlows` ambient particle streams). */
export type { TrajectorySpec as Trajectory };

export interface PipSpec {
  /** degrees, 0 = top, clockwise */
  angleDeg: number;
  /** multiplier on BODY_RING_RADIUS */
  radiusMul: number;
  shortLabel: string;
  value?: string;
}

export const BODY_PIPS: Record<BodyId, readonly PipSpec[]> = {
  sources: [
    { angleDeg: -72, radiusMul: 1.0, shortLabel: "Brand" },
    { angleDeg: -38, radiusMul: 1.0, shortLabel: "Campaigns" },
    { angleDeg: -8, radiusMul: 1.0, shortLabel: "Customer" },
    { angleDeg: 28, radiusMul: 1.0, shortLabel: "Perf" },
    { angleDeg: 58, radiusMul: 1.0, shortLabel: "Style" },
    { angleDeg: 88, radiusMul: 1.0, shortLabel: "Reviewer" },
  ],
  substrate: [
    { angleDeg: 0, radiusMul: 1.02, shortLabel: "Rules", value: "Decide" },
    { angleDeg: 90, radiusMul: 1.02, shortLabel: "Examples", value: "Good" },
    { angleDeg: 180, radiusMul: 1.02, shortLabel: "Sources", value: "Data" },
    { angleDeg: 270, radiusMul: 1.02, shortLabel: "Loops", value: "Confirm" },
  ],
  surfaces: [
    { angleDeg: -75, radiusMul: 1.22, shortLabel: "Cursor" },
    { angleDeg: -42, radiusMul: 1.22, shortLabel: "Claude" },
    { angleDeg: -10, radiusMul: 1.22, shortLabel: "Web" },
    { angleDeg: 22, radiusMul: 1.22, shortLabel: "REST" },
    { angleDeg: 52, radiusMul: 1.22, shortLabel: "Slack" },
    { angleDeg: 82, radiusMul: 1.22, shortLabel: "Agents" },
  ],
};

/** Inflow arc start radius multiplier (sources). */
export const SOURCES_INFLOW_START_MUL = 1.38;

const _projVec = new THREE.Vector3();

/**
 * Project a body's world centre to CSS % coords on the ilayer canvas.
 *
 * Returns `null` when the canvas isn't sized or projection lands
 * outside the visible range (z<=−1 or behind camera). The caller must
 * treat null as "do not write CSS vars" so the static CSS fallback
 * positions chambers correctly instead of all collapsing to 50%.
 */
export function screenSpaceForBody(
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
  worldPos: THREE.Vector3,
  bodyScale: number
): { x: number; y: number; scale: number } | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return null;
  _projVec.copy(worldPos).project(camera);
  if (!Number.isFinite(_projVec.x) || !Number.isFinite(_projVec.y)) return null;
  // Behind camera or far outside view — skip
  if (_projVec.z > 1.05 || _projVec.z < -1.05) return null;
  const x = (_projVec.x * 0.5 + 0.5) * 100;
  const y = (-_projVec.y * 0.5 + 0.5) * 100;
  // Perspective foreshortening: things farther from camera appear smaller.
  // For perspective cameras, _projVec.z is in NDC depth [-1, 1].
  const depthScale = 1 - _projVec.z * 0.08;
  const scale = bodyScale * depthScale;
  return { x, y, scale };
}

/** Project any world point to CSS % (pip labels, captions). */
export function screenSpaceForPoint(
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
  worldPos: THREE.Vector3
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return null;
  _projVec.copy(worldPos).project(camera);
  if (!Number.isFinite(_projVec.x) || !Number.isFinite(_projVec.y)) return null;
  if (_projVec.z > 1.05 || _projVec.z < -1.05) return null;
  return {
    x: (_projVec.x * 0.5 + 0.5) * 100,
    y: (-_projVec.y * 0.5 + 0.5) * 100,
  };
}

// ────────────────────────────────────────────────────────────────────
// Substrate dock + legacy ADR-014 ring constants (journey / _legacy)
// ────────────────────────────────────────────────────────────────────

/** Substrate ring centre — matches `BODY_POSITIONS.substrate` + CSS triad Y. */
export const SUBSTRATE_RING = {
  centre: [0, -0.05, 0] as [number, number, number],
  radius: 0.52,
};

export interface SideOrbit {
  id: "left" | "right";
  homeCentre: [number, number, number];
  radius: number;
  color: string;
  opacity: number;
  pipAngles: readonly number[];
}

export const LEFT_ORBIT: SideOrbit = {
  id: "left",
  homeCentre: [-1.95, -0.05, 0],
  radius: 0.52,
  color: "#caa554",
  opacity: 0.65,
  pipAngles: [0, 90, 180, 270],
};

export const RIGHT_ORBIT: SideOrbit = {
  id: "right",
  homeCentre: [1.95, -0.05, 0],
  radius: 0.52,
  color: "#caa554",
  opacity: 0.65,
  pipAngles: [0, 90, 180, 270],
};

export const SIDE_ORBITS: readonly SideOrbit[] = [LEFT_ORBIT, RIGHT_ORBIT];

export const DIAMOND_SIZE = 0.04;
export const RING_SEGMENTS = 96;
export const SUB_ORBIT_SPIN_RATE = 0.06;

export const CLUSTER_RING_RADII: readonly number[] = [1.0, 0.84, 0.68, 0.52, 0.36];
export const CLUSTER_RING_OPACITIES: readonly number[] = [0.85, 0.55, 0.35, 0.25, 0.2];
export const CLUSTER_DUST_COUNT = 10;
export const CLUSTER_DUST_SIZE_PX = 3.2;
export const CLUSTER_DUST_COLOR = "#e9d8a6";
export const CLUSTER_DIAMOND_OPACITY = 0.9;
export const CLUSTER_DUST_OPACITY = 0.55;

export interface ClusterSpec {
  id: BodyId;
  centre: readonly [number, number, number];
  radius: number;
  stagger: number;
}

export const CLUSTER_TRIAD: readonly ClusterSpec[] = [
  { id: "sources", centre: [-1.95, -0.05, 0], radius: 0.52, stagger: 0.04 },
  { id: "substrate", centre: [0, -0.05, 0], radius: 0.52, stagger: 0.0 },
  { id: "surfaces", centre: [1.95, -0.05, 0], radius: 0.52, stagger: 0.04 },
];

// ────────────────────────────────────────────────────────────────────
// Envelopes — orbit emerge / retract + substrate handoff
// ────────────────────────────────────────────────────────────────────

export const ORBIT_ENVELOPE = {
  emerge: { in: 0.0, out: 0.18 },
  retract: { in: 0.85, out: 1.0 },
};

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function orbitEmerge(progress: number): number {
  if (progress <= ORBIT_ENVELOPE.emerge.in) return 0;
  if (progress >= ORBIT_ENVELOPE.retract.out) return 0;
  const emergeIn = smoothstep(ORBIT_ENVELOPE.emerge.in, ORBIT_ENVELOPE.emerge.out, progress);
  const retractOut = smoothstep(ORBIT_ENVELOPE.retract.in, ORBIT_ENVELOPE.retract.out, progress);
  return emergeIn * (1 - retractOut);
}

export const SUBSTRATE_PHASE = {
  arriveOut: 0.04,
  handoffOut: 0.12,
  splitOut: 0.28,
  resolveIn: 0.22,
  resolveOut: 0.42,
} as const;

export interface SubstratePhases {
  handoff: number;
  split: number;
  resolve: number;
}

export function splitEnvelope(progress: number): SubstratePhases {
  return {
    handoff: smoothstep(SUBSTRATE_PHASE.arriveOut, SUBSTRATE_PHASE.handoffOut, progress),
    split: smoothstep(SUBSTRATE_PHASE.handoffOut, SUBSTRATE_PHASE.splitOut, progress),
    resolve: smoothstep(SUBSTRATE_PHASE.resolveIn, SUBSTRATE_PHASE.resolveOut, progress),
  };
}

export function vectorRingOpacity(progress: number): number {
  if (progress <= SUBSTRATE_PHASE.arriveOut) return 1;
  if (progress >= SUBSTRATE_PHASE.handoffOut) return 0;
  return 1 - smoothstep(SUBSTRATE_PHASE.arriveOut, SUBSTRATE_PHASE.handoffOut, progress);
}

export function clusterRingResolve(
  resolveProgress: number,
  ringIndex: number,
  clusterStagger: number
): number {
  const ringStagger = ringIndex * 0.08;
  const phase = clamp01(resolveProgress - clusterStagger - ringStagger);
  return smoothstep(0, 0.55, phase);
}

/** ADR-014 rotation channel — no-op; triad is front-on (ADR-016). */
export function splitRotation(_progress: number): number {
  return 0;
}

export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IlayerGeomState {
  encodeRect: ScreenRect | null;
  setEncodeRect: (rect: ScreenRect | null) => void;
}

export const useIlayerGeomStore = create<IlayerGeomState>((set) => ({
  encodeRect: null,
  setEncodeRect: (rect) =>
    set((state) => {
      const prev = state.encodeRect;
      if (
        prev &&
        rect &&
        prev.x === rect.x &&
        prev.y === rect.y &&
        prev.width === rect.width &&
        prev.height === rect.height
      ) {
        return state;
      }
      return { encodeRect: rect };
    }),
}));
