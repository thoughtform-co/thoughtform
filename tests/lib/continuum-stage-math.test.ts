import { describe, expect, it } from "vitest";

import {
  CONTINUUM_APPROACH_WINDOW,
  CONTINUUM_BG_IN_WINDOW,
  CONTINUUM_COPY_WINDOW,
  CONTINUUM_FORM_PRELUDE,
  CONTINUUM_MARK_INK,
  CONTINUUM_RAIL_FORM_WINDOW,
  CONTINUUM_RECEDE_RELEASE,
  CONTINUUM_RETICLE_LAUNCH_AT,
  CONTINUUM_RETICLE_RESET_BELOW,
  CONTINUUM_WAIST_LEVEL,
  THUMB_F_MAX,
  THUMB_F_MIN,
  THUMB_TICK_FRACTIONS,
  continuumApproachT,
  continuumBgInT,
  continuumCopyT,
  continuumFormT,
  continuumRailFormT,
  continuumThumbAngle,
  continuumThumbFraction,
} from "@/lib/services-ring/continuumStageMath";
import { ABOUT_EXIT_WINDOW } from "@/lib/services-ring/aboutDeckMath";

describe("continuum envelopes — identity pin (the ADR-030/047/049 guardrail)", () => {
  it("returns EXACT 0 at continuumP = 0 for every scrubbed channel", () => {
    // Flag-off / pre-continuum frames must be byte-identical with the
    // shipped page: every envelope is exactly 0 at the runway start.
    // For the rail-form envelope this is ALSO the formation-order
    // invariant: it is a function of continuumP alone, so the crail
    // instrument cannot begin forming during the #about exit prelude
    // (where continuumFormT already sits at the 0.4 plateau but the
    // continuum clock is still 0).
    expect(continuumApproachT(0)).toBe(0);
    expect(continuumCopyT(0)).toBe(0);
    expect(continuumRailFormT(0)).toBe(0);
    expect(continuumBgInT(0)).toBe(0);
  });

  it("clamps to 0 below the runway (negative progress) and 1 above it", () => {
    expect(continuumApproachT(-0.5)).toBe(0);
    expect(continuumCopyT(-1)).toBe(0);
    expect(continuumRailFormT(-0.3)).toBe(0);
    expect(continuumBgInT(-0.2)).toBe(0);
    expect(continuumApproachT(2)).toBe(1);
    expect(continuumCopyT(1.5)).toBe(1);
    expect(continuumRailFormT(1.5)).toBe(1);
    expect(continuumBgInT(3)).toBe(1);
  });

  it("reaches exactly 1 at continuumP = 1 (constant hold through #practice)", () => {
    expect(continuumApproachT(1)).toBe(1);
    expect(continuumCopyT(1)).toBe(1);
    expect(continuumRailFormT(1)).toBe(1);
    expect(continuumBgInT(1)).toBe(1);
  });
});

describe("continuum window monotonicity + ordering", () => {
  it("each envelope is non-decreasing across the runway", () => {
    const channels = [continuumApproachT, continuumCopyT, continuumRailFormT, continuumBgInT];
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
    // masthead/labels are fully revealed, and the approach lift resolves
    // first of all.
    expect(CONTINUUM_APPROACH_WINDOW[1]).toBeLessThanOrEqual(CONTINUUM_COPY_WINDOW[1]);
    expect(CONTINUUM_COPY_WINDOW[1]).toBeLessThanOrEqual(CONTINUUM_BG_IN_WINDOW[0]);
    // The shield completes exactly at the unpin.
    expect(CONTINUUM_BG_IN_WINDOW[1]).toBe(1);
  });

  it("the rail forms FROM the mark, not before it: opens inside the approach, closes before the shield", () => {
    // The instrument's outward wipe must start only once the approach has
    // the mark re-inking (a strictly-positive open inside the approach
    // window) and must be fully formed — reticle launched, stops bloomed —
    // with reading room to spare before the tail shield opens.
    expect(CONTINUUM_RAIL_FORM_WINDOW[0]).toBeGreaterThan(CONTINUUM_APPROACH_WINDOW[0]);
    expect(CONTINUUM_RAIL_FORM_WINDOW[0]).toBeLessThan(CONTINUUM_APPROACH_WINDOW[1]);
    expect(CONTINUUM_RAIL_FORM_WINDOW[1]).toBeLessThan(CONTINUUM_BG_IN_WINDOW[0]);
  });

  it("the shield is still 0 while the copy is mid-reveal (no premature cover)", () => {
    const copyMid = (CONTINUUM_COPY_WINDOW[0] + CONTINUUM_COPY_WINDOW[1]) / 2;
    expect(continuumBgInT(copyMid)).toBe(0);
  });

  it("reticle-launch hysteresis is ordered and lives inside the envelope's tail", () => {
    // CLEAR strictly below SET (the anti-strobe gap), both in (0, 1]; the
    // SET edge sits at the envelope's tail so the launch fires only once
    // the instrument is essentially formed. The CSS opacity ramp foot in
    // continuum-stage.css (--crf-nav) must equal RESET_BELOW so the
    // discrete attribute flip is invisible at both edges.
    expect(CONTINUUM_RETICLE_RESET_BELOW).toBeGreaterThan(0);
    expect(CONTINUUM_RETICLE_RESET_BELOW).toBeLessThan(CONTINUUM_RETICLE_LAUNCH_AT);
    expect(CONTINUUM_RETICLE_LAUNCH_AT).toBeLessThanOrEqual(1);
    expect(CONTINUUM_RETICLE_LAUNCH_AT).toBeGreaterThan(0.9);
  });
});

