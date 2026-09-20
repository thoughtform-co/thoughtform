import { describe, expect, it } from "vitest";

import { kitSections } from "@/app/(internal)/test/subpage-kit/fixtures";
import { CLIENTS, clientPageCount } from "@/lib/arcs/clients";
import { PROPOSAL_COPY_BANS, scanStrings } from "@/lib/arcs/copyLaw";
import { arcsOf } from "@/lib/arcs/registry";
import type { MusingPost } from "@/lib/musings/types";
import { arcsSheetSections, clientSheetSections } from "@/lib/sheet/arcs";
import {
  SHEET_CHAPTER_CAP,
  chaptersOf,
  compositionViolations,
  ordinalOf,
} from "@/lib/sheet/composition";
import { homeSessionsSections } from "@/lib/sheet/home-sessions";
import { musingPostSections, musingsIndexSections } from "@/lib/sheet/musings";
import { SHEET_ARRANGEMENTS } from "@/lib/sheet/types";
import type { SheetSection } from "@/lib/sheet/types";

/**
 * The variety law, walked over every real page (ADR-114).
 *
 * The owner's sentence — "it's very important that there's some variety in
 * how we build blocks … not every section has just three blocks" — is a
 * rule about a LADDER, and a ladder is data, so the half of it a grader
 * cannot coin-flip is asserted here on the sections themselves: split
 * first, close last, no two consecutive sections of one kind, no kind more
 * than twice, at least three kinds, one lit node, one open step, at most
 * five chapters. The rubric's block F asks the same of a still.
 */

const NOW = new Date("2026-09-20T09:00:00Z");

function post(slug: string, over: Partial<MusingPost> = {}): MusingPost {
  return {
    slug,
    title: `A post called ${slug}`,
    date: "2026-09-14",
    summary: "One sentence that says what the post is about.",
    tags: ["practice"],
    author: "Vince Buyssens",
    draft: false,
    featured: false,
    related: [],
    readingMinutes: 2,
    body: "The body.",
    ...over,
  };
}

const POSTS = [post("one", { featured: true }), post("two", { date: "2026-09-07" }), post("three")];

const LADDERS: Record<string, SheetSection[]> = {
  arcs: arcsSheetSections(),
  ...Object.fromEntries(
    CLIENTS.filter((c) => clientPageCount(c, arcsOf(c.slug)) > 0).map((c) => [
      `arcs/${c.slug}`,
      clientSheetSections(c),
    ])
  ),
  "home-sessions": homeSessionsSections(NOW),
  musings: musingsIndexSections(POSTS, POSTS.slice(0, 2)),
  "musings/post": musingPostSections(POSTS[0], POSTS.slice(1)),
  kit: kitSections(NOW),
};

/** Minimal sections for the law's own cases. */
function mk(
  kind: SheetSection["kind"],
  id: string,
  extra: Record<string, unknown> = {}
): SheetSection {
  const base = { id, kicker: id };
  switch (kind) {
    case "split":
      return {
        ...base,
        kind,
        name: "N",
        title: { pre: "T" },
        paragraphs: ["p"],
        ...extra,
      } as SheetSection;
    case "row":
      return {
        ...base,
        kind,
        items: [{ id: id + "-r", title: "t", tags: [], body: "b" }],
        ...extra,
      } as SheetSection;
    case "cells":
      return {
        ...base,
        kind,
        n: 2,
        cells: [
          { id: id + "-a", kicker: "k", body: ["b"] },
          { id: id + "-b", kicker: "k", body: ["b"] },
        ],
        ...extra,
      } as SheetSection;
    case "console":
      return {
        ...base,
        kind,
        consoles: [
          {
            id: id + "-c",
            panel: { name: "n", readout: [], lede: "l" },
            cards: [],
          },
        ],
        ...extra,
      } as SheetSection;
    case "timeline":
      return {
        ...base,
        kind,
        axis: { from: "2026-10", to: "2027-01" },
        items: [{ id: id + "-t", date: "2026-10-15", title: "t" }],
        lit: id + "-t",
        ...extra,
      } as SheetSection;
    case "steps":
      return {
        ...base,
        kind,
        items: [{ id: id + "-s", when: "w", title: "t" }],
        open: id + "-s",
        ...extra,
      } as SheetSection;
    case "table":
      return { ...base, kind, columns: ["a", "b", "c", "d"], rows: [], ...extra } as SheetSection;
    case "figure":
      return {
        ...base,
        kind,
        items: [{ id: id + "-f", figure: { kind: "mark", caption: "c" } }],
        ...extra,
      } as SheetSection;
    case "prose":
      return { ...base, kind, meta: [], ...extra } as SheetSection;
    case "close":
      return { ...base, kind, ...extra } as SheetSection;
  }
}

const LAWFUL: SheetSection[] = [
  mk("split", "a"),
  mk("row", "b"),
  mk("cells", "c"),
  mk("figure", "d"),
  mk("close", "e"),
];

