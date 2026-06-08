/**
 * shellGeom — corridor-tuned constants for the brandmark's accreted
 * shell (substrate core, Encode cardinal primitives, Build stack dock).
 *
 * The accretion shell follows the guiding-star brandmark as it flies
 * Navigate -> Encode -> Build down the depth corridor (ADR-018). Each
 * layer emerges geometrically on its phase window and PERSISTS so the
 * mark visibly accumulates the intelligence layer and lands on the
 * fully-assembled stack at the Build station.
 *
 *   - Substrate compass wraps the brandmark (Navigate).
 *   - Judgment primitives on four compass cardinals (Encode).
 *   - Stack funnel lanes + fan dock sources left / surfaces right (Build).
 */

import {
  COLOR_GOLD,
  COLOR_SURFACES,
} from "@/components/landing/intelligence-artifact/artifactGeom";

// ── Substrate core (inside-out layer 1) ──────────────────────────────

/** Substrate layer outer geodesic radius. The Encode primitive array MUST
 *  sit outside this radius (see `PLUG_INNER_R` invariant below) so
 *  the cardinal spokes visibly wrap the substrate rather than cutting
 *  through it.
 *
 *  EVOLUTION:
 *  - Originally the dodecahedron cage radius (`SUBSTRATE_DODEC_RADIUS`).
 *  - Renamed to `SUBSTRATE_CAGE_RADIUS` on 2026-06-05 when the cage
 *    became an 80-face geodesic icosphere.
 *  - On 2026-06-06 the brain-artifact experiments moved to the lab
 *    (`/test/intelligence-artifact`) and the homepage returned to
 *    this Shell-variant outer gold geodesic only.
 *  - Tuned 0.70 -> 0.42 after the particle substrate was removed so
 *    the shell is sized against the persistent DOM brandmark (roughly
 *    the lab Shell ratio: geodesic radius ≈ 1.2-1.35x brandmark
 *    half-extent), not against the retired 0.55 particle sphere. */
export const SUBSTRATE_CAGE_RADIUS = 0.42;

// ── Navigate substrate compass (2026-06-07 revision) ───────────────
//
// The gold geodesic icosphere is replaced by the migrated Thoughtform
// compass read (4 rings + bearings + eight-ball horizon/attitude cue).
// Ring radii reproduce the opening-beat compass EXACTLY (v7 SVG units
// / 200) so the instrument frames the brandmark with the same
// proportions as the previous second section. The brandmark world
// half-extent at the Navigate park (~0.30) is within 6% of the
// Thoughtform park (0.32), so the same radii read as the same framing.
//
// NOTE: the compass outer ring (0.75) now extends past
// SUBSTRATE_CAGE_RADIUS (0.42, the old geodesic boundary). The flat
// Encode plug array shares the same XY plane as the compass; plug
// inner radius (`PLUG_INNER_R`) sits just outside the outer ring.

/** Four concentric compass ring radii (world units), matching the
 *  opening-beat compass [150, 126, 104, 78] / 200. */
export const SUBSTRATE_COMPASS_RING_RADII = [0.75, 0.63, 0.52, 0.39] as const;

export const SUBSTRATE_COMPASS_RING_SEGMENTS = 96;

/** Per-ring opacity weight. Pushed well above the opening-beat compass
 *  so the migrated rings read as a present instrument around the mark
 *  at Navigate (no boot boost / brighter-brandmark backdrop here). */
export const SUBSTRATE_COMPASS_RING_ALPHA = [0.62, 0.68, 0.92, 1.0] as const;

/** Per-ring dash pattern (world units). `null` = solid. */
export const SUBSTRATE_COMPASS_RING_DASH: ({ dashSize: number; gapSize: number } | null)[] = [
  { dashSize: 0.005, gapSize: 0.025 },
  null,
  { dashSize: 0.01, gapSize: 0.035 },
  { dashSize: 0.005, gapSize: 0.015 },
];

/** Bearing crosshair + tick radii (world units), matching the
 *  opening-beat compass. */
export const SUBSTRATE_COMPASS_CROSSHAIR_INNER = 0.65;
export const SUBSTRATE_COMPASS_CROSSHAIR_OUTER = 0.75;
export const SUBSTRATE_COMPASS_TICK_INNER = 0.72;
export const SUBSTRATE_COMPASS_TICK_OUTER = 0.75;

