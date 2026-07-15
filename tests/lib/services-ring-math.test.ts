import { describe, expect, it } from "vitest";

import {
  RING_COUNT,
  RING_STEP_COUNT,
  RING_TRAVEL_FRAC,
  RING_QUARTER,
  RING_SWAY_CAP_RAD,
  RING_SCALE_RANGE,
  RING_OPACITY_RANGE,
  RING_OPACITY_WINDOW,
  RING_Y_OFFSET,
  RING_ENTRANCE_RADIUS_FROM,
  RING_ENTRANCE_WINDOWS,
  RING_ENTRANCE_DIRECTIONS,
  RING_ENTRANCE_OFFSET,
  RING_ENTRANCE_OPACITY_LEAD,
  lerp,
  RING_DEPTH_WRITE_ON_NZ,
  RING_DEPTH_WRITE_OFF_NZ,
  RING_CARD_ORBIT_GEOMETRY,
  RING_EXIT_WINDOWS,
  RING_EXIT_RADIUS_TO,
  RING_FRONT_BIAS_PITCH,
  RING_FRONT_BIAS_WINDOW,
  RING_FRONT_BIAS_YAW,
  basePhi,
  buildCardOrbitGeometries,
  cardFacingYaw,
  placeCardOnOrbit,
  type CardOrbitGeometry,
  ringIndexForProgress,
  ringRotationForProgress,
  activeServiceForProgress,
  exitEnvelope,
  exitProgressForRunway,
  frontCardIndex,
  stepRingSpring,
  placeCard,
  depthScale,
  depthOpacity,
  depthWriteGate,
  entranceEnvelope,
  frontPoseBias,
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
    // The FINAL beat is the ADR-030 exit hold (no travel) — see the
    // dedicated pin below; only beats 2..stepCount−2 travel.
    for (let k = 2; k < RING_STEP_COUNT - 1; k++) {
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
      // Samples all sit past RING_TRAVEL_FRAC (0.85) — the dwell window.
      for (const u of [RING_TRAVEL_FRAC + 0.01, 0.9, 0.95, 0.99, 0.999]) {
        expect(ringIndexForProgress(beatProgress(k, u))).toBe(from + 1);
      }
    }
  });

  it("pins the LAST card through the whole exit-hold beat (ADR-030)", () => {
    // Beat stepCount−1 exists so the #tools cover can sweep over the
    // pinned stage while the ring stands perfectly still on card 3.
    const k = RING_STEP_COUNT - 1;
    for (const u of [0, 0.001, 0.25, RING_TRAVEL_FRAC, 0.75, 0.999]) {
      expect(ringIndexForProgress(beatProgress(k, u))).toBe(RING_COUNT - 1);
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
      for (const u of [RING_TRAVEL_FRAC + 0.02, 0.92, 0.95]) {
        const p = beatProgress(k, u);
        expect(frontCardIndex(ringRotationForProgress(p))).toBe(activeServiceForProgress(p));
      }
    }
  });

  it("clamps the active service to the roster through the exit-hold beat", () => {
    // Step 5 (the ADR-030 exit hold) must keep the LAST service active —
    // an unclamped step−1 would index past the roster and the stage
    // would wrap the readout back to the first service.
    expect(activeServiceForProgress(1)).toBe(RING_COUNT - 1);
    expect(activeServiceForProgress(beatProgress(RING_STEP_COUNT - 1, 0.5))).toBe(RING_COUNT - 1);
    expect(activeServiceForProgress(1.5)).toBe(RING_COUNT - 1);
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

describe("exitProgressForRunway — the decommission clock (ADR-030 Update 1)", () => {
  it("is 0 through every reading beat and 1 at the runway end", () => {
    expect(exitProgressForRunway(0)).toBe(0);
    expect(exitProgressForRunway((RING_STEP_COUNT - 1) / RING_STEP_COUNT)).toBe(0);
    expect(exitProgressForRunway(beatProgress(RING_STEP_COUNT - 2, 0.999))).toBe(0);
    expect(exitProgressForRunway(1)).toBe(1);
    expect(exitProgressForRunway(1.5)).toBe(1);
    expect(exitProgressForRunway(-0.5)).toBe(0);
  });

  it("rises linearly across the final beat", () => {
    const k = RING_STEP_COUNT - 1;
    expect(exitProgressForRunway(beatProgress(k, 0.25))).toBeCloseTo(0.25, 9);
    expect(exitProgressForRunway(beatProgress(k, 0.5))).toBeCloseTo(0.5, 9);
    expect(exitProgressForRunway(beatProgress(k, 0.75))).toBeCloseTo(0.75, 9);
  });

  it("is monotone and stepCount-parametrized (7-beat future-proof)", () => {
    let prev = -Infinity;
    for (let i = 0; i <= 1000; i++) {
      const v = exitProgressForRunway(i / 1000);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(exitProgressForRunway(6.5 / 7, 7)).toBeCloseTo(0.5, 9);
    expect(exitProgressForRunway(5.9 / 7, 7)).toBe(0);
  });
});

describe("exitEnvelope — staggered decommission (ADR-030 Update 1)", () => {
  it("is EXACT identity at exit = 0 for every card (pre-exit frames byte-identical)", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      const env = exitEnvelope(0, i);
      expect(env.opacity).toBe(1);
      expect(env.radiusMul).toBe(1);
    }
  });

  it("lands every card at opacity 0 / RING_EXIT_RADIUS_TO at exit = 1", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      const env = exitEnvelope(1, i);
      expect(env.opacity).toBeCloseTo(0, 12);
      expect(env.radiusMul).toBeCloseTo(RING_EXIT_RADIUS_TO, 12);
    }
  });

  it("fades monotonically out while the radius monotonically widens", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      let prevOpacity = Infinity;
      let prevRadius = -Infinity;
      for (let s = 0; s <= 100; s++) {
        const env = exitEnvelope(s / 100, i);
        expect(env.opacity).toBeLessThanOrEqual(prevOpacity);
        expect(env.radiusMul).toBeGreaterThanOrEqual(prevRadius);
        prevOpacity = env.opacity;
        prevRadius = env.radiusMul;
      }
    }
  });

  it("staggers index-ascending: the front (last) card leaves last", () => {
    const mid = 0.4;
    expect(exitEnvelope(mid, 0).opacity).toBeLessThan(exitEnvelope(mid, 3).opacity);
    // The last card's window closes at 0.9 — the tail stays clear for
    // the pill flight + the receding mark.
    expect(RING_EXIT_WINDOWS[RING_COUNT - 1][1]).toBeLessThanOrEqual(0.9);
    for (let i = 1; i < RING_COUNT; i++) {
      expect(RING_EXIT_WINDOWS[i][0]).toBeGreaterThan(RING_EXIT_WINDOWS[i - 1][0]);
    }
  });

  it("composes with the entrance as identity outside both windows", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      const entrance = entranceEnvelope(1, i);
      const exit = exitEnvelope(0, i);
      expect(entrance.opacity * exit.opacity).toBeCloseTo(entrance.opacity, 12);
      expect(entrance.radiusMul * exit.radiusMul).toBeCloseTo(entrance.radiusMul, 12);
    }
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

