import { describe, expect, it } from "vitest";

import {
  DIAL_CORE,
  DIAL_ENGAGEMENT,
  DIAL_OUTER,
  DIAL_RIM,
  DIAL_RINGS,
  DIAL_TRACK,
  DIAL_VB,
  dialArcPath,
  dialCirclePath,
  dialFraction,
  dialHandover,
  dialPoint,
  dialPoints,
  dialSpokes,
  dialStations,
  dialStubs,
  dialTicks,
} from "@/components/arcs/steps/dialLayout";

/**
 * The dial's arithmetic (ADR-106).
 *
 * The live half is the smoke, which measures the RENDERED figure; neither is
 * sufficient alone — the arithmetic cannot see a CSS change, and the smoke
 * cannot say which constant to move.
 *
 * ⚠ THIS DRAWING LETTERS NOTHING IN SVG, so there is no declared-`measure`
 * ladder here (ADR-100's discipline answers a problem SVG `<text>` has and
 * this figure does not). What it must hold instead is containment: every mark
 * inside the crop, every label seat inside its annulus, and the engagement's
 * node exactly on the end of the arc it terminates.
 */

const R = 1e-9;
const inCrop = (x: number, y: number) =>
  x >= DIAL_VB.x - R &&
  x <= DIAL_VB.x + DIAL_VB.w + R &&
  y >= DIAL_VB.y - R &&
  y <= DIAL_VB.y + DIAL_VB.h + R;

/** A point's distance from the dial's centre. */
const rad = (p: { x: number; y: number }) => Math.hypot(p.x, p.y);

