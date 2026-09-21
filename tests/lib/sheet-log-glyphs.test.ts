import { describe, expect, it } from "vitest";

import { PROOF_GLYPHS } from "@/components/landing/home-v2/services/casefile/proofGlyphData";
import { kitSections } from "@/app/(internal)/test/arcs-instrument-kit/fixtures";
import { arcsInstrumentSections } from "@/lib/sheet/arcs";
import { LOG_GLYPHS } from "@/lib/sheet/logGlyphs";
import type { SheetSection } from "@/lib/sheet/types";

import { fingerprint, formOverlap, grammarViolations } from "./helpers/glyphGrammar";

/**
 * The arcs log's block icons — the kind of page an engagement is (ADR-118
 * U2). The drawing being GOOD is the owner's read of the contact sheet; the
 * drawing being LEGAL is arithmetic, and it is here.
 */

type Log = Extract<SheetSection, { kind: "log" }>;
const rowsOf = (sections: SheetSection[]) => (sections[1] as Log).groups.flatMap((g) => g.rows);

describe("the log's icons (ADR-118 U2)", () => {
  it("draws exactly the five kinds of page, and nothing speculative", () => {
    expect(Object.keys(LOG_GLYPHS).sort()).toEqual(
      ["keynote", "pitch", "portfolio", "proposal", "workshop"].sort()
    );
  });

  it("keeps every mark inside the particle-icon grammar", () => {
    for (const [name, g] of Object.entries(LOG_GLYPHS))
      expect(grammarViolations(name, g)).toEqual([]);
  });

  it("gives every kind its own mark, far enough from the others to read without a label", () => {
    const entries = Object.entries(LOG_GLYPHS);
    expect(new Set(entries.map(([, g]) => fingerprint(g))).size).toBe(entries.length);
    for (let i = 0; i < entries.length; i++)
      for (let j = i + 1; j < entries.length; j++) {
        const o = formOverlap(entries[i][1], entries[j][1]);
        expect(
          o,
          `${entries[i][0]} and ${entries[j][0]} share ${(o * 100).toFixed(0)}%`
        ).toBeLessThan(0.5);
      }
  });

  it("never prints a casefile claim's mark: the two tables mean different things", () => {
    const proof = new Set(Object.values(PROOF_GLYPHS).map(fingerprint));
    for (const [name, g] of Object.entries(LOG_GLYPHS))
      expect(proof.has(fingerprint(g)), `${name} is a casefile glyph`).toBe(false);
  });

  it("resolves an icon for every block, on the overview and on the kit", () => {
    for (const r of [...rowsOf(arcsInstrumentSections("2026-09-21")), ...rowsOf(kitSections())])
      expect(LOG_GLYPHS[r.chip], `${r.id}: no icon for "${r.chip}"`).toBeDefined();
  });
});
