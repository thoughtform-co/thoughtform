/**
 * orbits — canonical orbital geometry for the v7 landing page.
 *
 * The Diagnostic section (#missing-layer) reads as a celestial
 * instrument: the brandmark sits at the gravitational centre with a
 * dense compass scale around it; four diagnostic concerns each sit
 * on their OWN elliptical orbit, varied in eccentricity and tilt
 * (rounder vs flatter, +18° vs -26° etc.) so the four paths read as
 * four distinct bodies — not four near-copies. Each diagnosis is
 * visibly tethered back to the centre with a gold beam, and a gold
 * anchor pip marks where it sits on its orbit.
 *
 * The Definition section (#definition) sigil opens as the canonical
 * compass (concentric circles + NAVIGATE / ENCODE / BUILD labels).
 * As the visitor scrolls toward the diagnostic, those circles morph
 * into the same four asymmetric ellipses (via `--orbit-morph` and
 * per-ring scale targets in `SIGIL_RING_MORPHS` below) so the
 * compass-at-rest becomes the lived celestial system in motion. The
 * `MISS_ORBITS` table drives BOTH the diagnostic rendering and the
 * sigil-ring morph targets — one canonical orbital family across
 * both sections.
 *
 * This module is the SINGLE SOURCE OF TRUTH for the orbit + label
 * geometry. The actual landing markup hardcodes the numbers (the
 * prototype HTML is server-parsed, not React-rendered), but the
 * helpers + constants here are exported so any future programmatic
 * consumer (admin tool, debug overlay, alternative renderer) reads
 * the same canonical values.
 *
 * Coordinate system:
 *   - SVG units, y-DOWN (standard SVG convention).
 *   - The diagnostic constellation viewBox is `-550 -325 1100 650`,
 *     so (0, 0) is the brandmark centre and one SVG unit equals one
 *     CSS pixel at the container's max width (1100px).
 */

export interface OrbitEllipse {
  /** Stable identifier (`"01" | "02" | "03" | "04"`). */
  id: OrbitId;
  /** Semi-major axis (x-radius before rotation), SVG units. */
  rx: number;
  /** Semi-minor axis (y-radius before rotation), SVG units. */
  ry: number;
  /** SVG rotation in degrees (positive = clockwise when viewed
   *  with the standard SVG y-down convention; appears CCW visually). */
  rotateDeg: number;
}

export interface OrbitLabel {
  /** Stable identifier — matches the orbit it sits on. */
  id: OrbitId;
  /** The diagnostic tag rendered in the pill (mirrors the legacy
   *  `.miss__card-tag` value verbatim so copy doesn't shift). */
  tag: string;
  /** Final position on the orbit (SVG units, after rotation). */
  x: number;
  y: number;
  /** Position as a percentage of viewBox dimensions, ready to plug
   *  into CSS `calc(50% + var(--x-pct) * 1%)` style positioning. */
  xPct: number;
  yPct: number;
}

export type OrbitId = "01" | "02" | "03" | "04";

/** The diagnostic constellation viewBox dimensions. Width and height
 *  in SVG units; one unit = one pixel at the container's max width. */
export const MISS_VIEWBOX = {
  width: 1100,
  height: 650,
} as const;

/**
 * Four asymmetric orbits around the brandmark, ONE PER LABEL. Each
 * orbit has deliberately distinct (rx, ry, rotateDeg) so the four
 * orbital paths read as four different bodies — not four near-copies.
 * Eccentricity ranges from ~1.65 (orbit 01, rounder) to ~3.32 (orbit
 * 02, very flat and long), and tilts span -28° to +32°.
 *
 * Geometry tuned (from the earlier 320/380/350/280 set) for a wider,
 * more chart-like sweep: orbit 02 stretches well past the labelled
 * pills to read as a long horizon path, orbit 03 leans further left
 * for a clearer asymmetry from 04, and orbit 04 picks up extra
 * vertical extent so the four paths feel like distinct trajectories
 * rather than four near-equal rings. The total horizontal extent
 * still sits inside the canonical -550..+550 viewBox.
 */
export const MISS_ORBITS: readonly OrbitEllipse[] = [
  { id: "01", rx: 370, ry: 225, rotateDeg: +16 }, // rounder, gentle right tilt
  { id: "02", rx: 465, ry: 140, rotateDeg: -8 }, // very flat + long horizon path
  { id: "03", rx: 395, ry: 175, rotateDeg: -28 }, // medium, stronger left tilt
  { id: "04", rx: 305, ry: 185, rotateDeg: +32 }, // compact, sharp right tilt
] as const;

