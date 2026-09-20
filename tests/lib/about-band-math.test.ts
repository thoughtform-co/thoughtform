import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ABOUT_BAND_COPY_WINDOW,
  ABOUT_BAND_COVER,
  ABOUT_BAND_DONE,
  ABOUT_BAND_FLIP_WINDOW,
  ABOUT_BAND_KILL,
  ABOUT_BAND_NAME_WINDOW,
  ABOUT_BAND_READ,
  ABOUT_BAND_RUNWAY_SVH,
  ABOUT_BAND_SLOT_MIN_PX,
  ABOUT_BAND_SQUARE_WINDOW,
  MOBILE_UNTYPE_WINDOW,
  aboutBandCopyT,
  aboutBandNameT,
  aboutBandProgress,
  aboutBandSnapOffset,
  aboutBandSquareT,
  mobileUntypeT,
} from "@/lib/services-ring/aboutBandMath";

const ROOT = join(__dirname, "..", "..");
const SHEET = readFileSync(join(ROOT, "components/landing/home-v2/about/about-band.css"), "utf8");
import {
  runSlice,
  scrambleLinesIn,
  scrambleLinesOut,
  typeCount,
  untypeCount,
} from "@/lib/home-v2/scrubbedDecode";

/**
 * THE PHONE'S ABOUT BAND (ADR-115) — the windows, the seat and the scrubbed
 * decode, walked. The ring's flip rides ADR-047's own window; everything
 * here is what the band adds after it.
 */

