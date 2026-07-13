import { expect, test, type Page } from "@playwright/test";

/**
 * Arc Cases Terminal smoke (ADR-035 — supersedes the ADR-034 terrace).
 *
 * Structural contracts only — the converging clip-path unfurl is NOT
 * asserted pixel-wise here; the arm/band/label math is pinned in
 * `tests/lib/arc-cases-math.test.ts`. This suite proves the DOM half:
 * the CTA docks UNDER the Build title, arming opens the overlay AND
 * fades the stack labels to nothing (which requires the overlay's own
 * rAF level writer to actually run), stepping swaps the case, closing
 * drains, and walking out of the band auto-disarms.
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

test.describe("Arc cases terminal smoke (ADR-035)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");
    await page.waitForTimeout(800);
  });

  test("CTA docks under the Build title — inert mid-corridor, live at the park", async ({
    page,
  }) => {
    test.skip(!isDesktop(page), "desktop-only feature");
    const dock = page.locator(".home-v2-cases-cta-dock");
    await expect(dock).toHaveCount(1);

    // The dock is a descendant of a station header's `__head` band.
    const headWithDock = page.locator(".home-v2-station-header__head", { has: dock });
    await expect(headWithDock).toHaveCount(1);

    // Mid-corridor (Encode-ish): the dock must be inert.
    await scrollToStageProgress(page, 0.45);
    await expect(dock).toHaveAttribute("inert", "");

    // Build park: live, rest label.
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(600);
    await expect(dock).not.toHaveAttribute("inert", "");
    const chip = page.locator(".home-v2-cases-cta");
    await expect(chip).toContainText("VIEW THE CASES");

    // The chip sits BELOW the title console in the same head band.
    const title = headWithDock.locator(".home-v2-station-header__console--title");
    const chipBox = await chip.boundingBox();
    const titleBox = await title.boundingBox();
    expect(chipBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    if (chipBox && titleBox) {
      expect(chipBox.y).toBeGreaterThanOrEqual(titleBox.y + titleBox.height - 4);
    }
  });

  test("arming opens the overlay, drops inert, and fades the stack labels", async ({ page }) => {
    test.skip(!isDesktop(page), "desktop-only feature");
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(800);

    const chip = page.locator(".home-v2-cases-cta");
    const terminal = page.locator("#arc-cases-terminal");
    await expect(terminal).toHaveCount(1);

    await chip.click();
    await expect(chip).toHaveAttribute("data-armed", "true");
    await expect(chip).toContainText("CLOSE");
    await expect(terminal).toHaveAttribute("data-open", "true");

    // The overlay drops `inert` once the sweep passes the arrive
    // threshold — proving the level-writer rAF is alive.
    await expect(terminal).not.toHaveAttribute("inert", "", { timeout: 5000 });

    // The stack labels disappear on the DOM level writer — a per-row
    // source chip must compute to ~0 opacity after the arm settles.
    const stackChip = page.locator('.home-v2-stack-item[data-stack-side="sources"]').first();
    await expect
      .poll(async () => Number(await stackChip.evaluate((el) => getComputedStyle(el).opacity)), {
        timeout: 5000,
      })
      .toBeLessThan(0.05);
  });

  test("stepping + selecting swaps the front case", async ({ page }) => {
    test.skip(!isDesktop(page), "desktop-only feature");
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(800);

    await page.locator(".home-v2-cases-cta").click();
    await expect(page.locator("#arc-cases-terminal")).toHaveAttribute("data-open", "true");

    const chips = page.locator(".home-v2-cases-terminal__chip");
    await expect(chips).toHaveCount(4);
    await expect(chips.nth(0)).toHaveAttribute("aria-pressed", "true");

    const codename = page.locator(".home-v2-cases-terminal__codename");
    const first = await codename.textContent();

    await page.locator(".home-v2-cases-terminal__step--next").click();
    await expect(chips.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(codename).not.toHaveText(first ?? "");

    await chips.nth(3).click();
    await expect(chips.nth(3)).toHaveAttribute("aria-pressed", "true");
  });

  test("closing drains — overlay hidden, labels recover", async ({ page }) => {
    test.skip(!isDesktop(page), "desktop-only feature");
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(800);

    const chip = page.locator(".home-v2-cases-cta");
    const terminal = page.locator("#arc-cases-terminal");
    await chip.click();
    await expect(terminal).toHaveAttribute("data-open", "true");

    await chip.click();
    await expect(chip).toHaveAttribute("data-armed", "false");
    await expect(terminal).toHaveAttribute("data-open", "false");
    // Closed overlay is inert (hidden by the delayed-visibility close).
    await expect(terminal).toHaveAttribute("inert", "", { timeout: 5000 });

    // Stack labels recover once the level drains back to 0.
    const stackChip = page.locator('.home-v2-stack-item[data-stack-side="sources"]').first();
    await expect
      .poll(async () => Number(await stackChip.evaluate((el) => getComputedStyle(el).opacity)), {
        timeout: 5000,
      })
      .toBeGreaterThan(0.3);
  });

  test("walking out of the Build band auto-disarms; re-arming is clean", async ({ page }) => {
    test.skip(!isDesktop(page), "desktop-only feature");
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(800);

    const chip = page.locator(".home-v2-cases-cta");
    await chip.click();
    await expect(chip).toHaveAttribute("data-armed", "true");

    // Scroll back toward Encode — the watcher must disarm.
    await scrollToStageProgress(page, 0.45);
    await expect(chip).toHaveAttribute("data-armed", "false");

    // Return: rest label, clean re-arm.
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(600);
    await expect(chip).toContainText("VIEW THE CASES");
    await chip.click();
    await expect(chip).toHaveAttribute("data-armed", "true");
    await chip.click();
  });

  test("mobile/tablet never shows the dock or the overlay", async ({ page }) => {
    test.skip(isDesktop(page), "absence check is for small viewports");
    await scrollToStageProgress(page, BUILD_PARK_RAW);

    // The overlay self-gates on ARC_CASES_MEDIA (renders null off-desktop).
    await expect(page.locator("#arc-cases-terminal")).toHaveCount(0);

    // The dock may exist in the (hidden) station-headers layer — the
    // ARC_CASES_MEDIA-mirroring CSS hide must keep it invisible.
    const dock = page.locator(".home-v2-cases-cta-dock");
    if ((await dock.count()) > 0) await expect(dock).toBeHidden();
  });
});
