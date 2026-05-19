/**
 * intelligenceLayerGeom — geometry contract for the intelligence-layer
 * R3F scene (`TriadScene`) and the substrate-window choreography
 * (`lib/brandmark/journey.ts`).
 *
 * ADR-016: three discrete celestial bodies (Sources / Substrate /
 * Surfaces) on a mild isometric tilt with a comet stream connector.
 * ADR-014 (front-on coplanar rings) is archived under `_legacy/`.
 *
 * ADR-014 (legacy): the intelligence layer is no longer a three-coaxial-ring
 * instrument that rotates around a Y axis. It is a front-on TRIAD of
 * three overlapping circular orbits — a space-map composition modelled
 * after Destiny / Astral Frontier celestial diagrams:
 *
 *     [ left orbit ]   [ substrate ring ]   [ right orbit ]
 *      01 sources         02 substrate         03 surfaces
 *
 * The middle ring is the brandmark cloud itself, re-sampled from a
 * ring-only path set during the substrate-engagement window (the
 * cross + horizontal bar dissolve into a clean orbital body — see
 * `lib/brandmark/shapes.ts` + the `uShapeBlend` channel in the
 * painter shader).
 *
 * Side orbits emerge from the substrate centre by sliding outward
 * and scaling up in parallel — at emerge = 0 they're at the origin
 * at scale 0 (completely invisible); at emerge = 1 they sit at
 * their home centres at full scale. The same trapezoid retracts
 * them at section exit so the cloud departs the section in its
 * canonical mark form.
 *
 * Units are scene-space (1.0 ≈ half canvas height; tuned so the
 * substrate ring + both side orbits fit horizontally within the
 * R3F canvas at the front-on camera framing below).
 */

import { create } from "zustand";
import * as THREE from "three";

// ────────────────────────────────────────────────────────────────────
// ADR-016 — celestial triad layout + orthographic camera
// ────────────────────────────────────────────────────────────────────

export type BodyId = "sources" | "substrate" | "surfaces";

const DEG = Math.PI / 180;

/** Mild isometric tilt applied to the R3F camera (radians). */
export const CAMERA_TILT = {
  x: -14 * DEG,
  y: 6 * DEG,
} as const;

/** Orthographic framing for `IntelligenceLayerStack` (ADR-016). */
export const CAMERA_PARAMS = {
  orthographic: true as const,
  zoom: 38,
  position: [0, 0.35, 12] as [number, number, number],
  lookAt: [0, -0.111, 0] as [number, number, number],
  near: 0.1,
  far: 80,
  rotation: [CAMERA_TILT.x, CAMERA_TILT.y, 0] as [number, number, number],
};

/** Scene-space centres — substrate at the brandmark dock height. */
export const BODY_POSITIONS: Record<BodyId, [number, number, number]> = {
  sources: [-2.4, -0.111, -0.4],
  substrate: [0, -0.111, 0],
  surfaces: [2.4, -0.111, -0.4],
};

export const BODY_SCALES: Record<BodyId, number> = {
  sources: 0.7,
  substrate: 1.0,
  surfaces: 0.7,
};

/** Per-body ring Euler tilts (radians) — rings tip toward the viewer. */
export const BODY_RING_TILTS: Record<BodyId, readonly [number, number, number][]> = {
  sources: [[16 * DEG, 0, 8 * DEG]],
  substrate: [
    [14 * DEG, 0, 6 * DEG],
    [18 * DEG, 0, -10 * DEG],
  ],
  surfaces: [[16 * DEG, 0, -8 * DEG]],
};

/** Catmull-Rom control points for the comet stream (left → right). */
export const COMET_CURVE_POINTS: readonly [number, number, number][] = [
  [-4.2, -0.15, -0.5],
  [-2.35, -0.05, -0.35],
  [0, 0.42, 0.05],
  [2.35, -0.05, -0.35],
  [4.2, -0.15, -0.5],
];

const _projVec = new THREE.Vector3();

/** Project a body's world centre to CSS % coords on the ilayer canvas. */
export function screenSpaceForBody(
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
  worldPos: THREE.Vector3,
  bodyScale: number
): { x: number; y: number; scale: number } {
  _projVec.copy(worldPos).project(camera);
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) {
    return { x: 50, y: 56, scale: bodyScale };
  }
  const x = (_projVec.x * 0.5 + 0.5) * 100;
  const y = (-_projVec.y * 0.5 + 0.5) * 100;
  const scale = bodyScale * (0.92 + _projVec.z * 0.08);
  return { x, y, scale };
}

