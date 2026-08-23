import { describe, expect, it } from "vitest";

import {
  VW_BEAT_WINDOW,
  VW_HEAD_ARM,
  VW_HEAD_HYSTERESIS_PX,
  VW_READ_LINE,
  beatProgress,
  beatsPassed,
  headArmed,
  readLineY,
  spineProgress,
} from "@/lib/voidwalker/voidwalkerClock";

/**
 * The VOIDWALKER clock, pinned (ADR-074). Pure functions of the scroll and
 * the measured layout — no frame remembers another, which is what makes
 * the section reversible under scroll by construction.
 */

describe("voidwalker clock — the reading line", () => {
  it("rides 40% down the viewport", () => {
    expect(VW_READ_LINE).toBe(0.4);
    expect(readLineY(1000, 720)).toBe(1000 + 288);
  });

  it("a beat lights exactly as its marker crosses the line, over one window", () => {
    const vh = 720;
    const win = vh * VW_BEAT_WINDOW;
    const marker = 5000;
    // A window below the line: dark.
    expect(beatProgress(marker - win, marker, win)).toBeCloseTo(0, 9);
    expect(beatProgress(marker - 2 * win, marker, win)).toBe(0);
    // Half a window below: half lit.
    expect(beatProgress(marker - win / 2, marker, win)).toBeCloseTo(0.5, 9);
    // On the line and past it: lit, and it stays lit.
    expect(beatProgress(marker, marker, win)).toBe(1);
    expect(beatProgress(marker + 900, marker, win)).toBe(1);
  });

  it("is monotone in the scroll", () => {
    const win = 200;
    let prev = -1;
    for (let y = 0; y <= 2000; y += 7) {
      const b = beatProgress(y, 1000, win);
      expect(b).toBeGreaterThanOrEqual(prev);
      prev = b;
    }
  });

  it("degrades to a step when the window is zero", () => {
    expect(beatProgress(999, 1000, 0)).toBe(0);
    expect(beatProgress(1000, 1000, 0)).toBe(1);
  });
});

describe("voidwalker clock — the spine", () => {
  it("draws from 0 at its top to 1 at its bottom and clamps outside", () => {
    expect(spineProgress(-50, 0, 1000)).toBe(0);
    expect(spineProgress(0, 0, 1000)).toBe(0);
    expect(spineProgress(250, 0, 1000)).toBe(0.25);
    expect(spineProgress(1000, 0, 1000)).toBe(1);
    expect(spineProgress(1500, 0, 1000)).toBe(1);
    expect(spineProgress(10, 0, 0)).toBe(0);
  });

  it("the tip reaches a marker exactly as that beat lights", () => {
    const spineTop = 400;
    const spineH = 3000;
    const marker = 1600;
    const win = 180;
    const lineY = marker; // the scroll at which the beat is fully lit
    expect(beatProgress(lineY, marker, win)).toBe(1);
    expect(spineProgress(lineY, spineTop, spineH)).toBeCloseTo((marker - spineTop) / spineH, 9);
  });

  it("counts the markers the line has passed", () => {
    const markers = [100, 200, 300, 400];
    expect(beatsPassed(50, markers)).toBe(0);
    expect(beatsPassed(200, markers)).toBe(2);
    expect(beatsPassed(999, markers)).toBe(4);
  });
});

describe("voidwalker clock — the masthead arm", () => {
  const vh = 720;
  const headTop = 3000;
  const armAt = headTop - vh * VW_HEAD_ARM; // scrollY where the arm line meets the head

  it("arms past the head with hysteresis and holds in between", () => {
    expect(headArmed(false, armAt - 1, vh, headTop)).toBe(false);
    // Inside the band: holds whatever it was.
    expect(headArmed(false, armAt + 10, vh, headTop)).toBe(false);
    expect(headArmed(true, armAt + 10, vh, headTop)).toBe(true);
    // Past the band: armed regardless.
    expect(headArmed(false, armAt + VW_HEAD_HYSTERESIS_PX, vh, headTop)).toBe(true);
    // Back above the band: disarmed regardless.
    expect(headArmed(true, armAt - VW_HEAD_HYSTERESIS_PX - 1, vh, headTop)).toBe(false);
  });

  it("does not churn on a reader resting at the threshold", () => {
    let armed = false;
    const flips: boolean[] = [];
    for (const y of [
      armAt - 5,
      armAt + 5,
      armAt - 5,
      armAt + 5,
      armAt + 40,
      armAt + 5,
      armAt - 5,
    ]) {
      const next = headArmed(armed, y, vh, headTop);
      if (next !== armed) flips.push(next);
      armed = next;
    }
    // Exactly one arm (at +40) and nothing else — the ±5 wobble is inside
    // the band on both sides.
    expect(flips).toEqual([true]);
  });
});
