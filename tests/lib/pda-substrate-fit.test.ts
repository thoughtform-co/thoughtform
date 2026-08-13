import { describe, expect, it } from "vitest";

import {
  CARDS,
  SUBSTRATE_LAYOUT_0,
  cardGeometry,
  skillsOf,
  substrateExt,
  substrateLayout,
  substrateLettering,
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
    /* 5 names + 5 counts + ~14 gloss lines + 47 Skill labels. Under 65 means a
       card stopped declaring its stack. */
    expect(specs.length, "the drawing letters almost nothing").toBeGreaterThan(65);
    for (const s of specs) {
      expect(s.text.length, `${s.slot} is blank`).toBeGreaterThan(0);
      expect(
        specWidth(s),
        `${s.slot}: "${s.text}" runs past its ${s.measure}u measure`
      ).toBeLessThanOrEqual(s.measure);
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

describe("the cards are stacks, not holes", () => {
  it("the densest card holds its stack, its field and its foot", () => {
    /* Pattern's fourteen plates set every vertical minimum. If the stack ever
       runs into the foot the labels do not move — they overlap the gloss, and
       nothing but the eye sees it. */
    const r = record();
    for (const ext of [0, 80, 151, 366, 546, 1137]) {
      const l = substrateLayout({ extW: 0, extH: ext });
      for (const [i, s] of r.shapes.entries()) {
        const plates = skillsOf(r.skills, s.key).length;
        const geo = cardGeometry(i, plates, l);
        expect(geo.fieldY, `ext ${ext}, ${s.key}: the stack ran into the foot`).toBeLessThanOrEqual(
          geo.footY - 8
        );
      }
    }
  });

  it("the densest card always keeps some raw field", () => {
    /* The card's whole reading is extraction — plates above, the material
       they came out of below. A Pattern card with no field left is a list in
       a box, which is the drawing this one replaced. */
    const r = record();
    const densest = r.shapes.reduce((a, b) => (b.skills > a.skills ? b : a));
    const i = r.shapes.indexOf(densest);
    for (const ext of [0, 366, 1137]) {
      const l = substrateLayout({ extW: 0, extH: ext });
      const geo = cardGeometry(i, densest.skills, l);
      expect(geo.fieldH, `ext ${ext}: ${densest.key} has no substrate under it`).toBeGreaterThan(
        24
      );
    }
  });

  it("the cards take the height before the margin does", () => {
    /* ADR-070 U12's law: pooled air is a hole, split air is spacing. Up to the
       cap, every unit the field offers goes into the cards and the margin does
       not move. */
    const rest = SUBSTRATE_LAYOUT_0;
    const owners = substrateLayout(substrateExt(950 / 845));
    expect(owners.cardH, "the owner's field did not reach the cards").toBeGreaterThan(rest.cardH);
    expect(owners.pitch, "the plates did not take their share").toBeGreaterThan(rest.pitch);
    expect(owners.marginY, "the height pooled as margin instead").toBeCloseTo(rest.marginY, 1);
  });

  it("the plate pitch is bounded", () => {
    /* Unbounded, a taller panel is a plate with air under it rather than a
       taller plate — U12's hole in miniature. The field takes the remainder
       because texture can absorb room honestly and a label cannot. */
    for (const ext of [0, 366, 1137, 4000]) {
      const l = substrateLayout({ extW: 0, extH: ext });
      expect(l.pitch, `ext ${ext}: the stack went sparse`).toBeLessThanOrEqual(26);
      expect(l.pitch, `ext ${ext}: the plates cannot hold their label`).toBeGreaterThanOrEqual(18);
    }
  });
});
