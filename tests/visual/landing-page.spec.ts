import { test, expect } from "@playwright/test";

/**
 * Visual Regression Tests for Thoughtform Landing Page
 *
 * Componentized V7 architecture: React hooks drive scroll/motion/phase
 * behavior; CSS loaded as a proper import; useLayoutEffect prevents
 * hero flash on first paint. The prototype HTML body is still
 * server-extracted but rendered inside a real component tree.
 *
 * IMPORTANT: After any visual change, re-capture baselines:
 *   npm run test:visual:update
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

  test("Definition section - 12% scroll", async ({ page }) => {
    await scrollToPercentage(page, 12);
    await expect(page).toHaveScreenshot("definition-12.png", { fullPage: false });
  });

  test("Continuum section - 25% scroll", async ({ page }) => {
    await scrollToPercentage(page, 25);
    await expect(page).toHaveScreenshot("continuum-25.png", { fullPage: false });
  });

  test("Practice section - 40% scroll", async ({ page }) => {
    await scrollToPercentage(page, 40);
    await expect(page).toHaveScreenshot("practice-40.png", { fullPage: false });
  });

  test("About section - 60% scroll", async ({ page }) => {
    await scrollToPercentage(page, 60);
    await expect(page).toHaveScreenshot("about-60.png", { fullPage: false });
  });

  test("Products section - 75% scroll", async ({ page }) => {
    await scrollToPercentage(page, 75);
    await expect(page).toHaveScreenshot("products-75.png", { fullPage: false });
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

  test("HUD hamburger menu", async ({ page }) => {
    const hudNav = page.locator(".hud__nav").first();
    if (await hudNav.isVisible()) {
      await expect(hudNav).toHaveScreenshot("hud-nav-hamburger.png");
    }
  });

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
  test("hero is not visible when page loads scrolled to definition", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await scrollToPercentage(page, 15);
    await page.waitForTimeout(300);
    const hero = page.locator("#hero").first();
    const visibility = await hero.evaluate((el) => getComputedStyle(el).visibility);
    expect(visibility).toBe("hidden");
  });

  test("no hero bleed at connector boundary", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await scrollToPercentage(page, 18);
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("connector-02-03-boundary.png", {
      fullPage: false,
    });
  });
});

test.describe("Connector Transitions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  });

  test("Connector 02-03 (definition to continuum)", async ({ page }) => {
    await scrollToPercentage(page, 20);
    await expect(page).toHaveScreenshot("connector-02-03.png", {
      fullPage: false,
    });
  });

  test("Connector 03-04 (continuum to practice)", async ({ page }) => {
    await scrollToPercentage(page, 32);
    await expect(page).toHaveScreenshot("connector-03-04.png", {
      fullPage: false,
    });
  });

  test("Connector 04-07 (practice to about)", async ({ page }) => {
    await scrollToPercentage(page, 55);
    await expect(page).toHaveScreenshot("connector-04-07.png", {
      fullPage: false,
    });
  });
});
