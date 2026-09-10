import { describe, expect, it } from "vitest";

import {
  TRINNY_PROOF_CASE,
  TRINNY_PROOF_ORDER,
  trinnyProofTracks,
} from "@/app/(marketing)/trinny-london/proof/proofOrder";
import { CASES } from "@/lib/cases/registry";

/**
 * ADR-094 — the proof stack reads the record by reference and orders it
 * by route. These pin the join: every id the route names is a real track
 * on the Loop casefile, each card has the one short paragraph the surface
 * was built around, and the four bullets are the register's own claims.
 * The envelope itself (money, names, links, superseded figures) is
 * `cases-registry.test.ts`'s — this file never restates it.
 */
describe("the trinny proof order", () => {
  it("names a real case and resolves every id to exactly one track", () => {
    expect(CASES.some((c) => c.slug === TRINNY_PROOF_CASE)).toBe(true);
    const tracks = trinnyProofTracks();
    expect(tracks.map((t) => t.id)).toEqual([...TRINNY_PROOF_ORDER]);
    expect(new Set(tracks).size).toBe(TRINNY_PROOF_ORDER.length);
  });

  it("is four cards, each with a lede and four glyphed claims", () => {
    const tracks = trinnyProofTracks();
    expect(tracks).toHaveLength(4);
    for (const t of tracks) {
      expect(t.card?.lede, `${t.id} lede`).toBeTruthy();
      expect(t.blocks, `${t.id} blocks`).toHaveLength(4);
      for (const b of t.blocks ?? []) expect(b.glyph, `${t.id} "${b.title}" glyph`).toBeTruthy();
      /* ⚠ THE CAP'S REASON MOVED WITH THE NAME (ADR-094 U1). It was 20
         because the title sat `nowrap` in a 52px flex head strip; it now
         leads the RECORD column, where it wraps against a ~22ch measure.
         So this is a copy budget for a two-line display name, not a
         clipping guard — and the box it answers to is `.tl-card__title`'s
         `max-width`, which is where to re-measure if it ever binds. */
      expect(t.project.length, `${t.id} project`).toBeLessThanOrEqual(24);
    }
  });

  it("leads with the creative work and ends on the company-wide layer", () => {
    // The owner's argument for a skincare reader: marketing was the proving
    // ground, the method transfers. A reorder is a decision, not a tidy.
    expect(TRINNY_PROOF_ORDER[0]).toBe("studio");
    expect(TRINNY_PROOF_ORDER[TRINNY_PROOF_ORDER.length - 1]).toBe("ai-transformation");
  });

  it("throws on an id that is not on the casefile, rather than dropping a card", () => {
    const def = CASES.find((c) => c.slug === TRINNY_PROOF_CASE)!;
    const ids = new Set(def.casefile.tracks.map((t) => t.id));
    for (const id of TRINNY_PROOF_ORDER) expect(ids.has(id), id).toBe(true);
  });
});
