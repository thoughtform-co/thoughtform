import { describe, expect, it } from "vitest";

import {
  crossing,
  selectWorks,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import { getCase } from "@/lib/cases/registry";

import {
  specWidth,
  type LetterSpec,
} from "@/app/(internal)/test/intelligence-substrate-lab/substrateKit";
import { strataLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantStrata";
import { tableLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantTable";
import { densityLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantDensity";
import { fieldLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantField";
import { sealsLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantSeals";
import { treeLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantTree";
import type { IslRecord } from "@/app/(internal)/test/intelligence-substrate-lab/variants";

/**
 * THE SUBSTRATE LAB'S FIT AND ENVELOPE GUARD.
 *
 * ⚠ THE LAB PAGE IS MECHANICALLY UNGUARDED OTHERWISE. `cases-registry.test.ts`
 * walks `CASES` and `PROJECT_CASES` objects, never component code — so every
 * string a variant letters is declared through a pure `lettering()` and this
 * walks those declarations. A lettered string that is not in `lettering()` is
 * a defect in the drawing, not an economy in the guard.
 *
 * ⚠ A VARIANT ABSENT FROM `VARIANTS` BELOW IS UNGUARDED ON EVERY CHECK.
 */

const FS_FLOOR = 12;

function record(): IslRecord {
  const visual = getCase("loop-earplugs")?.casefile.tracks.find(
    (t) => t.visual.kind === "intelligence-map"
  )?.visual;
  if (!visual || visual.kind !== "intelligence-map") throw new Error("no intelligence-map track");
  const shown = selectWorks(visual.districts, visual.works);
  const cross = crossing(visual.shapes, visual.districts, visual.works, shown);
  return { teams: cross.teams, shapes: cross.shapes };
}

/**
 * ⚠ THE THIRD FIELD IS THE FLOOR ON HOW MUCH A VARIANT LETTERS, and it is
 * per-variant on purpose. A blanket ">20" was right while every direction was
 * a table or a stack, but the owner's three card/sigil directions are
 * deliberately sparse — a seal set NAMES five things and shows the rest.
 * Keeping one number would have forced them to letter more than they mean to,
 * which is the guard writing the drawing.
 */
const VARIANTS: readonly [string, (r: IslRecord) => LetterSpec[], number][] = [
  ["strata", strataLettering, 20],
  ["table", tableLettering, 20],
  ["tree", treeLettering, 20],
  ["seals", sealsLettering, 15],
  ["density", densityLettering, 15],
  ["field", fieldLettering, 15],
];

describe("the substrate lab's drawings fit their boxes", () => {
  for (const [name, lettering, minSpecs] of VARIANTS) {
    it(`${name}: every string fits the measure it declares`, () => {
      const specs = lettering(record());
      expect(specs.length, `${name} letters nothing`).toBeGreaterThanOrEqual(minSpecs);
      for (const s of specs) {
        expect(s.text.length, `${name} ${s.slot} is blank`).toBeGreaterThan(0);
        expect(
          specWidth(s),
          `${name} ${s.slot}: "${s.text}" runs past its ${s.measure}u measure`
        ).toBeLessThanOrEqual(s.measure);
      }
    });

    it(`${name}: no single WORD runs through a wall`, () => {
      /* ⚠ THE BINDING NUMBER IS A WORD, NOT A STRING. Nothing here wraps, but
         the rule that caught `RECONCILIATION` on reading 02 is worth keeping
         pointed at a drawing whose longest string is a 38-character gloss. */
      for (const s of lettering(record())) {
        const longest = s.text.split(" ").reduce((a, b) => (b.length > a.length ? b : a), "");
        expect(
          longest.length * s.fs * (0.6 + s.track),
          `${name} ${s.slot}: the word "${longest}" is wider than its ${s.measure}u box`
        ).toBeLessThanOrEqual(s.measure);
      }
    });

    it(`${name}: nothing letters under the floor the owner set`, () => {
      /* 12 since ADR-070 U10. These crops share reading 02's width, so the
         rendered size of a rung is identical: 7.76px at 1280×720. */
      for (const s of lettering(record())) {
        expect(s.fs, `${name} ${s.slot} letters at ${s.fs}`).toBeGreaterThanOrEqual(FS_FLOOR);
      }
    });
  }
});

describe("the substrate's unit is DEPARTMENTS", () => {
  /**
   * ⚠ THIS IS A LIVE DEFECT IN PRODUCTION'S READING 03, and the reason this
   * guard exists before a winner is picked.
   *
   * `PdaViews.ViewSubstrate` letters `${s.skills} SKILLS · ${s.teams} TEAMS`,
   * and for PATTERN — which all eight departments draw on — that renders
   * **8 TEAMS**. `cases-registry`'s district guard names that exact phrase as
   * its failure mode: 8 is the DEPARTMENT count, while 22 teams BRIEFED and
   * 14 teams USING THE LAYER are different units and different sets. It
   * survives only because that guard does `JSON.stringify` over the CONTENT
   * objects, and this string is composed at render time in a component, where
   * no scanner reaches it.
   *
   * So no drawing here letters the word at all — the tap marks carry the
   * count, which is the hierarchy argument anyway.
   */
  for (const [name, lettering] of VARIANTS) {
    it(`${name}: never publishes a department count as teams`, () => {
      for (const s of lettering(record())) {
        expect(
          /\bteams?\b/i.test(s.text),
          `${name} ${s.slot} letters "${s.text}" — the unit on this reading is DEPARTMENTS`
        ).toBe(false);
      }
    });
  }

  it("the record still has eight departments and five shapes", () => {
    // If either moves, every variant's column and row math moves with it.
    const r = record();
    expect(r.teams).toHaveLength(8);
    expect(r.shapes).toHaveLength(5);
    expect(
      r.shapes.reduce((n, s) => n + s.skills, 0),
      "the 47 stopped adding up"
    ).toBe(47);
  });

  it("every shape names the department that cut it, and it is a real one", () => {
    const r = record();
    const ids = new Set(r.teams.map((t) => t.ab));
    for (const s of r.shapes) {
      expect(ids.has(s.trenchedBy), `${s.key} is cut by an unknown department`).toBe(true);
    }
  });
});

describe("the substrate lab keeps the map's envelope", () => {
  /* The same regexes `cases-registry` holds over the map's own copy — money,
     model families and personal initials — applied to strings this scanner
     would otherwise never see. */
  const MONEY = /[$€£¥]|\b(usd|eur|gbp)\b|\d{1,3}(,\d{3})+/i;
  const MODELS = /\b(opus|sonnet|haiku|fable|gpt|gemini|llama|mistral|claude)\b/i;

  for (const [name, lettering] of VARIANTS) {
    it(`${name}: no money, no model families`, () => {
      for (const s of lettering(record())) {
        expect(MONEY.test(s.text), `${name} ${s.slot} publishes money: "${s.text}"`).toBe(false);
        expect(MODELS.test(s.text), `${name} ${s.slot} names a model: "${s.text}"`).toBe(false);
      }
    });
  }
});
