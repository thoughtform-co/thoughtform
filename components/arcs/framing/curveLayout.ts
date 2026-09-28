/**
 * curveLayout — THE CURVE, as a staircase on the stage (ADR-130 U4).
 *
 * METR's finding: the length of task an agent finishes half the time doubles
 * about every seven months. On a doubling axis every doubling is the same
 * height, so the record IS a staircase — seven treads, one riser every seven
 * months from January 2023, the last tread the frontier now and the drawing's
 * one gold object. It stands on the same stage as the three stages before it
 * (`floor.ts`): the same view, the same time edge running up to the right, so
 * the step from the first models to the frontier reads as the same build-up
 * the prompt, the tool and the agent did one beat earlier.
 *
 * ⚠ A PICTURE OF THE FINDING, NOT A MEASUREMENT PER MODEL, and the beat's
 * `note` says so. Never interpolated into a smooth curve, which would claim a
 * reading per release the record does not publish (ADR-078 U1).
 *
 * ⚠ THE HEIGHTS ARE READ OFF A POST AT THE RIGHT, NEVER OFF THE STEPS: every
 * seat beside a tread lands on the staircase's own side face, and nothing is
 * ever lettered on a face. Each lettered height runs as a dashed contour along
 * the side face to the post, and the post carries the word.
 *
 * ⚠ PURE, and every point absolute (no `transform` anywhere).
 */

import {
  type IsoBox,
  type IsoFrame,
  type IsoLabel,
  type Pt,
  isoBox,
  isoDepth,
  isoFraction,
  isoGrid,
  isoPath,
  isoPlane,
  isoProject,
} from "./iso";
import { GRID_PITCH, TIME_A, type WorldPt, besideEdge, floorCorners, frameAround } from "./floor";

/** Four years of dates on the shared twelve-unit time edge. */
export const MONTHS = 48;
export const A_PER_MONTH = TIME_A / MONTHS;
/** One riser every seven months, and how much each one rises. */
export const RISE_MONTHS = 7;
export const TREADS = 7;
export const RISER = 0.4;
/** How deep the staircase runs, and the floor under it. */
export const DEPTH = 3;
/**
 * Where "now" sits, in months after January 2023: the last week of September
 * 2026. ⚠ A page date, not a clock — the figure is static and dated in copy.
 */
export const NOW_MONTHS = 44.9;
export const NOW_A = NOW_MONTHS * A_PER_MONTH;

export const treadA = (k: number) => k * RISE_MONTHS * A_PER_MONTH;
export const treadZ = (k: number) => (k + 1) * RISER;
export const yearA = (i: number) => i * 12 * A_PER_MONTH;
/** The post the heights are read off, at the end of the time edge. */
export const POST_A = TIME_A;

/** The four lettered treads: the first, third, fifth and seventh. */
export const LETTERED_TREADS = [0, 2, 4, 6] as const;

/** Tread `k` as a block: from its riser to the next one (or to now). */
export function treadBox(k: number): IsoBox {
  const a0 = treadA(k);
  const a1 = k === TREADS - 1 ? NOW_A : treadA(k + 1);
  return { a: a0, b: 0, w: a1 - a0, d: DEPTH, z: 0, h: treadZ(k) };
}

const TOP_Z = treadZ(TREADS - 1);

function worldExtent(): WorldPt[] {
  const pts = floorCorners(TIME_A, DEPTH);
  for (let k = 0; k < TREADS; k += 1) {
    const b = treadBox(k);
    pts.push({ a: b.a, b: DEPTH, z: b.h }, { a: b.a + b.w, b: 0, z: b.h });
  }
  pts.push({ a: POST_A, b: 0, z: TOP_Z + 0.5 });
  return pts;
}

/* The left pad holds the reference plane's two-line name, the right the
   post's four heights, the foot the years and the rotated axis caption. */
export const CURVE_FRAME: IsoFrame = frameAround(worldExtent(), { l: 210, r: 150, t: 34, b: 96 });
export const CURVE_VB = { w: CURVE_FRAME.w, h: CURVE_FRAME.h } as const;

export function curveFraction(p: Pt): { ax: number; at: number } {
  return isoFraction(p, CURVE_FRAME);
}

export function curveGrid() {
  return isoGrid(0, 0, TIME_A, DEPTH, 0, GRID_PITCH, CURVE_FRAME);
}

