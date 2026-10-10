import { describe, expect, it } from "vitest";

import { DISCIPLINE_ORDER } from "@/lib/arcs/content/shared/disciplines";
import { TOOL_AND_COLLABORATOR } from "@/lib/arcs/content/shared/toolAndCollaborator";
import { X_BIONIC_PROPOSAL_ARC } from "@/lib/arcs/content/x-bionic-proposal";
import { PROPOSAL_COPY_BANS, PROPOSAL_VOICE_BANS, scanStrings } from "@/lib/arcs/copyLaw";
import {
  PS_DEFAULTS,
  PS_DIRECTIONS,
  PS_KNOB_KEYS,
  PS_KNOB_LIST,
  directionOf,
  knobsFor,
  parsePsQuery,
} from "@/lib/proposal-system/variants";
import { xBionicV2 } from "@/lib/proposal-system/xBionicV2";

/**
 * The proposal system lab (2026-10-10): every direction composes from the
 * production record by reference, the control IS production, and every
 * composition holds the proposal's own laws before anything is promoted.
 */
const PROD_IDS = X_BIONIC_PROPOSAL_ARC.sections.map((s) => s.id);
const PROD_OPENERS = X_BIONIC_PROPOSAL_ARC.sections.filter((s) => s.kind === "interstitial");
const PROD_RETURN = X_BIONIC_PROPOSAL_ARC.sections.find((s) => s.id === "return");

