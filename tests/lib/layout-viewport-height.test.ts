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
  "lib/landing/scrollMemory.ts",
  "components/landing/home-v2/hooks/useServicesStageScroll.ts",
  "components/landing/v7/tools-cards/useStackedCardsScroll.ts",
  "components/landing/home-v2/hooks/useCorridorExitScroll.ts",
  "components/landing/home-v2/hooks/useDepthScroll.ts",
  "components/landing/home-v2/MobileEpilogueSignal.tsx",
  "components/landing/v7/HudNav.tsx",
  "lib/services-ring/beatScrollTarget.ts",
  // ADR-115: the phone's about band is a runway in svh, read by one writer.
  "components/landing/home-v2/about/useAboutBandScroll.ts",
  // ADR-123: the hero is 100svh and `--hero-lift` divides by the same small
  // viewport — the last deliberate `innerHeight` reader joined the adopters.
  "components/landing/v7/hooks/useLandingScroll.ts",
  // ADR-123: the era instrument's phone branch reads the frame it is on
  // screen against.
  "components/landing/home-v2/hooks/useVoidwalkerHologramScroll.ts",
  // ADR-125: the rail's click-to-navigate scrubs the corridor mount's
  // runway, which is stage − one layout screen.
  "lib/rail-manifest/clickToNavigate.ts",
];

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

  it("no deliberate exception remains: the hero is svh and the lift reads the same viewport (ADR-123)", () => {
    // The hero was the page's one in-flow `100dvh` box and `--hero-lift` its
    // one `innerHeight` reader. Both moved to the small viewport together.
    const hero = read("components/landing/v7/landing.css");
    const heroBlock =
      /\.hero \{[\s\S]*?\n\}/.exec(hero.replace(/\/\*[\s\S]*?\*\//g, ""))?.[0] ?? "";
    expect(heroBlock).toMatch(/height:\s*100svh/);
    expect(heroBlock).not.toMatch(/100dvh/);
  });

  it("is three-free and DOM-only", () => {
    const src = read("lib/viewport/layoutViewportHeight.ts");
    expect(src).not.toMatch(/from ["']three/);
    expect(src).not.toMatch(/from ["']react/);
    expect(stripComments(src)).not.toMatch(/^import /m);
  });
});
