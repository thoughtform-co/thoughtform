import { describe, expect, it } from "vitest";

import {
  PDA_WHEEL_REST,
  WHEEL_GESTURE_GAP_MS,
  WHEEL_STEP_LOCKOUT_MS,
  WHEEL_STEP_THRESHOLD,
  normalizeWheelDelta,
  pdaWheelStep,
  type PdaWheelState,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaWheel";
import type { PdaView } from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";

/**
 * THE MAP'S WHEEL (ADR-063).
 *
 * The release is the case that matters: this beat is scroll-pinned, so an
 * instrument that captures the wheel at its last reading is a trap on the
 * whole page. Everything else here is comfort tuning.
 */

/** Feed a run of events, returning the readings visited and every capture. */
function run(
  events: readonly { dy: number; at: number }[],
  startView: PdaView = 1,
  startState: PdaWheelState = PDA_WHEEL_REST
) {
  let view = startView;
  let state = startState;
  const steps: PdaView[] = [];
  const captures: boolean[] = [];
  for (const e of events) {
    const r = pdaWheelStep(state, { deltaY: e.dy, deltaMode: 0, at: e.at, view });
    state = r.state;
    captures.push(r.capture);
    if (r.next) {
      view = r.next;
      steps.push(r.next);
    }
  }
  return { view, state, steps, captures };
}

describe("normalizeWheelDelta", () => {
  it("passes pixel deltas through", () => {
    expect(normalizeWheelDelta(120, 0)).toBe(120);
  });

  it("scales line and page deltas into pixels", () => {
    // A 3-line notch is a step; raw, it would be 3px and never reach the
    // threshold — the mouse that reports lines would simply not work.
    expect(normalizeWheelDelta(3, 1)).toBeGreaterThanOrEqual(WHEEL_STEP_THRESHOLD / 2);
    expect(normalizeWheelDelta(1, 2, 900)).toBe(900);
  });
});

describe("pdaWheelStep — the release", () => {
  it("hands the wheel back at the last reading going down", () => {
    const r = pdaWheelStep(PDA_WHEEL_REST, { deltaY: 400, deltaMode: 0, at: 1000, view: 3 });
    expect(r.capture).toBe(false);
    expect(r.next).toBeNull();
  });

  it("hands the wheel back at the first reading going up", () => {
    const r = pdaWheelStep(PDA_WHEEL_REST, { deltaY: -400, deltaMode: 0, at: 1000, view: 1 });
    expect(r.capture).toBe(false);
    expect(r.next).toBeNull();
  });

  it("still captures at an end when travel is INTO the readings", () => {
    expect(
      pdaWheelStep(PDA_WHEEL_REST, { deltaY: -120, deltaMode: 0, at: 1000, view: 3 }).capture
    ).toBe(true);
    expect(
      pdaWheelStep(PDA_WHEEL_REST, { deltaY: 120, deltaMode: 0, at: 1000, view: 1 }).capture
    ).toBe(true);
  });

  it("never leaves a run-up behind when it releases", () => {
    // Half a gesture down at reading 2, then the reader arrives at 3 and
    // keeps going: the release must not carry the earlier accumulation.
    const a = pdaWheelStep(PDA_WHEEL_REST, { deltaY: 60, deltaMode: 0, at: 1000, view: 2 });
    const b = pdaWheelStep(a.state, { deltaY: 60, deltaMode: 0, at: 1020, view: 3 });
    expect(b.capture).toBe(false);
    expect(b.state.acc).toBe(0);
  });

  it("ignores a purely horizontal gesture", () => {
    const r = pdaWheelStep(PDA_WHEEL_REST, { deltaY: 0, deltaMode: 0, at: 1000, view: 2 });
    expect(r.capture).toBe(false);
    expect(r.next).toBeNull();
  });
});

describe("pdaWheelStep — one step per gesture", () => {
  it("steps once on a mouse notch", () => {
    const { steps, view } = run([{ dy: 120, at: 1000 }]);
    expect(steps).toEqual([2]);
    expect(view).toBe(2);
  });

  it("does not step before the threshold", () => {
    const { steps, captures } = run([
      { dy: 20, at: 1000 },
      { dy: 20, at: 1016 },
      { dy: 20, at: 1032 },
    ]);
    expect(steps).toEqual([]);
    // ...but the page must not move either, or the beat scrolls under the
    // reader while the instrument is deciding.
    expect(captures.every(Boolean)).toBe(true);
  });

  it("accumulates a trackpad swipe into exactly one step", () => {
    const events = Array.from({ length: 12 }, (_, i) => ({ dy: 14, at: 1000 + i * 16 }));
    const { steps } = run(events);
    expect(steps).toEqual([2]);
  });

  it("holds the whole fling inside the lockout", () => {
    // 60 frames of momentum at 12px — 720px of scroll — must not walk past
    // one reading, and must stay captured throughout.
    const events = Array.from({ length: 60 }, (_, i) => ({ dy: 12, at: 1000 + i * 8 }));
    const { steps, captures } = run(events);
    expect(steps).toEqual([2]);
    expect(captures.every(Boolean)).toBe(true);
  });

  it("steps again once the lockout has passed", () => {
    const events = [
      { dy: 120, at: 1000 },
      { dy: 120, at: 1000 + WHEEL_STEP_LOCKOUT_MS + 20 },
    ];
    const { steps, view } = run(events);
    expect(steps).toEqual([2, 3]);
    expect(view).toBe(3);
  });

  it("reaches the last reading and then releases", () => {
    const events = [
      { dy: 120, at: 1000 },
      { dy: 120, at: 1000 + (WHEEL_STEP_LOCKOUT_MS + 20) },
      { dy: 120, at: 1000 + (WHEEL_STEP_LOCKOUT_MS + 20) * 2 },
    ];
    const { steps, view, captures } = run(events);
    expect(steps).toEqual([2, 3]);
    expect(view).toBe(3);
    expect(captures).toEqual([true, true, false]);
  });
});

describe("pdaWheelStep — direction", () => {
  it("reverses without paying off the opposite run-up", () => {
    // Most of a downward gesture, then a reversal: the upward step must land
    // on its own threshold, not on the leftover 80px.
    const a = pdaWheelStep(PDA_WHEEL_REST, { deltaY: 80, deltaMode: 0, at: 1000, view: 2 });
    expect(a.next).toBeNull();
    const b = pdaWheelStep(a.state, { deltaY: -40, deltaMode: 0, at: 1016, view: 2 });
    expect(b.next).toBeNull();
    expect(b.state.acc).toBe(-40);
    const c = pdaWheelStep(b.state, { deltaY: -60, deltaMode: 0, at: 1032, view: 2 });
    expect(c.next).toBe(1);
  });

  it("empties the accumulator across a gesture gap", () => {
    const a = pdaWheelStep(PDA_WHEEL_REST, { deltaY: 80, deltaMode: 0, at: 1000, view: 1 });
    expect(a.next).toBeNull();
    const b = pdaWheelStep(a.state, {
      deltaY: 40,
      deltaMode: 0,
      at: 1000 + WHEEL_GESTURE_GAP_MS + 20,
      view: 1,
    });
    expect(b.next).toBeNull();
    expect(b.state.acc).toBe(40);
  });

  it("walks up the readings the same way it walked down", () => {
    const events = [
      { dy: -120, at: 5000 },
      { dy: -120, at: 5000 + (WHEEL_STEP_LOCKOUT_MS + 20) },
    ];
    const { steps, view } = run(events, 3);
    expect(steps).toEqual([2, 1]);
    expect(view).toBe(1);
  });
});
