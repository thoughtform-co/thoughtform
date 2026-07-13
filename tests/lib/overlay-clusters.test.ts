import { describe, expect, it } from "vitest";

import {
  BUILD_TOOL_INSET_X,
  BUILD_TOOL_STEP_Y,
  SKILL_FAN_TUNING,
  buildToolOffset,
  skillFanOffset,
} from "@/lib/home-v2/overlayClusters";

/**
 * overlayClusters (ADR-032 U1) — pure shell-local offset math for the
 * Encode skill fan + Build tool cascade. Cardinal angles are the stable
 * `SHELL_PRIMITIVES` values: N(judgment)=π/2, E(taste)=0, S(craft)=−π/2,
 * W(voice)=π.
 */

const ANGLE = { judgment: Math.PI / 2, taste: 0, craft: -Math.PI / 2, voice: Math.PI } as const;

const mag = ([x, y]: readonly [number, number]) => Math.hypot(x, y);

describe("skillFanOffset", () => {
  it("places a single-chip cluster exactly on the cardinal's outward ray", () => {
    const [dx, dy] = skillFanOffset(ANGLE.voice, "voice", 0, 1);
    const r = SKILL_FAN_TUNING.voice.radius;
    // Voice points along −X (angle π): offset is (−r, ~0).
    expect(dx).toBeCloseTo(-r, 6);
    expect(dy).toBeCloseTo(0, 6);
  });

  it("every chip sits at its cardinal's tuned radius", () => {
    for (const cardinal of ["judgment", "taste", "craft", "voice"] as const) {
      const size = 3;
      for (let i = 0; i < size; i++) {
        expect(mag(skillFanOffset(ANGLE[cardinal], cardinal, i, size))).toBeCloseTo(
          SKILL_FAN_TUNING[cardinal].radius,
          6
        );
      }
    }
  });

  it("spreads a 2-chip cluster symmetrically about the outward ray", () => {
    const spread = SKILL_FAN_TUNING.judgment.spreadRad;
    const a = skillFanOffset(ANGLE.judgment, "judgment", 0, 2);
    const b = skillFanOffset(ANGLE.judgment, "judgment", 1, 2);
    // Angle of each offset, measured relative to the outward ray, should be
    // ∓spread/2 — i.e. mirror images.
    const relA = Math.atan2(a[1], a[0]) - ANGLE.judgment;
    const relB = Math.atan2(b[1], b[0]) - ANGLE.judgment;
    expect(relA).toBeCloseTo(-spread / 2, 6);
    expect(relB).toBeCloseTo(spread / 2, 6);
  });
});

describe("buildToolOffset", () => {
  it("never fans outward — dx is negative (inward) for all four", () => {
    for (let i = 0; i < 4; i++) {
      expect(buildToolOffset(i)[0]).toBe(BUILD_TOOL_INSET_X);
      expect(buildToolOffset(i)[0]).toBeLessThan(0);
    }
  });

  it("stacks the four chips centred on the Web-app row, top-to-bottom", () => {
    const dys = [0, 1, 2, 3].map((i) => buildToolOffset(i)[1]);
    // Symmetric about 0 (centred).
    expect(dys.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 6);
    // Strictly descending by one step.
    for (let i = 1; i < dys.length; i++) {
      expect(dys[i - 1] - dys[i]).toBeCloseTo(BUILD_TOOL_STEP_Y, 6);
    }
  });
});
