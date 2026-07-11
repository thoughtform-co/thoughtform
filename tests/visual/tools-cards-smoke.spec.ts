import { expect, test, type Page } from "@playwright/test";

/**
 * #tools section smoke (ADR-030 + Update 1, "the viewscreen changes
 * modes").
 *
 * Structural contracts only — no screenshot baselines (mirrors
 * services-ring-smoke.spec.ts). Covers:
 *   - #tools follows the services runway in NORMAL FLOW (the rejected
 *     -100svh cover is gone);
 *   - the transparent lead-in: while the exit band is live the station
 *     is transparent over the fixed canvas (dimmed receded mark behind),
 *     then the ::before backdrop fades it opaque BEFORE the ambient
 *     canvas dies (WebGL-fallback-guarded);
 *   - wheel semantics at the seam: wheel-down at the LAST card passes
 *     through to native scroll (the decommission is scroll content —
 *     the old HOLD is retired), and wheel-up mid-exit reverses natively;
 *   - the decommission pills: 4 verb chips dock at the right rail during
 *     the exit beat, gone on reverse scroll (pure function of the exit
 *     clock);
 *   - the console-plate card stack + mobile/PRM plain flow (unchanged).
 *
 * DOM/geometry assertions only — nothing here requires the WebGL
 * corridor to paint except the explicitly guarded lead-in test.
 */

test.describe.configure({ mode: "serial" });

function isDesktopViewport(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) >= 961;
}

/** Scroll so `#tools`'s top lands at `topVhFraction` of the viewport
 *  (negative = past the top). Rides the page's CSS smooth scroll (two-arg
 *  scrollTo — instant teleports skip the corridor engagement band), then
 *  POLLS until the position settles. */
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

/** Scroll the services runway to progress p (0..1) — the ring smoke's
 *  helper, duplicated for the decommission-beat probes. */
