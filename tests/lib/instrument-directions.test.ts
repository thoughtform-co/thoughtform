import { describe, expect, it } from "vitest";

import {
  INS_BOARDS,
  INS_DEFAULTS,
  INS_DIRECTIONS,
  INS_KNOB_KEYS,
  INS_WAVE,
  directionOf,
  knobsFor,
  parseInsQuery,
} from "@/lib/instrument/variants";

/** The registry's law (the lattice's, ADR-149 §4): ids are letters; the
 *  first value of every knob is the house and `IA` is that set; every other
 *  direction changes at least one knob; the URL round-trips. */
describe("the instrument lab's registry (ADR-154)", () => {
  it("ids are letters, unique, IA first", () => {
    const ids = INS_DIRECTIONS.map((d) => d.id);
    expect(ids[0]).toBe("IA");
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[A-Z]+$/);
  });

  it("IA is the house, and every other direction is one argument against it", () => {
    expect(knobsFor("IA")).toEqual(INS_DEFAULTS);
    expect(directionOf(INS_DEFAULTS)).toBe("IA");
    for (const d of INS_DIRECTIONS.slice(1)) {
      expect(Object.keys(d.knobs).length, d.id).toBeGreaterThan(0);
      expect(directionOf(knobsFor(d.id))).toBe(d.id);
    }
  });

  it("every knob value a direction names exists", () => {
    for (const d of INS_DIRECTIONS) {
      for (const [k, v] of Object.entries(d.knobs)) {
        expect(INS_KNOB_KEYS, `${d.id} ${k}`).toContain(k);
        expect(knobsFor("IA")).toHaveProperty(k);
        expect(typeof v).toBe("string");
      }
    }
  });

  it("the URL round-trips, and an unknown value falls back", () => {
    const q = parseInsQuery(new URLSearchParams("k=IF&board=zoom&theme=light"));
    expect(q.k).toBe("IF");
    expect(q.knobs.zoom).toBe("flip");
    expect(q.board).toBe("zoom");
    expect(q.theme).toBe("light");
    const bad = parseInsQuery(new URLSearchParams("board=nope&zoom=nope"));
    expect(bad.board).toBe(INS_BOARDS[0]);
    expect(bad.knobs.zoom).toBe("css");
  });

  it("the wave names the binding cell among its viewports", () => {
    expect(INS_WAVE.viewports).toContain(INS_WAVE.binding);
    expect(INS_WAVE.themes).toEqual(["dark", "light"]);
  });
});
