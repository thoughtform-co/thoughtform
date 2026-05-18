/**
 * orbits — canonical orbital geometry for the v7 landing page.
 *
 * The Diagnostic section (#missing-layer) reads as a celestial
 * constellation: the brandmark sits at the gravitational centre and
 * four diagnostic concerns orbit it on asymmetric, inclined ellipses.
 * Real orbits aren't perfect circles; the asymmetry signals that the
 * four diagnoses aren't symmetric facets of one thing — they're
 * distinct manifestations of one underlying gap, each with its own
 * gravitational signature.
 *
 * The Definition section (#definition) sigil opens as the canonical
 * compass (concentric circles + NAVIGATE / ENCODE / BUILD labels).
 * As the visitor scrolls toward the diagnostic, those circles morph
 * into these same ellipses via a CSS-variable-driven scale + rotate
 * tween. The compass becomes the lived celestial system in motion;
 * that morph IS the section transition.
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
 * Four asymmetric orbits around the centre brandmark.
 *
 * Each orbit's `(rx, ry, rotateDeg)` was chosen so that:
 *   - Orbit 01 carries the upper-left label.
 *   - Orbit 02 carries the upper-right label.
 *   - Orbit 03 carries the lower-left label (biggest + lowest).
 *   - Orbit 04 carries the lower-right label (smallest + tightest).
 *
 * Eccentricity (rx / ry) clusters around 1.7, so all four read as
 * the same "family" of orbits rather than wildly different paths.
 * The varied rotations give the constellation its asymmetric feel.
 */
export const MISS_ORBITS: readonly OrbitEllipse[] = [
  { id: "01", rx: 340, ry: 200, rotateDeg: +18 },
  { id: "02", rx: 300, ry: 170, rotateDeg: -12 },
  { id: "03", rx: 350, ry: 200, rotateDeg: -22 },
  { id: "04", rx: 270, ry: 160, rotateDeg: +22 },
] as const;

/**
 * The four diagnostic labels, each positioned on its host orbit.
 *
 * Positions are pre-baked (rather than parametric angles) so the
 * markup can hardcode `--x-pct` / `--y-pct` CSS variables. To
 * re-derive them analytically, call `pointOnEllipse(rx, ry,
 * rotateDeg, parametricDeg)` with the parametric angles documented
 * inline below.
 */
export const MISS_LABELS: readonly OrbitLabel[] = [
  {
    id: "01",
    tag: "Brand voice at scale",
    // orbit 01 (340, 200, +18°), parametric ψ ≈ 207.5°
    x: -258,
    y: -181,
    xPct: -23.45,
    yPct: -27.85,
  },
  {
    id: "02",
    tag: "Localization at scale",
    // orbit 02 (300, 170, -12°), parametric ψ ≈ -29°
    x: +236,
    y: -137,
    xPct: +21.45,
    yPct: -21.08,
  },
  {
    id: "03",
    tag: "Brief handoff",
    // orbit 03 (350, 200, -22°), parametric ψ ≈ 161°
    x: -240,
    y: +210,
    xPct: -21.82,
    yPct: +32.31,
  },
  {
    id: "04",
    tag: "Briefing synthesis",
    // orbit 04 (270, 160, +22°), parametric ψ ≈ 19°
    x: +220,
    y: +150,
    xPct: +20.0,
    yPct: +23.08,
  },
] as const;

/** Pair each orbit id to its label by id. Convenience map for
 *  consumers that need to walk the pair list. */
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
