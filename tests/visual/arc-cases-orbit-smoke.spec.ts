import { expect, test, type Page } from "@playwright/test";

/**
 * Arc cases orbit smoke (ADR-033).
 *
 * Structural contracts only — no screenshot baselines (mirrors
 * services-ring-smoke.spec.ts). Covers:
 *   - the Build-park CTA chip arrives with the Build caption band and
 *     is inert before it;
 *   - clicking ARMS the orbit: the store flips, the hit layer publishes
 *     side-card buttons, the caption card + surfaces chips dim;
 *   - stepping via a side-card hit button advances the front case
 *     (CTA readout);
 *   - CLOSE disarms and drains the hit layer;
 *   - scrolling out of the Build band auto-disarms (no stale armed
 *     state at the epilogue / services);
 *   - reduced-motion mounts no CTA at all (fallback corridor).
 *
 * WebGL canvas CONTENT is not asserted; the orbit math is pinned by
 * tests/lib/arc-cases-orbit.test.ts instead.
 */

// The corridor WebGL pipeline must actually paint (the ring's useFrame
// damps the arm level + publishes anchors) — serialize against the one
// dev server, same as the services ring smoke.
test.describe.configure({ mode: "serial" });

/** Scroll the corridor stage to `raw` (0..1 of the sticky travel).
 *
 * Two-arg `window.scrollTo(0, y)` (rides the page's smooth scroll), NOT
 * `{ behavior: "instant" }` — a teleport skips the scroll-driven
 * engagement band and the canvas frameloop never wakes (see the
 * services-ring smoke note). */
async function scrollCorridorTo(page: Page, raw: number): Promise<boolean> {
  const target = await page.evaluate((r) => {
    const stage = document.querySelector<HTMLElement>(".home-v2-stage");
    if (!stage) return null;
    const rect = stage.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const travel = Math.max(0, stage.offsetHeight - window.innerHeight);
    return Math.round(top + travel * r);
  }, raw);
  if (target == null) return false;
  await page.evaluate((y) => window.scrollTo(0, y), target);
  await page.waitForTimeout(600);
  return true;
}

/** Build park in RAW stage units: paintProgress 0.9225 × EPILOGUE_START
 *  (620/820) — the corridor progress renormalization in useDepthScroll. */
const BUILD_PARK_RAW = 0.9225 * (620 / 820);

function isCtaViewport(page: Page): boolean {
  const size = page.viewportSize();
  return (size?.width ?? 0) >= 1101 && (size?.height ?? 0) >= 760;
}

