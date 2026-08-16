import { describe, expect, it } from "vitest";

import {
  CARDS,
  SUBSTRATE_LAYOUT_0,
  paraOf,
  regionGeometry,
  skillsOf,
  substrateBlocks,
  substrateExt,
  substrateLayout,
  substrateLettering,
  substrateRows,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaSubstrate";
import { specWidth } from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";
import {
  crossing,
  selectWorks,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import { FS_FLOOR } from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";
import { getCase } from "@/lib/cases/registry";

/**
 * READING 03'S FIT AND ITS ENVELOPE.
 *
 * ⚠ **THIS READING HAD NO ARITHMETIC GUARD AT ALL UNTIL 2026-08-12**, and that
 * is how it shipped an unpublishable string. `cases-registry` walks `CASES`
 * and `PROJECT_CASES` objects with `JSON.stringify`; the drawing before last
 * composed `{n} SKILLS · {n} TEAMS` at render time inside a component, where
 * no scanner reaches — so for PATTERN it printed **8 TEAMS** on the public
 * page (8 is the DEPARTMENT count; 22 briefed and 14 running the layer are
 * different units and different sets).
 *
 * ⚠ A LETTERED STRING MISSING FROM `substrateLettering` IS A DEFECT IN THE
 * DRAWING, not an economy in the guard. SVG `<text>` does not wrap, does not
 * ellipsise and does not report overflow — a label past its measure simply
 * vanishes, with nothing on screen to say so. That matters more on the cards
 * than it did on the pin grid: **47 of the ~71 lettered strings are Skill
 * labels**, so the great majority of this surface is now content the drawing
 * did not author and cannot shorten.
 */

function record() {
  const visual = getCase("loop-earplugs")?.casefile.tracks.find(
    (t) => t.visual.kind === "intelligence-map"
  )?.visual;
  if (!visual || visual.kind !== "intelligence-map") throw new Error("no intelligence-map track");
  const shown = selectWorks(visual.districts, visual.works);
  const cross = crossing(visual.shapes, visual.districts, visual.works, shown);
  return { teams: cross.teams, shapes: cross.shapes, skills: visual.skills ?? [] };
}

describe("the substrate cards fit their boxes", () => {
  it("every string fits the measure it declares", () => {
    const specs = substrateLettering(record());
    /* ⚠ THE TOTAL FELL FROM ~71 TO ~20 AND THAT IS THE POINT (owner,
       2026-08-16). The card stack lettered 47 Skill labels; the graduation
       letters none of them — the ticks are countable, not readable. What is
       left is name + count + the paragraph's own lines, so 3 × 5 = 15 is the
       one-line minimum and the record's five all wrap to two.

       ⚠ A TOTAL IS A COARSE NET, so the structural check below is the real
       one: a magic number cannot tell you WHICH region stopped speaking. */
    expect(specs.length, "the drawing letters almost nothing").toBeGreaterThan(17);
    for (const s of specs) {
      expect(s.text.length, `${s.slot} is blank`).toBeGreaterThan(0);
      expect(
        specWidth(s),
        `${s.slot}: "${s.text}" runs past its ${s.measure}u measure`
      ).toBeLessThanOrEqual(s.measure);
    }
  });

  it("every region letters its name, its count and its paragraph", () => {
    /* ⚠ WHAT A TOTAL CANNOT SEE. Five regions × three roles; a region that
       lost one of them still leaves a plausible-looking count. The paragraph
       is the newest of the three and the only prose on the console, so it is
       also the one a future edit is most likely to drop back to a fragment. */
    const r = record();
    const specs = substrateLettering(r);
    for (const s of r.shapes) {
      const mine = specs.filter((x) => x.slot.startsWith(`${s.key}.`));
      expect(
        mine.some((x) => x.slot === `${s.key}.name`),
        `${s.key} letters no name`
      ).toBe(true);
      expect(
        mine.some((x) => x.slot === `${s.key}.count`),
        `${s.key} letters no count`
      ).toBe(true);
      expect(
        mine.filter((x) => x.slot.startsWith(`${s.key}.para.`)).length,
        `${s.key} letters no paragraph`
      ).toBeGreaterThan(0);
      /* ⚠ AND THE SLICE SLOT MUST BE ABSENT. `substrateLettering` declares a
         dropped tail at measure 0 precisely so it fails the fit assertion
         above; asserting its absence here names the failure instead of
         leaving it to a width error nobody reads. */
      expect(
        mine.some((x) => x.slot === `${s.key}.para.sliced`),
        `${s.key}'s paragraph is too long and lost its tail`
      ).toBe(false);
    }
  });

  it("no single WORD runs through a wall", () => {
    /* ⚠ THE BINDING MEASURE IS A WORD, NOT A STRING (ADR-070 U6). The foot's
       gloss is the only thing here that wraps, and every per-LINE assertion
       keeps passing while the longest word overflows — `RECONCILIATION` is how
       reading 02 found this. */
    for (const s of substrateLettering(record())) {
      const longest = s.text.split(" ").reduce((a, b) => (b.length > a.length ? b : a), "");
      expect(
        longest.length * s.fs * (0.6 + s.track),
        `${s.slot}: "${longest}" alone is wider than ${s.measure}u`
      ).toBeLessThanOrEqual(s.measure);
    }
  });

  it("nothing letters under the floor the owner set", () => {
    for (const s of substrateLettering(record())) {
      expect(s.fs, `${s.slot} letters at ${s.fs}`).toBeGreaterThanOrEqual(FS_FLOOR);
    }
  });

  it("the type keeps its floor at every field shape", () => {
    /* The elastic crop is width-bound by construction, so this should be flat
       across the board — an assertion that it IS is what would catch a crop
       that quietly started growing on the axis it is measured by. */
    for (const f of [
      { at: "1280x720", w: 603, h: 493 },
      { at: "1920x1080", w: 850, h: 760 },
      { at: "the owner's", w: 845, h: 950 },
      { at: "2560x1440", w: 850, h: 1120 },
    ]) {
      const [, , cw, ch] = substrateLayout(substrateExt(f.h / f.w))
        .crop.split(" ")
        .map(Number);
      const meet = Math.min(f.w / cw, f.h / ch);
      expect(FS_FLOOR * meet, `${f.at}: the floor fell under the smoke's 4.3px`).toBeGreaterThan(
        4.6
      );
    }
  });
});

describe("the substrate cards hold the map's envelope", () => {
  /* ⚠ THE MAP IS STRICTER THAN THE CASEFILE BY DESIGN. No personal names, no
     currency, no model families — and on THIS reading, no team counts. */
  const BANNED: readonly { label: string; re: RegExp }[] = [
    { label: "money", re: /[$€£¥]|\b(usd|eur|gbp)\b|\d{1,3}(,\d{3})+/i },
    {
      label: "a model family",
      re: /\b(opus|sonnet|haiku|fable|gpt|gemini|llama|mistral|claude)\b/i,
    },
    { label: "a vendor", re: /\b(openai|anthropic|supabase|slack|salesforce)\b/i },
    { label: "an ordinal designator", re: /\bSB-\d/i },
  ];

  it("letters nothing the envelope forbids", () => {
    for (const s of substrateLettering(record())) {
      for (const b of BANNED) {
        expect(b.re.test(s.text), `${s.slot} publishes ${b.label}: "${s.text}"`).toBe(false);
      }
    }
  });

  /**
   * ⚠ **THE TEAMS BAN IS TWO RULES NOW, AND NARROWING IT WAS NOT A WEAKENING.**
   *
   * The original defect was `8 TEAMS` — a DEPARTMENT count wearing the word,
   * composed by the drawing itself. One blanket `/\bteams?\b/i` caught it, and
   * it also catches `People-team`, which is a Loop team's PROPER NAME and the
   * client's own shorthand for the Skill. That string already ships: the same
   * case's registry row letters `People-team Voice` in full, one casefile row
   * away.
   *
   * So the two halves are split by who wrote the string. Chrome the DRAWING
   * composes may not contain the word at all — that is where the defect lives
   * and the rule there is absolute. A Skill label is content from the record,
   * and there the rule is the actual failure mode: a number next to the word.
   */
  it("never publishes a count as teams, and never says the word in its own chrome", () => {
    const COUNTED = /\d\s*teams?\b|\bteams?\s*[:=]?\s*\d/i;
    for (const s of substrateLettering(record())) {
      expect(COUNTED.test(s.text), `${s.slot} publishes a count as teams: "${s.text}"`).toBe(false);
      if (!s.slot.startsWith("skill.")) {
        expect(/\bteams?\b/i.test(s.text), `${s.slot} is chrome and says teams: "${s.text}"`).toBe(
          false
        );
      }
    }
  });

  it("still adds up to the record", () => {
    const r = record();
    expect(r.shapes, "the five shapes stopped being five").toHaveLength(5);
    expect(r.shapes, "a card lost its column").toHaveLength(CARDS);
    expect(r.teams, "the eight departments stopped being eight").toHaveLength(8);
    expect(
      r.shapes.reduce((n, s) => n + s.skills, 0),
      "the 47 stopped adding up"
    ).toBe(47);
  });

  /**
   * ⚠ **THE COUNT IN THE HEADER IS NOW CHECKABLE BY COUNTING PLATES**, which is
   * exactly why it has to be true. The pin grid lettered `{n} SKILLS` as an
   * aggregate nobody on the page could verify; this drawing prints the numeral
   * beside a stack a reader can count. Two sources — `CaseMapShape.skills` and
   * the Skills reservoir — and the drawing letters the SECOND.
   */
  it("every card's numeral equals the plates under it", () => {
    const r = record();
    for (const s of r.shapes) {
      const plates = skillsOf(r.skills, s.key);
      expect(
        plates.length,
        `${s.key}: the header says ${s.skills} and the stack has ${plates.length}`
      ).toBe(s.skills);
    }
    expect(
      r.shapes.reduce((n, s) => n + skillsOf(r.skills, s.key).length, 0),
      "a Skill's engine names no pattern on this drawing, so it is drawn nowhere"
    ).toBe(r.skills.length);
  });

  it("every plate the drawing letters carries a first-encode decision", () => {
    /* The `CUT BY` grammar, carried down a level: one green accent per card,
       and every card has one. ⚠ THIS ASSERTS THE DRAWING, NOT THE MODEL — that
       `flagship` is unique per engine is a rule about `CaseSkillEntry` and
       lives in `cases-registry`, along with the `short` label's cap and its
       authored-not-clipped rule. Here the question is narrower and it is the
       one the pin grid could not have asked: does every card this drawing
       PUTS ON SCREEN have exactly one green plate in the stack it draws? A
       pattern with no first encode is a card with no green in it, which reads
       as five patterns of which one is unexplained. */
    const r = record();
    for (const s of r.shapes) {
      const first = skillsOf(r.skills, s.key).filter((k) => k.flagship);
      expect(
        first.map((k) => k.id),
        `${s.key} has ${first.length} first encodes`
      ).toHaveLength(1);
    }
  });
});

describe("the plate is one surface divided, and every region is material", () => {
  const EXTS = [0, 80, 151, 366, 546, 1137];
  const blocksAt = (ext: number) => {
    const r = record();
    const l = substrateLayout({ extW: 0, extH: ext });
    return { r, l, blocks: substrateBlocks(substrateRows(r.shapes, r.skills), l.boxH) };
  };

  it("AREA IS THE COUNT, at every field shape", () => {
    /* ⚠ THE ONE CLAIM THE DRAWING MAKES, and the only way to check a
       continuous encoding: divide each region's area by its Skill count and
       every pattern must land on the same unit. It fails the moment a floor, a
       clamp or a hand-tuned constant is introduced — which is exactly what a
       "just make Stakeholder a bit taller so the text fits" edit would be. */
    for (const ext of EXTS) {
      const { r, blocks } = blocksAt(ext);
      const counts = new Map(substrateRows(r.shapes, r.skills).map((x) => [x.key, x.n]));
      const units = blocks.map((b) => (b.w * b.h) / (counts.get(b.key) ?? 1));
      for (const u of units) {
        expect(u / units[0], `ext ${ext}: a region's area stopped being its count`).toBeCloseTo(
          1,
          2
        );
      }
    }
  });

  it("every region keeps material under its paragraph", () => {
    /* The reading is EXTRACTION — the definition and the tally over the stuff
       they came out of. A region with no field left is a caption in a box.
       ⚠ The binding case is the LIGHTEST pattern, not the heaviest: area is
       the count, so the smallest region is the one whose fixed-height head and
       graduation eat the largest share. */
    for (const ext of EXTS) {
      const { r, blocks } = blocksAt(ext);
      const byKey = new Map(r.shapes.map((s) => [s.key as string, s]));
      for (const b of blocks) {
        const s = byKey.get(b.key);
        if (!s) throw new Error(`no shape for ${b.key}`);
        const geo = regionGeometry(b, paraOf(s.meaning, b).length);
        expect(geo.fieldH, `ext ${ext}, ${b.key}: no material under the copy`).toBeGreaterThan(16);
      }
    }
  });

  it("the graduation fits inside its own region", () => {
    /* ⚠ ONE SHARED PITCH, so the run's length is the count and the widest run
       is the heaviest pattern's. A tick past the wall does not wrap or clip
       loudly — it paints over the grout and into the neighbour. */
    const { r, blocks } = blocksAt(0);
    const counts = new Map(substrateRows(r.shapes, r.skills).map((x) => [x.key, x.n]));
    for (const b of blocks) {
      const geo = regionGeometry(b, 2);
      const n = counts.get(b.key) ?? 0;
      expect(16 + n * 16, `${b.key}: ${n} ticks run past their region`).toBeLessThanOrEqual(geo.w);
    }
  });

  it("the regions tile the plate — no overlap, and a grout between them", () => {
    /* ⚠ THE PARTITION AND THE PAINTED RECTS ARE DIFFERENT BOXES, which is what
       the grout IS. The blocks tile exactly (any gap is a seam of plate showing
       mid-column); the painted rects must NOT touch, or the division the owner
       could not find is back. */
    for (const ext of EXTS) {
      const { blocks } = blocksAt(ext);
      const area = blocks.reduce((n, b) => n + b.w * b.h, 0);
      const { l } = blocksAt(ext);
      expect(area, `ext ${ext}: the blocks stopped tiling the plate`).toBeCloseTo(880 * l.boxH, 0);

      for (const a of blocks) {
        for (const b of blocks) {
          if (a === b) continue;
          const ga = regionGeometry(a, 2);
          const gb = regionGeometry(b, 2);
          const overlap =
            ga.x < gb.x + gb.w && gb.x < ga.x + ga.w && ga.y < gb.y + gb.h && gb.y < ga.y + ga.h;
          expect(overlap, `ext ${ext}: ${a.key} and ${b.key} touch — no grout between them`).toBe(
            false
          );
        }
      }
    }
  });

  it("the regions take the height before the margin does", () => {
    /* ADR-070 U12's law: pooled air is a hole, split air is spacing. Here the
       whole extension goes to the regions, because everything below a region's
       fixed head is MATERIAL and texture absorbs room honestly. */
    const rest = SUBSTRATE_LAYOUT_0;
    const owners = substrateLayout(substrateExt(950 / 845));
    expect(owners.boxH, "the owner's field did not reach the plate").toBeGreaterThan(rest.boxH);
    expect(owners.marginY, "the height pooled as margin instead").toBeCloseTo(rest.marginY, 1);
  });

  it("the rest crop stays WIDTH-bound at the narrowest field there is", () => {
    /* ⚠ THE WHOLE ELASTIC MECHANISM RESTS ON THIS. `fitExt` grows height when
       the field is taller than the crop, and this reading forbids width growth,
       so a crop even fractionally taller in aspect than some field goes
       height-bound there and can never reach that panel's edges.

       The lab's own 932 × 762 (aspect 0.8176) is height-bound at 1440×800
       (0.8071) by four thousandths, which cost 9px of dead panel — measured,
       not theorised. The narrowest measured field is the ceiling. */
    const [, , cw, ch] = SUBSTRATE_LAYOUT_0.crop.split(" ").map(Number);
    const NARROWEST = 548 / 679;
    expect(ch / cw, "the rest crop is taller than the narrowest field").toBeLessThanOrEqual(
      NARROWEST
    );
  });
});