// ────────────────────────────────────────────────────────────────────
// Triad geometry — substrate + two side orbits
// ────────────────────────────────────────────────────────────────────

/** Substrate ring — anchored slightly below the canvas centre.
 *  The brandmark particle cloud paints here (via the global painter,
 *  morphed to the ring-only shape via `uShapeBlend`); this geometry
 *  record exists so the side orbits + meridian pips know where the
 *  centre is and what size to match.
 *
 *  ADR-014 v3 (three-equal-circles, sized for content visibility):
 *
 *    1. The substrate guide ring is NOT rendered (see `OrbitField`).
 *       The brandmark cloud IS the centre ring.
 *    2. All three rings share radius 0.48 scene units. At camera
 *       fov 26 / z=4, vertical world span is ~1.846 scene units,
 *       so 0.48 → ~26vh radius → ~52vh diameter on a 100vh canvas.
 *       The CSS `--ilayer-ring-diameter` is set to
 *       clamp(320px, 52vh, 540px) so the brandmark anchor matches.
 *    3. The triad's vertical centre is shifted DOWN by ~6vh so the
 *       bigger rings extend into the lower half of the section
 *       instead of crashing into the title head. CSS positions the
 *       brandmark anchor + chambers at `top: var(--ilayer-triad-y)`
 *       = 56% of the section; R3F mirrors this via
 *       `SUBSTRATE_RING.centre.y = -0.111` (and matching
 *       `homeCentre.y` on the side orbits).
 *
 *  `centre` + `radius` are consumed by `buildSubstrateMeridianPips`
 *  so the top/bottom diamonds sit exactly on the brandmark ring's
 *  rim at the shifted-down centre. */
export const SUBSTRATE_RING = {
  /** Shifted down by 0.111 scene units so the substrate sits at
   *  viewport 56% (matching `--ilayer-triad-y` in landing.css).
   *  6vh / 100vh × 1.846 ≈ 0.111. R3F Y axis points UP while the
   *  viewport Y axis points DOWN, so "down in the viewport" maps
   *  to negative R3F Y. */
  centre: [0, -0.111, 0] as [number, number, number],
  /** Shared radius used by all three triad rings (substrate, left
   *  orbit, right orbit). */
  radius: 0.48,
};

/**
 * SideOrbit — a single side orbit (left or right) of the triad.
 *
 * Final position is `homeCentre`; final size is `radius`. The orbit
 * EMERGES by lerping both position and scale from origin/0 to
 * homeCentre/1 in parallel, so it visually slides outward AND grows
 * from the substrate's centre.
 *
 * `pips` are angles (degrees, 0 = top of orbit, clockwise) where a
 * small decorative diamond sits on the orbit's rim. The DOM labels
 * use the same angle table to position themselves outside the rim
 * via CSS trig.
 */
export interface SideOrbit {
  id: "left" | "right";
  /** Final scene-space centre. The orbit slides from [0,0,0] to
   *  here as it emerges. */
  homeCentre: [number, number, number];
  /** Final scene-space radius. */
  radius: number;
  /** Hex colour for the LineLoop material. Maps to a CSS token. */
  color: string;
  /** Material opacity for the hairline ring. Side orbits read as
   *  GUIDE lines (lower contrast) so the substrate stays the signal. */
  opacity: number;
  /** Angles (degrees, 0 = top, clockwise) of decorative diamond
   *  pips on the rim. The label angles in the DOM mirror this
   *  table so pips and label dots line up. */
  pipAngles: readonly number[];
}

/** Left orbit — Trusted sources. Sits to the left of the substrate.
 *  ADR-014 v4: same scene-unit radius as the substrate / right orbit
 *  so the three pillars read as three equal circles. `homeCentre.x`
 *  is set so the side orbits DO NOT intersect the substrate ring —
 *  centre distance (1.0) > sum-of-radii (0.96), giving a small clean
 *  gap of 0.04 scene units between rims. Earlier iterations used
 *  overlapping orbits (a space-map convention) but the overlap made
 *  the chamber content overflow into the substrate's read area;
 *  separating the rings keeps each chamber's content cleanly scoped
 *  to its own circle. `homeCentre.y` matches the substrate's
 *  shifted centre so all three rings sit on a common horizontal
 *  axis 6vh below the canvas centre. The CSS `--orbit-offset`
 *  variable is derived from `--ilayer-ring-radius` (with a 2.08
 *  multiplier matching this homeCentre.x / radius ratio) so the
 *  side chambers anchor at the same screen-x as the orbit centres
 *  in both R3F and static-fallback modes. */