/** Atmosphere orbit dots — gold at r=0.52, dawn at r=0.39 (v7 read). */
export const SUBSTRATE_COMPASS_ORBIT_DOT_1 = {
  radius: 0.52,
  size: 0.0125,
  alpha: 0.9,
  angularVelocity: -((2 * Math.PI) / 180),
} as const;
export const SUBSTRATE_COMPASS_ORBIT_DOT_2 = {
  radius: 0.39,
  size: 0.009,
  alpha: 0.6,
  angularVelocity: (2 * Math.PI) / 120,
} as const;

/** Cardinal diamond size (world units) — small N/E/S/W bearing markers
 *  just outside the outer ring. (The eight-ball horizon / pitch-ladder
 *  attitude read was removed 2026-06-07 — the tilted ellipses competed
 *  with the flat compass; only these flat markers remain.) */
export const SUBSTRATE_COMPASS_CARDINAL_DIAMOND = 0.03;

/** Slow breath spin for the whole instrument (matches the opening
 *  compass `group.rotation.z = elapsed * 0.012`). */
export const SUBSTRATE_COMPASS_BREATH_RATE = 0.012;

/** Shell material opacity at full presence. */
export const SUBSTRATE_COMPASS_SHELL_OPACITY = 1.0;

// NOTE: `SUBSTRATE_INNER_RADIUS` (faint dawn inner geodesic) was
// removed in the 2026-06-06 wrap-around revision (Phase 2). Keep the
// homepage substrate as ONE gold geodesic — no inner white/dawn shell.

// ── Encode cardinal primitives (inside-out layer 2) ────────────────

/** One encoded primitive on a compass cardinal — the direction you
 *  navigate by (Judgment / Taste / Way of working / Voice). Flat in
 *  the XY plane, aligned to the Navigate compass N/E/S/W diamonds. */
export interface ShellPrimitive {
  id: string;
  label: string;
  sub: string;
  angleRad: number;
  nodeRadius: number;
  color: number;
  baseAlpha: number;
}

/** A captured "note" — raw material compared against a primitive. */
export interface ShellNote {
  id: string;
  angleRad: number;
  captureR: number;
  targetIdx: number;
  radius: number;
  seatOffset: number;
  color: number;
  baseAlpha: number;
}

/** Inner rim radius where primitive spokes begin — just outside the
 *  compass outer ring (0.75). */
export const PLUG_INNER_R = 0.82;

/** Radius of each primitive node on its cardinal axis. */
export const PRIMITIVE_NODE_R = 1.15;

/** Default outer capture radius for notes. */
export const NOTE_CAPTURE_R = 1.5;

/** Encode slot dock ring radius. A second outer ring (in addition to
 *  the compass outer ring at 0.75) carries four cardinal SLOTS — the
 *  four primitives sit INSIDE the gap between the compass and the
 *  dock ring, angularly aligned with the slots. Pushed out to 1.05 so
 *  the gap (~0.30) comfortably fits the labels' radial extent without
 *  the labels overlapping the compass outer ring. */
export const SLOT_RING_R = 1.05;

/** Label anchor radius — centered in the gap between the compass outer
 *  ring (0.75) and the slot dock ring (`SLOT_RING_R`). Each label uses
 *  `center` anchor origin so its box sits in the middle of the gap. */
export const PRIMITIVE_LABEL_R = (0.75 + SLOT_RING_R) / 2;

/** Half-angle (radians) of each cardinal slot — the angular GAP in the
 *  dock ring where a label seats. ±20° gives room for the widest
 *  label (JUDGMENT, ~35° tangential at this radius) without making the
 *  arc segments feel thin. */
export const SLOT_HALF_ANGLE = (20 * Math.PI) / 180;

/** Length of each slot bracket tick — short radial line at the slot
 *  edge marking where the dock ring ends and the slot begins. The
 *  bracket extends symmetrically inward + outward from the ring radius
 *  so it reads as a notch. */
export const SLOT_BRACKET_HALF_LEN = 0.022;

/** Arc bounds between consecutive cardinal slots (radians). Each arc
 *  spans 90° minus 2x slot half-angle ≈ 50°. */
