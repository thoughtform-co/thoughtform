import { describe, expect, it } from "vitest";

import {
  SUBSTRATE_LAYOUT_0,
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
 * and `PROJECT_CASES` objects with `JSON.stringify`; the old drawing composed
 * `{n} SKILLS · {n} TEAMS` at render time inside a component, where no scanner
 * reaches — so for PATTERN it printed **8 TEAMS** on the public page, the exact
 * phrase the district guard names as its failure mode (8 is the DEPARTMENT
 * count; 22 briefed and 14 running the layer are different units and different
 * sets). Reading 02 has had a declaration walk since ADR-070; this is 03's.
 *
 * ⚠ A LETTERED STRING MISSING FROM `substrateLettering` IS A DEFECT IN THE
 * DRAWING, not an economy in the guard. SVG `<text>` does not wrap, does not
 * ellipsise and does not report overflow — a label past its measure simply
 * vanishes, with nothing on screen to say so.
 */

function record() {
  const visual = getCase("loop-earplugs")?.casefile.tracks.find(
    (t) => t.visual.kind === "intelligence-map"
  )?.visual;
  if (!visual || visual.kind !== "intelligence-map") throw new Error("no intelligence-map track");
  const shown = selectWorks(visual.districts, visual.works);
  const cross = crossing(visual.shapes, visual.districts, visual.works, shown);
  return { teams: cross.teams, shapes: cross.shapes };
}

describe("the pin grid fits its boxes", () => {
  it("every string fits the measure it declares", () => {
    const specs = substrateLettering(record());
    /* 8 departments × 2 + 5 patterns × 4 = 36. Under 30 means a row or a
       column stopped declaring what it draws. */
    expect(specs.length, "the drawing letters almost nothing").toBeGreaterThan(30);
    for (const s of specs) {
      expect(s.text.length, `${s.slot} is blank`).toBeGreaterThan(0);
      expect(
        specWidth(s),
        `${s.slot}: "${s.text}" runs past its ${s.measure}u measure`
      ).toBeLessThanOrEqual(s.measure);
    }
  });

  it("no single WORD runs through a wall", () => {
    /* ⚠ THE BINDING MEASURE IS A WORD, NOT A STRING (ADR-070 U6). Nothing here
       wraps today, but the moment a value does, every per-LINE assertion keeps
       passing while the longest word overflows — `RECONCILIATION` is how
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
    // ADR-070 U10: 12 renders 7.76px at 1280×720. The drawing this replaced
    // lettered at 9 and 9.5 — 5.8px and 6.1px at the same viewport.
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

describe("the pin grid holds the map's envelope", () => {
  /* ⚠ THE MAP IS STRICTER THAN THE CASEFILE BY DESIGN. No personal names, no
     currency, no model families — and on THIS reading, no team counts. */
  const BANNED: readonly { label: string; re: RegExp }[] = [
    { label: "a department count published as teams", re: /\bteams?\b/i },
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

  it("still adds up to the record", () => {
    const r = record();
    expect(r.shapes, "the five shapes stopped being five").toHaveLength(5);
    expect(r.teams, "the eight departments stopped being eight").toHaveLength(8);
    expect(
      r.shapes.reduce((n, s) => n + s.skills, 0),
      "the 47 stopped adding up"
    ).toBe(47);
    /* Every cut mark has a department to point at, and each department cuts at
       most one pattern — which is what makes one green mark per row true. */
    for (const s of r.shapes) {
      expect(
        r.teams.some((t) => t.ab === s.trenchedBy),
        `${s.key} is cut by ${s.trenchedBy}, which is not a department`
      ).toBe(true);
    }
  });

  it("draws a mark for every crossing the record holds", () => {
    /* The drawing's whole claim is that the matrix IS the crossing: 30 taps of
       40 cells, five of them cut. If the record ever disagrees with the
       mockup's own arithmetic, this is where it shows. */
    const r = record();
    const taps = r.teams.reduce((n, t) => n + t.taps.length, 0);
    const cut = r.teams.filter((t) => t.trenched).length;
    expect(taps, "the crossing changed size").toBe(30);
    expect(cut, "a pattern lost the department that paid for it").toBe(5);
    expect(taps).toBeLessThanOrEqual(r.teams.length * r.shapes.length);
  });
});

describe("the pin grid's rows are bands, not holes", () => {
  it("a row always holds its three-line identity", () => {
    /* The identity is 64 units of ink whatever the band does. A row shorter
       than that is the drawing overlapping itself — the one thing no crop
       assertion can see. */
    for (const ext of [0, 80, 151, 366, 546, 1137]) {
      const l = substrateLayout({ extW: 0, extH: ext });
      expect(l.rowH, `ext ${ext}: the row cannot hold its identity`).toBeGreaterThan(80);
      expect(l.cell, `ext ${ext}: the mark left the grid`).toBeGreaterThanOrEqual(18);
      expect(l.cell, `ext ${ext}: the mark outgrew its column`).toBeLessThanOrEqual(40);
    }
  });

  it("the rows take the height before the margin does", () => {
    /* ADR-070 U12's law: pooled air is a hole, split air is spacing. Up to the
       cap, every unit the field offers goes into the five bands and the margin
       does not move. */
    const rest = SUBSTRATE_LAYOUT_0;
    const owners = substrateLayout(substrateExt(950 / 845));
    expect(owners.rowH, "the owner's field did not reach the rows").toBeGreaterThan(rest.rowH);
    expect(owners.marginY, "the height pooled as margin instead").toBeCloseTo(rest.marginY, 1);
  });
});