describe("the proposal system lab", () => {
  it("the registry's first value is production and its ids are letters", () => {
    for (const { key, def } of PS_KNOB_LIST) {
      expect(def.values.length, key).toBeGreaterThanOrEqual(2);
      expect(PS_DEFAULTS[key], key).toBe(def.values[0]);
    }
    for (const d of PS_DIRECTIONS) {
      expect(d.id, d.id).toMatch(/^[A-Z]+$/);
      for (const [k, v] of Object.entries(d.knobs)) {
        const def = PS_KNOB_LIST.find((x) => x.key === k)?.def;
        expect(def, `${d.id}: knob ${k}`).toBeTruthy();
        expect(def?.values, `${d.id}: ${k}=${v}`).toContain(v);
      }
    }
    expect(directionOf(PS_DEFAULTS)).toBe("PA");
    expect(new Set(PS_DIRECTIONS.map((d) => d.id)).size).toBe(PS_DIRECTIONS.length);
  });

  it("the control is production, by reference", () => {
    const pa = xBionicV2(knobsFor("PA"));
    expect(pa.sections).toBe(X_BIONIC_PROPOSAL_ARC.sections);
    expect(pa.hero).toBe(X_BIONIC_PROPOSAL_ARC.hero);
  });

  it("the query seeds a direction and a knob overrides the seed", () => {
    const q = parsePsQuery({ k: "PZ", engine: "layer", theme: "light", console: "0" });
    expect(q.knobs.order).toBe("narrative");
    expect(q.knobs.engine).toBe("layer");
    expect(q.theme).toBe("light");
    expect(q.consoleOn).toBe(false);
    expect(parsePsQuery({ k: "nope", jobHead: "nope" }).knobs).toEqual(PS_DEFAULTS);
  });

  for (const d of PS_DIRECTIONS) {
    it(`${d.id} · ${d.name} composes and holds the proposal's laws`, () => {
      const knobs = knobsFor(d.id);
      const arc = xBionicV2(knobs);
      const ids = arc.sections.map((s) => s.id);
      expect(new Set(ids).size, "section ids unique").toBe(ids.length);
      expect(arc.sections.at(-1)?.kind, "ends on a close").toBe("close");

      const primary = arc.sections.filter((s) => s.menuPrimary);
      expect(primary.length, "chapters").toBeLessThanOrEqual(5);

      /* The three part openers carry the owner's own lines, whatever
         frames them: alone on a screen (production, by reference) or
         under ADR-155's numbered ruler. */
      const openers = arc.sections.filter((s) => s.kind === "interstitial");
      expect(openers.length, "three part openers").toBe(3);
      openers.forEach((c, i) => {
        const prod = PROD_OPENERS[i];
        if (c.kind !== "interstitial" || prod?.kind !== "interstitial") {
          throw new Error(`${d.id}: opener ${i}`);
        }
        expect(c.id).toBe(prod.id);
        expect(c.line, `${c.id}: the owner's own line`).toBe(prod.line);
        if (knobs.interstitial === "quote") {
          expect(c.variant).toBe("chapter");
          expect(c.chapter).toEqual({ n: i + 1, of: 3 });
          expect(c.subline, `${c.id}: the line alone`).toBeUndefined();
          expect(c.index, `${c.id}: the line alone`).toBeUndefined();
          expect(c.eyebrow, `${c.id}: the line alone`).toBeUndefined();
        } else {
          expect(c, `${c.id}: production's own`).toBe(prod);
        }
        for (const row of c.index ?? []) {
          expect(ids, `${c.id}: ${row.href}`).toContain(row.href.slice(1));
        }
      });

      const jobs = arc.sections.filter((s) => s.kind === "job");
      expect(jobs.length).toBe(4);
      jobs.forEach((j, i) => {
        if (j.kind !== "job") return;
        expect(j.n, `${j.id}: n`).toBe(i + 1);
        expect(j.result.value.length, `${j.id}: value`).toBeLessThanOrEqual(10);
        if (knobs.jobHead === "mark") expect(j.top).toBe("mark");
        else expect(j.top).toBeUndefined();
      });
      /* One vocabulary in one order: the jobs and the engine's tiles run
         in the disciplines' order on every composition. */
      expect(jobs.map((j) => (j.kind === "job" ? j.bucket : ""))).toEqual([...DISCIPLINE_ORDER]);
      const tiles = arc.sections.find((s) => s.kind === "instrument");
      if (tiles?.kind === "instrument") {
        expect(tiles.record.org?.workstreams.map((w) => w.id)).toEqual([...DISCIPLINE_ORDER]);
      }
      if (knobs.order === "narrative") {
        const vision = arc.sections.find((s) => s.id === "vision");
        expect(vision?.kind).toBe("spectrum");
        if (vision?.kind === "spectrum") {
          expect(vision.poles).toBe(TOOL_AND_COLLABORATOR.poles);
          expect(vision.middle).toBe(TOOL_AND_COLLABORATOR.middle);
          expect(vision.bands).toBe(TOOL_AND_COLLABORATOR.bands);
          expect(vision.source).toBe(TOOL_AND_COLLABORATOR.source);
        }
        /* The owner's order: about, the vision, the approach, where it
           plugs in, Loop, two brands, X-Bionic. */
        const order = ["about", "vision", "approach"];
        expect(ids.slice(0, 3)).toEqual(order);
        expect(ids.indexOf("plugs-in")).toBeLessThan(ids.indexOf("proof-loop"));
        expect(ids.indexOf("proof-loop")).toBeLessThan(ids.indexOf("return"));
        expect(ids.indexOf("return")).toBeLessThan(ids.indexOf("proof-brands"));
        expect(ids.indexOf("proof-brands")).toBeLessThan(ids.indexOf("job-production"));
        expect(ids.indexOf("job-strategy")).toBeLessThan(ids.indexOf("offer"));
        expect(ids.indexOf("offer")).toBeLessThan(ids.indexOf("engine"));
        /* Every production beat is still on the page, two of them renamed. */
        for (const id of PROD_IDS) {
          const renamed = id === "vision" ? "plugs-in" : id === "adoption" ? "approach" : id;
          expect(ids, `${d.id}: ${id}`).toContain(renamed);
        }
      }

      const ret = arc.sections.find((s) => s.kind === "crew");
      expect(ret).toBeTruthy();
      if (ret?.kind === "crew") {
        if (knobs.return === "ledger") {
          expect(ret.layout).toBe("returns");
          for (const r of ret.rows) {
            expect(r.result, `${r.id}: a return`).toBeTruthy();
            expect(r.result!.value.length).toBeLessThanOrEqual(10);
            expect(r.result!.line.length).toBeLessThanOrEqual(110);
          }
        } else {
          expect(ret.layout).toBe("case");
          expect(ret, "production's own").toBe(PROD_RETURN);
        }
      }

      const approach = arc.sections.find((s) => s.kind === "handoff");
      expect(approach).toBeTruthy();
      if (approach?.kind === "handoff") {
        if (knobs.approach === "stack") {
          expect(approach.figure, "the stack figure").toBeTruthy();
          expect(approach.time).toBeUndefined();
          const f = approach.figure!;
          expect(f.courses.skills.length + f.courses.evals.length).toBeLessThanOrEqual(8);
          for (const c of [...f.courses.skills, ...f.courses.evals]) {
            expect(c.length, c).toBeLessThanOrEqual(24);
            expect(c, c).not.toMatch(/\d/);
          }
          expect(f.tiles.length).toBe(4);
          expect(f.tiles.filter((t) => t.lit).length, "one lit tile").toBe(1);
          for (const t of f.tiles) {
            expect(t.bucket.length, t.id).toBeLessThanOrEqual(12);
            expect(t.name.length, t.id).toBeLessThanOrEqual(28);
            expect(t.line.length, t.id).toBeLessThanOrEqual(40);
            expect(t.line, t.id).not.toMatch(/\d/);
          }
          expect(f.layer.length).toBeLessThanOrEqual(20);
          expect(f.host.length).toBeLessThanOrEqual(32);
        } else {
          expect(approach.figure).toBeUndefined();
          expect(approach.time).toBeTruthy();
        }
      }
      const horizon = arc.sections.filter((s) => s.kind === "horizon");
      expect(horizon.length).toBe(knobs.upstream === "horizon" ? 1 : 0);

      const engine = arc.sections.find((s) => s.kind === "instrument");
      expect(engine).toBeTruthy();
      if (engine?.kind === "instrument") {
        /* A face and a pin never share a section: the face replaces the
           figure the pin lights. */
        if (knobs.engine === "pinned") {
          expect(engine.pin).toBe(true);
          expect(engine.face).toBeUndefined();
        } else {
          expect(engine.pin).toBeUndefined();
          expect(engine.face, "the layer opened").toBeTruthy();
        }
      }

      /* The copy law, the first-person ban included, over every string. */
      const offenders: string[] = [];
      scanStrings(arc, arc.slug, (value, path) => {
        if (path.endsWith(".meta.title")) return;
        for (const [pattern, what] of [...PROPOSAL_COPY_BANS, ...PROPOSAL_VOICE_BANS]) {
          if (pattern.test(value)) offenders.push(`${path}: ${what}`);
        }
      });
      expect(offenders).toEqual([]);
    });
  }

  it("without the order knob, production's beats stay in production's order", () => {
    /* A beat added to the page cannot go missing from the lab: every knob
       but the order swaps a beat in place or adds one (the horizon). */
    const flips = PS_KNOB_KEYS.filter((k) => k !== "order").map((key) => {
      const def = PS_KNOB_LIST.find((x) => x.key === key)!.def;
      return { label: key, knobs: { ...PS_DEFAULTS, [key]: def.values[1] } };
    });
    const directions = PS_DIRECTIONS.map((d) => ({ label: d.id, knobs: knobsFor(d.id) })).filter(
      (x) => x.knobs.order !== "narrative"
    );
    for (const { label, knobs } of [...flips, ...directions]) {
      const ids = xBionicV2(knobs)
        .sections.map((s) => s.id)
        .filter((id) => id !== "upstream");
      expect(ids, label).toEqual(PROD_IDS);
    }
  });

  it("every knob key is read by the composer", () => {
    /* A knob the composer ignores is a direction that cannot be told from
       the control. Flip each key alone and expect a different page. */
    for (const key of PS_KNOB_KEYS) {
      const def = PS_KNOB_LIST.find((x) => x.key === key)!.def;
      const flipped = { ...PS_DEFAULTS, [key]: def.values[1] };
      expect(xBionicV2(flipped).sections, key).not.toBe(X_BIONIC_PROPOSAL_ARC.sections);
    }
  });
});