export const SLOT_ARC_BOUNDS: ReadonlyArray<{ startRad: number; endRad: number }> = [
  // Right-top arc: between East slot and North slot
  { startRad: SLOT_HALF_ANGLE, endRad: Math.PI / 2 - SLOT_HALF_ANGLE },
  // Top-left arc: between North slot and West slot
  { startRad: Math.PI / 2 + SLOT_HALF_ANGLE, endRad: Math.PI - SLOT_HALF_ANGLE },
  // Left-bottom arc: between West slot and South slot
  { startRad: Math.PI + SLOT_HALF_ANGLE, endRad: (3 * Math.PI) / 2 - SLOT_HALF_ANGLE },
  // Bottom-right arc: between South slot and East slot
  { startRad: (3 * Math.PI) / 2 + SLOT_HALF_ANGLE, endRad: 2 * Math.PI - SLOT_HALF_ANGLE },
];

/** Angles for the 8 slot brackets (2 per cardinal — at each slot edge). */
export const SLOT_BRACKET_ANGLES: readonly number[] = [
  -SLOT_HALF_ANGLE,
  SLOT_HALF_ANGLE,
  Math.PI / 2 - SLOT_HALF_ANGLE,
  Math.PI / 2 + SLOT_HALF_ANGLE,
  Math.PI - SLOT_HALF_ANGLE,
  Math.PI + SLOT_HALF_ANGLE,
  -Math.PI / 2 - SLOT_HALF_ANGLE,
  -Math.PI / 2 + SLOT_HALF_ANGLE,
];

/** Parent reveal fraction spent deploying the four cardinal primitives. */
export const ENCODE_PRIMITIVE_PHASE_END = 0.4;

/** Seat light-up peak additive alpha (brief flash on lock). */
export const PLUG_SEAT_BLIP_PEAK = 0.85;

/** Fraction of the seat phase spent rising (rest fades out). */
export const PLUG_SEAT_BLIP_RISE_FRAC = 0.2;

/** Four compass cardinals — N=Judgment, E=Taste, S=Way of working, W=Voice. */
export const SHELL_PRIMITIVES: readonly ShellPrimitive[] = [
  {
    id: "judgment",
    label: "JUDGMENT",
    sub: "what makes it good",
    angleRad: Math.PI / 2,
    nodeRadius: 0.036,
    color: COLOR_GOLD,
    baseAlpha: 0.75,
  },
  {
    id: "taste",
    label: "TASTE",
    sub: "what you prefer",
    angleRad: 0,
    nodeRadius: 0.032,
    color: COLOR_SURFACES,
    baseAlpha: 0.62,
  },
  {
    id: "craft",
    label: "CRAFT",
    sub: "how you make",
    angleRad: -Math.PI / 2,
    nodeRadius: 0.034,
    color: COLOR_GOLD,
    baseAlpha: 0.7,
  },
  {
    id: "voice",
    label: "VOICE",
    sub: "how you sound",
    angleRad: Math.PI,
    nodeRadius: 0.032,
    color: COLOR_SURFACES,
    baseAlpha: 0.62,
  },
];

/** Asymmetric notes — captured from outside, compared, seated with blip. */
export const SHELL_NOTES: readonly ShellNote[] = [
  {
    id: "n1",
    angleRad: 0.55,
    captureR: 1.48,
    targetIdx: 0,
    radius: 0.018,
    seatOffset: 0.06,
    color: COLOR_GOLD,
    baseAlpha: 0.55,
  },
  {
    id: "n2",
    angleRad: 2.15,
    captureR: 1.52,
    targetIdx: 3,
    radius: 0.016,
    seatOffset: -0.05,
    color: COLOR_SURFACES,
    baseAlpha: 0.5,
  },
  {
    id: "n3",
    angleRad: -0.35,
    captureR: 1.45,
    targetIdx: 1,
    radius: 0.017,
    seatOffset: 0.04,
    color: COLOR_GOLD,
    baseAlpha: 0.52,
  },
  {
    id: "n4",
    angleRad: 3.85,
    captureR: 1.55,
    targetIdx: 2,
    radius: 0.018,
    seatOffset: 0.05,
    color: COLOR_SURFACES,
    baseAlpha: 0.48,
  },
  {
    id: "n5",
    angleRad: 1.25,
    captureR: 1.42,
    targetIdx: 0,
    radius: 0.015,
    seatOffset: -0.04,
    color: COLOR_SURFACES,
    baseAlpha: 0.45,
  },
  {
    id: "n6",
    angleRad: 4.55,
    captureR: 1.5,
    targetIdx: 2,
    radius: 0.016,
    seatOffset: -0.03,
    color: COLOR_GOLD,
    baseAlpha: 0.5,
  },
];