describe("frontPoseBias — parked front card holds a 3/4 pose (ADR-029 addendum)", () => {
  it("is zero outside the front window (side/back cards keep their pose)", () => {
    for (const nz of [-1, 0, RING_FRONT_BIAS_WINDOW[0]]) {
      const bias = frontPoseBias(nz);
      expect(bias.pitch).toBeCloseTo(0, 12);
      expect(bias.yaw).toBeCloseTo(0, 12);
    }
  });

  it("reaches the full constant bias at the parked front", () => {
    expect(frontPoseBias(RING_FRONT_BIAS_WINDOW[1]).yaw).toBeCloseTo(RING_FRONT_BIAS_YAW, 12);
    expect(frontPoseBias(RING_FRONT_BIAS_WINDOW[1]).pitch).toBeCloseTo(RING_FRONT_BIAS_PITCH, 12);
    expect(frontPoseBias(1).yaw).toBeCloseTo(RING_FRONT_BIAS_YAW, 12);
    expect(frontPoseBias(1).pitch).toBeCloseTo(RING_FRONT_BIAS_PITCH, 12);
  });

  it("ramps monotonically inside the window (scroll-owned, no snap)", () => {
    let prev = 0;
    for (let s = 0; s <= 40; s++) {
      const nz =
        RING_FRONT_BIAS_WINDOW[0] +
        (s / 40) * (RING_FRONT_BIAS_WINDOW[1] - RING_FRONT_BIAS_WINDOW[0]);
      const { yaw } = frontPoseBias(nz);
      expect(yaw).toBeGreaterThanOrEqual(prev);
      prev = yaw;
    }
    expect(prev).toBeCloseTo(RING_FRONT_BIAS_YAW, 12);
  });

  it("keeps the biased pose bounded well clear of edge-on", () => {
    // Held pose + max hover tilt must stay far from ±π/2 (legibility rule).
    const maxYaw = Math.abs(RING_FRONT_BIAS_YAW) + 0.2; // hover yaw amplitude
    expect(maxYaw).toBeLessThan(Math.PI / 6);
  });
});

