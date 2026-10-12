import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DIAL_RINGS, rimStubs, rimTicks } from "@/components/xb-proposal/kit/dial";
import {
  bearing,
  bundle,
  elbow,
  isStraight,
  jog,
  pathOf,
  type Pt,
} from "@/components/xb-proposal/kit/trace";
import {
  AXIS,
  BEARING,
  CHIP_W,
  FRAME,
  HUB,
  MARK_BAR,
  ROWS,
  STRAIGHT_LINES,
  TRACE,
} from "@/components/xb-proposal/plug/flowLayouts";

/* The proposal kit's one law, held mechanically (owner, 2026-10-12): rings
   are instruments, connectors are straight. A connector is level, plumb or
   at 45 degrees; a bearing is a straight line through its dial's centre;
   every line ends ON the thing it joins, to half a unit. */

const near = (a: number, b: number, eps = 0.5) => Math.abs(a - b) <= eps;
const inFrame = ([x, y]: Pt) => x >= 0 && x <= FRAME.w && y >= 0 && y <= FRAME.h;

describe("the kit's connectors", () => {
  it("a cut turn, a jog and a bundle of either are straight", () => {
    const turn = elbow([24, 22], [176, 58], "h", 14);
    const step = jog([24, 26], [176, 54], 86);
    expect(isStraight(turn)).toBe(true);
    expect(isStraight(step)).toBe(true);
    for (const l of [...bundle(turn, 3, 3.4), ...bundle(step, 8, 2.6)])
      expect(isStraight(l, 1e-6)).toBe(true);
  });

  it("a bundle keeps its pitch on every leg", () => {
    const [a, , c] = bundle(elbow([0, 0], [100, 60], "h", 10), 3, 4);
    // level leg: 8 apart in y; plumb leg: 8 apart in x
    expect(near(Math.abs(a[0][1] - c[0][1]), 8, 1e-6)).toBe(true);
    expect(near(Math.abs(a[a.length - 1][0] - c[c.length - 1][0]), 8, 1e-6)).toBe(true);
  });

  it("a guard that can fail: a line at 30 degrees is not straight", () => {
    expect(
      isStraight([
        [0, 0],
        [100, 57.7],
      ])
    ).toBe(false);
  });

  it("no connector is ever written as a curve", () => {
    const d = pathOf(elbow([0, 0], [100, 60], "h", 10));
    expect(d).toMatch(/^M[\d. -]+(?:[HVL][\d. -]+)+$/);
    for (const f of ["PlugTrace.tsx", "PlugBearing.tsx", "PlugAxis.tsx", "flowLayouts.ts"]) {
      const src = readFileSync(path.join(process.cwd(), "components/xb-proposal/plug", f), "utf8");
      // a hand-written path command that curves: `C${`, `Q${`, `S${`, `A${`
      expect(src, f).not.toMatch(/[CQSA]\$\{/);
    }
    const kit = readFileSync(
      path.join(process.cwd(), "components/xb-proposal/kit/trace.ts"),
      "utf8"
    );
    expect(kit).not.toMatch(/[`"][^`"]*\b[CQSA]\$\{/);
  });
});

describe("the ring register", () => {
  it("is the About drawing's six rings, widest first", () => {
    expect(DIAL_RINGS).toHaveLength(6);
    const radii = DIAL_RINGS.map((r) => r.r);
    expect([...radii].sort((a, b) => b - a)).toEqual(radii);
    expect(radii[0]).toBe(1);
  });

  it("graduates the rim every 15 degrees off the cardinals", () => {
    expect(rimTicks([0, 0], 100, 6)).toHaveLength(20);
    expect(rimStubs([0, 0], 100, 12)).toHaveLength(4);
    // an entry is kept clear of ticks
    expect(rimTicks([0, 0], 100, 6, 15, [200])).toHaveLength(19);
  });
});

describe("F1 · trace", () => {
  const L = TRACE;
  const chipX1 = L.chips[0].x + CHIP_W;

  it("sits on production's four rows, hub on their middle", () => {
    expect(L.chips.map((c) => c.y)).toEqual([...ROWS]);
    expect(L.cards.rows).toEqual(ROWS);
    expect(HUB[1]).toBe((ROWS[0] + ROWS[3]) / 2);
  });

  it("every line is straight", () => {
    for (const l of STRAIGHT_LINES.trace) expect(isStraight(l)).toBe(true);
  });

  it("each wire leaves its chip's edge and lands on the collector", () => {
    const [top, bottom] = L.collector;
    L.wires.forEach((w, i) => {
      expect(w.pts[0]).toEqual([chipX1, ROWS[i]]);
      const end = w.pts[w.pts.length - 1];
      expect(end[0]).toBe(top.from[0]);
      const run = end[1] < HUB[1] ? top : bottom;
      const lo = Math.min(run.from[1], run.to[1]);
      const hi = Math.max(run.from[1], run.to[1]);
      expect(end[1]).toBeGreaterThanOrEqual(lo);
      expect(end[1]).toBeLessThanOrEqual(hi);
    });
    // the outer wires ARE the collector's two ends
    expect(L.wires[0].to).toEqual(top.from);
    expect(L.wires[3].to).toEqual(bottom.from);
  });

  it("the collector, the junction and the bundle meet edge to edge", () => {
    const half = L.junction.size / 2;
    expect(L.collector[0].to).toEqual([L.junction.at[0], L.junction.at[1] - half]);
    expect(L.collector[1].to).toEqual([L.junction.at[0], L.junction.at[1] + half]);
    expect(L.bundleIn.x0).toBe(L.junction.at[0] + half);
    expect(L.bundleIn.x1).toBe(HUB[0] - L.hub.rings[0]);
    expect(L.bundleIn.y).toBe(HUB[1]);
    expect(L.bundleOut.x0).toBe(HUB[0] + L.hub.rings[0]);
    expect(L.bundleOut.x1).toBe(L.bus.x);
  });

  it("the rail's major ticks reach the chips, on the rows", () => {
    expect(L.rail.x + L.rail.major).toBe(L.chips[0].x);
    expect(L.rail.ticks.filter((t) => t.major).map((t) => t.y)).toEqual([...ROWS]);
    expect(L.rail.y0).toBeGreaterThan(0);
    expect(L.rail.y1).toBeLessThan(FRAME.h);
  });
});

describe("F2 · bearing", () => {
  const L = BEARING;

  it("every bearing is one straight line through the dial's centre, ending on the rim", () => {
    L.lines.forEach((l, i) => {
      expect(l.pts).toHaveLength(2);
      expect(l.from).toEqual([L.chips[i].x + CHIP_W, ROWS[i]]);
      // collinear with the hub: the cross product of the two directions is zero
      const cross =
        (l.to[0] - l.from[0]) * (HUB[1] - l.from[1]) - (l.to[1] - l.from[1]) * (HUB[0] - l.from[0]);
      expect(Math.abs(cross)).toBeLessThan(1e-6);
      expect(near(Math.hypot(l.to[0] - HUB[0], l.to[1] - HUB[1]), L.dial.rim, 1e-6)).toBe(true);
    });
  });

  it("no rim tick is drawn under a bearing or under the way out", () => {
    const entries = L.lines.map(
      (l) => ((Math.atan2(l.to[1] - HUB[1], l.to[0] - HUB[0]) * 180) / Math.PI + 360) % 360
    );
    for (const [a] of L.dial.ticks) {
      const deg = ((Math.atan2(a[1] - HUB[1], a[0] - HUB[0]) * 180) / Math.PI + 360) % 360;
      for (const e of [0, ...entries]) {
        const diff = Math.abs(((deg - e + 540) % 360) - 180);
        expect(diff).toBeGreaterThanOrEqual(7.5);
      }
    }
  });

  it("the readout's rows are the bus's taps, and the bundle lands on the bus", () => {
    expect(L.bus.y0).toBe(L.readout.rows[0]);
    expect(L.bus.y1).toBe(L.readout.rows[3]);
    expect(L.bundleOut.y).toBeGreaterThan(L.bus.y0);
    expect(L.bundleOut.y).toBeLessThan(L.bus.y1);
    expect(L.bundleOut.x0).toBe(HUB[0] + L.dial.rim);
    expect(L.readout.y0).toBeLessThan(L.readout.rows[0]);
    expect(L.readout.y1).toBeGreaterThan(L.readout.rows[3]);
  });

  it("the dial and its tags stay inside the frame, clear of the tabs", () => {
    expect(HUB[1] - L.dial.rim).toBeGreaterThan(L.tie.y0);
    expect(HUB[1] + L.dial.rim).toBeLessThan(FRAME.h);
    for (const p of L.parts) {
      expect(inFrame(p.tag)).toBe(true);
      expect(p.tag[1]).toBeGreaterThan(L.tie.y0 + 14);
    }
  });
});

describe("F3 · axis", () => {
  const L = AXIS;

  it("the datum is the mark's bar continued: same level, same thickness", () => {
    const top = L.mark.y + MARK_BAR.y0 * L.mark.k;
    const bottom = L.mark.y + MARK_BAR.y1 * L.mark.k;
    expect(near((top + bottom) / 2, HUB[1], 1e-6)).toBe(true);
    for (const side of [L.datumWest, L.datumEast]) {
      expect(side).toHaveLength(3);
      const ys = side.map((l) => l[0][1]).sort((a, b) => a - b);
      expect(near(ys[0], top, 1e-6)).toBe(true);
      expect(near(ys[1], HUB[1], 1e-6)).toBe(true);
      expect(near(ys[2], bottom, 1e-6)).toBe(true);
    }
  });

  it("the datum meets the bar's two ends", () => {
    for (const l of L.datumWest)
      expect(near(l[1][0], L.mark.x + MARK_BAR.x0 * L.mark.k, 1e-6)).toBe(true);
    for (const l of L.datumEast)
      expect(near(l[0][0], L.mark.x + MARK_BAR.x1Low * L.mark.k, 1e-6)).toBe(true);
    expect(L.ends.x0).toBeGreaterThanOrEqual(0);
    expect(L.ends.x1).toBeLessThanOrEqual(FRAME.w);
  });

  it("every line is straight, every stub is plumb and lands on the datum's edge", () => {
    for (const l of STRAIGHT_LINES.axis) expect(isStraight(l)).toBe(true);
    for (const s of [...L.stubsWest, ...L.stubsEast]) {
      expect(s.from[0]).toBe(s.to[0]);
      expect(near(Math.abs(s.to[1] - HUB[1]), L.half, 1e-6)).toBe(true);
    }
    for (const t of [...L.tapsWest, ...L.tapsEast]) expect(t[1]).toBe(HUB[1]);
  });

  it("the chips and the interfaces clear the mark's brackets", () => {
    const reach = L.ring.r + 12;
    for (const c of L.chips) expect(c.x + CHIP_W).toBeLessThan(HUB[0] - reach);
    for (const r of L.reads) expect(r.x).toBeGreaterThan(HUB[0] + reach);
    for (const p of L.parts) expect(inFrame(p.tag)).toBe(true);
  });
});

describe("a bearing", () => {
  it("stops on the rim it is aimed at", () => {
    const [, tip] = bearing([0, 0], [100, 0], 30);
    expect(tip).toEqual([70, 0]);
  });
});
