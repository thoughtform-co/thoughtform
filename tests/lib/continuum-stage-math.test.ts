import { describe, expect, it } from "vitest";

import {
  CONTINUUM_APPROACH_WINDOW,
  CONTINUUM_BG_IN_WINDOW,
  CONTINUUM_CHROME_WINDOW,
  CONTINUUM_COPY_WINDOW,
  CONTINUUM_FORM_ENTRY,
  CONTINUUM_FORM_PRELUDE,
  CONTINUUM_MARK_INK,
  CONTINUUM_RECEDE_RELEASE,
  CONTINUUM_SCALE_BOOST,
  CONTINUUM_WAIST_LEVEL,
  THUMB_F_MAX,
  THUMB_F_MIN,
  THUMB_TICK_FRACTIONS,
  continuumApproachT,
  continuumBgInT,
  continuumChromeT,
  continuumCopyT,
  continuumFormT,
  continuumThumbAngle,
  continuumThumbFraction,
} from "@/lib/services-ring/continuumStageMath";
import { ABOUT_EXIT_WINDOW } from "@/lib/services-ring/aboutDeckMath";

describe("continuum envelopes — identity pin (the ADR-030/047/049 guardrail)", () => {
  it("returns EXACT 0 at continuumP = 0 for every scrubbed channel", () => {
    // Flag-off / pre-continuum frames must be byte-identical with the
    // shipped page: every envelope is exactly 0 at the runway start.
    expect(continuumApproachT(0)).toBe(0);
    expect(continuumCopyT(0)).toBe(0);
    expect(continuumBgInT(0)).toBe(0);
  });

  it("clamps to 0 below the runway (negative progress) and 1 above it", () => {
    expect(continuumApproachT(-0.5)).toBe(0);
    expect(continuumCopyT(-1)).toBe(0);
    expect(continuumBgInT(-0.2)).toBe(0);
    expect(continuumApproachT(2)).toBe(1);
    expect(continuumCopyT(1.5)).toBe(1);
    expect(continuumBgInT(3)).toBe(1);
  });

  it("reaches exactly 1 at continuumP = 1 (constant hold through #practice)", () => {
    expect(continuumApproachT(1)).toBe(1);
    expect(continuumCopyT(1)).toBe(1);
    expect(continuumBgInT(1)).toBe(1);
  });
});

describe("continuum window monotonicity + ordering", () => {
  it("each envelope is non-decreasing across the runway", () => {
    const channels = [continuumApproachT, continuumCopyT, continuumBgInT];
    for (const f of channels) {
      let prev = -Infinity;
      for (let p = 0; p <= 1.0001; p += 0.02) {
        const v = f(p);
        expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = v;
      }
    }
  });

  it("the bg-in (shield) window opens AFTER the copy window closes", () => {
    // Ordering invariant: the tail shield must not restore before the
    // masthead/stops are fully revealed, and the approach settle resolves
    // first of all.
    expect(CONTINUUM_APPROACH_WINDOW[1]).toBeLessThanOrEqual(CONTINUUM_COPY_WINDOW[1]);
    expect(CONTINUUM_COPY_WINDOW[1]).toBeLessThanOrEqual(CONTINUUM_BG_IN_WINDOW[0]);
    // The shield completes exactly at the unpin.
    expect(CONTINUUM_BG_IN_WINDOW[1]).toBe(1);
  });

  it("the shield is still 0 while the copy is mid-reveal (no premature cover)", () => {
    const copyMid = (CONTINUUM_COPY_WINDOW[0] + CONTINUUM_COPY_WINDOW[1]) / 2;
    expect(continuumBgInT(copyMid)).toBe(0);
  });
});