describe("the about band's ladder", () => {
  it("orders the beats: flip, then the name, then the paragraph, then the read seat", () => {
    expect(ABOUT_BAND_FLIP_WINDOW[0]).toBe(0);
    expect(ABOUT_BAND_FLIP_WINDOW[1]).toBeLessThanOrEqual(ABOUT_BAND_NAME_WINDOW[0]);
    expect(ABOUT_BAND_NAME_WINDOW[0]).toBeLessThan(ABOUT_BAND_NAME_WINDOW[1]);
    expect(ABOUT_BAND_NAME_WINDOW[1]).toBeLessThanOrEqual(ABOUT_BAND_COPY_WINDOW[0]);
    expect(ABOUT_BAND_COPY_WINDOW[0]).toBeLessThan(ABOUT_BAND_COPY_WINDOW[1]);
    // The reading state is a hair past the copy's landing — the snap seat
    // is solved to a pixel and may never rest on `decode`.
    expect(ABOUT_BAND_READ).toBeGreaterThan(ABOUT_BAND_COPY_WINDOW[1]);
    expect(ABOUT_BAND_READ - ABOUT_BAND_COPY_WINDOW[1]).toBeLessThan(0.05);
    expect(ABOUT_BAND_READ).toBeLessThan(ABOUT_BAND_DONE);
    // The deck squares up between the seat and the handover.
    expect(ABOUT_BAND_SQUARE_WINDOW[0]).toBeGreaterThanOrEqual(ABOUT_BAND_READ);
    expect(ABOUT_BAND_SQUARE_WINDOW[1]).toBeLessThan(ABOUT_BAND_DONE);
    expect(aboutBandSquareT(ABOUT_BAND_SQUARE_WINDOW[0])).toBe(0);
    expect(aboutBandSquareT(ABOUT_BAND_SQUARE_WINDOW[1])).toBe(1);
    // The flip's-end seat sits past the flip and short of the name's window
    // — a stop pulled onto it shows the portrait alone.
    expect(ABOUT_BAND_COVER).toBeGreaterThan(ABOUT_BAND_FLIP_WINDOW[1]);
    expect(ABOUT_BAND_COVER).toBeLessThan(ABOUT_BAND_NAME_WINDOW[0]);
    // The handover: DOM first, then the deck — both paint in between.
    expect(ABOUT_BAND_DONE).toBeLessThan(ABOUT_BAND_KILL);
    expect(ABOUT_BAND_KILL).toBeLessThanOrEqual(1);
  });

  it("is what the sheet declares (the lockstep)", () => {
    // `services-ring-mobile-gate`'s own pin for the ring band, one station
    // down: a runway, a seat or a cover edited in one place changes how
    // much scroll a beat gets and nothing else says so.
    const num = (name: string) => {
      const m = new RegExp(`${name}:\\s*([0-9.]+)(svh)?;`).exec(SHEET);
      expect(m, `about-band.css declares no ${name}`).not.toBeNull();
      return Number.parseFloat(m![1]!);
    };
    expect(num("--about-band-runway")).toBe(ABOUT_BAND_RUNWAY_SVH * 100);
    expect(num("--about-band-read")).toBe(ABOUT_BAND_READ);
    expect(num("--about-band-cover")).toBe(ABOUT_BAND_COVER);
  });

  it("gives every beat real scroll on a phone", () => {
    // The pinned travel is (RUNWAY − 1) viewports; at 844h a window under
    // ~20svh is one thumb flick, and nothing here may be that short.
    const travel = (ABOUT_BAND_RUNWAY_SVH - 1) * 844;
    expect(travel).toBeGreaterThan(800);
    expect((ABOUT_BAND_FLIP_WINDOW[1] - ABOUT_BAND_FLIP_WINDOW[0]) * travel).toBeGreaterThan(200);
    expect((ABOUT_BAND_NAME_WINDOW[1] - ABOUT_BAND_NAME_WINDOW[0]) * travel).toBeGreaterThan(120);
    expect((ABOUT_BAND_COPY_WINDOW[1] - ABOUT_BAND_COPY_WINDOW[0]) * travel).toBeGreaterThan(200);
    // The reading hold: enough to rest on, never a second dead viewport.
    const hold = (1 - ABOUT_BAND_READ) * travel;
    expect(hold).toBeGreaterThan(300);
    expect(hold).toBeLessThan(844);
  });

  it("envelopes are 0 at their start and 1 at their end, and monotone", () => {
    expect(aboutBandNameT(ABOUT_BAND_NAME_WINDOW[0])).toBe(0);
    expect(aboutBandNameT(ABOUT_BAND_NAME_WINDOW[1])).toBe(1);
    expect(aboutBandCopyT(ABOUT_BAND_COPY_WINDOW[0])).toBe(0);
    expect(aboutBandCopyT(ABOUT_BAND_COPY_WINDOW[1])).toBe(1);
    expect(mobileUntypeT(MOBILE_UNTYPE_WINDOW[0])).toBe(0);
    expect(mobileUntypeT(MOBILE_UNTYPE_WINDOW[1])).toBe(1);
    expect(mobileUntypeT(1)).toBe(1);
    for (const f of [aboutBandNameT, aboutBandCopyT, mobileUntypeT]) {
      let last = -1;
      for (let p = 0; p <= 1.0001; p += 0.005) {
        const v = f(p);
        expect(v).toBeGreaterThanOrEqual(last - 1e-12);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
        last = v;
      }
    }
  });

  it("reads the band's progress off its station's rect, clamped", () => {
    // Runway 2.4 × 844 tall; the band pins when the top is 0 and releases
    // when the top is −(height − vh).
    const h = ABOUT_BAND_RUNWAY_SVH * 844;
    expect(aboutBandProgress(200, h, 844)).toBe(0);
    expect(aboutBandProgress(0, h, 844)).toBe(0);
    expect(aboutBandProgress(-(h - 844) / 2, h, 844)).toBeCloseTo(0.5, 9);
    expect(aboutBandProgress(-(h - 844), h, 844)).toBe(1);
    expect(aboutBandProgress(-h, h, 844)).toBe(1);
    // A runway no taller than the frame has no travel: parked at 0.
    expect(aboutBandProgress(-10, 844, 844)).toBe(0);
  });

  it("puts the snap seat at the reading state, inside the runway", () => {
    const h = ABOUT_BAND_RUNWAY_SVH * 844;
    const off = aboutBandSnapOffset(h, 844);
    expect(off).toBeCloseTo(ABOUT_BAND_READ * (h - 844), 9);
    // A stop seated there reads p = READ exactly.
    expect(aboutBandProgress(-off, h, 844)).toBeCloseTo(ABOUT_BAND_READ, 9);
    expect(aboutBandSnapOffset(844, 844)).toBe(0);
  });

  it("names the slot floor and the un-type share", () => {
    expect(ABOUT_BAND_SLOT_MIN_PX).toBeGreaterThanOrEqual(120);
    expect(MOBILE_UNTYPE_WINDOW[0]).toBe(0);
    expect(MOBILE_UNTYPE_WINDOW[1]).toBeGreaterThan(0.5);
    expect(MOBILE_UNTYPE_WINDOW[1]).toBeLessThan(1);
  });
});