/** Shell-local XY offset of a primitive node (for DOM label anchors). */
export function getPrimitiveNodeOffset(primitiveIdx: number): readonly [number, number] {
  const p = SHELL_PRIMITIVES[primitiveIdx];
  return [Math.cos(p.angleRad) * PRIMITIVE_NODE_R, Math.sin(p.angleRad) * PRIMITIVE_NODE_R];
}

// ── Encode plug array (asymmetric rectangular plugs) ──────────────
//
// The asymmetric rectangular plug array (`SHELL_PLUGS`) was removed
// 2026-06-07 — the four cardinal labels carry the Encode read alone;
// any rim ornament read as decoration rather than meaning. The
// `ShellEncode` renderer is now label-only (no 3D geometry).

/** Shell-local XY offset of a primitive's framed label tag. */
export function getPrimitiveLabelOffset(primitiveIdx: number): readonly [number, number] {
  const p = SHELL_PRIMITIVES[primitiveIdx];
  return [Math.cos(p.angleRad) * PRIMITIVE_LABEL_R, Math.sin(p.angleRad) * PRIMITIVE_LABEL_R];
}

/** Seat position for a note near its target primitive (shell-local). */
export function getNoteSeatOffset(note: ShellNote): readonly [number, number] {
  const prim = SHELL_PRIMITIVES[note.targetIdx];
  const px = Math.cos(prim.angleRad);
  const py = Math.sin(prim.angleRad);
  const tx = -py;
  const ty = px;
  const r = PRIMITIVE_NODE_R * 0.94;
  return [px * r + tx * note.seatOffset, py * r + ty * note.seatOffset];
}

// ── Stack dock (inside-out layer 3 — Build) ──────────────────────────
//
// Horizontal funnel composition (mirrors the FUNNEL lab variant):
// green trusted-source lanes converge from the left; dawn surface fan
// diverges to the right. The intelligence layer (substrate + orbits)
// sits at the centre — no outer geodesic cage at Build.

/** Left cluster X for trusted-source lanes (world units, shell-local). */
export const STACK_SOURCES_X = -2.4;

/** Centre X — brandmark + layer core. */
export const STACK_SUBSTRATE_X = 0;

/** Right fan-tip X for headless surfaces. */
export const STACK_SURFACES_X = 2.4;

export const STACK_LANE_COUNT = 5;
export const STACK_LANE_Y_RANGE = 0.85;
export const STACK_FAN_COUNT = 6;
export const STACK_FAN_HALF_HEIGHT = 1.05;
export const STACK_MOTES_PER_LANE = 12;
export const STACK_MOTES_PER_RAY = 8;

/** Diamond pip scale relative to `PYLON_CAP_SIZE`. */
export const STACK_PIP_SCALE = 0.55;

// ── Petal-unfold helpers (2026-06-05 revision) ──────────────────────
//
// The shell layers deploy with PETAL UNFOLD motion: each individual
// element (a dodecahedron face, a source orbit, a surfaces port)
// starts COLLAPSED AT THE BRAND MARK CENTER (position 0, scale 0)
// and unfolds OUTWARD to its final position + size as its per-element
// reveal ramps. Per-element reveals are STAGGERED inside the parent
// layer's reveal window so the layer reads as origami petals opening
// in a cascade around the mark, not a single uniform scale-up.
//
// Brandmark Principle 4 (`brandmark-choreography` skill): decorations
// emerge GEOMETRICALLY via scale + position lerp, NEVER via opacity.

/** Visibility-skip threshold. Layers/elements with reveal below this
 *  hide their group entirely so the GPU doesn't spend draw calls on
 *  zero-scale geometry. */
export const EMERGE_EPSILON = 0.005;

/** Stagger an individual element's reveal inside the parent layer's
 *  reveal window. Element 0 starts unfolding at parent reveal 0;
 *  element `total - 1` finishes at parent reveal 1; intermediate
 *  elements unfold in between with `overlap` controlling how much
 *  consecutive windows overlap (0 = no overlap / strict round-robin,
 *  1 = all elements unfold together).
 *
 *  With `overlap = 0.55` and `total = 12`, each element's window
 *  spans ~17% of the parent reveal and neighbours overlap by ~55%
 *  — reads as a cascade, not a slow parade. */
