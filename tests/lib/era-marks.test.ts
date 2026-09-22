import { describe, expect, it } from "vitest";

import { ERA_MARKS, type EraMark, type EraMarkPixel } from "@/lib/voidwalker/eraMarks";
import { CHARACTER_ERA_FACT_KEYS } from "@/lib/voidwalker/characterEras";
import { VW_OUTLET_KIND } from "@/lib/voidwalker/voidwalkerData";

/**
 * The era stage's drawn marks (ADR-082 U35) — the particle-icon grammar held
 * clause by clause, the way `proof-glyphs.test.ts` holds the casefile's.
 *
 * ⚠ A GUARD IS NOT A CONTACT SHEET. Every clause below can pass on a mark that
 * reads as the wrong thing — the magazine's first two cuts did (a letter C,
 * then a person) — so a change to a mark is re-judged on the rendered sheet,
 * unlabelled, before it ships. What this file stops is the mark that is
 * illegible by construction: off the lattice, over the budget, a drift pixel
 * sitting on the form, or two marks that are one drawing.
 */
const EXPECTED_KEYS = [
  "base",
  "move",
  "reach",
  "result",
  "newspaper",
  "magazine",
  "broadcast",
] as const;

const key = ([x, y]: EraMarkPixel) => `${x},${y}`;
const all = (m: EraMark) => [...m.sk, ...m.sig, ...m.dr];

describe("ADR-082 U35 · the era marks", () => {
  it("draws exactly the seven marks the stage asks for", () => {
    expect(Object.keys(ERA_MARKS).sort()).toEqual([...EXPECTED_KEYS].sort());
  });

  it("every fact key and every outlet kind has its mark", () => {
    // The four fact labels are title case in the record, lower case here.
    for (const k of CHARACTER_ERA_FACT_KEYS) {
      expect(ERA_MARKS, k).toHaveProperty(k.toLowerCase());
    }
    for (const [outlet, kind] of Object.entries(VW_OUTLET_KIND)) {
      expect(ERA_MARKS, `${outlet} → ${kind}`).toHaveProperty(kind);
    }
  });

  for (const name of EXPECTED_KEYS) {
    const m = ERA_MARKS[name];
    describe(name, () => {
      it("sits on the 7×7 lattice at integer cells", () => {
        for (const [x, y] of all(m)) {
          expect(Number.isInteger(x) && Number.isInteger(y), `${x},${y}`).toBe(true);
          expect(x >= 0 && x <= 6 && y >= 0 && y <= 6, `${x},${y}`).toBe(true);
        }
      });

      it("keeps the grammar's counts", () => {
        expect(m.sk.length + m.sig.length).toBeGreaterThan(0);
        expect(m.sk.length + m.sig.length).toBeLessThanOrEqual(16);
        expect(m.sig.length).toBeGreaterThanOrEqual(1);
        expect(m.sig.length).toBeLessThanOrEqual(3);
        expect(m.dr.length).toBeGreaterThanOrEqual(1);
        expect(m.dr.length).toBeLessThanOrEqual(2);
      });

      it("repeats no pixel, and the signal is never also skeleton", () => {
        const seen = all(m).map(key);
        expect(new Set(seen).size).toBe(seen.length);
      });

      it("drifts exactly one cell along one axis off the skeleton, never onto the form", () => {
        const form = new Set([...m.sk, ...m.sig].map(key));
        for (const [x, y] of m.dr) {
          expect(form.has(`${x},${y}`), `drift ${x},${y} on the form`).toBe(false);
          const adjacent = m.sk.some(([sx, sy]) => Math.abs(sx - x) + Math.abs(sy - y) === 1);
          expect(adjacent, `drift ${x},${y} is not one step off the skeleton`).toBe(true);
        }
      });
    });
  }

  it("no two marks are one drawing", () => {
    const sets = EXPECTED_KEYS.map((n) =>
      [...ERA_MARKS[n].sk, ...ERA_MARKS[n].sig].map(key).sort().join(" ")
    );
    expect(new Set(sets).size).toBe(sets.length);
  });
});
