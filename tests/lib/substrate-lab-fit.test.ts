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
import { backplaneLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantBackplane";
import { busLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantBus";
import {
  constellationLettering,
  constellationMarkCount,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantConstellation";
import { cutawayLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantCutaway";
import {
  handLettering,
  handMarkCount,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantHand";
import {
  leavesLettering,
  leavesMarkCount,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantLeaves";
import {
  loomLettering,
  loomMarkCount,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantLoom";
import {
  pilesLettering,
  pilesMarkCount,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantPiles";
import {
  rootsLettering,
  rootsMarkCount,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantRoots";
import { strataLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantStrata";
import { tableLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantTable";
import { densityLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantDensity";
import { fieldLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantField";
import {
  facetLettering,
  facetMarkCount,
  facetMass,
  facetSeats,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantFacet";
import { galleryLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantGallery";
import {
  vesselLettering,
  vesselMarkCount,
  vesselMass,
} from "@/app/(internal)/test/intelligence-substrate-lab/vesselRig";
import {
  pinbankLettering,
  pinbankMarkCount,
  pinbankMass,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantPinbank";
import {
  stackLettering,
  stackMarkCount,
  stackMass,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantStack";
import {
  tanksLettering,
  tanksMarkCount,
  tanksMass,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantTanks";
import {
  gateLettering,
  gateMarkCount,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantGate";
import {
  gradeLettering,
  gradeMass,
  gradeTicks,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantGrade";
import {
  mosaicLettering,
  mosaicMass,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantMosaic";
import {
  inlayLettering,
  inlayMarkCount,
  inlayMass,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantInlay";
import {
  runsLettering,
  runsMarkCount,
  runsMass,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantRuns";
import {
  wheelLettering,
  wheelMarkCount,
  wheelMass,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantWheel";
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
  /* Round-four SELECTED-WORK-AWARE directions. They letter the record's
     five patterns + a handful of REPRESENTATIVE plates per pattern, plus a
     `+N MORE` per pattern with a remainder. Kept on record as rejected
     directions (owner, 2026-08-14): the cartridge frame means WORKSTREAM
     on this surface and may not anchor the substrate reading. */
  /* backplane: 5 patterns × (name + count + 2 plates × 2) = 30, plus one
     `+N MORE` per pattern that has one (all five, since PLATES_PER_BAY=2). */
  ["backplane", backplaneLettering, 30],
  /* bus: 5 × (name + count + 3 plates × 2) = 40, plus per-pattern `+N MORE`
     (up to five when every pattern has a remainder — Voice with 7 has 4
     more, etc.). */
  ["bus", busLettering, 40],
  /* cutaway: `bus`-shaped + one GRADE etch spec. */
  ["cutaway", cutawayLettering, 41],
  /* Round-five ESTATE-SCOPED cluster directions. Every one draws N marks
     per pattern (one per encoded Skill) and letters ONLY the identity
     block (name + count) + one flagship. Gloss is dropped: the 38-char
     "HOW THE ORGANISATION SOUNDS IN CONTEXT" does not fit a 176-unit
     column at a legible size, and the cluster's SHAPE is the more direct
     answer to "what is a pattern" than a sentence beside it. */
  /* hand · piles · leaves — name + count + flagship = 3 × 5 = 15. */
  ["hand", handLettering, 15],
  ["piles", pilesLettering, 15],
  ["leaves", leavesLettering, 15],
  /* constellation letters the hub total + label + (name + count +
     flagship) × 5 = 2 + 15 = 17. */
  ["constellation", constellationLettering, 17],
  /* loom letters (name + count + flagship) × 5 + 3 substrate-chip
     strings = 15 + 3 = 18. */
  ["loom", loomLettering, 18],
  /* roots letters (name + count + flagship) × 5 + 1 bus claim = 16. */
  ["roots", rootsLettering, 16],

  /* ── Round six · THE DEFINITION LEADS ──────────────────────────────────
     Every direction letters the SAME five facts per pattern through the
     shared `patternSpecs` — name · count · gloss · evalMethod · flagship —
     which is why these floors are uniform where round five's were bespoke.
     Round five dropped the gloss to buy room for mass and ended up saying
     less than the drawing it was replacing; round six's whole premise is
     that the definition is the subject, so a direction that letters fewer
     than five per pattern has abandoned the round rather than economised.

     5 facts × 5 patterns = 25, with the gloss on one line. */
  ["runs", runsLettering, 25],
  ["gate", gateLettering, 25],
  ["grade", gradeLettering, 25],
  /* mosaic's blocks are unequal, so its gloss may take two lines in the
     narrow column and one in the wide — 25 is the floor either way. */
  ["mosaic", mosaicLettering, 25],
  /* wheel's blocks are 220u, which wraps every gloss to two lines: 6 × 5 =
     30, plus the core's total and its label. */
  ["wheel", wheelLettering, 32],
  /* facet letters no COUNT — the wedge's size is the count, and a numeral
     beside it would be the surface saying one thing twice. So 4 facts × 5 =
     20, plus the core's total and its label. */
  ["facet", facetLettering, 22],

  /* ── Round seven · THE INSTRUMENT REGISTER ─────────────────────────────
     Same five facts per pattern through `patternSpecs`, plus each drawing's
     own chrome. `tanks` letters 5 facts × 5 + the manifold's claim = 26;
     `pinbank` drops the count (its pins are the number) for 4 × 5 + three
     strings on the housing = 23; `stack` keeps the count and letters two on
     its head band = 27. */
  ["tanks", tanksLettering, 26],
  ["pinbank", pinbankLettering, 23],
  ["stack", stackLettering, 27],

  /* ── Round eight · the vessel rig ──────────────────────────────────────
     ⚠ 30, 31 and 32 SHARE ONE LETTERING FUNCTION because they share one rig —
     only `vesselPath` differs. Listing all three is not redundant: the tuple
     is what makes each an ENTRY in the guard, so a silhouette that grew its
     own strings later would be walked rather than silently trusted. */
  ["flasks", vesselLettering, 26],
  ["cells", vesselLettering, 26],
  ["vats", vesselLettering, 26],

  /* ── Round nine · the owner's pick, given its material ──────────────────
     ⚠ `inlay` IS THE ONE DIRECTION HERE THAT DOES NOT LETTER FIVE FACTS, and
     the round-six floor above does not apply to it. The owner cut the drawing
     to a title and one paragraph (2026-08-16): `gloss`, `evalMethod` and the
     flagship's name are no longer drawn, on the grounds that five stacked
     fragments is not something anybody reads.

     So the floor is name + count + the paragraph's own lines — 3 × 5 = 15 with
     every paragraph on one line, and the record's five all wrap to two in the
     narrower column. 20 is the floor, which fails if a whole paragraph drops
     while still allowing a shorter one to land on a single line.

     ⚠ It letters its OWN specs rather than `patternSpecs`: the shared emitter
     declares five facts, and declaring two strings this drawing does not paint
     would be a guard walking text that is not on screen — which passes. */
  ["inlay", inlayLettering, 20],
];

/**
 * ⚠ ROUND-FIVE DIRECTIONS DRAW ONE MARK PER SKILL — the cluster's mass IS
 * its count. Every variant exports a pure `markCount()` helper the guard
 * walks, so a fan / pile / braid that drifted from `record.shapes[k].skills`
 * would fail before it shipped. Absence from this table means the variant
 * is not making a mass claim (rounds 1–4 letter the count instead of
 * drawing it).
 */
const MARK_COUNT_VARIANTS: readonly [string, (r: IslRecord, key: string) => number][] = [
  ["hand", handMarkCount],
  ["piles", pilesMarkCount],
  ["constellation", constellationMarkCount],
  ["loom", loomMarkCount],
  ["leaves", leavesMarkCount],
  ["roots", rootsMarkCount],
  /* Round six — the three directions that still draw a countable mark per
     Skill. `mosaic` and `grade` are absent on purpose and their files say
     why: mosaic draws no per-Skill mark at all, and grade's tick run is
     deliberately UNGROUPED, so a per-pattern count would assert a grouping
     neither drawing makes and pass by measuring the fixture against itself. */
  ["wheel", wheelMarkCount],
  ["gate", gateMarkCount],
  ["runs", runsMarkCount],
  ["facet", facetMarkCount],
  /* Round seven — every one of the three draws a countable mark per Skill:
     a graduation on a vessel wall, a pin on a bank, a tick down a layer's
     inner edge. That is the register's own habit: an instrument is read off
     its marks. */
  ["tanks", tanksMarkCount],
  ["pinbank", pinbankMarkCount],
  ["stack", stackMarkCount],
  ["flasks", vesselMarkCount],
  ["cells", vesselMarkCount],
  ["vats", vesselMarkCount],
  /* Round nine — ⚠ `inlay` IS HERE AND ITS PARENT `mosaic` IS NOT, which is
     the one mechanical difference between the two drawings. Mosaic carries its
     claim in area alone; inlay adds the graduation that makes the area
     countable, so it owes both this assertion and the mass one. */
  ["inlay", inlayMarkCount],
];

/**
 * ⚠ THREE ROUND-SIX DIRECTIONS ENCODE MASS CONTINUOUSLY, AND `markCount`
 * CANNOT REACH THEM. An angle, an area and a depth have no marks to tally, so
 * the drawing could drift off the record — a wedge sized by rank instead of by
 * count, a band given a minimum depth "to fit the label" — with every existing
 * assertion green.
 *
 * The counterpart is proportionality: divide the magnitude by the Skill count
 * and every pattern must land on the SAME unit. That is strictly what a
 * continuous encoding promises, and it fails loudly the moment a floor, a
 * clamp or a hand-tuned constant is introduced.
 */
const MASS_VARIANTS: readonly [string, (r: IslRecord, key: string) => number][] = [
  ["wheel", wheelMass],
  ["mosaic", mosaicMass],
  ["grade", gradeMass],
  ["runs", runsMass],
  /* facet's radius varies while its angle does not, so `r² − R0²` IS the
     wedge's area up to the shared ½·sin(θ). If a radius were ever hand-picked
     to make a label fit, this is what would catch it. */
  ["facet", facetMass],
  /* Round seven — fill height, bank extent, layer thickness. ⚠ `pinbank`'s
     bank is `n × PIN_PITCH` and NOT the span between its first and last pin,
     which is `(n − 1) × PIN_PITCH` and not proportional to anything; this is
     what would catch that slip. */
  ["tanks", tanksMass],
  ["pinbank", pinbankMass],
  ["stack", stackMass],
  /* Round eight — the VESSEL ITSELF is the magnitude now, not a level inside
     it, which is what stops the empty part reading as unpublished capacity. */
  ["flasks", vesselMass],
  ["cells", vesselMass],
  ["vats", vesselMass],
  /* Round nine — the same area as mosaic, from the same function. Asserted
     separately anyway: sharing a helper today is not a promise that a later
     edit will not give this drawing blocks of its own. */
  ["inlay", inlayMass],
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

describe("the round-five cluster drawings draw one mark per skill", () => {
  /**
   * ⚠ THE COUNT IS STRUCTURAL, NEVER TEXT. A hand-fanned five that
   * silently drops a plate reads as five, not seven, and the reader
   * cannot notice — the numeral could still say "07". The mark-count
   * helper is the mechanical half: it walks the fixture the same way
   * the drawing does, so the two cannot drift.
   */
  for (const [name, markCount] of MARK_COUNT_VARIANTS) {
    it(`${name}: marks per pattern equal the record's Skill count`, () => {
      const r = record();
      const skillsFixture = SAMPLE_SKILLS;
      for (const shape of r.shapes) {
        const inFixture = skillsFixture.filter((s) => s.substrate === shape.key).length;
        /* The fixture agrees with the record already (asserted above);
           what THIS check adds is that the drawing's own mass claim
           matches. A `markCount` helper that returned a rounded or
           bucketed value would fail here. */
        expect(
          markCount(r, shape.key),
          `${name} ${shape.key}: draws ${markCount(r, shape.key)} marks, record has ${shape.skills}`
        ).toBe(shape.skills);
        expect(markCount(r, shape.key), `${name} ${shape.key}: fixture and drawing disagree`).toBe(
          inFixture
        );
      }
    });
  }
});

describe("the round-six drawings size their magnitudes by the record", () => {
  for (const [name, mass] of MASS_VARIANTS) {
    it(`${name}: every pattern lands on the same unit magnitude`, () => {
      const r = record();
      const units = r.shapes.map((s) => ({ key: s.key, unit: mass(r, s.key) / s.skills }));
      for (const u of units) {
        expect(u.unit, `${name} ${u.key} has no magnitude at all`).toBeGreaterThan(0);
      }
      /* 1 % covers float accumulation in the remainder-takes-the-rest term
         and nothing else. A floor, a clamp or a hand-tuned constant moves a
         unit by far more than that, which is exactly what this is for. */
      const base = units[0].unit;
      for (const u of units) {
        expect(
          Math.abs(u.unit - base) / base,
          `${name} ${u.key}: ${u.unit.toFixed(2)} per Skill against ${base.toFixed(2)} — the magnitude is not the count`
        ).toBeLessThan(0.01);
      }
    });
  }

  it("facet seats every label block inside its own wedge", () => {
    /**
     * ⚠ NOTHING ELSE ON THIS SURFACE ASKS THIS QUESTION. The fit guard checks
     * a string against a MEASURE; the capture checks glyph boxes against the
     * crop and against each other. A block that drifted out through its rim
     * chord, or across a gap into the neighbouring wedge, would letter
     * cleanly, collide with nothing and sit inside the crop — and would read
     * as somebody else's label. `seatBlock` returns null when no radius along
     * the bisector holds every line's BOTH ENDPOINTS, which is the honest
     * failure; a drawing that fell back to "seat it anyway" would hide it.
     */
    for (const s of facetSeats(record())) {
      expect(s.seated, `facet ${s.key}: no radius on the bisector holds its block`).toBe(true);
    }
  });

  it("grade's tick run above the line is the whole estate", () => {
    const r = record();
    const total = r.shapes.reduce((n, s) => n + s.skills, 0);
    /* ⚠ ASSERTED AGAINST THE SUM, NOT PER PATTERN. The run is deliberately
       unsorted — that is the drawing's argument — so the only honest check is
       that every encoded Skill is up there exactly once. */
    expect(gradeTicks(r), "grade draws a run that is not the estate").toBe(total);
  });
});

describe("round six letters the definition, not just the count", () => {
  /**
   * ⚠ THE FAULT THIS ROUND EXISTS TO FIX IS A RANKING, AND A RANKING IS
   * INVISIBLE TO EVERY OTHER GUARD. Production letters its gloss at the type
   * floor in a foot; round five letters no gloss at all. Both pass fit,
   * envelope and mass. So the round's own law gets a mechanical form: every
   * direction must letter each pattern's definition AND its eval method, and
   * the definition may not letter smaller than the chrome around it.
   */
  const ROUND_SIX: readonly [string, (r: IslRecord) => LetterSpec[]][] = [
    ["wheel", wheelLettering],
    ["mosaic", mosaicLettering],
    ["gate", gateLettering],
    ["runs", runsLettering],
    ["grade", gradeLettering],
    ["facet", facetLettering],
    ["tanks", tanksLettering],
    ["pinbank", pinbankLettering],
    ["stack", stackLettering],
    ["flasks", vesselLettering],
    ["cells", vesselLettering],
    ["vats", vesselLettering],
  ];

  for (const [name, lettering] of ROUND_SIX) {
    it(`${name}: every pattern letters its definition and its method`, () => {
      const r = record();
      const specs = lettering(r);
      const slots = new Set(specs.map((s) => s.slot));
      for (const shape of r.shapes) {
        expect(slots.has(`${shape.key}.gloss.0`), `${name} drops ${shape.key}'s definition`).toBe(
          true
        );
        expect(slots.has(`${shape.key}.eval`), `${name} drops ${shape.key}'s eval method`).toBe(
          true
        );
        expect(
          slots.has(`${shape.key}.gloss.sliced`),
          `${name} ${shape.key}: the definition wraps past its cap and loses its tail`
        ).toBe(false);
      }
    });

    it(`${name}: the definition outranks the chrome around it`, () => {
      const specs = lettering(record());
      const gloss = specs.filter((s) => s.slot.includes(".gloss."));
      const chrome = specs.filter((s) => s.slot.endsWith(".eval"));
      expect(gloss.length, `${name} letters no definition`).toBeGreaterThan(0);
      for (const g of gloss) {
        for (const c of chrome) {
          expect(
            g.fs,
            `${name}: the definition (${g.fs}) letters under the method (${c.fs}) — the ladder is inverted`
          ).toBeGreaterThanOrEqual(c.fs);
        }
      }
    });
  }
});
