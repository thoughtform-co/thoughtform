import { describe, expect, it } from "vitest";

import { clocksAt, hop2T, STOPS, stopY } from "@/app/(internal)/test/proposal-swarm/engine/clocks";
import {
  FALL,
  fallStart,
  FLIES,
  frameAt,
  HOP1,
  HOP2,
  marchRoute,
  newFrame,
  scanRoute,
} from "@/app/(internal)/test/proposal-swarm/engine/flight";
import { SHOW } from "@/app/(internal)/test/proposal-swarm/engine/formations";
import { pickLattice, plateWidth } from "@/app/(internal)/test/proposal-swarm/engine/lattice";
import { rowAt } from "@/app/(internal)/test/proposal-swarm/engine/pool";
import { buildWorld, type Metrics } from "@/app/(internal)/test/proposal-swarm/engine/world";
import { isStraight } from "@/components/xb-proposal/kit/trace";

/* /test/proposal-swarm plays the travelling proposal's three sections with one
   swarm of dots. Everything it draws is arithmetic over the scroll, so the
   promises the page makes can be held without a browser:

     · at every rest it is S4·E's own dots on S4·E's own pixels, whichever
       way the dots fly between;
     · a hop starts where the last state left the dots and ends where the
       next one takes them, to the pixel;
     · a marching dot only ever goes level, plumb or at 45 degrees;
     · the clocks never run backwards and never overlap. */

/* the page at 1920 x 1247, as `measure.ts` reads it there */
const METRICS: Metrics = {
  vh: 1247,
  dpr: 1,
  runways: { esTop: 2494, esH: 3242, xnTop: 5736, xnH: 5362 },
  flowStage: { x: 746, y: 495, w: 392, h: 392 },
  flowFig: { x: 300, y: 440, w: 1284, h: 492.2 },
  esStage: { x: 881, y: 329, w: 645, h: 918 },
  xnFig: { x: 289, y: 404, w: 1304, h: 608.5 },
};
const W = buildWorld(METRICS);
const P = W.pool;
const R = METRICS.runways;
const at = (y: number) => clocksAt(y, METRICS.vh, R);
const Y = (name: (typeof STOPS)[number]) => stopY(name, METRICS.vh, R);
/* a hair, in px of scroll: past the pixel a clock settles within, so inside
   the hop, and too little to move a dot */
const HAIR = 1.5;

describe("the lattice", () => {
  it("is the grain S4·E was picked at wherever that seats, and the next one where it does not", () => {
    expect(pickLattice(333, 1)).toEqual({ a: 5, b: 3, n: 4 });
    expect(pickLattice(304, 1)).toEqual({ a: 5, b: 3, n: 4 });
    expect(pickLattice(248, 1)).toEqual({ a: 5, b: 3, n: 3 });
    expect(pickLattice(333, 1, 3)).toEqual({ a: 7, b: 4, n: 3 });
  });

  it("is the same plate on a screen twice as fine", () => {
    expect(plateWidth(pickLattice(333, 2), 2)).toBe(plateWidth(pickLattice(333, 1), 1));
  });

  it("gives the page the 2 838 dots of the drawing that was picked", () => {
    expect(W.dots).toBe(2838);
    expect(P.own).toBe(W.dots);
  });
});

