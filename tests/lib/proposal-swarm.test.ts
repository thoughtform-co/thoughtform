import { describe, expect, it } from "vitest";

import {
  BARS_BY,
  clocksAt,
  hop2T,
  LETTERED,
  networkAt,
  STOPS,
  stopY,
} from "@/app/(internal)/test/proposal-swarm/engine/clocks";
import {
  charMid,
  eraseX,
  frontX,
  headOn,
  scaleAt,
  typedOf,
} from "@/app/(internal)/test/proposal-swarm/engine/courses";
import {
  FALL,
  fallStart,
  FLIES,
  type Frame,
  frameAt,
  HOP1,
  marchRoute,
  newFrame,
  scanRoute,
  TURN,
} from "@/app/(internal)/test/proposal-swarm/engine/flight";
import { SHOW } from "@/app/(internal)/test/proposal-swarm/engine/formations";
import {
  engraved,
  lightOf,
  markCover,
} from "@/app/(internal)/test/proposal-swarm/engine/mark";
import { pickLattice, plateWidth } from "@/app/(internal)/test/proposal-swarm/engine/lattice";
import { rowAt } from "@/app/(internal)/test/proposal-swarm/engine/pool";
import { buildWorld, type Metrics } from "@/app/(internal)/test/proposal-swarm/engine/world";
import { isStraight } from "@/components/xb-proposal/kit/trace";
import { STYLE } from "@/app/(internal)/test/stack-forms/swarm/dots";

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

  it("ends the first hop as its last dot lands", () => {
    expect(Math.max(...HOP1.lead) + HOP1.spread + HOP1.jitter + HOP1.dur).toBeCloseTo(1, 9);
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
    const last = shot(R.xnTop + BARS_BY * (R.xnH - METRICS.vh) - HAIR, fly);
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
      expect(isStraight(first, 1e-6)).toBe(true);
      expect(
        isStraight(
          scanRoute(W.seatA.ox + P.lx[d], W.seatA.oy + P.ly[d], B0.ox + P.lx[d], B0.oy + P.ly[d]),
          1e-6
        )
      ).toBe(true);
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

describe("the turn into the network", () => {
  /** The silhouettes a turning stack hides with, a segment each. */
  const polys = (F: Frame) => F.masks.find((m) => m.poly)?.poly ?? null;
  /** Inside a convex polygon, or on its edge. */
  const inPoly = (poly: Int32Array, x: number, y: number) => {
    let sign = 0;
    const n = poly.length / 2;
    for (let q = 0; q < n; q++) {
      const ax = poly[q * 2];
      const ay = poly[q * 2 + 1];
      const bx = poly[((q + 1) % n) * 2];
      const by = poly[((q + 1) % n) * 2 + 1];
      const c = Math.sign((bx - ax) * (y - ay) - (by - ay) * (x - ax));
      if (c === 0) continue;
      if (sign === 0) sign = c;
      else if (c !== sign) return false;
    }
    return true;
  };
  const extent = (poly: Int32Array) => {
    const xs = poly.filter((_, q) => q % 2 === 0);
    const ys = poly.filter((_, q) => q % 2 === 1);
    return { w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  };
  /** Each plate's own segment, team first. */
  const plateSeg = [0, 1, 2].map((p) =>
    P.segs.findIndex((s) => !s.block && s.plate === p && s.from < P.own)
  );

  it("turns the stack as one object: mid-turn every dot stands on its own plate", () => {
    for (const stop of ["hop2-25", "hop2-50"] as const) {
      const { F } = shot(Y(stop), "fall");
      expect(F.state).toBe("hop2");
      const own = polys(F);
      expect(own).not.toBeNull();
      let checked = 0;
      P.segs.forEach((seg, n) => {
        const poly = own![n];
        if (!poly) return;
        /* a solid on the board gathers to the board's lines */
        const board = seg.block ? own![plateSeg[2]] : null;
        for (let d = seg.from; d < seg.to; d++) {
          /* a dot that drifts is off its site by its drift */
          if (P.amp[d] > 0) continue;
          const on = inPoly(poly, F.x[d], F.y[d]) || (!!board && inPoly(board, F.x[d], F.y[d]));
          expect(on).toBe(true);
          checked++;
        }
      });
      expect(checked).toBeGreaterThan(2000);
    }
  });

  it("leaves at once: the stack is turning a twentieth of a screen in", () => {
    const rest = shot(Y("stacked"), "fall").F;
    const early = shot(Y("stacked") + 0.05 * METRICS.vh, "fall").F;
    expect(early.state).toBe("hop2");
    let furthest = 0;
    for (let d = 0; d < P.own; d++)
      furthest = Math.max(
        furthest,
        Math.abs(early.x[d] - rest.x[d]),
        Math.abs(early.y[d] - rest.y[d])
      );
    expect(furthest).toBeGreaterThan(20);
  });

  it("faces the reader by the time the network pins, each plate over its bar", () => {
    const start = polys(shot(Y("stacked") + HAIR, "fall").F)!;
    const at = shot(R.xnTop, "fall").F;
    const pinned = polys(at)!;
    for (const p of [0, 1, 2]) {
      /* a diamond as it leaves the steps, a level bar as the network pins */
      const a = extent(start[plateSeg[p]]!);
      const b = extent(pinned[plateSeg[p]]!);
      expect(a.h / a.w).toBeGreaterThan(0.5);
      expect(b.h / b.w).toBeLessThan(0.35);
      /* and its dots stand where its bar's do */
      let dx = 0;
      let dy = 0;
      let n = 0;
      for (let d = 0; d < P.own; d++) {
        if (P.plate[d] !== p) continue;
        dx += at.x[d] - W.big.x[d];
        dy += at.y[d] - W.big.y[d];
        n++;
      }
      expect(Math.abs(dx / n)).toBeLessThan(3);
      expect(Math.abs(dy / n)).toBeLessThan(3);
    }
  });

  it("gathers each plate on itself into its bar: face on, every dot is on its cell", () => {
    /* a twentieth of the way into the bars' settle, when a dot would still
       be most of its way off if the turn had not brought it there */
    const p2 = 0.02 + ((BARS_BY - 0.02) * (0.75 - 0.7)) / 0.3;
    const F = shot(R.xnTop + p2 * (R.xnH - METRICS.vh), "fall").F;
    expect(F.state).toBe("hop2");
    for (let d = 0; d < P.own; d++) {
      expect(Math.abs(F.x[d] - W.big.x[d])).toBeLessThanOrEqual(1);
      expect(Math.abs(F.y[d] - W.big.y[d])).toBeLessThanOrEqual(1);
    }
  });

  it("is the same turn whichever way the dots came into the steps", () => {
    const fall = shot(Y("hop2-25"), "fall").rows;
    for (const fly of FLIES) expect(shot(Y("hop2-25"), fly).rows).toEqual(fall);
  });
});

describe("the Thoughtform mark", () => {
  const m = W.L.m;
  const cover = markCover(m);
  const light = lightOf(m);
  const on = (i: number, j: number) =>
    i >= 0 && j >= 0 && i <= m && j <= m && cover[i * (m + 1) + j] >= 0.34;
  const FIELD = [1, STYLE.layer] as const;

  it("is cut into the layer's gold: no white dot, the groove sunk, its lip lit", () => {
    let hot = 0;
    let groove = 0;
    let lip = 0;
    for (let d = 0; d < P.own; d++) {
      if (P.plate[d] !== 1) continue;
      if (P.style[d] === STYLE.layerHot) hot++;
      if (P.style[d] === STYLE.layerDim && P.tier[d] === 0) groove++;
      if (P.style[d] === STYLE.layerLit && P.tier[d] === 3) lip++;
    }
    expect(hot).toBe(0);
    expect(groove).toBeGreaterThan(150);
    expect(lip).toBeGreaterThan(30);
    /* and every dot stays on its own pixel: only its look is the mark's */
    expect(P.own).toBe(W.scene.plates.reduce((sum, p) => sum + p.dots, 0));
  });

  it("puts no dark ring round it: off the mark, no site is darker than the field", () => {
    for (let i = 1; i < m; i++)
      for (let j = 1; j < m; j++) {
        if (on(i, j)) continue;
        const [, style] = engraved(false, light(i, j), FIELD);
        expect([STYLE.layer, STYLE.layerLit]).toContain(style);
      }
  });

  it("lights only the far edge of a cut: a lip has the groove on its light side", () => {
    let lips = 0;
    for (let i = 1; i < m; i++)
      for (let j = 1; j < m; j++) {
        if (on(i, j)) continue;
        const [, style] = engraved(false, light(i, j), FIELD);
        if (style !== STYLE.layerLit) continue;
        lips++;
        /* the light comes from less i: the groove is there, within a site */
        expect(on(i - 1, j) || on(i - 1, j - 1) || on(i - 1, j + 1)).toBe(true);
      }
    expect(lips).toBeGreaterThan(30);
  });

  it("sets the mark in white dots when it is lit", () => {
    const lit = buildWorld(METRICS, { mark: "lit" });
    let hot = 0;
    for (let d = 0; d < lit.pool.own; d++) {
      if (lit.pool.style[d] !== STYLE.layerHot) continue;
      expect(lit.pool.plate[d]).toBe(1);
      hot++;
    }
    expect(hot).toBeGreaterThan(60);
  });

  it("is left out of a lit disc when it is cut", () => {
    const cut = buildWorld(METRICS, { mark: "cut" });
    let hot = 0;
    let lit = 0;
    for (let d = 0; d < cut.pool.own; d++) {
      if (cut.pool.plate[d] !== 1) continue;
      if (cut.pool.style[d] === STYLE.layerHot) hot++;
      if (cut.pool.style[d] === STYLE.layerLit) lit++;
      expect(cut.pool.lx[d]).toBe(P.lx[d]);
      expect(cut.pool.ly[d]).toBe(P.ly[d]);
    }
    expect(hot).toBe(0);
    expect(lit).toBeGreaterThan(200);
  });
});

describe("what falls between the plates", () => {
  it("comes on as the plates land, before the hop has ended", () => {
    expect(shot(Y("hop1-40"), "fall").F.rain).toBeNull();
    /* the layer has landed on the agents; the team is still on its way */
    const late = shot(Y("hop1-80"), "fall").F;
    expect(late.state).toBe("hop1");
    expect(late.rain?.on).toEqual([0, 1]);
    /* both gaps, a little before the steps pin */
    const arriving = shot(Y("navigate") - 0.03 * METRICS.vh, "fall").F;
    expect(arriving.state).toBe("hop1");
    expect(arriving.rain?.on).toEqual([1, 1]);
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
    /* the courses stand whole from the end of the hop until the view
       begins to draw back */
    for (const p of [BARS_BY, 0.27, 0.34, 0.4]) {
      const F = shot(R.xnTop + p * (R.xnH - METRICS.vh), "march").F;
      for (const d of worded) {
        expect(F.show[d]).toBe(SHOW.window);
        expect(F.alpha[d]).toBeLessThanOrEqual(0.001);
      }
    }
  });
});

describe("the line that writes the bars", () => {
  const pAt = (p: number) => R.xnTop + p * (R.xnH - METRICS.vh);
  /** The network's pin where the hop's clock reads `t`, past 0.7. */
  const pOfT = (t: number) => 0.02 + ((BARS_BY - 0.02) * (t - 0.7)) / 0.3;
  const C = W.courses;

  it("starts once the stack faces the reader, and ends the hop on the last column", () => {
    expect(TURN.sweep[0]).toBeGreaterThanOrEqual(TURN.end);
    expect(TURN.sweep[1]).toBe(1);
    expect(shot(pAt(pOfT(TURN.sweep[0])), "fall").F.front).toBeLessThan(0.01);
    expect(shot(Y("bars"), "fall").F.front).toBe(1);
  });

  it("gives a dot its bar's look as it passes, and types a course's characters as it passes them", () => {
    const { F } = shot(Y("typing"), "fall");
    expect(F.state).toBe("hop2");
    expect(F.front).toBeGreaterThan(0.2);
    expect(F.front).toBeLessThan(0.8);
    const line = frontX(C, F.front);
    let behind = 0;
    let ahead = 0;
    for (let d = 0; d < P.own; d++) {
      const passed = W.big.x[d] <= line;
      if (W.big.show[d] === SHOW.window) {
        /* a dot on a word's place gives way to the word */
        expect(F.alpha[d]).toBe(passed ? 0 : 1);
      } else if (F.show[d] !== SHOW.no) {
        expect(F.style[d] === W.big.style[d] && F.size[d] === W.big.size[d]).toBe(
          passed || (P.style[d] === W.big.style[d] && W.sizes[P.tier[d]] === W.big.size[d])
        );
      }
      if (passed) behind++;
      else ahead++;
    }
    expect(behind).toBeGreaterThan(300);
    expect(ahead).toBeGreaterThan(300);
    /* mid-line, every course part typed, up to the line and no further */
    let mid = 0;
    C.words.forEach((word, i) => {
      const n = typedOf(C, i, F.front, F.erase);
      for (let c = 0; c < word.length; c++) expect(c < n).toBe(charMid(C, i, c) <= line);
      if (n > 0 && n < word.length) mid++;
    });
    expect(mid).toBeGreaterThan(0);
  });

  it("types at the scroll's pace and never takes a character back while it writes", () => {
    const last = [0, 0, 0];
    for (let t = TURN.sweep[0]; t <= 1.0001; t += 0.01) {
      const F = shot(pAt(pOfT(Math.min(1, t))), "fall").F;
      C.words.forEach((_, i) => {
        const n = typedOf(C, i, F.front, F.erase);
        expect(n).toBeGreaterThanOrEqual(last[i]);
        last[i] = n;
      });
    }
    C.words.forEach((word, i) => expect(last[i]).toBe(word.length));
  });

  it("shows its head only on a word being typed", () => {
    C.words.forEach((_, i) => {
      expect(headOn(C, i, 0, 0)).toBe(false);
      expect(headOn(C, i, 1, 0)).toBe(false);
    });
    const { F } = shot(Y("typing"), "fall");
    C.words.forEach((word, i) => {
      const n = typedOf(C, i, F.front, F.erase);
      expect(headOn(C, i, F.front, F.erase)).toBe(n < word.length && frontX(C, F.front) >= C.big[i].x + C.inset);
    });
  });

  it("has every course whole when Marketing's frame comes on, and the frame waits for it", () => {
    expect(LETTERED.frame[0]).toBe(BARS_BY);
    expect(LETTERED.name[0]).toBeGreaterThanOrEqual(LETTERED.frame[0]);
    expect(networkAt(BARS_BY - 0.001, LETTERED.frame).frame).toBe(0);
    expect(networkAt(LETTERED.frame[1], LETTERED.frame).frame).toBe(1);
    const { F } = shot(Y("bars"), "fall");
    C.words.forEach((word, i) => expect(typedOf(C, i, F.front, F.erase)).toBe(word.length));
    /* and the view draws back well after the name is typed */
    expect(LETTERED.name[1]).toBeLessThan(0.4);
  });

  it("erases each course from its end as the view draws back, and gives its dots back behind the head", () => {
    /* a third of the way through the erase */
    let p = 0.4;
    while (networkAt(p).zoom < 0.22 / 3) p += 0.0005;
    const { F } = shot(pAt(p), "fall");
    expect(F.state).toBe("network");
    expect(F.erase).toBeGreaterThan(0.2);
    expect(F.erase).toBeLessThan(0.5);
    C.words.forEach((word, i) => {
      const n = typedOf(C, i, F.front, F.erase);
      expect(n).toBeLessThan(word.length);
      const head = eraseX(C, i, F.erase);
      for (let c = 0; c < word.length; c++)
        expect(c < n).toBe(charMid(C, i, c) + C.adv / 2 < head);
    });
    for (let d = 0; d < P.own; d++) {
      if (W.big.show[d] !== SHOW.window || F.show[d] !== SHOW.window) continue;
      expect(F.alpha[d]).toBe(W.big.x[d] > eraseX(C, P.plate[d], F.erase) ? 1 : 0);
    }
    /* a word and its dots shrink as one: a dot's place on its way to its
       node is its bar's scale about the bar's left edge */
    const k = scaleAt(C, F.zoom);
    for (let d = 0; d < P.own; d++) {
      if (W.org.team[d] >= 0 || F.show[d] === SHOW.no) continue;
      const B = C.big[P.plate[d]];
      const N = C.node[P.plate[d]];
      const left = B.x + (N.x - B.x) * F.zoom;
      expect(Math.abs(F.x[d] - (left + (W.big.x[d] - B.x) * k))).toBeLessThanOrEqual(1.5);
    }
    /* and nothing is left of them once it has drawn back that far */
    const gone = shot(Y("drawback"), "fall").F;
    C.words.forEach((_, i) => expect(typedOf(C, i, gone.front, gone.erase)).toBe(0));
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