describe("the scrubbed decode", () => {
  const FINALS = ["AI CAPABILITY", "YOUR TEAM OWNS."];
  const rand = () => 0.5;
  const resolved = (out: string, final: string) => {
    let n = 0;
    for (let c = 0; c < final.length; c += 1) if (out[c] === final[c]) n += 1;
    return n;
  };

  it("scrambles OUT from whole to gone, last line first, reversibly", () => {
    for (let i = 0; i < FINALS.length; i += 1) {
      expect(scrambleLinesOut(FINALS, i, 0, rand)).toBe(FINALS[i]);
      expect(scrambleLinesOut(FINALS, i, 1, rand)).toBe("");
      // Pure in u: the same u gives the same frame, in either direction.
      expect(scrambleLinesOut(FINALS, i, 0.37, rand)).toBe(scrambleLinesOut(FINALS, i, 0.37, rand));
    }
    // The bottom line starts leaving before the top one.
    const early = 0.08;
    const bottom = scrambleLinesOut(FINALS, FINALS.length - 1, early, rand);
    const top = scrambleLinesOut(FINALS, 0, early, rand);
    expect(resolved(bottom, FINALS[1]!)).toBeLessThanOrEqual(resolved(top, FINALS[0]!));
    // Monotone: the resolved count never grows as u grows.
    for (let i = 0; i < FINALS.length; i += 1) {
      let last = Infinity;
      for (let u = 0; u <= 1.0001; u += 0.02) {
        const n = resolved(scrambleLinesOut(FINALS, i, u, rand), FINALS[i]!);
        expect(n).toBeLessThanOrEqual(last);
        last = n;
      }
    }
  });

  it("scrambles IN from blank to whole, first line first", () => {
    for (let i = 0; i < FINALS.length; i += 1) {
      expect(scrambleLinesIn(FINALS, i, 0, rand)).toBe("");
      expect(scrambleLinesIn(FINALS, i, 1, rand)).toBe(FINALS[i]);
      let last = -1;
      for (let u = 0; u <= 1.0001; u += 0.02) {
        const n = resolved(scrambleLinesIn(FINALS, i, u, rand), FINALS[i]!);
        expect(n).toBeGreaterThanOrEqual(last);
        last = n;
      }
    }
    const early = 0.3;
    expect(resolved(scrambleLinesIn(FINALS, 0, early, rand), FINALS[0]!)).toBeGreaterThanOrEqual(
      resolved(scrambleLinesIn(FINALS, 1, early, rand), FINALS[1]!)
    );
  });

  it("types and un-types a run by count, and slices it per line", () => {
    expect(untypeCount(40, 0)).toBe(40);
    expect(untypeCount(40, 1)).toBe(0);
    expect(untypeCount(40, 0.5)).toBe(20);
    expect(typeCount(40, 0)).toBe(0);
    expect(typeCount(40, 1)).toBe(40);
    expect(typeCount(40, 0.5)).toBe(20);
    for (let u = 0; u <= 1; u += 0.01) {
      expect(untypeCount(40, u) + typeCount(40, u)).toBeGreaterThanOrEqual(39);
    }
    // A run of two lines, 12 + 10 chars: the count walks the first line then
    // the second, and a count past a line's end shows the whole line.
    expect(runSlice("first line.", 0, 5)).toBe("first");
    expect(runSlice("first line.", 0, 40)).toBe("first line.");
    expect(runSlice("second one", 11, 11)).toBe("");
    expect(runSlice("second one", 11, 14)).toBe("sec");
  });
});
