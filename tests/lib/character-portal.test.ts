import { afterEach, describe, expect, it } from "vitest";

import {
  ABOUT_EXIT_PORTAL_WINDOW,
  ABOUT_EXIT_WINDOW,
  aboutExitPortalT,
  aboutExitT,
} from "@/lib/services-ring/aboutDeckMath";
import {
  __resetCharacterStagePortalForTests,
  getCharacterStagePortalState,
  setCharacterStagePortalActive,
  setCharacterStagePortalProgress,
} from "@/lib/voidwalker/characterStagePortalRef";

/**
 * ADR-082 — the About → character-stage portal envelope.
 *
 * The portal envelope shares its window with `aboutExitT` deliberately
 * (same clock, different transform target: exit slides RIGHT, portal
 * flies to CENTRE). The two are the SAME function of `aboutP`; only
 * the consumer differs.
 */

afterEach(() => __resetCharacterStagePortalForTests());

describe("aboutExitPortalT — the portal envelope", () => {
  it("shares its window with the exit slide", () => {
    expect(ABOUT_EXIT_PORTAL_WINDOW).toEqual(ABOUT_EXIT_WINDOW);
  });

  it("is 0 through the reading hold", () => {
    for (const p of [0, 0.2, 0.5, 0.7, 0.73]) {
      expect(aboutExitPortalT(p)).toBe(0);
    }
  });

  it("reaches 1 by the runway tail", () => {
    expect(aboutExitPortalT(0.96)).toBeCloseTo(1, 10);
    expect(aboutExitPortalT(1)).toBeCloseTo(1, 10);
  });

  it("rises monotonically inside its window", () => {
    let prev = -1;
    for (let i = 0; i <= 40; i++) {
      const v = aboutExitPortalT(i / 40);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it("equals aboutExitT at every sample", () => {
    // The two functions run the SAME smootherstep on the SAME window.
    for (let i = 0; i <= 100; i++) {
      const p = i / 100;
      expect(aboutExitPortalT(p)).toBeCloseTo(aboutExitT(p), 10);
    }
  });
});

describe("characterStagePortalRef — the receiver bus", () => {
  it("starts inert (progress 0, active false)", () => {
    const s = getCharacterStagePortalState();
    expect(s.progress).toBe(0);
    expect(s.active).toBe(false);
  });

  it("clamps progress into [0, 1]", () => {
    setCharacterStagePortalProgress(-0.2);
    expect(getCharacterStagePortalState().progress).toBe(0);
    setCharacterStagePortalProgress(1.4);
    expect(getCharacterStagePortalState().progress).toBe(1);
    setCharacterStagePortalProgress(0.42);
    expect(getCharacterStagePortalState().progress).toBe(0.42);
  });

  it("clears progress when deactivated", () => {
    setCharacterStagePortalActive(true);
    setCharacterStagePortalProgress(0.6);
    setCharacterStagePortalActive(false);
    const s = getCharacterStagePortalState();
    expect(s.active).toBe(false);
    expect(s.progress).toBe(0);
  });
});
