import { describe, expect, it } from "vitest";

import {
  HPL_DEFAULT_ERA,
  HPL_DEFAULT_ROW,
  HPL_DIRECTION_IDS,
  HPL_DIRECTION_LIST,
  HPL_DIRECTIONS,
  HPL_INKS,
  HPL_SURFACE_IDS,
  defaultMaterial,
  hplDirection,
  parseHplQuery,
  type HplDirectionId,
} from "@/app/(internal)/test/hud-panel-lab/variants";
import { PROOF_CASE } from "@/lib/cases/registry";
import { CHARACTER_ERAS } from "@/lib/voidwalker/characterEras";

/**
 * THE HUD PANEL LAB'S REGISTRY GUARD.
 *
 * The lab is look-dev and mechanically unguarded otherwise — `cases-registry`
 * walks content objects, never component code — so the two things that CAN go
 * silently wrong here are pinned:
 *
 *   1. THE REGISTRY IS TOTAL AND ORDERED. A direction registered in the tuple
 *      but missing from the record (or vice versa) renders the FALLBACK, which
 *      is `v0` — i.e. the capture matrix would shoot the control seven times
 *      under seven different filenames and every gate would pass. The
 *      `Record<HplDirectionId, …>` makes the compiler catch a missing key; this
 *      catches a stray one and pins the reading order the console prints in.
 *   2. THE PARSER'S FALLBACKS. Every value in the URL is attacker-free but
 *      script-written, and a mistyped `?era=` must produce a LABELLED still of
 *      a known era rather than a blank stage.
 *
 * ⚠ `v0` MUST STAY CHROME-FREE. It is the pixel-identical control, and a
 * chrome flag creeping onto it is exactly how a lab stops being able to answer
 * its own question.
 */

