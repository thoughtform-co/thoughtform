import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  buildJourneyRoster,
  journeyPosition,
  journeySector,
} from "@/components/landing/v7/rail-instruments/journeyOrder";
import { markState } from "@/components/landing/v7/rail-instruments/markState";
import { useJourneyMarks } from "@/components/landing/v7/rail-instruments/useJourneyMarks";
import { SECTION_GLYPHS } from "@/components/landing/v7/rail-instruments/sectionGlyphs";
import { MANIFEST_ENTRIES } from "@/lib/rail-manifest/entries";
import { resolveActiveIdx, LAST_CORRIDOR_IDX } from "@/lib/rail-manifest/resolveActiveIdx";
import { READOUT_SECTIONS } from "@/lib/rail-manifest/sectionLabel";

import {
  TRINNY_JOURNEY,
  TRINNY_JOURNEY_ORDER,
  TRINNY_NAV_ITEMS,
} from "@/app/(marketing)/trinny-london/journey";

/**
 * ADR-093 — the variant's journey clock.
 *
 * The same invariant `rail-instrument-marks.test.ts` pins for the landing:
 * GOLD IS WAYFINDING, so exactly one mark is lit at any position. What
 * makes it worth pinning twice is that this roster exists BECAUSE the
 * landing's cannot be reordered — `markState` compares indices, so a
 * production mark carries its production position with it and reads
 * `ahead` on a page where its section comes earlier. Nothing throws when
 * that happens; the frame just lies about where the reader is.
 */

const ALL_MARKS = [...TRINNY_JOURNEY.marks, ...TRINNY_JOURNEY.exit];

const idxOf = (id: string) => MANIFEST_ENTRIES.findIndex((e) => e.id === id);

const goldAt = (activeIdx: number, proofOwns = false) => {
  const seat = journeyPosition(TRINNY_JOURNEY, activeIdx, proofOwns);
  return ALL_MARKS.filter((m) => markState(m, activeIdx, seat) === "here").map((m) => m.id);
};

describe("the trinny-london journey roster", () => {
  it("never lights two marks at once, at any position on the bus", () => {
    for (let i = 0; i < MANIFEST_ENTRIES.length; i += 1) {
      for (const proofOwns of [false, true]) {
        const gold = goldAt(i, proofOwns);
        expect(
          gold.length,
          `${MANIFEST_ENTRIES[i].id} (proofOwns=${proofOwns}) lit [${gold.join(",")}]`
        ).toBeLessThanOrEqual(1);
      }
    }
  });

  it("runs the journey in THIS page's order, not production's", () => {
    /* The whole point. On the landing About is the sixth readout row and
       Thesis the second manifest beat; here About is second and the Arc
       follows it. A production-clocked roster would light About `ahead`
       from Services onward and Thesis `passed` inside the bio. */
    expect(goldAt(idxOf("hero"))).toEqual(["hero"]);
    expect(goldAt(idxOf("about"))).toEqual(["about"]);
    expect(goldAt(idxOf("thesis"))).toEqual(["thesis"]);
    for (const beat of ["navigate", "encode", "build"]) {
      expect(goldAt(idxOf(beat)), beat).toEqual(["arc"]);
    }
    expect(goldAt(idxOf("services"), true)).toEqual(["proof"]);
    expect(goldAt(idxOf("services"), false)).toEqual(["services"]);
    expect(goldAt(idxOf("contact"))).toEqual(["contact"]);
  });

  it("reads passed/here/ahead in page order while the reader is in the bio", () => {
    // The state that would be WRONG on a production-clocked roster: every
    // corridor mark must be `ahead` here, and only the hero behind.
    const seat = journeyPosition(TRINNY_JOURNEY, idxOf("about"));
    expect(ALL_MARKS.map((m) => markState(m, idxOf("about"), seat))).toEqual([
      "passed",
      "here",
      "ahead",
      "ahead",
      "ahead",
      "ahead",
      "ahead",
    ]);
  });

  it("lights NOTHING for a section this page does not show", () => {
    // `#voidwalker` and `#practice` are removed by the parse. A roster that
    // seated them anyway would light a mark for a section that is not on
    // the page — the honest answer is no mark at all, which is also the
    // landing's own known hole for `#practice`.
    for (const absent of ["voidwalker", "practice"]) {
      expect(journeyPosition(TRINNY_JOURNEY, idxOf(absent)), absent).toBe(-1);
      expect(goldAt(idxOf(absent)), absent).toEqual([]);
    }
  });

  it("seats every mark on a real row of its own order, ranges included", () => {
    for (const mark of ALL_MARKS) {
      expect(mark.clock, `${mark.id}.clock`).toBe("row");
      expect(TRINNY_JOURNEY_ORDER[mark.idx], `${mark.id}.idx`).toBeDefined();
      if (mark.idxEnd !== undefined) {
        expect(TRINNY_JOURNEY_ORDER[mark.idxEnd], `${mark.id}.idxEnd`).toBeDefined();
        expect(mark.idxEnd, `${mark.id} range`).toBeGreaterThan(mark.idx);
      }
    }
  });

  it("has a glyph for every mark it renders", () => {
    // `MarkRow` looks each up by `glyph ?? id` and renders null on a miss —
    // a silently blank seat in a row whose whole job is to be legible.
    for (const mark of ALL_MARKS) {
      expect(SECTION_GLYPHS[mark.glyph ?? mark.id], `${mark.id} glyph`).toBeDefined();
    }
  });

  it("derives a SECTOR readout of five rows that never runs backwards", () => {
    // The corridor's four beats are ONE row, exactly as READOUT_SECTIONS
    // collapses them for production; hero has no row of its own.
    expect([...TRINNY_JOURNEY.sectorRows]).toEqual([
      "about",
      "arc",
      "proof",
      "services",
      "contact",
    ]);
    const walk: [string, boolean][] = [
      ["hero", false],
      ["about", false],
      ["thesis", false],
      ["navigate", false],
      ["build", false],
      ["services", true],
      ["services", false],
      ["contact", false],
    ];
    let last = -1;
    for (const [id, proofOwns] of walk) {
      const { seat, total } = journeySector(TRINNY_JOURNEY, idxOf(id), proofOwns);
      expect(total, id).toBe(5);
      expect(seat, `${id} went backwards`).toBeGreaterThanOrEqual(last);
      expect(seat, `${id} past the last row`).toBeLessThan(total);
      last = seat;
    }
  });

  it("offers only anchors this page actually ships", () => {
    // The parse-time link cleanup cannot reach a React-owned list, so a
    // production nav here would ship #voidwalker and #practice as dead
    // anchors and count four in a drawer holding two.
    expect(TRINNY_NAV_ITEMS.map((i) => i.href)).toEqual(["#about", "#services"]);
    for (const item of TRINNY_NAV_ITEMS) {
      expect(TRINNY_JOURNEY_ORDER as readonly string[]).toContain(item.href.slice(1));
    }
  });

  it("resolves loudly rather than seating a mark nobody can see", () => {
    expect(() => buildJourneyRoster(["hero"], "hero", [{ id: "nope" }], [])).toThrow(
      /not in the order/
    );
    expect(() => buildJourneyRoster(["hero"], "missing", [], [])).toThrow(/preMountStationId/);
    expect(() =>
      buildJourneyRoster(["a", "b"], "a", [{ id: "x", name: "X", range: ["b", "a"] }], [])
    ).toThrow(/ends at or before/);
    // A mark whose id is not a production section must be given a name —
    // `MarkRow` prints it in the lab's explain mode, and an unnamed mark
    // there is a blank seat with nothing to say which one it is.
    expect(() => buildJourneyRoster(["x"], "x", [{ id: "x" }], [])).toThrow(/pass one explicitly/);
  });
});

