import { describe, expect, it } from "vitest";

import { extractV7Text, getV7Content, sliceV7Sections } from "@/lib/v7-parse";

/**
 * v7-parse contracts (regression coverage for the production homepage).
 *
 * These tests pin the behavior the marketing route relies on so the
 * parser can be split into smaller modules safely (Phase 3 of the
 * Homepage Refactor And Hardening Plan). They run against the live
 * `public/prototypes/v7/landing-v7-motion.html` so a drift in the
 * prototype's structural ids/classes will fail loudly here before it
 * silently breaks the homepage.
 *
 * Production caller — `app/(marketing)/page.tsx`:
 *   - Removes: definition · missing-layer · intelligence-layer · approach ·
 *     buildQuote · build · tools (the last two retired with ADR-033 —
 *     the cases live in the Arc's Build-park orbit)
 *   - Inserts: <div id="home-corridor-mount" data-home-corridor-mount></div>
 *   - Relocates: about + services (services drops its trailing connector
 *     slot `practice-to-about`).
 */

const CORRIDOR_REPLACED_STATIONS = [
  "definition",
  "missing-layer",
  "intelligence-layer",
  "approach",
  "buildQuote",
  "build",
  "tools",
] as const;

// Mirrors app/(marketing)/page.tsx: specs run in array order, each
// inserting immediately after the mount, so the LAST lands closest —
// about first + services second ⇒ mount → #services → #about (ADR-033).
const CORRIDOR_RELOCATED_STATIONS = [
  { stationId: "about" },
  { stationId: "services", dropTrailingConnectorSlot: "practice-to-about" },
] as const;

const CORRIDOR_MOUNT_ID = "home-corridor-mount";