export function petalStagger(reveal: number, idx: number, total: number, overlap = 0.55): number {
  if (total <= 1) return reveal;
  // Solve for window size `f` so the first element starts at 0, the
  // last ends at 1, and consecutive windows overlap by `overlap * f`.
  // Derivation: with step = (1 - f) / (total - 1) between starts and
  // overlap fraction p of f, f - step = p * f  =>
  // f = 1 / [(1 - p)(total - 1) + 1].
  const f = 1 / ((1 - overlap) * (total - 1) + 1);
  const step = (1 - f) / (total - 1);
  const start = idx * step;
  const t = (reveal - start) / f;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** Per-element unfold output. `scale` is applied via `group.scale.setScalar`;
 *  `positionT` is the lerp factor from origin (0,0,0) to the element's
 *  final outward position. Both share the same smootherstep curve so
 *  the face's position and size ramp together — no mismatch where a
 *  face is at full size at the origin. */
export interface PetalEmerge {
  scale: number;
  positionT: number;
}

/** Map a staggered per-element reveal to its `{scale, positionT}`
 *  pair. Uses smootherstep (6t^5 - 15t^4 + 10t^3) for elegant
 *  ease-in-and-out — gentler than smoothstep so the unfold reads as
 *  a settle rather than a snap. */
export function petalEmerge(stagger: number): PetalEmerge {
  const t = stagger < 0 ? 0 : stagger > 1 ? 1 : stagger;
  const s = t * t * t * (t * (t * 6 - 15) + 10);
  return { scale: s, positionT: s };
}

/** Legacy single-scalar emerge helper. Kept as an alias of the new
 *  `petalEmerge(reveal).scale` so any caller that hasn't migrated to
 *  per-element unfold still gets the same smootherstep scale ramp. */
export function splitEmerge(reveal: number): number {
  return petalEmerge(reveal).scale;
}

// ── Fold / wrap emerge (2026-06-06 wrap-around revision) ────────────
//
// `petalEmerge` reads as the geometry GROWING THROUGH the brand mark
// from the centre (scale 0 -> 1 expanding outward). The user feedback
// after the lab-match composition landed was that this looks like the
// cage / orbits are "fighting through" the mark instead of "wrapping
// around" it. `foldEmerge` is the wrap-around alternative: each
// element appears at an OVERSIZED scale (sitting visibly OUTSIDE the
// mark) and CLOSES IN to its final scale of 1.0. Reads as the layer
// arriving from beyond the mark and folding inward to wrap it.
//
// Material opacity stays CONSTANT throughout — brandmark Principle 4
// is honoured by keeping every transition geometric.
//
// For per-element petal staggers, foldEmerge runs on the same
// `stagger` value `petalEmerge` consumes, so the SHELL_PRIMITIVES /
// stack funnel cascades work unchanged — only the per-element
// curve changes shape.

/** Initial group scale at the START of the reveal window. Sized so the
 *  cage / orbit appears clearly OUTSIDE the mark when it first deploys
 *  (1.45x the final radius), then closes in to 1.0x. Picked by eye:
 *  larger values read as "the layer is far away and rushes in" which
 *  competes with the camera dolly; smaller values barely look like a
 *  fold at all. */
export const FOLD_OVERSHOOT = 1.45;

/** Fraction of the reveal window spent in the entry ramp (scale 0 ->
 *  FOLD_OVERSHOOT). The remainder closes in (FOLD_OVERSHOOT -> 1.0).
 *  Short so the oversized read is brief and the wrap-in dominates. */
const FOLD_ENTRY_FRAC = 0.12;

/** Fold-emerge: scale starts at 0, rises briefly to FOLD_OVERSHOOT,
 *  then closes in to 1.0 over the rest of the reveal. `positionFactor`
 *  is a parallel multiplier for sub-elements positioned at a final
 *  outward offset (e.g. the surfaces ports) — those want their
 *  position to overshoot beyond the ring radius and settle inward,
 *  not lerp from origin.
 *
 *  - reveal 0           → scale 0,             positionFactor 0
 *  - reveal FOLD_ENTRY  → scale FOLD_OVERSHOOT,positionFactor FOLD_OVERSHOOT
 *  - reveal 1           → scale 1.0,           positionFactor 1.0
 */
export interface FoldEmerge {
  scale: number;
  positionFactor: number;
}

export function foldEmerge(reveal: number): FoldEmerge {
  const t = reveal < 0 ? 0 : reveal > 1 ? 1 : reveal;
  if (t <= 0) return { scale: 0, positionFactor: 0 };
  if (t < FOLD_ENTRY_FRAC) {
    // Entry ramp: scale 0 -> FOLD_OVERSHOOT via smootherstep.
    const u = t / FOLD_ENTRY_FRAC;
    const s = u * u * u * (u * (u * 6 - 15) + 10);
    return {
      scale: s * FOLD_OVERSHOOT,
      positionFactor: s * FOLD_OVERSHOOT,
    };
  }
  // Close-in: FOLD_OVERSHOOT -> 1.0 via smootherstep.
  const u = (t - FOLD_ENTRY_FRAC) / (1 - FOLD_ENTRY_FRAC);
  const s = u * u * u * (u * (u * 6 - 15) + 10);
  const settled = FOLD_OVERSHOOT + (1 - FOLD_OVERSHOOT) * s;
  return { scale: settled, positionFactor: settled };
}

// ── Shell-wrap emerge (2026-06-06 "wrap like a shell" revision) ─────
//
// `foldEmerge` still STARTS at scale 0 — a point at the brand-mark
// centre that balloons outward. For a VOLUMETRIC layer (the brain
// point cloud) that reads as "the shell appears from the back and
// grows through the mark", which is exactly what the user does NOT
// want. `shellWrapEmerge` is the fix: the shell ONLY EVER CONTRACTS
// INWARD. It starts as a LARGE, faint shell already surrounding the
// mark (`SHELL_WRAP_START_SCALE`) and closes down onto its final
// radius (scale 1.0). The geometry never passes through the mark
// centre — it wraps the mark from outside, in 3D, like a shell
// closing around it.
//
// Because a large shell appearing at scale 1.85 on frame one would
// pop, the entry is handled by a PRESENCE ramp (the only place the
// brain is allowed a brief opacity fade — it is a substrate-layer
// decoration, not the brandmark silhouette; the brandmark itself is
// the DOM glyph and never fades here). So the read is: a big faint
// shell materialises around the mark, then tightens + brightens as
// it wraps in.

/** Scale the shell starts at (relative to its final radius). 1.85x
 *  means the shell first appears clearly OUTSIDE the mark and the
 *  inner accreted geometry, then contracts onto its final radius. */
export const SHELL_WRAP_START_SCALE = 1.85;

/** Fraction of the reveal window over which the presence (opacity)
 *  ramp runs. Short so the shell reads as present-and-contracting for
 *  most of the window rather than fading the whole way in. */
const SHELL_WRAP_PRESENCE_FRAC = 0.45;

export interface ShellWrapEmerge {
  /** Group scale — `SHELL_WRAP_START_SCALE` -> 1.0 (contracts inward). */
  scale: number;
  /** Opacity scalar — 0 -> 1 over the first `SHELL_WRAP_PRESENCE_FRAC`
   *  of the reveal so the large starting shell doesn't pop in. */
  presence: number;
}

export function shellWrapEmerge(reveal: number): ShellWrapEmerge {
  const t = reveal < 0 ? 0 : reveal > 1 ? 1 : reveal;
  // Contract inward across the FULL reveal via smootherstep.
  const sCurve = t * t * t * (t * (t * 6 - 15) + 10);
  const scale = SHELL_WRAP_START_SCALE + (1 - SHELL_WRAP_START_SCALE) * sCurve;
  // Presence ramps over the first slice of the reveal, smootherstep.
  const pT = t < SHELL_WRAP_PRESENCE_FRAC ? t / SHELL_WRAP_PRESENCE_FRAC : 1;
  const presence = pT * pT * pT * (pT * (pT * 6 - 15) + 10);
  return { scale, presence };
}

// NOTE: the `buildDodecahedronFaces` helper + `DodecahedronFace` type
// + `SUBSTRATE_DODEC_DETAIL` constant were removed in the 2026-06-05
// lab-match revision. The substrate cage is now a single clean
// `buildGeodesicEdges(SUBSTRATE_CAGE_RADIUS, 1)` icosphere that
// emerges as one body, matching the standalone `NestedShellSphere`
// substrate composition (which the corridor is meant to mirror, per
// the user's "as close as possible to the lab" direction). The
// `petalStagger` / `petalEmerge` helpers above stay — they still
// drive the per-primitive unfold in `ShellEncode` and the stack funnel
// unfold in `ShellStack`.

// ── Navigate gyroscope exploration (lab-only) ───────────────────────
//
// True 3D gimbaled gyroscope: wireframe attitude globe + counter-rotating
// great-circle gimbal rings at `/test/navigate-gyroscope`. Depth-fade line
// shader makes front arcs bright and back arcs dim so the volume reads.
//
// PRODUCTION SAFETY: consumed exclusively by `ShellSubstrateGyro`, which
// only mounts when `gyroLabStore.enabled` is true (default false). The
// flat-compass `SUBSTRATE_COMPASS_*` constants above are untouched.

/** Default wireframe globe radius — inside the Encode slot ring (1.05). */
export const SUBSTRATE_GYRO_GLOBE_RADIUS = 0.6;

/** Meridian / parallel counts at `globeDensity` = 1.0. */
export const SUBSTRATE_GYRO_MERIDIAN_COUNT = 7;
export const SUBSTRATE_GYRO_PARALLEL_COUNT = 5;

/** Segments per great-circle / latitude arc. */
export const SUBSTRATE_GYRO_GLOBE_SEGMENTS = 96;

/** Three orthogonal gimbal rings — radii sit just outside the globe,
 *  inside the Encode slot ring. Mixed-sign spin rates counter-rotate. */
export const SUBSTRATE_GYRO_GIMBAL_RINGS: ReadonlyArray<{
  radius: number;
  tilt: readonly [number, number, number];
  spin: number;
}> = [
  { radius: 0.8, tilt: [0, 0, 0], spin: 0.22 },
  { radius: 0.92, tilt: [Math.PI / 2, 0, 0], spin: -0.14 },
  { radius: 1.04, tilt: [0, 0, Math.PI / 2], spin: 0.1 },
];

/** Slow polar spin of the attitude globe (rad/s). */
export const SUBSTRATE_GYRO_GLOBE_SPIN = 0.08;

/** Idle whole-assembly drift (rad/s frequencies + amplitude). */
export const SUBSTRATE_GYRO_DRIFT_PITCH_FREQ = 0.35;
export const SUBSTRATE_GYRO_DRIFT_ROLL_FREQ = 0.28;
export const SUBSTRATE_GYRO_DRIFT_AMP = 0.08;

/** Pointer bank smoothing rate (1/s). Amplitude comes from store `mouseAmpDeg`. */
export const SUBSTRATE_GYRO_MOUSE_LERP = 4.0;

/** Depth-fade line shader bounds relative to the object's view-space
 *  centre. Positive = closer to camera, negative = farther hemisphere. */
export const SUBSTRATE_GYRO_DEPTH_NEAR = 0.62;
export const SUBSTRATE_GYRO_DEPTH_FAR = -0.62;

/** Line opacities at full presence. */
export const SUBSTRATE_GYRO_GLOBE_LINE_OPACITY = 0.75;
export const SUBSTRATE_GYRO_GLOBE_EQUATOR_OPACITY = 0.95;
export const SUBSTRATE_GYRO_RING_LINE_OPACITY = 0.7;
export const SUBSTRATE_GYRO_PIVOT_OPACITY = 0.85;

/** Surface particle accent counts at `particleDensity` = 1.0. */
export const SUBSTRATE_GYRO_PARTICLE_COUNT_DESKTOP = 180;
export const SUBSTRATE_GYRO_PARTICLE_COUNT_MOBILE = 80;
export const SUBSTRATE_GYRO_POINT_SIZE = 7.0;
export const SUBSTRATE_GYRO_PARTICLE_OPACITY = 0.55;

/** Static tilt when `prefers-reduced-motion` (radians). */
export const SUBSTRATE_GYRO_STATIC_TILT_X = 0.12;
export const SUBSTRATE_GYRO_STATIC_TILT_Y = 0.08;

/** Fraction of tilt / opacity / mouse amp that REMAINS once Encode is
 *  fully emerged — gimbal persists but calms for the labels / stack. */
export const SUBSTRATE_GYRO_ENCODE_TILT_FLOOR = 0.55;
export const SUBSTRATE_GYRO_ENCODE_OPACITY_FLOOR = 0.72;
export const SUBSTRATE_GYRO_ENCODE_MOUSE_FLOOR = 0.45;
