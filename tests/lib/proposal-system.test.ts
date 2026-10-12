import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DISCIPLINE_ORDER } from "@/lib/arcs/content/shared/disciplines";
import { TOOL_AND_COLLABORATOR } from "@/lib/arcs/content/shared/toolAndCollaborator";
import { THE_HORIZON_RECORD } from "@/lib/arcs/content/shared/workshopPractice";
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
const PROD_ADOPTION = X_BIONIC_PROPOSAL_ARC.sections.find((s) => s.id === "adoption");
const PROD_RUN = PROD_ADOPTION?.kind === "handoff" ? PROD_ADOPTION.run : undefined;

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
        expect(j.result.said?.em?.length ?? 0, `${j.id}: said`).toBeLessThanOrEqual(24);
        if (knobs.jobHead === "mark") expect(j.top).toBe("mark");
        else expect(j.top).toBe("stack");
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
          if (id === "upstream" && knobs.upstream === "off") continue;
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
            expect(r.result!.value?.length ?? 0).toBeLessThanOrEqual(10);
            expect(r.result!.line?.length ?? 0).toBeLessThanOrEqual(110);
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
          expect(approach.run, "the stack carries no run").toBeUndefined();
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
        } else if (knobs.approach === "run") {
          /* The owner's eight-step outline as one run, read whole (his pick
             of 11 October): production's own run, by reference, with the
             vision's own layer and workstreams, one lane and one job lit,
             the three steps as three passes, every lettered string inside
             its seat. */
          const r = approach.run;
          expect(r, "the run").toBeTruthy();
          expect(r, "production's run, by reference").toBe(PROD_RUN);
          expect(approach.figure).toBeUndefined();
          expect(approach.time).toBeUndefined();
          expect(approach.steps.map((s) => s.label)).toEqual([
            "Adoption",
            "Encoding",
            "Automation",
          ]);
          expect(r!.layer.workstreams.map((w) => w.id)).toEqual([...DISCIPLINE_ORDER]);
          expect(r!.layer.workstreams.filter((w) => w.lit).length, "one lit lane").toBe(1);
          expect(r!.jobs.length).toBeGreaterThanOrEqual(2);
          expect(r!.jobs.length).toBeLessThanOrEqual(4);
          expect(r!.jobs.filter((j) => j.lit).length, "one lit job").toBe(1);
          for (const s of [...r!.jobs.map((j) => j.name), ...r!.inputs, r!.output]) {
            expect(s.length, s).toBeLessThanOrEqual(18);
          }
          for (const l of r!.lines) expect(l.length, l).toBeLessThanOrEqual(76);
          for (const s of [
            r!.layer.label,
            ...r!.layer.workstreams.map((w) => w.name),
            ...r!.jobs.map((j) => j.name),
            ...r!.inputs,
            r!.output,
            ...r!.lines,
            r!.keys.skill,
            r!.keys.evals,
          ]) {
            expect(s, s).not.toMatch(/\d/);
          }
          /* The reader meets the vision's words again: the same layer, the
             same four workstreams, in the same order. */
          const vision = arc.sections.find((s) => s.kind === "leverage");
          if (vision?.kind === "leverage") {
            expect(r!.layer.label).toBe(vision.stack.find((p) => p.own)?.label);
            expect(r!.layer.workstreams.map((w) => w.name)).toEqual(
              vision.uses.items.map((u) => u.label)
            );
          }
        } else if (knobs.approach === "written" || knobs.approach === "opened") {
          /* The two variations of 2026-10-11: the same object as the
             vision's one altitude down, the three passes as a column (≤ 76
             a line, no digit), the vision's own layer and four workstreams
             by reference, the hand-off to Loop as the head's last sentence;
             neither carries the run, the figure or the bars. */
          expect(approach.run).toBeUndefined();
          expect(approach.figure).toBeUndefined();
          expect(approach.time).toBeUndefined();
          expect(approach.head.sub).toMatch(/Loop Earplugs wrote the first layer/);
          expect(approach.head.title).toBe(
            PROD_ADOPTION?.kind === "handoff" ? PROD_ADOPTION.head.title : undefined
          );
          const v = knobs.approach === "written" ? approach.written : approach.opened;
          expect(v, knobs.approach).toBeTruthy();
          expect(knobs.approach === "written" ? approach.opened : approach.written).toBeUndefined();
          for (const l of v!.lines) {
            expect(l.length, l).toBeLessThanOrEqual(76);
            expect(l, l).not.toMatch(/\d/);
          }
          expect(v!.caption.length).toBeLessThanOrEqual(40);
          expect(v!.layer).toBe(PROD_RUN!.layer.label);
          expect(v!.host.length).toBeLessThanOrEqual(32);
          if (approach.written) {
            const w = approach.written;
            expect(w.team, "the vision's workstreams, by reference").toBe(
              PROD_RUN!.layer.workstreams
            );
            expect(w.team.map((t) => t.id)).toEqual([...DISCIPLINE_ORDER]);
            expect(w.courses.skills.length).toBe(3);
            expect(w.courses.evals.length).toBe(2);
            for (const c of [...w.courses.skills, ...w.courses.evals]) {
              expect(c.length, c).toBeLessThanOrEqual(24);
              expect(c, c).not.toMatch(/\d/);
            }
          }
          if (approach.opened) {
            const o = approach.opened;
            const engine = X_BIONIC_PROPOSAL_ARC.sections.find((s) => s.id === "engine");
            if (engine?.kind !== "instrument" || !engine.face) throw new Error("the engine's face");
            expect(o.console, "the plugin's own console").toBe(engine.face.console);
            expect(o.connectors).toBe(engine.face.connectors);
            expect(o.lanes.map((l) => l.id)).toEqual([...DISCIPLINE_ORDER]);
            expect(o.lanes.map((l) => l.id)).toContain(o.lit);
            expect(o.skill.length).toBeLessThanOrEqual(24);
            for (const e of o.evals) expect(e.length, e).toBeLessThanOrEqual(24);
            expect(o.readout.length).toBeLessThanOrEqual(4);
            for (const r of o.readout) {
              expect(r.label.length, r.label).toBeLessThanOrEqual(12);
              expect(r.value, r.value).not.toMatch(/\d/);
            }
          }
        } else {
          /* The plates, as the beat shipped before the run (ADR-153): a
             verb per plate and the two time bars, no run. */
          expect(knobs.approach).toBe("plates");
          expect(approach.figure).toBeUndefined();
          expect(approach.run).toBeUndefined();
          expect(approach.time).toBeTruthy();
          expect(approach.steps.map((s) => s.label)).toEqual([
            "Adopt",
            "Write it down",
            "Automate",
          ]);
        }
      }
      const horizon = arc.sections.filter((s) => s.kind === "horizon");
      expect(horizon.length).toBe(knobs.upstream !== "off" ? 1 : 0);
      if (knobs.upstream === "lines") {
        /* The owner's two lines are the workshop's record, by reference. */
        const h = horizon[0];
        if (h?.kind !== "horizon") throw new Error(`${d.id}: the two lines`);
        expect(h.operated).toBe(THE_HORIZON_RECORD.operated);
        expect(h.agent).toBe(THE_HORIZON_RECORD.agent);
        expect(h.upstream).toBeUndefined();
      }

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
      const ids = xBionicV2(knobs).sections.map((s) => s.id);
      /* Production holds no "Longer tasks" beat since 11 October; `lines`
         and `horizon` ADD one right after the approach. */
      const expected =
        knobs.upstream === "off"
          ? PROD_IDS
          : (() => {
              const ids = [...PROD_IDS];
              ids.splice(ids.indexOf("adoption") + 1, 0, "upstream");
              return ids;
            })();
      expect(ids, label).toEqual(expected);
    }
  });

  it("production draws the run whole, then the two lines (the owner's pick of 11 October)", () => {
    /* "Whole": the run read on one screen, the two lines after it. The
       runway and the rail over the run came out with the pick, so the run
       carries no mode, and the beat no time bars and no stack figure. */
    expect(PROD_ADOPTION?.kind).toBe("handoff");
    if (PROD_ADOPTION?.kind !== "handoff") return;
    expect(PROD_RUN, "the run").toBeTruthy();
    expect(Object.keys(PROD_RUN!), "no reading mode on the run").not.toContain("mode");
    expect(PROD_ADOPTION.time).toBeUndefined();
    expect(PROD_ADOPTION.figure).toBeUndefined();

    /* The two lines came off the page on 11 October (the owner's video:
       "completely out of place"); Loop's line follows the approach, whose
       last sentence hands to it. The lab keeps the lines as a value. */
    const at = PROD_IDS.indexOf("adoption");
    expect(PROD_IDS[at + 1], "Loop's line follows the approach").toBe("proof-loop");
    expect(PROD_IDS, "no Longer tasks beat on the page").not.toContain("upstream");
    const lines = xBionicV2({ ...PS_DEFAULTS, upstream: "lines" }).sections.find(
      (s) => s.id === "upstream"
    );
    expect(lines?.kind).toBe("horizon");
    if (lines?.kind === "horizon") {
      expect(lines.operated).toBe(THE_HORIZON_RECORD.operated);
      expect(lines.agent).toBe(THE_HORIZON_RECORD.agent);
      expect(lines.upstream).toBeUndefined();
    }

    /* The run's sheet is a ROUTE import (it is `.cfg`-scoped, inert on an
       arc without the beat); a route that dropped it would draw the run
       unstyled with every guard here green. */
    const route = readFileSync(
      join(__dirname, "..", "..", "app", "(marketing)", "arcs", "[slug]", "[leaf]", "page.tsx"),
      "utf8"
    );
    expect(route).toContain('"@/components/arcs/config-run.css"');
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