describe("the dial's register", () => {
  it("is one square crop centred on the origin, with a descending ring ladder", () => {
    expect(DIAL_VB.w).toBe(DIAL_VB.h);
    expect(DIAL_VB.x).toBe(-DIAL_VB.w / 2);
    expect(DIAL_VB.y).toBe(-DIAL_VB.h / 2);

    expect(DIAL_RINGS).toHaveLength(6);
    for (let i = 1; i < DIAL_RINGS.length; i++) {
      expect(
        DIAL_RINGS[i].r,
        `${DIAL_RINGS[i].id} is not inside ${DIAL_RINGS[i - 1].id}`
      ).toBeLessThan(DIAL_RINGS[i - 1].r);
    }
    // The rim is the outermost and the core the innermost; both are rings.
    expect(DIAL_RINGS[0].r).toBe(DIAL_RIM);
    expect(DIAL_RINGS[DIAL_RINGS.length - 1].r).toBe(DIAL_CORE);
    // The rim clears the crop's edge, so the graduation is never cut.
    expect(DIAL_RIM).toBeLessThan(DIAL_VB.w / 2);

    // The two tracks a figure runs on are rings of the register, not values
    // of their own — one instrument, three readings.
    const radii = DIAL_RINGS.map((r) => r.r);
    expect(radii).toContain(DIAL_TRACK);
    expect(radii).toContain(DIAL_OUTER);

    /* ⚠ NO TWO NEIGHBOURS SHARE A DASH. The ladder's rhythm is what stops six
       concentric rings reading as a moiré rather than as a register. */
    for (let i = 1; i < DIAL_RINGS.length; i++) {
      expect(
        DIAL_RINGS[i].dash === DIAL_RINGS[i - 1].dash && DIAL_RINGS[i].dash !== undefined,
        `${DIAL_RINGS[i].id} repeats its neighbour's dash`
      ).toBe(false);
    }
  });

  it("graduates the rim off the cardinals and stubs them on it", () => {
    const ticks = dialTicks();
    const stubs = dialStubs();
    expect(ticks).toHaveLength(20);
    expect(stubs).toHaveLength(4);

    for (const t of ticks) {
      // Hung from the rim, inward.
      expect(rad({ x: t.x1, y: t.y1 })).toBeCloseTo(DIAL_RIM, 6);
      expect(rad({ x: t.x2, y: t.y2 })).toBeLessThan(DIAL_RIM);
      expect(rad({ x: t.x2, y: t.y2 })).toBeGreaterThan(DIAL_OUTER);
    }
    /* ⚠ A STUB IS LONGER THAN A TICK, or the instrument is graduated without
       being oriented and the four cardinals say nothing. */
    const tickLen = Math.hypot(ticks[0].x2 - ticks[0].x1, ticks[0].y2 - ticks[0].y1);
    const stubLen = Math.hypot(stubs[0].x2 - stubs[0].x1, stubs[0].y2 - stubs[0].y1);
    expect(stubLen).toBeGreaterThan(tickLen);

    // No tick sits under a stub: the graduation skips the cardinals.
    for (const s of stubs) {
      for (const t of ticks) {
        expect(Math.hypot(t.x1 - s.x1, t.y1 - s.y1), "a tick under a stub").toBeGreaterThan(1);
      }
    }
  });

  it("runs its spokes on the diagonals, from the spoke ring to the core", () => {
    const spokes = dialSpokes();
    expect(spokes).toHaveLength(4);
    const stubs = dialStubs();
    for (const k of spokes) {
      expect(rad({ x: k.x2, y: k.y2 })).toBeCloseTo(DIAL_CORE, 6);
      expect(rad({ x: k.x1, y: k.y1 })).toBeLessThan(DIAL_OUTER);
      // Never under a cardinal stub — the two marks would read as one radial.
      for (const s of stubs) {
        const dot =
          (k.x1 * s.x1 + k.y1 * s.y1) / (rad({ x: k.x1, y: k.y1 }) * rad({ x: s.x1, y: s.y1 }));
        expect(Math.abs(dot), "a spoke on a cardinal").toBeLessThan(0.99);
      }
    }
  });

  it("draws every mark inside the crop", () => {
    for (const p of dialPoints()) {
      expect(inCrop(p.x, p.y), `${p.id} is outside the crop`).toBe(true);
    }
  });

  it("closes its circle at twelve o'clock, in two arcs and no transform", () => {
    const d = dialCirclePath(DIAL_TRACK);
    /* ⚠ NOT a `<circle>`: a circle's draw-on starts at three o'clock and the
       only way to move it is a rotate(), which this drawing may not carry —
       the overlap walk compares `getBBox`, which is blind to a transform. */
    expect(d.startsWith(`M 0 ${-DIAL_TRACK}`)).toBe(true);
    expect(d.endsWith(`0 ${-DIAL_TRACK}`)).toBe(true);
    expect(d.match(/A /g)).toHaveLength(2);
    for (const s of [d, dialArcPath(DIAL_OUTER, 10, 200), dialHandover().outer]) {
      expect(/transform|rotate|matrix/i.test(s), "a transform in the geometry").toBe(false);
    }
  });

  it("puts a bearing where the compass does", () => {
    // 0° is up, and it runs clockwise: the house's own convention.
    expect(dialPoint(0, 10).y).toBeCloseTo(-10, 9);
    expect(dialPoint(0, 10).x).toBeCloseTo(0, 9);
    expect(dialPoint(90, 10).x).toBeCloseTo(10, 9);
    expect(dialPoint(180, 10).y).toBeCloseTo(10, 9);
    // The centre is the middle of the box, so a seat there is (0.5, 0.5).
    const f = dialFraction(0, 0);
    expect(f.ax).toBeCloseTo(0.5, 9);
    expect(f.at).toBeCloseTo(0.5, 9);
  });
});

