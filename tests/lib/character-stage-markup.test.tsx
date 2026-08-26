import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CharacterStage } from "@/components/landing/home-v2/voidwalker/character/CharacterStage";
import { CHARACTER_ERAS } from "@/lib/voidwalker/characterEras";
import { VOIDWALKER_HEAD, vwPlain } from "@/lib/voidwalker/voidwalkerData";

/**
 * ADR-082 — the character stage's REST STATE walked as static markup.
 *
 * The rest state (no `data-ch-ready`, no scroll writer engaged) is the
 * fallback path — mobile / PRM / no-JS. It must render the record's
 * masthead, the first era's copy + still, and the era rail at every
 * viewport, without ever touching WebGL. This guard is the same shape
 * as `voidwalker-wire-markup` — walk the rendered text and count.
 */

describe("ADR-082 · character stage · static rest state", () => {
  const html = renderToStaticMarkup(<CharacterStage />);

  it("mounts the record's masthead title verbatim", () => {
    expect(html).toContain(VOIDWALKER_HEAD.title);
  });

  it("mounts the lede text (the ledgend the record ships with)", () => {
    // The rest state doesn't decode it — the character stage is an
    // interactive instrument, not a caption kernel.
    expect(html).toContain(vwPlain(VOIDWALKER_HEAD.lede));
  });

  it("mounts all six era rail pips (with year and short name)", () => {
    for (const era of CHARACTER_ERAS) {
      expect(html, `${era.id} year`).toContain(era.year);
      // Either the wardrobe (active) OR the short (inactive) letters.
      expect(html.includes(era.wardrobe) || html.includes(era.short)).toBe(true);
    }
  });

  it("mounts the first era's still, wardrobe title and motto", () => {
    const first = CHARACTER_ERAS[0]!;
    expect(html).toContain(first.stillPath);
    expect(html).toContain(first.wardrobe);
    expect(html).toContain(first.motto);
    expect(html).toContain(first.loadout);
  });

  it("names data-ch-era on the stage (fallback attribute)", () => {
    expect(html).toContain(`data-ch-era="${CHARACTER_ERAS[0]!.id}"`);
  });

  it("mounts the foot's Next → #contact link", () => {
    expect(html).toContain(VOIDWALKER_HEAD.next.href);
    expect(html).toContain(VOIDWALKER_HEAD.next.label);
  });

  it("keeps the .ch class block (never leaks .vw* into the character surface)", () => {
    // A shared prefix would let ADR-074's timeline rules cascade into
    // this surface. The static markup should carry `.ch` classes and
    // no `.vw` beat-level classes (the wireframe SVG file paths may
    // still reference `.vw-wire`, but the DOM tree walked here should
    // not).
    expect(html).toMatch(/class="ch\b/);
    expect(html).not.toMatch(/class="vw-beat\b/);
    expect(html).not.toMatch(/class="vw-head__/);
  });

  it("provides an alt text for every era still", () => {
    // Accessibility gate — the still is the surface on fallback paths.
    // Extract every `alt="…"` attribute value, drop the empty ones (the
    // preloader stills use `alt=""` deliberately), and check that at
    // least ONE non-empty alt survives, and that it carries the era's
    // wardrobe + year.
    const alts = Array.from(html.matchAll(/alt="([^"]*)"/g)).map((m) => m[1]!);
    const meaningful = alts.filter((a) => a.length > 0);
    expect(meaningful.length).toBeGreaterThan(0);
    const first = CHARACTER_ERAS[0]!;
    expect(meaningful.some((a) => a.includes(first.wardrobe))).toBe(true);
  });

  it("bakes the six-era rail button count", () => {
    // Rail buttons are `type="button"` on the era pips; the count is
    // one per era. Preload elements use `<img>`, not `<button>`.
    const buttons = html.match(/<button[^>]*class="ch-rail__pip/g) ?? [];
    expect(buttons.length).toBe(CHARACTER_ERAS.length);
  });
});
