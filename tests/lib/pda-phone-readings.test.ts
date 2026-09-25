import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  PDA_PHONE_VIEW,
  phoneConfiguration,
  phoneLayer,
  selectWorks,
} from "@/components/landing/home-v2/services/casefile/map/pda/pdaRecord";
import { getCase } from "@/lib/cases/registry";

import { ENVELOPE } from "./helpers/mapEnvelope";

/**
 * THE MAP'S THREE PHONE READINGS (ADR-107 U2).
 *
 * On the rung that hides the console (≤980px, reduced motion) the map's
 * fallback was one list — the stream index — whatever the rail said, so a
 * tap on CONFIGURATION or LAYER changed `view` and nothing visible followed.
 * The fallback is three lists now, keyed on the same `view`; this pins the
 * two new projections against the live record, and walks every string they
 * letter under the confidentiality envelope the map's own copy carries
 * (`cases-registry.test.ts`), because a projection composed at render time
 * is outside every content scanner.
 */

const ROOT = join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

function mapVisual() {
  const visual = getCase("loop-earplugs")?.casefile.tracks.find(
    (t) => t.visual.kind === "intelligence-map"
  )?.visual;
  if (!visual || visual.kind !== "intelligence-map") throw new Error("no intelligence-map track");
  return visual;
}

describe("the phone readings' projections", () => {
  const visual = mapVisual();
  const shown = selectWorks(visual.districts, visual.works, visual.skills);
  const cfg = phoneConfiguration(shown);
  const layer = phoneLayer(visual.shapes, visual.skills);

  it("names the three readings the rail selects", () => {
    expect(PDA_PHONE_VIEW).toEqual({ 1: "work", 2: "configuration", 3: "layer" });
  });

  it("02 letters every stream on the board once, answered", () => {
    expect(cfg.map((r) => r.id)).toEqual(shown.map((w) => w.id));
    for (const r of cfg) {
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.teamName.length).toBeGreaterThan(0);
      expect(r.runs.length).toBeGreaterThan(0);
      expect(r.reach.length).toBeGreaterThan(0);
      expect(r.where.length).toBeGreaterThan(0);
      if (r.configured) {
        // The R4 board's own answers, joined: the Skill and the lane's verbs,
        // the graph and the system, the agent and the interface.
        expect(r.runs).toMatch(/ · /);
        expect(r.reach).toMatch(/ · /);
        expect(r.where).toMatch(/ · /);
        expect(r.runs).not.toMatch(/PERSON DOES THE WORK|NOT BOUND/);
      } else {
        // Person-led: the absence is a reading, said in the record's words.
        expect(r.runs).toBe("THE PERSON DOES THE WORK");
        expect(r.reach).toBe("NOTHING BOUND");
        expect(r.where).toBe("NO AGENT · NO INTERFACE");
      }
    }
    expect(cfg.filter((r) => !r.configured).length).toBeGreaterThanOrEqual(1);
    expect(cfg.filter((r) => r.configured).length).toBeGreaterThan(cfg.length / 2);
  });

  it("03 letters the five shapes with their sentences and every Skill on the roster once, the first encode leading", () => {
    expect(layer).toHaveLength(visual.shapes.length);
    expect(layer.map((s) => s.key)).toEqual(visual.shapes.map((s) => s.key));
    const seen = new Set<string>();
    for (const s of layer) {
      const shape = visual.shapes.find((x) => x.key === s.key)!;
      expect(s.name).toBe(shape.label.toUpperCase());
      expect(s.meaning).toBe(shape.meaning);
      expect(s.meaning).not.toBe(s.meaning.toUpperCase());
      expect(s.skills.length).toBe(shape.skills);
      for (const k of s.skills) {
        expect(seen.has(k.id), `${k.id} letters twice`).toBe(false);
        seen.add(k.id);
        expect(k.short.length).toBeGreaterThan(0);
        expect(k.short.length).toBeLessThanOrEqual(14);
      }
      // The flagship — the roster's own flag, the pattern's first encode,
      // exactly one per engine (`cases-registry` pins it) — leads its run.
      const flags = s.skills.filter((k) => k.flagship);
      expect(flags.length).toBe(1);
      expect(s.skills[0].flagship).toBe(true);
      const rosterFlag = visual.skills.find((k) => k.flagship && k.engine.toLowerCase() === s.key);
      expect(s.skills[0].id).toBe(rosterFlag?.id);
    }
    expect(seen.size).toBe(visual.skills.length);
  });

  it("letters nothing the envelope bans, and no ordinal head", () => {
    const strings: string[] = [];
    for (const r of cfg) strings.push(r.title, r.teamName, r.runs, r.reach, r.where);
    for (const s of layer) {
      strings.push(s.name, s.meaning);
      for (const k of s.skills) strings.push(k.short);
    }
    const blob = strings.join(" | ");
    for (const [label, re] of ENVELOPE) {
      expect(re.test(blob), `the phone readings letter ${label}`).toBe(false);
    }
    // No digit-adjacent team count (the district guard's own failure mode).
    expect(blob).not.toMatch(new RegExp(`\\b${visual.districts.length}\\+?\\s+teams?\\b`, "i"));
    // The component prints no `01 ·` head: the rail carries the order.
    const src = read("components/landing/home-v2/services/casefile/map/pda/PdaPhoneReadings.tsx");
    expect(src).not.toMatch(/"0[123] ·/);
    expect(src).not.toMatch(/foot\.title/);
  });
});

describe("the fallback is the rail's", () => {
  it("the console mounts the three readings in its fallback slot, keyed on the view", () => {
    const console = read("components/landing/home-v2/services/casefile/map/pda/PdaConsole.tsx");
    expect(console).toMatch(/<PdaPhoneReadings[\s\S]*?view=\{view\}/);
    // ⚠ No rail in the fallback: `ConsoleFrame` renders it on every rung, and
    // a second ConsoleRail doubled the desktop arcs' `.fl-con__stn` count
    // behind a hidden list (arc-portfolio-smoke's "the three readings").
    const mount = console.match(/<PdaPhoneReadings[\s\S]*?\/>/)?.[0] ?? "";
    expect(mount.length).toBeGreaterThan(20);
    expect(mount).not.toMatch(/rail=/);
    const readings = read(
      "components/landing/home-v2/services/casefile/map/pda/PdaPhoneReadings.tsx"
    );
    // The component neither imports nor mounts a rail (its comment may NAME one).
    expect(readings).not.toMatch(/import[^;]*ConsoleRail|<ConsoleRail|fl-pda__list-rail/);
    const comp = read("components/landing/home-v2/services/casefile/map/pda/PdaPhoneReadings.tsx");
    expect(comp).toMatch(/data-pda-phone-view=\{PDA_PHONE_VIEW\[view\]\}/);
    expect(comp).toMatch(/view === 1 \?/);
    expect(comp).toMatch(/view === 2 \?/);
    expect(comp).toMatch(/view === 3 \?/);
  });

  it("the phone can scroll the list: the map's event layer is off ≤960 and the list releases at its bounds", () => {
    const stack = read("components/landing/home-v2/services/proof-stack/proof-stack.css");
    expect(stack).toMatch(
      /@media \(max-width: 960px\) \{[\s\S]*?\.pf-stack \.pf-field--map::after \{[^}]*display:\s*none/
    );
    const pda = read("components/landing/home-v2/services/casefile/map/pda/pda.css");
    expect(pda).toMatch(/\.fl-pda__list \{[^}]*overscroll-behavior-y:\s*auto/);
    expect(pda).toMatch(/\.fl-pda__list \{[^}]*touch-action:\s*pan-y/);
  });
});
