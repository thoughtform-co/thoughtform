import { describe, expect, it } from "vitest";

import {
  VOIDWALKER_HOLOGRAM_ENTER_WINDOW,
  VOIDWALKER_HOLOGRAM_EXIT_WINDOW,
  voidwalkerHologramEnterT,
  voidwalkerHologramExitT,
} from "@/lib/voidwalker/voidwalkerHologramClock";

describe("Voidwalker hologram scroll clock", () => {
  it("clamps and lands exactly on both window endpoints", () => {
    expect(voidwalkerHologramEnterT(-1)).toBe(0);
    expect(voidwalkerHologramEnterT(VOIDWALKER_HOLOGRAM_ENTER_WINDOW[0])).toBe(0);
    expect(voidwalkerHologramEnterT(VOIDWALKER_HOLOGRAM_ENTER_WINDOW[1])).toBe(1);
    expect(voidwalkerHologramEnterT(2)).toBe(1);

    expect(voidwalkerHologramExitT(-1)).toBe(0);
    expect(voidwalkerHologramExitT(VOIDWALKER_HOLOGRAM_EXIT_WINDOW[0])).toBe(0);
    expect(voidwalkerHologramExitT(VOIDWALKER_HOLOGRAM_EXIT_WINDOW[1])).toBe(1);
    expect(voidwalkerHologramExitT(2)).toBe(1);
  });

  it("finishes entry before exit starts, leaving a stable reading hold", () => {
    expect(VOIDWALKER_HOLOGRAM_ENTER_WINDOW[1]).toBeLessThan(VOIDWALKER_HOLOGRAM_EXIT_WINDOW[0]);
    expect(voidwalkerHologramEnterT(0.5)).toBe(1);
    expect(voidwalkerHologramExitT(0.5)).toBe(0);
  });

  it("is monotonic in both envelopes", () => {
    let previousEnter = -1;
    let previousExit = -1;
    for (let i = 0; i <= 100; i += 1) {
      const p = i / 100;
      const enter = voidwalkerHologramEnterT(p);
      const exit = voidwalkerHologramExitT(p);
      expect(enter).toBeGreaterThanOrEqual(previousEnter);
      expect(exit).toBeGreaterThanOrEqual(previousExit);
      previousEnter = enter;
      previousExit = exit;
    }
  });

  it("has no direction latch: the same progress always gives the same pose", () => {
    const samples = [0, 0.04, 0.11, 0.22, 0.5, 0.74, 0.85, 0.96, 1];
    const forward = samples.map((p) => [voidwalkerHologramEnterT(p), voidwalkerHologramExitT(p)]);
    const reverse = [...samples]
      .reverse()
      .map((p) => [voidwalkerHologramEnterT(p), voidwalkerHologramExitT(p)])
      .reverse();
    expect(reverse).toEqual(forward);
  });
});