describe("hud-panel-lab · the direction registry", () => {
  it("is total and ordered — the record's keys are the tuple", () => {
    expect(Object.keys(HPL_DIRECTIONS)).toEqual([...HPL_DIRECTION_IDS]);
    expect(HPL_DIRECTION_LIST.map((d) => d.id)).toEqual([...HPL_DIRECTION_IDS]);
  });

  it("every direction declares its own id", () => {
    for (const id of HPL_DIRECTION_IDS) {
      expect(HPL_DIRECTIONS[id].id).toBe(id);
    }
  });

  it("v0 is first and carries NO chrome — it is the control", () => {
    expect(HPL_DIRECTION_IDS[0]).toBe("v0");
    const { chrome } = HPL_DIRECTIONS.v0;
    expect(chrome.header).toBe("none");
    expect(chrome.foot).toBe("none");
    expect(chrome.housing).toBe(false);
    expect(chrome.seams).toBe(false);
    expect(chrome.cellHeads).toBe(false);
    expect(chrome.corners).toBe(false);
    expect(chrome.bracket).toBe(false);
    expect(chrome.stubs).toBe(false);
    expect(chrome.boxes).toBe(false);
    expect(chrome.ladder).toBe(false);
    expect(chrome.housingKind).toBe("slab");
    expect(chrome.double).toBe(false);
    expect(chrome.cursor).toBe(false);
    expect(chrome.reticles).toBe(false);
  });

  it("every direction past v0 changes something", () => {
    for (const id of HPL_DIRECTION_IDS.filter((x) => x !== "v0")) {
      const { chrome } = HPL_DIRECTIONS[id];
      const changed =
        chrome.header !== "none" ||
        chrome.foot !== "none" ||
        chrome.housing ||
        chrome.seams ||
        chrome.cellHeads ||
        chrome.corners ||
        chrome.bracket ||
        chrome.stubs ||
        chrome.boxes ||
        chrome.ladder ||
        chrome.double ||
        chrome.cursor ||
        chrome.reticles;
      expect(changed, `${id} is indistinguishable from the control`).toBe(true);
    }
  });

  it("every direction past v0 carries the line ladder", () => {
    // The retuned structure ladder is the floor every composition argues ON
    // TOP of, so a direction without it is comparing two variables at once.
    for (const id of HPL_DIRECTION_IDS.filter((x) => x !== "v0")) {
      expect(HPL_DIRECTIONS[id].chrome.ladder, `${id} dropped the line ladder`).toBe(true);
    }
  });

  it("only a HOUSING direction may fuse its header", () => {
    // A bar welded to an edge needs an edge. Anywhere else it is a floating
    // bar, which is the defect this lab exists to remove.
    for (const id of HPL_DIRECTION_IDS) {
      const { chrome } = HPL_DIRECTIONS[id];
      if (chrome.header === "fused") expect(chrome.housing, `${id}`).toBe(true);
    }
  });

  it("a listing ring is still a housing", () => {
    // Box-drawing has no chamfer, but a ring is an enclosure: the fused
    // header it carries needs the edge `housing` declares, and the era
    // surface gates its enclosure off `housingKind`, not off `housing`.
    for (const id of HPL_DIRECTION_IDS) {
      const { chrome } = HPL_DIRECTIONS[id];
      if (chrome.housingKind === "listing") expect(chrome.housing, `${id}`).toBe(true);
    }
  });

  it("the listing is line-only by default and carries its seed", () => {
    // The direction's first refusal is a ground (its seed has no `G`) — which
    // is what lets one grammar cross to the transparent era stage. And the
    // derivation must stay findable: the provenance names the seed record.
    expect(defaultMaterial("v6")).toBe("line");
    expect(HPL_DIRECTIONS.v6.chrome).toMatchObject({
      housing: true,
      housingKind: "listing",
      double: true,
      cursor: true,
      reticles: true,
      ladder: true,
    });
    expect(HPL_DIRECTIONS.v6.provenance).toMatch(/seed-listing\.md/);
  });

  it("every direction states a thesis and a provenance", () => {
    for (const id of HPL_DIRECTION_IDS) {
      const d = HPL_DIRECTIONS[id];
      expect(d.label.length).toBeGreaterThan(3);
      // A direction with no argument is a style, and a lab full of styles
      // cannot be judged — the config-lab's 4-field contract.
      expect(d.thesis.length).toBeGreaterThan(80);
      expect(d.provenance.length).toBeGreaterThan(40);
    }
  });

  it("hplDirection falls back to the control", () => {
    expect(hplDirection("v3").id).toBe("v3");
    expect(hplDirection("nope").id).toBe("v0");
    expect(hplDirection(null).id).toBe("v0");
    expect(hplDirection(undefined).id).toBe("v0");
  });

  it("the housing direction opens on glass; everything else on line work", () => {
    expect(defaultMaterial("v2")).toBe("glass");
    for (const id of HPL_DIRECTION_IDS.filter((x) => x !== "v2")) {
      expect(defaultMaterial(id)).toBe("line");
    }
  });
});

