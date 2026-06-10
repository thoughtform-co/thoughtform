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
 *  spacing pass), and -14 → -17 (entry buildup pass, 2026-06-08) so the
 *  pass-01a flythrough between Thoughtform and Navigate covers more
 *  world distance — the gyro reads as "approaching from depth" rather
 *  than assembling immediately on portal entry. Because every gate Z
 *  re-solves from `gateZAtParkProgress` and all choreography is
 *  progress-keyed (CORRIDOR_TIMELINE windows in 0..1), deepening the
 *  dolly only stretches the *world* spacing between beats — timing
 *  stays valid. The two absolute-Z consumers that need to follow are
 *  `StaticStarfield`'s star Z range (pushed back so the deepest gate
 *  stays in front of the stars) and `AstrogationField`'s seed
 *  positions (already spread across the corridor; deepest seeds still
 *  fly past during the Build approach). */
export const CAMERA_END: [number, number, number] = [0, 0, -17];

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
  /** Optional pseudo-telemetry block rendered around the station's
   *  HUD readout cluster (header row + status prefix). All fields
   *  are short uppercase strings; the StationTitle component
   *  composes them as `sector // callsign  ·  code  ·  metric  [status]`.
   *  Invented but plausible — keeps the in-world instrument grammar
   *  consistent while staying data-driven (no hardcoded copy in the
   *  component / CSS). */
  telemetry?: StationTelemetry;
}

/** Short, mono-uppercase readout fragments for the station HUD
 *  cluster. Each field is intentionally compact (<= ~10 chars) so
 *  the header row stays on a single line at every viewport.
 *
 *  - `sector`   : station ordinal, e.g. "STATION 01"
 *  - `callsign` : verb/role glyph, e.g. "NAV-01" / "ENC-02" / "BLD-03"
 *  - `code`     : ID code, e.g. "ID NX-01"
 *  - `metric`   : a single live-looking metric, e.g. "BRG 312°" / "DPT 0.53" / "RUN 24/7"
 *  - `status`   : terminal state badge, e.g. "LOCKED" / "ENCODING" / "LIVE"
 */
