import { describe, expect, it } from "vitest";

import {
  convexHull,
  edgeDistance,
  HULL_CLEAR,
  hullLayout,
  inside,
  PAD_X,
  PAD_Y,
  STAR_CLEAR,
} from "@/components/arcs/hull/hullLayout";

/**
 * The agent-shaped-work figure's geometry (ADR-139 U1).
 *
 * What a still cannot show: that every particle sits in a bay (inside the
 * hull, outside the star) and touches neither line, that every role's tip
 * is on the hull so no person is drawn swallowed by the agent's field, and
 * that the crop is centred on the drawing at every team size. The page
 * draws exactly these numbers, so this walks what renders.
 */
describe("the hull layout", () => {
  for (const n of [5, 6, 7]) {
    describe(`a team of ${n}`, () => {
      const L = hullLayout(n);

      it("is the same on every render", () => {
        expect(hullLayout(n)).toEqual(L);
      });

      it("draws one spike per role, tip and valley alternating", () => {
        expect(L.tips).toHaveLength(n);
        expect(L.star).toHaveLength(2 * n);
        expect(L.seats).toHaveLength(n);
      });

      it("puts every tip on the hull, so no role sits inside the field", () => {
        for (const t of L.tips) {
          expect(
            L.hull.some((h) => Math.hypot(h.x - t.x, h.y - t.y) < 1e-9),
            `tip ${t.x.toFixed(1)},${t.y.toFixed(1)} is a hull vertex`
          ).toBe(true);
        }
        /* And the hull is the hull: recomputing it changes nothing. */
        expect(convexHull(L.hull)).toEqual(L.hull);
      });

      it("fills only the bays, and no particle touches a line", () => {
        expect(L.field.length, "a field dense enough to read as one").toBeGreaterThan(150);
        for (const d of L.field) {
          expect(inside(d, L.hull), "inside the hull").toBe(true);
          expect(inside(d, L.star), "outside the star").toBe(false);
          expect(edgeDistance(d, L.star)).toBeGreaterThanOrEqual(STAR_CLEAR + d.r);
          expect(edgeDistance(d, L.hull)).toBeGreaterThanOrEqual(HULL_CLEAR + d.r);
        }
      });

      it("centres the drawing in a crop made from it", () => {
        const xs = L.hull.map((p) => p.x);
        const ys = L.hull.map((p) => p.y);
        expect(Math.min(...xs)).toBeCloseTo(PAD_X, 6);
        expect(L.w - Math.max(...xs)).toBeCloseTo(PAD_X, 6);
        expect(Math.min(...ys)).toBeCloseTo(PAD_Y, 6);
        expect(L.h - Math.max(...ys)).toBeCloseTo(PAD_Y, 6);
      });

      it("seats every label outward of its tip, inside the crop", () => {
        L.seats.forEach((s, i) => {
          expect(s.fx).toBeGreaterThan(0);
          expect(s.fx).toBeLessThan(1);
          expect(s.fy).toBeGreaterThan(0);
          expect(s.fy).toBeLessThan(1);
          const t = L.tips[i];
          const c = Math.cos(t.angle);
          if (s.side === "right") expect(c).toBeGreaterThan(0);
          if (s.side === "left") expect(c).toBeLessThan(0);
          if (s.side === "above") expect(Math.sin(t.angle)).toBeLessThan(0);
          if (s.side === "below") expect(Math.sin(t.angle)).toBeGreaterThan(0);
        });
      });
    });
  }

  it("clamps a team outside five to seven rather than drawing a broken star", () => {
    expect(hullLayout(3).tips).toHaveLength(5);
    expect(hullLayout(9).tips).toHaveLength(7);
  });
});
