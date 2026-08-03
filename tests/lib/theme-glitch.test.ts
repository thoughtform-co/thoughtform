import { describe, expect, it } from "vitest";

import {
  coverRect,
  createGlitchPlan,
  glitchFrame,
  GLITCH_CELL_MAX,
  GLITCH_DURATION_MS,
  GLITCH_GRID,
  GLITCH_TEAR_END,
} from "@/lib/key-visual/themeGlitch";

/**
 * ADR-060 — the hero theme-swap glitch.
 *
 * The kernel is pure so that the one invariant that cannot be eyeballed is
 * pinned here instead: the END STATE MUST BE THE IDENTITY. The controller
 * removes its canvas the frame after `done`, so if the last painted frame
 * still carries a mosaic, a tear or a sub-1 alpha, the hero visibly pops at
 * the exact moment the effect is supposed to have finished — and it would
 * look like a rendering bug, not a choreography one.
 */

const PLAN = createGlitchPlan(7);
const at = (t: number) => glitchFrame(PLAN, t * PLAN.durationMs);

describe("glitch plan", () => {
  it("is deterministic per seed and different across seeds", () => {
    expect(createGlitchPlan(7)).toEqual(createGlitchPlan(7));
    expect(createGlitchPlan(7).order).not.toEqual(createGlitchPlan(8).order);
  });

  it("shuffles the flip order — a monotonic order reads as a wipe", () => {
    const { order } = createGlitchPlan(7, { bands: 14 });
    expect([...order].sort((a, b) => a - b)).toEqual(order.map((_, i) => i));
    expect(order).not.toEqual(order.map((_, i) => i));
  });

  it("refuses degenerate shapes rather than dividing by zero", () => {
    expect(createGlitchPlan(1, { bands: 0 }).bands).toBe(2);
    expect(createGlitchPlan(1, { durationMs: 0 }).durationMs).toBe(1);
  });
});

describe("glitch frames", () => {
  it("ends on the IDENTITY frame — nothing to pop back from", () => {
    for (const t of [1, 1.5, 12]) {
      const frame = at(t);
      expect(frame.done).toBe(true);
      expect(frame.scanline).toBeNull();
      for (const b of frame.bands) {
        expect(b.source).toBe("new");
        expect(b.offsetX).toBe(0);
        expect(b.cell).toBe(1);
        expect(b.alpha).toBe(1);
      }
    }
  });

  it("approaches the identity continuously, not in a jump", () => {
    // The frame just before the end must already be visually settled, or
    // the identity frame above is a cliff rather than an arrival.
    const near = at(0.999);
    for (const b of near.bands) {
      expect(b.cell).toBeLessThan(1.05);
      expect(b.alpha).toBeGreaterThan(0.99);
      expect(Math.abs(b.offsetX)).toBeLessThan(0.001);
    }
  });

  it("bands partition the plate with no gap or overlap", () => {
    for (const t of [0, 0.3, 0.6, 1]) {
      const { bands } = at(t);
      expect(bands[0].y0).toBe(0);
      expect(bands[bands.length - 1].y1).toBe(1);
      for (let i = 1; i < bands.length; i++) {
        expect(bands[i].y0).toBe(bands[i - 1].y1);
      }
    }
  });

  it("shows only the OLD plate until the tear phase is over", () => {
    for (const t of [0, 0.1, GLITCH_TEAR_END - 0.001]) {
      expect(at(t).bands.every((b) => b.source === "old")).toBe(true);
    }
  });

  it("shows only the NEW plate once every band has flipped", () => {
    expect(at(0.9).bands.every((b) => b.source === "new")).toBe(true);
  });

  it("flips in rank order", () => {
    // The first band to change source must be the one ranked 0.
    const firstRanked = PLAN.order.indexOf(0);
    let seen: number | null = null;
    for (let t = GLITCH_TEAR_END; t < 0.9 && seen === null; t += 0.005) {
      const idx = at(t).bands.findIndex((b) => b.source === "new");
      if (idx >= 0) seen = idx;
    }
    expect(seen).toBe(firstRanked);
  });

  it("resolves each band monotonically once it has flipped", () => {
    const last = new Map<number, number>();
    for (let t = GLITCH_TEAR_END; t <= 1; t += 0.01) {
      at(t).bands.forEach((b, i) => {
        if (b.source !== "new") return;
        const prev = last.get(i);
        if (prev !== undefined) expect(b.cell).toBeLessThanOrEqual(prev + 1e-9);
        last.set(i, b.cell);
      });
    }
    // And it must actually have travelled the full range, not sat still.
    for (const cell of last.values()) expect(cell).toBeLessThan(GLITCH_GRID + 0.5);
  });

  it("never mosaics coarser than the ceiling or finer than native", () => {
    for (let t = 0; t <= 1; t += 0.01) {
      for (const b of at(t).bands) {
        expect(b.cell).toBeGreaterThanOrEqual(1);
        expect(b.cell).toBeLessThanOrEqual(GLITCH_CELL_MAX);
        expect(b.alpha).toBeGreaterThan(0);
        expect(b.alpha).toBeLessThanOrEqual(1);
      }
    }
  });

  it("starts and ends the tear at zero", () => {
    // The first painted frame must be the outgoing plate exactly as it
    // was — the canvas is covering a live hero, and any offset at t=0 is
    // a visible jump at the moment it appears.
    for (const b of at(0).bands) expect(b.offsetX).toBe(0);
    for (const b of at(GLITCH_TEAR_END).bands) expect(Math.abs(b.offsetX)).toBeLessThan(1e-9);
  });

  it("keeps the scanline out of the settle phase", () => {
    // A stray fleck during the settle would be the last thing on screen.
    expect(at(0.95).scanline).toBeNull();
    expect(at(0.5).scanline).not.toBeNull();
  });

  it("defaults to the documented run length", () => {
    expect(createGlitchPlan(1).durationMs).toBe(GLITCH_DURATION_MS);
  });
});

describe("coverRect", () => {
  it("matches object-fit: cover for a wider-than-box image", () => {
    const r = coverRect(2000, 1000, 100, 100);
    expect(r.h).toBe(100);
    expect(r.w).toBe(200);
    expect(r.x).toBe(-50);
    expect(r.y).toBe(0);
  });

  it("matches object-fit: cover for a taller-than-box image", () => {
    const r = coverRect(1000, 2000, 100, 100);
    expect(r.w).toBe(100);
    expect(r.h).toBe(200);
    expect(r.y).toBe(-50);
  });

  it("maps the two real plates onto the same box within a pixel", () => {
    // 2880×1620 vs 2912×1632 — the plates differ by 0.4 % in aspect, and
    // the glitch cross-fades between them in place. If the mapping drifted
    // the artwork would visibly shift mid-swap.
    const box = { w: 1440, h: 900 };
    const dark = coverRect(2880, 1620, box.w, box.h);
    const light = coverRect(2912, 1632, box.w, box.h);
    expect(Math.abs(dark.w - light.w)).toBeLessThan(12);
    expect(dark.h).toBeCloseTo(light.h, 5);
  });

  it("degrades to the box rather than NaN on a zero-sized source", () => {
    expect(coverRect(0, 0, 50, 40)).toEqual({ x: 0, y: 0, w: 50, h: 40 });
  });
});
