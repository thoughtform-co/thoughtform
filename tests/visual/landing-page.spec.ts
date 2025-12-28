import { test, expect } from "@playwright/test";

/**
 * Visual Regression Tests for Thoughtform Landing Page
 *
 * Key scroll positions (based on NavigationCockpitV2 thresholds):
 * - 0%: Hero section
 * - 10%: Interface/Definition section
 * - 20%: Manifesto start
 * - 40%: Manifesto mid
 * - 60%: Services section
 * - 95%: Contact section
 */

// Scroll position helper - converts percentage to pixel offset based on document height
async function scrollToPercentage(page: any, percentage: number) {
  await page.evaluate((pct: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = (pct / 100) * scrollHeight;
    window.scrollTo({ top: targetScroll, behavior: "instant" });
  }, percentage);
  // Wait for animations and scroll-driven transitions to settle
  await page.waitForTimeout(500);
}

test.describe("Landing Page Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto("/");
    // Wait for initial load and animations
    await page.waitForLoadState("networkidle");
    // Give time for particle canvas and WebGL to initialize
    await page.waitForTimeout(2000);
  });

  // ═══════════════════════════════════════════════════════════════
  // HERO SECTION (0% scroll)
  // ═══════════════════════════════════════════════════════════════

  test("Hero section - 0% scroll", async ({ page }) => {
    await scrollToPercentage(page, 0);
    await expect(page).toHaveScreenshot("hero-0.png", {
      fullPage: false,
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // INTERFACE/DEFINITION SECTION (10% scroll)
  // ═══════════════════════════════════════════════════════════════

  test("Interface section - 10% scroll", async ({ page }) => {
    await scrollToPercentage(page, 10);
    await expect(page).toHaveScreenshot("interface-10.png", {
      fullPage: false,
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MANIFESTO SECTION START (20% scroll)
  // ═══════════════════════════════════════════════════════════════

  test("Manifesto start - 20% scroll", async ({ page }) => {
    await scrollToPercentage(page, 20);
    await expect(page).toHaveScreenshot("manifesto-start-20.png", {
      fullPage: false,
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MANIFESTO SECTION MID (40% scroll)
  // ═══════════════════════════════════════════════════════════════

  test("Manifesto mid - 40% scroll", async ({ page }) => {
    await scrollToPercentage(page, 40);
    await expect(page).toHaveScreenshot("manifesto-mid-40.png", {
      fullPage: false,
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SERVICES SECTION (60% scroll)
  // ═══════════════════════════════════════════════════════════════

  test("Services section - 60% scroll", async ({ page }) => {
    await scrollToPercentage(page, 60);
    await expect(page).toHaveScreenshot("services-60.png", {
      fullPage: false,
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // CONTACT SECTION (95% scroll)
  // ═══════════════════════════════════════════════════════════════

  test("Contact section - 95% scroll", async ({ page }) => {
    await scrollToPercentage(page, 95);
    await expect(page).toHaveScreenshot("contact-95.png", {
      fullPage: false,
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// COMPONENT-LEVEL VISUAL TESTS
// ═══════════════════════════════════════════════════════════════

test.describe("Component Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  test("Navigation bar", async ({ page }) => {
    // Focus on navigation area at top of page
    const navbar = page.locator(".navbar-container, .mobile-section-list").first();
    // Only run if navbar exists (desktop vs mobile)
    if (await navbar.isVisible()) {
      await expect(navbar).toHaveScreenshot("navbar.png");
    }
  });

  test("HUD frame corners", async ({ page }) => {
    // Capture corner elements
    const hudCorner = page.locator(".hud-corner").first();
    if (await hudCorner.isVisible()) {
      await expect(hudCorner).toHaveScreenshot("hud-corner.png");
    }
  });
});
