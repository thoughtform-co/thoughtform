import { describe, expect, it } from "vitest";

import { FIXED_DT, MAX_FRAME_S, MAX_STEPS, stepLoop } from "@/lib/latent-flight/engine/loop";

describe("latent-flight loop", () => {
  it("runs one fixed step per 1/60 s and returns the remainder as alpha", () => {
    const steps: number[] = [];
    const r = stepLoop(0, FIXED_DT * 1.5, (dt) => steps.push(dt));
    expect(steps).toEqual([FIXED_DT]);
    expect(r.steps).toBe(1);
    expect(r.acc).toBeCloseTo(FIXED_DT * 0.5, 9);
    expect(r.alpha).toBeCloseTo(0.5, 9);
  });

  it("carries the accumulator across frames", () => {
    let acc = 0;
    let total = 0;
    for (let i = 0; i < 10; i++) {
      const r = stepLoop(acc, 0.01, () => total++);
      acc = r.acc;
    }
    // 0.1 s of frames at 1/60 → 6 whole steps.
    expect(total).toBe(6);
    expect(acc).toBeGreaterThanOrEqual(0);
    expect(acc).toBeLessThan(FIXED_DT);
  });

  it("caps at MAX_STEPS and drops the debt (a hidden tab returns a huge delta)", () => {
    let n = 0;
    const r = stepLoop(0, 5, () => n++);
    expect(n).toBe(MAX_STEPS);
    expect(r.steps).toBe(MAX_STEPS);
    expect(r.acc).toBe(0);
    expect(r.alpha).toBe(0);
  });

  it("clamps the frame delta to MAX_FRAME_S before stepping", () => {
    let n = 0;
    stepLoop(0, 100, () => n++);
    expect(n).toBeLessThanOrEqual(Math.min(MAX_STEPS, Math.floor(MAX_FRAME_S / FIXED_DT)));
  });

  it("keeps alpha in [0, 1) and never steps on a non-finite delta", () => {
    let n = 0;
    const r = stepLoop(0, Number.NaN, () => n++);
    expect(n).toBe(0);
    expect(r.alpha).toBeGreaterThanOrEqual(0);
    expect(r.alpha).toBeLessThan(1);
    const r2 = stepLoop(0, -1, () => n++);
    expect(n).toBe(0);
    expect(r2.steps).toBe(0);
  });
});
