import { describe, expect, it } from "vitest";

import {
  CHARACTER_ERAS,
  CHARACTER_ERA_COUNT,
  eraPressBeatIds,
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
 *
 * ⚠ U2 ADDS THE PANEL CONTENT (facts, press routing, films). The record
 * is at LOCK and its own guard bans rounding, currency and model
 * families over `voidwalkerData.ts`; this file letters copy on the same
 * public surface, so it runs the SAME envelope. A registry that is
 * scanned less strictly than the record it quotes is where a superseded
 * claim survives.
 */

/** The record's own bans, applied to the roster's authored copy.
 *  Mirrors `tests/lib/voidwalker-data.test.ts` — move them together. */
const BANNED_ROUNDING = /\b1[,.]?000\b|\b16[,.]?000\b|\b\d+k\b|\b100[,.]?000\+/i;
const CURRENCY = /[$€£¥]/;
const MODEL_FAMILIES = /\b(opus|sonnet|haiku|fable|gpt|gemini|llama|mistral|claude)\b/i;

/** Everything an era letters through the panels, as one blob. */
function eraCopy(era: (typeof CHARACTER_ERAS)[number]): string {
  return [
    era.wardrobe,
    era.motto,
    era.loadout,
    ...(era.facts ?? []).flatMap((f) => [f.k, f.v]),
    era.film?.title ?? "",
  ].join(" • ");
}

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

describe("ADR-082 U2 · the era panels' content", () => {
  it("every era carries 3-5 facts, and each row fits its column", () => {
    for (const era of CHARACTER_ERAS) {
      const facts = era.facts ?? [];
      expect(facts.length, `${era.id} fact count`).toBeGreaterThanOrEqual(3);
      expect(facts.length, `${era.id} fact count`).toBeLessThanOrEqual(5);
      for (const f of facts) {
        // The label column is mono caps at a fixed measure; the value
        // takes the rest of a ~34ch panel and must not wrap to three.
        expect(f.k.length, `${era.id} fact key "${f.k}"`).toBeLessThanOrEqual(14);
        expect(f.v.length, `${era.id} fact value "${f.v}"`).toBeLessThanOrEqual(44);
        expect(f.k.trim(), `${era.id} fact key blank`).not.toBe("");
        expect(f.v.trim(), `${era.id} fact value blank`).not.toBe("");
      }
    }
  });

  it("fact labels are unique within an era (no row says the same thing twice)", () => {
    for (const era of CHARACTER_ERAS) {
      const keys = (era.facts ?? []).map((f) => f.k.toLowerCase());
      expect(new Set(keys).size, `${era.id} duplicate fact key`).toBe(keys.length);
    }
  });

  it("runs the RECORD's envelope over every lettered string", () => {
    for (const era of CHARACTER_ERAS) {
      const copy = eraCopy(era);
      expect(BANNED_ROUNDING.test(copy), `${era.id} rounds a figure`).toBe(false);
      expect(CURRENCY.test(copy), `${era.id} names money`).toBe(false);
      expect(MODEL_FAMILIES.test(copy), `${era.id} names a model family`).toBe(false);
      // The section's own name is not a word its copy uses (ADR-074).
      expect(/voidwalker/i.test(copy), `${era.id} says "voidwalker"`).toBe(false);
      // No markup smuggled into copy strings; emphasis is a role, not a tag.
      expect(/<[a-z/]/i.test(copy), `${era.id} smuggles markup`).toBe(false);
    }
  });

  it("press routing names real beats that actually carry a press card", () => {
    const byId = new Map(VOIDWALKER_BEATS.map((b) => [b.id, b]));
    for (const era of CHARACTER_ERAS) {
      const ids = eraPressBeatIds(era);
      expect(ids.length, `${era.id} press routing empty`).toBeGreaterThan(0);
      expect(new Set(ids).size, `${era.id} duplicate press beat`).toBe(ids.length);
      for (const id of ids) {
        const beat = byId.get(id);
        expect(beat, `${era.id} → unknown beat ${id}`).toBeDefined();
      }
      // A named beat with no press renders an empty card — the routing
      // is explicit, so an id that letters nothing is a mistake, not a
      // fallback. (Eras that simply have no press omit the field and
      // default to their own beat, which may legitimately carry none.)
      if (era.pressBeatIds) {
        for (const id of era.pressBeatIds) {
          expect(byId.get(id)?.press, `${era.id} routed to press-less beat ${id}`).toBeDefined();
        }
      }
    }
  });

  it("defaults press routing to the era's own beat", () => {
    for (const era of CHARACTER_ERAS) {
      if (!era.pressBeatIds) {
        expect(eraPressBeatIds(era)).toEqual([era.beatId]);
      }
    }
  });

  it("films are nocookie-embeddable and fit the plate's bar", () => {
    for (const era of CHARACTER_ERAS) {
      if (!era.film) continue;
      expect(era.film.youtubeId, `${era.id} youtubeId`).toMatch(/^[\w-]{11}$/);
      expect(era.film.title.length, `${era.id} film title`).toBeLessThanOrEqual(60);
      if (era.film.duration !== undefined) {
        expect(era.film.duration, `${era.id} film duration`).toMatch(/^\d{1,2}:\d{2}$/);
      }
      // The poster is the affordance -- a transmission without one is a
      // text bar nobody reads as a video (owner). SELF-HOSTED, because
      // img-src does not name ytimg and the player must stay the page's
      // only third-party thing, built only after a click.
      expect(era.film.poster, `${era.id} film poster`).toMatch(
        /^\/images\/voidwalker\/[^\s]+\.(jpg|webp)$/
      );
    }
  });

  it("does not put a second film on the RECORD (the interlude stays alone)", () => {
    // The era registry is where a second transmission lives, precisely
    // so `voidwalker-data.test.ts`'s exactly-one-film pin keeps holding.
    // If this ever fails, someone moved an era film onto a beat.
    expect(VOIDWALKER_BEATS.filter((b) => b.film)).toHaveLength(1);
  });
});
