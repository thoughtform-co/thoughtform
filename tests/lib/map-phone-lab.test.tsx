import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { VariantDeck } from "@/app/(internal)/test/map-phone-lab/VariantDeck";
import { VariantPick } from "@/app/(internal)/test/map-phone-lab/VariantPick";
import { VariantRows } from "@/app/(internal)/test/map-phone-lab/VariantRows";
import {
  buildModel,
  defaultSel,
  lettering,
  MPL_READINGS,
  type MplDirection,
  type MplModel,
  type MplReading,
} from "@/app/(internal)/test/map-phone-lab/models";
import { isMplId, MPL_DIRECTIONS, MPL_IDS } from "@/app/(internal)/test/map-phone-lab/variants";
import { selectWorks } from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import type { CaseMapShapeKey } from "@/lib/cases/types";
import { getCase } from "@/lib/cases/registry";

import { envelopeBreach } from "./helpers/mapEnvelope";

/**
 * /test/map-phone-lab — the three phone directions for the map card's
 * readings (2026-09-25, owner: "super simplified, mobile-friendly").
 *
 * A lab page is outside every content scanner (`cases-registry` walks CASES
 * objects, never components), and this one letters client record on a phone
 * frame that may be promoted. So two halves, the one the substrate lab never
 * had:
 *   1. `lettering()` — what each direction DECLARES — walked for every shown
 *      stream x reading (and every open shape on LAYER) under the map's own
 *      envelope, the ordinal ban and the teams ban.
 *   2. The RENDERED markup of every direction, whose every text node and
 *      accessible name must be something (1) declared, or one of four
 *      control names. A string a component composes on its own is the
 *      `8 TEAMS` defect (ADR-070 U15) waiting to happen.
 */

const DIRECTIONS: readonly MplDirection[] = ["pick", "rows", "deck"];
const VARIANTS = { pick: VariantPick, rows: VariantRows, deck: VariantDeck } as const;
/** The lab's own control names — the only strings not from the record. */
const CONTROLS = new Set(["Previous stream", "Next stream", "Streams", "Shapes"]);
/** The glyphs a stepper draws with (aria-hidden). */
const GLYPHS = new Set(["‹", "›"]);

