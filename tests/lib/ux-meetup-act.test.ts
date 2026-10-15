import { describe, expect, it } from "vitest";

import {
  ACT_POOL,
  DOTS_PER_BLOCK,
  actFrame,
  type ActAnchors,
  type ActClock,
} from "@/app/(marketing)/arcs/thoughtform/ux-meetup/actClock";

/**
 * The talk's particle artifact (ADR-156 U3): a pure clock, so its laws are
 * arithmetic. The dots keep their identity through the whole act, never jump
 * at a seam (a handoff starts exactly where the last state stood), and draw
 * nothing outside the act.
 */

const pt = (x: number, y: number) => ({ x, y });
const row = (y: number) => [0, 1, 2, 3].map((i) => pt(100 + i * 120, y));

const ANCHORS: ActAnchors = {
  c2: row(400),
  p2: row(300),
  c3: row(420),
  p3: row(320),
  tiles: [row(500), row(520)],
  ribbon: [pt(600, 450), pt(700, 450)],
  model: pt(650, 250),
};
const T = 864;
const CLOCK: ActClock = { tops: [3000, 3000 + 0.62 * T, 3000 + 1.24 * T], tail: T };

describe("the talk's particle artifact (ADR-156 U3)", () => {
  it("keeps one pool, every dot its own, for the whole act", () => {
    expect(ACT_POOL).toHaveLength(2 * 4 * DOTS_PER_BLOCK);
    for (let y = CLOCK.tops[0]; y < CLOCK.tops[2] + 0.6 * T; y += 37) {
      const f = actFrame(y, CLOCK, ANCHORS);
      expect(f, `frame at ${y}`).not.toBeNull();
      expect(f).toHaveLength(ACT_POOL.length);
    }
  });

  it("draws nothing outside the act", () => {
    expect(actFrame(CLOCK.tops[0] - 1, CLOCK, ANCHORS)).toBeNull();
    expect(actFrame(CLOCK.tops[2] + 0.63 * T, CLOCK, ANCHORS)).toBeNull();
  });

  it("never jumps: every boundary is continuous", () => {
    const [t0, t1, t2] = CLOCK.tops;
    const seams = [t0 + 0.4 * T, t1 + 0.05 * T, t1 + 0.4 * T, t2 + 0.05 * T, t2 + 0.4 * T];
    for (const s of seams) {
      const before = actFrame(s - 0.01, CLOCK, ANCHORS) ?? [];
      const after = actFrame(s + 0.01, CLOCK, ANCHORS) ?? [];
      for (let i = 0; i < before.length; i++) {
        const d = Math.hypot(before[i].x - after[i].x, before[i].y - after[i].y);
        expect(d, `dot ${i} at ${s.toFixed(0)}`).toBeLessThan(1);
      }
    }
  });

  it("ends gathered in the model, gold", () => {
    const end = actFrame(CLOCK.tops[2] + 0.45 * T, CLOCK, ANCHORS) ?? [];
    for (const d of end) {
      expect(d.gold).toBe(true);
      expect(Math.hypot(d.x - ANCHORS.model!.x, d.y - ANCHORS.model!.y)).toBeLessThanOrEqual(11);
    }
  });

  it("holds the products lane back until the second timeline", () => {
    const first = actFrame(CLOCK.tops[0] + 0.2 * T, CLOCK, ANCHORS) ?? [];
    const products = first.filter((_, i) => ACT_POOL[i].lane === 1);
    expect(products.every((d) => d.alpha === 0)).toBe(true);
  });
});
