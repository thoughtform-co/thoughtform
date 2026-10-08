import { describe, expect, it } from "vitest";

import {
  RUN_MODES,
  runModeOf,
} from "@/components/landing/home-v2/services/casefile/map/mapProjection";
import { SAMAKO_AUTUMN_FILM, SAMAKO_PRODUCT_SHOTS } from "@/lib/arcs/content/shared/samakoWork";
import { SURI_ITERATIONS, SURI_RUNS } from "@/lib/arcs/content/shared/suriWork";
import { LOOP_INTELLIGENCE_MAP } from "@/lib/cases/content/loop-earplugs";
import {
  LEDE_MAX_CH,
  plateCopyStrings,
  servicesCopyViolations,
} from "@/lib/services-ring/servicesCopyLaw";
import {
  HIDDEN_SLOTS,
  WORKSTREAMS_MASTHEAD,
  WORKSTREAM_PLATES,
  WORKSTREAM_SLOTS,
  workstreamForSlot,
} from "@/lib/services-workstreams/plates";
import { WORKSTREAMS } from "@/lib/services-workstreams/record";

/**
 * The workstreams lab's record (`/test/services-workstreams`). It is BUILT BY
 * REFERENCE from Loop's map, Suri's runs and Samako's breakdowns, so the
 * first thing pinned is that nothing was copied: an entry read off a record
 * carries that record object itself, `toBe`.
 */
describe("services-workstreams record", () => {
  it("is the three creative workstreams, in the map's own order", () => {
    expect(WORKSTREAMS.map((w) => w.key)).toEqual(["production", "operations", "review"]);
    expect(WORKSTREAMS.map((w) => w.name)).toEqual(
      LOOP_INTELLIGENCE_MAP.streams.map((s) => s.name)
    );
  });

  it("reads every Loop stream on the map, by reference, in its own column", () => {
    for (const ws of WORKSTREAMS) {
      const onMap = LOOP_INTELLIGENCE_MAP.works.filter((w) => w.stream === ws.key);
      const loop = ws.entries.filter((e) => e.client === "loop");
      expect(loop.map((e) => e.source)).toEqual(onMap);
      loop.forEach((e, i) => {
        expect(e.source).toBe(onMap[i]);
        expect(e.title).toBe(onMap[i].title);
        expect(e.runMode).toBe(runModeOf(onMap[i]) ?? "hand");
      });
    }
  });

  it("reads Suri's runs and Samako's breakdowns by reference", () => {
    const sources = WORKSTREAMS.flatMap((w) => w.entries.map((e) => e.source));
    expect(sources).toContain(SURI_RUNS.briefing);
    expect(sources).toContain(SURI_RUNS.iterations);
    expect(sources).toContain(SURI_RUNS.video);
    expect(sources).toContain(SURI_ITERATIONS);
    expect(sources).toContain(SAMAKO_PRODUCT_SHOTS);
    expect(sources).toContain(SAMAKO_AUTUMN_FILM);
    for (const ws of WORKSTREAMS) {
      expect(Object.values(SURI_RUNS)).toContain(ws.run.source);
      expect([SAMAKO_PRODUCT_SHOTS, SAMAKO_AUTUMN_FILM, SURI_ITERATIONS]).toContain(
        ws.specimen.source
      );
      expect(ws.specimen.frames.length).toBeGreaterThan(1);
    }
  });

  it("puts every entry on the run-mode ladder, with a gate", () => {
    for (const e of WORKSTREAMS.flatMap((w) => w.entries)) {
      expect(RUN_MODES).toContain(e.runMode);
      expect(e.gate.length).toBeGreaterThan(0);
      expect(e.title.length).toBeLessThanOrEqual(34);
    }
  });

  it("names people by role, never by name", () => {
    const text = JSON.stringify(
      WORKSTREAMS.map((w) => w.entries.map(({ gate, proof, title }) => ({ gate, proof, title })))
    );
    for (const name of ["Rita", "Job", "Alexander", "Katia"]) expect(text).not.toContain(name);
  });
});

describe("services-workstreams plates", () => {
  it("puts the three workstreams on the ring and hides the fourth slot", () => {
    // The configuration is the whole section, never a card (owner, 2026-10-08).
    expect(WORKSTREAM_PLATES.map((p) => p.id)).toEqual([...WORKSTREAM_SLOTS]);
    expect(new Set(WORKSTREAM_SLOTS).size).toBe(4);
    expect(HIDDEN_SLOTS).toEqual([3]);
    expect(WORKSTREAM_PLATES.some((p) => p.lead)).toBe(false);
    expect(WORKSTREAM_PLATES.slice(0, 3).map((p) => p.chip)).toEqual(
      WORKSTREAMS.map((w) => w.name)
    );
    WORKSTREAMS.forEach((ws, i) => expect(workstreamForSlot(WORKSTREAM_SLOTS[i])).toBe(ws));
    expect(workstreamForSlot(WORKSTREAM_SLOTS[3])).toBeNull();
  });

  it("holds the copy law, bar the word the lab is here to try", () => {
    for (const plate of WORKSTREAM_PLATES) {
      const lede = plate.lede.map((s) => (typeof s === "string" ? s : s.em)).join("");
      expect(lede.length).toBeLessThanOrEqual(LEDE_MAX_CH);
      expect(/[€$£]|\b(EUR|USD|GBP)\b/.test(JSON.stringify(plate))).toBe(false);
    }
    // "creative" is banned on the PRODUCTION bake (ADR-111) and is exactly
    // what this lab puts on the faces; every other ban holds.
    const strip = (xs: readonly string[]) => xs.map((x) => x.replace(/creative/gi, ""));
    for (const plate of WORKSTREAM_PLATES) {
      expect(servicesCopyViolations(plate.id, strip(plateCopyStrings(plate)))).toEqual([]);
    }
    expect(servicesCopyViolations("masthead", strip([WORKSTREAMS_MASTHEAD.intro]))).toEqual([]);
    const lettered = WORKSTREAMS.flatMap((w) => [
      w.name,
      w.line,
      ...w.entries.flatMap((e) => [e.title, e.gate, e.proof ?? ""]),
    ]);
    expect(servicesCopyViolations("entries", strip(lettered))).toEqual([]);
    // The ban's regex is word-bounded; the plural is the same word.
    expect(/rubrics?\b/i.test(JSON.stringify([WORKSTREAM_PLATES, lettered]))).toBe(false);
  });
});
