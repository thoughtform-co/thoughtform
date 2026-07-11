import { expect, test, type Page } from "@playwright/test";

/**
 * #tools section smoke (ADR-030).
 *
 * Structural contracts only — no screenshot baselines (mirrors
 * services-ring-smoke.spec.ts). Covers:
 *   - the Tools station rides between #services and #continuum and
 *     scrolls parallax OVER the still-pinned services stage (the
 *     sticky-overlap cover: -100svh margin against the runway's
 *     exit-hold beat);
 *   - the cover completes exactly where the services stage would unpin;
 *   - the wheel HOLD over the instrument releases once the cover is on
 *     screen (native scroll in both directions mid-cover);
 *   - the console-plate card stack mounts via the portal: 4 sticky
 *     slots, enter/cover state flips, reverse-scroll reset;
 *   - mobile + reduced-motion keep plain document flow (no overlap, no
 *     sticky mechanics).
 *
 * All assertions are DOM/geometry — nothing here depends on the WebGL
 * corridor painting, so the suite is robust headless.
 */

test.describe.configure({ mode: "serial" });

function isDesktopViewport(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) >= 961;
}

/** Scroll so `#tools`'s top lands at `topVhFraction` of the viewport.
 *  Rides the page's CSS smooth scroll (two-arg scrollTo — see the
 *  services-ring smoke helper for why instant teleports are banned),
 *  then POLLS until the scroll position settles: the runway sits several
 *  thousand px deep and Chrome's smooth scroll outlives a fixed wait. */
async function scrollToolsTopTo(page: Page, topVhFraction: number): Promise<boolean> {
  const target = await page.evaluate((f) => {
    const tools = document.querySelector("#tools");
    if (!tools) return null;
    const rect = tools.getBoundingClientRect();
    return Math.round(window.scrollY + rect.top - window.innerHeight * f);
  }, topVhFraction);
  if (target == null) return false;
  await page.evaluate((y) => window.scrollTo(0, y), target);
  let last = -1;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(200);
    const y = await page.evaluate(() => window.scrollY);
    if (y === last) break;
    last = y;
  }
  return true;
}