describe("continuumChromeT — the slider chrome clicks together AT the pin (Update 6)", () => {
  it("is EXACTLY 0 at formation 0 (nothing docks before the band exists)", () => {
    expect(continuumChromeT(0)).toBe(0);
    expect(continuumChromeT(-1)).toBe(0);
  });

  it("completes exactly at CONTINUUM_FORM_ENTRY — assembled as the section pins", () => {
    // The entry bridge delivers formT = CONTINUUM_FORM_ENTRY at the pin;
    // the chrome window must close there so the reticle + caps are fully
    // in place the moment the stage arrives ("snaps together").
    expect(CONTINUUM_CHROME_WINDOW[1]).toBeCloseTo(CONTINUUM_FORM_ENTRY, 12);
    expect(continuumChromeT(CONTINUUM_FORM_ENTRY)).toBe(1);
    expect(continuumChromeT(1)).toBe(1);
  });

  it("opens after the prelude (the #about slide plays chrome-free)", () => {
    // During the exit slide formT ≤ CONTINUUM_FORM_PRELUDE — the band may
    // glow but the crisp chrome waits for the entry ramp's tail.
    expect(CONTINUUM_CHROME_WINDOW[0]).toBeGreaterThan(CONTINUUM_FORM_PRELUDE);
    expect(continuumChromeT(CONTINUUM_FORM_PRELUDE)).toBe(0);
  });

  it("is non-decreasing over the formation clock", () => {
    let prev = -Infinity;
    for (let f = 0; f <= 1.0001; f += 0.02) {
      const v = continuumChromeT(f);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });
});

describe("continuumFormT — the continuous formation clock (Update 5: prelude → entry → approach)", () => {
  it("is EXACTLY 0 before the exit begins (pre-slide byte-identical)", () => {
    // All clocks 0 ⇒ 0; and the about clock through the reading hold
    // (aboutP ≤ ABOUT_EXIT_WINDOW[0]) leaves it 0 while the others are 0.
    // (entry/approach are page-geometry-coupled: the hook writes entry = 0
    // everywhere the runway is a full viewport away, which covers every
    // pre-exit frame — the identity pin holds through that coupling.)
    expect(continuumFormT(0, 0)).toBe(0);
    expect(continuumFormT(ABOUT_EXIT_WINDOW[0], 0)).toBe(0);
    expect(continuumFormT(0.5, 0)).toBe(0);
    expect(continuumFormT(0.5, 0, 0)).toBe(0);
  });

  it("pre-warms to EXACTLY the prelude by the end of the about slide", () => {
    // aboutP = 1 with the runway still a full viewport away (entry 0).
    expect(continuumFormT(1, 0)).toBeCloseTo(CONTINUUM_FORM_PRELUDE, 12);
    expect(continuumFormT(ABOUT_EXIT_WINDOW[1], 0)).toBeCloseTo(CONTINUUM_FORM_PRELUDE, 12);
  });

  it("the ENTRY bridge carries the formation prelude → CONTINUUM_FORM_ENTRY across the gap", () => {
    // Continuous from the prelude plateau (entry 0⁺ ≈ prelude — the
    // smootherstep foot) to the pin (entry 1 = exactly the entry target).
    expect(continuumFormT(1, 0, 1e-6)).toBeCloseTo(CONTINUUM_FORM_PRELUDE, 6);
    expect(continuumFormT(1, 0, 0.5)).toBeCloseTo(
      (CONTINUUM_FORM_PRELUDE + CONTINUUM_FORM_ENTRY) / 2,
      12
    );
    expect(continuumFormT(1, 0, 1)).toBeCloseTo(CONTINUUM_FORM_ENTRY, 12);
    // Monotone in the entry clock.
    let prev = -Infinity;
    for (let e = 0; e <= 1.0001; e += 0.02) {
      const v = continuumFormT(1, 0, e);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });

  it("the pin seam is continuous: approach picks up exactly where entry delivered", () => {
    // At the pin entry = 1 (⇒ CONTINUUM_FORM_ENTRY) and the approach term
    // opens from that same value with zero slope (smootherstep foot).
    expect(continuumFormT(1, 1e-6, 1)).toBeCloseTo(CONTINUUM_FORM_ENTRY, 6);
    expect(continuumFormT(1, CONTINUUM_APPROACH_WINDOW[1], 1)).toBe(1);
  });

  it("reaches exactly 1 when the continuum approach completes, and holds below the runway", () => {
    expect(continuumFormT(1, 1)).toBe(1);
    expect(continuumFormT(0, 1)).toBe(1);
    expect(continuumFormT(1, 1, 1)).toBe(1);
  });

  it("maps the pinned approach onto [CONTINUUM_FORM_ENTRY, 1] (the landing segment)", () => {
    for (let p = 0.0001; p <= 1.0001; p += 0.05) {
      const expected = CONTINUUM_FORM_ENTRY + (1 - CONTINUUM_FORM_ENTRY) * continuumApproachT(p);
      expect(continuumFormT(0, p)).toBeCloseTo(expected, 12);
    }
  });

  it("is non-decreasing in every argument", () => {
    // In continuumP at fixed aboutP…
    for (const a of [0, 0.5, 1]) {
      let prev = -Infinity;
      for (let p = 0; p <= 1.0001; p += 0.05) {
        const v = continuumFormT(a, p);
        expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = v;
      }
    }
    // …in aboutP at fixed continuumP…
    for (const c of [0, 0.5, 1]) {
      let prev = -Infinity;
      for (let a = 0; a <= 1.0001; a += 0.05) {
        const v = continuumFormT(a, c);
        expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = v;
      }
    }
    // …and in entryP at fixed (aboutP, continuumP).
    for (const a of [0.9, 1]) {
      let prev = -Infinity;
      for (let e = 0; e <= 1.0001; e += 0.05) {
        const v = continuumFormT(a, 0, e);
        expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = v;
      }
    }
  });

  it("the COMPOSED scroll journey is monotone and step-continuous (no stall, no jump)", () => {
    // Simulate the real page order: the about exit slide (entry 0), the
    // inter-runway gap (aboutP clamped 1, entry 0 → 1), the pinned
    // approach (entry clamped 1). The formation must never decrease AND
    // never step more than a scroll-frame-plausible delta — the "grow →
    // dead stall → lurch" profile this clock replaced would fail the
    // per-segment progress assertions below.
    const samples: number[] = [];
    for (let a = ABOUT_EXIT_WINDOW[0] - 0.05; a <= 1; a += 0.01) {
      samples.push(continuumFormT(Math.min(1, a), 0, 0));
    }
    for (let e = 0; e <= 1; e += 0.01) {
      samples.push(continuumFormT(1, 0, e));
    }
    for (let p = 0; p <= 1; p += 0.01) {
      samples.push(continuumFormT(1, p, 1));
    }
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1] - 1e-9);
      expect(samples[i] - samples[i - 1]).toBeLessThan(0.06);
    }
    // And the journey actually progresses inside EACH segment (no dead
    // plateau anywhere between the exit start and the approach end).
    expect(continuumFormT(1, 0, 0.5)).toBeGreaterThan(continuumFormT(1, 0, 0.1));
    expect(continuumFormT(1, 0.15, 1)).toBeGreaterThan(continuumFormT(1, 0.05, 1));
  });

  it("keeps the formation waypoints ordered (0 < prelude < entry < 1)", () => {
    expect(CONTINUUM_FORM_PRELUDE).toBeGreaterThan(0);
    expect(CONTINUUM_FORM_ENTRY).toBeGreaterThan(CONTINUUM_FORM_PRELUDE);
    expect(CONTINUUM_FORM_ENTRY).toBeLessThan(1);
  });
});

