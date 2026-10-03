import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CLIENTS, GROUPS, THOUGHTFORM_HOUSE, getGroup, groupSlugs } from "@/lib/arcs/clients";
import { LEGACY_ARC_ROUTES } from "@/lib/arcs/legacyRoutes.mjs";
import { ARCS, arcHrefs, arcSlugs, arcsOf, getArcAt, houseArcs } from "@/lib/arcs/registry";
import { HOUSE_SLUG, arcHref, groupHref, groupOf } from "@/lib/arcs/routes";

/**
 * Where the arcs live (ADR-142): `/arcs/<group>/<leaf>`, the group a client
 * or the house, `/arcs/<group>` its listing, and every flat address the site
 * ever handed out forwarded to its page today.
 *
 * ⚠ THE OLD ADDRESSES ARE PINNED BY HAND, NOT DERIVED. They are history:
 * links already sitting in inboxes, which no record in the registry
 * remembers. Deriving them would let a later rename drop one silently, which
 * is exactly the failure the redirects exist to prevent.
 */

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Every address an arc page answered at before ADR-142, and the two
 *  renames before that. Never shrink this list. */
const HANDED_OUT = [
  "/arcs/portfolio",
  "/trinny-london",
  "/claude-workshop",
  "/arcs/loop-earplugs",
  "/arcs/suri-proposal",
  "/arcs/suri-workshop",
  "/arcs/perfect-ted-proposal",
  "/arcs/hungry-minds-proposal",
  "/arcs/pandora-proposal",
  "/arcs/plopsa-workshop",
  "/arcs/thoughtform-workshop",
  "/arcs/thoughtform-workshop-v2",
  "/arcs/claude-workshop",
  "/arcs/claude-workshop-v2",
  "/arcs/ai-keynote",
  "/arcs/ai-keynote-v2",
  "/arcs/ai-storytelling",
  "/arcs/ai-storytelling-class-1",
  "/arcs/ap-hogeschool",
  "/arcs/trinny-london/proposal",
  "/arcs/trinny-london",
  "/arcs/loop",
  "/arcs/suri",
  "/arcs/perfect-ted",
  "/arcs/hungry-minds",
  "/arcs/pandora",
  "/arcs/plopsa",
];

/** Every page that answers under `/arcs/` today, and the old corridor's. */
const LIVE = new Set([
  ...arcHrefs(),
  ...GROUPS.map((g) => groupHref(g.slug)),
  ...GROUPS.flatMap((g) => (g.pages ?? []).map((p) => p.href)),
]);

const ARCS_DIR = join(__dirname, "..", "..", "app", "(marketing)", "arcs");

describe("where the arcs live (ADR-142)", () => {
  it("every arc has one address, two segments under its group", () => {
    for (const arc of ARCS) {
      expect(arc.leaf, `${arc.slug}: leaf`).toMatch(KEBAB);
      expect(groupSlugs(), `${arc.slug}: its group has a page`).toContain(groupOf(arc));
      expect(arcHref(arc)).toBe(`/arcs/${groupOf(arc)}/${arc.leaf}`);
      expect(getArcAt(groupOf(arc), arc.leaf)).toBe(arc);
    }
    expect(new Set(arcHrefs()).size, "two arcs claim one address").toBe(ARCS.length);
  });

  it("a house format lives under the house, a client's engagement under its client", () => {
    for (const arc of ARCS) expect(groupOf(arc)).toBe(arc.client ?? HOUSE_SLUG);
    expect(arcsOf(HOUSE_SLUG)).toEqual(houseArcs());
    expect(houseArcs().length).toBeGreaterThan(0);
  });

  it("the house is a group, never a client, and shares no slug with anything", () => {
    expect(CLIENTS).not.toContain(THOUGHTFORM_HOUSE);
    expect(GROUPS).toContain(THOUGHTFORM_HOUSE);
    expect(getGroup(HOUSE_SLUG)).toBe(THOUGHTFORM_HOUSE);
    expect(new Set(groupSlugs()).size).toBe(GROUPS.length);
    // Group and arc ids share the overview's element ids.
    expect(groupSlugs().filter((s) => arcSlugs().includes(s))).toEqual([]);
  });

  it("a group's page that is not an arc sits two segments deep under that group", () => {
    for (const group of GROUPS)
      for (const page of group.pages ?? []) {
        const [, arcs, owner, leaf, ...rest] = page.href.split("/");
        expect([arcs, owner, rest.length], page.href).toEqual(["arcs", group.slug, 0]);
        expect(leaf, page.href).toMatch(KEBAB);
        expect(arcHrefs(), `${page.href}: a page and an arc at one address`).not.toContain(
          page.href
        );
      }
  });

  it("forwards every flat address to its page, in one hop", () => {
    const sources = LEGACY_ARC_ROUTES.map(([source]) => source);
    expect(new Set(sources).size, "a source listed twice").toBe(sources.length);
    for (const [source, destination] of LEGACY_ARC_ROUTES) {
      expect(LIVE, `${source} forwards to a page that does not exist`).toContain(destination);
      expect(LIVE, `${source} is a live page, and a redirect would hide it`).not.toContain(source);
      expect(sources, `${source} → ${destination} is two hops`).not.toContain(destination);
    }
  });

  it("every address the site ever handed out still answers", () => {
    const forward = new Map(LEGACY_ARC_ROUTES.map(([s, d]) => [s, d]));
    for (const address of HANDED_OUT)
      expect(LIVE, `${address} no longer answers`).toContain(forward.get(address) ?? address);
  });

  it("next.config serves the list as permanent redirects", () => {
    const config = readFileSync(join(__dirname, "..", "..", "next.config.mjs"), "utf8");
    expect(config).toContain('from "./lib/arcs/legacyRoutes.mjs"');
    expect(config).toMatch(/\.\.\.LEGACY_ARC_ROUTES\.map\(/);
    expect(config).toMatch(/permanent: true/);
  });

  it("the listing route and the arc route are the two dynamic segments, nothing deeper", () => {
    const listing = readFileSync(join(ARCS_DIR, "[slug]", "page.tsx"), "utf8");
    const arc = readFileSync(join(ARCS_DIR, "[slug]", "[leaf]", "page.tsx"), "utf8");
    expect(listing).toContain("groupSlugs()");
    expect(listing).not.toContain("getArc");
    expect(arc).toContain("getArcAt(slug, leaf)");
    expect(arc).toContain("dynamicParams = false");
  });
});
