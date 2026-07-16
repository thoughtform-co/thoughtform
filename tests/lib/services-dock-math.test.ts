import { describe, expect, it } from "vitest";

import {
  DOCK_ANCHORS_OFF_EXIT,
  DOCK_DEPTH_WRITE_OFF_EXIT,
  DOCK_EJECT_BUMP,
  DOCK_FACE_DIM,
  DOCK_FALLBACK_NDC,
  DOCK_FIXTURE_WINDOW,
  DOCK_SEAT_FRAC,
  dockFixtureIn,
  dockFlatYaw,
  dockTravelEnvelope,
  seatNdcFromRect,
  seatWorldHeight,
} from "@/lib/services-ring/dockMath";
import {
  RING_COUNT,
  RING_EXIT_WINDOWS,
  basePhi,
  cardFacingYaw,
  exitProgressForRunway,
} from "@/lib/services-ring/ringMath";

const TAU = Math.PI * 2;

describe("dockTravelEnvelope — identity pin (the ADR-030/046 guardrail)", () => {
  it("returns EXACT identity at exit = 0 for every card", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      const env = dockTravelEnvelope(0, i);
      expect(env.t).toBe(0);
      expect(env.positionT).toBe(0);
      expect(env.flattenT).toBe(0);
      expect(env.radiusMul).toBe(1);
      expect(env.faceDim).toBe(1);
      expect(env.glowMul).toBe(1);
      expect(env.bend).toBe(0);
      expect(env.webglOpacity).toBe(1);
      expect(env.domOpacity).toBe(0);
    }
  });

  it("stays identity through every reading beat (exit clock is 0 there)", () => {
    // exitProgressForRunway is 0 until the final beat begins.
    for (const p of [0, 0.2, 0.5, (RING_EXIT_WINDOWS.length + 1) / 6 - 0.001, 5 / 6]) {
      const exit = exitProgressForRunway(p);
      const env = dockTravelEnvelope(exit, 0);
      expect(env.webglOpacity).toBe(1);
      expect(env.domOpacity).toBe(0);
      expect(env.positionT).toBe(0);
    }
  });
});

describe("dockTravelEnvelope — travel + seat", () => {
  it("is monotonic in position and crossfade over the exit clock", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      let lastPos = -1;
      let lastDom = -1;
      for (let s = 0; s <= 100; s++) {
        const env = dockTravelEnvelope(s / 100, i);
        expect(env.positionT).toBeGreaterThanOrEqual(lastPos);
        expect(env.domOpacity).toBeGreaterThanOrEqual(lastDom);
        lastPos = env.positionT;
        lastDom = env.domOpacity;
      }
    }
  });

  it("honours the RING_EXIT_WINDOWS stagger — earlier cards seat first", () => {
    // At an exit level where card 0's window is done but card 3's is not.
    const exit = 0.62;
    const env0 = dockTravelEnvelope(exit, 0);
    const env3 = dockTravelEnvelope(exit, 3);
    expect(env0.domOpacity).toBe(1);
    expect(env3.domOpacity).toBeLessThan(1);
    expect(env0.positionT).toBeGreaterThan(env3.positionT);
  });

  it("crossfade is complementary around the seat swap", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      for (const exit of [0.3, 0.55, 0.8, 0.88, 0.95]) {
        const env = dockTravelEnvelope(exit, i);
        expect(env.webglOpacity + env.domOpacity).toBeCloseTo(1, 12);
      }
    }
  });

  it("all four cards are fully seated by exit = 0.9 (the clear tail)", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      const env = dockTravelEnvelope(0.9, i);
      expect(env.webglOpacity).toBe(0);
      expect(env.domOpacity).toBe(1);
      expect(env.positionT).toBe(1);
      expect(env.bend).toBeCloseTo(0, 12);
      expect(env.radiusMul).toBeCloseTo(1, 12);
    }
  });

  it("the eject bump is sin-shaped: zero at both ends, peaked early", () => {
    const mid = dockTravelEnvelope.length; // silence unused warnings pattern-free
    expect(mid).toBeGreaterThan(0);
    const env = dockTravelEnvelope(1, 2);
    expect(env.radiusMul).toBeCloseTo(1, 12);
    // Probe the card-local clock: find an exit where card 2's t ≈ 0.125
    // (the bump peak). Window [0.24, 0.74] → t is a smootherstep of exit.
    let peaked = 0;
    for (let s = 0; s <= 200; s++) {
      peaked = Math.max(peaked, dockTravelEnvelope(0.24 + (s / 200) * 0.5, 2).radiusMul);
    }
    expect(peaked).toBeGreaterThan(1 + DOCK_EJECT_BUMP * 0.95);
    expect(peaked).toBeLessThanOrEqual(1 + DOCK_EJECT_BUMP + 1e-12);
  });

  it("face ink dims to DOCK_FACE_DIM once flattened, seat gates sit inside the clock", () => {
    const env = dockTravelEnvelope(1, 0);
    expect(env.faceDim).toBeCloseTo(DOCK_FACE_DIM, 12);
    expect(env.glowMul).toBe(0);
    expect(DOCK_SEAT_FRAC).toBeGreaterThan(0.5);
    expect(DOCK_SEAT_FRAC).toBeLessThan(1);
    expect(DOCK_DEPTH_WRITE_OFF_EXIT).toBeLessThan(DOCK_ANCHORS_OFF_EXIT);
    expect(DOCK_ANCHORS_OFF_EXIT).toBeLessThan(RING_EXIT_WINDOWS[0][1]);
  });
});