export const LEFT_ORBIT: SideOrbit = {
  id: "left",
  homeCentre: [-1.0, -0.111, 0],
  radius: 0.48,
  color: "#caa554", // --gold — equal signal weight with the substrate
  opacity: 0.65,
  // Cardinal pips at top / right / bottom / left of the orbit.
  pipAngles: [0, 90, 180, 270],
};

/** Right orbit — Headless surfaces. Mirror of the left orbit. */
export const RIGHT_ORBIT: SideOrbit = {
  id: "right",
  homeCentre: [1.0, -0.111, 0],
  radius: 0.48,
  color: "#caa554",
  opacity: 0.65,
  pipAngles: [0, 90, 180, 270],
};

/** Both side orbits in a single iterable. */
export const SIDE_ORBITS: readonly SideOrbit[] = [LEFT_ORBIT, RIGHT_ORBIT];

// ────────────────────────────────────────────────────────────────────
// Decoration constants
// ────────────────────────────────────────────────────────────────────

/** Diamond marker size in scene units. Same as the previous ringfield. */
export const DIAMOND_SIZE = 0.04;

/** Ring segment count for the LineLoop circle approximation. */
export const RING_SEGMENTS = 96;

/** Sub-orbit autonomous rotation rate (radians per second). Kept
 *  for the optional faint substrate halo (a hairline circle inside
 *  the substrate ring that breathes independently of scroll). */
export const SUB_ORBIT_SPIN_RATE = 0.06;

// ────────────────────────────────────────────────────────────────────
// Orbital cluster geometry (ADR-014 v5)
// ────────────────────────────────────────────────────────────────────

/** Per-cluster concentric ring radii as a fraction of the cluster's
 *  outer radius. Five tapered rings give the cluster the "celestial
 *  diagram" topology referenced from the Definition section. The
 *  outermost ring (index 0) is the brandmark-ring sized to match the
 *  R3F substrate radius; inner rings step down by ~16% each. */
export const CLUSTER_RING_RADII: readonly number[] = [1.0, 0.84, 0.68, 0.52, 0.36];

/** Per-ring base opacity. The outermost reads as the primary edge;
 *  inner rings taper so the cluster has depth without competing for
 *  attention. Multiplied per-frame by the cluster's resolve scalar +
 *  presence. */
export const CLUSTER_RING_OPACITIES: readonly number[] = [0.85, 0.55, 0.35, 0.25, 0.2];

/** Per-cluster luminous dust-dot count. Deterministically placed
 *  around the ring stack at fixed polar coordinates so each cluster
 *  reads the same — no per-cluster randomness, the celestial diagram
 *  vocabulary is calm and ordered, not chaotic. */
export const CLUSTER_DUST_COUNT = 10;

/** Pixel size for each dust dot inside the R3F scene. Small enough
 *  that the dot reads as a pinpoint star, large enough to register
 *  at any viewport size without disappearing on hi-DPI displays. */
export const CLUSTER_DUST_SIZE_PX = 3.2;

/** Dust accent color — dawn at low alpha, multiplied by resolve +
 *  presence per frame. Kept slightly warmer than gold so the dust
 *  reads as starlight against the cluster's gold ring stack. */
export const CLUSTER_DUST_COLOR = "#e9d8a6";

/** Diamond opacity at full resolve. */
export const CLUSTER_DIAMOND_OPACITY = 0.9;

/** Dust dot opacity at full resolve. */
export const CLUSTER_DUST_OPACITY = 0.55;

// ────────────────────────────────────────────────────────────────────
// Cluster triad — the three pillars, equal radius
// ────────────────────────────────────────────────────────────────────

/** One pillar of the orbital triad. The three clusters share the
 *  same radius and structure (5 rings + 4 diamonds + dust); only
 *  centre and resolve-stagger phase differ. */
export interface ClusterSpec {
  id: "sources" | "substrate" | "surfaces";
  /** Scene-space centre. */
  centre: readonly [number, number, number];
  /** Outer-ring radius in scene units. */
  radius: number;
  /** Resolve stagger phase (offset added to resolveProgress). The mid
   *  cluster resolves first (phase 0); sides follow with a small
   *  delay so the eye reads "centre first, then sides flowering". */
  stagger: number;
}

