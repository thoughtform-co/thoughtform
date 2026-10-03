import { describe, expect, it } from "vitest";

import { WORKSHOP_JOURNEY_ORDER } from "@/app/(marketing)/arcs/thoughtform/workshop-v1/journey";
import { THOUGHTFORM_WORKSHOP_ARC } from "@/lib/arcs/content/thoughtform-workshop";
import { PORTRAIT_BACK_SRC } from "@/lib/services-ring/portraitBake";
import { getThoughtformWorkshopContent } from "@/lib/v7-parse";

/**
 * /arcs/thoughtform/workshop-v1 (ADR-137) — drift guard for the third fork of
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
  it("orders hero → about → the eras → corridor → proof → workshop → contact (ADR-138)", () => {
    const body = parsed();
    expect(stationOrder(body)).toEqual([
      "hero",
      "about",
      "voidwalker",
      "services",
      "workshop",
      "contact",
    ]);
    expect(body.match(/id="home-corridor-mount"/g) ?? []).toHaveLength(1);
    const at = (needle: string) => body.indexOf(needle);
    expect(at('id="about"')).toBeLessThan(at('id="voidwalker"'));
    // The era stage sits DIRECTLY above the mount: the route welds the mount
    // up under it, and the seam-gap rule names it as the pre-mount station.
    expect(at('id="voidwalker"')).toBeLessThan(at('id="home-corridor-mount"'));
    expect(at('id="home-corridor-mount"')).toBeLessThan(at('id="services"'));
  });

  it("carries the homepage's era shell, one root, and nothing inside it (ADR-138)", () => {
    const body = parsed();
    const era = body.slice(
      body.indexOf('id="voidwalker"'),
      body.indexOf('id="home-corridor-mount"')
    );
    expect(body.match(/data-voidwalker-root/g) ?? []).toHaveLength(1);
    // The portal mounts into an EMPTY root; markup inside it would be torn out
    // by the nested createRoot's first render.
    expect(era).toMatch(/<div class="vw-root" data-voidwalker-root><\/div>/);
    expect(era).toMatch(/data-station="voidwalker"/);
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

  it("wraps #about's content in its stage, with the leaves' one layer (ADR-137 U2, ADR-138)", () => {
    const body = parsed();
    const about = body.slice(body.indexOf('id="about"'), body.indexOf('id="voidwalker"'));
    expect(about.match(/data-tw-about-stage/g) ?? []).toHaveLength(1);
    expect(about.match(/data-tw-flow-layer/g) ?? []).toHaveLength(1);
    // The About → Arc turn's layers are retired with it (ADR-138).
    expect(body).not.toMatch(/data-tw-turn-|data-tw-part=/);
    // The stage holds the bio grid, and the station keeps no second stage.
    const stageAt = about.indexOf("data-tw-about-stage");
    expect(stageAt).toBeGreaterThan(-1);
    expect(about.indexOf('class="voidwalker"')).toBeGreaterThan(stageAt);
    // The writer reads these by class; a rename breaks the flow silently.
    for (const cls of [
      "voidwalker__name",
      "voidwalker__role",
      "voidwalker__bio",
      "voidwalker__meta",
      "voidwalker__links",
      "voidwalker__orbit",
      "voidwalker__orbit__portrait",
    ]) {
      expect(about).toContain(cls);
    }
  });

  it("the portrait is the deck's card, and the deck is its sibling (ADR-137 U4)", () => {
    const body = parsed();
    const about = body.slice(body.indexOf('id="about"'), body.indexOf('id="voidwalker"'));
    const portraitAt = about.indexOf('class="voidwalker__orbit__portrait"');
    const deckAt = about.indexOf('class="tw-deck"');
    expect(portraitAt).toBeGreaterThan(-1);
    // The card's first paint is the bake's own source crop, so the swap to
    // the bake changes the grade and nothing else.
    const portrait = about.slice(portraitAt, about.indexOf("</div>", portraitAt));
    expect(portrait).toContain(`src="${PORTRAIT_BACK_SRC}"`);
    // A SIBLING after the portrait, never inside it: the emerge clips the
    // portrait, and a clip flattens the 3D stack.
    expect(deckAt).toBeGreaterThan(about.indexOf("</div>", portraitAt));
    expect(about.match(/class="tw-deck"/g) ?? []).toHaveLength(1);
    expect(about.match(/class="tw-deck__slab"/g) ?? []).toHaveLength(3);
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
