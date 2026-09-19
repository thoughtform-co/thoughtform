import { describe, expect, it } from "vitest";

import { FIGURE_SLOTS, figureFor } from "@/lib/services-ring/serviceFigures";
import {
  WIRE_R,
  WIRE_RIM,
  WIRE_VB,
  wireFor,
  wireHousing,
  wireInk,
} from "@/lib/services-ring/serviceWire";

/** Absolute SVG path data only: M/L/A/Z with numbers. No relative commands, no
 *  curves this drawing does not use, and nothing a `transform` would hide. */
const PATH_GRAMMAR = /^(?:[MLAZ](?:\s+-?\d+(?:\.\d+)?)*\s*)+$/;

describe("serviceWire — the figures as line work", () => {
  it("emits every path in the grammar, in one viewBox, with no transform", () => {
    for (const slot of FIGURE_SLOTS) {
      const w = wireFor(slot);
      expect(w.vb).toBe(WIRE_VB);
      const ids = new Set<string>();
      for (const p of [...w.housing, ...w.figure]) {
        expect(p.d, `${slot}/${p.id}`).toMatch(PATH_GRAMMAR);
        expect(p.d).not.toMatch(/transform/);
        expect(ids.has(p.id), `duplicate id ${p.id} on ${slot}`).toBe(false);
        ids.add(p.id);
        expect(p.alpha).toBeGreaterThan(0);
        expect(p.alpha).toBeLessThanOrEqual(1);
      }
    }
  });

  it("shares one housing across the four cards", () => {
    const h = wireHousing();
    for (const slot of FIGURE_SLOTS) expect(wireFor(slot).housing).toBe(h);
    // Four rings, twenty ticks, four stubs — the About drawing's register.
    expect(h.filter((p) => /^(rim|outer|track|core)$/.test(p.id))).toHaveLength(4);
    expect(h.filter((p) => /^t\d+$/.test(p.id))).toHaveLength(20);
    expect(h.filter((p) => /^s\d+$/.test(p.id))).toHaveLength(4);
  });

  it("keeps every node inside the rim and on the cloud's radius", () => {
    for (const slot of FIGURE_SLOTS) {
      const fig = figureFor(slot);
      const nodes = wireFor(slot).figure.filter((p) => /^n\d+$/.test(p.id));
      expect(nodes).toHaveLength(fig.points.length);
      for (const p of nodes) {
        // A square's first point is (x − r, y − r); its centre is inside R.
        const m = /^M (-?[\d.]+) (-?[\d.]+) L (-?[\d.]+) /.exec(p.d);
        expect(m).not.toBeNull();
        const x0 = Number(m![1]);
        const y0 = Number(m![2]);
        const x1 = Number(m![3]);
        const r = (x1 - x0) / 2;
        const cx = x0 + r;
        const cy = y0 + r;
        expect(Math.hypot(cx, cy)).toBeLessThanOrEqual(WIRE_R + 0.01);
        expect(Math.hypot(cx, cy) + r).toBeLessThan(WIRE_RIM - 6);
      }
    }
  });

  it("draws the record — as many edges and marks as the figure has, the open nodes stroked", () => {
    for (const slot of FIGURE_SLOTS) {
      const fig = figureFor(slot);
      const w = wireFor(slot).figure;
      expect(w.filter((p) => /^e\d+$/.test(p.id))).toHaveLength(fig.edges.length);
      expect(w.filter((p) => p.ink === "mark")).toHaveLength(fig.marks.length);
      const open = w.filter((p) => p.ink === "open");
      expect(open).toHaveLength(fig.unlinked.length);
      for (const p of open) expect(p.fill).toBe(false);
      for (const p of w.filter((q) => q.ink === "node" || q.ink === "node-lit"))
        expect(p.fill).toBe(true);
    }
  });

  it("maps every ink to one of the two roles", () => {
    for (const ink of [
      "line",
      "line2",
      "tick",
      "stub",
      "gold-soft",
      "chord",
      "node",
      "node-lit",
      "open",
      "mark",
    ] as const) {
      const m = wireInk(ink);
      expect(["ink", "gold"]).toContain(m.role);
      expect(m.alpha).toBeGreaterThan(0);
      expect(m.alpha).toBeLessThanOrEqual(1);
    }
    expect(wireInk("mark").role).toBe("gold");
    expect(wireInk("gold-soft").role).toBe("gold");
  });
});
