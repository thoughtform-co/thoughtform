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
import { cardsLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantCards";
import { strataLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantStrata";
import { tableLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantTable";
import { densityLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantDensity";
import { fieldLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantField";
import { galleryLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantGallery";
import { rackLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantRack";
import { registryLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantRegistry";
import {
  SAMPLE_SKILLS,
  SAMPLE_TEAMS,
  SAMPLE_TOTALS,
} from "@/app/(internal)/test/intelligence-substrate-lab/sampleSkills";
import { sealsLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantSeals";
import { terminalLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantTerminal";
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
  /* rack is a relational variant like strata/table/tree, so it letters
     three head strings, four identity strings per shape, and the tapping
     department codes — its minimum is 3 + 20 = 23 before any tap. */
  ["rack", rackLettering, 20],
  /* gallery shares FormCard with density and field, so it inherits their
     15-spec floor and adds one etch. */
  ["gallery", galleryLettering, 15],
  /* registry letters five columns × (name + count + Σ(title lines + team))
     from the 47-Skill fixture — its minimum with every title on one line
     is 5 heads × 2 + 47 skills × 2 + 1 etch = 105. Two-line wraps push it
     higher; 100 is the floor so the guard fails if a whole column drops. */
  ["registry", registryLettering, 100],
  /* terminal letters 5 pattern rules × 2 + 47 skills × 2 (title/team)
     + 5 cut tags + 1 etch = 110 minimum. Owner was dropped when the
     drawing went to two columns to clear the fit-meter's bbox floor. */
  ["terminal", terminalLettering, 100],
  /* cards letters cardSpecs per pattern (5 × 5 = 25) + 47 short-title
     labels = 72 minimum. Same card frame as gallery + one label per
     Skill from the fixture; the head and foot are byte-identical. */
  ["cards", cardsLettering, 65],
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
  /* The original ban was `\bteams?\b` (case-insensitive, ANY occurrence).
     That over-caught two live cases:
       - loop_aether's actual Skill title "People-team Voice" and the
         owner string "TA team" — proper names, not unit publications
       - the fixture-based variants' honest "14 TEAMS" etch, where 14 is
         loop_aether's real team count owning the 47 Skills
     Neither is the defect this guard exists to catch. The defect was
     `${N} TEAMS` on the SHIPPED pin grid, where N was a DISTRICT count
     (≤ 8) mislabelled as "teams" — a lie about the unit.
     Two tightenings:
       1. Regex catches uppercase-only, digit-adjacent phrases, so proper
          names in the fixture (lowercase "team") no longer match.
       2. Only DISTRICT-based variants are checked, because that is the
          data lineage the defect existed in. Fixture-based variants use
          loop_aether's real teams, and their team count is honest. */
  const TEAMS_UNIT = /\b\d+\s*TEAMS?\b|\bTEAMS?\s*\d+\b/;
  const FIXTURE_VARIANTS = new Set(["registry", "terminal"]);

  for (const [name, lettering] of VARIANTS) {
    if (FIXTURE_VARIANTS.has(name)) continue;
    it(`${name}: never publishes a department count as teams`, () => {
      for (const s of lettering(record())) {
        expect(
          TEAMS_UNIT.test(s.text),
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

  it("the lab's sample fixture agrees with the record's aggregate", () => {
    /* `sampleSkills` mirrors loop_aether's /claude-adoption roster; the
       shipped record aggregates its counts. Registry and terminal both
       draw from the fixture, so if these two disagree the reader sees a
       different 47 depending on which variant they open. */
    const r = record();
    expect(SAMPLE_SKILLS).toHaveLength(SAMPLE_TOTALS.total);
    expect(SAMPLE_TOTALS.total).toBe(47);
    expect(SAMPLE_TEAMS).toHaveLength(14);

    for (const shape of r.shapes) {
      const fixtureCount = SAMPLE_SKILLS.filter((s) => s.substrate === shape.key).length;
      expect(
        fixtureCount,
        `record's ${shape.key} says ${shape.skills} Skills, fixture holds ${fixtureCount}`
      ).toBe(shape.skills);
    }
  });

  it("every substrate has exactly one flagship `cut` Skill in the fixture", () => {
    /* The green-ink cutter grammar is what carries the shipped `CUT BY`
       claim down to the Skill level. Two cutters in one substrate would
       ink two greens per column, none would leave the pattern's flagship
       unclaimed — either drifts the reading's argument. */
    const bySubstrate = new Map<string, number>();
    for (const s of SAMPLE_SKILLS) {
      if (s.cut) bySubstrate.set(s.substrate, (bySubstrate.get(s.substrate) ?? 0) + 1);
    }
    expect(bySubstrate.size).toBe(5);
    for (const [substrate, n] of bySubstrate) {
      expect(n, `${substrate} has ${n} cutters, must be exactly 1`).toBe(1);
    }
  });

  it("every fixture team code is exactly three characters, uppercase", () => {
    /* The pin-grid abscissa is three-letter district codes; the fixture
       uses three-letter TEAM codes so the two vocabularies read as the
       same kind of thing. `LEG` is both a district and a team, on
       purpose — the fixture inherits the shipped code where it can. */
    for (const t of SAMPLE_TEAMS) {
      expect(t.code, `team code ${t.code}`).toMatch(/^[A-Z]{3}$/);
    }
    const known = new Set(SAMPLE_TEAMS.map((t) => t.code));
    for (const s of SAMPLE_SKILLS) {
      expect(known.has(s.team), `Skill ${s.id} references unknown team ${s.team}`).toBe(true);
    }
  });

  it("every fixture Skill declares a shortTitle inside the card measure", () => {
    /* The card variant (11) prints `shortTitle` inside a 132u module
       window at fs 12 track .08 — 14 characters is the hard cap that
       fits without wrapping, so the drawing can render a single line
       per Skill. A shortTitle longer than 14 chars is a drawing that
       will overflow silently, because SVG text does not wrap or
       ellipsise. */
    for (const s of SAMPLE_SKILLS) {
      expect(s.shortTitle, `Skill ${s.id} has no shortTitle`).toBeTruthy();
      expect(
        s.shortTitle.length,
        `Skill ${s.id} shortTitle "${s.shortTitle}" is ${s.shortTitle.length} chars — cap is 14`
      ).toBeLessThanOrEqual(14);
      expect(
        s.shortTitle.length,
        `Skill ${s.id} shortTitle "${s.shortTitle}" is blank`
      ).toBeGreaterThan(0);
    }
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
