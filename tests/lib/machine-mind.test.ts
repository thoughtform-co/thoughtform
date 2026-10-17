import { describe, expect, it } from "vitest";
import { BRAIN_VIEW_FRONT, BRAIN_VIEW_ISO, brainIsoBox, contourPoint } from "@/components/arcs/figures/foundation/brainIso";
import { DIRECTIONS } from "@/app/(internal)/test/machine-mind/directions";
import { hullPoint, makeHull, scaleAt, TONES } from "@/app/(internal)/test/machine-mind/hull";

/**
 * The machine-mind lab (/test/machine-mind): six directions for the keynote
 * brain on its own shape. What is pinned is that the shape IS the act's (the
 * hull at fold 1 is brainIso's contour, point for point) and that every
 * direction draws in both themes, both cameras and either half alone, over
 * the act's own picture box.
 */
describe("machine-mind hull", () => {
  it("is brainIso's contour at the dome's scale when unfolded", () => {
    for (const side of [-1, 1] as const) {
      for (const z of [-58, -30, 0, 40, 105, 149]) {
        for (let i = 0; i < 24; i++) {
          const t = (i / 24) * Math.PI * 2;
          const [l, f] = contourPoint(side, scaleAt(z), t, z);
          const p = hullPoint(side, t, z);
          expect(p[0]).toBeCloseTo(l, 9);
          expect(p[1]).toBeCloseTo(f, 9);
          expect(p[2]).toBe(z);
        }
      }
    }
  });

  it("faces the viewer with its dome, not its belly (normals outward)", () => {
    // seen from above, the dome's facets face the camera and the belly's do
    // not: more than half, never all
    const h = makeHull(1);
    const facing = h.facets.filter((f) => f.facing).length;
    expect(facing / h.facets.length).toBeGreaterThan(0.5);
    expect(facing / h.facets.length).toBeLessThan(0.8);
    expect(h.facets.find((f) => f.r === 0 && f.v[0].t === 0)!.facing).toBe(false);
    // the crown's normal points up
    expect(h.at(0, 150).n[2]).toBeCloseTo(1, 6);
  });
});

describe("machine-mind directions", () => {
  it("registers the rounds newest first, then today, ids unique", () => {
    const ids = DIRECTIONS.map((d) => d.id);
    expect(ids).toEqual(["e1", "e2", "e3", "d1", "d2", "d3", "d4", "d5", "d6", "today"]);
    const rounds = DIRECTIONS.map((d) => d.round ?? 0);
    expect(rounds).toEqual([...rounds].sort((a, b) => b - a));
  });

  // twelve pictures a direction, and a carved brain costs facets: a minute each
  for (const d of DIRECTIONS) {
    it(`${d.id} ${d.name} draws in both themes, both cameras and either half`, { timeout: 60_000 }, () => {
      for (const light of [false, true]) {
        for (const view of [BRAIN_VIEW_ISO, BRAIN_VIEW_FRONT]) {
          for (const only of [undefined, -1, 1] as const) {
            const o = { view, only, light, tones: TONES[light ? "light" : "dark"] };
            const svg = d.svg(o);
            expect(svg.startsWith("<svg")).toBe(true);
            expect(svg.length).toBeGreaterThan(2000);
            const B = d.box?.(o) ?? brainIsoBox(view);
            expect(svg).toContain(`viewBox="${B.x0} ${B.y0} ${B.x1 - B.x0} ${B.y1 - B.y0}"`);
          }
        }
      }
    });
  }
});
