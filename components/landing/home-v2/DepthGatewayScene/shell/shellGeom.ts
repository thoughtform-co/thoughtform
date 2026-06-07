/**
 * shellGeom — corridor-tuned constants for the brandmark's accreted
 * shell (substrate core, Encode judgment orbits, Build stack dock).
 *
 * The accretion shell follows the guiding-star brandmark as it flies
 * Navigate -> Encode -> Build down the depth corridor (ADR-018). Each
 * layer emerges geometrically on its phase window and PERSISTS so the
 * mark visibly accumulates the intelligence layer and lands on the
 * fully-assembled stack at the Build station.
 *
 *   - Substrate compass wraps the brandmark (Navigate).
 *   - Judgment orbits sit outside the cage (Encode).
 *   - Stack funnel lanes + fan dock sources left / surfaces right (Build).
 */

import {
  COLOR_GOLD,
  COLOR_SOURCES,
  COLOR_SURFACES,
} from "@/components/landing/intelligence-artifact/artifactGeom";

// ── Substrate core (inside-out layer 1) ──────────────────────────────

/** Substrate layer outer geodesic radius. The source orbits MUST stay
 *  outside this radius (see `SHELL_ORBITS` invariant below) so the
 *  constellation visibly wraps the substrate rather than cutting
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
// SUBSTRATE_CAGE_RADIUS (0.42, the old geodesic boundary the Encode
// orbits sit outside of). The flat camera-facing rings and the
// inclined Encode orbits live on different planes; any Encode overlap
// is tuned via opacity, not by shrinking the Navigate framing.

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

/** Eight-ball horizon + attitude enrichment (world units). The horizon
 *  equator sits just inside the outer ring; kept FAINT so the flat
 *  compass rings remain the dominant read. */
export const SUBSTRATE_COMPASS_HORIZON_R = 0.73;
export const SUBSTRATE_COMPASS_HORIZON_BAND_Y = 0.018;
export const SUBSTRATE_COMPASS_PITCH_LADDER_DEG = [12, 24] as const;
export const SUBSTRATE_COMPASS_CARDINAL_DIAMOND = 0.03;

/** Gimbal attitude seek (radians / Hz) — applied ONLY to the eight-ball
 *  horizon/pitch sub-group so the flat compass rings stay camera-facing
 *  like the opening-beat compass. */
export const SUBSTRATE_COMPASS_TILT_AMP_X = 0.16;
export const SUBSTRATE_COMPASS_TILT_AMP_Z = 0.1;
export const SUBSTRATE_COMPASS_TILT_FREQ_X = 0.5;
export const SUBSTRATE_COMPASS_TILT_FREQ_Z = 0.42;
/** Slow breath spin for the whole instrument (matches the opening
 *  compass `group.rotation.z = elapsed * 0.012`). */
export const SUBSTRATE_COMPASS_BREATH_RATE = 0.012;

/** Shell material opacity at full presence. */
export const SUBSTRATE_COMPASS_SHELL_OPACITY = 1.0;

// NOTE: `SUBSTRATE_INNER_RADIUS` (faint dawn inner geodesic) was
// removed in the 2026-06-06 wrap-around revision (Phase 2). Keep the
// homepage substrate as ONE gold geodesic — no inner white/dawn shell.

// ── Encode judgment orbits (inside-out layer 2) ────────────────────

/** One inclined ellipse around the brandmark. `rx` is the semi-major
 *  radius (world units); `eccentricity = ry/rx` makes the orbit flat
 *  or round. `tilt` is XYZ Euler in radians, applied to the XY-plane
 *  ellipse, so each orbit lives on its own 3D-inclined plane. */