describe("placeCardOnOrbit — cards riding their own tracks (Update 1)", () => {
  const NEUTRAL: CardOrbitGeometry = { radius: 1.55, tiltX: Math.PI / 2, tiltZ: 0, ecc: 1 };

  it("reduces bit-exactly to placeCard at neutral geometry", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      for (let s = 0; s <= 80; s++) {
        const rot = -Math.PI * 3 + (s / 80) * Math.PI * 6;
        const flat = placeCard(i, rot, { radius: NEUTRAL.radius });
        const orbit = placeCardOnOrbit(i, rot, NEUTRAL);
        expect(orbit.x).toBeCloseTo(flat.x, 12);
        expect(orbit.y).toBeCloseTo(flat.y, 12);
        expect(orbit.z).toBeCloseTo(flat.z, 12);
        expect(orbit.rotY).toBeCloseTo(flat.rotY, 12);
        expect(orbit.nz).toBeCloseTo(flat.nz, 12);
      }
    }
  });

  it("lands each front card near dead-center within tilt bounds", () => {
    RING_CARD_ORBIT_GEOMETRY.forEach((geom, k) => {
      const placed = placeCardOnOrbit(k, -k * RING_QUARTER, geom);
      // Parametric depth is EXACT at the beat — the depth-write gate and
      // the ring↔step lockstep stay orbit-independent.
      expect(placed.nz).toBeCloseTo(1, 12);
      expect(Math.abs(placed.x)).toBeLessThanOrEqual(
        geom.radius * Math.abs(geom.tiltZ) * 1.05 + 1e-9
      );
      expect(Math.abs(placed.y - RING_Y_OFFSET)).toBeLessThanOrEqual(
        geom.radius * (Math.abs(geom.tiltX - Math.PI / 2) + Math.abs(geom.tiltZ)) * 1.05 + 1e-9
      );
    });
  });

  it("keeps every sample exactly on its tilted ellipse (pins the Euler order)", () => {
    const geom = RING_CARD_ORBIT_GEOMETRY[3];
    for (let s = 0; s <= 200; s++) {
      const rot = (s / 200) * Math.PI * 4 - Math.PI * 2;
      const placed = placeCardOnOrbit(3, rot, geom);
      const y0 = placed.y - RING_Y_OFFSET;
      // Invert the forward rotation: Rx(−tiltX) first, then Rz(−tiltZ).
      const y1 = y0 * Math.cos(geom.tiltX) + placed.z * Math.sin(geom.tiltX);
      const z1 = -y0 * Math.sin(geom.tiltX) + placed.z * Math.cos(geom.tiltX);
      const ex = placed.x * Math.cos(geom.tiltZ) + y1 * Math.sin(geom.tiltZ);
      const ey = -placed.x * Math.sin(geom.tiltZ) + y1 * Math.cos(geom.tiltZ);
      expect(z1).toBeCloseTo(0, 10);
      expect((ex / geom.radius) ** 2 + (ey / (geom.radius * geom.ecc)) ** 2).toBeCloseTo(1, 10);
    }
  });

  it("moves continuously with rotation and keeps nz in [−1, 1]", () => {
    const geom = RING_CARD_ORBIT_GEOMETRY[0];
    let prev = placeCardOnOrbit(0, -Math.PI * 2, geom);
    for (let s = 1; s <= 800; s++) {
      const rot = -Math.PI * 2 + (s / 800) * Math.PI * 4;
      const placed = placeCardOnOrbit(0, rot, geom);
      const step = Math.hypot(placed.x - prev.x, placed.y - prev.y, placed.z - prev.z);
      expect(step).toBeLessThan(0.05);
      expect(placed.nz).toBeGreaterThanOrEqual(-1);
      expect(placed.nz).toBeLessThanOrEqual(1);
      prev = placed;
    }
  });

  it("radiusMul scales the orbit position exactly (entrance fly-in)", () => {
    const geom = RING_CARD_ORBIT_GEOMETRY[1];
    const base = placeCardOnOrbit(1, 0.4, geom, { yOffset: 0 });
    const flown = placeCardOnOrbit(1, 0.4, geom, {
      yOffset: 0,
      radiusMul: RING_ENTRANCE_RADIUS_FROM,
    });
    expect(flown.x).toBeCloseTo(base.x * RING_ENTRANCE_RADIUS_FROM, 12);
    expect(flown.y).toBeCloseTo(base.y * RING_ENTRANCE_RADIUS_FROM, 12);
    expect(flown.z).toBeCloseTo(base.z * RING_ENTRANCE_RADIUS_FROM, 12);
  });
});

