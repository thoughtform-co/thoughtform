import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  SH_DEFAULTS,
  SH_DIRECTIONS,
  SH_DRAWABLE,
  SH_KNOB_KEYS,
  SH_KNOB_LIST,
  SH_WAVE,
  directionOf,
  knobAttrs,
  knobsFor,
  parseSheetQuery,
} from "@/lib/sheet/directions";

/**
 * The sheet's knobs and directions (ADR-114), and the mirror between the
 * registry the pages draw from and the ship that grades them.
 *
 * ⚠ TWO READERS, ONE RECORD. `lib/sheet/directions.json` is imported by the
 * page and read by `scripts/capture-subpages.mjs`; the ship's `armada.toml`
 * names a LANE per direction and a TYPE per page. A direction with no lane
 * shoots a still nobody grades; a lane with no direction grades a still
 * nobody shot. The capture asserts this on every run; this test asserts it
 * on every push.
 */

const ROOT = join(__dirname, "..", "..");
const SHIP = join(ROOT, ".claude", "skills", "thoughtform-design", "eval", "subpages");

describe("the sheet's directions (ADR-114)", () => {
  it("ids are letters only and unique; the negative poles are not knob sets", () => {
    const ids = SH_DIRECTIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[A-Z]+$/);
    const poles = SH_DIRECTIONS.filter((d) => d.pole === "negative");
    // SA: the old /arcs, shot once (ADR-114). SF: the sheet overview,
    // promoted from wave-02 when the instrument replaced it (ADR-118).
    expect(poles.map((p) => p.id)).toEqual(["SA", "SF"]);
    for (const p of poles) {
      expect(p.knobs, p.id).toBeNull();
      expect(p.lane, p.id).toBe(p.id.toLowerCase());
      expect(
        SH_DRAWABLE.some((d) => d.id === p.id),
        p.id
      ).toBe(false);
    }
    expect(Object.keys(poles[0].routes ?? {})).toEqual(["AR", "AC"]);
    expect(Object.keys(poles[1].routes ?? {})).toEqual(["AR"]);
    // A promoted pole names the wave, the lane and the stills it is copied
    // from — byte-identical, never re-shot.
    expect(poles[1].from).toEqual({
      wave: "wave-02-sb",
      lane: "sb",
      stills: [1, 2, 3],
      commit: "7124f146",
    });
  });

  it("a direction is scoped to the pages whose knobs it moves", () => {
    const instrument = ["span", "frame"];
    for (const d of SH_DRAWABLE) {
      const moved = Object.keys(d.knobs ?? {});
      if (moved.length === 0) {
        expect(d.types, `${d.id}: the house is shot everywhere`).toBeUndefined();
        continue;
      }
      expect(d.types?.length, `${d.id}: a scoped direction`).toBeGreaterThan(0);
      const onInstrument = moved.every((k) => instrument.includes(k));
      const onDocument = moved.every((k) => !instrument.includes(k));
      expect(onInstrument || onDocument, `${d.id} moves both kinds of knob`).toBe(true);
      if (onInstrument) expect(d.types).toEqual(["AR", "AK"]);
      else expect(d.types).not.toContain("AR");
    }
  });

  it("the first value of every knob is the house, and SB is every knob at that value", () => {
    for (const { key, def } of SH_KNOB_LIST) {
      expect(def.values.length, key).toBeGreaterThanOrEqual(2);
      expect(new Set(def.values).size, key).toBe(def.values.length);
      expect(SH_DEFAULTS[key]).toBe(def.values[0]);
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.note.length).toBeGreaterThan(0);
    }
    expect(knobsFor("SB")).toEqual(SH_DEFAULTS);
    expect(directionOf(SH_DEFAULTS)).toBe("SB");
  });

  it("every other direction moves at least one axis, and resolves back to itself", () => {
    for (const d of SH_DRAWABLE) {
      const knobs = knobsFor(d.id);
      for (const k of SH_KNOB_KEYS) {
        const def = SH_KNOB_LIST.find((x) => x.key === k)!.def;
        expect(def.values, `${d.id}: ${k}=${knobs[k]}`).toContain(knobs[k]);
      }
      if (d.id !== "SB") expect(Object.keys(d.knobs ?? {}).length, d.id).toBeGreaterThan(0);
      expect(directionOf(knobs), d.id).toBe(d.id);
    }
  });

  it("knob attributes are every knob, in registry order", () => {
    const attrs = knobAttrs(SH_DEFAULTS);
    expect(Object.keys(attrs)).toEqual(SH_KNOB_KEYS.map((k) => `data-sh-${k}`));
    expect(attrs["data-sh-head"]).toBe("split");
  });

  it("the URL seeds a direction, a knob overrides it, and a typo falls back to the house", () => {
    expect(parseSheetQuery(new URLSearchParams("k=SD"))).toEqual({
      knobs: { ...SH_DEFAULTS, head: "stack", ordinal: "off" },
      k: "SD",
    });
    expect(parseSheetQuery(new URLSearchParams("k=SD&head=split&ordinal=on")).k).toBe("SB");
    /* The `rules` knob was deleted by the owner's ruling (ADR-114 U1): a URL
       that still names it changes nothing and resolves to the house. */
    expect(parseSheetQuery(new URLSearchParams("rules=seams"))).toEqual({
      knobs: SH_DEFAULTS,
      k: "SB",
    });
    /* So was the `rows` knob, with its direction SH (ADR-118 U1), and the
       `dossier` knob with SJ (U2): an old gallery link to any of them lands
       on the house. */
    for (const stale of ["rows=boxed", "k=SH", "dossier=pair", "k=SJ"])
      expect(parseSheetQuery(new URLSearchParams(stale)), stale).toEqual({
        knobs: SH_DEFAULTS,
        k: "SB",
      });
    expect(SH_DIRECTIONS.map((d) => d.id)).not.toContain("SH");
    expect(SH_DIRECTIONS.map((d) => d.id)).not.toContain("SJ");
    expect(parseSheetQuery(new URLSearchParams("k=NOPE&head=banana"))).toEqual({
      knobs: SH_DEFAULTS,
      k: "SB",
    });
    /* A hand-mixed set that IS no direction is reported as "", never as the
       nearest one — a still has to be traceable to the set that drew it. */
    expect(parseSheetQuery(new URLSearchParams("card=grid")).k).toBe("");
  });

  it("the wave names both themes and the two viewports", () => {
    expect(SH_WAVE.themes).toEqual(["dark", "light"]);
    expect(Object.keys(SH_WAVE.settings)).toContain("default");
    for (const vp of Object.values(SH_WAVE.settings)) expect(vp).toMatch(/^\d{3,4}x\d{3,4}$/);
  });

  it("mirrors the ship: a lane per direction, a type per page, every lane a render lane", () => {
    const toml = readFileSync(join(SHIP, "armada.toml"), "utf8");
    const lanesBlock = toml.split("[models.lanes]")[1]?.split(/\n\[/)[0] ?? "";
    const lanes = Object.fromEntries(
      [...lanesBlock.matchAll(/^([a-z0-9]+)\s*=\s*"([^"]+)"/gm)].map((m) => [m[1], m[2]])
    );
    for (const d of SH_DIRECTIONS) {
      const lane = d.lane ?? d.id.toLowerCase();
      expect(lanes[lane], `no lane for ${d.id}`).toMatch(/^render-\d{2,5}$/);
    }
    for (const lane of ["lawful", "broken"]) expect(lanes[lane], lane).toMatch(/^render-\d{2,5}$/);
    const types = [...toml.matchAll(/^\[types\.([A-Z]+)\]/gm)].map((m) => m[1]);
    expect(types.sort()).toEqual(["AC", "AK", "AR", "HS", "MP", "MU", "SK"]);
    for (const t of types) {
      const block = toml.split(`[types.${t}]`)[1].split(/\n\[/)[0];
      expect(block, `${t}: no ROUTE`).toMatch(/^shot = "ROUTE: \/[a-z0-9/-]*"/m);
    }
    for (const pole of SH_DIRECTIONS.filter((d) => d.pole === "negative"))
      for (const t of Object.keys(pole.routes ?? {})) expect(types, pole.id).toContain(t);
    for (const d of SH_DIRECTIONS)
      for (const t of d.types ?? []) expect(types, `${d.id} names type ${t}`).toContain(t);
    const subjects = [...toml.matchAll(/^\[subjects\.([a-z]+)\]/gm)].map((m) => m[1]);
    expect(subjects.sort()).toEqual(["parchment", "void"]);
  });
});
