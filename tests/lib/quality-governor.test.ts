import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { reportFrameSample, resetFrameSampler, useQualityStore } from "@/lib/hooks/useQualityTier";

/**
 * Quality governor ladder (ADR-038). Locks the two invariants that make
 * the governor safe: the degradation ladder is MONOTONIC (DPR first, then
 * counts, never up), and sustained slow frames step it down while fast
 * frames never do.
 */

function resetStore() {
  useQualityStore.setState({ dprCeiling: 1.75, countMultiplier: 1, probed: false });
  resetFrameSampler();
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

  it("never steps up (monotonic)", () => {
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
});
