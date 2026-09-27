/**
 * curveLayout — the geometry of THE CURVE (ADR-130, redrawn in U1).
 *
 * METR's finding, drawn in the brandworld's isometric register: the length of
 * task an agent finishes half the time doubles about every seven months. One
 * tread is one doubling and one riser is seven months on a dated axis, so the
 * ladder's pitch IS the finding — and here that ladder is EXTRUDED into a
 * stepped relief, the crest running along its near edge, the far profile and
 * the cross-ties behind it, the footprint's hidden edges dashed.
 *
 * ⚠ A PICTURE OF THE FINDING, NOT A MEASUREMENT PER MODEL — the beat's `note`
 * says so. The treads are relabelled at every second step (minutes, a
 * quarter, an hour, half a day: two doublings apart each, x4). Never
 * interpolated into a smooth curve, which would claim a reading per release
 * the record does not publish (ADR-078 U1's own ruling).
 *
 * ⚠ THE TIME AXIS IS STRETCHED AGAINST THE WORK AXIS, ON PURPOSE. Seven
 * doublings are three years of dates and three units of height; drawn at one
 * scale on a 2.5:1 crop the relief is a stub in the left third. `YEAR_A` is
 * that stretch, stated once — the years' own spacing stays uniform, so the
 * axis is still a dated axis and nothing about the reading changes.
 *
 * ⚠ PURE, and every point absolute (no `transform` anywhere).
 */

import {
  ISO_BASIS_CABINET,
  ISO_SEED,
  type IsoFrame,
  type IsoLabel,
  type Pt,
  isoDust,
  isoFraction,
  isoGrid,
  isoPath,
  isoPlane,
  isoProject,
  isoSteps,
} from "./iso";

export const CURVE_VB = { w: 1000, h: 400 } as const;

export const CURVE_FRAME: IsoFrame = {
  w: CURVE_VB.w,
  h: CURVE_VB.h,
  ox: 110,
  oy: 350,
  k: 92,
  basis: ISO_BASIS_CABINET,
};

/** One year, in units of `a` (the stretch above). */
export const YEAR_A = 2.1;
/** The riser's pitch: one doubling every seven months. */
export const RISE_MONTHS = 7;
/** Seven treads, one per doubling, and how much each one rises. */
export const TREADS = 7;
export const TREAD_RISE = 0.5;
/** How deep the relief runs. */
export const DEPTH = 0.7;

/**
 * Where "now" sits, in months after the first year mark: the last week of
 * September in the fourth year. ⚠ A page date, not a clock — the figure is
 * static and the workshop is dated in its copy.
 */
export const NOW_MONTHS = 44.9;

export const yearA = (i: number) => i * YEAR_A;
export const treadZ = (i: number) => i * TREAD_RISE;
export const NOW_A = (NOW_MONTHS / 12) * YEAR_A;

/** The staircase, tread by tread: one riser every seven months. */
export function profile(): readonly { a: number; z: number }[] {
  return Array.from({ length: TREADS }, (_, k) => ({
    a: (k * RISE_MONTHS * YEAR_A) / 12,
    z: treadZ(k),
  }));
}

/** The relief. `crest` keeps the draw-on run's name in the renderer. */
export function ladder() {
  return isoSteps(profile(), NOW_A, 0, DEPTH, CURVE_FRAME);
}

export function curveGrid() {
  return isoGrid(0, 0, NOW_A, DEPTH, 0, YEAR_A, CURVE_FRAME);
}

/** The year posts: a dated graticule, rising from the far edge of the floor. */
export function yearPosts(count: number): readonly string[] {
  return Array.from({ length: count }, (_, i) =>
    isoPath([
      isoProject(yearA(i), DEPTH, 0, CURVE_FRAME),
      isoProject(yearA(i), DEPTH, treadZ(TREADS - 1), CURVE_FRAME),
    ])
  );
}

/** The reference tread: the length of work THIS room is here to hand over. */
export function referencePlane(tread: number): string {
  return isoPlane(0, 0, NOW_A, DEPTH, treadZ(tread), CURVE_FRAME);
}

export function curveDust(): readonly Pt[] {
  return isoDust(ISO_SEED, 20, 0, 0, NOW_A, DEPTH, treadZ(TREADS - 1), CURVE_FRAME);
}

/** A point as fractions of the crop. */
export function curveFraction(x: number, y: number): { ax: number; at: number } {
  return isoFraction({ x, y }, CURVE_FRAME);
}

/** The four lettered treads: one, three, five and seven, bottom up. */
export const LETTERED_TREADS = [0, 2, 4, 6] as const;

/** Every seat the renderer and the fit guard share. */
export function curveSeats(years: number) {
  const nowTop = isoProject(NOW_A, 0, treadZ(TREADS - 1), CURVE_FRAME);
  return {
    treads: LETTERED_TREADS.map((t) => {
      const p = isoProject(0, 0, treadZ(t), CURVE_FRAME);
      return curveFraction(p.x - 12, p.y);
    }),
    years: Array.from({ length: years }, (_, i) => {
      const p = isoProject(yearA(i), 0, 0, CURVE_FRAME);
      return curveFraction(p.x, p.y + 14);
    }),
    now: curveFraction(isoProject(NOW_A, 0, 0, CURVE_FRAME).x, CURVE_FRAME.oy + 14),
    seat: curveFraction(nowTop.x, nowTop.y),
    axisY: curveFraction(CURVE_FRAME.ox - 12, 44),
    axisAlong: curveFraction(CURVE_VB.w - 24, 44),
    reference: (tread: number) => {
      const p = isoProject(NOW_A, DEPTH, treadZ(tread), CURVE_FRAME);
      return curveFraction(p.x + 10, p.y);
    },
  };
}

export function curveLabels(section: {
  years: readonly string[];
  now: string;
  treads: readonly string[];
  axis: { y: string; along: string };
  reference: { label: string; tread: number };
}): readonly IsoLabel[] {
  const s = curveSeats(section.years.length);
  return [
    ...LETTERED_TREADS.map((t, i) => ({
      id: `tread-${t}`,
      text: section.treads[i] ?? "",
      ...s.treads[i],
      anchor: "end" as const,
    })),
    ...section.years.map((text, i) => ({
      id: `year-${i}`,
      text,
      ...s.years[i],
      anchor: "middle" as const,
      vAlign: "top" as const,
    })),
    { id: "now", text: section.now, ...s.now, anchor: "middle" as const, vAlign: "top" as const },
    { id: "axis-y", text: section.axis.y, ...s.axisY, anchor: "end" as const },
    { id: "axis-along", text: section.axis.along, ...s.axisAlong, anchor: "end" as const },
    {
      id: "reference",
      text: section.reference.label,
      ...s.reference(section.reference.tread),
      anchor: "start" as const,
      measure: 120,
      lines: 2,
    },
  ];
}

/** Every point the drawing uses, for the fit guard's containment walk. */
export function curveExtent(): readonly Pt[] {
  return [
    isoProject(0, 0, 0, CURVE_FRAME),
    isoProject(NOW_A, 0, 0, CURVE_FRAME),
    isoProject(NOW_A, DEPTH, treadZ(TREADS - 1), CURVE_FRAME),
    isoProject(0, DEPTH, treadZ(TREADS - 1), CURVE_FRAME),
  ];
}