describe("v7-parse — pristine prototype shape", () => {
  it("extracts a non-empty body and a theme body class", () => {
    const { bodyHtml, bodyClass } = getV7Content();
    expect(bodyHtml.length).toBeGreaterThan(1000);
    expect(bodyClass).toContain("theme-instrument");
  });

  it("strips raw <script> tags from the body so they never re-execute on the React tree", () => {
    const { bodyHtml } = getV7Content();
    expect(/<script[\s>]/i.test(bodyHtml)).toBe(false);
  });

  it("rewrites prototype asset paths to the public/ tree", () => {
    const { bodyHtml } = getV7Content();
    expect(bodyHtml).not.toMatch(/src="assets\/logos\//);
    expect(bodyHtml).not.toMatch(/src="assets\/vince-portrait\.jpg"/);
  });

  it("clears the placeholder <img> inside each brandmark anchor", () => {
    const { bodyHtml } = getV7Content();
    // Brand anchor wrappers must remain (they own the dock layout box)…
    expect(bodyHtml).toMatch(/data-brand-anchor=/);
    // …but they must not still ship the prototype's raster placeholder.
    const anchorWithImg =
      /<(?:div|span|section|article)\b[^>]*data-brand-anchor="[^"]+"[^>]*>\s*<img/;
    expect(anchorWithImg.test(bodyHtml)).toBe(false);
  });

  it("injects the static HUD rail children (both tick ladders + left manifest, ADR-031 U2)", () => {
    const { bodyHtml } = getV7Content();
    // Both rails keep the Brand Codex tick ladder (ADR-031 Update 2:
    // the ladder is load-bearing rail identity, never removed).
    expect(bodyHtml).toMatch(/<div id="leftTicks"><div class="hud__rail__tick/);
    expect(bodyHtml).toMatch(/<div id="rightTicks"><div class="hud__rail__tick/);
    // The left rail ALSO carries the manifest marker (ADR-031 U9: a single
    // detent diamond button), filled at parse time.
    expect(bodyHtml).toMatch(
      /data-rail-manifest-root[^>]*><button[^>]*class="rail-manifest__diamond"/
    );
  });
});

describe("v7-parse — production homepage station surgery (ADR-018, ADR-021)", () => {
  it("removes every CORRIDOR_REPLACED_STATIONS section/div from the body", () => {
    const { bodyHtml } = getV7Content({
      removeStations: CORRIDOR_REPLACED_STATIONS,
      relocateStationsToMount: CORRIDOR_RELOCATED_STATIONS,
      corridorMountId: CORRIDOR_MOUNT_ID,
    });

    for (const id of CORRIDOR_REPLACED_STATIONS) {
      const sectionRe = new RegExp(`<section\\b[^>]*\\bid="${id}"`);
      expect(sectionRe.test(bodyHtml), `section #${id} should be removed`).toBe(false);
      const divRe = new RegExp(`<div\\b[^>]*\\bid="${id}"`);
      expect(divRe.test(bodyHtml), `div #${id} should be removed`).toBe(false);
    }
  });

  it("inserts a single corridor mount placeholder where the first removed station used to live", () => {
    const { bodyHtml } = getV7Content({
      removeStations: CORRIDOR_REPLACED_STATIONS,
      relocateStationsToMount: CORRIDOR_RELOCATED_STATIONS,
      corridorMountId: CORRIDOR_MOUNT_ID,
    });

    const mountMatches = bodyHtml.match(
      /<div\s+id="home-corridor-mount"[^>]*data-home-corridor-mount[^>]*><\/div>/g
    );
    expect(mountMatches?.length).toBe(1);
  });

  it("strips matching #hudNav entries when their station is removed", () => {
    const { bodyHtml } = getV7Content({
      removeStations: CORRIDOR_REPLACED_STATIONS,
      corridorMountId: CORRIDOR_MOUNT_ID,
    });

    for (const id of CORRIDOR_REPLACED_STATIONS) {
      const navRe = new RegExp(`<a\\b[^>]*\\bhref="#${id}"`);
      expect(navRe.test(bodyHtml), `nav entry for #${id} should be stripped`).toBe(false);
    }

    // Surviving nav entries must still be reachable. (#contact was
    // asserted here historically, but the prototype no longer carries a
    // contact anchor — stale since the markup nav retired in favour of
    // the React HudNav; found 2026-07-11 while adding #tools.)
    expect(bodyHtml).toMatch(/<a\s[^>]*href="#hero"/);
    expect(bodyHtml).toMatch(/<a\s[^>]*href="#services"/);
    expect(bodyHtml).toMatch(/<a\s[^>]*href="#continuum"/);
  });

  it("redirects leftover cross-links to the corridor mount instead of dead anchors", () => {
    const { bodyHtml } = getV7Content({
      removeStations: CORRIDOR_REPLACED_STATIONS,
      corridorMountId: CORRIDOR_MOUNT_ID,
    });

    for (const id of CORRIDOR_REPLACED_STATIONS) {
      const re = new RegExp(`href="#${id}"`);
      expect(re.test(bodyHtml), `no leftover href="#${id}"`).toBe(false);
    }
  });

  it("drops the now-empty .build-quote-runway wrapper after #buildQuote is stripped", () => {
    const { bodyHtml } = getV7Content({
      removeStations: CORRIDOR_REPLACED_STATIONS,
      corridorMountId: CORRIDOR_MOUNT_ID,
    });
    expect(bodyHtml).not.toMatch(/<div\s+class="build-quote-runway"\s*>\s*<\/div>/);
  });

  it("relocates #services then #about after the mount and drops the trailing connector slot", () => {
    const { bodyHtml } = getV7Content({
      removeStations: CORRIDOR_REPLACED_STATIONS,
      relocateStationsToMount: CORRIDOR_RELOCATED_STATIONS,
      corridorMountId: CORRIDOR_MOUNT_ID,
    });

    const mountIdx = bodyHtml.indexOf('id="home-corridor-mount"');
    const servicesIdx = bodyHtml.search(/<section\b[^>]*\bid="services"/);
    const aboutIdx = bodyHtml.search(/<section\b[^>]*\bid="about"/);
    const continuumIdx = bodyHtml.search(/<section\b[^>]*\bid="continuum"/);

    expect(mountIdx).toBeGreaterThan(0);
    expect(servicesIdx).toBeGreaterThan(mountIdx);
    // #about (the bio) directly follows services — the ADR-033 funnel;
    // continuum (the philosophy beat) comes after.
    expect(aboutIdx).toBeGreaterThan(servicesIdx);
    expect(continuumIdx).toBeGreaterThan(aboutIdx);

    // Both retired case surfaces are gone, portal slots included.
    // (Element-form assertions: the authored prototype's explanatory
    // comments legitimately mention the slot names in prose.)
    expect(bodyHtml).not.toMatch(/<section\b[^>]*\bid="tools"/);
    expect(bodyHtml).not.toMatch(/<section\b[^>]*\bid="build"/);
    expect(bodyHtml).not.toMatch(/<div\b[^>]*\bdata-tools-cards-root/);
    expect(bodyHtml).not.toMatch(/<div\b[^>]*\bdata-build-cases-root/);
    // The right-rail register slot survives (it hosts the services
    // SOURCE BUS register; legacy attr name kept — ADR-033).
    expect(bodyHtml).toContain("data-tools-rail-root");

    // The orphaned connector slot must NOT appear right after #services.
    const between = bodyHtml.slice(servicesIdx);
    const trailingConnector =
      /<\/section>\s*(?:<!--[\s\S]*?-->\s*)*<div\s+data-celestial-slot="practice-to-about"\s*>\s*<\/div>/;
    expect(trailingConnector.test(between)).toBe(false);
  });

  it("preserves the surviving stations in the ADR-033 funnel order", () => {
    const { bodyHtml } = getV7Content({
      removeStations: CORRIDOR_REPLACED_STATIONS,
      relocateStationsToMount: CORRIDOR_RELOCATED_STATIONS,
      corridorMountId: CORRIDOR_MOUNT_ID,
    });

    const order = ["hero", "services", "about", "continuum", "practice", "contact"];
    let cursor = 0;
    for (const id of order) {
      const idx = bodyHtml.indexOf(`id="${id}"`, cursor);
      expect(idx, `expected #${id} after position ${cursor}`).toBeGreaterThan(-1);
      cursor = idx;
    }
  });
});

describe("v7-parse — sliceV7Sections", () => {
  it("returns the HUD chrome plus only the requested sections, in source order", () => {
    const slice = sliceV7Sections(["definition", "missing-layer", "intelligence-layer"]);

    expect(slice.bodyClass).toContain("theme-instrument");
    expect(slice.hudHtml).toContain('class="hud"');
    expect(slice.hudHtml).not.toContain('<main class="stations">');

    expect(slice.sections.map((s) => s.id)).toEqual([
      "definition",
      "missing-layer",
      "intelligence-layer",
    ]);

    // Each captured block must carry both the opening tag and the closing tag.
    for (const s of slice.sections) {
      expect(s.html.startsWith("<section")).toBe(true);
      expect(s.html.endsWith("</section>")).toBe(true);
    }

    expect(slice.sectionsHtml).toBe(slice.sections.map((s) => s.html).join("\n"));
  });

  it("ignores requested ids that do not exist in the prototype", () => {
    const slice = sliceV7Sections(["definition", "does-not-exist"]);
    expect(slice.sections.map((s) => s.id)).toEqual(["definition"]);
  });
});

describe("v7-parse — extractV7Text", () => {
  it("returns the corridor copy slots used by HomeCorridor / CopyAnchors", () => {
    const text = extractV7Text();

    expect(text.thoughtform.bridge.length).toBeGreaterThan(0);
    expect(text.thoughtform.titleHtml.length).toBeGreaterThan(0);
    expect(text.thoughtform.body1Html.length).toBeGreaterThan(0);
    expect(text.thoughtform.body2Html.length).toBeGreaterThan(0);
    expect(text.thoughtform.body3Html.length).toBeGreaterThan(0);
    expect(text.thoughtform.phaseLabels).toEqual({
      navigate: "Navigate",
      encode: "Encode",
      build: "Build",
    });

    expect(text.diagnostic.titleHtml.length).toBeGreaterThan(0);
    expect(text.diagnostic.labels).toHaveLength(4);
    expect(text.diagnostic.labels.map((l) => l.id)).toEqual(["01", "02", "03", "04"]);
    for (const label of text.diagnostic.labels) {
      expect(label.tag.length).toBeGreaterThan(0);
    }

    expect(text.intelligence.titleHtml.length).toBeGreaterThan(0);
    expect(text.intelligence.ledeHtml.length).toBeGreaterThan(0);
    expect(text.intelligence.leftLabel.length).toBeGreaterThan(0);
    expect(text.intelligence.rightLabel.length).toBeGreaterThan(0);
  });
});
