import { describe, expect, it } from "vitest";

import { toPdaWork } from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import { getCase } from "@/lib/cases/registry";

import {
  dieClusterFits,
  dieLettering,
} from "@/app/(internal)/test/intelligence-config-lab/VariantDie";
import { chainLettering } from "@/app/(internal)/test/intelligence-config-lab/VariantChain";
import { sectionLettering } from "@/app/(internal)/test/intelligence-config-lab/VariantSection";
import { schematicLettering } from "@/app/(internal)/test/intelligence-config-lab/VariantSchematic";
import {
  switchboardBankFits,
  switchboardLettering,
} from "@/app/(internal)/test/intelligence-config-lab/VariantSwitchboard";
import { offsetPolyline, ribbonPaths } from "@/app/(internal)/test/intelligence-config-lab/ribbon";
import {
  type IclRecord,
  type LetterSpec,
  specWidth,
} from "@/app/(internal)/test/intelligence-config-lab/variants";

/**
 * THE CONFIG LAB'S FIT + ENVELOPE GUARD.
 *
 * The lab's variants are look-dev, but they letter LIVE record strings — and
 * SVG `<text>` neither wraps nor reports overflow, so fit is asserted
 * arithmetically here (the pda-viewbox precedent) over ALL 27 works × all 4
 * experimental variants, not just the subject on screen.
 *
 * ⚠ THE ENVELOPE HALF EXISTS BECAUSE THE LAB IS MECHANICALLY UNGUARDED.
 * `cases-registry.test.ts` walks `CASES` + `PROJECT_CASES` objects only —
 * component code is never scanned — so a lab page is where a personal name,
 * vendor, model family or currency string could survive unnoticed. Every
 * variant declares everything it letters via `lettering()`, and this test
 * walks those declarations with the registry's own patterns. A lettered
 * string that is not declared is a defect in the variant, not a gap here.
 */

const record = (() => {
  const loop = getCase("loop-earplugs");
  const visual = loop?.casefile.tracks.find((t) => t.id === "ai-transformation")?.visual;
  if (!visual || visual.kind !== "intelligence-map") throw new Error("no intelligence-map track");
  return {
    shapes: visual.shapes,
    districts: visual.districts,
    works: visual.works,
    chains: visual.chains ?? [],
    skills: visual.skills,
  } satisfies IclRecord;
})();

const VARIANTS = [
  ["die", dieLettering],
  ["chain", chainLettering],
  ["section", sectionLettering],
  ["schematic", schematicLettering],
  ["switchboard", switchboardLettering],
] as const;

const allSpecs = (): { variant: string; workId: string; spec: LetterSpec }[] => {
  const out: { variant: string; workId: string; spec: LetterSpec }[] = [];
  for (const work of record.works) {
    const pda = toPdaWork(
      work,
      record.districts.find((d) => d.id === work.dist)
    );
    for (const [variant, lettering] of VARIANTS) {
      for (const spec of lettering(pda, work, record)) out.push({ variant, workId: work.id, spec });
    }
  }
  return out;
};

describe("intelligence-config lab · fit", () => {
  it("every lettered string fits its measure — all 27 works × 4 variants", () => {
    for (const { variant, workId, spec } of allSpecs()) {
      const w = specWidth(spec);
      expect(
        w <= spec.measure,
        `${variant} · ${workId} · ${spec.slot} — "${spec.text}" letters ${w.toFixed(1)}u against a ${spec.measure}u measure`
      ).toBe(true);
    }
  });

  it("the Die's symbol clusters fit their rails (the density experiment's own guard)", () => {
    for (const row of dieClusterFits(record)) {
      expect(
        row.width <= row.measure,
        `die cluster ${row.key} — ${row.width.toFixed(1)}u of symbols against ${row.measure}u of rail`
      ).toBe(true);
    }
  });

  it("the Switchboard's banks fit their corners of the board", () => {
    for (const row of switchboardBankFits(record)) {
      expect(
        row.width <= row.measure,
        `switchboard bank ${row.key} — widest row ${row.width.toFixed(1)}u against ${row.measure}u of room`
      ).toBe(true);
    }
  });

  it("ribbon offsets stay parallel and re-intersect at bends", () => {
    // A straight run offsets to a straight parallel run.
    const straight = offsetPolyline(
      [
        [0, 0],
        [100, 0],
      ],
      5
    );
    expect(straight).toEqual([
      [0, 5],
      [100, 5],
    ]);
    // An H→V corner keeps the conductor count and the corner point sits at
    // the intersection of the two shifted segments (constant pitch).
    const cornered = offsetPolyline(
      [
        [0, 0],
        [50, 0],
        [50, 60],
      ],
      4
    );
    expect(cornered).toHaveLength(3);
    expect(cornered[1][0]).toBeCloseTo(46, 5);
    expect(cornered[1][1]).toBeCloseTo(4, 5);
    // n conductors → n paths.
    expect(
      ribbonPaths(
        [
          [0, 0],
          [40, 0],
          [52, 12],
          [52, 80],
        ],
        6,
        3.5
      )
    ).toHaveLength(6);
  });

  it("no variant letters below the micro rung", () => {
    for (const { variant, workId, spec } of allSpecs()) {
      expect(spec.fs >= 7, `${variant} · ${workId} · ${spec.slot} letters at ${spec.fs}`).toBe(
        true
      );
    }
  });
});

describe("intelligence-config lab · envelope", () => {
  /* The registry test's own patterns (cases-registry.test.ts:27,927-935),
     applied to every string the lab declares it letters. */
  const BANNED: readonly { label: string; re: RegExp }[] = [
    { label: "money", re: /[€$£¥]|\b(USD|EUR|GBP)\b|\b\d{1,3}(,\d{3})+\b/ },
    { label: "a source URL", re: /\b(monday|notion|github|figma)\.com\b/i },
    {
      label: "a model family",
      re: /\b(opus|sonnet|haiku|fable|gpt|gemini|llama|mistral|claude)\b/i,
    },
    {
      label: "a vendor or private system",
      re: /\b(openai|anthropic|supabase|slack|aether|salesforce)\b/i,
    },
    {
      label: "a personal name",
      re: /\b(Vince|Astrid|Nathan|Koen|Olga|Helen|Damien|Robert|Toby|Maud)\b/i,
    },
    /* Unit-conflation guards: districts are never teams, and the exact
       reservoir total never hedges to `47+` beside its own summable parts. */
    { label: "the district count published as teams", re: /\b8\+?\s+teams?\b/i },
    { label: "a hedged reservoir total", re: /\b47\s*\+/ },
  ];

  it("holds the confidentiality envelope over every lettered string", () => {
    for (const { variant, workId, spec } of allSpecs()) {
      for (const b of BANNED) {
        expect(
          b.re.test(spec.text),
          `${variant} · ${workId} · ${spec.slot} letters ${b.label}: "${spec.text}"`
        ).toBe(false);
      }
    }
  });
});
