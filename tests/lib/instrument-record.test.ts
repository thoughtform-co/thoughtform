import { describe, expect, it } from "vitest";

import {
  SURI_RUNS,
  SURI_STUDIO_CONFIGURATION,
  SURI_WORKSTREAM_ORDER,
} from "@/lib/arcs/content/shared/suriWork";
import { SURI_PROPOSAL_ARC } from "@/lib/arcs/content/suri-proposal";
import { PANDORA_PROPOSAL_ARC } from "@/lib/arcs/content/pandora-proposal";
import { fromBoard, fromConfiguration, fromQuestions } from "@/lib/instrument/adapt";
import { SURI_INSTRUMENT, suriWorkstreamInstrument } from "@/lib/instrument/records/suri";
import { X_BIONIC_INSTRUMENT } from "@/lib/instrument/records/x-bionic";
import {
  ALTITUDES,
  PART_ORDER,
  altitudesOf,
  recordFaults,
  type InstrumentRecord,
} from "@/lib/instrument/types";

/**
 * The record law (ADR-154): the six in the owner's order; lit is what the
 * team writes; the owner is the one human; an altitude is offered only when
 * the record carries it; the adapters read the three old shapes without a
 * word retyped.
 */
describe("the instrument record (ADR-154)", () => {
  it("the Suri record is lawful and reads the shared six", () => {
    expect(recordFaults(SURI_INSTRUMENT)).toEqual([]);
    const six = fromQuestions("suri", SURI_STUDIO_CONFIGURATION).parts;
    expect(SURI_INSTRUMENT.parts).toEqual(six);
    expect(SURI_INSTRUMENT.parts.map((p) => p.id)).toEqual(PART_ORDER);
  });

  it("offers every altitude the Suri record carries, and only those", () => {
    expect(altitudesOf(SURI_INSTRUMENT)).toEqual([...ALTITUDES]);
    const bare: InstrumentRecord = {
      ...SURI_INSTRUMENT,
      run: undefined,
      checks: undefined,
      plugin: undefined,
      org: undefined,
    };
    expect(altitudesOf(bare)).toEqual(["work"]);
  });

  it("names the faults a record can carry", () => {
    const bad: InstrumentRecord = {
      ...SURI_INSTRUMENT,
      parts: SURI_INSTRUMENT.parts.map((p) =>
        p.id === "model" ? { ...p, state: "lit" } : p.id === "owner" ? { ...p, state: "quiet" } : p
      ) as unknown as InstrumentRecord["parts"],
    };
    const faults = recordFaults(bad);
    expect(faults.some((f) => f.startsWith("model is lit"))).toBe(true);
    expect(faults).toContain("the owner is not human");
  });

  it("fromConfiguration maps the proposals' five onto the six, the context authored", () => {
    const section = SURI_PROPOSAL_ARC.sections.find((s) => s.kind === "configuration");
    expect(section?.kind).toBe("configuration");
    if (section?.kind !== "configuration") return;
    const team = section.teams[0];
    const rec = fromConfiguration("suri-proposal", team, "The brand file and the library");
    expect(recordFaults(rec)).toEqual([]);
    const by = Object.fromEntries(rec.parts.map((p) => [p.id, p.answer]));
    expect(by.model).toBe(team.runs);
    expect(by.evals).toBe(team.bar);
    expect(by.data).toBe(team.reach);
    expect(by.interface).toBe(team.where);
    expect(by.owner).toBe(team.owner);
    expect(by.context).toBe("The brand file and the library");
    expect(rec.work.name).toBe(team.name);
  });

  it("fromBoard maps the five facts onto the six and the organisation", () => {
    const section = PANDORA_PROPOSAL_ARC.sections.find((s) => s.kind === "board");
    expect(section?.kind).toBe("board");
    if (section?.kind !== "board") return;
    const configured = section.states[1];
    const rec = fromBoard("pandora", configured, "Every brief passes its own checks");
    expect(recordFaults(rec)).toEqual([]);
    const by = Object.fromEntries(rec.parts.map((p) => [p.id, p.answer]));
    expect(by.owner).toBe(configured.seat.a);
    expect(rec.work.name).toBe(configured.card.name);
    expect(rec.org?.socket?.name).toBe(configured.reach.value);
    expect(altitudesOf(rec)).toEqual(["org", "work"]);
  });

  /* ADR-154 U1: a workstream's record is the studio's six with its run
     opened; its check rows are the eval log's, never invented. */
  it("cuts each Suri workstream to a lawful record whose checks are the log's", () => {
    for (const which of SURI_WORKSTREAM_ORDER) {
      const rec = suriWorkstreamInstrument(which);
      const body = SURI_RUNS[which];
      expect(recordFaults(rec), which).toEqual([]);
      expect(altitudesOf(rec), which).toEqual(["work", "run", "check"]);
      expect(rec.parts, `${which}: the studio's six`).toEqual(SURI_INSTRUMENT.parts);
      expect(rec.run?.steps).toBe(body.steps);
      expect(rec.checksNote).toBe(body.evals.note);
      const rows = rec.checks ?? [];
      const rubric = rows.filter((r) => !r.code);
      const cases = rows.filter((r) => r.code);
      expect(rubric.map((r) => r.label)).toEqual(body.checks.map((c) => c.line));
      expect(rubric.filter((r) => r.gate)).toHaveLength(body.checks.filter((c) => c.gate).length);
      expect(cases.map((r) => r.label)).toEqual(body.evals.cases.map((c) => c.name));
      for (const c of body.evals.cases) {
        const row = cases.find((r) => r.label === c.name)!;
        if (!c.with) {
          expect(row.state, c.name).toBe("not-run");
          expect(row.figure, c.name).toBeUndefined();
        } else {
          const [got, of] = c.with.split(" of ").map(Number);
          expect(row.state, c.name).toBe(got === of ? "pass" : "review");
          expect(row.figure, c.name).toContain(c.with);
          if (c.without) expect(row.figure, c.name).toContain(`${c.without} without`);
        }
      }
      /* The rubric's rows hold only as far as the log says. */
      const ran = body.evals.cases.filter((c) => c.with);
      const held =
        ran.length > 0 && ran.every((c) => c.with!.split(" of ")[0] === c.with!.split(" of ")[1]);
      const want = ran.length === 0 ? "not-run" : held ? "pass" : "review";
      for (const r of rubric) expect(r.state, `${which}: ${r.label}`).toBe(want);
    }
    expect(suriWorkstreamInstrument("briefing").checks).toEqual(SURI_INSTRUMENT.checks);
  });

  it("names people by role: no colleague's first name in the Suri record", () => {
    const text = JSON.stringify(SURI_INSTRUMENT);
    for (const name of [
      "Kate",
      "Nick",
      "Caroline",
      "Nameya",
      "Georgia",
      "Lottie",
      "Daryna",
      "Bea",
    ]) {
      expect(text, name).not.toMatch(new RegExp(`\\b${name}\\b`));
    }
    expect(text).not.toMatch(/—/);
  });

  /* ADR-154 U4: X-Bionic's organisation is the page's four disciplines, one
     workstream each, each run by a role; the lit one is the one phase one
     starts with. */
  it("the X-Bionic record is lawful and its organisation is the four disciplines", () => {
    expect(recordFaults(X_BIONIC_INSTRUMENT)).toEqual([]);
    expect(altitudesOf(X_BIONIC_INSTRUMENT)).toEqual(["org", "work"]);
    const streams = X_BIONIC_INSTRUMENT.org?.workstreams ?? [];
    expect(streams.map((w) => w.id)).toEqual(["strategy", "production", "ops", "review"]);
    expect(streams.map((w) => w.bucket)).toEqual(["Strategy", "Production", "Ops", "Review"]);
    const lit = streams.filter((w) => w.lit?.length);
    expect(lit.map((w) => w.id)).toEqual(["production"]);
    expect(lit[0].lit).toEqual(["context", "evals"]);
    for (const w of streams) {
      expect(w.line?.length, w.id).toBeGreaterThan(0);
      expect(w.line, w.id).not.toMatch(/\d/);
      expect((w.bucket ?? "").length, w.id).toBeLessThanOrEqual(12);
    }
    const text = JSON.stringify(X_BIONIC_INSTRUMENT);
    expect(text).not.toMatch(/—/);
    expect(text).not.toMatch(
      /\b(Daryna|Kate|Caroline|Bea|Nick|Georgia|Lottie|Sampson|Rita|Katia)\b/
    );
  });
});