describe("the clocks", () => {
  it("never run backwards, and one never starts before the last has ended", () => {
    let last = at(0);
    let lastT2 = hop2T(last);
    for (let y = 0; y <= R.xnTop + R.xnH; y += 7) {
      const c = at(y);
      expect(c.q1).toBeGreaterThanOrEqual(last.q1);
      expect(c.p1).toBeGreaterThanOrEqual(last.p1);
      expect(c.q2).toBeGreaterThanOrEqual(last.q2);
      expect(c.p2).toBeGreaterThanOrEqual(last.p2);
      expect(hop2T(c)).toBeGreaterThanOrEqual(lastT2);
      if (c.p1 > 0) expect(c.q1).toBe(1);
      if (c.q2 > 0) expect(c.p1).toBe(1);
      if (c.p2 > 0) expect(c.q2).toBe(1);
      last = c;
      lastT2 = hop2T(c);
    }
    expect(last.p2).toBe(1);
  });

  it("is at rest within a pixel of a rest, and in the hop past it", () => {
    expect(at(Y("opening") + 0.6).q1).toBe(0);
    expect(at(Y("navigate") - 0.6).q1).toBe(1);
    expect(at(Y("stacked") - 0.6).p1).toBe(1);
    expect(at(Y("stacked") + 0.6).q2).toBe(0);
    expect(at(Y("opening") + HAIR).q1).toBeGreaterThan(0);
    expect(at(Y("navigate") - HAIR).q1).toBeLessThan(1);
  });

  it("names its stops in the order the scroll reaches them", () => {
    const ys = STOPS.map(Y);
    for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeGreaterThanOrEqual(ys[i - 1]);
    expect(at(Y("opening")).q1).toBe(0);
    expect(at(Y("navigate")).p1).toBe(0);
    expect(at(Y("stacked")).p1).toBe(1);
    expect(at(Y("every-team")).p2).toBe(1);
  });

  it("ends each hop as its last dot lands", () => {
    for (const spec of [HOP1, HOP2])
      expect(Math.max(...spec.lead) + spec.spread + spec.jitter + spec.dur).toBeCloseTo(1, 9);
  });
});

/** Every dot's place and look at a scroll position, as plain rows. */
function shot(y: number, fly: (typeof FLIES)[number]) {
  const F = frameAt(W, at(y), 0, fly, newFrame(P.count));
  const rows: string[] = [];
  for (let d = 0; d < P.count; d++)
    rows.push(
      F.show[d] === SHOW.no
        ? "-"
        : `${F.x[d]},${F.y[d]},${F.size[d]},${F.style[d]},${(F.show[d] === SHOW.window ? F.alpha[d] : 1).toFixed(3)}`
    );
  return { F, rows };
}

