import { describe, expect, it } from "vitest";

import {
  CHARACTER_ERAS,
  containedHologramPlacement,
  holoFigureFit,
  resolveCharacterEraHologram,
} from "@/lib/voidwalker/characterEras";
import {
  HOLO_GLITCH_MS,
  holoGlitchInterrupt,
  holoGlitchPlan,
  holoGlitchSeed,
  holoPlateRect,
  holoScanPhase,
  neighbourEras,
} from "@/lib/voidwalker/holoGlitch";
import { glitchFrame, GLITCH_DURATION_MS } from "@/lib/key-visual/themeGlitch";

/**
 * The era figure's transition arithmetic (ADR-082 U42). The kernel's own
 * invariants are `theme-glitch.test.ts`'s; this holds what the figure adds —
 * the seat of a plate inside the canvas, the scanline phase, the seed and the
 * interrupt policy.
 */
const ids = CHARACTER_ERAS.map((e) => e.id);
const holo = (i: number) => resolveCharacterEraHologram(CHARACTER_ERAS[i]!);

describe("ADR-082 U42 · the era glitch", () => {
  describe("the plan", () => {
    it("tears a pair the same way every time, and its reverse differently", () => {
      for (let i = 0; i < ids.length - 1; i++) {
        const a = holoGlitchPlan(ids[i]!, ids[i + 1]!);
        const b = holoGlitchPlan(ids[i]!, ids[i + 1]!);
        const r = holoGlitchPlan(ids[i + 1]!, ids[i]!);
        expect(a).toEqual(b);
        expect(a.order.join()).not.toBe(r.order.join());
        expect(holoGlitchSeed(ids[i]!, ids[i + 1]!)).not.toBe(holoGlitchSeed(ids[i + 1]!, ids[i]!));
      }
    });

    it("runs at the hero's duration, and the dev hook only stretches it", () => {
      expect(HOLO_GLITCH_MS).toBe(GLITCH_DURATION_MS);
      expect(holoGlitchPlan("a", "b").durationMs).toBe(GLITCH_DURATION_MS);
      expect(holoGlitchPlan("a", "b", 8).durationMs).toBe(GLITCH_DURATION_MS * 8);
      expect(holoGlitchPlan("a", "b", 0).durationMs).toBe(GLITCH_DURATION_MS);
      expect(holoGlitchPlan("a", "b", Number.NaN).durationMs).toBe(GLITCH_DURATION_MS);
    });

    it("ends on the identity frame — every band the new plate, native, unmoved", () => {
      const plan = holoGlitchPlan(ids[0]!, ids[1]!);
      const f = glitchFrame(plan, plan.durationMs);
      expect(f.done).toBe(true);
      for (const b of f.bands) {
        expect(b.source).toBe("new");
        expect(b.cell).toBe(1);
        expect(b.offsetX).toBe(0);
        expect(b.alpha).toBe(1);
      }
    });
  });

  describe("the plate's seat", () => {
    // The owner's viewport: the figure column at its 460px cap, overscanned.
    const boxW = 460 * 1.16;
    const boxH = 845 * 1.16;

    it("is the registry's own contain-bottom placement at fit 1", () => {
      const h = holo(2); // azeroth, the floor era (fit exactly 1)
      expect(holoFigureFit(h)).toBe(1);
      const r = holoPlateRect(boxW, boxH, 1, h)!;
      const p = containedHologramPlacement(boxW, boxH, h)!;
      expect(r).toEqual({ x: p.left, y: p.top, w: p.width, h: p.height });
    });

    it("scales the picture by the era's fit and keeps it bottom-centred", () => {
      for (let i = 0; i < CHARACTER_ERAS.length; i++) {
        const h = holo(i);
        const fit = holoFigureFit(h);
        const r = holoPlateRect(boxW, boxH, fit, h)!;
        const full = holoPlateRect(boxW, boxH, 1, h)!;
        expect(r.w).toBeCloseTo(full.w * fit, 6);
        expect(r.h).toBeCloseTo(full.h * fit, 6);
        // Bottom-centred: the same foot line, the same centre line.
        expect(r.y + r.h).toBeCloseTo(boxH, 6);
        expect(r.x + r.w / 2).toBeCloseTo(boxW / 2, 6);
        // And inside the box.
        expect(r.x).toBeGreaterThanOrEqual(-1e-6);
        expect(r.y).toBeGreaterThanOrEqual(-1e-6);
      }
    });

    it("paints every era at one figure height, which is what the fit is for", () => {
      const heights = CHARACTER_ERAS.map((_, i) => {
        const h = holo(i);
        const r = holoPlateRect(boxW, boxH, holoFigureFit(h), h)!;
        return r.h * (h.footY - h.headY);
      });
      const spread = Math.max(...heights) - Math.min(...heights);
      // ADR-082 U25's law, read through the canvas: within a pixel.
      expect(spread).toBeLessThan(1);
    });

    it("fails closed on a bad fit or a bad box", () => {
      const h = holo(0);
      expect(holoPlateRect(boxW, boxH, 0, h)).toBeNull();
      expect(holoPlateRect(boxW, boxH, Number.NaN, h)).toBeNull();
      expect(holoPlateRect(0, boxH, 1, h)).toBeNull();
    });
  });

  describe("the scanline phase", () => {
    it("is zero at fit 1 and the video's own offset modulo the pitch otherwise", () => {
      expect(holoScanPhase(845, 1, 3)).toBe(0);
      // (1 − 0.8) × 845 = 169 → 169 mod 3 = 1
      expect(holoScanPhase(845, 0.8, 3)).toBeCloseTo(1, 9);
      expect(holoScanPhase(845, 0.8, 3)).toBeLessThan(3);
      expect(holoScanPhase(845, 0.8, 3)).toBeGreaterThanOrEqual(0);
    });

    it("stays inside [0, pitch) for every era at the reference heights", () => {
      for (const boxH of [845 * 1.16, 720 * 0.7, 1080 * 0.75]) {
        for (let i = 0; i < CHARACTER_ERAS.length; i++) {
          const phase = holoScanPhase(boxH, holoFigureFit(holo(i)), 3);
          expect(phase).toBeGreaterThanOrEqual(0);
          expect(phase).toBeLessThan(3);
        }
      }
    });

    it("fails closed on a bad pitch", () => {
      expect(holoScanPhase(845, 0.8, 0)).toBe(0);
      expect(holoScanPhase(Number.NaN, 0.8, 3)).toBe(0);
    });
  });

  describe("an interrupted run", () => {
    it("restarts from the plate it was arriving at, never from the canvas", () => {
      const run = { fromId: "a", toId: "b", from: "A", to: "B", fromFit: 1, toFit: 0.8 };
      const next = holoGlitchInterrupt(run, { toId: "c", to: "C", toFit: 0.9 });
      expect(next).toEqual({
        fromId: "b",
        toId: "c",
        from: "B",
        to: "C",
        fromFit: 0.8,
        toFit: 0.9,
      });
    });
  });

  describe("what to warm", () => {
    it("is the neighbours inside the roster", () => {
      const n = CHARACTER_ERAS.length;
      expect(neighbourEras(0, n)).toEqual([1]);
      expect(neighbourEras(2, n)).toEqual([1, 3]);
      expect(neighbourEras(n - 1, n)).toEqual([n - 2]);
      expect(neighbourEras(-1, n)).toEqual([]);
      expect(neighbourEras(n, n)).toEqual([]);
      expect(neighbourEras(0, 0)).toEqual([]);
    });
  });
});
