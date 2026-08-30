import { describe, expect, it } from "vitest";

import {
  VOIDWALKER_ERA_BAND,
  VOIDWALKER_ERA_HYSTERESIS,
  VOIDWALKER_HOLOGRAM_ENTER_WINDOW,
  VOIDWALKER_HOLOGRAM_EXIT_WINDOW,
  voidwalkerEraFromProgress,
  voidwalkerProgressForEra,
} from "@/lib/voidwalker/voidwalkerHologramClock";

const COUNT = 5;

describe("the era band", () => {
  it("sits inside the hold, clear of both clocks", () => {
    // ⚠ The whole point: an era may never advance while the stage is still
    // assembling or already clearing.
    expect(VOIDWALKER_ERA_BAND[0]).toBeGreaterThan(VOIDWALKER_HOLOGRAM_ENTER_WINDOW[1]);
    expect(VOIDWALKER_ERA_BAND[1]).toBeLessThan(VOIDWALKER_HOLOGRAM_EXIT_WINDOW[0]);
  });

  it("walks every era in order across the band, and only forward", () => {
    const seen: number[] = [];
    let current = 0;
    for (let i = 0; i <= 400; i += 1) {
      current = voidwalkerEraFromProgress(i / 400, COUNT, current);
      if (seen[seen.length - 1] !== current) seen.push(current);
    }
    expect(seen).toEqual([0, 1, 2, 3, 4]);
  });

  it("reverses cleanly back to the first era", () => {
    let current = 4;
    const seen: number[] = [4];
    for (let i = 400; i >= 0; i -= 1) {
      current = voidwalkerEraFromProgress(i / 400, COUNT, current);
      if (seen[seen.length - 1] !== current) seen.push(current);
    }
    expect(seen).toEqual([4, 3, 2, 1, 0]);
  });

  it("holds its era at a slice boundary rather than flickering", () => {
    // Exactly on the 0|1 boundary, from either side, nothing moves.
    const [lo, hi] = VOIDWALKER_ERA_BAND;
    const boundary = lo + ((hi - lo) / COUNT) * 1;
    expect(voidwalkerEraFromProgress(boundary, COUNT, 0)).toBe(0);
    expect(voidwalkerEraFromProgress(boundary - 1e-6, COUNT, 1)).toBe(1);
    // ...and a jitter smaller than the hysteresis cannot flip it either way
    const jitter = ((hi - lo) / COUNT) * (VOIDWALKER_ERA_HYSTERESIS * 0.5);
    expect(voidwalkerEraFromProgress(boundary + jitter, COUNT, 0)).toBe(0);
    expect(voidwalkerEraFromProgress(boundary - jitter, COUNT, 1)).toBe(1);
  });

  it("clamps outside the band instead of running past the roster", () => {
    expect(voidwalkerEraFromProgress(0, COUNT, 3)).toBe(0);
    expect(voidwalkerEraFromProgress(1, COUNT, 3)).toBe(COUNT - 1);
    expect(voidwalkerEraFromProgress(-5, COUNT, 3)).toBe(0);
    expect(voidwalkerEraFromProgress(5, COUNT, 3)).toBe(COUNT - 1);
  });

  it("round-trips: the progress a click pins resolves back to that era", () => {
    // ⚠ This is the contract that stops the spy overriding a click one frame
    // later. It must hold from ANY prior era, not just the neighbouring one.
    for (let target = 0; target < COUNT; target += 1) {
      const p = voidwalkerProgressForEra(target, COUNT);
      for (let from = 0; from < COUNT; from += 1) {
        expect(voidwalkerEraFromProgress(p, COUNT, from)).toBe(target);
      }
    }
  });

  it("seats each era at its slice centre, in order, inside the band", () => {
    const seats = Array.from({ length: COUNT }, (_, i) => voidwalkerProgressForEra(i, COUNT));
    for (let i = 1; i < seats.length; i += 1) {
      expect(seats[i]).toBeGreaterThan(seats[i - 1]);
    }
    expect(seats[0]).toBeGreaterThan(VOIDWALKER_ERA_BAND[0]);
    expect(seats[COUNT - 1]).toBeLessThan(VOIDWALKER_ERA_BAND[1]);
  });

  it("degenerates safely on a single-era roster", () => {
    expect(voidwalkerEraFromProgress(0.5, 1, 0)).toBe(0);
    expect(voidwalkerProgressForEra(0, 1)).toBe(VOIDWALKER_ERA_BAND[0]);
  });
});