describe("buildCardOrbitGeometries", () => {
  it("returns four tracks; spread 0 collapses radii; tiltAmp 0 flattens", () => {
    expect(RING_CARD_ORBIT_GEOMETRY).toHaveLength(RING_COUNT);
    for (const geom of buildCardOrbitGeometries(1.3, 0, 0)) {
      expect(geom.radius).toBeCloseTo(1.3, 12);
      expect(geom.tiltX).toBeCloseTo(Math.PI / 2, 12);
      expect(geom.tiltZ).toBeCloseTo(0, 12);
    }
    const radii = buildCardOrbitGeometries(1.3, 0.12, 0.06).map((geom) => geom.radius);
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]).toBeGreaterThan(radii[i - 1]);
    }
    expect(Math.min(...radii)).toBeCloseTo(1.18, 12);
    expect(Math.max(...radii)).toBeCloseTo(1.42, 12);
  });
});

describe("depthOpacity window (Update 1)", () => {
  it("lifts the side cards while the back card stays pinned at the floor", () => {
    const oldWindow: readonly [number, number] = [-0.55, 0.85];
    expect(depthOpacity(0)).toBeGreaterThan(depthOpacity(0, RING_OPACITY_RANGE, oldWindow));
    expect(depthOpacity(-1)).toBeCloseTo(RING_OPACITY_RANGE[0], 12);
    expect(depthOpacity(RING_OPACITY_WINDOW[1])).toBeCloseTo(RING_OPACITY_RANGE[1], 12);
    expect(depthOpacity(1)).toBeCloseTo(RING_OPACITY_RANGE[1], 12);
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
      // Parked fully off-frame along its entrance direction before the window.
      const dir = RING_ENTRANCE_DIRECTIONS[i];
      expect(before.offsetX).toBeCloseTo(dir[0] * RING_ENTRANCE_OFFSET, 12);
      expect(before.offsetY).toBeCloseTo(dir[1] * RING_ENTRANCE_OFFSET, 12);
      const after = entranceEnvelope(1, i);
      expect(after.opacity).toBe(1);
      expect(after.radiusMul).toBeCloseTo(1, 12);
      // Settled: no residual slide, so the parked pose is byte-identical.
      expect(after.offsetX).toBeCloseTo(0, 12);
      expect(after.offsetY).toBeCloseTo(0, 12);
    }
  });

  it("opacity leads the travel — solid before the slide finishes", () => {
    for (let i = 0; i < RING_COUNT; i++) {
      const window = RING_ENTRANCE_WINDOWS[i];
      // At the opacity-lead point the card is fully lit but still off its slot.
      const mid = lerp(window[0], window[1], RING_ENTRANCE_OPACITY_LEAD);
      const env = entranceEnvelope(mid, i);
      expect(env.opacity).toBeCloseTo(1, 6);
      const stillTravelling = Math.hypot(env.offsetX, env.offsetY);
      expect(stillTravelling).toBeGreaterThan(0);
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
