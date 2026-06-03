/**
 * corridorMap — declarative topology kernel for the home-v2 depth
 * corridor (ADR-018).
 *
 * This module is the SINGLE SOURCE OF TRUTH for the corridor's
 * structure: an ordered list of nodes (parked `station`s and the
 * `transition` legs between them). Everything structural is DERIVED
 * from `CORRIDOR_MAP`:
 *
 *   - the `Beat` union + `BEAT_ORDER`
 *   - `BEAT_WINDOWS` (each node's [start,end] tiling of [0,1])
 *   - `BEAT_PARK_CENTRES` (where each parked station rests)
 *   - `STATIONS` (solved world-Z gate stations)
 *   - `SECTOR_LABELS` (HUD readout per beat)
 *   - the camera dolly hold (`DOLLY_HOLD_END`)
 *
 * Adding / moving / reweighting a station or transition is therefore a
 * DATA edit here — windows re-tile, park centres re-centre, and gate
 * Z re-solves automatically. The choreography fine-tuning (brandmark
 * travel, camera chase, approach offsets) still lives in
 * `sceneGeom.CORRIDOR_TIMELINE` and is calibrated by hand when the
 * topology grows.
 *
 * Layering: this kernel has NO imports from `sceneGeom` or the store —
 * both import FROM here. The math helpers + camera-path constants live
 * here (rather than in the store) so the store can derive its beat
 * layout from the map without a cycle. The store re-exports the
 * derived beat symbols for back-compat; `sceneGeom` re-exports the
 * camera/station symbols.
 *
 * Coordinate convention matches `sceneGeom`: +Z toward the viewer, the
 * camera sits at large +Z and dollies toward -Z across the stage.
 */

export type Vec3 = readonly [number, number, number];

// ── Shared math (kept here so the kernel is dependency-free) ─────────

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ── Camera path constants (shared with sceneGeom) ───────────────────

/** Camera position at progress = 0 (start of corridor), on the axis. */
export const CAMERA_START: [number, number, number] = [0, 0, 10];

/** Camera position at progress = 1 (end of corridor), on the axis.
 *  Deepened -8 → -11.5 (Refinement 3), then -11.5 → -14 (entry/section
 *  spacing pass) to lengthen the whole corridor so each section sits
 *  further apart in depth — the "entering a new realm" feel. Because
 *  every gate Z re-solves from `gateZAtParkProgress` and all
 *  choreography is progress-keyed (CORRIDOR_TIMELINE windows in 0..1),
 *  deepening the dolly only stretches the *world* spacing between beats
 *  — timing stays valid. The one absolute-Z consumer that does NOT
 *  follow is `AstrogationField`'s seed positions, re-spread to populate
 *  the deeper corridor. */
export const CAMERA_END: [number, number, number] = [0, 0, -14];

/** Distance the camera sits in FRONT of a gate when that gate is
 *  parked (centred). Picked so the gate's halfExtent comfortably fills
 *  the viewport at FOV ~38°. */
export const GATE_PARK_DISTANCE = 4.5;

// ── Node model ───────────────────────────────────────────────────────

/** Which gate component renders at a station / waypoint. Consumed by
 *  `GatewayWorld`. */
export type GateKind = "compass" | "navigate" | "orbits" | "interstitial" | "sphere";

interface NodeBase {
  /** Stable beat id. Also the `Beat` union member. */
  id: string;
  /** HUD sector readout shown while this beat is current. */
  label: string;
}

/** Concise, executive section copy rendered (and projected) at a
 *  station. The opening Thoughtform/setup beat is the exception — its
 *  spine copy still flows through `V7CorridorText` and is left
 *  untouched. */
export interface NodeContent {
  /** Eyebrow / kicker, e.g. "02 · Encode". */
  kicker: string;
  /** Heading (may contain inline `<em>`). */
  titleHtml: string;
  /** Optional one-line supporting clause (may contain `<em>`). */
  supportHtml?: string;
}

export interface StationNode extends NodeBase {
  kind: "station";
  /** Relative weight of this station's parked scroll window. */
  dwell: number;
  /** Where in the window the camera parks (0..1, default 0.5). */
  parkBias?: number;
  /** World-X offset of the gate centre (off-axis composition). */
  lateralX: number;
  halfExtent: number;
  gate: GateKind;
  /** True if the brandmark rests at this station's centre. */
  brandmarkAnchor?: boolean;
  /** Section copy rendered at this station (Encode/Build/Navigate).
   *  Omitted for the opening setup beat, which keeps its v7 spine
   *  copy. */
  content?: NodeContent;
}