describe("hud-panel-lab · parseHplQuery", () => {
  const parse = (search: string) => parseHplQuery(new URLSearchParams(search));

  it("defaults with an empty query", () => {
    const q = parse("");
    expect(q.s).toBe("proof");
    expect(q.v).toBe("v0");
    expect(q.theme).toBe("dark");
    expect(q.era).toBe(HPL_DEFAULT_ERA);
    expect(q.row).toBe(HPL_DEFAULT_ROW);
    expect(q.proofIn).toBe(1);
    expect(q.mat).toBe("line");
    expect(q.footRule).toBe("none");
    expect(q.ink).toBe("house");
  });

  it("the defaults name real records", () => {
    // Not a tautology: both defaults are read off the live registry, so a
    // renamed track id or a reordered era roster fails HERE rather than as a
    // blank surface in a capture.
    expect(CHARACTER_ERAS.some((e) => e.id === HPL_DEFAULT_ERA)).toBe(true);
    expect(PROOF_CASE.casefile.tracks.some((t) => t.id === HPL_DEFAULT_ROW)).toBe(true);
  });

  it("adopts every valid parameter", () => {
    const q = parse("s=eras&v=v4&theme=light&era=azeroth&in=0.4&mat=glass&foot=rule&ink=oxide");
    expect(q.s).toBe("eras");
    expect(q.v).toBe("v4");
    expect(q.theme).toBe("light");
    expect(q.era).toBe("azeroth");
    expect(q.proofIn).toBeCloseTo(0.4, 6);
    expect(q.mat).toBe("glass");
    expect(q.footRule).toBe("rule");
    expect(q.ink).toBe("oxide");
  });

  it("adopts every registered surface, direction and era", () => {
    for (const s of HPL_SURFACE_IDS) expect(parse(`s=${s}`).s).toBe(s);
    for (const v of HPL_DIRECTION_IDS) expect(parse(`v=${v}`).v).toBe(v);
    for (const ink of HPL_INKS) expect(parse(`ink=${ink}`).ink).toBe(ink);
    for (const era of CHARACTER_ERAS) expect(parse(`era=${era.id}`).era).toBe(era.id);
    for (const track of PROOF_CASE.casefile.tracks) {
      expect(parse(`row=${track.id}`).row).toBe(track.id);
    }
  });

  it("rejects unknown values without throwing", () => {
    const q = parse("s=nope&v=v9&theme=sepia&era=mars&row=nothing&mat=chrome&foot=maybe&ink=rust");
    expect(q.s).toBe("proof");
    expect(q.v).toBe("v0");
    expect(q.theme).toBe("dark");
    expect(q.era).toBe(HPL_DEFAULT_ERA);
    expect(q.row).toBe(HPL_DEFAULT_ROW);
    expect(q.mat).toBe("line");
    expect(q.footRule).toBe("none");
    expect(q.ink).toBe("house");
  });

  it("clamps the proof clock to [0, 1] and survives nonsense", () => {
    expect(parse("in=-3").proofIn).toBe(0);
    expect(parse("in=42").proofIn).toBe(1);
    expect(parse("in=0").proofIn).toBe(0);
    expect(parse("in=banana").proofIn).toBe(1);
    expect(parse("in=").proofIn).toBe(1);
  });

  it("the material falls back to the DIRECTION's default, not a constant", () => {
    // `?v=v2` with no `?mat=` must open on glass; the same URL with an
    // explicit `mat=line` must not be overridden by the direction.
    expect(parse("v=v2").mat).toBe("glass");
    expect(parse("v=v2&mat=line").mat).toBe("line");
    expect(parse("v=v5").mat).toBe("line");
    expect(parse("v=v5&mat=glass").mat).toBe("glass");
    // The listing refuses a ground, but the KNOB still parses — the sheet is
    // what makes `?mat=glass` inert on v6, not the parser.
    expect(parse("v=v6").mat).toBe("line");
    expect(parse("v=v6&mat=glass").mat).toBe("glass");
  });
});

/**
 * ⚠ THERE IS NO SECOND REGISTRY. The shells hold no per-direction record —
 * both surfaces branch on the `chrome` flags and on `dir` alone, so the ONE
 * total record is `HPL_DIRECTIONS` (a `Record<HplDirectionId, …>`, which the
 * compiler keeps total) and the tuple/keys test above is what pins its order.
 * A direction that needs new markup adds a `chrome` field and a branch, never
 * a parallel table that could fall out of step with this one.
 */
describe("hud-panel-lab · surfaces", () => {
  it("declares exactly the two surfaces the lab composes", () => {
    expect([...HPL_SURFACE_IDS]).toEqual(["proof", "eras"]);
  });

  it("the direction ids are safe in a URL and a filename", () => {
    for (const id of HPL_DIRECTION_IDS as readonly HplDirectionId[]) {
      expect(id).toMatch(/^[a-z0-9]+$/);
    }
  });
});