test.describe("Tools section smoke (ADR-030)", () => {
  test("desktop: the Tools cover sweeps over the still-pinned services stage", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "the cover overlap is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    // The mounted stack gives the station its real ~6-viewport height —
    // scroll targets computed before hydration would land short.
    await page.waitForSelector("#tools [data-pc-slot]", { timeout: 15_000 });

    // Mid-cover: tools' top at 0.5vh — the services stage must STILL be
    // pinned (top ≈ 0) while the opaque tools station is on screen: that
    // simultaneity IS the parallax cover.
    expect(await scrollToolsTopTo(page, 0.5)).toBe(true);
    const midCover = await page.evaluate(() => {
      const stage = document.querySelector(".services-stage")!.getBoundingClientRect();
      const tools = document.querySelector("#tools")!.getBoundingClientRect();
      const runway = document.querySelector(".services-stage-root")!.getBoundingClientRect();
      return {
        stageTop: stage.top,
        toolsTopVh: tools.top / window.innerHeight,
        runwayBottomVh: runway.bottom / window.innerHeight,
      };
    });
    expect(Math.abs(midCover.stageTop)).toBeLessThanOrEqual(2);
    expect(midCover.toolsTopVh).toBeGreaterThan(0.3);
    expect(midCover.toolsTopVh).toBeLessThan(0.7);

    // The tools station paints ABOVE the services station's content.
    const zIndex = await page.evaluate(() =>
      Number(getComputedStyle(document.querySelector("#tools")!).zIndex)
    );
    expect(zIndex).toBeGreaterThanOrEqual(8);

    // Cover-complete geometry: when tools' top reaches the viewport top,
    // the services runway's bottom is at the viewport bottom (±2px) —
    // the stage unpins exactly as it finishes being covered.
    expect(await scrollToolsTopTo(page, 0)).toBe(true);
    const closed = await page.evaluate(() => {
      const tools = document.querySelector("#tools")!.getBoundingClientRect();
      const runway = document.querySelector(".services-stage-root")!.getBoundingClientRect();
      return { toolsTop: tools.top, runwayBottomGap: runway.bottom - window.innerHeight };
    });
    // The smooth scroll may settle within a pixel or two.
    expect(Math.abs(closed.runwayBottomGap - closed.toolsTop)).toBeLessThanOrEqual(2);
  });

  test("desktop: the instrument wheel hold releases while the cover is on screen", async ({
    page,
  }) => {
    test.skip(!isDesktopViewport(page), "the ring wheel is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#tools [data-pc-slot]", { timeout: 15_000 });

    expect(await scrollToolsTopTo(page, 0.5)).toBe(true);
    await page.waitForTimeout(600);

    // Pointer OVER the instrument band mid-cover: wheel-down must scroll
    // natively (ride the cover up) instead of being consumed by the
    // last-card HOLD — the ADR-030 release gate.
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(720, 300);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(600);
    const afterDown = await page.evaluate(() => window.scrollY);
    expect(afterDown).toBeGreaterThan(before);

    // And wheel-up mid-cover slides the cover back off natively.
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(600);
    const afterUp = await page.evaluate(() => window.scrollY);
    expect(afterUp).toBeLessThan(afterDown);
  });

  test("desktop: the console card stack pins, covers, and resets on reverse scroll", async ({
    page,
  }) => {
    test.skip(!isDesktopViewport(page), "the sticky stack is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#tools .pcl-stack", { timeout: 15_000 });

    // Portal mounted the console skin: 4 slots, each a console plate.
    await expect(page.locator("#tools [data-pc-slot]")).toHaveCount(4);
    await expect(page.locator("#tools .pcl-v2__plate").first()).toHaveText("TF·MÍMIR");

    // Scroll until card 2 covers card 1.
    const slot2Target = await page.evaluate(() => {
      const slot = document.querySelectorAll("#tools [data-pc-slot]")[1]!;
      const rect = slot.getBoundingClientRect();
      // Put slot 2 at its pin position (top cascade ≈ 64px) — card 1 is
      // then fully covered.
      return Math.round(window.scrollY + rect.top - 64);
    });
    await page.evaluate((y) => window.scrollTo(0, y), slot2Target);
    await page.waitForTimeout(900);

    const firstSlot = page.locator("#tools [data-pc-slot]").first();
    await expect(firstSlot).toHaveAttribute("data-pc-state", "covered");

    // Reverse scroll well above the stack — state resets by construction
    // (pure function of live rects).
    expect(await scrollToolsTopTo(page, 0.9)).toBe(true);
    await page.waitForTimeout(900);
    await expect(firstSlot).not.toHaveAttribute("data-pc-state", "covered");
  });

  test("mobile/tablet: plain flow — no cover overlap, no sticky mechanics", async ({ page }) => {
    test.skip(isDesktopViewport(page), "static-flow path is <961px");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    // Wait for the PORTAL-mounted stack, not just the parsed shell —
    // hydration + the nested root land a beat after #tools exists.
    await page.waitForSelector("#tools [data-pc-slot]", { timeout: 15_000 });

    const layout = await page.evaluate(() => {
      const tools = document.querySelector("#tools")!;
      const slot = document.querySelector("#tools [data-pc-slot]");
      return {
        marginTop: getComputedStyle(tools).marginTop,
        slotPosition: slot ? getComputedStyle(slot).position : null,
        slotCount: document.querySelectorAll("#tools [data-pc-slot]").length,
      };
    });
    expect(layout.marginTop).toBe("0px");
    expect(layout.slotCount).toBe(4);
    expect(layout.slotPosition).toBe("static");
  });

  test("reduced motion: no cover overlap on desktop either", async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#tools", { timeout: 15_000 });

    const marginTop = await page.evaluate(
      () => getComputedStyle(document.querySelector("#tools")!).marginTop
    );
    expect(marginTop).toBe("0px");
    await context.close();
  });
});