describe("continuumFormT — the about-exit formation prelude (rev 2026-07-18)", () => {
  it("is EXACTLY 0 before the exit begins (pre-slide byte-identical)", () => {
    // Both clocks 0 ⇒ 0; and the about clock through the reading hold
    // (aboutP ≤ ABOUT_EXIT_WINDOW[0]) leaves it 0 while continuum is 0.
    expect(continuumFormT(0, 0)).toBe(0);
    expect(continuumFormT(ABOUT_EXIT_WINDOW[0], 0)).toBe(0);
    expect(continuumFormT(0.5, 0)).toBe(0);
  });

  it("pre-warms to EXACTLY the prelude by the end of the about slide (the plateau)", () => {
    // aboutP = 1, continuumP = 0 across the ~100svh inter-runway gap.
    expect(continuumFormT(1, 0)).toBeCloseTo(CONTINUUM_FORM_PRELUDE, 12);
    expect(continuumFormT(ABOUT_EXIT_WINDOW[1], 0)).toBeCloseTo(CONTINUUM_FORM_PRELUDE, 12);
  });

  it("reaches exactly 1 when the continuum approach completes", () => {
    expect(continuumFormT(1, 1)).toBe(1);
    expect(continuumFormT(0, 1)).toBe(1);
  });

  it("equals continuumApproachT whenever the about clock is 0 (max-compose)", () => {
    for (let p = 0; p <= 1.0001; p += 0.05) {
      expect(continuumFormT(0, p)).toBeCloseTo(continuumApproachT(p), 12);
    }
  });

  it("is non-decreasing in each argument", () => {
    // In continuumP at fixed aboutP…
    for (const a of [0, 0.5, 1]) {
      let prev = -Infinity;
      for (let p = 0; p <= 1.0001; p += 0.05) {
        const v = continuumFormT(a, p);
        expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = v;
      }
    }
    // …and in aboutP at fixed continuumP.
    for (const c of [0, 0.5, 1]) {
      let prev = -Infinity;
      for (let a = 0; a <= 1.0001; a += 0.05) {
        const v = continuumFormT(a, c);
        expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = v;
      }
    }
  });

  it("keeps the prelude a proper partial pre-warm (0 < prelude < 1)", () => {
    expect(CONTINUUM_FORM_PRELUDE).toBeGreaterThan(0);
    expect(CONTINUUM_FORM_PRELUDE).toBeLessThan(1);
  });
});

describe("mark-prominence tunables are in the intended band", () => {
  it("mid-prominence: below the #services centerpiece, above the about ambient", () => {
    // The about ambient survives at ~0.30 ink; the centerpiece parks near
    // 0.84–1.0. The continuum ink must sit strictly between.
    expect(CONTINUUM_MARK_INK).toBeGreaterThan(0.3);
    expect(CONTINUUM_MARK_INK).toBeLessThan(0.84);
  });

  it("recede release is a partial re-approach (0 < release < 1)", () => {
    expect(CONTINUUM_RECEDE_RELEASE).toBeGreaterThan(0);
    expect(CONTINUUM_RECEDE_RELEASE).toBeLessThan(1);
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
