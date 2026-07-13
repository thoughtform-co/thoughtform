import { expect, test, type Page } from "@playwright/test";

/**
 * Arc Cases Terrace smoke (ADR-034 — supersedes the ADR-033 orbit).
 *
 * Structural contracts only — the WebGL content (camera shift, screen
 * rise, crossfade) is NOT asserted pixel-wise here; its math is pinned
 * in `tests/lib/arc-cases-terrace.test.ts`. This suite proves the DOM
 * half: the rail CTA arrives with the Build band, arming exposes the
 * stepper (which requires the R3F level writer to actually run), the
 * chips step/select, closing drains, and walking out of the band
 * auto-disarms.
 *
 * Desktop-only feature (ARC_CASES_MEDIA ≥ 1101×760 + no reduced
 * motion): the mobile/tablet projects assert absence instead.
 */

/** Corridor raw stage progress for the Build park:
 *  paintProgress 0.9225 × EPILOGUE_START (620/820). */
const BUILD_PARK_RAW = 0.9225 * (620 / 820);

async function scrollToStageProgress(page: Page, raw: number) {
  await page.evaluate((value: number) => {
    const stage = document.querySelector<HTMLElement>(".home-v2-stage");
    if (!stage) return;
    const top = stage.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + value * (stage.offsetHeight - window.innerHeight),
      behavior: "instant",
    });
  }, raw);
  await page.waitForTimeout(600);
}

function isDesktop(page: Page): boolean {
  const viewport = page.viewportSize();
  return !!viewport && viewport.width >= 1101 && viewport.height >= 760;
}

test.describe("Arc cases terrace smoke (ADR-034)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");
    await page.waitForTimeout(800);
  });

  test("CTA row is inert before the Build band and live at the park", async ({ page }) => {
    test.skip(!isDesktop(page), "desktop-only feature");
    const row = page.locator(".home-v2-cases-cta-row");
    await expect(row).toHaveCount(1);

    // Mid-corridor (Encode-ish): the cluster must be inert.
    await scrollToStageProgress(page, 0.45);
    await expect(row).toHaveAttribute("inert", "");

    // Build park: live, rest label.
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(600);
    await expect(row).not.toHaveAttribute("inert", "");
    await expect(page.locator(".home-v2-cases-cta")).toContainText("VIEW THE CASES");
  });

  test("arming exposes CLOSE + the stepper; chips step and select; close drains", async ({
    page,
  }) => {
    test.skip(!isDesktop(page), "desktop-only feature");
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(800);

    const cta = page.locator(".home-v2-cases-cta");
    await cta.click();
    await expect(cta).toHaveAttribute("data-armed", "true");
    await expect(cta).toContainText("CLOSE");

    // The stepper materializes on the terrace's damped level — its
    // visibility proves the R3F level writer is alive.
    const stepper = page.locator(".home-v2-cases-stepper");
    await expect(stepper).not.toHaveAttribute("inert", "", { timeout: 5000 });

    const chips = page.locator(".home-v2-cases-stepper__chip");
    await expect(chips).toHaveCount(4);
    await expect(chips.nth(0)).toHaveAttribute("aria-pressed", "true");

    await page.locator(".home-v2-cases-stepper__step--next").click();
    await expect(chips.nth(1)).toHaveAttribute("aria-pressed", "true");

    await chips.nth(3).click();
    await expect(chips.nth(3)).toHaveAttribute("aria-pressed", "true");

    await cta.click();
    await expect(cta).toHaveAttribute("data-armed", "false");
    await expect(stepper).toHaveAttribute("inert", "", { timeout: 5000 });
  });

  test("walking out of the Build band auto-disarms; re-arming is clean", async ({ page }) => {
    test.skip(!isDesktop(page), "desktop-only feature");
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(800);

    const cta = page.locator(".home-v2-cases-cta");
    await cta.click();
    await expect(cta).toHaveAttribute("data-armed", "true");

    // Scroll back toward Encode — the watcher must disarm.
    await scrollToStageProgress(page, 0.45);
    await expect(cta).toHaveAttribute("data-armed", "false");

    // Return: rest label, clean re-arm.
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(600);
    await expect(cta).toContainText("VIEW THE CASES");
    await cta.click();
    await expect(cta).toHaveAttribute("data-armed", "true");
    await cta.click();
  });

  test("mobile/tablet never shows the CTA cluster", async ({ page }) => {
    test.skip(isDesktop(page), "absence check is for small viewports");
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    // On capable small viewports the corridor still runs, so the
    // cluster may exist in the DOM — but the ARC_CASES_MEDIA-mirroring
    // CSS hide must keep it invisible (gate parity).
    const row = page.locator(".home-v2-cases-cta-row");
    if ((await row.count()) > 0) await expect(row).toBeHidden();
  });
});