describe("mark-prominence tunables are in the intended band", () => {
  it("mid-prominence: below the #services centerpiece, above the about ambient", () => {
    // The about ambient survives at ~0.30 ink; the centerpiece parks near
    // 0.84–1.0. The continuum ink must sit strictly between.
    expect(CONTINUUM_MARK_INK).toBeGreaterThan(0.3);
    expect(CONTINUUM_MARK_INK).toBeLessThan(0.84);
  });

  it("recede release restores the full parked pose, and the hero boost overshoots it", () => {
    // Update 5 (owner: "way bigger"): the release is total — exitTPose
    // reaches 0 at full formation — and the scale boost then carries the
    // mark PAST the parked #services size. Boost must stay a multiplier
    // ≥ 1 (identity at formT 0 rides the (boost − 1) · formT term).
    expect(CONTINUUM_RECEDE_RELEASE).toBeGreaterThan(0);
    expect(CONTINUUM_RECEDE_RELEASE).toBeLessThanOrEqual(1);
    expect(CONTINUUM_SCALE_BOOST).toBeGreaterThan(1);
  });

  it("waist level brightens (> 1)", () => {
    expect(CONTINUUM_WAIST_LEVEL).toBeGreaterThan(1);
  });
});

describe("waist-ring thumb — tool ↔ collaborator ping-pong", () => {
  it("sits at the Tool (left) stop at phase 0 and 1, Collaborator (right) at phase 0.5", () => {
    expect(continuumThumbFraction(0)).toBeCloseTo(THUMB_F_MIN, 6);
    expect(continuumThumbFraction(0.5)).toBeCloseTo(THUMB_F_MAX, 6);
    expect(continuumThumbFraction(1)).toBeCloseTo(THUMB_F_MIN, 6);
  });

  it("wraps across integer phases (delta accumulator never explodes)", () => {
    expect(continuumThumbFraction(3.5)).toBeCloseTo(THUMB_F_MAX, 6);
    expect(continuumThumbFraction(10)).toBeCloseTo(THUMB_F_MIN, 6);
  });

  it("stays within the [Tool, Collaborator] span at all phases", () => {
    for (let ph = 0; ph <= 2; ph += 0.017) {
      const f = continuumThumbFraction(ph);
      expect(f).toBeGreaterThanOrEqual(THUMB_F_MIN - 1e-9);
      expect(f).toBeLessThanOrEqual(THUMB_F_MAX + 1e-9);
    }
  });

  it("maps Tool to the left arc (cos a < 0) and Collaborator to the right (cos a > 0)", () => {
    // The three labels must register left → right along the front arc.
    const [tool, mid, collab] = THUMB_TICK_FRACTIONS;
    expect(Math.cos(continuumThumbAngle(tool))).toBeLessThan(0);
    expect(Math.abs(Math.cos(continuumThumbAngle(mid)))).toBeLessThan(1e-9);
    expect(Math.cos(continuumThumbAngle(collab))).toBeGreaterThan(0);
    // sin a > 0 across the whole span → the thumb rides one continuous
    // (front) half of the ellipse, never crossing to the back.
    for (const f of [tool, mid, collab]) {
      expect(Math.sin(continuumThumbAngle(f))).toBeGreaterThan(0);
    }
  });
});