describe("at rest", () => {
  it("is S4·E's own dots on S4·E's own pixels, in the opening's seat", () => {
    const { F } = shot(Y("opening"), "march");
    let checked = 0;
    for (const seg of P.segs) {
      for (let d = seg.from; d < seg.to; d++) {
        if (P.host[d] >= 0) continue;
        /* a dot that drifts is off its site by its drift, as S4·E paints it */
        if (P.amp[d] > 0) continue;
        expect(F.x[d]).toBe(W.seatA.ox + P.lx[d]);
        expect(F.y[d]).toBe(W.seatA.oy + P.ly[d] + W.seatA.lift[P.plate[d]]);
        expect(F.size[d]).toBe(W.scene.sizes[P.tier[d]]);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(2000);
    /* and the pool is the scene's three plates, dot for dot */
    const scene = W.scene.plates.reduce((sum, p) => sum + p.dots, 0);
    expect(P.own).toBe(scene);
  });

  it("stands whole, so what runs and falls may", () => {
    for (const stop of ["opening", "navigate", "encode", "stacked"] as const) {
      const { F } = shot(Y(stop), "march");
      expect(F.whole).not.toBeNull();
      expect(F.masks).toHaveLength(1);
      expect(F.masks[0].band).toBeUndefined();
    }
  });

  it("shows no rider before the teams' turn", () => {
    expect(P.count).toBeGreaterThan(P.own);
    for (const stop of ["opening", "hop1-40", "encode", "hop2-50", "module", "org"] as const) {
      const { F } = shot(Y(stop), "march");
      for (let d = P.own; d < P.count; d++) expect(F.show[d]).toBe(SHOW.no);
    }
  });
});

describe("a hop", () => {
  /** The furthest any dot is, in px, from where another frame has it; a
      dot on its way out of the opening is put back in the opening's frame. */
  const apart = (a: ReturnType<typeof shot>["F"], b: ReturnType<typeof shot>["F"]) => {
    const inPage = (F: typeof a, d: number) =>
      F.y[d] + (F.state === "hop1" && F.show[d] !== SHOW.seat ? F.ride : 0);
    let most = 0;
    for (let d = 0; d < P.own; d++)
      most = Math.max(most, Math.abs(a.x[d] - b.x[d]), Math.abs(inPage(a, d) - inPage(b, d)));
    return most;
  };

  it.each(FLIES)("starts where the stack rests and ends on its seat: %s", (fly) => {
    /* a dot is off at once, so a hair into a hop the first of them have
       moved, by a few px and no more; a landing is to the pixel */
    expect(apart(shot(Y("opening") + HAIR, fly).F, shot(Y("opening"), fly).F)).toBeLessThan(8);
    expect(shot(Y("navigate") - HAIR, fly).rows).toEqual(shot(Y("navigate"), fly).rows);
    expect(apart(shot(Y("stacked") + HAIR, fly).F, shot(Y("stacked"), fly).F)).toBeLessThan(8);
  });

  it("leaves at once: no stretch of scroll in which nothing is seen to go", () => {
    /* a twentieth of a screen into the hop the first rows are well on their
       way, and the rest have not moved in the opening's own frame */
    const rest = shot(Y("opening"), "march").F;
    const early = shot(Y("opening") + 0.05 * METRICS.vh, "march").F;
    let flying = 0;
    let furthest = 0;
    for (let d = 0; d < P.own; d++) {
      if (early.show[d] === SHOW.seat) {
        expect(early.x[d]).toBe(rest.x[d]);
        expect(early.y[d]).toBe(rest.y[d]);
        continue;
      }
      flying++;
      /* it drops first, so how far it has got is read in the opening's own frame */
      furthest = Math.max(furthest, Math.abs(early.y[d] + early.ride - rest.y[d]));
      /* the bottom plate goes first */
      expect(P.plate[d]).toBe(2);
    }
    expect(flying).toBeGreaterThan(50);
    expect(furthest).toBeGreaterThan(20);
    expect(early.ride).toBe(Math.round(0.05 * METRICS.vh * METRICS.dpr));
  });

  it.each(FLIES)("lands every dot on its bar, whichever way it flew: %s", (fly) => {
    const landed = shot(Y("bars"), fly);
    expect(landed.F.state).toBe("network");
    for (let d = 0; d < P.own; d++) {
      expect(landed.F.x[d]).toBe(W.big.x[d]);
      expect(landed.F.y[d]).toBe(W.big.y[d]);
    }
    /* and that is where the hop's last moment had them */
    const last = shot(R.xnTop + 0.19 * (R.xnH - METRICS.vh) - HAIR, fly);
    expect(last.F.state).toBe("hop2");
    for (let d = 0; d < P.own; d++) {
      expect(last.F.x[d]).toBe(W.big.x[d]);
      expect(last.F.y[d]).toBe(W.big.y[d]);
    }
  });

  it("scans: a row on its way is a rigid row, on its own line or on its landing line", () => {
    const F = shot(Y("hop1-40"), "scan").F;
    const rows = new Map<string, { y: number; dx: number }>();
    let moving = 0;
    for (let d = 0; d < P.own; d++) {
      if (F.show[d] === SHOW.seat) continue;
      const B = W.seatB(0);
      const landed = F.x[d] === B.ox + P.lx[d] && F.y[d] === B.oy + P.ly[d] + B.lift[P.plate[d]];
      if (landed) continue;
      moving++;
      const key = `${P.plate[d]}:${P.ly[d]}`;
      const mine = { y: F.y[d] - P.ly[d], dx: F.x[d] - P.lx[d] };
      const row = rows.get(key);
      if (!row) rows.set(key, mine);
      else expect(mine).toEqual(row);
    }
    expect(moving).toBeGreaterThan(100);
    expect(rows.size).toBeGreaterThan(20);
  });

  it("falls: what stands on the board drops first, and the board follows", () => {
    const first = Math.min(...Array.from({ length: P.own }, (_, d) => fallStart(P, d, FALL.lead1)));
    const F = shot(Y("opening") + (first + 0.02) * METRICS.vh, "fall").F;
    let moving = 0;
    for (let d = 0; d < P.own; d++) {
      if (F.show[d] === SHOW.seat) continue;
      moving++;
      expect(P.plate[d]).toBe(2);
      expect(P.solid[d]).toBe(1);
    }
    expect(moving).toBeGreaterThan(20);
    const [team, layer, agents] = FALL.lead1;
    expect(agents).toBeLessThan(layer);
    expect(layer).toBeLessThan(team);
  });

  it("falls whole: a plate on its way keeps its shape, but for a few stragglers", () => {
    const F = shot(Y("hop1-40"), "fall").F;
    const B = W.seatB(0);
    for (const p of [0, 1, 2]) {
      const off: number[] = [];
      for (let d = 0; d < P.own; d++) {
        if (P.plate[d] !== p || F.show[d] !== SHOW.yes || P.solid[d]) continue;
        if (P.h[d] > FALL.keep || P.amp[d] > 0) continue;
        const ty = B.oy + P.ly[d] + B.lift[p];
        if (F.y[d] === ty) continue;
        off.push(F.y[d] - P.ly[d]);
      }
      if (off.length < 50) continue;
      /* the body is one lattice: every row of it on the same way, to the px */
      expect(Math.max(...off) - Math.min(...off)).toBeLessThanOrEqual(1);
    }
  });

  it("scans the bottom plate first", () => {
    const F = shot(Y("opening") + 0.05 * METRICS.vh, "scan").F;
    let moving = 0;
    for (let d = 0; d < P.own; d++) {
      if (F.show[d] === SHOW.seat) continue;
      moving++;
      expect(P.plate[d]).toBe(2);
    }
    expect(moving).toBeGreaterThan(20);
  });

  it("builds the stack from the ground up on the way into the steps", () => {
    const [team, layer, agents] = HOP1.lead;
    expect(agents).toBeLessThan(layer);
    expect(layer).toBeLessThan(team);
  });

  it("stands the whole opened stack inside the steps' stage", () => {
    const B = W.seatB(0);
    const row = W.L.b * W.L.g;
    const top = B.oy + B.lift[0] - W.thick[0] * row;
    const bottom = B.oy + B.lift[2] + 2 * W.L.m * row;
    expect(top).toBeGreaterThanOrEqual(METRICS.esStage.y * METRICS.dpr);
    expect(bottom).toBeLessThanOrEqual((METRICS.esStage.y + METRICS.esStage.h) * METRICS.dpr);
    /* and it closes about its middle plate, which does not move */
    expect(W.seatB(1).oy).toBe(B.oy);
    expect(W.seatB(1).lift[1]).toBe(0);
    expect(Math.abs(W.seatB(1).lift[0])).toBeLessThan(Math.abs(B.lift[0]));
  });

  it("marches only level, plumb or at 45 degrees", () => {
    const B0 = W.seatB(0);
    const B1 = W.seatB(1);
    for (let d = 0; d < P.own; d += 7) {
      const p = P.plate[d];
      const first = marchRoute(
        W.seatA.ox + P.lx[d],
        W.seatA.oy + P.ly[d] + W.seatA.lift[p],
        B0.ox + P.lx[d],
        B0.oy + P.ly[d] + B0.lift[p],
        W.cut,
        HOP1.first
      );
      const second = marchRoute(
        B1.ox + P.lx[d],
        B1.oy + P.ly[d] + B1.lift[p],
        W.big.x[d],
        W.big.y[d],
        W.cut,
        HOP2.first
      );
      expect(isStraight(first, 1e-6)).toBe(true);
      expect(
        isStraight(
          scanRoute(W.seatA.ox + P.lx[d], W.seatA.oy + P.ly[d], B0.ox + P.lx[d], B0.oy + P.ly[d]),
          1e-6
        )
      ).toBe(true);
      expect(isStraight(second, 1e-6)).toBe(true);
    }
  });

  it("keeps a plate's silhouette on the rows still standing, top of the screen first", () => {
    for (const p of [0, 1, 2]) {
      let last = -Infinity;
      for (let r = 0; r <= 1.0001; r += 1 / 32) {
        const y = rowAt(P, p, r);
        expect(y).toBeGreaterThanOrEqual(last);
        last = y;
      }
    }
    const mid = shot(Y("hop1-40"), "march").F;
    expect(mid.whole).toBeNull();
    expect(mid.masks.length).toBeGreaterThan(0);
    /* what still stands in the opening is stated in the opening's own space */
    expect(mid.masks[0].home).toBe(true);
    /* rigid is the travel as it was: the stack whole, its silhouettes with it */
    const rigid = shot(Y("hop1-40"), "rigid").F;
    expect(rigid.masks).toHaveLength(1);
    expect(rigid.masks[0].alpha).toEqual([1, 1, 1]);
  });
});

describe("the bars", () => {
  it("keeps one dot on every cell of Marketing's three bars", () => {
    const cells = new Map<string, number>();
    for (let d = 0; d < P.own; d++) {
      const key = `${P.plate[d]}:${W.node.x[d]},${W.node.y[d]}`;
      cells.set(key, (cells.get(key) ?? 0) + (W.org.team[d] < 0 ? 1 : 0));
    }
    const grid = (W.L.m + 1) * (W.L.n + 1);
    expect(cells.size).toBe(3 * grid);
    for (const stay of cells.values()) expect(stay).toBeGreaterThanOrEqual(1);
  });

  it("holds its dots off a course's words for as long as they are lettered", () => {
    const worded: number[] = [];
    for (let d = 0; d < P.own; d++) if (W.big.show[d] === SHOW.window) worded.push(d);
    expect(worded.length).toBeGreaterThan(30);
    /* the courses are lettered over the last of the turn and until the view
       has begun to draw back: p from about 0.2 to 0.4 */
    for (const p of [0.2, 0.27, 0.34, 0.4]) {
      const F = shot(R.xnTop + p * (R.xnH - METRICS.vh), "march").F;
      for (const d of worded) {
        expect(F.show[d]).toBe(SHOW.window);
        expect(F.alpha[d]).toBeLessThanOrEqual(0.001);
      }
    }
  });
});

describe("then every team", () => {
  it("seats every dot that leaves, and leaves Marketing as it was", () => {
    const end = shot(Y("every-team"), "march").F;
    let left = 0;
    for (let d = 0; d < P.count; d++) {
      if (W.org.team[d] < 0) continue;
      left++;
      expect(end.x[d]).toBe(W.org.to.x[d]);
      expect(end.y[d]).toBe(W.org.to.y[d]);
      expect(end.show[d]).toBe(SHOW.yes);
    }
    expect(left).toBe(W.org.left);
    /* six teams, a whole first course each */
    const grid = (W.L.m + 1) * (W.L.n + 1);
    expect(left).toBeGreaterThanOrEqual(6 * grid);
  });

  it("walks them on lanes that are level, plumb or at 45 degrees", () => {
    for (const ribbon of W.org.lanes)
      for (const lane of ribbon) {
        const pts: [number, number][] = [];
        for (let i = 0; i < lane.cum.length; i++) pts.push([lane.pts[i * 2], lane.pts[i * 2 + 1]]);
        expect(isStraight(pts, 1e-3)).toBe(true);
      }
    for (const trace of W.traces.traces) {
      const pts: [number, number][] = [];
      for (let i = 0; i < trace.lane.cum.length; i++)
        pts.push([trace.lane.pts[i * 2], trace.lane.pts[i * 2 + 1]]);
      expect(isStraight(pts, 1e-3)).toBe(true);
    }
  });

  it("sends no dot before its team's turn", () => {
    const before = shot(Y("org"), "march").F;
    for (let d = 0; d < P.count; d++) {
      if (P.host[d] >= 0) expect(before.show[d]).toBe(SHOW.no);
      else {
        expect(before.x[d]).toBe(W.node.x[d]);
        expect(before.y[d]).toBe(W.node.y[d]);
      }
    }
  });
});