async function scrollServicesRunway(page: Page, progress: number): Promise<boolean> {
  const target = await page.evaluate((p) => {
    const runway = document.querySelector(".services-stage-root");
    if (!runway) return null;
    const rect = runway.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const travel = Math.max(0, rect.height - window.innerHeight);
    return Math.round(top + travel * p);
  }, progress);
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

test.describe("Tools section smoke (ADR-030 Update 1)", () => {
  test("desktop: #tools follows the runway in normal flow — no cover overlap", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "the seam choreography is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#tools [data-pc-slot]", { timeout: 15_000 });

    const layout = await page.evaluate(() => {
      const tools = document.querySelector("#tools")!;
      const services = document.querySelector("#services")!;
      const toolsRect = tools.getBoundingClientRect();
      const servicesRect = services.getBoundingClientRect();
      return {
        marginTop: getComputedStyle(tools).marginTop,
        seamGap: toolsRect.top - servicesRect.bottom,
      };
    });
    expect(layout.marginTop).toBe("0px");
    expect(Math.abs(layout.seamGap)).toBeLessThanOrEqual(2);
  });

  test("desktop: transparent lead-in over the ambient canvas, opaque before it dies", async ({
    page,
  }) => {
    test.skip(!isDesktopViewport(page), "the transparent lead-in is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#tools [data-pc-slot]", { timeout: 15_000 });

    // The ambient band needs the real corridor pipeline — skip on the
    // WebGL fallback so CI stays honest headless.
    const fallback = await page.evaluate(
      () => document.querySelector<HTMLElement>(".home-v2-stage")?.dataset.fallback === "true"
    );
    test.skip(fallback, "corridor WebGL fallback — no ambient band to probe");

    // Mid-lead-in: tools' top at 0.4vh — the station must be TRANSPARENT
    // with the ambient canvas alive behind it.
    expect(await scrollToolsTopTo(page, 0.4)).toBe(true);
    await page.waitForTimeout(600);
    const midLeadIn = await page.evaluate(() => {
      const tools = document.querySelector("#tools")!;
      const before = getComputedStyle(tools, "::before");
      return {
        ambient: document.documentElement.getAttribute("data-services-ambient"),
        exit: document.documentElement.getAttribute("data-corridor-exit"),
        background: getComputedStyle(tools).backgroundColor,
        beforeOpacity: parseFloat(before.opacity),
      };
    });
    expect(midLeadIn.ambient).toBe("true");
    expect(midLeadIn.exit).toBe("true");
    expect(midLeadIn.background).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|transparent/);
    expect(midLeadIn.beforeOpacity).toBeLessThan(1);

    // Deep in the lead-in (tools' top 0.9 viewports past the top): the
    // station is opaque again and the ambient band has released.
    expect(await scrollToolsTopTo(page, -0.9)).toBe(true);
    await page.waitForTimeout(600);
    const settled = await page.evaluate(() => ({
      ambient: document.documentElement.getAttribute("data-services-ambient"),
      background: getComputedStyle(document.querySelector("#tools")!).backgroundColor,
    }));
    expect(settled.ambient).toBeNull();
    // --void = #0a0908 (the .station ground; the darker #050403 is the
    // card bake's opaque-void, a different constant).
    expect(settled.background).toBe("rgb(10, 9, 8)");
  });

  test("desktop: wheel-down at the last card passes through; wheel-up mid-exit reverses", async ({
    page,
  }) => {
    test.skip(!isDesktopViewport(page), "the ring wheel is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#tools [data-pc-slot]", { timeout: 15_000 });

    // Park on the LAST card (beat 4 dwell, p ≈ 0.75) with the pointer
    // over the instrument. The retired HOLD would have swallowed this
    // wheel-down; the pass-through must scroll natively into the
    // decommission beat.
    expect(await scrollServicesRunway(page, 0.75)).toBe(true);
    await page.waitForTimeout(3000); // park + bakes + step clock settle
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(720, 300);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(700);
    const afterDown = await page.evaluate(() => window.scrollY);
    expect(afterDown).toBeGreaterThan(before);

    // Mid-exit (release-gate region): wheel-up reverses natively.
    expect(await scrollServicesRunway(page, 0.92)).toBe(true);
    await page.waitForTimeout(500);
    const midExit = await page.evaluate(() => window.scrollY);
    await page.mouse.move(720, 300);
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(700);
    const afterUp = await page.evaluate(() => window.scrollY);
    expect(afterUp).toBeLessThan(midExit);
  });

  test("desktop: decommission pills dock at the right rail, reverse-scroll retires them", async ({
    page,
  }) => {
    test.skip(!isDesktopViewport(page), "the pill layer is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#tools [data-pc-slot]", { timeout: 15_000 });

    // At the very end of the exit beat every pill window (last closes at
    // 0.96) has fully resolved — the cluster is DOCKED.
    expect(await scrollServicesRunway(page, 0.99)).toBe(true);
    await page.waitForTimeout(800);
    const pills = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>(".svc-exit-pill"));
      return nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          opacity: parseFloat(getComputedStyle(node).opacity),
          visible: getComputedStyle(node).visibility === "visible",
          xFrac: rect.left / window.innerWidth,
          text: node.textContent?.trim(),
        };
      });
    });
    expect(pills).toHaveLength(4);
    for (const pill of pills) {
      expect(pill.visible).toBe(true);
      expect(pill.opacity).toBeGreaterThan(0.5);
      // Docked in the right-rail band.
      expect(pill.xFrac).toBeGreaterThan(0.8);
    }
    expect(pills.map((p) => p.text)).toEqual(["ADVISORY", "EMBEDDED", "KEYNOTE", "WORKSHOP"]);

    // Reverse out of the exit beat — the pills retire (pure function of
    // the exit clock; reset-on-reverse by construction).
    expect(await scrollServicesRunway(page, 0.7)).toBe(true);
    await page.waitForTimeout(800);
    const retired = await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>(".svc-exit-pills");
      return root ? getComputedStyle(root).visibility : "absent";
    });
    expect(retired).toBe("hidden");
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
      return Math.round(window.scrollY + rect.top - 64);
    });
    await page.evaluate((y) => window.scrollTo(0, y), slot2Target);
    await page.waitForTimeout(900);

    const firstSlot = page.locator("#tools [data-pc-slot]").first();
    await expect(firstSlot).toHaveAttribute("data-pc-state", "covered");

    // Reverse scroll well above the stack — state resets by construction.
    expect(await scrollToolsTopTo(page, 0.9)).toBe(true);
    await page.waitForTimeout(900);
    await expect(firstSlot).not.toHaveAttribute("data-pc-state", "covered");
  });

  test("mobile/tablet: plain flow — no lead-in choreography, no pills, static slots", async ({
    page,
  }) => {
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
        pillCount: document.querySelectorAll(".svc-exit-pill").length,
      };
    });
    expect(layout.marginTop).toBe("0px");
    expect(layout.slotCount).toBe(4);
    expect(layout.slotPosition).toBe("static");
    expect(layout.pillCount).toBe(0);
  });

  test("reduced motion: no pills, plain flow on desktop", async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#tools", { timeout: 15_000 });

    const state = await page.evaluate(() => ({
      marginTop: getComputedStyle(document.querySelector("#tools")!).marginTop,
      pillCount: document.querySelectorAll(".svc-exit-pill").length,
      // PRM never blanks the eyebrow — the authored text must be intact.
      eyebrow: document.querySelector("#tools [data-tools-decode]")?.textContent?.trim(),
    }));
    expect(state.marginTop).toBe("0px");
    expect(state.pillCount).toBe(0);
    expect(state.eyebrow).toContain("Tools");
    await context.close();
  });
});
