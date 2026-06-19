import { expect, test, type Page } from "@playwright/test";

/**
 * Production homepage corridor smoke (ADR-018 / ADR-021 / ADR-022).
 *
 * No screenshot baselines: each test asserts a structural contract
 * the marketing route relies on, so a regression that breaks the
 * corridor wiring fails the suite without needing per-machine
 * baseline updates. Pairs with `landing-page.spec.ts` (which carries
 * the visual snapshots).
 */

async function scrollToPercentage(page: Page, percentage: number) {
  await page.evaluate((pct: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = (pct / 100) * scrollHeight;
    window.scrollTo({ top: targetScroll, behavior: "instant" });
  }, percentage);
  await page.waitForTimeout(400);
}

test.describe("Homepage corridor smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);
  });

  test("ADR-018: corridor mount placeholder exists and HomeCorridor renders into it", async ({
    page,
  }) => {
    const mount = page.locator("#home-corridor-mount");
    await expect(mount).toHaveCount(1);
    // The R3F sticky stage host mounts inside the placeholder.
    const stage = page.locator("#home-corridor-mount .home-v2-stage");
    await expect(stage).toHaveCount(1);
  });

  test("ADR-021: production stations are in the right relative order", async ({ page }) => {
    const order = await page.evaluate(() => {
      const ids = [
        "hero",
        "home-corridor-mount",
        "services",
        "continuum",
        "practice",
        "build",
        "about",
        "contact",
      ];
      return ids.map((id) => ({ id, top: document.getElementById(id)?.offsetTop ?? -1 }));
    });

    for (const node of order) {
      expect(node.top, `expected #${node.id} to be present`).toBeGreaterThanOrEqual(0);
    }
    for (let i = 1; i < order.length; i += 1) {
      expect(
        order[i].top,
        `expected #${order[i].id} to follow #${order[i - 1].id} in source order`
      ).toBeGreaterThan(order[i - 1].top);
    }
  });

  test("ADR-018 retired stations are no longer in the DOM", async ({ page }) => {
    const removed = ["definition", "missing-layer", "intelligence-layer", "approach", "buildQuote"];
    const present = await page.evaluate(
      (ids) => ids.map((id) => Boolean(document.getElementById(id))),
      removed
    );
    expect(present).toEqual(removed.map(() => false));
  });

  test("ADR-022: corridor entry flag clears once the stage releases sticky", async ({ page }) => {
    await scrollToPercentage(page, 0);
    const entryAtTop = await page.evaluate(() =>
      document.documentElement.getAttribute("data-corridor-entry")
    );
    expect(entryAtTop === "1" || entryAtTop === null).toBe(true);

    await scrollToPercentage(page, 30);
    const entryDuringFlythrough = await page.evaluate(() =>
      document.documentElement.getAttribute("data-corridor-entry")
    );
    // The fixed-hold curtain only engages over the entry band; deep
    // into the corridor the flag must be absent so the docked-exit
    // `position: fixed` canvas (ADR-021) does not collide with it.
    expect(entryDuringFlythrough).toBeNull();
  });

  test("ADR-018: corridor engagement attribute toggles around the stage", async ({ page }) => {
    await scrollToPercentage(page, 0);
    const engagedAtHero = await page.evaluate(() =>
      document.documentElement.getAttribute("data-corridor-engaged")
    );
    expect(engagedAtHero).not.toBe("true");

    await scrollToPercentage(page, 25);
    const engagedInCorridor = await page.evaluate(() =>
      document.documentElement.getAttribute("data-corridor-engaged")
    );
    expect(engagedInCorridor).toBe("true");
  });

  test("ADR-021: dock attribute releases on reverse scroll back into corridor", async ({
    page,
  }) => {
    // Drive forward into the seam so the dock can engage.
    await scrollToPercentage(page, 50);
    await scrollToPercentage(page, 55);
    // Then back into the middle of the corridor where the dock must
    // be released (BEST-PRACTICES.md cross-writer release guard).
    await scrollToPercentage(page, 25);
    const docked = await page.evaluate(() =>
      document.documentElement.getAttribute("data-corridor-docked")
    );
    expect(docked).not.toBe("true");
  });

  test("v7-parse: dead nav anchors for retired stations are absent", async ({ page }) => {
    const deadHrefs = await page.evaluate(() => {
      const removed = [
        "#definition",
        "#missing-layer",
        "#intelligence-layer",
        "#approach",
        "#buildQuote",
      ];
      const all = Array.from(document.querySelectorAll("a[href]"));
      return all.map((a) => a.getAttribute("href") ?? "").filter((href) => removed.includes(href));
    });
    expect(deadHrefs).toEqual([]);
  });

  test("ADR-021 amendment (2026-06-19): seam pixel field is NOT mounted", async ({ page }) => {
    // The seam pixel field was the visible mark inside #services on the
    // capable path. The 2026-06-19 amendment retires the in-#services
    // brandmark beats entirely (Services is now a content section with
    // terminal cards), so the canvas must NEVER mount on production.
    const seamCanvas = page.locator("#home-corridor-mount canvas.home-v2-seam-pixels");
    await expect(seamCanvas).toHaveCount(0);
    const seamLayer = page.locator(".home-v2-seam-pixels");
    await expect(seamLayer).toHaveCount(0);
  });

  test("ADR-021 amendment: retired in-#services brandmark attributes are NEVER set", async ({
    page,
  }) => {
    // After the 2026-06-19 amendment, none of these attributes should
    // appear at any scroll depth: `data-services-pixelate`,
    // `data-services-brandmark`, `data-services-ambient`. They are all
    // retired with the in-#services choreography. Sample across the
    // page to confirm the writes are gone everywhere.
    const samples = [10, 25, 55, 65, 75, 85];
    for (const pct of samples) {
      await scrollToPercentage(page, pct);
      const attrs = await page.evaluate(() => ({
        pixelate: document.documentElement.getAttribute("data-services-pixelate"),
        brandmark: document.documentElement.getAttribute("data-services-brandmark"),
        ambient: document.documentElement.getAttribute("data-services-ambient"),
      }));
      expect(attrs.pixelate).toBeNull();
      expect(attrs.brandmark).toBeNull();
      expect(attrs.ambient).toBeNull();
    }
  });
});
