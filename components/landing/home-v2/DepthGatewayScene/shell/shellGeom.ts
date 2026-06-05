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
 * World-unit sizing is anchored to two known values:
 *
 *   - The Intelligence substrate sphere lands at radius `SUBSTRATE_HALF
 *     * SUBSTRATE_TO_SPHERE_RATIO` = 0.22 * 2.5 = 0.55 world units (see
 *     `IntelligenceGate.tsx`).
 *   - The Intelligence gate `halfExtent` is 2.0 world units (see
 *     `corridorMap.ts`).
 *
 * So the substrate core wraps the 0.55-radius sphere with breathing
 * room (~0.85), the sources solar system sits between ~0.95 and ~1.55,
 * and the surfaces outer skin sits at ~1.85 so the fully-assembled
 * shell comfortably fits the gate's halfExtent.
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

/** Outer dodecahedron wrap radius. Wraps the 0.55-radius substrate
 *  sphere with breathing room so the cage edges read clearly around
 *  the morph cloud at landing. */
export const SUBSTRATE_DODEC_RADIUS = 0.95;

/** Inner geodesic shell radius. Sits in the gap between the 0.55-
 *  radius substrate sphere and the 0.95 outer dodecahedron so the
 *  faint dawn hairline reads as a middle layer at landing rather
 *  than being eclipsed by the morph cloud. During transit beats
 *  (before the sphere expands) it reads as a soft second cage
 *  around the dodecahedron's inside. */
export const SUBSTRATE_INNER_RADIUS = 0.74;

/** Dodecahedron subdivision detail. `0` keeps the canonical 12-face
 *  pentagonal cage — distinctive and recognizable. */
export const SUBSTRATE_DODEC_DETAIL = 0;

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
 *  ring stack. */
export const SHELL_ORBITS: readonly ShellOrbit[] = [
  {
    id: "01",
    rx: 1.05,
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
    rx: 1.35,
    eccentricity: 0.42,
    // Flat horizon orbit on a strong Y-axis tilt — reads as a long
    // ellipse crossing the others.
    tilt: [0.15, 0.62, -0.38],
    periodSec: 26,
    dir: 1,
    phaseRad: 1.4,
    pipRadius: 0.036,
    color: COLOR_SURFACES,
    baseAlpha: 0.5,
  },
  {
    id: "03",
    rx: 1.2,
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
    rx: 1.5,
    eccentricity: 0.4,
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
    rx: 0.95,
    eccentricity: 0.88,
    // Tight inner orbit on a triple-axis tilt — gives the innermost
    // body the most dynamic angle in the constellation.
    tilt: [0.72, -0.55, 0.62],
    periodSec: 14,
    dir: -1,
    phaseRad: 4.6,
    pipRadius: 0.032,
    color: COLOR_SURFACES,
    baseAlpha: 0.45,
  },
  {
    id: "06",
    rx: 1.45,
    eccentricity: 0.5,
    // Counter-tilted outer orbit — its inclination opposes orbit 02's
    // so the two long horizons read as a deliberate X-cross.
    tilt: [-0.42, 0.45, -0.82],
    periodSec: 24,
    dir: 1,
    phaseRad: 5.4,
    pipRadius: 0.036,
    color: COLOR_SOURCES,
    baseAlpha: 0.58,
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

// ── Reveal helpers ───────────────────────────────────────────────────

/** Visibility-skip threshold. Layers with `reveal < EMERGE_EPSILON`
 *  hide their group entirely so the GPU doesn't spend draw calls on
 *  zero-scale geometry. */
export const EMERGE_EPSILON = 0.005;

/** Map a phase reveal [0,1] (already smoothstepped upstream by
 *  `getBrandmarkAccretionLayers`) to a geometric SCALE factor that
 *  the layer's parent group applies via `setScalar`. Brandmark
 *  Principle 4 (`brandmark-choreography` skill): decorations emerge
 *  GEOMETRICALLY via scale, never via opacity.
 *
 *  Applies a gentle cubic so the shell sub-layer reads as a settle
 *  rather than a linear stretch as the reveal ramps. */
export function splitEmerge(reveal: number): number {
  const r = reveal < 0 ? 0 : reveal > 1 ? 1 : reveal;
  return r * r * (3 - 2 * r);
}