export interface ShellOrbit {
  /** Stable id (also used as a React key). */
  id: string;
  /** Semi-major axis (world units). */
  rx: number;
  /** Ellipse eccentricity = ry / rx (1 = round, 0.4 = very flat). */
  eccentricity: number;
  /** XYZ Euler tilt in radians applied to the XY ellipse. */
  tilt: readonly [number, number, number];
  /** Per-orbit revolve period (seconds for a full revolution). */
  periodSec: number;
  /** Revolve direction: +1 = positive parametric angle, -1 = inverted. */
  dir: 1 | -1;
  /** Starting parametric angle (radians) so the planets don't all
   *  start at the same phase. */
  phaseRad: number;
  /** Source-pip diamond radius (world units). */
  pipRadius: number;
  /** Stroke + pip color (hex literal — matches role-tier palette). */
  color: number;
  /** Base orbit ring opacity at full reveal. */
  baseAlpha: number;
}

/** A solar-system of six inclined elliptical orbits around the
 *  brandmark (restored 2026-06-07 — the user preferred this over the
 *  tightened four-orbit table). Mix of round and flat ellipses, spread
 *  tilts across every axis so the orbits visibly cross when seen
 *  face-on. Colours mix Sources green, gold, and dawn so the field
 *  reads as a layered chart. The orbits' min radii (~0.88+) sit
 *  comfortably OUTSIDE the Navigate compass (outer ring 0.75) so the
 *  constellation wraps the layer rather than cutting through it. */
export const SHELL_ORBITS: readonly ShellOrbit[] = [
  {
    id: "01",
    rx: 1.1,
    eccentricity: 0.92,
    // Front-tilted plane, modest left bank — the "primary" inner orbit.
    tilt: [0.42, 0.0, 0.22],
    periodSec: 18,
    dir: -1,
    phaseRad: 0.6,
    pipRadius: 0.04,
    color: COLOR_SOURCES,
    baseAlpha: 0.7,
  },
  {
    id: "02",
    rx: 1.55,
    eccentricity: 0.6,
    // Flat horizon orbit on a strong Y-axis tilt — reads as a long
    // ellipse crossing the others.
    tilt: [0.15, 0.62, -0.38],
    periodSec: 26,
    dir: 1,
    phaseRad: 1.4,
    pipRadius: 0.036,
    color: COLOR_SURFACES,
    baseAlpha: 0.55,
  },
  {
    id: "03",
    rx: 1.25,
    eccentricity: 0.95,
    // Steep polar tilt — the orbit sweeps near-vertical, crossing the
    // equatorial orbits at the top/bottom of its arc.
    tilt: [1.18, 0.28, 0.0],
    periodSec: 22,
    dir: -1,
    phaseRad: 2.1,
    pipRadius: 0.04,
    color: COLOR_SOURCES,
    baseAlpha: 0.65,
  },
  {
    id: "04",
    rx: 1.6,
    eccentricity: 0.55,
    // Very flat + long horizon, tipped on the Y axis so it reads as
    // a wide outer track passing behind the inner orbits.
    tilt: [0.0, 1.25, 0.26],
    periodSec: 30,
    dir: 1,
    phaseRad: 3.6,
    pipRadius: 0.038,
    color: COLOR_GOLD,
    baseAlpha: 0.55,
  },
  {
    id: "05",
    rx: 1.0,
    eccentricity: 0.92,
    // Tight inner orbit on a triple-axis tilt — gives the innermost
    // body the most dynamic angle in the constellation.
    tilt: [0.72, -0.55, 0.62],
    periodSec: 14,
    dir: -1,
    phaseRad: 4.6,
    pipRadius: 0.032,
    color: COLOR_SURFACES,
    baseAlpha: 0.5,
  },
  {
    id: "06",
    rx: 1.5,
    eccentricity: 0.62,
    // Counter-tilted outer orbit — its inclination opposes orbit 02's
    // so the two long horizons read as a deliberate X-cross.
    tilt: [-0.42, 0.45, -0.82],
    periodSec: 24,
    dir: 1,
    phaseRad: 5.4,
    pipRadius: 0.036,
    color: COLOR_SOURCES,
    baseAlpha: 0.6,
  },
];

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
// `stagger` value `petalEmerge` consumes, so the SHELL_ORBITS /
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
// drive the per-orbit unfold in `ShellOrbits` and the stack funnel
// unfold in `ShellStack`.
