import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { geomOf, GOLD, newDots } from "@/app/(internal)/test/capability-particles/sketch/core";
import { SKETCHES } from "@/app/(internal)/test/capability-particles/sketch";
import { isStraight } from "@/components/xb-proposal/kit/trace";

/* /test/capability-particles draws "AI capability your teams own." three
   ways in the swarm's dots. The owner's standing rules, held without a
   browser for each sketch:

     · a frame is a function of time: the same `t`, the same picture;
     · gold is the one lit thing, well under a tenth of what is drawn, and
       it is gone once the story has played: what stays is the team's;
     · every move runs level, plumb or at 45 degrees;
     · nothing fades: the painter has no alpha and no opacity to set. */

/* the figure at the owner's window, 1976 x 966: 1376 px wide */
const W = 1376;
const H = Math.round((W * 460) / 1200);
const G = geomOf(W, H, 1);

describe.each(SKETCHES)("sketch $id · $name", ({ build }) => {
  const S = build(G);
  const D = newDots(16384);
  const times = Array.from({ length: 80 }, (_, k) => (k * (S.rest + 6)) / 79);

  const shot = (t: number) => {
    S.frame(t, D);
    return {
      n: D.n,
      x: Array.from(D.x.subarray(0, D.n)),
      y: Array.from(D.y.subarray(0, D.n)),
      size: Array.from(D.size.subarray(0, D.n)),
      style: Array.from(D.style.subarray(0, D.n)),
    };
  };

  it("draws the same frame twice", () => {
    for (const t of [0.7, 2.5, 5, S.rest, S.rest + 3.3]) expect(shot(t)).toEqual(shot(t));
  });

  it("keeps gold one small thing: a dozen dots at most, under a tenth of a figure", () => {
    for (const t of times) {
      const f = shot(t);
      const gold = f.style.filter((s) => GOLD.has(s)).length;
      expect(gold).toBeLessThanOrEqual(12);
      /* before the figure has a body, the gold is all there is (a caret on
         an empty field); once it has one, gold is under a tenth of it */
      if (f.n >= 100) expect(gold / f.n).toBeLessThan(0.1);
    }
  });

  it("shows gold while the story plays, and none once it has", () => {
    const seen = times
      .filter((t) => t < S.rest)
      .some((t) => shot(t).style.some((s) => GOLD.has(s)));
    expect(seen).toBe(true);
    for (const t of [S.rest, S.rest + 1, S.rest + 7.7, S.rest + 40])
      expect(shot(t).style.some((s) => GOLD.has(s))).toBe(false);
  });

  it("stands inside the figure at rest", () => {
    const f = shot(S.rest + 2);
    expect(f.n).toBeGreaterThan(100);
    for (let i = 0; i < f.n; i++) {
      expect(f.x[i]).toBeGreaterThanOrEqual(0);
      expect(f.x[i]).toBeLessThanOrEqual(W);
      expect(f.y[i]).toBeGreaterThanOrEqual(0);
      expect(f.y[i]).toBeLessThanOrEqual(H);
    }
  });

  it("moves only level, plumb or at 45 degrees", () => {
    expect(S.routes.length).toBeGreaterThan(0);
    for (const route of S.routes) expect(isStraight(route, 1e-6)).toBe(true);
  });
});

describe("the painter", () => {
  it("has no alpha and no opacity to set: a dot moves, or changes size", () => {
    const dir = path.join(process.cwd(), "app/(internal)/test/capability-particles");
    const src = [
      "ParticleLab.tsx",
      "sketch/core.ts",
      "sketch/lanes.ts",
      "sketch/altitude.ts",
      "sketch/pattern.ts",
    ]
      .map((f) => readFileSync(path.join(dir, f), "utf8"))
      .join("\n");
    expect(src).not.toMatch(/globalAlpha|opacity|filter\s*=/);
  });
});
