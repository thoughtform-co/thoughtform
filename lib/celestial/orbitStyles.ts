/**
 * orbitStyles — canonical orbit LINE styles for the v7 landing page.
 *
 * Companion to `lib/celestial/orbits.ts`. While `orbits.ts` owns the
 * GEOMETRY (rx, ry, rotateDeg) of the four orbital paths, this module
 * owns the STROKE IDENTITY of each path — the dash pattern, color,
 * weight, and line cap that make each orbit feel like a distinct
 * member of the same instrument family.
 *
 * Why a separate module:
 *   - Geometry stays stable for the brandmark choreography (sigil ring
 *     transforms target the orbit ellipses via SIGIL_RING_MORPHS).
 *   - Style needs to MORPH across the section-2 → section-3 transit:
 *     each sigil ring smoothly evolves its dash pattern, color, and
 *     weight from its section-2 starting identity to its section-3
 *     target identity as the `--orbit-style-morph` CSS variable ramps
 *     0 → 1. Keeping the style tokens here lets the CSS interpolation
 *     and any future programmatic consumer read the same canonical
 *     numbers.
 *
 * Three named line identities echo the section-2 sigil vocabulary the
 * design relies on:
 *   - `solid`        — a full continuous line (the dominant baseline)
 *   - `dotted`       — round dots with moderate gap (clear rhythm)
 *   - `dottedSpaced` — round dots with wider gap (airy, atmospheric)
 *
 * A `tightDotted` token is exported too — the smallest sigil ring uses
 * it and orbit 04 inherits it, giving the constellation a fourth
 * distinct cadence without departing from the three-identity family.
 *
 * Coordinate space note: dash values are SVG user units along the
 * stroked path. The sigil viewBox is 320 (`-160 -160 320 320`) and the
 * miss viewBox is 1100 (`-550 -325 1100 650`). Each container caps at
 * a similar screen px/unit ratio (sigil ~2.1 px/unit at max width,
 * miss ~1.07 px/unit at max width) so a "rhythm-equivalent" pattern in
 * the miss orbit is ~2x the sigil values. The numbers below are tuned
 * per viewBox so each identity reads the same visually across both
 * sections.
 */

import type { OrbitId } from "./orbits";

/** Stable identifier for the named line identities used by the
 *  v7 brandmark orbit system. */
export type OrbitLineIdentity = "solid" | "dotted" | "dottedSpaced" | "tightDotted";

/** A resolved orbit line style. Dash values are in SVG user units
 *  for the consumer's viewBox; color is any valid CSS `<color>`. */
export interface OrbitLineStyle {
  /** Identity name (informational; the CSS does not branch on it). */
  identity: OrbitLineIdentity;
  /** Dash mark length. Use a very large value (`9999`) to express
   *  "no dash" / solid — keeps `calc()` interpolation linear. */
  dashMark: number;
  /** Dash gap length. `0` paired with a large `dashMark` reads as
   *  solid; both > 0 reads as a dotted/dashed pattern. */
  dashGap: number;
  /** SVG stroke-linecap. `round` makes tiny dashes render as circles
   *  (the "true dot" trick); `butt` gives crisp square ends for
   *  dash-style patterns. */
  lineCap: "round" | "butt";
  /** Stroke color as a CSS rgba() string. Baked alpha so the orbit
   *  reveal keyframe's `stroke-opacity: 1` step doesn't flatten the
   *  per-orbit hierarchy. */
  stroke: string;
  /** Stroke width in SVG user units. `vector-effect: non-scaling-
   *  stroke` keeps the visual hairline weight constant across scales. */
  strokeWidth: number;
}

/** Per-section variant of an orbit's line style. The sigil ring's
 *  starting identity sits in `sigil`; the miss orbit's resting
 *  identity sits in `miss`. The `--orbit-style-morph` interpolation
 *  blends from `sigil` to `miss` along the sigil → miss scroll leg. */
export interface OrbitStylePair {
  sigil: OrbitLineStyle;
  miss: OrbitLineStyle;
}

const SOLID_MARK = 9999;