test.describe("Arc cases orbit smoke (ADR-033)", () => {
  test("desktop: CTA arms the orbit; hit layer, dims, stepping, close", async ({ page }) => {
    test.skip(!isCtaViewport(page), "the cases orbit is gated to the CTA layer (≥1101×760)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage", { timeout: 15_000 });

    // Before the Build band: the CTA row is inert.
    expect(await scrollCorridorTo(page, 0.35)).toBe(true);
    await page.waitForTimeout(800);
    const ctaRow = page.locator(".home-v2-cases-cta-row");
    await expect(ctaRow).toHaveCount(1);
    await expect(ctaRow).toHaveAttribute("inert", "");

    // At the Build park: the chip arrives with the caption band.
    expect(await scrollCorridorTo(page, BUILD_PARK_RAW)).toBe(true);
    await page.waitForTimeout(1600);
    await expect(ctaRow).not.toHaveAttribute("inert", "", { timeout: 20_000 });
    const cta = page.locator(".home-v2-cases-cta");
    await expect(cta).toContainText("VIEW THE CASES");

    // Arm. The deferred bake (band-triggered) has had the settle above;
    // the hit layer publishes once the damped level crosses 0.85.
    await cta.click();
    await expect(cta).toHaveAttribute("data-armed", "true");
    await expect(cta).toContainText("CLOSE · 01 / 04");
    // Side cards clickable; the front card and the occluded-opposite
    // card publish no button → exactly 2.
    await expect(page.locator(".arc-cases-hits__hit")).toHaveCount(2, { timeout: 20_000 });

    // The sphere takes the frame: caption irises back, surfaces fan
    // sinks hard, sources lanes sink softly.
    const captionOp = await page
      .locator(".home-v2-caption-card")
      .evaluate((el) => parseFloat((el as HTMLElement).style.opacity || "1"));
    expect(captionOp).toBeLessThan(0.3);
    const surfacesOp = await page
      .locator('[data-stack-side="surfaces"]')
      .first()
      .evaluate((el) => parseFloat((el as HTMLElement).style.opacity || "1"));
    expect(surfacesOp).toBeLessThan(0.3);
    const sourcesOp = await page
      .locator('[data-stack-side="sources"]')
      .first()
      .evaluate((el) => parseFloat((el as HTMLElement).style.opacity || "1"));
    expect(sourcesOp).toBeGreaterThan(0.4);

    // Step via a side-card hit button → the front case advances and the
    // CTA readout tracks it.
    await page.locator(".arc-cases-hits__hit").first().click();
    await expect(cta).not.toContainText("· 01 /", { timeout: 10_000 });

    // Close: the envelope reverses and the hit layer drains.
    await cta.click();
    await expect(cta).not.toHaveAttribute("data-armed", "true");
    await expect(cta).toContainText("VIEW THE CASES");
    await expect(page.locator(".arc-cases-hits__hit")).toHaveCount(0, { timeout: 10_000 });

    // Caption restores as the level decays.
    await page.waitForTimeout(1500);
    const captionRestored = await page
      .locator(".home-v2-caption-card")
      .evaluate((el) => parseFloat((el as HTMLElement).style.opacity || "0"));
    expect(captionRestored).toBeGreaterThan(0.8);
  });

  test("desktop: scrolling out of the Build band auto-disarms", async ({ page }) => {
    test.skip(!isCtaViewport(page), "the cases orbit is gated to the CTA layer (≥1101×760)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage", { timeout: 15_000 });
    expect(await scrollCorridorTo(page, BUILD_PARK_RAW)).toBe(true);
    await page.waitForTimeout(1600);

    const cta = page.locator(".home-v2-cases-cta");
    await expect(cta).toContainText("VIEW THE CASES", { timeout: 20_000 });
    await cta.click();
    await expect(cta).toHaveAttribute("data-armed", "true");
    await expect(page.locator(".arc-cases-hits__hit")).toHaveCount(2, { timeout: 20_000 });

    // Walk into the epilogue → the watcher disarms, the band kill
    // drains the hit layer, and the chip leaves with the caption band.
    expect(await scrollCorridorTo(page, 0.85)).toBe(true);
    await expect(page.locator(".arc-cases-hits__hit")).toHaveCount(0, { timeout: 10_000 });
    await expect(cta).not.toHaveAttribute("data-armed", "true");

    // Reverse back to the park → clean rest state, no stale armed chip.
    expect(await scrollCorridorTo(page, BUILD_PARK_RAW)).toBe(true);
    await page.waitForTimeout(1200);
    await expect(cta).toContainText("VIEW THE CASES");
  });

  test("reduced motion mounts no CTA (fallback corridor has no orbit)", async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage", { timeout: 15_000 });
    await expect(page.locator(".home-v2-cases-cta-row")).toHaveCount(0);
    await expect(page.locator(".arc-cases-hits")).toHaveCount(0);
    await context.close();
  });

  test("mobile: the CTA layer never shows below the gate", async ({ page }) => {
    test.skip(isCtaViewport(page), "mobile/tablet path is <1101px");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage", { timeout: 15_000 });
    // The row may exist in the DOM on capable phones (headers mount,
    // CSS hides the layer) — assert it can never be seen.
    const row = page.locator(".home-v2-cases-cta-row");
    if ((await row.count()) > 0) {
      await expect(row).toBeHidden();
    }
    await expect(page.locator(".arc-cases-hits__hit")).toHaveCount(0);
  });
});