/** Three pillars — equal radius, equal richness. Mid cluster shares
 *  the substrate centre so it sits exactly where the brandmark used
 *  to dock; side clusters anchor at ±1.0 scene units, identical to
 *  the previous LEFT_ORBIT / RIGHT_ORBIT homeCentre. */
export const CLUSTER_TRIAD: readonly ClusterSpec[] = [
  { id: "sources", centre: [-1.0, -0.111, 0], radius: 0.48, stagger: 0.04 },
  { id: "substrate", centre: [0, -0.111, 0], radius: 0.48, stagger: 0.0 },
  { id: "surfaces", centre: [1.0, -0.111, 0], radius: 0.48, stagger: 0.04 },
];

// ────────────────────────────────────────────────────────────────────
// Envelopes — orbit emerge / retract
// ────────────────────────────────────────────────────────────────────

/**
 * ORBIT_ENVELOPE — section-progress windows for the side orbits
 * (and the substrate shape blend, which the journey transform
 * shares with its own trapezoid).
 *
 *   EMERGE   [0.00 .. 0.18]: orbits slide from origin to home centre
 *                            and scale from 0 to 1 (geometric reveal,
 *                            Principle 4); brandmark blends full → ring.
 *   HOLD     [0.18 .. 0.85]: orbits parked at full; pips visible;
 *                            DOM labels cascade in via --ilayer-progress
 *                            thresholds in landing.css.
 *   RETRACT  [0.85 .. 1.00]: orbits slide back to origin and scale
 *                            to 0; brandmark blends ring → full.
 */
export const ORBIT_ENVELOPE = {
  emerge: { in: 0.0, out: 0.18 },
  retract: { in: 0.85, out: 1.0 },
};

/** Smoothstep — same shape as the GLSL builtin. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp to [0, 1]. */
export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * orbitEmerge — trapezoid envelope for the side-orbit reveal.
 *
 * Ramps 0 → 1 over the EMERGE window, holds at 1 through the read
 * beat, and ramps 1 → 0 over the RETRACT window. Per-frame the
 * OrbitField writes `group.scale.setScalar(orbitEmerge(progress))`
 * AND `group.position.lerpVectors(origin, homeCentre, orbitEmerge)`
 * so the orbit grows AND slides outward together.
 */
export function orbitEmerge(progress: number): number {
  if (progress <= ORBIT_ENVELOPE.emerge.in) return 0;
  if (progress >= ORBIT_ENVELOPE.retract.out) return 0;
  const emergeIn = smoothstep(ORBIT_ENVELOPE.emerge.in, ORBIT_ENVELOPE.emerge.out, progress);
  const retractOut = smoothstep(ORBIT_ENVELOPE.retract.in, ORBIT_ENVELOPE.retract.out, progress);
  return emergeIn * (1 - retractOut);
}

// ────────────────────────────────────────────────────────────────────
// Split + resolve envelopes (ADR-014 v5)
// ────────────────────────────────────────────────────────────────────

/** Phase windows inside the substrate-window progress (0-1):
 *
 *   ARRIVE   [0.00 .. 0.04]: brandmark vector ring is the visible
 *                            artefact. R3F SplitRing is invisible.
 *                            Brief — just enough for the user to
 *                            register the brandmark as the "before"
 *                            state before it morphs.
 *   HANDOFF  [0.04 .. 0.12]: brandmark vector ring fades out; R3F
 *                            SplitRing fades in at the same scale +
 *                            position. Visually identical-looking
 *                            ring throughout the crossfade.
 *   SPLIT    [0.12 .. 0.28]: SplitRing decomposes into three arcs
 *                            that translate from substrate centre to
 *                            the three chamber centres, tweening
 *                            their angular span 120° → 360° as they
 *                            arrive.
 *   RESOLVE  [0.22 .. 0.42]: cluster's inner rings + cardinal
 *                            diamonds + dust dots fade in, staggered
 *                            ring-by-ring with mid-cluster leading.
 *                            Overlaps slightly with SPLIT so the
 *                            handoff to the cluster's outer ring
 *                            doesn't leave a visual gap. After 0.42
 *                            the three clusters are at full resolve
 *                            and hold through the remainder of the
 *                            substrate window — ~58% of the window
 *                            is the held "answer" state the user
 *                            reads at while scrolling through the
 *                            chamber content. */
