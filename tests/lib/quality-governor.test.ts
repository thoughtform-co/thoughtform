import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { reportFrameSample, resetFrameSampler, useQualityStore } from "@/lib/hooks/useQualityTier";

/**
 * Quality governor ladder (ADR-038 + rev 2 recovery). Locks the
 * invariants that make the governor safe: the DOWN ladder is DPR-first
 * then counts; sustained slow frames step it down and fast frames never
 * do; and recovery climbs back up in reverse, clamped to the opening
 * budget, with a per-rung lock so a bad step-up is never retried.
 */

function resetStore() {
  useQualityStore.setState({
    dprCeiling: 1.75,
    countMultiplier: 1,
    maxDprCeiling: 1.75,
    maxCountMultiplier: 1,
    probed: false,
  });
  resetFrameSampler();
}

function pick(): [number, number] {
  const s = useQualityStore.getState();
  return [s.dprCeiling, s.countMultiplier];
}

describe("quality governor — degrade() ladder", () => {
  beforeEach(resetStore);

  it("walks DPR down first (1.75 → 1.25 → 1.0), then counts (1.0 → 0.6 → 0.35), then stops", () => {
    const { degrade } = useQualityStore.getState();
    const rungs: Array<[number, number]> = [];
    for (let i = 0; i < 6; i++) {
      degrade();
      const s = useQualityStore.getState();
      rungs.push([s.dprCeiling, s.countMultiplier]);
    }
    expect(rungs).toEqual([
      [1.25, 1], // DPR step 1
      [1.0, 1], // DPR step 2
      [1.0, 0.6], // count step 1
      [1.0, 0.35], // count step 2
      [1.0, 0.35], // bottom — no-op
      [1.0, 0.35], // still bottom
    ]);
  });

  it("degrade() alone never steps up", () => {
    const { degrade } = useQualityStore.getState();
    let prevDpr = useQualityStore.getState().dprCeiling;
    let prevCount = useQualityStore.getState().countMultiplier;
    for (let i = 0; i < 6; i++) {
      degrade();
      const s = useQualityStore.getState();
      expect(s.dprCeiling).toBeLessThanOrEqual(prevDpr);
      expect(s.countMultiplier).toBeLessThanOrEqual(prevCount);
      prevDpr = s.dprCeiling;
      prevCount = s.countMultiplier;
    }
  });
});

describe("quality governor — recover() ladder (rev 2)", () => {
  beforeEach(resetStore);

  it("climbs counts back first, then DPR, up to the opening budget", () => {
    const { degrade, recover } = useQualityStore.getState();
    for (let i = 0; i < 4; i++) degrade(); // → [1.0, 0.35] (bottom)
    expect(pick()).toEqual([1.0, 0.35]);
    const rungs: Array<[number, number]> = [];
    for (let i = 0; i < 5; i++) {
      recover();
      rungs.push(pick());
    }
    expect(rungs).toEqual([
      [1.0, 0.6], // count up
      [1.0, 1], // count up
      [1.25, 1], // dpr up
      [1.75, 1], // dpr up (opening budget)
      [1.75, 1], // top — no-op
    ]);
  });

  it("never climbs above the opening budget (low-GPU probe cap)", () => {
    // Opened low (1.25 / 0.6) then bottomed out.
    useQualityStore.setState({
      dprCeiling: 1.0,
      countMultiplier: 0.35,
      maxDprCeiling: 1.25,
      maxCountMultiplier: 0.6,
    });
    const { recover } = useQualityStore.getState();
    for (let i = 0; i < 6; i++) recover();
    expect(pick()).toEqual([1.25, 0.6]);
  });

  it("locks a rung when a degrade is flagged as caused by the step-up", () => {
    useQualityStore.setState({ dprCeiling: 1.25 });
    const { recover, degrade } = useQualityStore.getState();
    recover(); // 1.25 → 1.75
    expect(useQualityStore.getState().dprCeiling).toBe(1.75);
    degrade(true); // step-up unsustainable → back to 1.25 AND lock the ceiling
    expect(useQualityStore.getState().dprCeiling).toBe(1.25);
    expect(useQualityStore.getState().maxDprCeiling).toBe(1.25);
    // Recovery can no longer climb past the locked ceiling.
    recover();
    expect(useQualityStore.getState().dprCeiling).toBe(1.25);
  });
});

describe("quality governor — frame sampler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does NOT degrade on fast (60fps) frames", () => {
    vi.advanceTimersByTime(2000); // clear the engage cooldown
    for (let i = 0; i < 300; i++) {
      reportFrameSample(1 / 60); // ~16.7 ms
      vi.advanceTimersByTime(17);
    }
    expect(useQualityStore.getState().dprCeiling).toBe(1.75);
    expect(useQualityStore.getState().countMultiplier).toBe(1);
  });

  it("steps down once after sustained slow (~30 ms) frames past the sustain window", () => {
    vi.advanceTimersByTime(2000); // clear the engage cooldown
    // ~30 ms/frame for well over the 1200 ms sustain window.
    for (let i = 0; i < 80; i++) {
      reportFrameSample(0.03);
      vi.advanceTimersByTime(30);
    }
    // First lever is DPR; it must have dropped from the 1.75 ceiling.
    expect(useQualityStore.getState().dprCeiling).toBeLessThan(1.75);
  });

  it("climbs back up after the dive, once frames are sustained-fast (recovery)", () => {
    vi.advanceTimersByTime(2000); // clear the engage cooldown
    // The heavy dive: sustained slow frames drop at least one rung.
    for (let i = 0; i < 80; i++) {
      reportFrameSample(0.03);
      vi.advanceTimersByTime(30);
    }
    const degraded = useQualityStore.getState().dprCeiling;
    expect(degraded).toBeLessThan(1.75);
    // Settle into the calm parked state: comfortably-fast (~120fps) frames
    // for long enough to clear the step-down cooldown AND the recover
    // sustain window (+ a second recover pass).
    for (let i = 0; i < 1400; i++) {
      reportFrameSample(1 / 120); // ~8.3 ms, below FAST_MS
      vi.advanceTimersByTime(9);
    }
    // Recovered above the degraded rung (back toward the opening budget).
    expect(useQualityStore.getState().dprCeiling).toBeGreaterThan(degraded);
  });
});
