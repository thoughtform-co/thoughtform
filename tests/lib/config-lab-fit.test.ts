import { describe, expect, it } from "vitest";

import { toPdaWork } from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import { getCase } from "@/lib/cases/registry";

import { tightLettering } from "@/app/(internal)/test/intelligence-config-lab/VariantTight";
import { fusedLettering } from "@/app/(internal)/test/intelligence-config-lab/VariantFused";
import { bandsLettering } from "@/app/(internal)/test/intelligence-config-lab/VariantBands";
import { railLettering } from "@/app/(internal)/test/intelligence-config-lab/VariantRail";
import { satelliteLettering } from "@/app/(internal)/test/intelligence-config-lab/VariantSatellite";
import { ledgerLettering } from "@/app/(internal)/test/intelligence-config-lab/VariantLedger";
import { gridLettering } from "@/app/(internal)/test/intelligence-config-lab/VariantGrid";
import { seatedLettering } from "@/app/(internal)/test/intelligence-config-lab/VariantSeated";
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

/** ⚠ A VARIANT ABSENT FROM HERE IS UNGUARDED ON BOTH HALVES — fit AND the
 *  confidentiality envelope. Adding a drawing means adding a row. */
const VARIANTS = [
  ["tight", tightLettering],
  ["fused", fusedLettering],
  ["bands", bandsLettering],
  ["rail", railLettering],
  ["satellite", satelliteLettering],
  ["ledger", ledgerLettering],
  ["grid", gridLettering],
  ["seated", seatedLettering],
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
  it("every lettered string fits its measure — all 27 works × 7 variants", () => {
    for (const { variant, workId, spec } of allSpecs()) {
      const w = specWidth(spec);
      expect(
        w <= spec.measure,
        `${variant} · ${workId} · ${spec.slot} — "${spec.text}" letters ${w.toFixed(1)}u against a ${spec.measure}u measure`
      ).toBe(true);
    }
  });

  it("no single WORD runs through a wall", () => {
    /* ⚠ THE BINDING NUMBER IS A WORD, NOT A STRING. `wrapLines` breaks on
       spaces only, so a word longer than its measure overflows however well
       the value wraps — and every per-line assertion above still passes,
       because each LINE is short. `RECONCILIATION` (14) is the record's
       longest and it is what caps the value sizes here. */
    for (const { variant, workId, spec } of allSpecs()) {
      if (spec.measure === 0) continue;
      const longest = spec.text.split(" ").reduce((a, b) => (b.length > a.length ? b : a), "");
      expect(
        longest.length * spec.fs * (0.6 + spec.track) <= spec.measure,
        `${variant} · ${workId} · ${spec.slot} — the word "${longest}" is wider than its ${spec.measure}u box`
      ).toBe(true);
    }
  });

  it("no value wants a line past its cap", () => {
    /* `wrapLines` SLICES at its cap, so a value that wanted one more line
       would lose its tail silently and every fit assertion above would still
       pass. The line past the cap is declared with a ZERO measure for exactly
       that reason: this is the assertion that sees it. */
    for (const { variant, workId, spec } of allSpecs()) {
      expect(
        spec.measure > 0,
        `${variant} · ${workId} · ${spec.slot} wants a line past the cap: "${spec.text}"`
      ).toBe(true);
    }
  });

  it("nothing letters under the production crop's own floor", () => {
    /* ⚠ 10, NOT THE ARCHETYPES' 7.5. These seven draw in the PRODUCTION crop
       (828 × 912, portrait), whose meet at the binding lab preset is 0.540 —
       so 7.5 renders 4.05px against the capture gate's 4.3 floor, and 10
       renders 5.4. The old rung was legal in a 1000-wide landscape crop and
       is not legal here. */
    for (const { variant, workId, spec } of allSpecs()) {
      expect(spec.fs >= 10, `${variant} · ${workId} · ${spec.slot} letters at ${spec.fs}`).toBe(
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
