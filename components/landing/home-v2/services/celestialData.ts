/**
 * celestialData — orbit geometry + per-service celestial config for the
 * Services station (`#services`) celestial-map treatment.
 *
 * Single source of truth shared by `ServicesOrbitMap` (draws the orbits +
 * nodes) and `useOrbitDrift` (animates the nodes), so the two never
 * disagree on geometry. The brandmark particle core (the parked "sun")
 * sits at the SVG origin (0,0); each service rides its own tilted
 * elliptical orbit around it.
 *
 * Coordinate space: SVG user units in the `ServicesOrbitMap` viewBox
 * (`-140 -140 280 280`, y-DOWN). Node positions are computed with
 * `pointOnEllipse` from `lib/celestial/orbits.ts` (the canonical helper
 * the diagnostic constellation already uses).
 *
 * Geometry mirrors the `MISS_ORBITS` "four distinct bodies" family
 * (varied eccentricity + tilt so the paths read as different bodies, not
 * near-copies), scaled down to this viewBox. Line recipes are adapted
 * from the sigil-side entries of `lib/celestial/orbitStyles.ts`
 * (`ORBIT_STYLES`), which are tuned for the ~320 sigil viewBox — close
 * enough to this 280 viewBox that the dot cadence reads the same.
 *
 * NOTE: starting values; tune live against the actual parked-sun size in
 * the browser preview (the desktop sun is the R3F core, sized by R3F, not
 * by CSS — orbits must be sized to encircle whatever it projects).
 */

import { SERVICES, type ServiceId } from "./serviceData";

/** Tilted-ellipse geometry for one orbit (SVG units, pre-rotation rx/ry). */
export interface OrbitGeometry {
  /** Semi-major axis (x-radius before rotation). */
  rx: number;
  /** Semi-minor axis (y-radius before rotation). */
  ry: number;
  /** SVG rotation in degrees (positive = CW in SVG y-down space). */
  rotateDeg: number;
}

/** Stroke identity for an orbit path. */
export interface OrbitLineRecipe {
  /** Stroke color, CSS rgba() with baked alpha (group opacity layers on top). */
  stroke: string;
  /** Stroke width in SVG units (scales with the orbit — no non-scaling-stroke,
   *  so the `pathLength` draw-on works; see ServicesOrbitMap). */
  strokeWidth: number;
  /** Dash mark length; a large value (9999) with gap 0 reads as solid. */
  dashMark: number;
  /** Dash gap length. */
  dashGap: number;
  /** SVG line cap — `round` turns tiny dashes into true dots. */
  lineCap: "round" | "butt";
  /** When true the orbit is rendered DOTTED (dashMark/dashGap as the dot
   *  pattern) and revealed by fade instead of the stroke draw-on (a dotted
   *  line can't draw-on cleanly). */
  dotted?: boolean;
}

/** Full celestial config for one service orbit. */
export interface ServiceOrbit {
  id: ServiceId;
  /** 0-based index, matches `SERVICES` order and the stage `data-active-step`. */
  i: number;
  /** Short label rendered at the node (the service index, e.g. "01"). */
  label: string;
  orbit: OrbitGeometry;
  /** Resting parametric angle (deg) where the node sits at t = 0. */
  psi0Deg: number;
  /** Drift direction: +1 prograde, -1 retrograde. */
  driftDir: 1 | -1;
  /** Angular speed in degrees/second (slow — full lap ≈ 360 / this). */
  omegaDegPerSec: number;
  line: OrbitLineRecipe;
}

const SOLID_MARK = 9999;

/** Per-service geometry + motion + line, keyed by id. Merged with the
 *  live `SERVICES` order/index below so `i` and `label` never drift. */
// A 3D-reading ARMILLARY (mirrors the desktop hologram): three orbits on
// DISTINCT planes — wide near-horizontal · tall vertical meridian · inclined
// diagonal — so they cross and wrap the mark in depth, NOT nested flat circles.
// All gold (one system with the mark); the diagonal is dotted. Solid orbits
// DRAW ON (stroke draw-on wrap, services.css); the dotted one fades in. All thin.
const ORBIT_BY_ID: Record<ServiceId, Omit<ServiceOrbit, "id" | "i" | "label">> = {
  // Wide, near-horizontal — the equatorial orbit (seen slightly from above).
  keynote: {
    orbit: { rx: 104, ry: 46, rotateDeg: 8 },
    psi0Deg: 200,
    driftDir: 1,
    omegaDegPerSec: 3.0, // ≈ 120s/lap
    line: {
      stroke: "rgba(202, 165, 84, 0.6)",
      strokeWidth: 0.5,
      dashMark: SOLID_MARK,
      dashGap: 0,
      lineCap: "round",
    },
  },
  // TALL, vertical meridian — standing edge-on across the mark. The lead service.
  workshop: {
    orbit: { rx: 58, ry: 116, rotateDeg: -10 },
    psi0Deg: 285,
    driftDir: -1,
    omegaDegPerSec: 2.2, // ≈ 164s/lap
    line: {
      stroke: "rgba(202, 165, 84, 0.72)",
      strokeWidth: 0.7,
      dashMark: SOLID_MARK,
      dashGap: 0,
      lineCap: "round",
    },
  },
  // Inclined diagonal — DOTTED gold ring crossing the other two.
  embedded: {
    orbit: { rx: 110, ry: 64, rotateDeg: 52 },
    psi0Deg: 40,
    driftDir: 1,
    omegaDegPerSec: 1.6, // ≈ 225s/lap
    line: {
      stroke: "rgba(202, 165, 84, 0.5)",
      strokeWidth: 0.6,
      dashMark: 0.6,
      dashGap: 4.5,
      lineCap: "round",
      dotted: true,
    },
  },
  // Opposite-tilt inclined diagonal — the fourth armillary plane (Guided
  // Build, 2026-07-09). Mirrors the embedded diagonal across the vertical
  // so the two cross the meridian symmetrically; thin solid so it reads as
  // structure rather than a second dotted echo.
  "guided-build": {
    orbit: { rx: 108, ry: 60, rotateDeg: -46 },
    psi0Deg: 140,
    driftDir: -1,
    omegaDegPerSec: 1.9, // ≈ 190s/lap
    line: {
      stroke: "rgba(202, 165, 84, 0.55)",
      strokeWidth: 0.55,
      dashMark: SOLID_MARK,
      dashGap: 0,
      lineCap: "round",
    },
  },
};

/**
 * The three service orbits in `SERVICES` order. Built by mapping over
 * `SERVICES` so the index (`i`) and node label (`s.index`) stay locked to
 * the same content the cards + scroll stepper read.
 */
export const SERVICE_ORBITS: readonly ServiceOrbit[] = SERVICES.map((s, i) => ({
  id: s.id,
  i,
  label: s.index,
  ...ORBIT_BY_ID[s.id],
}));
