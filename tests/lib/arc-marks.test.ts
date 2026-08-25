import { describe, expect, it } from "vitest";

import type { ArcMenuItem } from "@/components/arcs/ArcShell";
import { ARC_CHAPTER_GLYPHS, buildArcMarks } from "@/components/arcs/arcMarks";
import { SECTION_GLYPHS } from "@/components/landing/v7/rail-instruments/sectionGlyphs";
import { markState } from "@/components/landing/v7/rail-instruments/markState";
import { ARCS } from "@/lib/arcs/registry";

/**
 * The arcs' corner rosters (ADR-059 U6).
 *
 * ⚠ IT WALKS EVERY REGISTERED ARC, not the portfolio. The owner asked for the
 * portfolio and the change reaches all five, because the roster is DERIVED
 * from each arc's own menu — a hard-coded one would make the two client decks
 * somebody else's problem.
 *
 * The invariant is ADR-059's, on the arcs' clock: exactly one mark is gold at
 * every position a reader can be in. `markState` is the same function the
 * landing's roster is pinned against, so one law is checked on two rosters.
 */

/** The menu the route builds, per arc. */
function menuOf(arc: (typeof ARCS)[number]): ArcMenuItem[] {
  return arc.sections
    .filter((s) => s.menuLabel)
    .map((s) => ({ id: s.id, label: s.menuLabel as string, primary: s.menuPrimary }));
}

describe("every arc's corners are derived from its own menu", () => {
  for (const arc of ARCS) {
    describe(arc.slug, () => {
      const menu = menuOf(arc);
      const { chapters, exit } = buildArcMarks(menu);

      it("puts exactly ONE mark gold at every position the reader can hold", () => {
        /* ⚠ THE LANDING CARRIES A HOLE HERE (`practice`, known and pinned).
           The arcs must not: the first chapter's range opens at 0, so every
           menu index is covered by exactly one mark BY CONSTRUCTION. */
        const all = exit ? [...chapters, exit] : chapters;
        for (let i = 0; i < menu.length; i++) {
          const gold = all.filter((m) => markState(m, i, i) === "here");
          expect(
            gold.map((m) => m.id),
            `menu index ${i} on /arcs/${arc.slug}`
          ).toHaveLength(1);
        }
      });

      it("covers the menu with contiguous, non-overlapping chapter ranges", () => {
        expect(chapters.length).toBeGreaterThan(0);
        expect(chapters[0].idx).toBe(0);
        for (let i = 1; i < chapters.length; i++) {
          expect(chapters[i].idx).toBe((chapters[i - 1].idxEnd ?? chapters[i - 1].idx) + 1);
        }
        const lastEnd = chapters[chapters.length - 1].idxEnd ?? chapters[chapters.length - 1].idx;
        expect(lastEnd).toBe(exit ? exit.idx - 1 : menu.length - 1);
      });

      it("takes its exit from the arc's terminal section, and it is not a chapter", () => {
        expect(exit).not.toBeNull();
        expect(exit?.idx).toBe(menu.length - 1);
        expect(menu[menu.length - 1].primary).toBeFalsy();
        expect(exit?.glyph).toBe("contact");
      });

      it("resolves every glyph it names", () => {
        for (const m of [...chapters, ...(exit ? [exit] : [])]) {
          expect(SECTION_GLYPHS[m.glyph ?? m.id], `${m.id} → ${m.glyph}`).toBeTruthy();
        }
      });

      it("runs on the ROW clock throughout — an arc has no beat index", () => {
        for (const m of [...chapters, ...(exit ? [exit] : [])]) expect(m.clock).toBe("row");
      });
    });
  }

  it("gives the portfolio's Tools chapter its four dossiers", () => {
    const portfolio = ARCS.find((a) => a.slug === "portfolio")!;
    const menu = menuOf(portfolio);
    const { chapters } = buildArcMarks(menu);
    expect(chapters.map((c) => c.name)).toEqual([
      "Trajectory",
      "Studio",
      "Films",
      "Tools",
      "Architecture",
    ]);
    /* Vesper · Mímir · Babylon · Heimdall all live under Tools — the range
       machinery `ARC_MARK` invented for the Arc's three corridor beats. */
    const tools = chapters[3];
    expect((tools.idxEnd ?? tools.idx) - tools.idx).toBe(4);
  });

  it("degrades rather than throwing on an empty or chapterless menu", () => {
    expect(buildArcMarks([])).toEqual({ chapters: [], exit: null });
    const oneChapterLast: ArcMenuItem[] = [
      { id: "a", label: "A" },
      { id: "b", label: "B", primary: true },
    ];
    /* ⚠ If the TERMINAL section is itself a chapter there is no exit mark —
       without the guard that arc would light two marks at once. */
    const r = buildArcMarks(oneChapterLast);
    expect(r.exit).toBeNull();
    expect(r.chapters).toHaveLength(1);
    expect(markState(r.chapters[0], 0, 0)).toBe("here");
    expect(markState(r.chapters[0], 1, 1)).toBe("here");
  });

  it("keeps the glyph palette inside the drawn vocabulary", () => {
    for (const key of ARC_CHAPTER_GLYPHS) expect(SECTION_GLYPHS[key]).toBeTruthy();
  });
});
