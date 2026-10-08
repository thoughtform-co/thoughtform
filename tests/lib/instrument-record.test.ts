import { describe, expect, it } from "vitest";

import { SURI_STUDIO_CONFIGURATION } from "@/lib/arcs/content/shared/suriWork";
import { SURI_PROPOSAL_ARC } from "@/lib/arcs/content/suri-proposal";
import { PANDORA_PROPOSAL_ARC } from "@/lib/arcs/content/pandora-proposal";
import { fromBoard, fromConfiguration, fromQuestions } from "@/lib/instrument/adapt";
import { SURI_INSTRUMENT } from "@/lib/instrument/records/suri";
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
});