describe("the sheet's variety law (ADR-114)", () => {
  it("every real page passes, and every section is a lawful arrangement", () => {
    for (const [name, ladder] of Object.entries(LADDERS)) {
      expect(compositionViolations(ladder), name).toEqual([]);
      for (const s of ladder) expect(SHEET_ARRANGEMENTS, `${name}: ${s.id}`).toContain(s.kind);
      const ids = ladder.map((s) => s.id);
      expect(new Set(ids).size, `${name}: duplicate section ids`).toBe(ids.length);
      /* Every section with a menu label is a drawer entry; the CAP is on the
         header's inline row, which only the `menuPrimary` ones join. */
      expect(
        chaptersOf(ladder).filter((c) => c.primary).length,
        `${name}: primary chapters`
      ).toBeLessThanOrEqual(SHEET_CHAPTER_CAP);
    }
  });

  it("the lawful fixture passes and each broken one fails", () => {
    expect(compositionViolations(LAWFUL)).toEqual([]);
    const broken: [string, SheetSection[]][] = [
      ["no split first", [mk("row", "a"), mk("cells", "b"), mk("figure", "c"), mk("close", "d")]],
      ["no close last", [mk("split", "a"), mk("row", "b"), mk("cells", "c"), mk("figure", "d")]],
      [
        "a second split",
        [mk("split", "a"), mk("row", "b"), mk("split", "c"), mk("cells", "d"), mk("close", "e")],
      ],
      [
        "two consecutive of one kind",
        [mk("split", "a"), mk("row", "b"), mk("row", "c"), mk("cells", "d"), mk("close", "e")],
      ],
      [
        "a kind three times",
        [
          mk("split", "a"),
          mk("row", "b"),
          mk("cells", "c"),
          mk("row", "d"),
          mk("figure", "e"),
          mk("row", "f"),
          mk("close", "g"),
        ],
      ],
      ["fewer than three kinds", [mk("split", "a"), mk("close", "c")]],
      [
        "three cells twice",
        [
          mk("split", "a"),
          mk("cells", "b", {
            n: 3,
            cells: [
              { id: "b1", kicker: "k", body: ["b"] },
              { id: "b2", kicker: "k", body: ["b"] },
              { id: "b3", kicker: "k", body: ["b"] },
            ],
          }),
          mk("row", "c"),
          mk("cells", "d", {
            n: 3,
            cells: [
              { id: "d1", kicker: "k", body: ["b"] },
              { id: "d2", kicker: "k", body: ["b"] },
              { id: "d3", kicker: "k", body: ["b"] },
            ],
          }),
          mk("close", "e"),
        ],
      ],
      [
        "a timeline lighting nothing",
        [
          mk("split", "a"),
          mk("timeline", "b", { lit: "nowhere" }),
          mk("row", "c"),
          mk("close", "d"),
        ],
      ],
      [
        "steps with nothing open",
        [mk("split", "a"), mk("steps", "b", { open: "nowhere" }), mk("row", "c"), mk("close", "d")],
      ],
      ["a duplicate id", [mk("split", "a"), mk("row", "a"), mk("cells", "c"), mk("close", "d")]],
    ];
    for (const [name, ladder] of broken) {
      expect(compositionViolations(ladder).length, name).toBeGreaterThan(0);
    }
  });

  it("chapters are capped at five and the overview's are the client consoles", () => {
    const many: SheetSection[] = [
      mk("split", "a"),
      ...["b", "c", "d", "e", "f", "g"].map((id, i) =>
        mk(i % 2 ? "row" : "cells", id, { menuLabel: id, menuPrimary: true })
      ),
      mk("close", "z"),
    ];
    expect(compositionViolations(many).some((v) => /chapter/i.test(v))).toBe(true);

    const chapters = chaptersOf(LADDERS.arcs).filter((c) => c.primary);
    const clients = CLIENTS.filter((c) => clientPageCount(c, arcsOf(c.slug)) > 0);
    expect(chapters.map((c) => c.id)).toEqual(clients.map((c) => c.slug));
  });

  it("ordinals count the sections after the split, two digits, and the split has none", () => {
    const ladder = LADDERS["home-sessions"];
    expect(ordinalOf(ladder, 0)).toBeNull();
    const ords = ladder.slice(1, -1).map((_, i) => ordinalOf(ladder, i + 1));
    expect(ords.every((o) => o !== null && /^\d\d$/.test(o))).toBe(true);
    expect(ords).toEqual([...ords].sort());
  });

  it("composed strings hold the copy law, and the sessions page prints no money", () => {
    /* A readout value, a kicker or a caption is built by a renderer or a
       projection, outside every content scanner (ADR-070 U15) — so the
       ladders themselves are walked here, every string, against the bans a
       client-facing page holds. */
    for (const [name, ladder] of Object.entries(LADDERS)) {
      scanStrings(ladder, name, (value, path) => {
        expect(value, `${path}: an unrendered value`).not.toMatch(/undefined|\bNaN\b|\[object/);
        /* The arcs ladders carry the decks' own card copy, which answers to
           the arcs registry's law (a workshop lede may say "—"; a proposal
           may not); the readouts they compose are walked in sheet-arcs. */
        if (name === "kit" || name.startsWith("arcs")) return;
        for (const [re, why] of PROPOSAL_COPY_BANS)
          expect(value, `${path}: ${why}`).not.toMatch(re);
      });
    }
    scanStrings(LADDERS["home-sessions"], "home-sessions", (value, path) => {
      expect(value, `${path}: a price`).not.toMatch(
        /[€$£]|\b(EUR|USD|GBP)\b|\d{1,3}(?:[.,]\d{3})+/
      );
    });
  });
});