function record() {
  const visual = getCase("loop-earplugs")?.casefile.tracks.find(
    (t) => t.id === "ai-transformation"
  )?.visual;
  if (!visual || visual.kind !== "intelligence-map") throw new Error("no intelligence-map track");
  return {
    shapes: visual.shapes,
    districts: visual.districts,
    works: visual.works,
    skills: visual.skills ?? [],
  };
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

/** Every text node and every aria-label in a static render. */
function rendered(
  v: MplDirection,
  model: MplModel,
  r: MplReading,
  sel: string
): { texts: string[]; labels: string[] } {
  const C = VARIANTS[v];
  const html = renderToStaticMarkup(<C model={model} reading={r} sel={sel} onSel={() => {}} />);
  const texts = [...html.matchAll(/>([^<]+)</g)]
    .map((m) => decode(m[1]!).trim())
    .filter((t) => t.length > 0 && t !== "-->");
  const labels = [...html.matchAll(/aria-label="([^"]*)"/g)].map((m) => decode(m[1]!));
  return { texts, labels };
}

describe("the map phone lab", () => {
  const rec = record();
  const model = buildModel(rec);
  const shown = selectWorks(rec.districts, rec.works, rec.skills);

  it("registers every direction once, the compiler and the guard agree", () => {
    expect([...MPL_IDS].sort()).toEqual(Object.keys(MPL_DIRECTIONS).sort());
    for (const id of MPL_IDS) {
      expect(isMplId(id)).toBe(true);
      expect(MPL_DIRECTIONS[id].id).toBe(id);
      expect(MPL_DIRECTIONS[id].thesis.length).toBeGreaterThan(40);
    }
    expect(isMplId("dial")).toBe(false);
  });

  it("projects the board production shows, every stream once, every Skill once", () => {
    expect(model.streams.map((s) => s.id).sort()).toEqual(shown.map((w) => w.id).sort());
    expect(model.depts.flatMap((d) => d.streams.map((s) => s.id)).sort()).toEqual(
      model.streams.map((s) => s.id).sort()
    );
    const skillIds = model.shapes.flatMap((sh) => sh.skills.map((k) => k.id));
    expect(new Set(skillIds).size).toBe(skillIds.length);
    expect(skillIds.length).toBe(
      rec.skills.filter((k) => model.shapes.some((sh) => sh.key === k.engine.toLowerCase())).length
    );
    // One flagship per shape, and it leads its run.
    for (const sh of model.shapes) {
      expect(sh.skills.filter((k) => k.flagship).length).toBe(1);
      expect(sh.skills[0]!.flagship).toBe(true);
    }
    expect(model.streams.find((s) => s.id === defaultSel(model))?.configured).toBe(true);
  });

  it("answers every stream in the record's own words, and never says a place twice", () => {
    for (const s of model.streams) {
      for (const v of [s.title, s.lane, s.owner, s.bar, s.runs, s.reaches, s.runsIn]) {
        expect(v.trim().length, `${s.id} has an empty answer`).toBeGreaterThan(0);
      }
      // Production letters "Scheduled agent · Scheduled agent" on three
      // streams; the lab drops the interface where it repeats the agent.
      expect(s.runsInVia.toLowerCase()).not.toBe(s.runsIn.toLowerCase());
      if (!s.configured) {
        expect(s.lane).toBe("Person-led");
        expect([s.runsHow, s.reachesVia, s.runsInVia]).toEqual(["", "", ""]);
      }
    }
    expect(model.streams.some((s) => !s.configured)).toBe(true);
  });

  const cases: [MplDirection, MplReading, string, CaseMapShapeKey | undefined][] = [];
  for (const v of DIRECTIONS)
    for (const r of MPL_READINGS)
      for (const s of model.streams) {
        if (r === "layer") for (const sh of model.shapes) cases.push([v, r, s.id, sh.key]);
        else cases.push([v, r, s.id, undefined]);
      }

  it(`letters only the record under the map's envelope (${cases.length} declarations)`, () => {
    const recordStrings = new Set<string>();
    for (const s of model.streams)
      for (const x of [
        s.id,
        s.title,
        s.dept,
        s.deptName,
        s.deptShort,
        s.lane,
        s.owner,
        s.bar,
        s.runs,
        s.runsHow,
        s.reaches,
        s.reachesVia,
        s.runsIn,
        s.runsInVia,
      ])
        recordStrings.add(x);
    for (const sh of model.shapes) {
      recordStrings.add(sh.name);
      recordStrings.add(sh.meaning);
      for (const k of sh.skills) recordStrings.add(k.short);
    }
    for (const [v, r, sel, open] of cases) {
      for (const t of lettering(v, model, r, sel, open)) {
        const where = `${v}/${r}/${sel}${open ? `/${open}` : ""}: "${t}"`;
        expect(t.trim().length, `${where} is empty`).toBeGreaterThan(0);
        expect(envelopeBreach(t), `${where} names ${envelopeBreach(t)}`).toBeNull();
        // No ordinal heads (ADR-066) — the rail and the order carry position.
        expect(t, `${where} is an ordinal`).not.toMatch(/^\s*\d{1,2}\s*[·./)]|^\s*0\d\b/);
        // A department count may never read as a team count (ADR-070 U15).
        expect(t, `${where} counts teams`).not.toMatch(/\d\s*teams?\b/i);
        // A digit is the record's, never the lab's.
        if (/\d/.test(t)) expect(recordStrings.has(t), `${where} composes a digit`).toBe(true);
        // What is not the record is the lab's key vocabulary: words only.
        if (!recordStrings.has(t)) expect(t, where).toMatch(/^[A-Za-z][A-Za-z ]*$/);
      }
    }
  });

  it("renders nothing its declaration did not name", () => {
    for (const v of DIRECTIONS)
      for (const r of MPL_READINGS)
        for (const s of model.streams) {
          const declared = new Set(lettering(v, model, r, s.id));
          const { texts, labels } = rendered(v, model, r, s.id);
          for (const t of texts) {
            if (GLYPHS.has(t)) continue;
            expect(declared.has(t), `${v}/${r}/${s.id} renders an undeclared "${t}"`).toBe(true);
          }
          for (const l of labels) {
            expect(
              declared.has(l) || CONTROLS.has(l),
              `${v}/${r}/${s.id} names a control "${l}"`
            ).toBe(true);
            expect(envelopeBreach(l)).toBeNull();
          }
        }
  });

  it("stays simple: the strings on one screen per reading (the record, printed)", () => {
    const sel = defaultSel(model);
    const lines: string[] = [];
    const counts: Record<string, number> = {};
    for (const v of DIRECTIONS)
      for (const r of MPL_READINGS) {
        const { texts } = rendered(v, model, r, sel);
        const onTrack = texts.filter((t) => !GLYPHS.has(t)).length;
        // The deck letters every card into its track; one card is on screen.
        const cards =
          v !== "deck"
            ? 1
            : r === "work"
              ? model.depts.length
              : r === "configuration"
                ? model.streams.length
                : model.shapes.length;
        const perScreen = Math.ceil(onTrack / cards);
        counts[`${v}/${r}`] = perScreen;
        lines.push(`${v.padEnd(5)} ${r.padEnd(14)} ${String(perScreen).padStart(3)}`);
      }
    console.log(`strings per screen at ${sel}\n${lines.join("\n")}`);
    // Ceilings two above what the lab letters, LAYER sized for its largest
    // shape (Pattern's fourteen Skills). A direction that grows past one is
    // the "a lot of text" the owner named, coming back one field at a time.
    const CEILING: Record<string, number> = {
      "pick/work": 25,
      "pick/configuration": 16,
      "pick/layer": 22,
      "rows/work": 10,
      "rows/configuration": 11,
      "rows/layer": 22,
      "deck/work": 8,
      "deck/configuration": 16,
      "deck/layer": 14,
    };
    for (const [k, n] of Object.entries(counts)) expect(n, k).toBeLessThanOrEqual(CEILING[k]!);
  });
});