export const SUBSTRATE_PHASE = {
  arriveOut: 0.04,
  handoffOut: 0.12,
  splitOut: 0.28,
  resolveIn: 0.22,
  resolveOut: 0.42,
} as const;

export interface SubstratePhases {
  /** [0, 1] across HANDOFF window — drives the SplitRing's fade-in. */
  handoff: number;
  /** [0, 1] across SPLIT window — drives the SplitRing's arc geometry
   *  decomposition + translation. */
  split: number;
  /** [0, 1] across RESOLVE window — drives the cluster's inner-ring
   *  + diamond + dust opacity ramps. */
  resolve: number;
}

/** Decompose the substrate-window progress into the three local
 *  scalars driving the handoff, split, and resolve phases. Each
 *  returned scalar is clamped to [0, 1] and smoothed via smoothstep
 *  so phase transitions read as gentle easing rather than linear
 *  ramps. SPLIT and RESOLVE overlap slightly so the cluster's outer
 *  ring fades in before the SplitRing fully fades out — avoids a
 *  brief discontinuity at the SPLIT → RESOLVE boundary. After the
 *  resolveOut moment the three scalars stay at their settled values
 *  (handoff = 1, split = 1, resolve = 1) for the remainder of the
 *  substrate window — that's the held "answer" state. */
export function splitEnvelope(progress: number): SubstratePhases {
  return {
    handoff: smoothstep(SUBSTRATE_PHASE.arriveOut, SUBSTRATE_PHASE.handoffOut, progress),
    split: smoothstep(SUBSTRATE_PHASE.handoffOut, SUBSTRATE_PHASE.splitOut, progress),
    resolve: smoothstep(SUBSTRATE_PHASE.resolveIn, SUBSTRATE_PHASE.resolveOut, progress),
  };
}

/** Brandmark vector-ring opacity scalar inside the substrate window.
 *  Stays at 1 through the ARRIVE phase, ramps 1 → 0 across HANDOFF,
 *  then holds at 0 through SPLIT + RESOLVE. The vector actor reads
 *  this and multiplies it against its own effectiveOpacity so the
 *  crossfade with the R3F SplitRing reads as a single artefact
 *  morphing rather than two artefacts swapping. */
export function vectorRingOpacity(progress: number): number {
  if (progress <= SUBSTRATE_PHASE.arriveOut) return 1;
  if (progress >= SUBSTRATE_PHASE.handoffOut) return 0;
  return 1 - smoothstep(SUBSTRATE_PHASE.arriveOut, SUBSTRATE_PHASE.handoffOut, progress);
}

/** Per-ring resolve scalar (0-1) inside one cluster. Each ring fades
 *  in with a small stagger so the cluster reads as "blooming inward"
 *  — outermost ring first (matches the SplitRing it inherits from),
 *  then inner rings cascade. The cluster-level stagger phase shifts
 *  this curve forward/backward so the mid cluster leads the sides. */
export function clusterRingResolve(
  resolveProgress: number,
  ringIndex: number,
  clusterStagger: number
): number {
  const ringStagger = ringIndex * 0.08;
  const phase = clamp01(resolveProgress - clusterStagger - ringStagger);
  return smoothstep(0, 0.55, phase);
}

// ────────────────────────────────────────────────────────────────────
// Legacy — deprecated rotation channel
// ────────────────────────────────────────────────────────────────────

/**
 * splitRotation — DEPRECATED (ADR-014 supersedes ADR-012 v5).
 *
 * The orbital triad is front-on; there is no Y-axis rotation arc.
 * Kept exported as a no-op stub so `lib/brandmark/journey.ts` can
 * keep calling it without conditional branches; the painter's
 * `uRotationY` uniform stays at 0 throughout the substrate window.
 *
 * Will be removed once the journey module drops the import.
 */
export function splitRotation(_progress: number): number {
  return 0;
}

// ────────────────────────────────────────────────────────────────────
// Encode-rect channel — retained for back-compat with the static
// fallback measurement path. No longer driven by the R3F scene.
// ────────────────────────────────────────────────────────────────────

/** A reported screen-space rect, in client (CSS) pixels. */
export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface IlayerGeomState {
  /** Live screen-projected rect of the substrate dock. Retained as
   *  a back-compat channel for any consumer still reading the
   *  pre-ADR-014 encode rect; new code should read the brandmark
   *  journey transform directly. */
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
