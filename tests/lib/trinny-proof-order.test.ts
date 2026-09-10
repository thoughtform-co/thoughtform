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

  it("leads with the frontier work and ends on the company-wide layer", () => {
    // The owner's argument for a skincare reader: marketing was the proving
    // ground, the method transfers. A reorder is a decision, not a tidy —
    // and since ADR-094 U2 it is the RECORD's decision (see below).
    expect(TRINNY_PROOF_ORDER[0]).toBe("atl-films");
    expect(TRINNY_PROOF_ORDER[TRINNY_PROOF_ORDER.length - 1]).toBe("ai-transformation");
  });

  /**
   * ⚠ THE SEQUENCE AND THE ARC CAN DISAGREE WITH NOTHING FAILING, and this
   * is the guard for it (ADR-094 U2). Each card's head prints `arc.step`
   * from the RECORD while the pile is ordered by `TRINNY_PROOF_ORDER`, so a
   * re-order in one place alone letters `03 · 01 · 02 · 04` down a scroll —
   * four correct cards in an order that contradicts the numbers on them,
   * with every other assertion on this surface green.
   */
  it("is the record's own arc, in its own order", () => {
    const tracks = trinnyProofTracks();
    for (const t of tracks) {
      expect(t.arc, `${t.id} carries no arc beat`).toBeTruthy();
    }
    const steps = tracks.map((t) => t.arc!.step);
    expect(steps).toEqual(["01", "02", "03", "04"]);
    // …and the titles are the arc as the owner stated it, in the first
    // person plural. Pinned literally: a reword is a copy decision and lands
    // here in the same commit.
    expect(tracks.map((t) => t.arc!.title)).toEqual([
      "We pushed the frontiers of AI creative",
      "We made the creative team self-sufficient",
      "We built the tools the work needed",
      "We took it to the rest of the company",
    ]);
  });

  it("throws on an id that is not on the casefile, rather than dropping a card", () => {
    const def = CASES.find((c) => c.slug === TRINNY_PROOF_CASE)!;
    const ids = new Set(def.casefile.tracks.map((t) => t.id));
    for (const id of TRINNY_PROOF_ORDER) expect(ids.has(id), id).toBe(true);
  });
});