describe("dockFixtureIn", () => {
  it("is 0 at exit 0 and fully on before the first card can seat", () => {
    expect(dockFixtureIn(0)).toBe(0);
    expect(dockFixtureIn(DOCK_FIXTURE_WINDOW[1])).toBe(1);
    // Card 0's seat swap starts at t = DOCK_SEAT_FRAC of its window
    // [0, 0.5] → exit ≥ ~0.4 ≫ the fixture window end (0.3).
    expect(DOCK_FIXTURE_WINDOW[1]).toBeLessThan(0.4);
  });
});

describe("dockFlatYaw — deterministic unwind targets", () => {
  it("rounds each card's settled exit yaw to a full turn", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      const flat = dockFlatYaw(i);
      expect(Math.abs(flat % TAU)).toBeCloseTo(0, 12);
      // The flat target stays within a half-turn + facing-blend margin of
      // the settled pose (shortest sensible unwind, never a full extra spin).
      const settled = cardFacingYaw(basePhi(i) + -3 * (Math.PI / 2));
      expect(Math.abs(flat - settled)).toBeLessThanOrEqual(Math.PI + 1e-9);
    }
  });

  it("breaks card 1's exact half-turn tie toward the ring's travel direction", () => {
    // Card 1's settled exit yaw is exactly −π; the tie must resolve to −2π
    // (continue the orbit direction), not backtrack to 0.
    expect(dockFlatYaw(1)).toBeCloseTo(-TAU, 12);
  });
});

describe("seat projection helpers", () => {
  it("seatNdcFromRect maps viewport corners and centre", () => {
    expect(seatNdcFromRect(960, 540, 1920, 1080)).toEqual([0, -0]);
    const [x, y] = seatNdcFromRect(1920, 1080, 1920, 1080);
    expect(x).toBe(1);
    expect(y).toBe(-1);
    expect(seatNdcFromRect(10, 10, 0, 0)).toBe(DOCK_FALLBACK_NDC);
  });

  it("seatWorldHeight round-trips a projected slot height", () => {
    const halfFovTan = Math.tan((40 * Math.PI) / 360);
    const d = 3.2;
    const vh = 1080;
    const slotH = 44;
    const world = seatWorldHeight(slotH, vh, d, halfFovTan);
    // Reproject: world height at depth d covers world / (2·d·tan(fov/2))
    // of the viewport.
    const reprojected = (world / (2 * d * halfFovTan)) * vh;
    expect(reprojected).toBeCloseTo(slotH, 9);
    expect(seatWorldHeight(slotH, 0, d, halfFovTan)).toBe(0);
  });
});
