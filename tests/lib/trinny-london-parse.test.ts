import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getTrinnyLondonContent } from "@/lib/v7-parse";

const ROOT = join(__dirname, "..", "..");

/**
 * /trinny-london pitch variant (ADR-093) — drift guard.
 *
 * The same shape as `tests/lib/claude-workshop-parse.test.ts`, against the
 * variant's own prototype. Both files exist because the two prototypes are
 * FORKS of one another (ADR-093): they are byte-identical today and will
 * diverge when this page takes its client copy, so each needs a guard that
 * fails on its own file rather than on the other's.
 */

// Duplicated from app/(marketing)/trinny-london/page.tsx (importing the
// server component would drag Next.js server context into vitest). If the
// route's options change, this copy must change with them — that is what
// makes the assertions below a drift guard rather than a restatement.
const TRINNY_PARSE_OPTIONS = {
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

const parsed = () => getTrinnyLondonContent(TRINNY_PARSE_OPTIONS).bodyHtml;

/** Ordered station ids as they appear in the parsed body. */
function stationOrder(bodyHtml: string): string[] {
  return Array.from(bodyHtml.matchAll(/<section[^>]*\sid="([^"]+)"/g)).map((m) => m[1]);
}

describe("trinny-london variant parse (ADR-093)", () => {
  it("injects exactly one corridor mount", () => {
    const matches = parsed().match(/id="home-corridor-mount"/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it("orders the journey hero → about → corridor → services → contact", () => {
    const body = parsed();
    const order = stationOrder(body);
    expect(order).toEqual(["hero", "about", "services", "contact"]);
    // The mount is a div, not a section — assert it lands between the bio
    // and services, which is the whole point of the variant.
    const at = (needle: string) => body.indexOf(needle);
    expect(at('id="about"')).toBeLessThan(at('id="home-corridor-mount"'));
    expect(at('id="home-corridor-mount"')).toBeLessThan(at('id="services"'));
  });

  it("removes every corridor-replaced station", () => {
    const body = parsed();
    for (const id of TRINNY_PARSE_OPTIONS.removeStations) {
      expect(body).not.toContain(`id="${id}"`);
    }
  });

  it("NEVER ships the about-stage portal slot", () => {
    // ADR-053 invariant 1, inherited whole. With #about above #services the
    // ADR-047 deck-flip clock clamps to 1, which decommissions the services
    // card ring on arrival (ghost cards, no orbits) and pulls a -100svh
    // margin under the hero. The static voidwalker is the about surface here.
    expect(parsed()).not.toContain("data-about-root");
  });

  it("keeps the services stage root so the casefile and the ring mount", () => {
    expect(parsed()).toContain("data-services-root");
  });

  it("ships the wordmark and drops the legacy HUD chrome", () => {
    const body = parsed();
    expect(body).toContain('class="hud__brand"');
    // The React HudNav overlay owns the top-right nav; the prototype's
    // static copy would render a second hamburger.
    expect(body).not.toContain('id="hudNav"');
    // ADR-043: the wordmark occupies the bottom-left corner.
    expect(body).not.toContain('<div class="hud__corner hud__corner--bl">');
  });

  it("keeps both tick ladders injected", () => {
    const body = parsed();
    expect(body).toContain("hud__rail__tick");
    expect(body).not.toContain('<div id="leftTicks"></div>');
    expect(body).not.toContain('<div id="rightTicks"></div>');
  });

  it("leaves no orphan celestial slot at the services seam", () => {
    expect(parsed()).not.toContain("data-celestial-slot");
  });

  it("keeps the hero elements the terminal boot requires", () => {
    const body = parsed();
    for (const cls of ["hero__headline", "hero__desc", "hero__cta", "hero__bg"]) {
      expect(body).toContain(cls);
    }
  });

  it("leaves no link pointing at a removed station, and the hero CTA enters the corridor", () => {
    const body = parsed();
    for (const id of TRINNY_PARSE_OPTIONS.removeStations) {
      expect(body).not.toContain(`href="#${id}"`);
    }
    // `removeHudNavEntries` DELETES any <a> whose href targets a removed
    // station — it runs before the redirect pass, so an authored link to a
    // removed station vanishes rather than being retargeted. The hero's
    // primary CTA therefore points at the mount id directly.
    expect(body).toContain('href="#home-corridor-mount"');
    expect(body).toMatch(/hero__cta__btn--primary"\s+href="#home-corridor-mount"/);
  });

  it("reads its OWN prototype file — the fork is a file, not an alias", () => {
    /* ⚠ THE TWO PROTOTYPES ARE BYTE-IDENTICAL AT THE FORK, so every
       assertion above passes against either file and none of them would
       notice `getTrinnyLondonContent` pointing at the workshop's HTML.
       Only the path can be checked, and it is checked on DISK because
       that is also what Vercel's file tracer needs to find (ADR-093). */
    expect(existsSync(join(ROOT, "public/prototypes/v7/landing-trinny-london.html"))).toBe(true);
    const src = readFileSync(join(ROOT, "lib/v7-parse/index.ts"), "utf8");
    expect(src).toContain('"public/prototypes/v7/landing-trinny-london.html"');
  });
});
