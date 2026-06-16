import { test, expect, type Page } from "@playwright/test";

/**
 * Visual Regression Tests for Thoughtform Landing Page
 *
 * Production composition (ADR-018, ADR-021, ADR-022):
 *   hero → home-v2 corridor (Navigate / Encode / Build + epilogue) →
 *   services (zoom-dissipate seam) → continuum → practice → build →
 *   about → contact.
 *
 * The marketing route parses the v7 prototype HTML, strips the
 * legacy definition / missing-layer / intelligence-layer / approach /
 * buildQuote stations, and mounts `HomeCorridor` at
 * `#home-corridor-mount`. Scroll percentages below correspond to the
 * production layout, not the original v7 station positions.
 *
 * IMPORTANT: After any visual change, re-capture baselines:
 *   npm run test:visual:update
 */

async function scrollToPercentage(page: Page, percentage: number) {
  await page.evaluate((pct: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = (pct / 100) * scrollHeight;
    window.scrollTo({ top: targetScroll, behavior: "instant" });
  }, percentage);
  await page.waitForTimeout(500);
}

test.describe("Landing Page Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  });

  test("Hero section - 0% scroll", async ({ page }) => {
    await scrollToPercentage(page, 0);
    await expect(page).toHaveScreenshot("hero-0.png", { fullPage: false });
  });

  test("Corridor parked frame - 12% scroll (Thoughtform compass)", async ({ page }) => {
    await scrollToPercentage(page, 12);
    await expect(page).toHaveScreenshot("corridor-thoughtform-12.png", { fullPage: false });
  });

  test("Corridor Encode beat - 25% scroll", async ({ page }) => {
    await scrollToPercentage(page, 25);
    await expect(page).toHaveScreenshot("corridor-encode-25.png", { fullPage: false });
  });

  test("Corridor Build epilogue - 40% scroll", async ({ page }) => {
    await scrollToPercentage(page, 40);
    await expect(page).toHaveScreenshot("corridor-build-40.png", { fullPage: false });
  });

  test("Services / Continuum tail - 60% scroll", async ({ page }) => {
    await scrollToPercentage(page, 60);
    await expect(page).toHaveScreenshot("services-tail-60.png", { fullPage: false });
  });

  test("About / Build tail - 75% scroll", async ({ page }) => {
    await scrollToPercentage(page, 75);
    await expect(page).toHaveScreenshot("about-tail-75.png", { fullPage: false });
  });

  test("Contact section - 95% scroll", async ({ page }) => {
    await scrollToPercentage(page, 95);
    await expect(page).toHaveScreenshot("contact-95.png", { fullPage: false });
  });
});

test.describe("Component Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  });

  // HUD hamburger menu test removed — the .hud__nav was retired
  // per the Brand Codex hero contract; there is no top-right HUD
  // nav to regression-test any more.

  test("HUD corner brackets", async ({ page }) => {
    const corner = page.locator(".hud__corner--tl").first();
    if (await corner.isVisible()) {
      await expect(corner).toHaveScreenshot("hud-corner-tl.png");
    }
  });

  test("HUD brandmark anchor after scroll", async ({ page }) => {
    await scrollToPercentage(page, 40);
    const brandmark = page.locator(".hud__brandmark").first();
    if (await brandmark.isVisible()) {
      await expect(brandmark).toHaveScreenshot("hud-brandmark-bl.png");
    }
  });
});

test.describe("Hero Flash Prevention", () => {
  test("hero is not visible while the corridor is engaged (heroCover >= 1)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await scrollToPercentage(page, 15);
    await page.waitForTimeout(300);
    const hero = page.locator("#hero").first();
    const visibility = await hero.evaluate((el) => getComputedStyle(el).visibility);
    expect(visibility).toBe("hidden");
  });

  test("no hero bleed through the corridor mount during entry curtain", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await scrollToPercentage(page, 18);
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("hero-corridor-curtain-boundary.png", {
      fullPage: false,
    });
  });
});

test.describe("Post-corridor seams", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  });

  test("Corridor → Services dissipate (ADR-021)", async ({ page }) => {
    await scrollToPercentage(page, 50);
    await expect(page).toHaveScreenshot("seam-corridor-to-services.png", {
      fullPage: false,
    });
  });

  test("Services → Continuum brandmark fade", async ({ page }) => {
    await scrollToPercentage(page, 58);
    await expect(page).toHaveScreenshot("seam-services-to-continuum.png", {
      fullPage: false,
    });
  });

  test("Practice → About connector", async ({ page }) => {
    await scrollToPercentage(page, 72);
    await expect(page).toHaveScreenshot("seam-practice-to-about.png", {
      fullPage: false,
    });
  });
});
