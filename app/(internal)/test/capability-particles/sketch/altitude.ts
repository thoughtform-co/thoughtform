/* B · Altitude: a climb, not a wheel. PURE.

   The proposal's design system draws the flywheel as "a climb, not a wheel.
   The repetition is drawn as altitude gained, never as a horizontal circle"
   (`docs/design/xbionic-proposal/proposal-design-system.md`, A6). So:

   An open floor of dots, S4·E's own ground, isometric, and on it four thin
   columns, one a workstream, left to right as the chips run top down. Each
   run of real work is a drop that falls from above and lands on its
   column, raising it a level. Thoughtform is gold: its one drop opens each
   column in turn, the first run done together, and the column's first level
   is laid in bone. Then the team's drops fall on their own, green, closer
   and closer together: it compounds. The gold does not come back. At rest
   the four columns stand at their height, and a lit dot climbs each one,
   the team still at work on it. */

import { bayer } from "../../stack-forms/model";

import { drop, type Geom, lerp, put, type Sketch, STYLE, TRAIL } from "./core";

/** The floor: sites a side, and where its middle is in the frame's units. */
const FLOOR = 56;
const MID: [number, number] = [740, 300];
/** The four columns: their site along the floor, on its middle row, and
    how many sites a side each stands on. */
const AT = [8, 20, 32, 44] as const;
const FOOT = 3;
/** Each column's height at rest, in levels; a level is two z steps. */
const TALL = [30, 24, 36, 27] as const;
/** When the gold opens each column, how long a drop falls, and the team's
    first gap after it; each gap after that is `QUICKEN` of the last, never
    under `CLOSEST`. */
const OPEN = (p: number) => 0.8 + p * 1.6;
const FALL = 0.6;
const GAP = 0.9;
const QUICKEN = 0.86;
const CLOSEST = 0.16;
/** A climber's way up its column at rest, seconds. */
const CLIMB = 2.4;

export function altitude(G: Geom): Sketch {
  const { g, sizes } = G;
  const a = 5 * g;
  const b = 3 * g;
  const cx = Math.round((MID[0] * G.u) / a) * a;
  const cy = Math.round((MID[1] * G.u) / b) * b;
  const half = FLOOR / 2;
  const px = (i: number, j: number) => cx + (i - j) * a;
  const py = (i: number, j: number, k: number) => cy + (i + j - FLOOR - k) * b;
  const above = -6 * b;

  /* the floor: every other site, thinning to nothing at its rim */
  const floor: [number, number, number][] = [];
  for (let i = 0; i <= FLOOR; i += 2)
    for (let j = 0; j <= FLOOR; j += 2) {
      const r = Math.max(Math.abs(i - half), Math.abs(j - half)) / half;
      if (bayer(i >> 1, j >> 1) >= 1.15 - r) continue;
      floor.push([px(i, j), py(i, j, 0), r < 0.55 ? 1 : 0]);
    }

  /* each column's drops: the gold's, then the team's, closer and closer */
  const drops = AT.map((_, p) => {
    const list: { at: number; gold: boolean }[] = [{ at: OPEN(p), gold: true }];
    let at = OPEN(p) + FALL + 0.2;
    let gap = GAP;
    for (let n = 1; n < TALL[p]; n++) {
      list.push({ at, gold: false });
      at += gap;
      gap = Math.max(CLOSEST, gap * QUICKEN);
    }
    return list;
  });
  const done = Math.max(...drops.map((d) => d[d.length - 1].at + FALL));

  const columnTop = (p: number, levels: number) => {
    const i = AT[p];
    /* the middle of its sites, on its top */
    const m = (FOOT - 1) / 2;
    return { x: px(i + m, half + m), y: py(i + m, half + m, 2 * levels) };
  };

  return {
    rest: done,
    routes: AT.map((_, p): [number, number][] => {
      const top = columnTop(p, TALL[p]);
      return [
        [top.x, above],
        [top.x, top.y],
      ];
    }),
    frame(t, D) {
      D.n = 0;
      for (const [x, y, tier] of floor) put(D, x, y, sizes[tier], STYLE.bed);
      AT.forEach((i, p) => {
        const list = drops[p];
        let levels = 0;
        for (const d of list) if (t >= d.at + FALL) levels++;
        /* the column, a level a time, back sites first; its top level is
           the lit one, its first is bone: the run done with Thoughtform */
        for (let k = 1; k <= levels; k++) {
          const top = k === levels;
          const style = k === 1 ? STYLE.agentsLit : top ? STYLE.teamLit : STYLE.team;
          for (let di = 0; di < FOOT; di++)
            for (let dj = 0; dj < FOOT; dj++) {
              /* below its top, a level shows only its rim */
              const rim = di === 0 || dj === 0 || di === FOOT - 1 || dj === FOOT - 1;
              if (!rim && !top) continue;
              const front = di === FOOT - 1 || dj === FOOT - 1;
              put(
                D,
                px(i + di, half + dj),
                py(i + di, half + dj, 2 * k),
                top || front ? sizes[2] : sizes[1],
                style
              );
            }
        }
        /* the drops on their way down, each trailing two smaller dots */
        for (let n = 0; n < list.length; n++) {
          const d = list[n];
          if (t < d.at || t >= d.at + FALL) continue;
          const s = (t - d.at) / FALL;
          const end = columnTop(p, n + 1);
          const style = d.gold ? STYLE.fallGold : STYLE.fallGreen;
          put(D, end.x, lerp(above, end.y, drop(s)), d.gold ? sizes[3] : sizes[2], style);
          for (const [back, tier] of TRAIL) {
            if (s - back <= 0) break;
            put(D, end.x, lerp(above, end.y, drop(s - back)), sizes[tier], style);
          }
        }
        /* at rest, a lit dot climbs each column: the team still at it */
        if (t >= done && levels > 1) {
          const k = 1 + (Math.floor(((t - done) / CLIMB + p * 0.27) * levels) % levels);
          const f = FOOT - 1;
          put(D, px(i + f, half + f), py(i + f, half + f, 2 * k), sizes[3], STYLE.teamLit);
        }
      });
    },
  };
}
