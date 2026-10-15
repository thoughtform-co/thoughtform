/**
 * Logic to statistics (ADR-156 U3), after Benedict Evans's keynote "AI Is
 * Eating the World" (hx Live NYC 2026): every earlier wave of automation ran
 * on LOGICAL STEPS you could write down; this one works wherever there is
 * enough data and the answers can be checked, "a logic problem into a
 * statistics problem".
 *
 * Drawn as two machines on one floor: on the left, a stair of five steps on
 * a single wire, each step the next instruction; on the right, a cloud of
 * observations and, through it, the one gold line the model fits.
 *
 * ⚠ The framing's one projection; crop derived; nothing lettered; PURE and
 * seeded, so the server and the handout draw the same cloud.
 */

import { type WorldPt, frameAround } from "../../framing/floor";
import {
  type IsoBox,
  type IsoFrame,
  type Pt,
  isoBox,
  isoDepth,
  isoFraction,
  isoGrid,
  isoPath,
  isoProject,
  mulberry32,
} from "../../framing/iso";

export const LG_FLOOR = { w: 12, d: 7 } as const;

/** The stair: five instructions, one after the other, along `b`. */
export const STEPS: IsoBox[] = [0, 1, 2, 3, 4].map((i) => ({
  a: 0.9,
  b: 0.9 + i * 1.15,
  w: 0.9,
  d: 0.9,
  z: 0,
  h: 0.3 + i * 0.28,
}));

/** The statistics region, along `a`. */
const ST = { a0: 4.4, a1: 11.4, b0: 0.6, b1: 4.4 } as const;
export const SLOPE = 0.24;
export const OBSERVATIONS = 140;
const SEED = 1997;

/** The fitted line's height at `a` (the model the cloud resolves to). */
export const fit = (a: number) => 0.25 + SLOPE * (a - ST.a0);

export function observations(): WorldPt[] {
  const rnd = mulberry32(SEED);
  const pts: WorldPt[] = [];
  for (let i = 0; i < OBSERVATIONS; i++) {
    const a = ST.a0 + rnd() * (ST.a1 - ST.a0);
    const b = ST.b0 + rnd() * (ST.b1 - ST.b0);
    const noise = (rnd() + rnd() + rnd() - 1.5) * 0.7;
    pts.push({ a, b, z: Math.max(0.05, fit(a) + noise) });
  }
  return pts;
}

export function logicFrame(): IsoFrame {
  const pts: WorldPt[] = [
    { a: 0, b: 0, z: 0 },
    { a: LG_FLOOR.w, b: 0, z: 0 },
    { a: LG_FLOOR.w, b: LG_FLOOR.d, z: 0 },
    { a: 0, b: LG_FLOOR.d, z: 0 },
    { a: ST.a1, b: ST.b0, z: fit(ST.a1) + 1.2 },
    ...STEPS.map((s) => ({ a: s.a, b: s.b + s.d, z: s.h })),
  ];
  return frameAround(pts, { l: 170, r: 170, t: 30, b: 40 });
}

export function logicScene(f: IsoFrame) {
  const steps = STEPS.map((box, i) => ({ i, box, paths: isoBox(box, f) })).sort(
    (p, q) => isoDepth(q.box.a, q.box.b) - isoDepth(p.box.a, p.box.b)
  );
  // The single wire: down the stair's tops, one instruction to the next.
  const wire = isoPath(
    STEPS.map((s) => isoProject(s.a + s.w / 2, s.b + s.d / 2, s.h, f))
  );
  const dots: Pt[] = observations().map((p) => isoProject(p.a, p.b, p.z, f));
  const mid = (ST.b0 + ST.b1) / 2;
  const line = isoPath([isoProject(ST.a0, mid, fit(ST.a0), f), isoProject(ST.a1, mid, fit(ST.a1), f)]);
  const region = isoPath(
    [
      isoProject(ST.a0, ST.b0, 0, f),
      isoProject(ST.a1, ST.b0, 0, f),
      isoProject(ST.a1, ST.b1, 0, f),
      isoProject(ST.a0, ST.b1, 0, f),
    ],
    true
  );
  return { steps, wire, dots, line, region, grid: isoGrid(0, 0, LG_FLOOR.w, LG_FLOOR.d, 0, 3, f) };
}

const GAP = 14;

export function logicSeats(f: IsoFrame) {
  const top = STEPS[STEPS.length - 1];
  const t = isoProject(top.a, top.b + top.d, top.h * 0.5, f);
  const end = isoProject(ST.a1, (ST.b0 + ST.b1) / 2, fit(ST.a1), f);
  return {
    logic: {
      seat: isoFraction({ x: t.x - GAP, y: t.y }, f),
      leader: isoPath([t, { x: t.x - GAP + 3, y: t.y }]),
    },
    statistics: {
      seat: isoFraction({ x: end.x + GAP, y: end.y }, f),
      leader: isoPath([end, { x: end.x + GAP - 3, y: end.y }]),
    },
  };
}
