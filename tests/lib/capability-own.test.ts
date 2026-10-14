import { describe, expect, it } from "vitest";

import { CROWD_DOTS, coreSite, D, keeperOf, swarmAt } from "@/app/(internal)/test/capability-own/inout";
import {
  isStraight,
  MONTH_DAYS,
  PHASES,
  type Pt,
} from "@/app/(internal)/test/capability-own/model";
import { CROSS, STEPS, yDays } from "@/app/(internal)/test/capability-own/VariantCrossover";
import { B, chipLine, turnAt } from "@/app/(internal)/test/capability-own/VariantFlywheel";
import {
  A,
  GOLD_IN,
  GOLD_OUT,
  GOLD_REMOTE,
} from "@/app/(internal)/test/capability-own/VariantHandover";

/* /test/capability-own draws "AI capability your teams own." four ways, each
   as the engagement over time. What the drawings claim, held without a
   browser:
     · the month is the proposal's own: five days on site, three a week
       remote, about fourteen, none after; every workstream owned by week four;
     · every trace is straight (level, plumb or 45 degrees);
     · A: Thoughtform never crosses a line the team already owns;
     · B: each turn of the flywheel is shorter than the last;
     · C: the team's trace crosses Thoughtform's days in week four;
     · D: every crowd keeps its gold, and the rest of the swarm leaves. */

describe("the month", () => {
  it("is the proposal's: five on site, three a week remote, fourteen in all, none after", () => {
    expect(PHASES.map((p) => p.days)).toEqual([5, 3, 3, 3, 0]);
    expect(MONTH_DAYS).toBe(14);
  });

  it("never takes a workstream back, and ends with all four owned", () => {
    for (let i = 1; i < PHASES.length; i++)
      expect(PHASES[i].owned).toBeGreaterThanOrEqual(PHASES[i - 1].owned);
    expect(PHASES.at(-1)?.owned).toBe(4);
    expect(PHASES[0].owned).toBe(0);
  });
});

describe("A · the handover", () => {
  const all: Pt[] = [...GOLD_IN, ...GOLD_REMOTE.slice(1), ...GOLD_OUT.slice(1)];

  it("draws Thoughtform's line straight", () => {
    expect(isStraight(all)).toBe(true);
  });

  it("never crosses a line the team already owns", () => {
    for (let s = 1; s < all.length; s++) {
      const [x0, y0] = all[s - 1];
      const [x1, y1] = all[s];
      A.lanes.forEach((ly, i) => {
        const crosses = Math.min(y0, y1) < ly && Math.max(y0, y1) > ly;
        if (!crosses) return;
        /* where it crosses the lane, that lane is not yet owned */
        const x = x0 + ((x1 - x0) * (ly - y0)) / (y1 - y0);
        expect(x).toBeLessThan(A.skills[i]);
      });
    }
  });

  it("writes each lane's skill where Thoughtform is on that lane", () => {
    A.skills.forEach((sx, i) => {
      const on = all.some((q, s) => {
        if (s === 0) return false;
        const p = all[s - 1];
        return p[1] === A.lanes[i] && q[1] === A.lanes[i] && Math.min(p[0], q[0]) <= sx && Math.max(p[0], q[0]) >= sx;
      });
      expect(on).toBe(true);
    });
  });

  it("is gone by the start of after, and the four lines run to the edge", () => {
    expect(GOLD_OUT[0][0]).toBe(A.edges[3]);
    expect(GOLD_OUT[1][1]).toBeLessThan(0);
    expect(A.laneX1).toBe(A.edges[4]);
  });
});

describe("B · the flywheel", () => {
  it("shares the runway out across four turns, each shorter than the last", () => {
    expect(B.turns.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    for (let k = 1; k < B.turns.length; k++) expect(B.turns[k]).toBeLessThan(B.turns[k - 1]);
  });

  it("never runs its turns backwards", () => {
    let last = -1;
    for (let t = 0; t <= 1; t += 0.01) {
      const { k, f } = turnAt(t);
      const at = k + f;
      expect(at).toBeGreaterThanOrEqual(last - 1e-9);
      last = at;
    }
    expect(turnAt(1)).toEqual({ k: 3, f: 1 });
  });

  it("runs each workstream level into the rim", () => {
    for (const y of B.chipsY) {
      const line = chipLine(y);
      expect(isStraight(line)).toBe(true);
      const [x, ly] = line[1];
      expect(Math.hypot(x - B.c[0], ly - B.c[1])).toBeCloseTo(B.r, 6);
    }
  });

  it("takes Thoughtform out along a straight track, from the hub to past the frame", () => {
    expect(isStraight(B.out)).toBe(true);
    expect(B.out[0]).toEqual(B.c);
    expect(B.out.at(-1)![0]).toBeGreaterThan(1200);
  });
});

describe("C · the crossover", () => {
  it("steps the team's trace level and plumb, up to all four", () => {
    expect(isStraight(STEPS)).toBe(true);
    for (let s = 1; s < STEPS.length; s++) {
      const dx = STEPS[s][0] - STEPS[s - 1][0];
      const dy = STEPS[s][1] - STEPS[s - 1][1];
      expect(dx === 0 || dy === 0).toBe(true);
      /* it only ever rises (up the screen) or runs on */
      expect(dy).toBeLessThanOrEqual(0);
    }
  });

  it("crosses Thoughtform's days at the end of week four", () => {
    const week4 = PHASES.findIndex((p) => p.id === "w4");
    expect(CROSS[1]).toBe(yDays(PHASES[week4].days));
    expect(STEPS.some(([x, y]) => x === CROSS[0] && y < CROSS[1])).toBe(true);
  });
});

describe("D · in, then out", () => {
  it("gives every crowd its own dots and a core of twelve", () => {
    expect(CROWD_DOTS).toHaveLength(4);
    for (const dots of CROWD_DOTS) expect(dots.length).toBeGreaterThan(40);
    const keepers = Array.from({ length: D.swarm }, (_, d) => keeperOf(d));
    for (let k = 0; k < 4; k++) expect(keepers.filter((x) => x === k)).toHaveLength(D.keep);
  });

  it("ends with each keeper in its crowd's core, and every other dot off the frame", () => {
    const end = swarmAt(1);
    for (let d = 0; d < D.swarm; d++) {
      const k = keeperOf(d);
      if (k >= 0) {
        const [x, y] = coreSite(k, d % D.keep);
        expect(end.x[d]).toBeCloseTo(x, 6);
        expect(end.y[d]).toBeCloseTo(y, 6);
      } else {
        expect(end.x[d] > 1200 || end.y[d] < 0).toBe(true);
      }
    }
    expect(end.kept).toEqual([1, 1, 1, 1]);
  });

  it("comes in as the mark, inside the frame, before it settles into the team", () => {
    /* the end of the way in, before week one's settling */
    const s = swarmAt(0.04 + 0.12 * 0.9);
    expect(s.stretch === "enter" || s.stretch === "embed").toBe(true);
    for (let d = 0; d < D.swarm; d++) {
      expect(s.x[d]).toBeGreaterThan(0);
      expect(s.x[d]).toBeLessThan(1200);
      expect(s.y[d]).toBeGreaterThan(0);
      expect(s.y[d]).toBeLessThan(D.crowdY);
    }
  });

  it("is the same picture twice at the same moment", () => {
    for (const p of [0.1, 0.3, 0.55, 0.75, 0.9]) {
      const a = swarmAt(p);
      const b = swarmAt(p);
      expect(Array.from(a.x)).toEqual(Array.from(b.x));
      expect(Array.from(a.y)).toEqual(Array.from(b.y));
    }
  });
});
