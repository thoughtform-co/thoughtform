/**
 * An arc's corner roster, derived from its own menu (ADR-059 U6).
 *
 * ⚠ PURE AND REACT-FREE, so every arc's roster can be walked by a test. And
 * ⚠ DERIVED, NEVER AUTHORED: the change reaches all five registered arcs, and
 * a hard-coded portfolio roster would make the two client decks somebody
 * else's problem. `arcs-registry.test.ts` already pins `menuPrimary` at ≤5 per
 * arc and at least one per arc — this file depends on both.
 *
 * ⚠ IT DOES NOT IMPORT `clusters.ts`. That module resolves the landing's
 * roster against `MANIFEST_ENTRIES` / `READOUT_SECTIONS` at module evaluation
 * and throws on a miss, so an arc page that loaded it would white-screen the
 * day a landing station is renamed. The shared piece is `markState.ts` alone.
 */

import type { JourneyMark } from "@/components/landing/v7/rail-instruments/markState";

import type { ArcMenuItem } from "./ArcShell";

/**
 * The five chapter glyphs, by POSITION.
 *
 * ⚠ DECORATIVE, AND MAPPED RATHER THAN DRAWN (owner, 2026-08-25: "for our
 * portfolio, we need different ones, but it doesn't really matter what these
 * icons are. They're just decorative, so let's make it consistent"). Three of
 * the five — `navigate`, `encode`, `build` — are drawings ADR-059 U3 ORPHANED
 * when it gave the Arc one mark for its three corridor beats; seating them
 * here gives them a job and keeps the two surfaces distinguishable. Only
 * `thesis` and `arc` are shared with a live landing seat, and the two pages
 * are never on screen together.
 *
 * On the portfolio that reads: a compass needle for a dated course, a scope
 * trace for the studio, three chevrons for the films, registration brackets
 * for the tools, offset strata for the Intelligence Map.
 */
export const ARC_CHAPTER_GLYPHS = ["navigate", "thesis", "arc", "encode", "build"] as const;

export interface ArcRoster {
  /** The top-left row: this arc's chapters, in page order. */
  chapters: readonly JourneyMark[];
  /** The bottom-right exit — the arc's terminal section. */
  exit: JourneyMark | null;
}

/**
 * Build the two corner rosters from an arc's menu.
 *
 * ⚠ A CHAPTER IS A RANGE, NOT AN INDEX. The active section can be any of the
 * sections between one chapter and the next — the portfolio's four tool
 * dossiers all sit under "Tools" — so a chapter is `here` for its whole span.
 * `markState` already carries `idxEnd` for exactly this: it is the mechanism
 * `ARC_MARK` invented on the landing so the Arc's three beats could not
 * double-light with Thesis.
 *
 * ⚠ THE FIRST CHAPTER'S RANGE OPENS AT 0. Every menu index is then covered by
 * exactly one mark, so ADR-059's "exactly one mark is gold" invariant holds by
 * CONSTRUCTION rather than by luck — the landing carries one such hole
 * already (`practice`, pinned and known). Today every arc opens on a chapter,
 * so the clause is a no-op; it is there so an arc that does not go dark for a
 * screen.
 */
export function buildArcMarks(menu: readonly ArcMenuItem[]): ArcRoster {
  if (menu.length === 0) return { chapters: [], exit: null };

  const last = menu.length - 1;
  /* ⚠ If the terminal section is itself a chapter there is no exit mark, and
     the chapters run to the end. No arc hits this today; without the guard,
     that arc would light two marks at once. */
  const exitIsChapter = Boolean(menu[last].primary);
  const exitIdx = exitIsChapter ? -1 : last;
  const ceiling = exitIsChapter ? last : last - 1;

  const chapterIdxs = menu
    .map((item, i) => (item.primary ? i : -1))
    .filter((i) => i >= 0 && i <= ceiling);

  const chapters: JourneyMark[] = chapterIdxs.map((idx, n) => {
    const start = n === 0 ? 0 : idx;
    const end = n === chapterIdxs.length - 1 ? ceiling : chapterIdxs[n + 1] - 1;
    return {
      id: menu[idx].id,
      name: menu[idx].label,
      clock: "row",
      idx: start,
      idxEnd: Math.max(start, end),
      glyph: ARC_CHAPTER_GLYPHS[n % ARC_CHAPTER_GLYPHS.length],
    };
  });

  const exit: JourneyMark | null =
    exitIdx < 0
      ? null
      : {
          id: menu[exitIdx].id,
          name: menu[exitIdx].label,
          clock: "row",
          idx: exitIdx,
          /* The transmit arrow. Every arc's terminal section is its close, and
             the portfolio's carries a `mailto:` — so the landing's own contact
             drawing is literally right here. */
          glyph: "contact",
        };

  return { chapters, exit };
}
