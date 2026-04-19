import { test, expect } from "@playwright/test";

/**
 * Visual Regression Tests for Thoughtform Landing Page (V7)
 *
 * The homepage is the V7 scroll-driven prototype with 8 stations.
 * Section boundaries are controlled by the V7Runtime scroll handler;
 * no NavigationCockpitV2 scroll thresholds apply.
 *
 * IMPORTANT: After the V7 promotion, all snapshot baselines need
 * re-capturing:  npm run test:visual:update
 */

async function scrollToPercentage(page: any, percentage: number) {
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

  test("Definition section - 15% scroll", async ({ page }) => {
    await scrollToPercentage(page, 15);
    await expect(page).toHaveScreenshot("definition-15.png", { fullPage: false });
  });

  test("Continuum section - 30% scroll", async ({ page }) => {
    await scrollToPercentage(page, 30);
    await expect(page).toHaveScreenshot("continuum-30.png", { fullPage: false });
  });

  test("Practice section - 45% scroll", async ({ page }) => {
    await scrollToPercentage(page, 45);
    await expect(page).toHaveScreenshot("practice-45.png", { fullPage: false });
  });

  test("Services section - 60% scroll", async ({ page }) => {
    await scrollToPercentage(page, 60);
    await expect(page).toHaveScreenshot("services-60.png", { fullPage: false });
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

  test("HUD navigation bar", async ({ page }) => {
    const hudNav = page.locator(".hud__nav").first();
    if (await hudNav.isVisible()) {
      await expect(hudNav).toHaveScreenshot("hud-nav.png");
    }
  });

  test("HUD corner brackets", async ({ page }) => {
    const corner = page.locator(".hud__corner--tl").first();
    if (await corner.isVisible()) {
      await expect(corner).toHaveScreenshot("hud-corner-tl.png");
    }
  });
});