/** An optional fly-through landmark sitting INSIDE a transition leg
 *  (the camera passes through it, it is not a parked beat). Carries
 *  optional section copy + lateral offset so a landmark like the
 *  Navigate gate can present a titled "place" mid-corridor without
 *  re-tiling the beat windows. */
export interface TransitionWaypoint {
  id: string;
  /** Where in the transition window the waypoint sits (0..1). */
  parkBias: number;
  halfExtent: number;
  gate: GateKind;
  /** World-X offset of the landmark centre (default 0 = on-axis). */
  lateralX?: number;
  /** Section copy rendered at this landmark (e.g. Navigate). */
  content?: NodeContent;
}

export interface TransitionNode extends NodeBase {
  kind: "transition";
  /** Relative weight of this travel window. */
  travel: number;
  waypoint?: TransitionWaypoint;
}

export type CorridorNode = StationNode | TransitionNode;

// ── THE MAP ──────────────────────────────────────────────────────────
//
// 7-node topology. Weights sum to 100.
//
// Entry / section-spacing pass: the ENTRY flythrough (`pass-01a`) was
// grown 10 → 17 so you fly noticeably deeper into the corridor before
// the Navigate text appears (previously it arrived almost immediately,
// breaking the "entering a new realm" immersion). `pass-01b` 11 → 12
// adds a little Navigate→Encode room. Funded by trimming the long
// `intelligence` dwell 24 → 17 and `thoughtform` 14 → 13. Combined with
// the deeper CAMERA_END (-14), every section now sits further apart in
// depth.
//
// NOTE: this DOES shift the `diagnostic`-onward windows later (≈+0.07),
// which previously had to stay byte-identical to preserve
// CORRIDOR_TIMELINE. That invariant was deliberately broken here — the
// coupled choreography breakpoints in `sceneGeom.CORRIDOR_TIMELINE` (and
// the wormhole/contour leg-reveal windows + ThoughtformAtmosphere boot
// fade) were re-tuned in lockstep to the new windows. If you re-weight
// again, re-tune those together.
//
// Current windows: thoughtform [0,.13] · pass-01a [.13,.30] · navigate
// [.30,.41] (park .355) · pass-01b [.41,.53] · diagnostic [.53,.67]
// (park .60) · passthrough-02 [.67,.83] (interstitial waypoint .67+
// .1875·.16 = .70) · intelligence [.83,1] (park .915).

export const CORRIDOR_MAP = [
  {
    kind: "station",
    id: "thoughtform",
    label: "Navigate",
    dwell: 13,
    parkBias: 0.5,
    lateralX: 1.1,
    halfExtent: 1.6,
    gate: "compass",
    brandmarkAnchor: true,
  },
  // Navigate's "place" is now a PARKED station (the camera pauses in
  // front of it like Encode/Build), carved out of the old single
  // `passthrough-01` leg WITHOUT changing the total weight: the three
  // weights below sum to 32 (the old leg's travel), so every beat from
  // `diagnostic` onward — and the whole CORRIDOR_TIMELINE — stays
  // byte-identical. `pass-01a` flies the camera in, `navigate` is the
  // brief park, `pass-01b` is the shorter exit toward Encode. All three
  // are labelled "Navigate" so the HUD sector readout reads "Navigate"
  // continuously across the leg. Primary preview knob: the 12/12/8
  // split (keep the sum at 32) and the navigate `parkBias`.
  { kind: "transition", id: "pass-01a", label: "Navigate", travel: 17 },
  {
    kind: "station",
    id: "navigate",
    label: "Navigate",
    dwell: 11,
    parkBias: 0.5,
    lateralX: 0,
    halfExtent: 1.5,
    gate: "navigate",
    content: {
      kicker: "01 · Navigate",
      titleHtml: "Navigate the <em>intelligence</em>.",
      supportHtml:
        "AI isn't software. It's intelligence that sits between <em>tool</em> and <em>collaborator</em>.",
    },
  },
  { kind: "transition", id: "pass-01b", label: "Navigate", travel: 12 },
  {
    kind: "station",
    id: "diagnostic",
    label: "Encode",
    dwell: 14,
    parkBias: 0.5,
    lateralX: 0,
    halfExtent: 2.2,
    gate: "orbits",
    content: {
      kicker: "02 · Encode",
      titleHtml: "Encode the <em>judgment</em>.",
      supportHtml: "Turn what makes the work good into substrate the intelligence inherits.",
    },
  },
  {
    kind: "transition",
    id: "passthrough-02",
    label: "Build",
    travel: 16,
    waypoint: { id: "interstitial", parkBias: 0.1875, halfExtent: 1.8, gate: "interstitial" },
  },
  {
    kind: "station",
    id: "intelligence",
    label: "Substrate",
    dwell: 17,
    parkBias: 0.5,
    lateralX: 0,
    halfExtent: 2.0,
    gate: "sphere",
    brandmarkAnchor: true,
    content: {
      kicker: "03 · Build",
      titleHtml: "Build on the <em>substrate</em>.",
      supportHtml: "Tools and workflows that run on their own.",
    },
  },
] as const satisfies readonly CorridorNode[];

