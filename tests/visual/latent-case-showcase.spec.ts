import { test, expect } from "@playwright/test";

/**
 * Smoke + choreography checks for the internal latent case prototype.
 * Avoids screenshot baselines (no committed PNGs) — validates DOM + scroll handoff.
 */
test.describe("Latent case showcase", () => {
  test("scroll track advances phases; exit plane and cards appear", async ({ page }) => {
    await page.goto("/test/latent-cases");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByRole("heading", { name: /Scroll through the gateway/i })).toBeVisible();

    const track = page.locator('section[aria-label="Latent scroll track"]');
    await expect(track).toBeVisible();

    // Enter sticky track (intro is ~1 viewport)
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight * 1.1, behavior: "instant" });
    });
    await page.waitForTimeout(400);

    const phaseValue = page.locator(
      '.latent-case-showcase__hud-row:has-text("phase") .latent-case-showcase__hud-v'
    );
    await expect(phaseValue).toBeVisible();

    // Scroll deep through the 480vh track
    await page.evaluate(() => {
      window.scrollTo({ top: window.innerHeight * 6, behavior: "instant" });
    });
    await page.waitForTimeout(900);

    await expect(page.locator(".latent-exit-plane")).toBeAttached();
    const exitOpacity = await page
      .locator(".latent-exit-plane")
      .evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    expect(exitOpacity).toBeGreaterThan(0.05);

    await expect(page.locator(".latent-case-card").first()).toBeVisible({ timeout: 15_000 });

    // Gateway stage should exist (WebGL canvas mounts)
    await expect(page.locator(".latent-gateway-stage")).toBeAttached();
  });
});
