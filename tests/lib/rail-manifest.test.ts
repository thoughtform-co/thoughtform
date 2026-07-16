import { describe, expect, it } from "vitest";

import { MANIFEST_ENTRIES, manifestTitle } from "@/lib/rail-manifest/entries";
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
    // ADR-033: the cases live in the Arc's Build-park orbit; both
    // standalone case surfaces retired.
    "build",
    "tools",
  ] as unknown as readonly string[],
  relocateStationsToMount: [
    { stationId: "about" },
    { stationId: "services", dropTrailingConnectorSlot: "practice-to-about" },
  ],
  corridorMountId: "home-corridor-mount",
};

describe("MANIFEST_ENTRIES data model", () => {
  it("has 10 entries with unique ids in the expected journey order (beat granularity)", () => {
    expect(MANIFEST_ENTRIES).toHaveLength(10);
    const ids = MANIFEST_ENTRIES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Update 9: the corridor is FOUR beats (thesis + the Arc's three moves),
    // so the detent diamond follows the corridor's structure.
    expect(ids).toEqual([
      "hero",
      "thesis",
      "navigate",
      "encode",
      "build",
      "services",
      "about",
      "continuum",
      "practice",
      "contact",
    ]);
  });

  it("corridor entries carry phases + fractions; stations carry element targets", () => {
    for (const entry of MANIFEST_ENTRIES) {
      if (entry.kind === "corridor") {
        expect(entry.targetId).toBe("home-corridor-mount");
        expect(entry.corridorPhase).toMatch(/^(thesis|navigate|encode|build)$/);
        expect(entry.scrollFraction).toBeGreaterThanOrEqual(0);
        expect(entry.scrollFraction).toBeLessThanOrEqual(1);
      } else {
        expect(entry.corridorPhase).toBeUndefined();
        expect(entry.targetId).toBe(entry.id);
      }
    }
  });

  it("corridor beat fractions are strictly increasing (thesis → navigate → encode → build)", () => {
    const fractions = MANIFEST_ENTRIES.filter((e) => e.kind === "corridor").map(
      (e) => e.scrollFraction ?? 0
    );
    expect(fractions).toHaveLength(4);
    for (let i = 1; i < fractions.length; i++) {
      expect(fractions[i]).toBeGreaterThan(fractions[i - 1]);
    }
  });

  it("only hero hides its active name", () => {
    expect(MANIFEST_ENTRIES.filter((e) => e.hideActiveName).map((e) => e.id)).toEqual(["hero"]);
  });
});

describe("manifestTitle — hover-title eligibility (Update 9)", () => {
  it("returns the name for titled entries, null for hero and blank names", () => {
    const navigate = MANIFEST_ENTRIES.find((e) => e.id === "navigate")!;
    const hero = MANIFEST_ENTRIES.find((e) => e.id === "hero")!;
    expect(manifestTitle(navigate)).toBe("Navigate");
    // hero has hideActiveName → reveals no title (hero canon), marker only.
    expect(manifestTitle(hero)).toBeNull();
    // future interstitials can opt out with a blank name too.
    expect(manifestTitle({ ...navigate, name: "  " })).toBeNull();
  });
});

describe("buildRailManifestHtml — parse-time skeleton (Update 9, detent diamond)", () => {
  const html = buildRailManifestHtml();

  it("emits exactly one diamond button + one title chip", () => {
    expect(html.match(/rail-manifest__diamond/g)).toHaveLength(1);
    expect(html.match(/rail-manifest__title/g)).toHaveLength(1);
    expect(html.match(/<button /g)).toHaveLength(1);
    expect(html).toContain("data-rail-manifest-diamond");
    expect(html).toContain("data-rail-manifest-title");
    expect(html).toContain('<button type="button"');
  });

  it("carries no rolodex machinery — no window/reel/entry/name rows or pillar ids", () => {
    expect(html).not.toContain("rail-manifest__window");
    expect(html).not.toContain("rail-manifest__reel");
    expect(html).not.toContain("rail-manifest__entry");
    expect(html).not.toContain("rail-manifest__name");
    for (const id of ["hero", "arc", "services", "about", "continuum"]) {
      expect(html).not.toContain(`data-entry-id="${id}"`);
    }
  });

  it("bakes no inline top — position is the CSS var, written live; title is aria-hidden", () => {
    // An inline `top` would override the stylesheet's `top: var(--rail-diamond-top)`.
    expect(html).not.toContain('style="top:');
    expect(html).toContain('aria-hidden="true"');
    // The button carries the accessible name (the controller retitles it live).
    expect(html).toContain('aria-label="Journey position"');
    expect(html).not.toContain("<svg");
  });
});

describe("injectStaticHudChildren — manifest shell", () => {
  it("fills the manifest nav shell with the diamond marker when present", () => {
    const shell =
      '<aside><nav id="railManifest" data-rail-manifest-root aria-label="Page manifest"></nav></aside>';
    const out = injectStaticHudChildren(shell);
    expect(out.match(/rail-manifest__diamond/g)).toHaveLength(1);
    expect(out).toContain("rail-manifest__title");
  });

  it("leaves workshop-style markup (tick shells, no manifest nav) working unchanged", () => {
    const workshop = '<div id="leftTicks"></div><div id="rightTicks"></div>';
    const out = injectStaticHudChildren(workshop);
    expect(out).toContain("hud__rail__tick");
    expect(out).not.toContain("rail-manifest__diamond");
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

  it("#about directly follows #services; #tools/#build are gone (ADR-033)", () => {
    const servicesAt = bodyHtml.search(/<section[^>]*\bdata-station="services"/);
    const aboutAt = bodyHtml.search(/<section[^>]*\bdata-station="about"/);
    const continuumAt = bodyHtml.search(/<section[^>]*\bdata-station="continuum"/);
    expect(servicesAt).toBeGreaterThan(-1);
    expect(aboutAt).toBeGreaterThan(servicesAt);
    expect(continuumAt).toBeGreaterThan(aboutAt);
    expect(bodyHtml).not.toMatch(/<section[^>]*\bid="tools"/);
    expect(bodyHtml).not.toMatch(/<section[^>]*\bid="build"/);
    // Element-form (prototype comments mention the slot names in prose).
    expect(bodyHtml).not.toMatch(/<div\b[^>]*\bdata-tools-cards-root/);
    expect(bodyHtml).not.toMatch(/<div\b[^>]*\bdata-build-cases-root/);
  });

  it("the parsed body carries the injected manifest skeleton", () => {
    expect(bodyHtml).toContain('data-rail-manifest-root aria-label="Page manifest">');
    // Update 9: one detent diamond, not a reel of pillar rows.
    expect(bodyHtml.match(/rail-manifest__diamond/g)?.length).toBe(1);
    // The Brand Codex left ladder COEXISTS with the manifest (ADR-031
    // Update 2 — the ladder is never removed); only the old single
    // station label is gone.
    expect(bodyHtml).toMatch(/<div id="leftTicks"><div class="hud__rail__tick/);
    expect(bodyHtml).not.toContain("data-rail-label-root");
  });
});
