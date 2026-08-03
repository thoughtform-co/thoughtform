import { describe, expect, it } from "vitest";

import {
  EXIT_MARKS,
  JOURNEY_MARKS,
  LAB_MARKS,
  markState,
  type JourneyMark,
} from "@/components/landing/v7/rail-instruments/clusters";
import { MANIFEST_ENTRIES } from "@/lib/rail-manifest/entries";
import { READOUT_SECTIONS, sectionReadout } from "@/lib/rail-manifest/sectionLabel";

/**
 * The rail instruments' one hard invariant (ADR-059).
 *
 * GOLD IS WAYFINDING: it marks where you are and nothing else. Two gold
 * marks is not a cosmetic bug, it is the frame lying about your position —
 * and it is a very easy one to reintroduce, because the two corners run on
 * DIFFERENT CLOCKS and nothing throws when a mark is fed the wrong one.
 *
 * The specific trap this pins: `thesis` is a `corridor` entry, so
 * `READOUT_SECTIONS` collapses it into the single `arc` row. A row-clocked
 * Arc mark beside a beat-clocked Thesis mark puts BOTH in `here` for the
 * whole thesis beat. `ARC_MARK` dodges that with a beat RANGE, and this is
 * what stops someone "simplifying" it back to a row.
 */

const ALL_MARKS: readonly JourneyMark[] = [...JOURNEY_MARKS, ...EXIT_MARKS];

/** The seat the live hook derives, for a given manifest index. */
const seatFor = (activeIdx: number, proofOwnsServices: boolean) => {
  const { id } = sectionReadout(activeIdx, proofOwnsServices);
  return READOUT_SECTIONS.findIndex((row) => row.id === id);
};

const goldAt = (activeIdx: number, proofOwnsServices = false) =>
  ALL_MARKS.filter(
    (mark) => markState(mark, activeIdx, seatFor(activeIdx, proofOwnsServices)) === "here"
  ).map((mark) => mark.id);

const idxOf = (id: string) => MANIFEST_ENTRIES.findIndex((e) => e.id === id);

describe("rail instrument marks", () => {
  it("never lights two marks at once, at any position on either clock", () => {
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

  it("keeps Thesis and the Arc disjoint — the collapse trap", () => {
    // Both exist on the readout index as `arc`; only the beat clock can
    // tell them apart, which is why ARC_MARK is a beat RANGE.
    expect(goldAt(idxOf("thesis"))).toEqual(["thesis"]);
    for (const beat of ["navigate", "encode", "build"]) {
      expect(goldAt(idxOf(beat)), beat).toEqual(["arc"]);
    }
  });

  it("does not light the Arc on the hero", () => {
    // `sectionReadout` falls back to seat 0 for an id it does not know, and
    // `hero` is not a readout row — so a row-clocked Arc would be gold here.
    expect(goldAt(idxOf("hero"))).toEqual(["hero"]);
  });

  it("lights the casefile before the offer it introduces", () => {
    expect(goldAt(idxOf("services"), true)).toEqual(["proof"]);
    expect(goldAt(idxOf("services"), false)).toEqual(["services"]);
  });

  it("runs the journey in order and ends on contact", () => {
    expect(goldAt(idxOf("about"))).toEqual(["about"]);
    expect(goldAt(idxOf("contact"))).toEqual(["contact"]);
    // Everything before the live mark reads `passed`, everything after
    // `ahead` — no gaps, no marks stuck behind a range's end.
    const seat = seatFor(idxOf("about"), false);
    const states = ALL_MARKS.map((m) => markState(m, idxOf("about"), seat));
    expect(states).toEqual(["passed", "passed", "passed", "passed", "passed", "here", "ahead"]);
  });

  it("has no mark for #practice — a KNOWN hole, pending that section's removal", () => {
    // Pinned deliberately: if `practice` is ever given a mark, or the
    // section is deleted, this is the line that says so out loud rather
    // than the frame quietly going dark for a screen.
    expect(goldAt(idxOf("practice"))).toEqual([]);
  });

  it("seats every mark on a real row of the index it declares", () => {
    for (const mark of ALL_MARKS) {
      const source = mark.clock === "beat" ? MANIFEST_ENTRIES : READOUT_SECTIONS;
      expect(source[mark.idx], `${mark.id}.idx`).toBeDefined();
      if (mark.idxEnd !== undefined) {
        expect(source[mark.idxEnd], `${mark.id}.idxEnd`).toBeDefined();
        expect(mark.idxEnd, `${mark.id} range`).toBeGreaterThan(mark.idx);
      }
    }
  });

  it("gives the lab exactly what the two corners render", () => {
    expect(LAB_MARKS.map((m) => m.id)).toEqual(ALL_MARKS.map((m) => m.id));
  });
});