// ── Derived: beat order + union ──────────────────────────────────────

export type Beat = (typeof CORRIDOR_MAP)[number]["id"];

/** Typed view of the map for iteration. The `as const` literal type
 *  omits absent optional fields (e.g. `waypoint`), so reading those
 *  needs a `CorridorNode` view. `Beat` still derives from the literal
 *  `typeof CORRIDOR_MAP` above. */
const NODES: readonly CorridorNode[] = CORRIDOR_MAP;

export const BEAT_ORDER: Beat[] = CORRIDOR_MAP.map((n) => n.id);

const weightOf = (n: CorridorNode): number => (n.kind === "station" ? n.dwell : n.travel);

// ── Derived: beat windows (tile [0,1] by weight) ─────────────────────

export const BEAT_WINDOWS: { beat: Beat; start: number; end: number }[] = (() => {
  const total = CORRIDOR_MAP.reduce((s, n) => s + weightOf(n), 0);
  const out: { beat: Beat; start: number; end: number }[] = [];
  let acc = 0;
  for (const n of CORRIDOR_MAP) {
    const w = weightOf(n) / total;
    out.push({ beat: n.id, start: acc, end: acc + w });
    acc += w;
  }
  // Pin the final edge exactly to 1 (guard against float drift).
  if (out.length) out[out.length - 1].end = 1;
  return out;
})();

const windowIndexById = (id: string): number => CORRIDOR_MAP.findIndex((n) => n.id === id);

/** The beat window for a given node id. */
export function windowFor(id: Beat): { start: number; end: number } {
  return BEAT_WINDOWS[windowIndexById(id)];
}

// ── Derived: park centres (parked stations only) ─────────────────────

export const BEAT_PARK_CENTRES: Partial<Record<Beat, number>> = (() => {
  const out: Partial<Record<Beat, number>> = {};
  CORRIDOR_MAP.forEach((n, i) => {
    if (n.kind !== "station") return;
    const w = BEAT_WINDOWS[i];
    out[n.id] = w.start + (n.parkBias ?? 0.5) * (w.end - w.start);
  });
  return out;
})();

// ── Derived: HUD sector labels per beat ──────────────────────────────

export const SECTOR_LABELS: Record<Beat, string> = (() => {
  const out = {} as Record<Beat, string>;
  for (const n of CORRIDOR_MAP) out[n.id] = n.label;
  return out;
})();

// ── Camera dolly hold + station-Z solver ─────────────────────────────

/** Camera Z is HELD across the first station's window (the parked
 *  setup beat), then dollies. Derived from the map so it tracks the
 *  setup window edge even as the topology grows — never hardcode. */
export const DOLLY_HOLD_END = BEAT_WINDOWS[0].end;

/** Camera Z dolly easing — held at 0 across the setup window, then
 *  smoothstep'd 0 -> 1 across the remaining scroll. Shared by the
 *  runtime camera-position function (`sceneGeom.getCameraPosition`)
 *  and `gateZAtParkProgress`, so gates stay consistent with the live
 *  camera at every parked beat. */
export function cameraZDollyT(progress: number): number {
  const p = clamp01(progress);
  if (p <= DOLLY_HOLD_END) return 0;
  return smoothstep(0, 1, (p - DOLLY_HOLD_END) / (1 - DOLLY_HOLD_END));
}

/** Solve a gate's world Z so that at `parkProgress` the camera sits
 *  GATE_PARK_DISTANCE units in front of it (the parked-beat
 *  invariant), using the same dolly curve as the live camera. */
