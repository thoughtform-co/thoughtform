import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import registry from "@/lib/lattice/directions.json";
import {
  LAT_DEFAULTS,
  LAT_DIRECTIONS,
  LAT_KNOB_KEYS,
  directionOf,
  knobsFor,
  knobString,
} from "@/lib/lattice/variants";

/**
 * The lattice's knobs and directions (ADR-149 §4), and the mirror between the
 * registry the lab draws from and the turnstone ship that grades it.
 *
 * ⚠ THREE READERS, ONE RECORD. `lib/lattice/directions.json` is imported by
 * `/test/lattice` (through `lib/lattice/variants.ts`), read by
 * `scripts/capture-lattice.mjs` with `readFileSync`, and mirrored into the
 * ship's `armada.toml` as `[types.LT]` plus a LANE per direction in
 * `[models.lanes]` (the sheet's own test only asserts that ITS directions have
 * a lane, so the two registries share that table). A direction with no lane
 * shoots a still nobody grades; a lane with no direction grades a still nobody
 * shot. The capture asserts this on every run; this test asserts it on every
 * push.
 */

const ROOT = join(__dirname, "..", "..");
const SHIP = join(ROOT, ".claude", "skills", "thoughtform-design", "eval", "subpages");
const TOML = readFileSync(join(SHIP, "armada.toml"), "utf8");

/** The `key = "value"` lines of one `[header]` section, up to the next header. */
const section = (header: string): Record<string, string> => {
  const body = TOML.split(`[${header}]`)[1]?.split(/\n\[/)[0] ?? "";
  return Object.fromEntries(
    [...body.matchAll(/^([A-Za-z_][\w-]*)\s*=\s*"([^"]*)"/gm)].map((m) => [m[1], m[2]])
  );
};

describe("the lattice's directions (ADR-149)", () => {
  it("ids are letters only and unique", () => {
    const ids = LAT_DIRECTIONS.map((d) => d.id);
    expect(ids.length).toBeGreaterThanOrEqual(2);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[A-Z]+$/);
  });

  it("the knobs are the registry's, in its order, each with two or more distinct values", () => {
    expect([...LAT_KNOB_KEYS]).toEqual(Object.keys(registry.knobs));
    for (const key of LAT_KNOB_KEYS) {
      const def = registry.knobs[key];
      expect(def.values.length, key).toBeGreaterThanOrEqual(2);
      expect(new Set(def.values).size, key).toBe(def.values.length);
      expect(def.label.length, key).toBeGreaterThan(0);
      expect(def.note.length, key).toBeGreaterThan(0);
    }
  });

  it("LA is every knob at its first value — the house, and the control", () => {
    const control = LAT_DIRECTIONS[0];
    expect(control.id).toBe("LA");
    expect(control.knobs).toEqual({});
    for (const key of LAT_KNOB_KEYS) expect(LAT_DEFAULTS[key]).toBe(registry.knobs[key].values[0]);
    expect(knobsFor("LA")).toEqual(LAT_DEFAULTS);
    expect(directionOf(LAT_DEFAULTS)).toBe("LA");
  });

  it("every other direction moves at least one knob, to a value the knob has, and resolves back to itself", () => {
    for (const d of LAT_DIRECTIONS) {
      const knobs = knobsFor(d.id);
      for (const k of LAT_KNOB_KEYS)
        expect(registry.knobs[k].values, `${d.id}: ${k}=${knobs[k]}`).toContain(knobs[k]);
      if (d.id !== "LA") expect(Object.keys(d.knobs).length, d.id).toBeGreaterThan(0);
      expect(directionOf(knobs), d.id).toBe(d.id);
      expect(d.question.length, d.id).toBeGreaterThan(0);
      expect(d.shape.length, d.id).toBeGreaterThan(0);
    }
  });

  it("the stamp's knob half is every knob in registry order, comma-joined — what the capture waits on", () => {
    expect(knobString(LAT_DEFAULTS)).toBe("cut=tr-bl,line=lip,head=strip");
    expect(knobString(knobsFor("LB"))).toBe("cut=tr,line=lip,head=strip");
  });

  it("the wave names its lane, both themes, three viewports and a binding cell among them", () => {
    expect(registry.wave.lane).toBe("lat");
    expect(registry.wave.themes).toEqual(["dark", "light"]);
    expect(registry.wave.viewports).toHaveLength(3);
    for (const vp of registry.wave.viewports) expect(vp).toMatch(/^\d{3,4}x\d{3,4}$/);
    expect(registry.wave.viewports).toContain(registry.wave.binding);
  });

  it("mirrors the ship: [types.LT] with the lab's route, a render lane per direction, [settings.binding]", () => {
    const lt = section("types.LT");
    expect(lt.name).toBe("Lattice page");
    expect(lt.shot).toMatch(/^ROUTE: \/test\/lattice\?board=page&console=0$/);
    expect(lt.question).toBe(LAT_DIRECTIONS[0].question);
    for (const key of ["channel", "ar", "camera", "position", "shape", "subject", "camera_line"])
      expect(lt[key], `[types.LT] ${key}`).toBeTruthy();

    const lanes = section("models.lanes");
    for (const d of LAT_DIRECTIONS)
      expect(lanes[d.id.toLowerCase()], `no lane for ${d.id}`).toMatch(/^render-\d{2,5}$/);

    const binding = section("settings.binding");
    expect(binding.surface).toBe(registry.wave.binding);
  });
});
