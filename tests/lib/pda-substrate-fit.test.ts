import { describe, expect, it } from "vitest";

import {
  CARDS,
  ESTATE_BLOCK_H,
  HEAD_H,
  PLATE_COLS,
  PLATE_PITCH,
  SECTION_ORDER,
  SHAFT_W,
  SHAFT_X,
  STRATA_H0,
  STRATA_W,
  STRATA_X,
  SUB_CROP_W,
  SUBSTRATE_LAYOUT_0,
  paraOf,
  plateAt,
  sectionColumns,
  sectionConductorCount,
  sectionStrata,
  shaftLaneX,
  skillsOf,
  substrateExt,
  substrateLayout,
  substrateLettering,
} from "@/components/landing/home-v2/services/casefile/map/pda/PdaSubstrate";
import {
  ESTATE_CELL_H,
  ESTATE_CELL_W,
  GALLERY_LANES,
  estateSlots,
  laneX,
} from "@/components/landing/home-v2/services/casefile/map/pda/estateBand";
import { specWidth } from "@/components/landing/home-v2/services/casefile/map/pda/pdaLetters";
import {
  crossing,
  selectWorks,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import { FS_FLOOR } from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";
import { getCase } from "@/lib/cases/registry";

/**
 * READING 03'S FIT AND ITS ENVELOPE — the SECTION drawing (ADR-070 U25).
 *
 * ⚠ **THE PROMOTION MOVED THE STRUCTURAL QUESTIONS FROM THE LAB TO HERE**
 * (2026-08-17). U24's divided plate was the shipped drawing; SECTION is
 * now, so its arithmetic — body-proportional-to-count, shaft lanes inside
 * the shaft, plate columns inside the stratum — lives beside the drawing
 * it walks. The lab keeps MANIFOLD as the losing round-nine alternative
 * and its own fit guard walks that.
 *
 * ⚠ A LETTERED STRING MISSING FROM `substrateLettering` IS A DEFECT IN THE
 * DRAWING, not an economy in the guard. SVG `<text>` does not wrap, does
 * not ellipsise and does not report overflow — a label past its measure
 * simply vanishes, with nothing on screen to say so. That matters more on
 * the strata than it did on the pin grid: **47 of the ~57 lettered strings
 * are Skill labels**, so the great majority of this surface is content
 * the drawing did not author and cannot shorten.
 */

function record() {
  const visual = getCase("loop-earplugs")?.casefile.tracks.find(
    (t) => t.visual.kind === "intelligence-map"
  )?.visual;
  if (!visual || visual.kind !== "intelligence-map") throw new Error("no intelligence-map track");
  const shown = selectWorks(visual.districts, visual.works);
  const cross = crossing(visual.shapes, visual.districts, visual.works, shown);
  return {
    teams: cross.teams,
    shapes: cross.shapes,
    skills: visual.skills ?? [],
    works: shown,
  };
}

describe("the substrate section fits its box", () => {
  it("every string fits the measure it declares", () => {
    const specs = substrateLettering(record());
    /* Five names + five counts + up to ten paragraph lines + 47 Skill
       plates = ~67 at rest. If a stratum drops a slot the total falls
       loudly, so 55 is a floor the arithmetic cannot reach silently. */
    expect(specs.length, "the drawing letters almost nothing").toBeGreaterThan(55);
    for (const s of specs) {
      expect(s.text.length, `${s.slot} is blank`).toBeGreaterThan(0);
      expect(
        specWidth(s),
        `${s.slot}: "${s.text}" runs past its ${s.measure}u measure`
      ).toBeLessThanOrEqual(s.measure);
    }
  });

  it("every stratum letters its name, its count and its paragraph", () => {
    /* ⚠ WHAT A TOTAL CANNOT SEE. Five strata × three roles; a stratum that
       lost one of them still leaves a plausible-looking count. The
       paragraph is the only prose on the console, so it is also the one a
       future edit is most likely to drop back to a fragment. */
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
      /* ⚠ AND THE SLICE SLOT MUST BE ABSENT. `substrateLettering` declares
         a dropped tail at measure 0 precisely so it fails the fit
         assertion above; asserting its absence here names the failure
         instead of leaving it to a width error nobody reads. */
      expect(
        mine.some((x) => x.slot === `${s.key}.para.sliced`),
        `${s.key}'s paragraph is too long and lost its tail`
      ).toBe(false);
    }

    /* ⚠ AND EVERY ENCODED SKILL IS DECLARED. The 47 labels are the largest
       block of lettering on this console and they are content the drawing
       did not author and cannot shorten — a stratum that quietly drew
       fewer plates than its numeral claims would still pass every
       per-string check. */
    const declared = specs.filter((x) => x.slot.startsWith("skill.")).length;
    expect(declared, "the drawing stopped declaring its Skill plates").toBe(r.skills.length);
    for (const s of r.shapes) {
      const n = skillsOf(r.skills, s.key).length;
      const mine = specs.filter((x) =>
        skillsOf(r.skills, s.key).some((k) => x.slot === `skill.${k.id}`)
      );
      expect(mine.length, `${s.key} declares ${mine.length} plates for ${n} Skills`).toBe(n);
    }
  });

  it("no single WORD runs through a wall", () => {
    /* ⚠ THE BINDING MEASURE IS A WORD, NOT A STRING (ADR-070 U6). The
       paragraph is the only thing here that wraps, and every per-LINE
       assertion keeps passing while the longest word overflows —
       `RECONCILIATION` is how reading 02 found this. */
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
    /* The elastic crop is width-bound by construction, so this should be
       flat across the board — an assertion that it IS is what would catch
       a crop that quietly started growing on the axis it is measured by. */
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

describe("the substrate section holds the map's envelope", () => {
  /* ⚠ THE MAP IS STRICTER THAN THE CASEFILE BY DESIGN. No personal names,
     no currency, no model families — and on THIS reading, no team counts. */
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

  it("never publishes a count as teams, and never says the word in its own chrome", () => {
    /* The same two-halves rule U24 introduced. `People-team` is a real
       Skill name in the record and is content, not chrome — a Skill label
       may contain the word; the drawing's own chrome may not. */
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
    expect(r.shapes, "a stratum lost its column").toHaveLength(CARDS);
    expect(r.teams, "the eight departments stopped being eight").toHaveLength(8);
    expect(
      r.shapes.reduce((n, s) => n + s.skills, 0),
      "the 47 stopped adding up"
    ).toBe(47);
  });

  it("every stratum's numeral equals the plates under it", () => {
    /* ⚠ THE COUNT IN THE HEADER IS CHECKABLE BY COUNTING PLATES. Two
       sources — `CaseMapShape.skills` and the Skills reservoir — and the
       drawing letters the SECOND. */
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

  it("every stratum the drawing letters carries a first-encode decision", () => {
    /* The `CUT BY` grammar, carried down a level: one green accent per
       stratum, and every stratum has one. */
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

describe("the section drawing is honest about its arithmetic", () => {
  /**
   * ⚠ **THE PROPORTIONAL CLAIM IS PER-BODY, NOT PER-REGION.** U24's area
   * claim was that whole-region area equalled the count; SECTION's is
   * that BODY equals the count, because heads are fixed chrome. Dividing
   * body by skill count must give the same unit for every stratum, at
   * every field shape.
   */
  const EXTS = [0, 80, 151, 366, 546];

  it("body height is proportional to skill count, at every field shape", () => {
    for (const ext of EXTS) {
      const r = record();
      const layout = substrateLayout({ extW: 0, extH: ext });
      const strata = sectionStrata(r.shapes, layout.strataH);
      const units = strata.map((s) => ({ key: s.key, unit: s.bodyH / s.n }));
      const base = units[0].unit;
      for (const u of units) {
        expect(
          Math.abs(u.unit - base) / base,
          `ext ${ext}, ${u.key}: unit ${u.unit.toFixed(2)} vs ${base.toFixed(2)} — the body stopped being the count`
        ).toBeLessThan(0.01);
      }
    }
  });

  it("plates fit their stratum's body, at every field shape", () => {
    /* ⚠ THE BINDING CASE IS THE LIGHTEST STRATUM, and it is arithmetic
       rather than bad luck: body ∝ count, so the stratum with the fewest
       Skills has the smallest body, while its head costs the same fixed
       54 units as every other's. At rest Stakeholder has a body around
       67u against a run of 20u (5 in one row); it opens comfortably to
       80u at the owner's viewport. */
    for (const ext of EXTS) {
      const r = record();
      const layout = substrateLayout({ extW: 0, extH: ext });
      const strata = sectionStrata(r.shapes, layout.strataH);
      for (const s of strata) {
        const rows = Math.ceil(s.n / PLATE_COLS);
        expect(
          rows * PLATE_PITCH,
          `ext ${ext}, ${s.key}: ${s.n} plates in ${rows} rows overrun ${s.bodyH.toFixed(1)}u`
        ).toBeLessThanOrEqual(s.bodyH);
      }
    }
  });

  it("every plate's label fits its own column", () => {
    /* ⚠ THE MEASURE IS THE COLUMN, NOT THE STRATUM. Five columns × the
       narrow strata's ~161u pitch = 805u; each plate's label sits in that
       column less the accent and its two gaps. The 14-character `short`
       cap is enforced by `cases-registry`; this asserts the column can
       hold it at fs 12. */
    const r = record();
    const { colW } = sectionColumns();
    const labelMeasure = colW - 3 - 6 - 6;
    const longest = r.skills.reduce((a, s) => (s.short.length > a.length ? s.short : a), "");
    expect(
      longest.length * 12 * (0.6 + 0.08),
      `"${longest}" runs past its ${labelMeasure.toFixed(1)}u column`
    ).toBeLessThanOrEqual(labelMeasure);
  });

  it("the plate columns fit the stratum's width", () => {
    const { colW, colGap } = sectionColumns();
    const total = PLATE_COLS * colW + (PLATE_COLS - 1) * colGap;
    expect(total, "the plate columns run past the stratum's wall").toBeLessThanOrEqual(STRATA_W);
  });

  it("the strata block never overlaps the shaft", () => {
    expect(STRATA_X, "the strata start left of the shaft's right wall").toBeGreaterThanOrEqual(
      SHAFT_X + SHAFT_W
    );
    expect(STRATA_W, "the strata block collapsed").toBeGreaterThan(0);
  });

  it("the shaft's five lanes stay inside its housing", () => {
    for (const k of SECTION_ORDER) {
      const x = shaftLaneX(k);
      expect(x, `${k} lane escaped the shaft (below)`).toBeGreaterThanOrEqual(SHAFT_X);
      expect(x, `${k} lane escaped the shaft (above)`).toBeLessThanOrEqual(SHAFT_X + SHAFT_W);
    }
  });

  it("configured streams emit exactly `taps.length` conductors; person-led emit zero", () => {
    /* ⚠ THE CONDUCTOR MATH is the drawing's whole selection state. A
       stream with three taps must draw exactly three; a person-led stream
       must draw zero (the record has nothing to point at). */
    const r = record();
    for (const w of r.works) {
      const expected = w.configured ? w.taps.length : 0;
      expect(
        sectionConductorCount(w),
        `${w.id}: draws ${sectionConductorCount(w)} conductors, record says ${expected}`
      ).toBe(expected);
    }
  });

  it("shaft and gallery share the same lane order — conductors cannot cross", () => {
    /* ⚠ LANES CANNOT CROSS IN THE GALLERY. `GALLERY_LANES` is ordered
       left-to-right by shape; `SECTION_ORDER` is ordered top-to-bottom by
       shape. Both have to be the SAME array or a conductor from a
       configured footprint crosses one from a different footprint in the
       gallery band — the routing pattern the isometric city collapsed
       under (ADR-062). */
    expect(GALLERY_LANES, "gallery and section orders diverged").toEqual(SECTION_ORDER);
  });

  it("the estate band's footprints tile the row and stay inside the plate", () => {
    /* ⚠ THE THIRD HOME. Every configured stream must have a lookup-able
       slot in the estate band, or the flight's third destination is
       null. `estateSlots` is what the flight walks; the drawing paints
       these same rectangles. */
    const r = record();
    const y0 = 26;
    const bandLeft = 26;
    const bandWidth = SUB_CROP_W - 52;
    const slots = estateSlots(r.works, y0, bandLeft, bandWidth);
    expect(slots.length, "the estate band lost footprints").toBe(r.works.length);
    for (const s of slots) {
      expect(s.y, `slot ${s.id} broke the band's top edge`).toBeGreaterThanOrEqual(y0);
      expect(s.y + s.h, `slot ${s.id} broke the band's bottom edge`).toBeLessThanOrEqual(
        y0 + ESTATE_CELL_H
      );
      expect(s.w, `slot ${s.id} lost its width`).toBe(ESTATE_CELL_W);
    }
    for (let i = 0; i < slots.length - 1; i += 1) {
      expect(
        slots[i + 1].x,
        `slots ${i} and ${i + 1} overlap in the estate band`
      ).toBeGreaterThanOrEqual(slots[i].x + slots[i].w);
    }
    /* No slot bleeds past the plate's inner wall. */
    const last = slots[slots.length - 1];
    expect(last.x + last.w, "the estate band bled past its own right wall").toBeLessThanOrEqual(
      bandLeft + bandWidth
    );
    expect(slots[0].x, "the estate band bled past its own left wall").toBeGreaterThanOrEqual(
      bandLeft
    );
  });

  it("the rest crop stays WIDTH-bound at the narrowest field there is", () => {
    /* ⚠ THE WHOLE ELASTIC MECHANISM RESTS ON THIS. `fitExt` grows height
       when the field is taller than the crop, and this reading forbids
       width growth, so a crop even fractionally taller in aspect than
       some field goes height-bound there and can never reach that
       panel's edges.
       The narrowest measured field is 1440×800, aspect 0.807. The rest
       crop's aspect must sit at or under it. */
    const [, , cw, ch] = SUBSTRATE_LAYOUT_0.crop.split(" ").map(Number);
    const NARROWEST = 548 / 679;
    expect(ch / cw, "the rest crop is taller than the narrowest field").toBeLessThanOrEqual(
      NARROWEST
    );
  });

  it("the plate at rest holds the same content window as U24", () => {
    /* ⚠ `BOX_H0` = 696 is unchanged — the outer plate is the same size
       so the estate + strata block occupies exactly the same footprint
       U24's five regions did. Rest strataH is boxH − ESTATE_BLOCK_H. */
    expect(SUBSTRATE_LAYOUT_0.boxH, "the plate's own height moved").toBe(696);
    expect(SUBSTRATE_LAYOUT_0.strataH, "the strata block's rest height moved").toBe(STRATA_H0);
    expect(STRATA_H0, "STRATA_H0 diverged from the arithmetic").toBe(696 - ESTATE_BLOCK_H);
  });

  it("plate coordinates come out in crop space", () => {
    /* ⚠ THE ROUND-NINE CAPTURE'S FIRST DEFECT was that plateAt returned
       strata-block-relative Y and the drawing painted it as crop-Y — the
       whole plate stack landed inside the estate band. `y0` is the strata
       top in crop space; every returned Y must sit inside the strata
       block. */
    const r = record();
    const layout = substrateLayout({ extW: 0, extH: 0 });
    const strata = sectionStrata(r.shapes, layout.strataH);
    const { colW, colGap } = sectionColumns();
    const y0 = layout.strataTop;
    for (const s of strata) {
      for (let k = 0; k < s.n; k += 1) {
        const p = plateAt(s, k, colW, colGap, y0);
        expect(p.y, `${s.key} plate ${k} landed above the strata block`).toBeGreaterThanOrEqual(y0);
        expect(p.y + p.h, `${s.key} plate ${k} landed under the strata block`).toBeLessThanOrEqual(
          y0 + layout.strataH
        );
      }
    }
  });

  it("the paragraph never wants a line past its cap", () => {
    /* `wrapLines` SLICES at its cap, so a `meaning` that wanted three
       lines would lose its tail from the drawing. `substrateLettering`
       declares that tail with `.para.sliced` and a zero measure; this is
       the assertion that ties them together. */
    for (const shape of record().shapes) {
      const lines = paraOf(shape.meaning);
      const kept = lines.join(" ").length;
      expect(kept, `${shape.key}'s paragraph "${shape.meaning}" wanted a third line`).toBe(
        shape.meaning.length
      );
    }
  });

  it("laneX and shaftLaneX agree on the shape order", () => {
    /* Both functions compute a lane x for a shape; the gallery band and
       the shaft must agree on WHICH shape sits at which lane, or a
       conductor from one lane in the gallery would drop into a different
       lane in the shaft. */
    const [w0, w1, w2, w3, w4] = SECTION_ORDER.map((k) => laneX(k, 26, SUB_CROP_W - 52));
    const [s0, s1, s2, s3, s4] = SECTION_ORDER.map((k) => shaftLaneX(k));
    /* Both orders are monotone left-to-right on their own axes, so their
       shape indices align — asserted by comparing pairwise differences. */
    expect(w0 < w1 && w1 < w2 && w2 < w3 && w3 < w4, "gallery lanes are not monotone").toBe(true);
    expect(s0 < s1 && s1 < s2 && s2 < s3 && s3 < s4, "shaft lanes are not monotone").toBe(true);
  });
});
