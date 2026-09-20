import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { layoutViewportHeight } from "@/lib/viewport/layoutViewportHeight";

/**
 * The layout-viewport clock (ADR-113).
 *
 * On iOS Safari `window.innerHeight` follows the toolbar while every runway on
 * this site is authored in `svh`, so a scroll clock that divides one by the
 * other moves while the thumb is still. `layoutViewportHeight()` reads the
 * initial containing block instead. Chromium — every Playwright project here —
 * resolves the two to one number, so this file is the only in-repo proof of
 * WHICH viewport a writer reads: a unit test of the helper under a modelled
 * iPhone pair, and a source pin on its adopters.
 *
 * ⚠ The pin is by SOURCE, the way `services-ring-mobile-gate` pins the ring's
 * three readers to one media string: a writer that quietly goes back to
 * `window.innerHeight` fails here rather than on a phone nobody in CI has.
 */

const ROOT = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/** Every scroll writer that measures svh-authored geometry on the landing. */
const ADOPTERS = [
  "components/landing/home-v2/hooks/useServicesStageScroll.ts",
  "components/landing/v7/tools-cards/useStackedCardsScroll.ts",
  "components/landing/home-v2/hooks/useCorridorExitScroll.ts",
  "components/landing/home-v2/hooks/useDepthScroll.ts",
  "components/landing/home-v2/MobileEpilogueSignal.tsx",
  "components/landing/v7/HudNav.tsx",
  "lib/services-ring/beatScrollTarget.ts",
];

/** The one deliberate exception: `--hero-lift = scrollY / innerHeight` is
 *  paired with the hero's `100dvh` box (landing.css §hero, "DELIBERATELY NO
 *  100lvh FLOOR"), so lift = 1 ⇔ the hero has cleared on every device. */
const DELIBERATE = "components/landing/v7/hooks/useLandingScroll.ts";

describe("layoutViewportHeight", () => {
  const original = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(document.documentElement),
    "clientHeight"
  );
  const originalInner = window.innerHeight;

  afterEach(() => {
    // Restore the instance override, never the prototype.
    delete (document.documentElement as unknown as { clientHeight?: number }).clientHeight;
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: originalInner,
    });
    void original;
  });

  it("reads the initial containing block, not the dynamic viewport (the iPhone 14 pair)", () => {
    // The toolbar collapsed: innerHeight has grown to the large viewport
    // while the ICB — what 100svh resolves to — holds at the small one.
    Object.defineProperty(document.documentElement, "clientHeight", {
      configurable: true,
      value: 745,
    });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 844 });
    expect(layoutViewportHeight()).toBe(745);
  });

  it("falls back to innerHeight where the ICB reports nothing (jsdom, pre-layout)", () => {
    // jsdom lays nothing out: clientHeight is 0 here by default.
    expect(document.documentElement.clientHeight).toBe(0);
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 612 });
    expect(layoutViewportHeight()).toBe(612);
  });

  it("never returns 0 (a runway divided by it must stay finite)", () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 0 });
    expect(layoutViewportHeight()).toBe(1);
  });
});

describe("the writers read the layout viewport", () => {
  for (const p of ADOPTERS) {
    it(`${p} imports the helper and carries no bare innerHeight read`, () => {
      const src = stripComments(read(p));
      expect(src, `${p} does not import layoutViewportHeight`).toContain(
        'from "@/lib/viewport/layoutViewportHeight"'
      );
      expect(src, `${p} calls the helper nowhere`).toMatch(/layoutViewportHeight\(\)/);
      expect(src, `${p} reads window.innerHeight — the dynamic viewport`).not.toMatch(
        /window\.innerHeight/
      );
      // Nor the helper's own arithmetic spelled out by hand: one definition.
      expect(src).not.toMatch(/documentElement\.clientHeight\s*\|\|\s*window\.innerHeight/);
    });
  }

  it("keeps --hero-lift on the dynamic viewport, exactly once, and says why", () => {
    const src = read(DELIBERATE);
    const bare = stripComments(src).match(/window\.innerHeight/g) ?? [];
    expect(
      bare,
      "useLandingScroll's --hero-lift must divide by innerHeight (100dvh pair)"
    ).toHaveLength(1);
    expect(src).not.toContain('from "@/lib/viewport/layoutViewportHeight"');
  });

  it("is three-free and DOM-only", () => {
    const src = read("lib/viewport/layoutViewportHeight.ts");
    expect(src).not.toMatch(/from ["']three/);
    expect(src).not.toMatch(/from ["']react/);
    expect(stripComments(src)).not.toMatch(/^import /m);
  });
});
