import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  HERO_PLATE_DARK,
  HERO_PLATE_DARK_FALLBACK,
  HERO_PLATE_DARK_TYPE,
  HERO_PLATE_LIGHT,
  HERO_PLATE_LIGHT_TYPE,
  HERO_ROUTES,
  heroPreloadScript,
} from "@/lib/theme/heroPreload";

/**
 * ADR-058 Update 2 — the hero preload picks its plate by theme.
 *
 * This replaced a static `<link rel="preload">` on each page, which is a
 * downgrade in one specific way: a static link is verified by simply being
 * in the file, and an injected one is a STRING. Nothing type-checks a
 * string, and every failure mode here is silent — a stale href preloads a
 * file nobody paints, a missed route preloads nothing, a dropped `type`
 * makes non-AVIF browsers pay for both plates. So the string is pinned
 * against the constants and against the assets on disk.
 */

const ROOT = join(__dirname, "..", "..");
const exists = (publicPath: string) => {
  try {
    readFileSync(join(ROOT, "public", publicPath.replace(/^\//, "")));
    return true;
  } catch {
    return false;
  }
};

describe("hero preload", () => {
  const script = heroPreloadScript();

  it("ships every plate it can preload", () => {
    // The whole point of the injection is that exactly one of these is
    // fetched per visit — but both have to be on disk, and the dark
    // fallback is the one most likely to be deleted by a tidy-up.
    for (const plate of [HERO_PLATE_DARK, HERO_PLATE_DARK_FALLBACK, HERO_PLATE_LIGHT]) {
      expect(exists(plate), `missing from public/: ${plate}`).toBe(true);
    }
  });

  it("names both plates and both content types", () => {
    expect(script).toContain(HERO_PLATE_DARK);
    expect(script).toContain(HERO_PLATE_LIGHT);
    // Without `type`, a browser that cannot decode AVIF preloads it anyway
    // and then downloads the <picture> fallback too — the hero costs it
    // both plates.
    expect(script).toContain(HERO_PLATE_DARK_TYPE);
    expect(script).toContain(HERO_PLATE_LIGHT_TYPE);
  });

  it("covers exactly the routes that render a hero", () => {
    // `/arcs/portfolio` joined on ADR-075: it declares `hero.plate:
    // "gateway"`, so it paints these two files and drops its own static
    // preload (which could only ever name the dark one).
    expect([...HERO_ROUTES]).toEqual(["/", "/claude-workshop", "/arcs/portfolio"]);
    for (const route of HERO_ROUTES) expect(script).toContain(`"${route}"`);
  });

  it("keys off the attribute rather than re-deriving the theme", () => {
    // One theme decision per document. Re-reading localStorage here would
    // be a second place for the `?theme=` override to be missed.
    expect(script).toContain('getAttribute("data-theme")');
    expect(script).not.toContain("localStorage");
  });

  it("is mounted in the layout OUTSIDE the THEME_TOGGLE gate", () => {
    // Flipping THEME_TOGGLE off is ADR-058's rollback. It should fall back
    // to the dark plate — not silently drop the hero preload and cost LCP
    // on the only path that still exists.
    const layout = readFileSync(join(ROOT, "app", "layout.tsx"), "utf8");
    expect(layout).toContain("heroPreloadScript()");
    const gate = layout.indexOf("{THEME_TOGGLE && (");
    const call = layout.indexOf("heroPreloadScript()");
    const gateEnd = layout.indexOf(")}", gate);
    expect(call > gateEnd || gate < 0).toBe(true);
  });

  it("leaves no static hero preload behind on either route", () => {
    // A leftover static link would defeat the whole mechanism: the preload
    // scanner would fetch the dark plate before this script ever runs.
    for (const page of ["app/(marketing)/page.tsx", "app/(marketing)/claude-workshop/page.tsx"]) {
      const src = readFileSync(join(ROOT, page), "utf8");
      expect(src, page).not.toMatch(/rel="preload"[^>]*as="image"/);
    }
  });
});
