import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  HERO_PHONE_MEDIA,
  HERO_PLATE_DARK_FALLBACK,
  HERO_PLATE_DARK_MOTION,
} from "@/lib/theme/heroPreload";

/**
 * ADR-158 — the dark plate in motion.
 *
 * `HeroPlateMotion` finds the still by its `src` and lays the loop over it, so
 * every link in that chain is a string nothing type-checks: the file on disk,
 * the `src` the three heroes print, the CSS that hides the loop wherever the
 * still under it is not the picture, and the mounts. Each failure is silent —
 * the site just stays still — so each is pinned here.
 */

const ROOT = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

describe("hero plate motion", () => {
  it("ships every loop it can play, at web weight", () => {
    for (const { src, type } of HERO_PLATE_DARK_MOTION) {
      const bytes = statSync(join(ROOT, "public", src.replace(/^\//, ""))).size;
      // Native 2912×1632 (no resolution given up), and still a web file.
      expect(bytes, src).toBeLessThan(4_000_000);
      expect(type, src).toMatch(/^video\/mp4; codecs="/);
    }
  });

  it("matches the still every house hero paints", () => {
    // The landing family is parse-injected from these prototypes; the arc and
    // sessions heroes print the constant. A renamed fallback here would leave
    // the landing still while the arcs move.
    for (const proto of [
      "public/prototypes/v7/landing-v7-motion.html",
      "public/prototypes/v7/landing-trinny-london.html",
      "public/prototypes/v7/landing-thoughtform-workshop.html",
      "public/prototypes/v7/landing-claude-workshop.html",
    ]) {
      expect(read(proto), proto).toContain(`<img src="${HERO_PLATE_DARK_FALLBACK}"`);
    }
    for (const hero of ["components/arcs/ArcHero.tsx", "components/sessions/SessionsHero.tsx"]) {
      expect(read(hero), hero).toContain("src={HERO_PLATE_DARK_FALLBACK}");
    }
    expect(read("components/landing/v7/HeroPlateMotion.tsx")).toContain(
      'picture img[src="${HERO_PLATE_DARK_FALLBACK}"]'
    );
  });

  it("is hidden in light, on the phone rung and under reduced motion", () => {
    const css = read("components/landing/v7/landing.css");
    expect(css).toMatch(/html\[data-theme="light"\] \.hero__bg \.hero__motion \{\s*display: none;/);
    const block = (media: string) =>
      new RegExp(`@media ${media.replace(/[()]/g, "\\$&")} \\{\\s*\\.hero__bg \\.hero__motion \\{\\s*display: none;`);
    expect(css).toMatch(block(HERO_PHONE_MEDIA));
    expect(css).toMatch(block("(prefers-reduced-motion: reduce)"));
  });

  it("is mounted by every shell that paints the house hero", () => {
    for (const shell of [
      "components/landing/v7/LandingPage.tsx",
      "components/arcs/ArcShell.tsx",
      "components/sessions/SessionsShell.tsx",
    ]) {
      expect(read(shell), shell).toContain("<HeroPlateMotion containerRef={rootRef} />");
    }
  });
});