export function gateZAtParkProgress(parkProgress: number): number {
  const camZ = lerp(CAMERA_START[2], CAMERA_END[2], cameraZDollyT(parkProgress));
  return camZ - GATE_PARK_DISTANCE;
}

// ── Derived: solved gate stations ────────────────────────────────────

export interface GateStation {
  id: string;
  /** World position of the gate's centre. */
  position: [number, number, number];
  /** Approximate world half-extent (XY) for sizing geometry. */
  halfExtent: number;
  /** Camera progress at which the gate is parked / centred. */
  parkProgress: number;
  gate: GateKind;
  /** Section copy for this station (undefined for the setup beat and
   *  for waypoints). */
  content?: NodeContent;
}

/** Every renderable gate position — parked stations AND transition
 *  waypoints — solved to world Z. */
export const STATIONS: GateStation[] = (() => {
  const out: GateStation[] = [];
  NODES.forEach((n, i) => {
    const w = BEAT_WINDOWS[i];
    if (n.kind === "station") {
      const park = w.start + (n.parkBias ?? 0.5) * (w.end - w.start);
      out.push({
        id: n.id,
        position: [n.lateralX, 0, gateZAtParkProgress(park)],
        halfExtent: n.halfExtent,
        parkProgress: park,
        gate: n.gate,
        content: n.content,
      });
    } else if (n.waypoint) {
      const park = w.start + n.waypoint.parkBias * (w.end - w.start);
      out.push({
        id: n.waypoint.id,
        position: [n.waypoint.lateralX ?? 0, 0, gateZAtParkProgress(park)],
        halfExtent: n.waypoint.halfExtent,
        parkProgress: park,
        gate: n.waypoint.gate,
        content: n.waypoint.content,
      });
    }
  });
  return out;
})();

export function stationById(id: string): GateStation | undefined {
  return STATIONS.find((s) => s.id === id);
}

/** Interstitial waypoint park centre — re-exported so
 *  `sceneGeom.CORRIDOR_TIMELINE` can reference it without re-deriving. */
export const INTERSTITIAL_PARK = stationById("interstitial")?.parkProgress ?? 0.63;

// ── Transition legs (consumed by the wormhole + intergate bands) ─────

export interface CorridorLeg {
  id: string;
  fromStationId: string;
  toStationId: string;
  /** The transition's scroll window (drives reveal envelopes). */
  window: { start: number; end: number };
}

/** Ordered travel legs between successive parked landmarks (stations
 *  and waypoints both count as landmarks the camera flies between). */
export function corridorLegs(): CorridorLeg[] {
  const legs: CorridorLeg[] = [];
  for (let i = 0; i < CORRIDOR_MAP.length; i++) {
    const n = CORRIDOR_MAP[i];
    if (n.kind !== "transition") continue;
    // Nearest landmark before and after this transition.
    const before = nearestLandmarkId(i, -1);
    const after = nearestLandmarkId(i, +1);
    if (!before || !after) continue;
    legs.push({ id: n.id, fromStationId: before, toStationId: after, window: BEAT_WINDOWS[i] });
  }
  return legs;
}

/** Walk outward from a transition index to the nearest node that has a
 *  solved station (a parked station, or a transition carrying a
 *  waypoint). Returns that landmark's station id. */
function nearestLandmarkId(fromIndex: number, dir: 1 | -1): string | undefined {
  for (let i = fromIndex + dir; i >= 0 && i < NODES.length; i += dir) {
    const n = NODES[i];
    if (n.kind === "station") return n.id;
    if (n.kind === "transition" && n.waypoint) return n.waypoint.id;
  }
  return undefined;
}

// ── Beat resolution (moved from the store; pure topology) ────────────

/** Resolve which beat a global progress value sits in, plus the
 *  beat-local 0..1 progress inside that beat's window. */
export function resolveBeat(progress: number): { beat: Beat; gateProgress: number } {
  const p = clamp01(progress);
  for (const w of BEAT_WINDOWS) {
    if (p <= w.end) {
      const span = Math.max(1e-6, w.end - w.start);
      return { beat: w.beat, gateProgress: clamp01((p - w.start) / span) };
    }
  }
  const last = BEAT_WINDOWS[BEAT_WINDOWS.length - 1];
  return { beat: last.beat, gateProgress: 1 };
}
