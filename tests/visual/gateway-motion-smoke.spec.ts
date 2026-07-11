import { expect, test, type Page } from "@playwright/test";

/**
 * Gateway Motion Lab smoke (ADR-027).
 *
 * Structural contracts only — no screenshot baselines (mirrors
 * landing-corridor-smoke.spec.ts). Requires the prep pipeline to have
 * run (`npm run gateway:prep`); every assertion is skipped gracefully
 * when the manifest is absent so CI without assets stays green.
 */

const LAB = "/test/gateway-motion";

async function manifestAvailable(page: Page): Promise<boolean> {
  const status = await page.evaluate(async () => {
    try {
      const res = await fetch("/gateway-motion/manifest.json", { cache: "no-cache" });
      return res.status;
    } catch {
      return 0;
    }
  });
  return status === 200;
}

async function scrollToPercentage(page: Page, percentage: number) {
  await page.evaluate((pct: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: (pct / 100) * scrollHeight, behavior: "instant" });
  }, percentage);
  await page.waitForTimeout(400);
}

test.describe("Gateway Motion Lab smoke", () => {
  test("manifest loads and lists visuals with depth + plates", async ({ page }) => {
    await page.goto(LAB, { waitUntil: "domcontentloaded" });
    test.skip(!(await manifestAvailable(page)), "gateway:prep has not been run");

    const manifest = await page.evaluate(() =>
      fetch("/gateway-motion/manifest.json").then((r) => r.json())
    );
    expect(manifest.version).toBe(1);
    expect(manifest.visuals.length).toBeGreaterThanOrEqual(1);
    const v1 = manifest.visuals.find((v: { id: string }) => v.id === "gateway-v1");
    expect(v1).toBeTruthy();
    expect(v1.plate.avif.length).toBeGreaterThan(0);
    expect(v1.depth?.src8).toBeTruthy();
  });

  test("parallax mode mounts exactly one WebGL canvas, sized to the stage", async ({ page }) => {
    await page.goto(`${LAB}?mode=parallax&visual=gateway-v1`, { waitUntil: "domcontentloaded" });
    test.skip(!(await manifestAvailable(page)), "gateway:prep has not been run");

    // Texture load + SizeSync burst can take a moment.
    await page.waitForSelector(".gwm-stage canvas", { timeout: 10_000 });
    await page.waitForTimeout(1200);

    const canvases = page.locator(".gwm-stage canvas");
    await expect(canvases).toHaveCount(1);
    const size = await canvases.first().evaluate((c: HTMLCanvasElement) => [c.width, c.height]);
    expect(size[0]).toBeGreaterThan(400); // not the 300x150 default buffer
    expect(size[1]).toBeGreaterThan(200);
  });

  test("mode switching swaps treatments without stacking canvases", async ({ page }) => {
    await page.goto(`${LAB}?mode=parallax&visual=gateway-v1`, { waitUntil: "domcontentloaded" });
    test.skip(!(await manifestAvailable(page)), "gateway:prep has not been run");
    await page.waitForSelector(".gwm-stage canvas", { timeout: 10_000 });

    await page.getByRole("button", { name: "2.5D MESH" }).click();
    await page.waitForTimeout(1500);
    await expect(page.locator(".gwm-stage canvas")).toHaveCount(1);

    await page.getByRole("button", { name: "KEN BURNS" }).click();
    await page.waitForTimeout(600);
    await expect(page.locator(".gwm-stage canvas")).toHaveCount(0);
    await expect(page.locator(".gwm-kenburns__img")).toHaveCount(1);
  });

  test("living mode runs the overlay canvas over a static plate", async ({ page }) => {
    await page.goto(`${LAB}?mode=living&visual=gateway-v1`, { waitUntil: "domcontentloaded" });
    test.skip(!(await manifestAvailable(page)), "gateway:prep has not been run");

    await page.waitForSelector(".gwm-kenburns__img", { timeout: 10_000 });
    // Overlay canvas (2D, screen blend) + no WebGL canvas.
    const overlay = page.locator(".gwm-stage canvas");
    await expect(overlay).toHaveCount(1);
    const blend = await overlay.first().evaluate((c) => getComputedStyle(c).mixBlendMode);
    expect(blend).toBe("screen");
  });

  test("scrub mode draws frames onto the canvas as scroll advances", async ({ page }) => {
    await page.goto(`${LAB}?mode=scrub&visual=gateway-v1`, { waitUntil: "domcontentloaded" });
    test.skip(!(await manifestAvailable(page)), "gateway:prep has not been run");

    const hasSequence = await page.evaluate(async () => {
      const m = await fetch("/gateway-motion/manifest.json").then((r) => r.json());
      return Boolean(m.visuals.find((v: { id: string }) => v.id === "gateway-v1")?.sequence);
    });
    test.skip(!hasSequence, "no sequence packaged for gateway-v1 (run gateway:frames)");

    await page.waitForSelector(".gwm-stage canvas", { timeout: 10_000 });
    // Give the center-out preloader a moment, then scrub.
    await page.waitForTimeout(2500);
    const sample = async () =>
      page
        .locator(".gwm-stage canvas")
        .first()
        .evaluate((c: HTMLCanvasElement) => {
          const ctx = c.getContext("2d");
          if (!ctx || c.width === 0) return "";
          const px = ctx.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 8, 8);
          return Array.from(px.data.slice(0, 64)).join(",");
        });

    await scrollToPercentage(page, 5);
    const early = await sample();
    await scrollToPercentage(page, 90);
    await page.waitForTimeout(600);
    const late = await sample();
    expect(early).not.toBe("");
    expect(late).not.toBe("");
    expect(late).not.toBe(early); // different frame drawn at a different scroll depth
  });

  test("deep links keep mode and visual in the URL", async ({ page }) => {
    await page.goto(`${LAB}?mode=mesh&visual=gateway-v5`, { waitUntil: "domcontentloaded" });
    test.skip(!(await manifestAvailable(page)), "gateway:prep has not been run");
    await page.waitForTimeout(800);
    await expect(page).toHaveURL(/mode=mesh/);
    await expect(page).toHaveURL(/visual=gateway-v5/);

    await page.getByRole("button", { name: "DEPTH PARALLAX" }).click();
    await page.waitForTimeout(400);
    await expect(page).toHaveURL(/mode=parallax/);
  });

  test("reduced motion renders the static Ken Burns path without animation", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto(`${LAB}?mode=kenburns&visual=gateway-v1`, { waitUntil: "domcontentloaded" });
    const available = await manifestAvailable(page);
    if (!available) {
      await context.close();
      test.skip(true, "gateway:prep has not been run");
      return;
    }
    await page.waitForSelector(".gwm-kenburns__img", { timeout: 10_000 });
    const driftAnimation = await page
      .locator(".gwm-kenburns__drift")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(driftAnimation).toBe("none"); // motion.css disables drift under reduced motion
    await context.close();
  });
});
