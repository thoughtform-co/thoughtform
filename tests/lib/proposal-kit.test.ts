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
import { makeIso } from "@/components/xb-proposal/iso";
import { DEPTH, FLOW, INDEX, PORTS } from "@/components/xb-proposal/stack/heroLayouts";
import { arrivalQ, arrive, HERO_BOX, poseIn, STACK } from "@/components/xb-proposal/stack/travel";
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

/* Round 02: the stack travels from "AI capability your teams own." into
   Navigate, Encode, Build. The receiver draws it; these hold the two seams. */
describe("the stack's arrival", () => {
  const from = { x: 735, y: 420, k: 1.18 };
  const to = { x: 972, y: 540, k: 0.92 };
  const open = 300;

  it("reads its clock off the runway: 0 at the screen's bottom, 1 at the pin", () => {
    expect(arrivalQ(830, 830)).toBe(0);
    expect(arrivalQ(1200, 830)).toBe(0);
    expect(arrivalQ(415, 830)).toBe(0.5);
    expect(arrivalQ(0, 830)).toBe(1);
    expect(arrivalQ(-300, 830)).toBe(1);
  });

  it("starts as the donor's stack: closed, at the donor's seat and scale", () => {
    const a = arrive(0, from, to, open);
    expect(a.gap).toBe(STACK.closed);
    expect(a.seat).toEqual(from);
  });

  it("ends as the steps' own top-of-pin state: opened, at its own seat", () => {
    const a = arrive(1, from, to, open);
    expect(a.gap).toBe(open);
    expect(a.seat).toEqual(to);
    // at its own seat the pose is the identity, so nothing after it changes
    const pose = poseIn(
      a.seat,
      { x: to.x - STACK.ref[0] * to.k, y: to.y - STACK.ref[1] * to.k },
      to.k
    );
    expect(pose.s).toBe(1);
    expect(Math.abs(pose.tx)).toBeLessThan(1e-9);
    expect(Math.abs(pose.ty)).toBeLessThan(1e-9);
  });

  it("only ever opens and only ever approaches on the way", () => {
    let last = arrive(0, from, to, open);
    for (let q = 0.05; q <= 1.0001; q += 0.05) {
      const a = arrive(q, from, to, open);
      expect(a.gap).toBeGreaterThanOrEqual(last.gap);
      expect(a.seat.x).toBeGreaterThanOrEqual(last.seat.x);
      expect(a.seat.y).toBeGreaterThanOrEqual(last.seat.y);
      expect(a.seat.k).toBeLessThanOrEqual(last.seat.k);
      last = a;
    }
  });

  it("puts the reference point on the seat it is given", () => {
    const origin = { x: 640, y: 210 };
    const k = 0.92;
    const seat = arrive(0.4, from, to, open).seat;
    const { s, tx, ty } = poseIn(seat, origin, k);
    // the reference point through translate(tx ty) scale(s), then the drawing's own origin and scale
    expect(origin.x + (tx + s * STACK.ref[0]) * k).toBeCloseTo(seat.x, 9);
    expect(origin.y + (ty + s * STACK.ref[1]) * k).toBeCloseTo(seat.y, 9);
    expect(s * k).toBeCloseTo(seat.k, 9);
  });

  it("the donor's crop holds the whole closed stack, with air", () => {
    // a plate's top diamond spans 8 units each way through the projection
    const half = 8 * Math.cos(Math.PI / 6) * STACK.unit;
    expect(HERO_BOX.x).toBeLessThan(STACK.ox - half);
    expect(HERO_BOX.x + HERO_BOX.w).toBeGreaterThan(STACK.ox + half);
    expect(HERO_BOX.y).toBeLessThan(STACK.oy - 1.2 * STACK.unit);
    // the lowest plate's floor: its near corner, two closed pitches down
    expect(HERO_BOX.y + HERO_BOX.h).toBeGreaterThan(STACK.oy + 8 * STACK.unit + 2 * STACK.closed);
    // the reference point is the team plate's top-face centre
    expect(STACK.ref).toEqual([STACK.ox, STACK.oy + 4 * STACK.unit]);
  });
});

/* Round 03: the opening's lines end on the plates. A plate's corner edge is
   plumb in this projection, so a level line meets it square on; these hold
   that every line that claims a plate lands on the middle of its edge. */
