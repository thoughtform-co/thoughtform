import { describe, expect, it } from "vitest";

import {
  RING_COUNT,
  RING_STEP_COUNT,
  RING_TRAVEL_FRAC,
  RING_QUARTER,
  RING_SWAY_CAP_RAD,
  RING_SCALE_RANGE,
  RING_OPACITY_RANGE,
  RING_ENTRANCE_RADIUS_FROM,
  RING_DEPTH_WRITE_ON_NZ,
  RING_DEPTH_WRITE_OFF_NZ,
  basePhi,
  cardFacingYaw,
  ringIndexForProgress,
  ringRotationForProgress,
  activeServiceForProgress,
  frontCardIndex,
  stepRingSpring,
  placeCard,
  depthScale,
  depthOpacity,
  depthWriteGate,
  entranceEnvelope,
  type RingSpringState,
} from "@/lib/services-ring/ringMath";

/** Progress at local position `u` (0..1) inside beat `k` (0-based). */
const beatProgress = (k: number, u: number) => (k + u) / RING_STEP_COUNT;

describe("basePhi", () => {
  it("spaces the four cards evenly with card 0 at the front", () => {
    expect(basePhi(0)).toBe(0);
    expect(basePhi(1)).toBeCloseTo(Math.PI / 2, 12);
    expect(basePhi(2)).toBeCloseTo(Math.PI, 12);
    expect(basePhi(3)).toBeCloseTo((3 * Math.PI) / 2, 12);
  });
});

describe("ringIndexForProgress — the smooth staircase", () => {
  it("holds card 0 through the lead-in beat and service 0's own beat", () => {
    expect(ringIndexForProgress(0)).toBe(0);
    expect(ringIndexForProgress(beatProgress(0, 0.5))).toBe(0);
    expect(ringIndexForProgress(beatProgress(0, 0.999))).toBe(0);
    expect(ringIndexForProgress(beatProgress(1, 0.001))).toBe(0);
    expect(ringIndexForProgress(beatProgress(1, 0.5))).toBe(0);
    expect(ringIndexForProgress(beatProgress(1, 0.999))).toBe(0);
  });

  it("travels during the first RING_TRAVEL_FRAC of each later beat, then dwells", () => {
    for (let k = 2; k < RING_STEP_COUNT; k++) {
      const from = k - 2;
      // Start of the beat: still on the previous card (continuity).
      expect(ringIndexForProgress(beatProgress(k, 0))).toBeCloseTo(from, 12);
      // Mid-travel: strictly between the two integer indices.
      const mid = ringIndexForProgress(beatProgress(k, RING_TRAVEL_FRAC / 2));
      expect(mid).toBeGreaterThan(from);
      expect(mid).toBeLessThan(from + 1);
      // Travel completes exactly at the travel fraction…
      expect(ringIndexForProgress(beatProgress(k, RING_TRAVEL_FRAC))).toBeCloseTo(from + 1, 12);
      // …and the whole dwell is EXACTLY integral (settled front card).
      for (const u of [RING_TRAVEL_FRAC + 0.01, 0.6, 0.75, 0.9, 0.999]) {
        expect(ringIndexForProgress(beatProgress(k, u))).toBe(from + 1);
      }
    }
  });

  it("is monotonic and clamped over the full runway (and beyond)", () => {
    let prev = -Infinity;
    for (let i = 0; i <= 2000; i++) {
      const v = ringIndexForProgress(i / 2000);
      expect(v).toBeGreaterThanOrEqual(prev);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(RING_COUNT - 1);
      prev = v;
    }
    expect(ringIndexForProgress(1)).toBe(RING_COUNT - 1);
    expect(ringIndexForProgress(-0.5)).toBe(0);
    expect(ringIndexForProgress(1.5)).toBe(RING_COUNT - 1);
  });
});

describe("ring rotation ↔ step clock agreement", () => {
  it("frontCardIndex(rotation) equals the step-derived active service at every beat midpoint", () => {
    for (let k = 0; k < RING_STEP_COUNT; k++) {
      const p = beatProgress(k, 0.5);
      const rot = ringRotationForProgress(p);
      expect(frontCardIndex(rot)).toBe(activeServiceForProgress(p));
    }
  });

  it("agrees through every dwell (any u past the travel fraction)", () => {
    for (let k = 1; k < RING_STEP_COUNT; k++) {
      for (const u of [RING_TRAVEL_FRAC + 0.02, 0.7, 0.95]) {
        const p = beatProgress(k, u);
        expect(frontCardIndex(ringRotationForProgress(p))).toBe(activeServiceForProgress(p));
      }
    }
  });

  it("maps whole quarter turns back to card indices with negative-safe modulo", () => {
    expect(frontCardIndex(0)).toBe(0);
    expect(frontCardIndex(-RING_QUARTER)).toBe(1);
    expect(frontCardIndex(-2 * RING_QUARTER)).toBe(2);
    expect(frontCardIndex(-3 * RING_QUARTER)).toBe(3);
    expect(frontCardIndex(-4 * RING_QUARTER)).toBe(0);
    expect(frontCardIndex(RING_QUARTER)).toBe(3);
  });
});

