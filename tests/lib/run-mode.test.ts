import { describe, expect, it } from "vitest";

import {
  RUN_MODES,
  RUN_MODE_LABEL,
  RUN_MODE_OF_AGENT,
  STREAM_ORDER,
  WORK_COLUMN_SLOTS,
  runModeOf,
} from "@/components/landing/home-v2/services/casefile/map/mapProjection";
import type { CaseMapWork } from "@/lib/cases/types";

/**
 * THE WORK READING'S SECOND AXIS (ADR-126) — how far a stream runs without a
 * person, derived from the record's own run mode. Pure and total by guard:
 * `runModeOf` never throws, answers `null` for a run mode the ladder does not
 * place, and `cases-registry` asserts the record never carries one.
 */

const work = (a: string | null): CaseMapWork =>
  ({
    id: "W-000",
    title: "Test",
    dist: "CRE",
    lane: a !== null ? "Everyday" : null,
    shapes: ["voice"],
    seat: a !== null ? "EDGE" : "PERSON",
    vol: "LOW",
    mass: 1,
    bar: "",
    evals: "",
    cfg:
      a !== null
        ? {
            p: ["", ""],
            skillId: "x",
            s: ["", ""],
            m: ["", ""],
            a,
            c: ["", ""],
            g: ["", ""],
            k: [""],
            u: [""],
            o: "",
            why: "",
          }
        : null,
  }) as CaseMapWork;

describe("runModeOf — the ladder a column climbs", () => {
  it("places the record's six run modes", () => {
    expect(runModeOf(work("Chat assistant"))).toBe("prompt");
    expect(runModeOf(work("Editor plugin"))).toBe("tool");
    expect(runModeOf(work("Briefing agent"))).toBe("tool");
    expect(runModeOf(work("Image + video suite"))).toBe("tool");
    expect(runModeOf(work("Scheduled agent"))).toBe("agent");
    expect(runModeOf(work("Coding agent"))).toBe("agent");
    expect(Object.keys(RUN_MODE_OF_AGENT)).toHaveLength(6);
  });

  it("files person-led work under BY HAND", () => {
    expect(runModeOf(work(null))).toBe("hand");
  });

  it("answers null — never a silent row, never a throw — for a mode it does not know", () => {
    expect(runModeOf(work("Autonomous swarm"))).toBeNull();
    expect(runModeOf(work(""))).toBeNull();
  });

  it("climbs prompt → tool → agent, with the hand last", () => {
    expect(RUN_MODES).toEqual(["prompt", "tool", "agent", "hand"]);
    for (const m of RUN_MODES) {
      expect(RUN_MODE_LABEL[m].length).toBeGreaterThan(0);
      // Sentence case in the record's voice; the drawing uppercases.
      expect(RUN_MODE_LABEL[m]).not.toBe(RUN_MODE_LABEL[m].toUpperCase());
      expect(RUN_MODE_LABEL[m]).not.toMatch(/\d/);
    }
    // Every table value is on the ladder.
    for (const v of Object.values(RUN_MODE_OF_AGENT)) expect(RUN_MODES).toContain(v);
  });

  it("names the three columns in reading order, and a ceiling the crop is cut to", () => {
    expect(STREAM_ORDER).toEqual(["production", "operations", "review"]);
    expect(WORK_COLUMN_SLOTS).toBe(4);
  });
});