describe("stage 2: the run", () => {
  const ids = ["brief", "make", "grade", "ship"];

  it("seats four stations evenly on the track, clockwise from the top", () => {
    const seats = dialStations(ids);
    expect(seats).toHaveLength(4);
    expect(seats.map((s) => s.id)).toEqual(ids);
    expect(seats.map((s) => s.deg)).toEqual([0, 90, 180, 270]);

    for (const s of seats) {
      // The node is ON the run's own track — the mark and the line are one.
      const p = dialPoint(s.deg, DIAL_TRACK);
      expect(s.ax).toBeCloseTo((p.x + DIAL_VB.w / 2) / DIAL_VB.w, 9);
      expect(s.at).toBeCloseTo((p.y + DIAL_VB.h / 2) / DIAL_VB.h, 9);
      for (const v of [s.ax, s.at, s.labelAx, s.labelAt]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("rides its labels in the annulus, clear of the track and the graduation", () => {
    const seats = dialStations(ids);
    for (const s of seats) {
      const r = rad({
        x: s.labelAx * DIAL_VB.w + DIAL_VB.x,
        y: s.labelAt * DIAL_VB.h + DIAL_VB.y,
      });
      /* Between the spoke ring and the rim's ticks: a tag set on the track
         would sit on the lit run, and one set on the rim would sit in the
         graduation. */
      expect(r, `${s.id}: label off the annulus`).toBeGreaterThan(DIAL_TRACK);
      expect(r, `${s.id}: label in the graduation`).toBeLessThan(DIAL_RIM - 6);
    }
  });

  it("orders its clock the way the run travels", () => {
    const seats = dialStations(ids);
    expect(seats[0].at0).toBe(0);
    for (let i = 1; i < seats.length; i++) {
      expect(seats[i].at0, "a station opens before the one before it").toBeGreaterThan(
        seats[i - 1].at0
      );
    }
    expect(seats[seats.length - 1].at0).toBeLessThan(1);
  });
});

describe("stage 3: the arc that ends", () => {
  const g = dialHandover();

  it("terminates the engagement exactly where its node is", () => {
    const end = dialPoint(DIAL_ENGAGEMENT.to, DIAL_OUTER);
    expect(g.node.ax).toBeCloseTo((end.x + DIAL_VB.w / 2) / DIAL_VB.w, 9);
    expect(g.node.at).toBeCloseTo((end.y + DIAL_VB.h / 2) / DIAL_VB.h, 9);
    // The arc's own last point is that node: the mark is the end, not near it.
    const last = g.outer.split("A ")[1].trim().split(/\s+/).slice(-2).map(Number);
    expect(last[0]).toBeCloseTo(end.x, 6);
    expect(last[1]).toBeCloseTo(end.y, 6);
  });

  it("caps the run across its own track", () => {
    /* ⚠ THE CAP STRADDLES THE TRACK. An arc that simply stops reads as a
       rendering fault; one that stops at a drawn terminus reads as the
       deliberate end it is. */
    expect(rad({ x: g.cap.x1, y: g.cap.y1 })).toBeGreaterThan(DIAL_OUTER);
    expect(rad({ x: g.cap.x2, y: g.cap.y2 })).toBeLessThan(DIAL_OUTER);
    expect(rad({ x: g.cap.x1, y: g.cap.y1 })).toBeLessThan(DIAL_RIM);
  });

  it("leaves the larger part of the track bare, and draws it", () => {
    const sweep = (((DIAL_ENGAGEMENT.to - DIAL_ENGAGEMENT.from) % 360) + 360) % 360;
    expect(sweep).toBeGreaterThan(0);
    // The engagement is the SHORT part: the bare remainder is the reading.
    expect(sweep).toBeLessThan(180);
    // The bare track is drawn, at the faintest rung, and it closes the ring.
    expect(g.bare.length).toBeGreaterThan(0);
    expect(g.bare).not.toBe(g.outer);
    // Its large-arc flag agrees with its own sweep.
    expect(g.outer).toContain(` 0 1 `);
    expect(g.bare).toContain(` 1 1 `);
  });

  it("keeps the setup closed, and its own labels inside the register", () => {
    expect(g.inner).toBe(dialCirclePath(DIAL_TRACK));
    const r = rad({
      x: g.arcLabel.ax * DIAL_VB.w + DIAL_VB.x,
      y: g.arcLabel.at * DIAL_VB.h + DIAL_VB.y,
    });
    // In the annulus, so it never sits on the arc it names.
    expect(r).toBeGreaterThan(DIAL_TRACK);
    expect(r).toBeLessThan(DIAL_OUTER);
    for (const v of [g.node.ax, g.node.at, g.label.ax, g.label.at, g.arcLabel.ax, g.arcLabel.at]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
