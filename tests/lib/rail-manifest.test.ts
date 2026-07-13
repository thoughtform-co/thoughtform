import { describe, expect, it } from "vitest";

import { MANIFEST_ENTRIES } from "@/lib/rail-manifest/entries";
import { getV7Content } from "@/lib/v7-parse";
import { injectStaticHudChildren } from "@/lib/v7-parse/hudTicks";
import { buildRailManifestHtml } from "@/lib/v7-parse/railManifest";

/**
 * Rail Manifest (ADR-031) — data model, parse-time skeleton, and the
 * drift guard pinning the curated journey order to the production DOM.
 */

// Duplicated from app/(marketing)/page.tsx (importing the server
// component would drag Next.js server context into vitest). If the
// production options change there, THIS copy must change with them —
// the drift-guard test below is the alarm that fires when the two
// disagree with reality.
const PRODUCTION_PARSE_OPTIONS = {
  removeStations: [
    "definition",
    "missing-layer",
    "intelligence-layer",
    "approach",
    "buildQuote",
  ] as unknown as readonly string[],
  relocateStationsToMount: [
    { stationId: "tools" },
    { stationId: "services", dropTrailingConnectorSlot: "practice-to-about" },
  ],
  corridorMountId: "home-corridor-mount",
};

describe("MANIFEST_ENTRIES data model", () => {
  it("has 10 entries with unique ids in the expected journey order", () => {
    expect(MANIFEST_ENTRIES).toHaveLength(10);
    const ids = MANIFEST_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      "hero",
      "thesis",
      "arc",
      "services",
      "tools",
      "continuum",
      "practice",
      "build",
      "about",
      "contact",
    ]);
  });

  it("corridor entries carry phases + fractions; stations carry element targets", () => {
    for (const entry of MANIFEST_ENTRIES) {
      if (entry.kind === "corridor") {
        expect(entry.targetId).toBe("home-corridor-mount");
        expect(entry.corridorPhase).toMatch(/^(thesis|arc)$/);
        expect(entry.scrollFraction).toBeGreaterThanOrEqual(0);
        expect(entry.scrollFraction).toBeLessThanOrEqual(1);
      } else {
        expect(entry.corridorPhase).toBeUndefined();
        expect(entry.targetId).toBe(entry.id);
      }
    }
  });

  it("the three brand pillars carry the stack glyph; only hero hides its active name", () => {
    expect(MANIFEST_ENTRIES.filter((e) => e.glyph === "stack").map((e) => e.id)).toEqual([
      "arc",
      "services",
      "tools",
    ]);
    expect(MANIFEST_ENTRIES.filter((e) => e.hideActiveName).map((e) => e.id)).toEqual(["hero"]);
  });
});

