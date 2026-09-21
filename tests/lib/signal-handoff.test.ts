import { describe, expect, it } from "vitest";

import {
  SIGNAL_FRAME_WINDOW,
  SIGNAL_HANDOFF_GAP_PX,
  SIGNAL_HANDOFF_SPAN_VH,
  SIGNAL_KILL_VH,
  SIGNAL_LABEL_WINDOW,
  SIGNAL_TITLE_WINDOW,
  cardTopForEnter,
  signalHandoffT,
  smoothstepInverse01,
  windowT,
} from "@/lib/home-v2/signalHandoff";

/**
 * The phone's epilogue block hands the top of the screen to the first proof
 * card (ADR-116). The window is DERIVED from phone geometry here rather than
 * trusted: the block's box is `.home-v2-mobile-signal`'s (`top: clamp(56px,
 * 12vh, 108px)`, a title and a button — 88 to 140px tall across the rung's
 * widths), the card's pin is the pile's `--pc-top-base` (`clamp(64px, 7vh,
 * 88px)`), and the rung opens at 681px (`PROOF_STACK_SPLIT_MEDIA`).
 */
const smoothstep = (x: number) => x * x * (3 - 2 * x);
const clamp = (lo: number, v: number, hi: number) => Math.min(hi, Math.max(lo, v));
const blockTop = (vh: number) => clamp(56, 0.12 * vh, 108);
const pinTop = (vh: number) => clamp(64, 0.07 * vh, 88);

const HEIGHTS = [681, 700, 745, 780, 844, 932, 1000];
const BLOCK_H = [88, 114, 140];

describe("signalHandoff (ADR-116)", () => {
  it("inverts the pile's own smoothstep", () => {
    for (let x = 0; x <= 1.0001; x += 0.05) {
      expect(smoothstepInverse01(smoothstep(x))).toBeCloseTo(x, 9);
    }
    expect(smoothstepInverse01(0)).toBeCloseTo(0, 12);
    expect(smoothstepInverse01(1)).toBeCloseTo(1, 12);
  });

  it("recovers the card's top from its published enter", () => {
    for (const vh of HEIGHTS) {
      const pin = pinTop(vh);
      for (const top of [vh, 0.8 * vh, 0.5 * vh, 200, pin]) {
        const enter = smoothstep((vh - top) / (vh - pin));
        expect(cardTopForEnter(enter, vh, pin)).toBeCloseTo(top, 6);
      }
    }
  });

  it("passes NaN through — no pile means the corridor's own exit", () => {
    expect(cardTopForEnter(Number.NaN, 844, 64)).toBeNaN();
    expect(signalHandoffT(Number.NaN, 215, 844)).toBeNaN();
    expect(signalHandoffT(300, Number.NaN, 844)).toBeNaN();
    expect(windowT(Number.NaN, SIGNAL_TITLE_WINDOW)).toBeNaN();
  });

  it("is whole while the card is far, gone before it reaches the block, monotonic between", () => {
    for (const vh of HEIGHTS) {
      for (const h of BLOCK_H) {
        const bottom = blockTop(vh) + h;
        const end = bottom + SIGNAL_HANDOFF_GAP_PX;
        const start = end + SIGNAL_HANDOFF_SPAN_VH * vh;
        // The un-type starts only once the card is ON SCREEN (a text leaving
        // for a card nobody can see yet is the void again, the other way up).
        expect(start, `vh ${vh} h ${h}: un-type begins below the fold`).toBeLessThan(vh - 24);
        expect(signalHandoffT(vh, bottom, vh)).toBe(0);
        expect(signalHandoffT(start, bottom, vh)).toBe(0);
        // Gone with the card's top still UNDER the block — never over live copy.
        expect(signalHandoffT(end, bottom, vh)).toBe(1);
        expect(end).toBeGreaterThan(bottom);
        let last = -1;
        for (let top = vh; top >= 0; top -= 7) {
          const u = signalHandoffT(top, bottom, vh);
          expect(u).toBeGreaterThanOrEqual(last);
          last = u;
        }
      }
    }
  });

  it("the kill line fires after the hand-off and before the pin, at every shape", () => {
    for (const vh of HEIGHTS) {
      const kill = SIGNAL_KILL_VH * vh;
      // Before the pin: a card seated at its pin is always past the line.
      expect(pinTop(vh), `vh ${vh}: a pinned card would not kill`).toBeLessThan(kill);
      for (const h of BLOCK_H) {
        const bottom = blockTop(vh) + h;
        // After the hand-off: the text is already gone when the card crosses it.
        expect(signalHandoffT(kill, bottom, vh), `vh ${vh} h ${h}`).toBe(1);
      }
    }
  });

  it("the sub-windows order the leaving: label, then frame over it, title across the run", () => {
    const [la, lb] = SIGNAL_LABEL_WINDOW;
    const [fa, fb] = SIGNAL_FRAME_WINDOW;
    const [ta, tb] = SIGNAL_TITLE_WINDOW;
    expect(la).toBe(0);
    expect(fa).toBeGreaterThan(la);
    // The frame closes over a label that is at least mostly gone.
    expect(windowT(fa, SIGNAL_LABEL_WINDOW)).toBeGreaterThanOrEqual(0.75);
    expect(lb).toBeLessThan(fb);
    // All three are finished exactly at the hand-off's end.
    expect(fb).toBe(1);
    expect(tb).toBe(1);
    expect(ta).toBeGreaterThan(0);
    for (const w of [SIGNAL_LABEL_WINDOW, SIGNAL_FRAME_WINDOW, SIGNAL_TITLE_WINDOW]) {
      expect(windowT(0, w)).toBe(0);
      expect(windowT(1, w)).toBe(1);
    }
  });
});
