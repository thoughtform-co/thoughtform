import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  TRACK_COPY,
  TRACK_DISPLAY,
  TRACK_EYEBROW,
  TRACK_LABEL,
  WEIGHT_LIT,
  WEIGHT_TEXT,
  bakeFont,
  bakeTrackPx,
} from "@/lib/services-ring/ringType";

/**
 * `ringType.ts` is the type ramp for text BAKED into WebGL textures
 * (ADR-092 §4 stage 2, seeded by ADR-110's back face). A canvas cannot read
 * a custom property, so the rungs live there as numbers — and this is what
 * keeps them the sheet's: every rung equals its `variables.css` declaration.
 */
const css = readFileSync(join(__dirname, "..", "..", "app/styles/variables.css"), "utf8");
const rung = (name: string): number => {
  const m = new RegExp(`--${name}:\\s*(-?[0-9.]+)(em)?;`).exec(css);
  expect(m, `variables.css declares no --${name}`).not.toBeNull();
  return Number.parseFloat(m![1]);
};

describe("ringType — the baked ramp is the sheet's", () => {
  it("carries the four tracking rungs and the two weights of variables.css", () => {
    expect(TRACK_COPY).toBe(rung("track-copy"));
    expect(TRACK_DISPLAY).toBe(rung("track-display"));
    expect(TRACK_LABEL).toBe(rung("track-label"));
    expect(TRACK_EYEBROW).toBe(rung("track-eyebrow"));
    expect(WEIGHT_TEXT).toBe(rung("weight-text"));
    expect(WEIGHT_LIT).toBe(rung("weight-lit"));
  });

  it("writes a font string and a tracking in bake px from one spec", () => {
    expect(bakeFont({ family: "mono", px: 30 })).toMatch(/^400 30px "PT Mono"/);
    expect(bakeFont({ family: "sans", px: 58, weight: 500 })).toMatch(
      /^500 58px "PP Neue Montreal"/
    );
    expect(bakeTrackPx({ family: "mono", px: 30, track: TRACK_EYEBROW })).toBe(4.5);
    expect(bakeTrackPx({ family: "mono", px: 30, track: TRACK_LABEL })).toBe(2.4);
    expect(bakeTrackPx({ family: "sans", px: 58, track: TRACK_DISPLAY })).toBe(-1.2);
    expect(bakeTrackPx({ family: "sans", px: 38 })).toBe(0);
  });
});