describe("stepRingSpring — bounded decaying sway (ADR-021)", () => {
  const settle = (state: RingSpringState, target: number, seconds: number, dt = 1 / 60) => {
    for (let t = 0; t < seconds; t += dt) stepRingSpring(state, target, dt);
    return state;
  };

  it("never lags or overshoots the target by more than the cap", () => {
    const state: RingSpringState = { pos: 0, vel: 0 };
    // Fast scroll: target jumps a full quarter turn.
    stepRingSpring(state, -RING_QUARTER, 1 / 60);
    expect(Math.abs(state.pos - -RING_QUARTER)).toBeLessThanOrEqual(RING_SWAY_CAP_RAD + 1e-9);
    // Violent velocity injection still stays inside the cap.
    const wild: RingSpringState = { pos: 0.1, vel: 40 };
    for (let i = 0; i < 240; i++) {
      stepRingSpring(wild, 0, 1 / 60);
      expect(Math.abs(wild.pos)).toBeLessThanOrEqual(RING_SWAY_CAP_RAD + 1e-9);
    }
  });

  it("decays to rest at a constant target — no perpetual motion", () => {
    const state = settle({ pos: RING_SWAY_CAP_RAD, vel: 2 }, 0, 4);
    expect(Math.abs(state.pos)).toBeLessThan(1e-3);
    expect(Math.abs(state.vel)).toBeLessThan(1e-3);
  });

  it("is underdamped: crosses the target at least once before settling", () => {
    const state: RingSpringState = { pos: 0.08, vel: 0 };
    let crossed = false;
    for (let i = 0; i < 600; i++) {
      stepRingSpring(state, 0, 1 / 60);
      if (state.pos < 0) crossed = true;
    }
    expect(crossed).toBe(true);
  });

  it("handles dt = 0, huge dt, and non-finite state without NaN", () => {
    const still: RingSpringState = { pos: 0.05, vel: 0.3 };
    stepRingSpring(still, 0, 0);
    expect(still.pos).toBeCloseTo(0.05, 12);
    expect(still.vel).toBeCloseTo(0.3, 12);

    const big: RingSpringState = { pos: 0, vel: 0 };
    for (let i = 0; i < 600; i++) stepRingSpring(big, 1, 5); // dt clamps to 1/30
    expect(Number.isFinite(big.pos)).toBe(true);
    expect(Math.abs(big.pos - 1)).toBeLessThan(1e-3);

    const broken: RingSpringState = { pos: Number.NaN, vel: 0 };
    stepRingSpring(broken, 0.4, 1 / 60);
    expect(broken.pos).toBe(0.4);
    expect(broken.vel).toBe(0);
  });

  it("snap goes straight to the target with zero velocity", () => {
    const state: RingSpringState = { pos: 3, vel: -5 };
    stepRingSpring(state, -1.2, 1 / 60, { snap: true });
    expect(state.pos).toBe(-1.2);
    expect(state.vel).toBe(0);
  });
});

describe("placeCard", () => {
  it("puts card 0 at the front (+z) facing the camera at rotation 0", () => {
    const front = placeCard(0, 0, { radius: 1.55 });
    expect(front.x).toBeCloseTo(0, 12);
    expect(front.z).toBeCloseTo(1.55, 12);
    expect(front.nz).toBeCloseTo(1, 12);
    expect(front.rotY).toBeCloseTo(0, 12);
  });

  it("brings card k to the front at rotation −k·quarter", () => {
    for (let k = 0; k < RING_COUNT; k++) {
      const placed = placeCard(k, -k * RING_QUARTER, { radius: 1 });
      expect(placed.nz).toBeCloseTo(1, 12);
      expect(placed.x).toBeCloseTo(0, 12);
    }
  });

  it("keeps rotY continuous (no atan2 seam) as the ring wraps", () => {
    let prev = placeCard(2, 0).rotY;
    for (let i = 1; i <= 400; i++) {
      const rotY = placeCard(2, (-i / 400) * Math.PI * 4).rotY;
      expect(Math.abs(rotY - prev)).toBeLessThan(0.1);
      prev = rotY;
    }
  });

  it("applies the entrance radius multiplier", () => {
    const flownOut = placeCard(0, 0, { radius: 1, radiusMul: RING_ENTRANCE_RADIUS_FROM });
    expect(flownOut.z).toBeCloseTo(RING_ENTRANCE_RADIUS_FROM, 12);
  });
});