export interface StationTelemetry {
  sector: string;
  callsign: string;
  code: string;
  status: string;
  metric: string;
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
  /** Distance the camera sits in front of this gate when parked
   *  (world units along the corridor axis). Defaults to
   *  `GATE_PARK_DISTANCE` (4.5). Larger values push the gate deeper
   *  in world Z — since the camera path is fixed, the camera ends
   *  up further away and the gate reads SMALLER in frame, opening
   *  oversight margin around the parked composition. Used by the
   *  shell parks (Navigate / Encode / Build) so the accreted shell
   *  reads with breathing room instead of filling the viewport. */
  parkDistance?: number;
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
  /** Distance the camera sits in front of this waypoint when it is
   *  the focal point (world units). Defaults to `GATE_PARK_DISTANCE`. */
  parkDistance?: number;
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
// Entry / section-spacing pass: the ENTRY flythrough (`pass-01a`) is the
// long pure-wormhole stretch you fly through before arriving at the
// first gate. It has been grown multiple times so you genuinely travel
// the corridor before the Navigate gate + text appear. The Navigate copy
// is ALSO gated out of `pass-01a` (see its `visibilityBeats` in
// sceneGeom) so the flythrough stays text-free.
//
// IMPORTANT: pass-01a is funded ENTIRELY from the other FRONT legs
// (thoughtform/navigate/pass-01b), keeping the front total at 53 so the
// `diagnostic`-onward windows stay byte-identical — the back-half
// CORRIDOR_TIMELINE choreography is therefore untouched. Only the FRONT
// timeline values (pan, boot, ring flythrough, brandmark thoughtformHold)
// + the front leg-reveal windows were re-tuned. Combined with the deeper
// CAMERA_END (-17 after the 2026-06-08 entry-buildup pass) every section
// also sits further apart in depth.
//
// Current windows after the 2026-06-08 entry-buildup pass:
// thoughtform [0,.109] · pass-01a [.109,.355] · navigate [.355,.445]
// (park .40) · pass-01b [.445,.573] · diagnostic [.573,.70]
// (park .636) · passthrough-02 [.70,.845] (interstitial waypoint ≈.727)
// · intelligence [.845,1] (park .923).
//
// Navigate→Encode travel pass (2026-06-04): pass-01b was widened
// 8 → 14 and pass-01a trimmed 23 → 17 (net 0, front total still 53).
// The Navigate park therefore reads, then you genuinely TRAVEL a
// longer leg before Encode arrives, instead of Encode appearing
// almost immediately after Navigate. Because the swap stays inside
// the front legs, `diagnostic`-onward windows + the back-half
// CORRIDOR_TIMELINE are byte-identical — only the Navigate park
// (.40 → .34) and the pass-01b span moved.

export const CORRIDOR_MAP = [
  {
    kind: "station",
    id: "thoughtform",
    label: "Navigate",
    dwell: 12,
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
  // continuously across the leg. Primary preview knob: the
  // pass-01a / navigate / pass-01b split (keep the sum at 32) and the
  // navigate `parkBias`. pass-01a 17 + navigate 10 + pass-01b 14 = 41,
  // plus thoughtform 12 = front total 53 (unchanged).
  { kind: "transition", id: "pass-01a", label: "Navigate", travel: 27 },
  {
    kind: "station",
    id: "navigate",
    label: "Navigate",
    dwell: 10,
    parkBias: 0.5,
    lateralX: 0,
    halfExtent: 1.5,
    gate: "navigate",
    // Pull the camera back at the Navigate park (4.5 -> 6.2 world
    // units in front of the gate) so the accreted substrate cage +
    // brand mark read with breathing room, matching the lab
    // `NestedShellSphere` oversight framing. Lab-match revision
    // (2026-06-05).
    parkDistance: 6.2,
    content: {
      kicker: "01 · Navigate",
      titleHtml: "Navigate the <em>intelligence</em>.",
      // W2 (plan 03adb0dd) replaced "AI isn't software. It's
      // intelligence that sits between tool and collaborator." which
      // violated the strategy skill's voice rule against the
      // "X is not Y, it is Z" construction. The 2026-06-08 follow-up
      // named the trained-on-us-but-alien framing and the
      // command→navigate shift; gold em on "navigating" reinforces
      // the station verb.
      //
      // Stack v3 caption pass (2026-06-10): condensed for the centred
      // cartouche. Polish round 4: the `<br>` is a deliberate
      // sentence-per-line break — CorridorStationHeaders splits on it
      // and renders each line as a block, so the caption reads as two
      // clean balanced lines instead of an awkward wrap.
      supportHtml:
        "Trained on us, but it doesn't think like us.<br>So you stop commanding and start <em>navigating</em> — where it leads, and where you do.",
      telemetry: {
        sector: "STATION 01",
        callsign: "NAV-01",
        code: "ID NX-01",
        status: "LOCKED",
        metric: "BRG 312°",
      },
    },
  },
  { kind: "transition", id: "pass-01b", label: "Navigate", travel: 14 },
  {
    kind: "station",
    id: "diagnostic",
    label: "Encode",
    dwell: 14,
    parkBias: 0.5,
    lateralX: 0,
    halfExtent: 2.2,
    gate: "orbits",
    // Pull the camera back at the Encode park (4.5 -> 6.2 world
    // units) so the accreted judgment orbits + substrate cage read with
    // oversight margin (lab-match revision).
    parkDistance: 6.2,
    content: {
      kicker: "02 · Encode",
      titleHtml: "Encode the <em>judgment</em>.",
      // 2026-06-08 copy pass — frames encoding as moving tacit
      // judgment out of people's heads into something the model can
      // inherit. Gold em on "brief" names the encoded artefact.
      // Stack v3 caption pass (2026-06-10): condensed for the
      // centred cartouche while keeping the heads-to-brief beat.
      // Polish round 4: `<br>` = sentence-per-line break.
      supportHtml:
        "The judgment that makes your work good was stuck in heads.<br>Now it's a <em>brief</em> the model inherits instead of guessing.",
      telemetry: {
        sector: "STATION 02",
        callsign: "ENC-02",
        code: "ID EN-02",
        status: "ENCODING",
        metric: "DPT 0.53",
      },
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
    // Pull the camera back at the Build landing (4.5 -> 6.2 world
    // units) so the fully-assembled layer + stack funnel read with
    // oversight, matching the lab FUNNEL variant's clean framing
    // instead of filling the viewport (lab-match revision).
    parkDistance: 6.2,
    content: {
      kicker: "03 · Build",
      titleHtml: "Build on the <em>substrate</em>.",
      // 2026-06-08 copy pass — lands on durable ownership: encoded
      // judgment becomes capability that runs across every surface
      // and outlives any single model. Gold em on "owned capability"
      // mirrors the Thoughtform spine "...until they own it."
      // Stack v3 caption pass (2026-06-10): condensed for the
      // centred cartouche while keeping ownership + survives-the-
      // next-model anchor. Polish round 4: `<br>` = sentence-per-
      // line break.
      supportHtml:
        "Encoded once, it's <em>owned capability</em> — running across chat, agents, and your own apps.<br>And surviving the next model.",
      telemetry: {
        sector: "STATION 03",
        callsign: "BLD-03",
        code: "ID SB-03",
        status: "LIVE",
        metric: "RUN 24/7",
      },
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
 *  `parkDistance` units in front of it (the parked-beat invariant),
 *  using the same dolly curve as the live camera. `parkDistance`
 *  defaults to `GATE_PARK_DISTANCE`; the shell parks
 *  (Navigate / Encode / Build) pass a larger value to push the gate
 *  deeper in world Z, opening oversight margin around the parked
 *  shell composition (lab-match revision). */
export function gateZAtParkProgress(
  parkProgress: number,
  parkDistance: number = GATE_PARK_DISTANCE
): number {
  const camZ = lerp(CAMERA_START[2], CAMERA_END[2], cameraZDollyT(parkProgress));
  return camZ - parkDistance;
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
  /** Distance the camera sits in front of this gate when parked.
   *  Defaults to `GATE_PARK_DISTANCE`; the shell parks override it
   *  to ~6.2 for oversight framing. Consumers that need to know how
   *  far the camera is from a parked gate (brand-mark lead math,
   *  copy-anchor reference distances) read this rather than
   *  hardcoding 4.5. */
  parkDistance: number;
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
      const parkDistance = n.parkDistance ?? GATE_PARK_DISTANCE;
      out.push({
        id: n.id,
        position: [n.lateralX, 0, gateZAtParkProgress(park, parkDistance)],
        halfExtent: n.halfExtent,
        parkProgress: park,
        parkDistance,
        gate: n.gate,
        content: n.content,
      });
    } else if (n.waypoint) {
      const park = w.start + n.waypoint.parkBias * (w.end - w.start);
      const parkDistance = n.waypoint.parkDistance ?? GATE_PARK_DISTANCE;
      out.push({
        id: n.waypoint.id,
        position: [n.waypoint.lateralX ?? 0, 0, gateZAtParkProgress(park, parkDistance)],
        halfExtent: n.waypoint.halfExtent,
        parkProgress: park,
        parkDistance,
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