describe("the hook publishes the roster's own SECTOR total", () => {
  it("does not leave production's denominator on a variant", () => {
    /* ⚠ THIS SHIPPED AND WAS CAUGHT BY LOOKING. The hook seeds its state
       with `READOUT_SECTIONS.length` and bails out of `setMarks` when the
       POSITION is unchanged — and at rest on the hero every position is 0,
       so the first update compared equal and the seeded total survived.
       Live reading: `01/07` on a five-row page, with all six marks correct
       beside it. The seed now comes from the roster and the equality check
       compares the total.

       Asserting the two totals DIFFER is what makes this a real guard: if
       a future variant happened to have seven rows, the bug would be
       invisible again — so the test that matters is on a roster whose
       total is not production's. */
    expect(TRINNY_JOURNEY.sectorRows.length).toBe(5);
    expect(TRINNY_JOURNEY.sectorRows.length).not.toBe(READOUT_SECTIONS.length);

    const { result } = renderHook(() => useJourneyMarks(true, TRINNY_JOURNEY));
    expect(result.current.sector.total).toBe(5);
    expect(result.current.sector.seat).toBe(0);
  });

  it("still publishes production's own total when no roster is given", () => {
    const { result } = renderHook(() => useJourneyMarks(true));
    expect(result.current.sector.total).toBe(READOUT_SECTIONS.length);
  });
});

describe("resolveActiveIdx's pre-mount station", () => {
  const html = () => document.documentElement;

  function withMount(topPx: number, run: () => void) {
    const mount = document.createElement("div");
    mount.id = "home-corridor-mount";
    mount.getBoundingClientRect = () => ({ top: topPx }) as DOMRect;
    document.body.appendChild(mount);
    try {
      run();
    } finally {
      mount.remove();
    }
  }

  it("still reads hero for production, with the parameter defaulted", () => {
    // The default has to be byte-identical or `/` changes: only `hero`
    // carries targetId "hero", and the `idx < 0` fallback lands on it too.
    html().setAttribute("data-active-station", "hero");
    withMount(10, () => expect(resolveActiveIdx(html())).toBe(LAST_CORRIDOR_IDX));
    withMount(window.innerHeight, () => expect(resolveActiveIdx(html())).toBe(0));
    html().removeAttribute("data-active-station");
  });

  it("applies the seam-gap rule to the variant's own lag station", () => {
    /* On this page the corridor mount follows #about, and the mount is not
       a `.station` — so `data-active-station` reads "about" for the whole
       corridor. Without the parameter the About mark stays gold through
       the Arc; with it the rule fires exactly as it does for hero on `/`. */
    html().setAttribute("data-active-station", "about");
    withMount(10, () => {
      expect(resolveActiveIdx(html(), "about")).toBe(LAST_CORRIDOR_IDX);
      // …and the production default must NOT fire on it.
      expect(resolveActiveIdx(html())).toBe(MANIFEST_ENTRIES.findIndex((e) => e.id === "about"));
    });
    // Above the midline the bio still owns the position.
    withMount(window.innerHeight, () =>
      expect(resolveActiveIdx(html(), "about")).toBe(
        MANIFEST_ENTRIES.findIndex((e) => e.id === "about")
      )
    );
    html().removeAttribute("data-active-station");
  });
});
