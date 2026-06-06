/**
 * shellGeom — corridor-tuned constants for the brandmark's accreted
 * shell (substrate core, source orbits, surfaces skin).
 *
 * The accretion shell follows the guiding-star brandmark as it flies
 * Navigate -> Encode -> Build down the depth corridor (ADR-018). Each
 * layer emerges geometrically on its phase window and PERSISTS so the
 * mark visibly accumulates the layers of the intelligence-layer shell
 * and lands on the fully-assembled artifact at the Build station.
 *
 * World-unit sizing is anchored to the Intelligence substrate sphere
 * radius (`SUBSTRATE_HALF * SUBSTRATE_TO_SPHERE_RATIO` = 0.22 * 2.5 =
 * 0.55 world units, see `IntelligenceGate.tsx`) using the SAME
 * proportions as the standalone `NestedShellSphere` shell artifact
 * (substrate core : sources : surfaces ≈ 1.00 : 1.55 : 2.25):
 *
 *   - Substrate dodecahedron wraps the 0.55 sphere with a tight ~1.27x
 *     ratio (0.70) — visually proportional to the brandmark / sphere
 *     it cages, just like the lab artifact (where the cage is at 0.92
 *     and the brandmark cloud half-extent is 0.75, ratio 1.22x).
 *   - Source orbits sit OUTSIDE the cage in a band ~0.88..1.65 — every
 *     orbit's `min(rx, rx*eccentricity)` clears the dodecahedron with
 *     breathing room so the constellation visibly orbits AROUND the
 *     substrate, not through it.
 *   - Surfaces outer skin at 1.85 — ~2.6x the dodec, ~3.4x the
 *     substrate sphere; still fits the Intelligence gate `halfExtent`
 *     2.0 with breathing room and clears the outermost orbit.
 *
 * Tilts on the source orbits use Euler angles applied to an XY ellipse
 * via `buildTiltedRingLineLoop` (celestialRingUtils.ts) so each orbit
 * lives on its own 3D-inclined plane — a real solar system of crossing
 * ellipses, not coplanar rings.
 */

import {
  COLOR_GOLD,
  COLOR_SOURCES,
  COLOR_SURFACES,
} from "@/components/landing/intelligence-artifact/artifactGeom";

// ── Substrate core (inside-out layer 1) ──────────────────────────────

/** Substrate layer outer bounding radius. The source orbits MUST
 *  stay outside this radius (see `SHELL_ORBITS` invariant below) so
 *  the constellation visibly wraps the substrate rather than cutting
 *  through it.
 *
 *  EVOLUTION:
 *  - Originally the dodecahedron cage radius (`SUBSTRATE_DODEC_RADIUS`).
 *  - Renamed to `SUBSTRATE_CAGE_RADIUS` on 2026-06-05 when the cage
 *    became an 80-face geodesic icosphere.
 *  - On 2026-06-06 the cage was replaced with the BRAIN ARTIFACT (see
 *    `ShellSubstrate.tsx`), whose two-hemisphere ellipsoid sample
 *    has a max radius of ~0.55. The constant is kept at 0.7 so the
 *    source-orbit clearance invariant still produces a comfortable
 *    breathing gap between the brain and the inbound orbital paths —
 *    this is now the CLEARANCE radius, not a literal cage size. */
export const SUBSTRATE_CAGE_RADIUS = 0.7;

// NOTE: `SUBSTRATE_INNER_RADIUS` (faint dawn inner geodesic) was
// removed in the 2026-06-06 wrap-around revision (Phase 2). The
// brain artifact at the centre supplies the inner read directly —
// no separate inner shell is needed.

// ── Sources (inside-out layer 2) ─────────────────────────────────────

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
 *  brandmark. Mix of round and flat ellipses, spread tilts across
 *  every axis so the orbits visibly cross when seen face-on (the
 *  astronomy-poster reference). Colors mix Sources green, gold, and
 *  dawn so the field reads as a layered chart, not a single-hue
 *  ring stack.
 *
 *  **Invariant — orbits sit OUTSIDE the substrate dodecahedron.** For
 *  every orbit, `min(rx, rx * eccentricity)` must be >= `SUBSTRATE_DODEC_RADIUS
 *  + 0.15` (clearance) so the orbit's closest approach to origin is
 *  clearly outside the cage in 3D space. The cage is a rigid solid;
 *  orbits are 1D paths that flow AROUND it. Without this clearance the
 *  flat ellipses cut through the cage and the inside-out story breaks. */
export const SHELL_ORBITS: readonly ShellOrbit[] = [
  {
    id: "01",
    rx: 1.1,
    eccentricity: 0.92,
    // Front-tilted plane, modest left bank — the "primary" inner orbit.
    // min radius = 1.01, clears the 0.70 dodec with 0.31 breathing.
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
    // ellipse crossing the others. min radius = 0.93, clears the dodec
    // with 0.23 breathing.
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
    // equatorial orbits at the top/bottom of its arc. min radius =
    // 1.19, clears comfortably.
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
    // a wide outer track passing behind the inner orbits. min radius
    // = 0.88, clears with 0.18 breathing.
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
    // body the most dynamic angle in the constellation. min radius =
    // 0.92, the closest orbit to the dodec.
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
    // so the two long horizons read as a deliberate X-cross. min
    // radius = 0.93.
    tilt: [-0.42, 0.45, -0.82],
    periodSec: 24,
    dir: 1,
    phaseRad: 5.4,
    pipRadius: 0.036,
    color: COLOR_SOURCES,
    baseAlpha: 0.6,
  },
];

// ── Surfaces (inside-out layer 3) ────────────────────────────────────

/** Outer surfaces shell radius. Fits comfortably inside the
 *  Intelligence gate's `halfExtent` 2.0 with breathing room so the
 *  hairline wireframe doesn't run into the depth-corridor walls. */
export const SURFACES_OUTER_RADIUS = 1.85;

/** Detail level for the outer geodesic shell. `1` gives the classic
 *  80-face icosahedron — reads as engineered without looking
 *  low-poly. */
export const SURFACES_GEODESIC_DETAIL = 1;

/** Number of port-pip diamonds around the surfaces shell rim.
 *  Six pips reads as the canonical surface endpoints (Web / API /
 *  MCP / Slack / Cursor / Claude — the same family the standalone
 *  Aperture variant uses) without crowding the wireframe. */
export const SURFACES_PORT_COUNT = 6;

/** Outline diamond half-extent for the port pips (world units). */
export const SURFACES_PORT_SIZE = 0.085;

/** Y-axis tilt applied to the surfaces port ring so the pips don't
 *  sit on a primary axis — gives the outer skin a hand-flown feel. */
export const SURFACES_PORT_TILT_Y = (12 * Math.PI) / 180;

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
// SURFACES_PORT_COUNT cascades work unchanged — only the per-element
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

// NOTE: the `buildDodecahedronFaces` helper + `DodecahedronFace` type
// + `SUBSTRATE_DODEC_DETAIL` constant were removed in the 2026-06-05
// lab-match revision. The substrate cage is now a single clean
// `buildGeodesicEdges(SUBSTRATE_CAGE_RADIUS, 1)` icosphere that
// emerges as one body, matching the standalone `NestedShellSphere`
// substrate composition (which the corridor is meant to mirror, per
// the user's "as close as possible to the lab" direction). The
// `petalStagger` / `petalEmerge` helpers above stay — they still
// drive the per-orbit and per-port unfolds in `ShellSources` and
// `ShellSurfaces`.
