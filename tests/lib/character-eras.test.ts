import { describe, expect, it } from "vitest";

import {
  CHARACTER_ERAS,
  CHARACTER_ERA_COUNT,
  findCharacterEra,
} from "@/lib/voidwalker/characterEras";
import { VOIDWALKER_BEATS } from "@/lib/voidwalker/voidwalkerData";

/**
 * ADR-082 — the character stage's era registry.
 *
 * `voidwalkerData.ts` (ADR-074) is the record; `characterEras.ts` is the
 * roster the stage renders. This guard pins the invariants that make the
 * two consistent:
 *
 *   - the roster is the CURATED six (owner ruling, not all nine);
 *   - every era references an existing beat by id;
 *   - no era invents a year (each is a valid record year or span);
 *   - the wardrobe copy and rail labels fit their columns;
 *   - the stills point at existing files (checked as string shape here;
 *     `probe-voidwalker-models.mjs` walks the filesystem);
 *   - ids are unique kebab and the sweep is REVERSE-chronological.
 */

describe("ADR-082 · character era registry", () => {
  it("ships with the curated six (never grows silently)", () => {
    expect(CHARACTER_ERAS).toHaveLength(CHARACTER_ERA_COUNT);
    expect(CHARACTER_ERA_COUNT).toBe(6);
  });

  it("every era's id is unique, kebab, and looked up by helper", () => {
    const ids = CHARACTER_ERAS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(findCharacterEra(id)).toBeDefined();
    }
    expect(findCharacterEra("does-not-exist")).toBeUndefined();
  });

  it("every era points at a real beat in the record", () => {
    const beatIds = new Set(VOIDWALKER_BEATS.map((b) => b.id));
    for (const era of CHARACTER_ERAS) {
      expect(beatIds.has(era.beatId), `era ${era.id} → beat ${era.beatId}`).toBe(true);
    }
  });

  it("years are 4-digit or a 4-digit dash 2-digit span (record grammar)", () => {
    for (const era of CHARACTER_ERAS) {
      // `2026` | `2016–18` (en dash, not hyphen — the ADR-074 rule).
      expect(era.year, era.id).toMatch(/^\d{4}(–\d{2})?$/);
    }
  });

  it("sweeps reverse-chronological — first entry is the current seat", () => {
    // The record itself is reverse-chronological (ADR-074 U2), and the
    // rail should read the same way so index 0 is 2026 and index 5 is
    // 2014. Compare only the leading four digits; span forms like
    // "2016–18" collapse to their opening year for this check.
    const openings = CHARACTER_ERAS.map((e) => parseInt(e.year.slice(0, 4), 10));
    expect(openings[0]).toBeGreaterThanOrEqual(openings.at(-1)!);
    for (let i = 1; i < openings.length; i++) {
      expect(openings[i]!).toBeLessThanOrEqual(openings[i - 1]!);
    }
  });

  it("wardrobe copy fits its columns", () => {
    for (const era of CHARACTER_ERAS) {
      expect(era.wardrobe.length, `${era.id} wardrobe`).toBeLessThanOrEqual(32);
      expect(era.motto.length, `${era.id} motto`).toBeLessThanOrEqual(52);
      expect(era.loadout.length, `${era.id} loadout`).toBeLessThanOrEqual(120);
      expect(era.short.length, `${era.id} short`).toBeLessThanOrEqual(14);
    }
  });

  it("stills are public paths; models are null until Meshy lands them", () => {
    for (const era of CHARACTER_ERAS) {
      expect(era.stillPath, `${era.id} stillPath`).toMatch(
        /^\/images\/[^\s]+\.(jpg|jpeg|png|webp)$/i
      );
      if (era.modelPath !== null) {
        expect(era.modelPath, `${era.id} modelPath`).toMatch(/^\/models\/voidwalker\/[^\s]+\.glb$/);
      }
    }
  });
});