/**
 * Canonical pairings — one entry per orbit id. Each entry locks the
 * sigil-side and miss-side line identity so the section-2 → section-3
 * morph reads as a continuous evolution per pair:
 *
 *   01 — spaced dotted (airy outer ring; matches sigil ring 01)
 *   02 — solid       (the dominant trajectory; matches sigil ring 02)
 *   03 — dotted      (clear chart-like rhythm; matches sigil ring 03)
 *   04 — tight dotted (compact dot cadence; matches sigil ring 04)
 *
 * The miss-side values keep the existing chromatic mix (two cool dawn
 * orbits + two warm gold orbits) so section 3 still reads as four
 * distinct bodies after the morph completes.
 */
export const ORBIT_STYLES: Readonly<Record<OrbitId, OrbitStylePair>> = {
  "01": {
    // Sigil ring 01 (r=150) — outer guide, dawn at low alpha
    sigil: {
      identity: "dottedSpaced",
      dashMark: 1,
      dashGap: 5,
      lineCap: "round",
      stroke: "rgba(235, 227, 214, 0.45)",
      strokeWidth: 0.5,
    },
    // Miss orbit 01 (rx=370, ry=225) — paired spaced dotted; scaled
    // ~2x for the miss viewBox so the visual rhythm matches the sigil.
    miss: {
      identity: "dottedSpaced",
      dashMark: 2,
      dashGap: 11,
      lineCap: "round",
      stroke: "rgba(235, 227, 214, 0.5)",
      strokeWidth: 1.3,
    },
  },
  "02": {
    // Sigil ring 02 (r=126) — solid dawn baseline
    sigil: {
      identity: "solid",
      dashMark: SOLID_MARK,
      dashGap: 0,
      lineCap: "butt",
      stroke: "rgba(235, 227, 214, 0.55)",
      strokeWidth: 0.6,
    },
    // Miss orbit 02 (rx=465, ry=140) — solid bold baseline; takes the
    // role the legacy orbit 01 used to hold (dominant continuous arc).
    miss: {
      identity: "solid",
      dashMark: SOLID_MARK,
      dashGap: 0,
      lineCap: "butt",
      stroke: "rgba(235, 227, 214, 0.6)",
      strokeWidth: 1.7,
    },
  },
  "03": {
    // Sigil ring 03 (r=104) — dotted gold
    sigil: {
      identity: "dotted",
      dashMark: 2,
      dashGap: 7,
      lineCap: "round",
      stroke: "rgba(202, 165, 84, 0.45)",
      strokeWidth: 0.6,
    },
    // Miss orbit 03 (rx=395, ry=175) — dotted; warm gold, slightly
    // heavier so it holds its own against the solid orbit 02.
    miss: {
      identity: "dotted",
      dashMark: 4,
      dashGap: 14,
      lineCap: "round",
      stroke: "rgba(202, 165, 84, 0.45)",
      strokeWidth: 1.4,
    },
  },
  "04": {
    // Sigil ring 04 (r=78) — tight dotted gold
    sigil: {
      identity: "tightDotted",
      dashMark: 1,
      dashGap: 3,
      lineCap: "round",
      stroke: "rgba(202, 165, 84, 0.55)",
      strokeWidth: 0.55,
    },
    // Miss orbit 04 (rx=305, ry=185) — tight dotted; warm gold, the
    // compact inner cadence that picks out the closest trajectory.
    miss: {
      identity: "tightDotted",
      dashMark: 2,
      dashGap: 7,
      lineCap: "round",
      stroke: "rgba(202, 165, 84, 0.42)",
      strokeWidth: 1.1,
    },
  },
} as const;

/** Variable name prefix for the CSS interpolation channel. Per-ring
 *  start / end values are declared on `.sigil__ring--NN` and
 *  `.miss__orbit--NN` selectors directly; this prefix is exported for
 *  any future programmatic consumer (admin tool, debug overlay) that
 *  needs to read or write the same names. */
export const ORBIT_STYLE_VAR_PREFIX = "--orbit-line";

/** Convenience accessor for the four orbit ids in canonical order. */
export const ORBIT_IDS: readonly OrbitId[] = ["01", "02", "03", "04"];