/**
 * The four diagnostic labels, each positioned on its OWN orbit at a
 * parametric angle that puts the label in its assigned quadrant.
 * Positions are pre-baked so the markup can hardcode `--x-pct` /
 * `--y-pct` CSS variables. Re-derive analytically by calling
 * `pointOnEllipse(orbit.rx, orbit.ry, orbit.rotateDeg, parametricDeg)`
 * with the angles documented inline below.
 */
export const MISS_LABELS: readonly OrbitLabel[] = [
  {
    id: "01",
    tag: "Brand voice at scale",
    // orbit 01 (370, 225, +16°), parametric ψ = 205° → UL
    x: -296,
    y: -184,
    xPct: -26.92,
    yPct: -28.28,
  },
  {
    id: "02",
    tag: "Localization at scale",
    // orbit 02 (465, 140, -8°), parametric ψ = -35° → UR
    x: +366,
    y: -133,
    xPct: +33.28,
    yPct: -20.39,
  },
  {
    id: "03",
    tag: "Brief handoff",
    // orbit 03 (395, 175, -28°), parametric ψ = 155° → LL
    x: -281,
    y: +233,
    xPct: -25.58,
    yPct: +35.9,
  },
  {
    id: "04",
    tag: "Briefing synthesis",
    // orbit 04 (305, 185, +32°), parametric ψ = 10° → LR
    x: +238,
    y: +186,
    xPct: +21.61,
    yPct: +28.68,
  },
] as const;

/** Pair each orbit to its label by id. */
export const MISS_PAIRS: readonly { orbit: OrbitEllipse; label: OrbitLabel }[] = MISS_ORBITS.map(
  (orbit) => {
    const label = MISS_LABELS.find((l) => l.id === orbit.id);
    if (!label) throw new Error(`Missing label for orbit ${orbit.id}`);
    return { orbit, label };
  }
);

/**
 * Compute a point on an ellipse after its SVG `rotate()` is applied.
 *
 * Local ellipse point at parametric angle ψ (degrees, standard math
 * convention: 0° = +x, 90° = +y):
 *
 *   localX = rx * cos(ψ)
 *   localY = ry * sin(ψ)
 *
 * After SVG `rotate(α)` (where positive α is CW in SVG's y-down
 * coordinate system):
 *
 *   x = localX * cos(α) - localY * sin(α)
 *   y = localX * sin(α) + localY * cos(α)
 *
 * Returns the final point in SVG user units.
 */
export function pointOnEllipse(
  rx: number,
  ry: number,
  rotateDeg: number,
  parametricDeg: number
): { x: number; y: number } {
  const psi = (parametricDeg * Math.PI) / 180;
  const alpha = (rotateDeg * Math.PI) / 180;
  const lx = rx * Math.cos(psi);
  const ly = ry * Math.sin(psi);
  return {
    x: lx * Math.cos(alpha) - ly * Math.sin(alpha),
    y: lx * Math.sin(alpha) + ly * Math.cos(alpha),
  };
}

/**
 * Sigil-ring morph target for the section 2 → section 3 transition.
 *
 * The sigil's perfect concentric rings deform into the diagnostic
 * orbits as `--orbit-morph` ramps 0 → 1. The transform is:
 *
 *   rotate(targetRotateDeg * morph)
 *   scaleX(1 + (targetSx - 1) * morph)
 *   scaleY(1 + (targetSy - 1) * morph)
 *
 * Each sigil ring (r = 150, 126, 104, 78) is mapped to one of the
 * four diagnostic orbits. The scale targets are computed so the
 * AVERAGE radius is preserved through the morph — the ring deforms
 * into an ellipse with the orbit's eccentricity, but the ring's
 * footprint stays in roughly the same visual register (no runaway
 * growth that would overflow the section 2 layout).
 */
export interface SigilRingMorph {
  /** Sigil ring index, matches markup class `.sigil__ring--N`. */
  id: OrbitId;
  /** Sigil ring radius (matches the original `<circle r="…">`). */
  ringRadius: number;
  /** Target scaleX at `--orbit-morph: 1`. */
  targetSx: number;
  /** Target scaleY at `--orbit-morph: 1`. */
  targetSy: number;
  /** Target rotation in degrees at `--orbit-morph: 1`. */
  targetRotateDeg: number;
}

/** Pair each sigil ring to a diagnostic orbit and compute the scale
 *  targets that preserve the ring's average radius across the morph. */
export const SIGIL_RING_MORPHS: readonly SigilRingMorph[] = MISS_ORBITS.map((orbit, index) => {
  const ringRadius = [150, 126, 104, 78][index];
  const avg = (orbit.rx + orbit.ry) / 2;
  return {
    id: orbit.id,
    ringRadius,
    targetSx: round3(orbit.rx / avg),
    targetSy: round3(orbit.ry / avg),
    targetRotateDeg: orbit.rotateDeg,
  };
});

function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