/** The time edge, drawn a rung above the grid. */
export function curveAxis(): string {
  return isoPath([isoProject(0, 0, 0, CURVE_FRAME), isoProject(TIME_A, 0, 0, CURVE_FRAME)]);
}

/** The treads, FARTHEST FIRST (a later tread stands further up the edge). */
export function curveTreads() {
  return Array.from({ length: TREADS }, (_, k) => ({
    k,
    lit: k === TREADS - 1,
    paths: isoBox(treadBox(k), CURVE_FRAME),
    depth: isoDepth(treadBox(k).a, 0),
  })).sort((p, q) => q.depth - p.depth);
}

/** The year ticks on the time edge. */
export function yearTicks(count: number): readonly string[] {
  return Array.from({ length: count }, (_, i) => {
    const p = isoProject(yearA(i), 0, 0, CURVE_FRAME);
    return isoPath([p, { x: p.x, y: p.y + 6 }]);
  });
}

/** The post the heights are read off, and one dashed contour per lettered tread. */
export function heightPost(): {
  post: string;
  contours: readonly string[];
  ticks: readonly string[];
} {
  const f = CURVE_FRAME;
  const post = isoPath([isoProject(POST_A, 0, 0, f), isoProject(POST_A, 0, TOP_Z + 0.5, f)]);
  const contours = LETTERED_TREADS.map((k) => {
    const b = treadBox(k);
    return isoPath([isoProject(b.a + b.w, 0, b.h, f), isoProject(POST_A, 0, b.h, f)]);
  });
  const ticks = LETTERED_TREADS.map((k) => {
    const p = isoProject(POST_A, 0, treadZ(k), f);
    return isoPath([p, { x: p.x + 6, y: p.y }]);
  });
  return { post, contours, ticks };
}

/** The reference plane: the length of work THIS room is here to hand over. */
export function referencePlane(tread: number): string {
  return isoPlane(0, 0, TIME_A, DEPTH, treadZ(tread), CURVE_FRAME);
}

/** Every word's seat, shared by the renderer and the fit guard. */
export function curveSeats(years: number) {
  const f = CURVE_FRAME;
  return {
    treads: LETTERED_TREADS.map((k) => {
      const p = isoProject(POST_A, 0, treadZ(k), f);
      return curveFraction({ x: p.x + 12, y: p.y });
    }),
    years: Array.from({ length: years }, (_, i) => {
      const p = isoProject(yearA(i), 0, 0, f);
      return curveFraction({ x: p.x, y: p.y + 12 });
    }),
    now: (() => {
      const p = isoProject(NOW_A, 0, 0, f);
      return curveFraction({ x: p.x, y: p.y + 12 });
    })(),
    nowTick: (() => {
      const p = isoProject(NOW_A, 0, 0, f);
      return isoPath([p, { x: p.x, y: p.y + 6 }]);
    })(),
    axisY: (() => {
      const p = isoProject(POST_A, 0, TOP_Z + 0.5, f);
      return curveFraction({ x: p.x, y: p.y - 10 });
    })(),
    axisAlong: curveFraction(besideEdge("a", TIME_A * 0.5, 66, f)),
    reference: (tread: number) => {
      const p = isoProject(0, DEPTH, treadZ(tread), f);
      return curveFraction({ x: p.x - 12, y: p.y });
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
      anchor: "start" as const,
    })),
    ...section.years.map((text, i) => ({
      id: `year-${i}`,
      text,
      ...s.years[i],
      anchor: "middle" as const,
      vAlign: "top" as const,
    })),
    { id: "now", text: section.now, ...s.now, anchor: "middle" as const, vAlign: "top" as const },
    {
      id: "axis-y",
      text: section.axis.y,
      ...s.axisY,
      anchor: "middle" as const,
      vAlign: "bottom" as const,
    },
    {
      id: "axis-along",
      text: section.axis.along,
      ...s.axisAlong,
      anchor: "middle" as const,
      rot: -22,
    },
    {
      id: "reference",
      text: section.reference.label,
      ...s.reference(section.reference.tread),
      anchor: "end" as const,
      measure: 180,
      lines: 2,
    },
  ];
}

/** Every point the drawing uses, for the containment walk. */
export function curveExtent(): readonly Pt[] {
  return worldExtent().map((p) => isoProject(p.a, p.b, p.z, CURVE_FRAME));
}