describe("the opening's lines", () => {
  const iso = makeIso(STACK.unit, STACK.ox, STACK.oy);
  const level = (pts: readonly Pt[]) => pts.every((p) => p[1] === pts[0][1]);

  it("a port is the middle of its plate's corner edge, through the projection", () => {
    DEPTH.forEach((depth, i) => {
      const drop = i * STACK.closed;
      // the left corner is (0, 8), the right (8, 0); the edge runs the plate's depth
      const [lx, lFloor] = iso.p(0, 8, 0);
      const [rx, rTop] = iso.p(8, 0, depth);
      expect(PORTS[i].left[0]).toBeCloseTo(lx, 9);
      expect(PORTS[i].right[0]).toBeCloseTo(rx, 9);
      const mid = (lFloor + iso.p(0, 8, depth)[1]) / 2 + drop;
      expect(PORTS[i].left[1]).toBeCloseTo(mid, 9);
      expect(PORTS[i].right[1]).toBeCloseTo((rTop + iso.p(8, 0, 0)[1]) / 2 + drop, 9);
    });
  });

  it("the flow: in on the team's plate, out of the agents', the layer tied to its tab", () => {
    const [team, layer, agents] = FLOW.ports;
    expect(level(FLOW.runIn)).toBe(true);
    expect(FLOW.runIn.at(-1)).toEqual(team.left);
    expect(level(FLOW.runOut)).toBe(true);
    expect(FLOW.runOut[0]).toEqual(agents.right);
    expect(isStraight(FLOW.tie)).toBe(true);
    expect(FLOW.tie.at(-1)).toEqual(layer.right);
    expect(pathOf(FLOW.tie)).not.toMatch(/[CQSA]/);
    // the tie comes down the gutter the way out leaves free, and stops above it
    expect(Math.max(...FLOW.tie.map((p) => p[1]))).toBeLessThan(agents.right[1]);
    for (const p of FLOW.tie.slice(1, -1)) {
      expect(p[0]).toBeGreaterThan(layer.right[0]);
      expect(p[0]).toBeLessThan(FLOW.tools.bus[0][0]);
    }
  });

  it("the flow: the layer letters its three parts down the gutter the way in leaves free", () => {
    const [team, layer] = FLOW.ports;
    expect(isStraight(FLOW.drop)).toBe(true);
    expect(pathOf(FLOW.drop)).not.toMatch(/[CQSA]/);
    expect(FLOW.drop[0]).toEqual(layer.left);
    // below the way in, between the team's bus and the stack
    expect(Math.min(...FLOW.drop.map((p) => p[1]))).toBeGreaterThan(team.left[1]);
    for (const p of FLOW.drop.slice(1)) {
      expect(p[0]).toBeGreaterThan(FLOW.team.bus[0][0]);
      expect(p[0]).toBeLessThan(layer.left[0]);
    }
    // three tags, each centred on the drop's plumb run, the last where it ends
    expect(FLOW.parts).toHaveLength(3);
    const x = FLOW.drop.at(-1)![0];
    for (const p of FLOW.parts) expect(p[0]).toBe(x);
    expect(FLOW.parts[2]).toEqual(FLOW.drop.at(-1));
    expect(FLOW.parts[0][1]).toBeGreaterThan(FLOW.drop[2][1]);
    // and the gold turns about the centre as the flow does: tie right, drop left
    const tieX = Math.max(...FLOW.tie.map((p) => p[0]));
    expect(tieX + x).toBe(2 * HUB[0]);
  });

  it("the flow: each run leaves or meets its bus at a junction on the bus", () => {
    const half = FLOW.team.junction.size / 2;
    expect(FLOW.team.junction.at[0]).toBe(FLOW.team.bus[0][0]);
    expect(FLOW.runIn[0]).toEqual([FLOW.team.junction.at[0] + half, FLOW.team.junction.at[1]]);
    expect(FLOW.tools.junction.at[0]).toBe(FLOW.tools.bus[0][0]);
    expect(FLOW.runOut.at(-1)).toEqual([
      FLOW.tools.junction.at[0] - half,
      FLOW.tools.junction.at[1],
    ]);
    // a junction sits on its bus, between two rows, clear of both taps
    for (const side of [FLOW.team, FLOW.tools]) {
      const y = side.junction.at[1];
      expect(y).toBeGreaterThan(side.bus[0][1]);
      expect(y).toBeLessThan(side.bus[1][1]);
      for (const row of FLOW.rows) expect(Math.abs(row - y)).toBeGreaterThan(half + 3 + 6);
    }
  });

  it("the flow turns onto itself about the frame's middle", () => {
    const turn = (p: Pt): Pt => [2 * HUB[0] - p[0], 2 * HUB[1] - p[1]];
    const [team, , agents] = FLOW.ports;
    const [tx, ty] = turn(team.left);
    expect(agents.right[0]).toBeCloseTo(tx, 9);
    expect(agents.right[1]).toBeCloseTo(ty, 9);
    const [jx, jy] = turn(FLOW.team.junction.at);
    expect(FLOW.tools.junction.at[0]).toBeCloseTo(jx, 9);
    expect(FLOW.tools.junction.at[1]).toBeCloseTo(jy, 9);
    // two columns of one width, the same margin off the frame
    expect(FLOW.chips[0].x).toBe(FRAME.w - FLOW.cards.x1);
    expect(FLOW.cards.x1 - FLOW.cards.x0).toBe(FLOW.col);
    // and the stack's box stays inside the frame, under the tabs' line
    expect(FLOW.box.y).toBeGreaterThan(0);
    expect(FLOW.box.y + FLOW.box.side).toBeLessThan(FRAME.h);
  });

  it("the index: a level line a side for each plate, ending on its port", () => {
    INDEX.leads.forEach((l, i) => {
      expect(level(l.left)).toBe(true);
      expect(level(l.right)).toBe(true);
      expect(l.left.at(-1)).toEqual(PORTS[i].left);
      expect(l.right[0]).toEqual(PORTS[i].right);
      // the words sit on the line's own level, past its outer end
      expect(INDEX.index[i][1]).toBe(PORTS[i].left[1]);
      expect(INDEX.index[i][0]).toBeLessThan(l.left[0][0]);
      expect(INDEX.names[i][1]).toBe(PORTS[i].right[1]);
      expect(INDEX.names[i][0]).toBeGreaterThan(l.right[1][0]);
    });
  });
});
