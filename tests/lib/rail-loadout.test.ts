import { describe, expect, it } from "vitest";

import {
  chargeForActiveIdx,
  LOADOUT_RESOURCES,
  loadoutState,
  loadoutStatusWord,
} from "@/lib/rail-manifest/loadout";
import { injectStaticHudChildren } from "@/lib/v7-parse/hudTicks";
import { buildRailLoadoutHtml } from "@/lib/v7-parse/railLoadout";
import { buildStackGlyphSvg } from "@/lib/v7-parse/railManifest";

/**
 * Resource Loadout (ADR-031 follow-up) — the three-resource module bay
 * at the foot of the left rail: shared state math, parse-time skeleton,
 * and the injection twin of the manifest.
 */

describe("LOADOUT_RESOURCES data model", () => {
  it("is arc → services → tools in journey order, with ascending manifest indices", () => {
    expect(LOADOUT_RESOURCES.map((r) => r.entry.id)).toEqual(["arc", "services", "tools"]);
    const idxs = LOADOUT_RESOURCES.map((r) => r.manifestIdx);
    expect(idxs).toEqual([...idxs].sort((a, b) => a - b));
    expect(new Set(idxs).size).toBe(idxs.length);
    // Names come from the manifest entries (used as socket labels).
    expect(LOADOUT_RESOURCES.map((r) => r.name)).toEqual(["Arc", "Services", "Tools"]);
  });
});

describe("loadoutState — pure function of the active index", () => {
  it("is upcoming before, active at, seated after each resource index", () => {
    const [arc, services, tools] = LOADOUT_RESOURCES;
    // Hero/thesis (0,1): all upcoming.
    expect(loadoutState(arc.manifestIdx, 0)).toBe("upcoming");
    expect(loadoutState(services.manifestIdx, 1)).toBe("upcoming");
    // At arc: arc active, later resources upcoming.
    expect(loadoutState(arc.manifestIdx, arc.manifestIdx)).toBe("active");
    expect(loadoutState(services.manifestIdx, arc.manifestIdx)).toBe("upcoming");
    // At tools: earlier resources seated, tools active.
    expect(loadoutState(arc.manifestIdx, tools.manifestIdx)).toBe("seated");
    expect(loadoutState(services.manifestIdx, tools.manifestIdx)).toBe("seated");
    expect(loadoutState(tools.manifestIdx, tools.manifestIdx)).toBe("active");
  });
});

describe("chargeForActiveIdx — the fuel gauge value (0..3)", () => {
  it("climbs 0→1→2→3 across the resource band and stays full afterward", () => {
    const [arc, services, tools] = LOADOUT_RESOURCES;
    expect(chargeForActiveIdx(0)).toBe(0); // hero
    expect(chargeForActiveIdx(arc.manifestIdx - 1)).toBe(0); // thesis
    expect(chargeForActiveIdx(arc.manifestIdx)).toBe(1); // arc
    expect(chargeForActiveIdx(services.manifestIdx)).toBe(2); // services
    expect(chargeForActiveIdx(tools.manifestIdx)).toBe(3); // tools
    expect(chargeForActiveIdx(tools.manifestIdx + 1)).toBe(3); // continuum
    expect(chargeForActiveIdx(99)).toBe(3); // contact / past end
  });
});

describe("loadoutStatusWord — aria status", () => {
  it("maps state → status word", () => {
    expect(loadoutStatusWord("upcoming")).toBe("pending");
    expect(loadoutStatusWord("active")).toBe("active");
    expect(loadoutStatusWord("seated")).toBe("loaded");
  });
});

describe("buildStackGlyphSvg — shared glyph, byte-identical for the manifest prefix", () => {
  it("reproduces the original inline rail-manifest glyph markup exactly", () => {
    expect(buildStackGlyphSvg("rail-manifest")).toBe(
      '<svg class="rail-manifest__glyph" viewBox="0 0 14 14" aria-hidden="true">' +
        '<rect x="0.5" y="5.5" width="8" height="8"></rect>' +
        '<rect x="2.17" y="3.83" width="8" height="8"></rect>' +
        '<rect x="3.83" y="2.17" width="8" height="8"></rect>' +
        '<rect x="5.5" y="0.5" width="8" height="8" class="rail-manifest__glyph-front"></rect>' +
        "</svg>"
    );
  });
});

describe("buildRailLoadoutHtml — parse-time skeleton", () => {
  const html = buildRailLoadoutHtml();

  it("emits exactly three sockets and one charge gauge", () => {
    expect(html.match(/<button /g)).toHaveLength(3);
    // Trailing quote so the `rail-loadout__sockets` container doesn't count.
    expect(html.match(/rail-loadout__socket"/g)).toHaveLength(3);
    expect(html.match(/rail-loadout__gauge"/g)).toHaveLength(1);
    // Balanced markup.
    expect(html.match(/<button /g)).toHaveLength(html.match(/<\/button>/g)?.length ?? -1);
    expect(html.match(/<svg /g)).toHaveLength(html.match(/<\/svg>/g)?.length ?? -1);
  });

  it("carries the three resource ids + scroll targets, loadout-scoped glyphs", () => {
    for (const r of LOADOUT_RESOURCES) {
      expect(html).toContain(`data-entry-id="${r.entry.id}"`);
      expect(html).toContain(`data-target="#${r.entry.targetId}"`);
    }
    // The loadout uses its OWN glyph class, not the manifest's (independent styling).
    expect(html).toContain("rail-loadout__glyph");
    expect(html).not.toContain("rail-manifest__glyph");
  });

  it("first paint state: every socket upcoming (hero active, charge 0 via CSS default)", () => {
    expect(html.match(/data-state="upcoming"/g)).toHaveLength(3);
    expect(html).not.toContain('data-state="active"');
    expect(html).not.toContain('data-state="seated"');
    expect(html).toContain('aria-label="Arc — pending"');
  });
});

describe("injectStaticHudChildren — loadout shell", () => {
  it("fills the loadout nav shell when present", () => {
    const shell =
      '<aside><nav id="railLoadout" data-rail-loadout-root aria-label="Resource loadout"></nav></aside>';
    const out = injectStaticHudChildren(shell);
    expect(out).toContain("rail-loadout__socket");
    expect(out.match(/<button /g)).toHaveLength(3);
  });

  it("leaves workshop-style markup (tick shells, no loadout nav) untouched", () => {
    const workshop = '<div id="leftTicks"></div><div id="rightTicks"></div>';
    const out = injectStaticHudChildren(workshop);
    expect(out).toContain("hud__rail__tick");
    expect(out).not.toContain("rail-loadout__socket");
  });
});
