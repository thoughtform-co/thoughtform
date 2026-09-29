import { describe, expect, it } from "vitest";

import { WORKSHOP_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform-workshop/journey";
import { THOUGHTFORM_WORKSHOP_ARC } from "@/lib/arcs/content/thoughtform-workshop";
import { getThoughtformWorkshopContent } from "@/lib/v7-parse";

/**
 * /arcs/thoughtform-workshop (ADR-137) — drift guard for the third fork of
 * the ADR-053 recipe, against its own prototype.
 *
 * Duplicated from the route's page.tsx (importing the server component would
 * drag Next's server context into vitest); if the route's options change,
 * this copy changes with them — that is what makes it a drift guard.
 */
const WORKSHOP_PARSE_OPTIONS = {
  removeStations: [
    "definition",
    "missing-layer",
    "intelligence-layer",
    "continuum",
    "practice",
    "buildQuote",
    "build",
  ],
  corridorMountId: "home-corridor-mount",
} as const;

const parsed = () => getThoughtformWorkshopContent(WORKSHOP_PARSE_OPTIONS).bodyHtml;

function stationOrder(bodyHtml: string): string[] {
  return Array.from(bodyHtml.matchAll(/<section[^>]*\sid="([^"]+)"/g)).map((m) => m[1]);
}

describe("thoughtform-workshop variant parse (ADR-137)", () => {
  it("orders hero → about → corridor → proof → workshop → contact", () => {
    const body = parsed();
    expect(stationOrder(body)).toEqual(["hero", "about", "services", "workshop", "contact"]);
    expect(body.match(/id="home-corridor-mount"/g) ?? []).toHaveLength(1);
    const at = (needle: string) => body.indexOf(needle);
    expect(at('id="about"')).toBeLessThan(at('id="home-corridor-mount"'));
    expect(at('id="home-corridor-mount"')).toBeLessThan(at('id="services"'));
  });

  it("declares each slot once, and #services mounts the proof, never the ring stage", () => {
    const body = parsed();
    expect(body.match(/data-tw-proof-root/g) ?? []).toHaveLength(1);
    expect(body.match(/data-tw-arc-root/g) ?? []).toHaveLength(1);
    // The ring's stage root would mount ServicesPortal's full instrument.
    expect(body).not.toContain("data-services-root");
  });

  it("carries exactly one kill edge, on #workshop", () => {
    const body = parsed();
    expect(body.match(/data-corridor-kill/g) ?? []).toHaveLength(1);
    expect(body).toMatch(/id="workshop"[^>]*data-corridor-kill/);
  });

  it("removes every corridor-replaced station", () => {
    const body = parsed();
    for (const id of WORKSHOP_PARSE_OPTIONS.removeStations) {
      expect(body).not.toContain(`id="${id}"`);
    }
  });

  it("NEVER ships the about-stage portal slot (ADR-053 invariant 1)", () => {
    expect(parsed()).not.toContain("data-about-root");
  });

  it("the journey order names every section the page shows, in page order", () => {
    const shown = stationOrder(parsed());
    const inOrder = WORKSHOP_JOURNEY_ORDER.filter((id) => shown.includes(id));
    expect(inOrder).toEqual(shown);
  });

  it("the arc opens on its hero-board, with a framable lit set", () => {
    const first = THOUGHTFORM_WORKSHOP_ARC.sections[0];
    expect(first?.kind).toBe("hero-board");
    if (first?.kind !== "hero-board") return;
    const sides = new Set(first.lit.map(([s]) => s));
    expect(sides.size).toBe(1);
    const idx = [...first.lit.map(([, i]) => i)].sort();
    expect(idx[idx.length - 1]! - idx[0]!).toBe(idx.length - 1);
  });
});
