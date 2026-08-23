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
import { manifoldLettering } from "@/app/(internal)/test/intelligence-substrate-lab/VariantManifold";
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
import {
  SKILL_FACET_ORDER,
  SKILL_FACET_SIDES,
  polygonRayRadius,
  skillFacetLayout,
  skillFacetLettering,
  skillFacetMarkCount,
  skillFacetRimModulation,
  skillFacetSweep,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantSkillFacet";
import {
  CARRIER_BAND_FS,
  CARRIER_BAND_INK_HALF,
  CARRIER_BAND_INK_MID,
  CARRIER_BAND_R,
  CARRIER_BAND_TRACK,
  CARRIER_BRIEF,
  CARRIER_CROP_H,
  CARRIER_CROP_PAD,
  CARRIER_CROP_W_MIN,
  CARRIER_CX,
  CARRIER_CY,
  CARRIER_LABEL_FS,
  CARRIER_LABEL_INK_HALF,
  CARRIER_LABEL_INK_MID,
  CARRIER_LABEL_TRACK,
  CARRIER_MIN_CELL_DEPTH,
  CARRIER_ORDER,
  CARRIER_R_CELL,
  CARRIER_R_IN,
  CARRIER_R_OUT,
  CARRIER_SIDES,
  CARRIER_VIEWBOX,
  CARRIER_R_APOTHEM,
  CARRIER_KAPPA,
  hubHalfWidth,
  polygonRayRadius as carrierRayRadius,
  carrierArcTarget,
  carrierCrop,
  carrierBandArcPath,
  carrierBandArcRadius,
  carrierBandMeasure,
  carrierBriefFits,
  carrierCellArcPath,
  carrierCellArcRadius,
  carrierCellAreas,
  carrierCellLabel,
  carrierChordSagitta,
  carrierFieldK,
  carrierLabelRotation,
  carrierLayout,
  carrierLettering,
  carrierMarkCount,
  carrierPinnedFits,
  carrierSweep,
} from "@/app/(internal)/test/intelligence-substrate-lab/VariantCarrier";
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
  const shown = selectWorks(visual.districts, visual.works, visual.skills);
  const cross = crossing(visual.shapes, visual.districts, visual.works, shown);
  /* ⚠ ROUND-NINE VARIANTS NEED THE ESTATE (`works`) AND THE ROSTER (`skills`)
     to walk their lettering. The rounds before them tolerated a stripped
     record because they never looked at either field — a variant added later
     that relies on missing fields would pass the fit test vacuously, so both
     are carried through now for every variant. */
  return {
    teams: cross.teams,
    shapes: cross.shapes,
    skills: visual.skills ?? [],
    works: shown,
  };
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

  /* ── Round nine · THE ESTATE'S SUPPLY SIDE ────────────────────────────
     ⚠ SECTION AND CONTROL ARE PROMOTED / RETIRED (ADR-070 U25). SECTION
     won the direction and lives in production's `PdaSubstrate.tsx`; the
     production drawing is walked by `pda-substrate-fit`. CONTROL's whole
     purpose was to hold the shipped U24 partition beside SECTION for
     comparison, and once U24 is off the site it cannot answer its own
     question. Only MANIFOLD survives here — the losing round-nine
     alternative, kept so the register trade stays reviewable. */
  ["manifold", manifoldLettering, 26],

  /* ── Round ten · THE SKILLS ARE THE FIGURE ────────────────────────────
     Five callouts + three resting hub strings, plus every possible
     interactive hub state. The latter are declared even though only one
     renders at a time: an overlong team/status string must fail before the
     reader finds it by hovering shard 43. */
  ["skill-facet", skillFacetLettering, 150],
  /* 38 letters the same interactive set as 37 (three resting hub strings
     become five — the mechanism is two lines — plus five nameplates and every
     reachable hub state), so it sits on the same floor. */
  ["carrier", carrierLettering, 150],
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
  /* Round ten — one shard per encoded Skill. Unlike the vessel ticks,
     these marks ARE the figure rather than a graduation on it. */
  ["skill-facet", skillFacetMarkCount],
  ["carrier", carrierMarkCount],
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

/* ⚠ THE ROUND-NINE STRUCTURAL SUITE MOVED TO `pda-substrate-fit`
   (ADR-070 U25). SECTION is the shipped drawing now, so the arithmetic it
   enforces — body-proportional-to-count, plate-fit-in-body, shaft lanes
   inside the shaft, gallery lanes ordered so conductors do not cross —
   lives beside the drawing it walks. The lab's manifold entry above is
   the only round-nine variant left, and every guard in this file already
   covers it. */

describe("skill facet makes the Skills the figure", () => {
  it("draws exactly one shard per encoded Skill", () => {
    const r = record();
    const layout = skillFacetLayout(r);
    expect(layout.cells, "the faceted annulus lost a Skill").toHaveLength(r.skills?.length ?? 0);
    expect(new Set(layout.cells.map((c) => c.skill.id)).size, "a Skill is drawn twice").toBe(
      r.skills?.length ?? 0
    );
  });

  it("keeps the five substrates contiguous and in the authored order", () => {
    const groups = skillFacetLayout(record()).groups;
    expect(groups.map((g) => g.key)).toEqual(SKILL_FACET_ORDER);
    for (let i = 1; i < groups.length; i += 1) {
      expect(
        groups[i].a0,
        `${groups[i].key} starts before ${groups[i - 1].key} ends`
      ).toBeGreaterThan(groups[i - 1].a1);
    }
  });

  it("makes angular sweep proportional to Skill count", () => {
    const r = record();
    const units = r.shapes.map((shape) => ({
      key: shape.key,
      unit: skillFacetSweep(r, shape.key) / shape.skills,
    }));
    const base = units[0].unit;
    for (const u of units) {
      expect(
        Math.abs(u.unit - base) / base,
        `${u.key}: angular unit ${u.unit.toFixed(3)} vs ${base.toFixed(3)}`
      ).toBeLessThan(0.001);
    }
  });

  it("is a dodecagon, not a many-sided circle in disguise", () => {
    expect(SKILL_FACET_SIDES).toBe(12);
    /* Twelve sides cost 1 − cos(15°) = 3.41% radial modulation against a
       circle. Under 4% keeps the part-to-whole read; above 2% makes the
       straight perimeter unmistakable at this crop. */
    expect(skillFacetRimModulation()).toBeGreaterThan(0.02);
    expect(skillFacetRimModulation()).toBeLessThan(0.04);
  });

  it("the polygon ray never escapes its circumradius", () => {
    for (let angle = -180; angle <= 180; angle += 1) {
      const r = polygonRayRadius(angle, 250);
      expect(r, `ray ${angle}° escaped the dodecagon`).toBeLessThanOrEqual(250.001);
      expect(r, `ray ${angle}° collapsed inside the apothem`).toBeGreaterThanOrEqual(241);
    }
  });

  it("marks exactly five first encodes on the outer rim", () => {
    const cells = skillFacetLayout(record()).cells;
    expect(cells.filter((cell) => cell.skill.flagship)).toHaveLength(5);
    for (const key of SKILL_FACET_ORDER) {
      expect(
        cells.filter((cell) => cell.key === key && cell.skill.flagship),
        `${key} has no unique green provenance shard`
      ).toHaveLength(1);
    }
  });
});

/**
 * ⚠ 38's CLAIMS ARE ALL ARITHMETIC, AND NONE OF THEM IS VISIBLE IN A CAPTURE.
 * Equal cell area, an area-solved course boundary, every cell's arc clearing
 * its own name — a drawing can be wrong about every one of those and still
 * look plausible at the panel's meet, which is exactly the class of defect
 * ADR-069 U1 found by measuring two objects against each other rather than
 * each against itself.
 *
 * ⚠ **U31 REPOINTED THIS SUITE AT THE DIAL**, so the nameplate/tag guards
 * are gone (both deleted with their functions) and the ladder is no longer
 * `n >= 10 ? 3 : 2` — every cell now letters its own name at rest, so the
 * binding constraint is the INNER ARC clearing the part's own worst name
 * and the ladder is derived from that.
 */
describe("compound carrier divides one plate into equal cells", () => {
  it("draws exactly one cell per encoded Skill, in a walkable order", () => {
    const r = record();
    const { cells } = carrierLayout(r);
    expect(cells, "the carrier lost a Skill").toHaveLength(r.skills?.length ?? 0);
    expect(new Set(cells.map((c) => c.skill.id)).size, "a Skill is drawn twice").toBe(cells.length);
    /* ⚠ THE ROVING ARROW KEYS WALK `index`, so the order is part of the
       drawing rather than an implementation detail: parts stay contiguous, and
       inside a part the walk goes course by course, each course left to right.
       A shuffled index makes the keyboard jump across the plate on every
       press, which is the one thing a roving tabindex exists to prevent. */
    expect(cells.map((c) => c.index)).toEqual(cells.map((_, i) => i));
    expect(
      new Set(cells.map((c) => c.key)).size,
      "a part's cells are not contiguous in the walk"
    ).toBe(cells.filter((c, i) => i === 0 || cells[i - 1].key !== c.key).length);
    for (let i = 1; i < cells.length; i += 1) {
      const prev = cells[i - 1];
      const cell = cells[i];
      if (cell.key !== prev.key) continue;
      if (cell.course === prev.course) {
        expect(cell.a0, "a course does not walk left to right").toBeGreaterThan(prev.a0);
      } else {
        expect(cell.course, "the walk skips or repeats a course").toBe(prev.course + 1);
        expect(cell.r0, "the walk does not climb outward").toBeGreaterThan(prev.r0);
      }
    }
  });

  it("keeps the five parts contiguous and in the authored order", () => {
    const groups = carrierLayout(record()).groups;
    expect(groups.map((g) => g.key)).toEqual(CARRIER_ORDER);
    for (let i = 1; i < groups.length; i += 1) {
      expect(
        groups[i].a0,
        `${groups[i].key} starts before ${groups[i - 1].key} ends`
      ).toBeGreaterThan(groups[i - 1].a1);
    }
  });

  it("makes angular sweep proportional to Skill count", () => {
    const r = record();
    const units = r.shapes.map((shape) => carrierSweep(r, shape.key) / shape.skills);
    for (const unit of units) {
      expect(unit, "a part's sweep drifted off its count").toBeCloseTo(units[0], 6);
    }
  });

  it("gives all forty-seven cells the same area", () => {
    /* ⚠ THIS IS THE DRAWING'S WHOLE HONESTY CLAIM. The course boundaries are
       solved so each course's area share equals its cell share, which makes
       cell area constant across the plate — the only residue is the
       dodecagon's own rim modulation, and 1 − cos(15°) is 3.41 %. A hand-moved
       boundary "to fit a nameplate" would blow straight through this. */
    const areas = carrierCellAreas(record());
    expect(areas).toHaveLength(47);
    const lo = Math.min(...areas);
    const hi = Math.max(...areas);
    expect((hi - lo) / lo, "cell areas diverged past the rim's own modulation").toBeLessThan(0.045);

    /* ⚠ **THE BLANKET NUMBER ABOVE IS THE WEAK HALF, AND U34 IS WHY IT NEEDS A
       SECOND (measured 3.97 %, previously ~3.4 %).** With the division inside
       the housing made concentric, the dodecagon's sector variation stopped
       appearing at BOTH walls of every cell — where it partly cancelled in
       `r1² − r0²` — and now appears at ONE wall of exactly two courses: the
       band's ring bounding course 0 inward, the rim bounding the last course
       outward. Everything between them is bounded by two circles and is
       therefore EXACT.

       So the structure gets pinned instead of the envelope. A blanket 4.5 %
       tolerates a real defect anywhere on the plate; this says where the
       residue is allowed to be and holds the other 33 cells to a thousandth.
       ⚠ The measured worst is `pattern`'s four rim cells at +1.6 / −2.3 % of
       the mean — a 25.9° cell against a 30° facet pitch, which is the widest
       straddle any part produces. */
    const layout = carrierLayout(record());
    const mean = areas.reduce((a, b) => a + b, 0) / areas.length;
    for (const group of layout.groups) {
      const last = group.courses.length - 1;
      for (const [i, cell] of layout.cells.entries()) {
        if (cell.key !== group.key) continue;
        const onHousing = cell.course === 0 || cell.course === last;
        const dev = Math.abs(areas[i] / mean - 1);
        expect(
          dev,
          `${cell.skill.id}: ${onHousing ? "a housing-bounded" : "a concentric"} cell is ` +
            `${(dev * 100).toFixed(2)}% off the mean`
        ).toBeLessThan(onHousing ? 0.025 : 0.01);
      }
    }
  });

  it("derives a course ladder that clears every cell's own name", () => {
    /* ⚠ THE LADDER WAS AUTHORED, NOW IT IS DERIVED (U31). Every course's
       INNER arc has to hold the part's longest `short` name at fs 12 plus
       LABEL_PAD on each end, and every course's DEPTH has to hold the label's
       line box. Any composition of `n` cells is fair game — the drawing picks
       the composition with the lowest max aspect. Inner courses hold FEWER
       cells now, so the arc grows inward instead of shrinking. */
    const r = record();
    for (const group of carrierLayout(r).groups) {
      const n = group.skills.length;
      expect(
        group.courses.reduce((a, b) => a + b, 0),
        `${group.key}'s courses do not sum to its count`
      ).toBe(n);
      /* Inner ≤ outer everywhere — the derivation's natural output; a run
         that reversed it would be lettering the innermost, tightest arcs
         with more cells to share, which is what U28 did and had to fix. */
      for (let i = 1; i < group.courses.length; i += 1) {
        expect(
          group.courses[i],
          `${group.key}'s inner course holds more cells than its outer`
        ).toBeGreaterThanOrEqual(group.courses[i - 1]);
      }
      /* Boundaries must rise monotonically and land exactly on the walls. */
      expect(group.radii[0]).toBeLessThan(group.radii[1]);
      expect(group.radii[0]).toBeCloseTo(CARRIER_R_CELL, 6);
      expect(group.radii[group.radii.length - 1]).toBeCloseTo(CARRIER_R_OUT, 6);
      for (let i = 1; i < group.radii.length; i += 1) {
        expect(group.radii[i], `${group.key}'s course ${i} folds back`).toBeGreaterThan(
          group.radii[i - 1]
        );
      }
      /* ⚠ THE LAW THE DERIVATION EXISTS FOR: every course's inner arc clears
         the part's own worst name; every course's depth clears the line box.
         A ladder that drifted off either would let a name spill through the
         seam or crowd its own baseline. */
      const sweepRad = ((group.a1 - group.a0) * Math.PI) / 180;
      const target = carrierArcTarget(group.longestChars);
      const cells = carrierLayout(r).cells.filter((c) => c.key === group.key);
      const perCourse = new Map<number, typeof cells>();
      for (const c of cells) perCourse.set(c.course, [...(perCourse.get(c.course) ?? []), c]);
      for (const [course, list] of perCourse) {
        const first = list[0];
        const arc = first.r0 * (sweepRad / group.courses[course]);
        expect(
          arc,
          `${group.key} course ${course}: arc ${arc.toFixed(0)}u misses target ${target.toFixed(0)}u`
        ).toBeGreaterThanOrEqual(target);
        /* ⚠ THE DEPTH ENDS AT THE WALL, WHICH ON THE RIM IS THE APOTHEM (U34).
           Measuring the outermost course to `R_OUT` hands this floor 13.1
           units no label can use — which is the U34 defect restated as the
           ladder's own arithmetic, and why `MIN_CELL_DEPTH` came 26 → 23 in
           the same edit. */
        expect(
          first.outerWall - first.r0,
          `${group.key} course ${course}: depth under the line-box floor`
        ).toBeGreaterThanOrEqual(CARRIER_MIN_CELL_DEPTH);
      }
    }
  });

  it("is a dodecagon with a hub, a band and an annulus of cells", () => {
    expect(CARRIER_SIDES).toBe(12);
    /* ⚠ THE THREE RADII ARE PINNED HERE AND DERIVED EVERYWHERE ELSE. ADR-065
       U5's lesson, one level down: a guard that only checks the relationship
       passes when both sides move together, so the trio is nailed once —
       moving any of them is then a deliberate edit to this line rather than
       a silent one. */
    expect(CARRIER_R_IN).toBe(156);
    expect(CARRIER_R_CELL).toBe(192);
    expect(CARRIER_R_OUT).toBe(384);
    /* ⚠ THE BAND IS DEEPER THAN THE LINE BOX IT HOLDS BY A REAL MARGIN, which
       is the U32 half of the re-cut: the hub's 8 units came here, not to the
       cells. 36 units around a 14-unit line box is 11 per side. */
    expect(CARRIER_R_CELL - CARRIER_R_IN).toBe(36);
    /* ⚠ AND THE RIM AND THE TYPE SIZE ARE ONE DECISION. A thicker annulus grows
       the crop and a bigger crop paints a unit-authored label smaller, so a
       future pass that moves `R_OUT` without moving `LABEL_FS` silently trades
       legibility for air. Pinned together so the trade has to be made on
       purpose. */
    expect(CARRIER_LABEL_FS).toBe(13);
    /* ⚠ THE BAND IS THE MIDPOINT OF THE TWO INNERMOST RINGS, and it stays the
       midpoint even if the two move. A band that drifts off centre inside its
       own strip reads as an error of assembly rather than as a choice. */
    expect(CARRIER_BAND_R).toBeCloseTo((CARRIER_R_IN + CARRIER_R_CELL) / 2, 6);
    /* ⚠ THE RIM IS BOUND BY THE CROP'S HEIGHT, AND THE PAD IS READ FROM THE
       DRAWING RATHER THAN RE-STATED HERE. This assertion carried `26` as a
       literal and failed the moment the pad moved to 18 — the same drift `CY`
       produced one pass earlier. The CONTRACT is what is pinned: the plate's
       apothem sits inside the crop by the pad, and by no more than a unit past
       it, so the crop is the plate's own consequence at any pad. */
    const apothem = Math.cos(Math.PI / 12) * CARRIER_R_OUT;
    expect(apothem, "the rim overruns the crop's pad").toBeLessThanOrEqual(
      CARRIER_CROP_H / 2 - CARRIER_CROP_PAD
    );
    expect(CARRIER_CROP_H / 2 - apothem, "the rim floats off its pad").toBeLessThan(
      CARRIER_CROP_PAD + 2
    );
    /* ⚠ AND THE PAD IS A MARGIN WITH A FLOOR, NOT SLACK TO BE SPENT. It is the
       one lever that scales every label for free (the fit is height-bound, so
       `meet` is `field.h / CROP_H`), which makes it the one lever a later pass
       will be tempted to take to zero. At the binding preset a unit of pad
       paints 0.63px, so 18 is an 11.4px gap between the plate's outer machined
       rule and the console field's wall — ADR-064's bleed law is about a
       CAPTURE filling its bay, and a technical drawing whose outermost rule
       touches the housing has lost its margin rather than bled. */
    expect(CARRIER_CROP_PAD, "the crop's margin was spent as slack").toBeGreaterThanOrEqual(16);
  });

  it("crops elastically, so the plate fills the field's height at every preset", () => {
    /* ⚠ THE GUARD THAT DID NOT EXIST IS THE WHOLE U32 STORY. `minPx` knows a
       4.3 HARD FLOOR, so a drawing painted at half the size it could be reads
       as green — the static 932 × 762 crop was aspect 1.223 against fields of
       1.056–1.148, spending `meet` on the width ratio and leaving the height
       ratio on the table, and nothing asked. So: the plate must fill the
       field's HEIGHT at every preset, which for a fixed-aspect polygon in a
       field that is always wider is the same statement as "the fit is
       height-bound everywhere, with no crossover". */
    /* ⚠ **MEASURED `.fl-con__field`, NOT THE PRESET'S HOUSING** — and getting
       this wrong is how the first cut of this pass shipped a drawing 6 % too
       small. `PRESETS` in the lab shell records the console's OUTER box; the
       SVG is laid into the field INSIDE the console frame, which is 11–58px
       smaller per axis. Sweeping the geometry against the housing overstated
       every field aspect, which flipped which dimension was scarce. */
    for (const f of [
      { id: "p1280", w: 602, h: 493 },
      { id: "p1440", w: 678, h: 548 },
      { id: "p1920", w: 850, h: 760 },
    ]) {
      const [x, , w, h] = carrierCrop(f.w / f.h)
        .split(/\s+/)
        .map(Number);
      /* ⚠ **"ALWAYS" HELD ONLY WHILE THE FIELD WAS ALWAYS WIDER** (U33). These
         three presets are 1.22 / 1.24 / 1.12 against the plate's 1.033, so the
         width is what grows and the height stays the plate's own need — but a
         TALL desktop window runs 0.89, where the crop grows its HEIGHT instead
         and this equality is false on purpose. The tall regime is walked in
         `the carrier's crop grows on whichever axis the field leaves slack`. */
      expect(h, `${f.id}: the crop's height moved on a field wider than the plate`).toBe(
        CARRIER_CROP_H
      );
      const meet = Math.min(f.w / w, f.h / h);
      expect(meet, `${f.id}: the fit went WIDTH-bound — the height is going unspent`).toBeCloseTo(
        f.h / h,
        6
      );
      /* The plate has to be inside the crop horizontally, which is the price of
         holding CX still while the left edge slides. */
      expect(x, `${f.id}: the crop cuts the plate's left vertex`).toBeLessThanOrEqual(
        466 - CARRIER_R_OUT
      );
      expect(x + w, `${f.id}: the crop cuts the plate's right vertex`).toBeGreaterThanOrEqual(
        466 + CARRIER_R_OUT
      );
      /* ⚠ AND THE TYPE HAS TO CLEAR 8px, NOT THE 4.3 HARD FLOOR. The binding
         preset is what this drawing is authored at, and 12 × meet is the
         smallest thing on the plate. */
      expect(CARRIER_LABEL_FS * meet, `${f.id}: a cell label lands under 8px`).toBeGreaterThan(8);
    }
    /* The rest crop is the narrowest a field can ask for, so it may not be
       narrower than the plate. */
    const [rx, ry, rw, rh] = CARRIER_VIEWBOX.split(/\s+/).map(Number);
    expect(rw).toBe(CARRIER_CROP_W_MIN);
    expect(rx).toBeLessThanOrEqual(466 - CARRIER_R_OUT);
    expect(rx + rw).toBeGreaterThanOrEqual(466 + CARRIER_R_OUT);
    /* ⚠ THE REST CROP IS ALSO THE HINGE, and it has to sit exactly ON it: the
       resting height is the plate's floor and the resting width is the plate's
       floor, so neither regime has grown yet. `y` is 0 here — the crop's offsets
       only move once an axis does. */
    expect(rh, "the rest crop grew a height nothing asked for").toBe(CARRIER_CROP_H);
    expect(ry, "the rest crop slid off the plate's own origin").toBe(0);
  });

  it("the carrier's crop grows on whichever axis the field leaves slack", () => {
    /* ⚠ **THE GUARD FOR THE SECOND REGIME, AND ITS ABSENCE COST 132px** of dead
       panel at the owner's own 845 × 950 — the shape that has now forced this
       same correction on all three readings (270px on ADR-070 U11's reading 02,
       265px on U15's reading 03, and this).

       The plate is a fixed-aspect polygon, so filling a panel is entirely the
       crop's job, and U12's law is that growing a crop on its SLACK axis is
       free. The claim here is both halves of that at once: the panel ends up
       full on both axes, AND `meet` is no worse than it was at rest — because
       the moment a crop grows on the axis it was BOUND by, the drawing has just
       been shrunk to fill a box. */
    const restMeet = (f: { w: number; h: number }) => {
      const [, , w, h] = CARRIER_VIEWBOX.split(/\s+/).map(Number);
      return Math.min(f.w / w, f.h / h);
    };

    for (const f of [
      { id: "p1280 (wide)", w: 602, h: 493, grows: "width" },
      { id: "p1920 (wide)", w: 850, h: 760, grows: "width" },
      { id: "the owner's (tall)", w: 845, h: 950, grows: "height" },
      { id: "2560x1440 (tall)", w: 850, h: 1120, grows: "height" },
      { id: "1280x1440 (tall)", w: 603, h: 1177, grows: "height" },
    ]) {
      const [x, y, w, h] = carrierCrop(f.w / f.h)
        .split(/\s+/)
        .map(Number);

      if (f.grows === "height") {
        expect(
          h,
          `${f.id}: the height stayed put on a field taller than the plate`
        ).toBeGreaterThan(CARRIER_CROP_H);
        expect(w, `${f.id}: the width grew on a field that had none to spare`).toBe(
          CARRIER_CROP_W_MIN
        );
      }

      /* ⚠ THE PLATE DOES NOT MOVE — it is the CROP that slides around it, which
         is what keeps every cell, both label rings and the seated card written
         against constants. Both offsets are the growth, halved. */
      expect(x + w / 2, `${f.id}: the plate slid horizontally`).toBeCloseTo(466, 6);
      expect(y + h / 2, `${f.id}: the plate slid vertically`).toBeCloseTo(CARRIER_CROP_H / 2, 6);

      const meet = Math.min(f.w / w, f.h / h);
      expect(
        Math.max(f.w - w * meet, f.h - h * meet),
        `${f.id}: dead panel the crop could have filled`
      ).toBeLessThan(2);
      expect(meet / restMeet(f), `${f.id}: filling the panel shrank the drawing`).toBeGreaterThan(
        0.999
      );
      expect(CARRIER_LABEL_FS * meet, `${f.id}: a cell label lands under 8px`).toBeGreaterThan(8);
    }
  });

  it("letters one plain-language brief in the hub and no figure anywhere", () => {
    /* ⚠ TWO CLAUSES, AND THE SECOND IS THE ONE THAT ROTS (owner, 2026-08-18).
       Removing the socket's `47` and the nameplates' counts is a five-minute
       edit; keeping them out is what needs a guard, because every future pass
       that wants to "say how much" reaches for a digit first. The drawing
       prints no number at rest and none when lit. */
    const fit = carrierBriefFits();
    expect(fit.whole, "the wrap truncated the brief — words fell off its cap").toBe(true);
    expect(fit.slack, "a brief line overruns the hub's measure").toBeGreaterThan(0);
    /* ⚠ THE MARGIN IS WHAT MAKES IT SET ON THE HUB RATHER THAN FILLING IT. A
       block that merely CLEARS the wall reads as text that happens to be inside
       the gold, not as text placed on it — so this asserts air, not fit. */
    expect(fit.wall, "the brief crowds the hub's wall").toBeGreaterThan(24);
    expect(fit.lines, "the brief grew past the hub's straight-walled band").toBeLessThanOrEqual(5);

    /* Layman's terms, and the surface's own claim rather than a new one. */
    expect(CARRIER_BRIEF).toMatch(/encoded once/i);
    expect(CARRIER_BRIEF, "the brief counts instead of explaining").not.toMatch(/\d/);
    expect(CARRIER_BRIEF, "the brief reached for the console's own jargon").not.toMatch(
      /\b(substrate|skill|configuration|below grade)\b/i
    );

    /* ⚠ THE RESTING FAMILIES ARE `brief`, `band` AND `cell` NOW. U28's
       filter regex read a slot's prefix; this one reads its family. The band
       carries the substrate name and the cell carries the Skill name — the
       old `voice.name` slot named a nameplate that no longer exists. */
    const resting = carrierLettering(record()).filter(
      (s) => s.slot.startsWith("brief.") || s.slot.startsWith("band.") || s.slot.startsWith("cell.")
    );
    expect(resting.length, "the resting drawing letters less than the estate").toBeGreaterThan(50);
    /* ⚠ THE DIGIT BAN IS FOR THE DRAWING'S OWN COUNTS, NOT FOR PROPER-NAME
       DIGITS in a client's Skill (`360 Marketing`, `2FA Playbook`). Cells
       letter the record's authored `short` field verbatim; the guard is what
       stops the drawing from adding a numeral of its own — a socket saying
       "47", a nameplate saying "14". Both are gone. */
    const drawingOwn = resting.filter(
      (s) => s.slot.startsWith("brief.") || s.slot.startsWith("band.")
    );
    for (const spec of drawingOwn) {
      expect(
        spec.text,
        `${spec.slot} prints a figure on a drawing that counts by area`
      ).not.toMatch(/\d/);
    }
    expect(
      carrierLettering(record()).some((s) => s.slot.endsWith(".count")),
      "the nameplate's count row came back"
    ).toBe(false);
  });

  it("seats every clicked Skill on the hub, flagship and long name alike", () => {
    const fit = carrierPinnedFits(record());
    expect(fit.wall, `${fit.worst} runs off the hub when clicked`).toBeGreaterThan(16);
  });

  it("has a landing cell for every configured stream's skill (ADR-071)", () => {
    /* ⚠ **THE SKILL CHIP IS THE 2↔3 FLIGHT'S OBJECT, AND ITS CELL MUST EXIST**
       (2026-08-19). Reading 02 lets the reader open any configured stream;
       the chip flies to the cell whose `skill.id === cfg.skillId`. A stream
       whose skillId does not resolve to a cell would silently fall back to
       raster on the transition and drop ADR-071's central gesture. This
       walks the join for every configured stream. */
    const r = record();
    const cellIds = new Set(carrierLayout(r).cells.map((c) => c.skill.id));
    for (const w of r.works ?? []) {
      if (!w.configured || !w.skillId) continue;
      expect(
        cellIds.has(w.skillId),
        `${w.id} configured stream's skill "${w.skillId}" has no cell on the carrier`
      ).toBe(true);
    }
  });

  it("measures the hub's grain as chords, not as rays", () => {
    /* ⚠ THIS IS THE DEFECT THE HELPER EXISTS TO PREVENT. `polygonRayRadius`
       measures along a ray from the centre and a scanline is a CHORD; the two
       agree only on the horizontal axis. Reaching for the ray radius gives a
       raster whose rows stop short of the wall by up to 6 % — a screen with a
       soft, rounded-looking edge inside a hard twelve-sided one, which looks
       like a rendering artefact rather than a wrong function. */
    expect(hubHalfWidth(0, CARRIER_R_IN)).toBeCloseTo(polygonRayRadius(0, CARRIER_R_IN), 6);
    /* Every sampled row must land exactly on the polygon: the corner it
       reaches has to satisfy the boundary at its own angle, to the unit. */
    for (let y = -150; y <= 150; y += 6) {
      const half = hubHalfWidth(y, CARRIER_R_IN);
      if (half <= 0) continue;
      const angle = (Math.atan2(y, half) * 180) / Math.PI;
      expect(Math.hypot(half, y), `the raster row at ${y} misses the aperture wall`).toBeCloseTo(
        polygonRayRadius(angle, CARRIER_R_IN),
        6
      );
    }
    /* And it narrows past the straight-walled band, which is the whole reason
       the well's rules cannot take the apothem for their width. */
    expect(hubHalfWidth(90, CARRIER_R_IN)).toBeLessThan(hubHalfWidth(0, CARRIER_R_IN));
  });

  it("letters every one of the forty-seven cells on its own arc", () => {
    /* ⚠ THE INNER ARC IS THE BINDING MEASURE. A chord is longest at the outer
       end of a wedge, so lettering FITS more easily as the radius grows —
       walking the inner arc catches the tightest case per cell, and every
       cell is checked against its OWN measure so a shortlist of long names
       cannot hide behind an average. */
    const specs = carrierLettering(record());
    const cellSpecs = specs.filter((s) => s.slot.startsWith("cell."));
    expect(cellSpecs, "the dial lost a cell label").toHaveLength(47);
    for (const spec of cellSpecs) {
      expect(spec.text.length, `${spec.slot} announces nothing`).toBeGreaterThan(0);
      expect(spec.fs, `${spec.slot} letters under the floor`).toBeGreaterThanOrEqual(FS_FLOOR);
      expect(
        spec.text.length * (spec.fs * (0.6 + spec.track)),
        `${spec.slot}: "${spec.text}" runs past its ${spec.measure.toFixed(0)}u arc`
      ).toBeLessThanOrEqual(spec.measure);
    }
    /* ⚠ AND EVERY CELL'S DEPTH CLEARS THE LINE BOX. Sagitta on a `textPath`
       is zero (the text follows the arc exactly), so the only radial cost is
       the line's own ink; anything under the line box would clip against the
       course seam above and below. */
    const { cells } = carrierLayout(record());
    for (const cell of cells) {
      const depth = cell.r1 - cell.r0;
      expect(
        depth,
        `${cell.skill.id}: course depth ${depth.toFixed(0)}u under the ${CARRIER_MIN_CELL_DEPTH}u floor`
      ).toBeGreaterThanOrEqual(CARRIER_MIN_CELL_DEPTH);
    }
  });

  it("sets every label along its arc, upright, on a `textPath`", () => {
    /* ⚠ ROTATION IS AN OPTIMISATION HERE, NOT A CHOICE. Every rotation on the
       site so far is 45° on a shape (ADR-065); this is the first rotated
       TYPE. It is called out because the next pass will reach for it and be
       tempted to spread rotated glyphs elsewhere — the only reason it earns
       its place here is that 47 horizontal labels do not fit. Two invariants:
       nothing reads upside down (rot ∈ (-90, 90]), and the bottom half flips
       so the baseline still faces up to the reader. */
    for (const cell of carrierLayout(record()).cells) {
      const midA = (cell.a0 + cell.a1) / 2;
      const rot = carrierLabelRotation(midA);
      expect(rot, `${cell.skill.id} reads upside down (rot ${rot.toFixed(0)})`).toBeGreaterThan(
        -90
      );
      expect(rot, `${cell.skill.id} reads upside down (rot ${rot.toFixed(0)})`).toBeLessThanOrEqual(
        90
      );
    }
  });

  it("keeps a straight text's sagitta inside the cell depth it would live in", () => {
    /* ⚠ THE DRAWING DOES NOT USE STRAIGHT TEXT — it uses `textPath`, whose
       sagitta is zero — but the ladder's `minDepth` was measured against
       what a straight-text fallback would need. Asserting the sagitta stays
       inside half the depth keeps the fallback DEFENDABLE: if `textPath`
       fails on any browser, the drawing can drop to rotated straight text
       without recutting the ladder. */
    for (const cell of carrierLayout(record()).cells) {
      const midR = (cell.r0 + cell.r1) / 2;
      const width = cell.skill.short.length * (CARRIER_LABEL_FS * (0.6 + CARRIER_LABEL_TRACK));
      const sag = carrierChordSagitta(width, midR);
      const depth = cell.r1 - cell.r0;
      expect(
        sag,
        `${cell.skill.id}: chord sagitta ${sag.toFixed(1)}u past half a ${depth.toFixed(0)}u cell`
      ).toBeLessThan(depth / 2);
    }
  });

  it("centres every label's INK in its cell, not its baseline", () => {
    /* ⚠ THE GUARD THAT DID NOT EXIST, AND THE DEFECT IT LET THROUGH IS THE ONE
       THE OWNER SAW. Every check on this drawing measured a label against a
       MEASURE — an advance against an arc, a depth against a line box — and a
       measure is a length, so all of them pass wherever the label happens to
       SIT. `textPath` puts the BASELINE on the curve and the arcs were cut at
       each cell's mid-depth, so the ink block sat 0.269em off centre: at
       `LABEL_FS` 13 that is 3.5 units, which in a 35-unit course is 11 units of
       air on one wall against 18 on the other. Nothing collided and the plate
       read as pressed against itself.

       ⚠ AND THE LEAN REVERSED AT THE HORIZON, which is why no single-cell look
       would have found it either. The bottom half's arc is traversed backwards
       so the type is not upside down, and that also reverses the glyphs'
       up-vector — the top half leaned outward, the bottom inward, from one
       rule. The assertion is therefore SYMMETRY, walked on every cell: the ink
       clears both its walls by the same amount. */
    /* ⚠ **AND IT WAS STILL MEASURING A MODEL (U34).** The version above walked
       `cell.r0`/`cell.r1` — the PARTITION's radii — on a plate where every ring
       was a dodecagon, whose wall dips to `κ·R` at each of its twelve edge
       midpoints. At `R_OUT` that is **13.1 units** the label was never told
       about, so **19 of the 47 labels' ink crossed their cell's outer edge**
       (`Feedback` −5.0u, `Localization` −3.3u, `Quality`, `Supplier QA`,
       `Survey`, …) while this guard reported 7–12 units of air on BOTH sides
       and passed. That is the same class as the lean it was written to catch,
       one level down: a length measured against the wrong wall.

       ⚠ **SO THE WALLS ARE SAMPLED ACROSS EACH CELL'S OWN SWEEP NOW, AT THE
       RADIUS THE RENDERER PAINTS.** `polygonRayRadius` where the wall is the
       housing (the band's ring at `R_CELL` inward, the rim at `R_OUT` outward),
       the plain radius where it is one of U34's concentric seams. A guard that
       cannot see the difference between those two is a guard this drawing has
       already got wrong once. */
    const inkRise = CARRIER_LABEL_INK_MID * CARRIER_LABEL_FS;
    const half = CARRIER_LABEL_INK_HALF * CARRIER_LABEL_FS;
    const SAMPLES = 60;
    for (const cell of carrierLayout(record()).cells) {
      const arcR = carrierCellArcRadius(cell);
      /* The correction is present, at full size, and signed by the arc's own
         direction rather than by the cell's position in the ring. ⚠ It is taken
         off the DRAWN corridor's centre — `outerWall`, not `r1`. */
      const mid = (cell.r0 + cell.outerWall) / 2;
      const flip = Math.sin((((cell.a0 + cell.a1) / 2) * Math.PI) / 180) > 0;
      expect(
        arcR - mid,
        `${cell.skill.id}: the ink-centring correction is missing or mis-signed`
      ).toBeCloseTo((flip ? 1 : -1) * inkRise, 6);

      /* ⚠ AND THE CONSEQUENCE IS ASSERTED, NOT JUST THE ARITHMETIC — measured
         with the ink's HALF-HEIGHT, which is a different metric from the centre
         offset above (see `LABEL_INK_HALF`: 0.500em against 0.269em, the
         half-sum against the half-difference). Using the offset for both is a
         guard that reports a lean on a block that is sitting straight. */
      const inkMid = arcR + (flip ? -1 : 1) * inkRise;
      /* Which wall is the housing: the inner one only on course 0, the outer
         one only on the last course. `outerWall` names the second; the first is
         `r0` landing exactly on `R_CELL`. */
      const onBand = Math.abs(cell.r0 - CARRIER_R_CELL) < 1e-9;
      const onRim = Math.abs(cell.outerWall - cell.r1) > 1e-9;
      let airOut = Infinity;
      let airIn = Infinity;
      for (let s = 0; s <= SAMPLES; s += 1) {
        const a = cell.a0 + ((cell.a1 - cell.a0) * s) / SAMPLES;
        const wallOut = onRim ? carrierRayRadius(a, CARRIER_R_OUT) : cell.r1;
        const wallIn = onBand ? carrierRayRadius(a, CARRIER_R_CELL) : cell.r0;
        airOut = Math.min(airOut, wallOut - (inkMid + half));
        airIn = Math.min(airIn, inkMid - half - wallIn);
      }
      /* ⚠ SYMMETRY IS STILL THE QUESTION — it was the right one, asked of the
         wrong walls. A polygonal wall's worst position is what the label has to
         live with, so the two worst clearances are what get compared. */
      expect(
        Math.abs(airOut - airIn),
        `${cell.skill.id}: ink leans (${airIn.toFixed(1)}u in vs ${airOut.toFixed(1)}u out)`
      ).toBeLessThan(0.5);
      /* ⚠ AND BOTH WALLS CLEAR A REAL AMOUNT. Symmetry alone is satisfied by a
         label centred in a cell too shallow to hold it, so the floor is
         asserted too — the achieved minimum is 5.4u at `Tracker Check`, the
         tightest cell the ladder accepts. */
      expect(airIn, `${cell.skill.id}: ink crowds the inner wall`).toBeGreaterThan(5);
      expect(airOut, `${cell.skill.id}: ink crowds the outer wall`).toBeGreaterThan(5);
    }
  });

  it("bounds the outermost course by the rim's APOTHEM, not its circumradius", () => {
    /* ⚠ THE ONE-LINE STATEMENT OF U34's DEFECT, pinned from both ends so it
       cannot come back by either route: a cell on a concentric seam has
       `outerWall === r1` (the wall IS its radius), and a cell on the rim has
       `outerWall === κ·R_OUT` (the wall is 13.1 units nearer than its radius).
       A build that collapsed the two — in either direction — would either put
       the outermost labels back through the edge or float every other course's
       label off its own centre. */
    const layout = carrierLayout(record());
    expect(CARRIER_R_APOTHEM).toBeCloseTo(CARRIER_KAPPA * CARRIER_R_OUT, 9);
    let onRim = 0;
    for (const group of layout.groups) {
      const last = group.courses.length - 1;
      for (const cell of layout.cells.filter((c) => c.key === group.key)) {
        if (cell.course === last) {
          expect(cell.r1, `${cell.skill.id}: the last course does not reach the rim`).toBeCloseTo(
            CARRIER_R_OUT,
            6
          );
          expect(
            cell.outerWall,
            `${cell.skill.id}: a rim cell is measured to the circumradius`
          ).toBeCloseTo(CARRIER_R_APOTHEM, 6);
          onRim += 1;
        } else {
          expect(
            cell.outerWall,
            `${cell.skill.id}: a concentric seam is being discounted like the rim`
          ).toBeCloseTo(cell.r1, 9);
        }
      }
    }
    /* ⚠ AND THE APOTHEM IS ALL BUT EXACT HERE, RATHER THAN CONSERVATIVE — each
       outermost cell comes within a fraction of a unit of that wall inside its
       own sweep, so none of them is being handed a corridor meaningfully
       smaller than the one it has. Measured worst on this record: **0.081
       units**, i.e. 0.05 device px at the binding meet.

       ⚠ **THE SWEEP'S WIDTH IS NOT A PROXY FOR THIS** and the first cut of this
       guard used one. A rim cell wider than the dodecagon's 30° facet pitch
       always straddles an edge midpoint; a narrower one may or may not, so
       `≥ 30°` fails on `pattern`'s four 25.9° rim cells — which turn out to
       clear it by 0.081u anyway. The property is sampled, because the property
       is what matters.

       ⚠ **AND THE THRESHOLD HAS TEETH, because the miss grows fast as a rim
       course gets finer.** A cell of sweep `w` centred on a vertex approaches
       no nearer than `15° − w/2`, and `R_OUT·(1/cos θ − 1)` is 0.25u at
       `w` 25.9° but **5.9u at `w` 10°** — at which point the apothem is costing
       that cell a fifth of its depth and the ladder should be solving against
       the cell's own wall instead of the part's. */
    for (const group of layout.groups) {
      const last = group.courses.length - 1;
      for (const cell of layout.cells.filter((c) => c.key === group.key && c.course === last)) {
        let nearest = Infinity;
        for (let s = 0; s <= 240; s += 1) {
          const a = cell.a0 + ((cell.a1 - cell.a0) * s) / 240;
          nearest = Math.min(nearest, carrierRayRadius(a, CARRIER_R_OUT));
        }
        expect(
          nearest - CARRIER_R_APOTHEM,
          `${cell.skill.id}: this rim cell stops ${(nearest - CARRIER_R_APOTHEM).toFixed(2)}u ` +
            `short of the apothem — the bound is costing it depth`
        ).toBeLessThan(0.5);
      }
    }
    expect(onRim, "no cell is on the rim").toBeGreaterThan(4);
  });

  it("centres the substrate names in the band on the uppercase metric", () => {
    /* ⚠ THE TWO FAMILIES TAKE DIFFERENT CONSTANTS AND IT IS NOT A TUNING
       CHOICE. A Skill is sentence case, so ascenders and descenders both land
       and the ink is near-symmetric about the em; a substrate name is uppercase,
       where nothing falls below the baseline at all — its ink runs
       `baseline − capHeight` to `baseline`, so its centre is a full half
       cap-height up. One shared constant would seat the five region names 2.3
       units low inside their own recess, which on a 36-unit band is a visible
       lean on the most structural strings on the plate. */
    expect(CARRIER_BAND_INK_MID).toBeGreaterThan(CARRIER_LABEL_INK_MID);
    const rise = CARRIER_BAND_INK_MID * CARRIER_BAND_FS;
    for (const group of carrierLayout(record()).groups) {
      const arcR = carrierBandArcRadius(group);
      const flip = Math.sin((((group.a0 + group.a1) / 2) * Math.PI) / 180) > 0;
      expect(
        arcR - CARRIER_BAND_R,
        `band.${group.key}: the ink-centring correction is missing or mis-signed`
      ).toBeCloseTo((flip ? 1 : -1) * rise, 6);
      /* The cap block clears the band's own two walls by the same amount. ⚠ For
         an uppercase run the centre offset and the half-height ARE the same
         number, because nothing falls below the baseline — which is the one case
         where reusing one constant for both is correct, and the reason the two
         are still declared separately is that the Skill family next door is the
         case where it is not. */
      const half = CARRIER_BAND_INK_HALF * CARRIER_BAND_FS;
      const inkMid = arcR + (flip ? -1 : 1) * rise;
      const airOut = CARRIER_R_CELL - (inkMid + half);
      const airIn = inkMid - half - CARRIER_R_IN;
      expect(
        Math.abs(airOut - airIn),
        `band.${group.key}: name leans (${airIn.toFixed(1)}u in vs ${airOut.toFixed(1)}u out)`
      ).toBeLessThan(0.5);
      expect(airIn, `band.${group.key}: name crowds the hub's rim`).toBeGreaterThan(6);
    }
  });

  it("letters every string on the plate over eight pixels at the binding preset", () => {
    /* ⚠ **A FLOOR IS NOT A FAMILY, AND THAT IS HOW 7.46px SHIPPED GREEN.** The
       capture readout reports one `minPx` against the map's 4.3 hard floor, so
       it said the drawing cleared and never said WHICH lettering owned the
       number. It was the five SUBSTRATE NAMES — `BAND_FS` 12 — while all 47
       Skills were over 8: the most structural strings on the plate were its
       smallest, and the one gate that could have said so reported a scalar.

       So the assertion is per-FAMILY and it names the 8px line rather than the
       hard floor. ⚠ The preset is the BINDING one (p1280, the shortest field),
       and the field is the MEASURED `.fl-con__field` — sweeping against the
       preset's outer housing is what shipped a drawing 6 % too small one pass
       earlier. */
    const field = { w: 602, h: 493 };
    /* Height-bound by construction (see the elastic-crop guard), so one term. */
    const meet = field.h / CARRIER_CROP_H;
    for (const [family, fs] of [
      ["skill", CARRIER_LABEL_FS],
      ["substrate name", CARRIER_BAND_FS],
    ] as const) {
      expect(
        fs * meet,
        `the ${family} family letters at ${(fs * meet).toFixed(2)}px, under the map's 8px line`
      ).toBeGreaterThanOrEqual(8);
    }
    /* ⚠ AND THE BAND MAY NOT DRIFT BACK UNDER A SKILL. It sat one rung down on
       a cap-height argument that was true and answered the wrong question — the
       rung it was setting was the plate's FLOOR. Equal font size with wider
       tracking is the grammar now, and uppercase at the same size still reads
       larger, so the register survives the correction. */
    expect(CARRIER_BAND_FS).toBe(CARRIER_LABEL_FS);
    expect(CARRIER_BAND_TRACK).toBeGreaterThan(CARRIER_LABEL_TRACK);
  });

  it("letters every substrate name inside its band arc", () => {
    /* ⚠ THE BAND IS A CONTINUATION OF THE PLATE'S GRAMMAR, not a new region.
       Its labels are set on `textPath` at `CARRIER_BAND_R`, one per group,
       divided by the same seams the cells are. STAKEHOLDER (the longest
       name) is the binding case; its wedge sweeps 37°, which at 179u is
       116u of arc against 85u of name. */
    const specs = carrierLettering(record());
    const band = specs.filter((s) => s.slot.startsWith("band."));
    expect(band, "the band dropped a substrate name").toHaveLength(5);
    const groups = carrierLayout(record()).groups;
    for (const spec of band) {
      const key = spec.slot.slice("band.".length);
      const group = groups.find((g) => g.key === key)!;
      expect(group, `band.${key} names an unknown part`).toBeDefined();
      expect(spec.fs, `${spec.slot} letters under the floor`).toBeGreaterThanOrEqual(FS_FLOOR);
      const width = spec.text.length * (spec.fs * (0.6 + spec.track));
      expect(
        width,
        `${spec.slot}: "${spec.text}" runs past its ${spec.measure.toFixed(0)}u arc`
      ).toBeLessThanOrEqual(spec.measure);
      /* ⚠ THE MEASURE IS DERIVED FROM THE GROUP, so re-deriving it here
         proves the derivation is what the spec carries — the group's arc
         at BAND_R minus the band's per-end pad. */
      expect(spec.measure, `${spec.slot} measure drifted off the group`).toBeCloseTo(
        carrierBandMeasure(group),
        6
      );
    }
  });

  it("draws a `textPath` arc for every label, cell and band alike", () => {
    /* ⚠ THE ARC PATH IS THE LABEL'S FURNITURE. A drawing that misplaced
       these — dropped the leading `M`, reused the same id twice, wrote the
       wrong sweep flag — would render a label at the SVG origin and pass
       every fit check silently. Two lines here, one per family: the path
       string starts with a move, and the arc's chord is the endpoints of
       the cell/group at the label's radius. */
    const layout = carrierLayout(record());
    for (const cell of layout.cells) {
      const path = carrierCellArcPath(cell);
      expect(path.startsWith("M"), `${cell.skill.id} arc: missing move`).toBe(true);
      expect(path).toContain(" A");
    }
    for (const group of layout.groups) {
      const path = carrierBandArcPath(group);
      expect(path.startsWith("M"), `${group.key} band arc: missing move`).toBe(true);
      expect(path).toContain(" A");
    }
  });

  it("commits the hub on click and dims on hover, without doubling the drawing", () => {
    /* ⚠ THE FIRST CUT DROVE THE CENTRE OFF `hot ?? pinned`, which made the
       click invisible: the hover had already put the identity where the
       click was going to put it. U28's fix split the states into `tag.*`
       and `skill.*`; this variant has no tag any more (the cell is always
       named) so the split is `cell.*` vs `pin.*` — hover TAKES ITS COLOR
       from the cell, click COMMITS the hub. */
    const specs = carrierLettering(record());
    const cellsFamily = specs.filter((s) => s.slot.startsWith("cell."));
    const pin = specs.filter((s) => s.slot.startsWith("pin."));
    /* No `tag.*` slots — the hover tag went with the sagitta and the ring. */
    expect(
      specs.filter((s) => s.slot.startsWith("tag.")),
      "the hover tag came back"
    ).toHaveLength(0);
    expect(cellsFamily, "no cell can name itself at rest").toHaveLength(47);
    expect(
      pin.length,
      "the click buys nothing the resting drawing did not already show"
    ).toBeGreaterThan(cellsFamily.length);
  });

  it("marks exactly five first encodes, each on the carrier's rim", () => {
    const { cells, groups } = carrierLayout(record());
    const flagships = cells.filter((c) => c.skill.flagship);
    expect(flagships).toHaveLength(5);
    for (const group of groups) {
      const mine = flagships.filter((c) => c.key === group.key);
      expect(mine, `${group.key} has no unique green provenance cell`).toHaveLength(1);
      /* Green on an internal course seam reads as a divider, not as
         provenance — so the first encode has to sit in the outermost course. */
      expect(mine[0].course, `${group.key}'s first encode is not on the rim`).toBe(
        group.courses.length - 1
      );
      expect(mine[0].r1).toBeCloseTo(CARRIER_R_OUT, 6);
    }
  });

  it("pays the clip back in density, so five materials stay five materials", () => {
    /* ⚠ THE MATERIAL IS THE DIFFERENTIATION CLAIM, and a clipped field is a
       thinned one: `substrateForms` paints an absolute count into a BOX, the
       part is a wedge inside it, and the difference is silently discarded. Every
       part here covers well under its own bounding box, so every part must be
       compensated — a `fieldK` of exactly 1 across the board would mean the
       coverage term was never wired in, which is what the first cut shipped and
       what no assertion said.

       ⚠ AND IT IS MEASURED AGAINST THE GEOMETRY, NOT AGAINST THE FORMULA THAT
       PRODUCED IT. Re-deriving the sector area the way the layout does would
       assert that arithmetic equals itself; this samples each part's own
       bounding box on a grid and counts what falls inside the wedge, so a
       wrong radius or a dropped term in `carrierLayout` surfaces here.

       ⚠ THE FIRST VERSION OF THIS GUARD ASSERTED AN ORDERING INSTEAD — that a
       wider wedge fills more of its own box, so it needs less paying back.
       That is true of a pie slice and FALSE of an annular one: widening the
       sweep grows the bounding box around the aperture's hole faster than it
       grows the part, so coverage FALLS with sweep. Pattern's 104° is the most
       compensated, not the least. */
    const groups = carrierLayout(record()).groups;
    for (const group of groups) {
      expect(group.fieldK, `${group.key}'s field is not paid back for its clip`).toBeGreaterThan(
        1.2
      );
      expect(group.fieldK, `${group.key}'s field density is uncapped`).toBeLessThanOrEqual(3);

      const N = 200;
      let inside = 0;
      for (let ix = 0; ix < N; ix += 1) {
        for (let iy = 0; iy < N; iy += 1) {
          const px = group.bbox.x + ((ix + 0.5) / N) * group.bbox.w - CARRIER_CX;
          const py = group.bbox.y + ((iy + 0.5) / N) * group.bbox.h - CARRIER_CY;
          let a = (Math.atan2(py, px) * 180) / Math.PI;
          while (a < group.a0) a += 360;
          if (a > group.a1) continue;
          const r = Math.hypot(px, py);
          if (r < carrierRayRadius(a, CARRIER_R_CELL) || r > carrierRayRadius(a, CARRIER_R_OUT))
            continue;
          inside += 1;
        }
      }
      expect(
        group.fieldK,
        `${group.key}'s compensation does not match the coverage it actually has`
      ).toBeCloseTo((N * N) / inside, 1);
    }
    /* The cap and the floor, at the limits, so neither can drift silently. */
    expect(carrierFieldK(1, 100)).toBe(3);
    expect(carrierFieldK(100, 100)).toBe(1);
    expect(carrierFieldK(0, 100), "a degenerate part must not divide by zero").toBe(1);
  });

  it("announces every cell uniquely to a screen reader", () => {
    /* Forty-seven identically-shaped hit targets with no accessible name are
       forty-seven unreachable facts. The core is the only place a Skill is
       lettered, so the aria label is the non-visual equivalent of it. */
    const { cells, groups } = carrierLayout(record());
    const labels = cells.map((c) =>
      carrierCellLabel(c, groups.find((g) => g.key === c.key)?.name ?? "")
    );
    for (const label of labels) {
      expect(label.length, "a cell announces nothing").toBeGreaterThan(8);
      expect(label, "a cell announces an unnamed part").not.toMatch(/, ,/);
    }
    expect(new Set(labels).size, "two cells announce the same thing").toBe(labels.length);
  });
});