describe("cardFacingYaw — symmetric camera-facing blend", () => {
  /** Wrap an angle to (−π, π]. */
  const wrap = (a: number) => a - Math.PI * 2 * Math.round(a / (Math.PI * 2));

  it("is the identity at blend 0 and leaves front/back cards unturned", () => {
    expect(cardFacingYaw(1.234, 0)).toBeCloseTo(1.234, 12);
    expect(cardFacingYaw(0, 0.32)).toBeCloseTo(0, 12);
    expect(cardFacingYaw(Math.PI, 0.32)).toBeCloseTo(Math.PI, 12);
  });

  it("turns BOTH side cards toward the camera by the same amount (no mirrored back face)", () => {
    const blend = 0.32;
    const right = cardFacingYaw(Math.PI / 2, blend); // card at +x
    const left = cardFacingYaw((3 * Math.PI) / 2, blend); // card at −x
    // Deviations from the raw azimuth are equal and opposite…
    expect(right - Math.PI / 2).toBeCloseTo(-(left - (3 * Math.PI) / 2), 12);
    // …and both wrapped yaws sit inside (−π/2, π/2): the FRONT face shows.
    expect(Math.abs(wrap(right))).toBeLessThan(Math.PI / 2);
    expect(Math.abs(wrap(left))).toBeLessThan(Math.PI / 2);
    // The naive `phi × (1 − blend)` failed exactly here: it left the
    // 270° card at ~184° — its mirrored back face flat to the camera.
    expect(Math.abs(wrap(((3 * Math.PI) / 2) * (1 - blend)))).toBeGreaterThan(Math.PI / 2);
  });

  it("is continuous and 2π-periodic across multiple wraps", () => {
    let prev = cardFacingYaw(-4 * Math.PI, 0.32);
    for (let i = 1; i <= 1600; i++) {
      const phi = -4 * Math.PI + (i / 1600) * 8 * Math.PI;
      const yaw = cardFacingYaw(phi, 0.32);
      expect(Math.abs(yaw - prev)).toBeLessThan(0.05);
      prev = yaw;
    }
    expect(cardFacingYaw(0.7 + Math.PI * 2, 0.32)).toBeCloseTo(
      cardFacingYaw(0.7, 0.32) + Math.PI * 2,
      12
    );
  });
});

describe("depth curves", () => {
  it("hits the configured ranges at the extremes and grows monotonically", () => {
    expect(depthScale(-1)).toBeCloseTo(RING_SCALE_RANGE[0], 12);
    expect(depthScale(1)).toBeCloseTo(RING_SCALE_RANGE[1], 12);
    expect(depthOpacity(-1)).toBeCloseTo(RING_OPACITY_RANGE[0], 12);
    expect(depthOpacity(1)).toBeCloseTo(RING_OPACITY_RANGE[1], 12);
    let prevS = -Infinity;
    let prevO = -Infinity;
    for (let nz = -1; nz <= 1.0001; nz += 0.05) {
      const s = depthScale(nz);
      const o = depthOpacity(nz);
      expect(s).toBeGreaterThanOrEqual(prevS);
      expect(o).toBeGreaterThanOrEqual(prevO);
      prevS = s;
      prevO = o;
    }
  });
});

describe("depthWriteGate hysteresis", () => {
  it("turns on above the ON threshold and holds until below the OFF threshold", () => {
    expect(depthWriteGate(false, RING_DEPTH_WRITE_ON_NZ - 0.01)).toBe(false);
    expect(depthWriteGate(false, RING_DEPTH_WRITE_ON_NZ + 0.01)).toBe(true);
    // Inside the hysteresis band the previous state wins.
    const inside = (RING_DEPTH_WRITE_ON_NZ + RING_DEPTH_WRITE_OFF_NZ) / 2;
    expect(depthWriteGate(true, inside)).toBe(true);
    expect(depthWriteGate(false, inside)).toBe(false);
    expect(depthWriteGate(true, RING_DEPTH_WRITE_OFF_NZ - 0.01)).toBe(false);
  });
});

describe("entranceEnvelope", () => {
  it("is hidden and flown-out before its window, settled after", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      const before = entranceEnvelope(0, i);
      expect(before.opacity).toBe(0);
      expect(before.radiusMul).toBeCloseTo(RING_ENTRANCE_RADIUS_FROM, 12);
      const after = entranceEnvelope(1, i);
      expect(after.opacity).toBe(1);
      expect(after.radiusMul).toBeCloseTo(1, 12);
    }
  });

  it("staggers the cards — earlier index reveals first", () => {
    const d = 0.7;
    let prev = Infinity;
    for (let i = 0; i < RING_COUNT; i++) {
      const { opacity } = entranceEnvelope(d, i);
      expect(opacity).toBeLessThanOrEqual(prev);
      prev = opacity;
    }
    expect(entranceEnvelope(0.7, 0).opacity).toBeGreaterThan(0);
  });

  it("clamps out-of-range card indices instead of crashing", () => {
    expect(entranceEnvelope(0.9, 99).opacity).toBe(entranceEnvelope(0.9, RING_COUNT - 1).opacity);
    expect(entranceEnvelope(0.9, -3).opacity).toBe(entranceEnvelope(0.9, 0).opacity);
  });
});
