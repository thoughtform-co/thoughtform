import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { THOUGHTFORM_ARMADA_ARC } from "@/lib/arcs/content/thoughtform-armada";
import { getArcAt } from "@/lib/arcs/registry";

/**
 * How Armada works, the technical companion to the third house cut
 * (ADR-146).
 *
 * ⚠ A HOUSE PAGE CARRYING ONE CLIENT'S WORK, by the owner's ruling. So what
 * it may not carry is pinned here rather than trusted: no colleague of the
 * client by name (the page says the creative lead, the lead designer, the
 * strategists, growth), no other client, and no callsign, the port's own
 * keys. The close is the shared record and signs with the practice's name,
 * so it is the one section the name walk leaves out.
 *
 * ⚠ THE NAMES IT DRAWS ARE THE CLIENT'S REAL ONES. Every plugin and skill
 * the repository beat letters is a folder in Suri's plugin repository,
 * checked wherever that repository is on disk on the names of 3 October
 * (`SURI_AI_STUDIO_DIR`, default the sibling `suri-ai-studio`).
 */

const ARC = THOUGHTFORM_ARMADA_ARC;

/** Walk every string in a value, with a dotted path. */
function walk(value: unknown, path: string, visit: (s: string, p: string) => void) {
  if (typeof value === "string") visit(value, path);
  else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`, visit));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`, visit);
  }
}

/** Suri's colleagues, as the sprint plan names them. Case-sensitive. */
const PEOPLE = /\b(Kate|Nick|Lottie|Lotti|Adam|Mark|Rob|Gyve|Nadine)\b/;
/** Other clients and the employer, by the names the practice files them
 *  under. Case-sensitive, so a station called "loop" stays a station. */
const OTHERS =
  /\b(Samako|Plopsa|Pandora|Trinny|Loop|Delaware|Exalate|Dioss|Yuki|Vesper|Hungry Minds|Perfect Ted|In The Pocket)\b/;
/** The port's callsigns: the keys a ship is filed under, never lettered. */
const CALLSIGNS =
  /\b(puffin|gannet|murre|kittiwake|fulmar|skua|tern|prion|petrel|eider|cormorant|guillemot|razorbill|shearwater|auk)\b/i;

describe("the Armada companion (ADR-146)", () => {
  it("lives at /arcs/thoughtform/armada, a house page", () => {
    expect(getArcAt("thoughtform", "armada")).toBe(ARC);
    expect(ARC.client).toBeUndefined();
  });

  it("carries the same three pieces of work, in order, in every switched beat", () => {
    const groups = new Map<string, string[]>();
    for (const s of ARC.sections) {
      if (!s.worked) continue;
      groups.set(s.worked.group, [...(groups.get(s.worked.group) ?? []), s.worked.id]);
    }
    expect([...groups.keys()]).toEqual(["config", "skill", "checks", "cases", "using", "wrong"]);
    for (const [group, ids] of groups) {
      expect(ids, group).toEqual(["brief", "monday-read", "statics"]);
    }
  });

  it("names no colleague, no other client and no callsign", () => {
    const faults: string[] = [];
    const page = { ...ARC, sections: ARC.sections.filter((s) => s.kind !== "close") };
    walk(page, ARC.slug, (s, p) => {
      for (const law of [PEOPLE, OTHERS, CALLSIGNS]) {
        const hit = s.match(law);
        if (hit) faults.push(`${p}: "${hit[0]}"`);
      }
    });
    expect(faults).toEqual([]);
  });

  it("draws the client's real plugins and skills", () => {
    const root = process.env.SURI_AI_STUDIO_DIR ?? join(process.cwd(), "..", "suri-ai-studio");
    // Absent, or still on the names before 3 October: nothing to read against.
    if (!existsSync(join(root, "plugins", "ai-suri"))) return;
    const repo = ARC.sections.find((s) => s.kind === "repository");
    expect(repo, "the repository beat").toBeDefined();
    if (repo?.kind !== "repository") return;
    for (const p of repo.plugins) {
      const dir = join(root, "plugins", p.name);
      expect(existsSync(dir), `${p.name} is a plugin in the repository`).toBe(true);
      for (const item of p.items) {
        if (item.ghost) continue; // named for a later week, not there yet
        const at = item.name.endsWith("/")
          ? join(dir, item.name)
          : join(dir, "skills", item.name, "SKILL.md");
        expect(existsSync(at), `${p.name}/${item.name} is on disk`).toBe(true);
      }
    }
    for (const f of repo.repo.files) {
      expect(existsSync(join(root, f.path)), `${f.path} is in the repository`).toBe(true);
    }
  });
});