describe("buildRailManifestHtml — parse-time skeleton", () => {
  const html = buildRailManifestHtml();

  it("emits one rolodex (window → reel) with one button row per entry", () => {
    expect(html.match(/rail-manifest__window/g)).toHaveLength(1);
    expect(html.match(/rail-manifest__reel/g)).toHaveLength(1);
    expect(html.match(/<button /g)).toHaveLength(MANIFEST_ENTRIES.length);
    for (const entry of MANIFEST_ENTRIES) {
      expect(html).toContain(`data-entry-id="${entry.id}"`);
      expect(html).toContain(`data-target="#${entry.targetId}"`);
    }
    // The reel is flow-stacked — no per-slot inline positioning, no
    // bracket bays, no separate label span (Update 3 retired them).
    expect(html).not.toContain('style="top:');
    expect(html).not.toContain("rail-manifest__marker");
    expect(html).not.toContain("rail-manifest__label");
  });

  it("first paint state: hero active at dist 0, everything else upcoming", () => {
    expect(html.match(/data-state="active"/g)).toHaveLength(1);
    expect(html.match(/data-state="upcoming"/g)).toHaveLength(MANIFEST_ENTRIES.length - 1);
    expect(html.indexOf('data-state="active"')).toBeLessThan(html.indexOf('data-state="upcoming"'));
    expect(html.match(/data-dist="0"/g)).toHaveLength(1);
    expect(html.indexOf('data-dist="0"')).toBeLessThan(html.indexOf('data-dist="1"'));
  });

  it("bakes names for first paint; authored numbers never ship in the skeleton", () => {
    expect(html).toContain('<span class="rail-manifest__name">Hero</span>');
    expect(html).toContain('<span class="rail-manifest__name">Services</span>');
    expect(html).toContain('<span class="rail-manifest__name">Contact</span>');
    // The non-monotonic authored numbers (…08, 08A, 05…) ride only the
    // ACTIVE row, applied by the controller — never baked.
    expect(html).not.toContain("08");
    // Positional aria-labels stay monotonic for assistive tech.
    expect(html).toContain('aria-label="Services — section 4 of 10"');
    expect(html).toContain('aria-label="Contact — section 10 of 10"');
  });

  it("the three brand-pillar rows carry the stack glyph, and markup is balanced", () => {
    expect(html.match(/rail-manifest__glyph"/g)).toHaveLength(3);
    expect(html.match(/<button /g)).toHaveLength(html.match(/<\/button>/g)?.length ?? -1);
    expect(html.match(/<svg /g)).toHaveLength(html.match(/<\/svg>/g)?.length ?? -1);
  });
});

describe("injectStaticHudChildren — manifest shell", () => {
  it("fills the manifest nav shell when present", () => {
    const shell =
      '<aside><nav id="railManifest" data-rail-manifest-root aria-label="Page manifest"></nav></aside>';
    const out = injectStaticHudChildren(shell);
    expect(out).toContain("rail-manifest__entry");
    expect(out.match(/<button /g)).toHaveLength(MANIFEST_ENTRIES.length);
  });

  it("leaves workshop-style markup (tick shells, no manifest nav) working unchanged", () => {
    const workshop = '<div id="leftTicks"></div><div id="rightTicks"></div>';
    const out = injectStaticHudChildren(workshop);
    expect(out).toContain("hud__rail__tick");
    expect(out).not.toContain("rail-manifest__entry");
  });
});

describe("drift guard — manifest order matches the parsed production DOM", () => {
  const { bodyHtml } = getV7Content(PRODUCTION_PARSE_OPTIONS);

  it("station-kind entries appear in the DOM in manifest order", () => {
    const domStations = Array.from(bodyHtml.matchAll(/<section[^>]*\bdata-station="([^"]+)"/g)).map(
      (m) => m[1]
    );
    const manifestStations = MANIFEST_ENTRIES.filter((e) => e.kind === "station").map(
      (e) => e.targetId
    );
    expect(domStations).toEqual(manifestStations);
  });

  it("the corridor mount precedes #services (the corridor entries' seat in the journey)", () => {
    const mountAt = bodyHtml.indexOf('id="home-corridor-mount"');
    const servicesAt = bodyHtml.search(/<section[^>]*\bdata-station="services"/);
    expect(mountAt).toBeGreaterThan(-1);
    expect(servicesAt).toBeGreaterThan(-1);
    expect(mountAt).toBeLessThan(servicesAt);
  });

  it("the parsed body carries the injected manifest skeleton", () => {
    expect(bodyHtml).toContain('data-rail-manifest-root aria-label="Page manifest">');
    expect(bodyHtml.match(/rail-manifest__entry/g)?.length).toBe(MANIFEST_ENTRIES.length);
    // The Brand Codex left ladder COEXISTS with the manifest (ADR-031
    // Update 2 — the ladder is never removed); only the old single
    // station label is gone.
    expect(bodyHtml).toMatch(/<div id="leftTicks"><div class="hud__rail__tick/);
    expect(bodyHtml).not.toContain("data-rail-label-root");
  });
});
