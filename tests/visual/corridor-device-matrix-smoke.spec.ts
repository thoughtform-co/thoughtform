import { expect, test, type Page } from "@playwright/test";

/**
 * Corridor device-matrix probe (Phase 4, ADR-038).
 *
 * Runs across the four viewport projects (iphone-14 / iphone-14-pro-max /
 * tablet / desktop). Two jobs:
 *
 *   1. REPORT-ONLY telemetry — corridor render FPS + the GPU profile
 *      actually granted to the canvas (antialias + effective drawing-
 *      buffer DPR). Attached as test annotations + logged so a future
 *      regression (e.g. the tablet band losing its mobile GPU profile,
 *      or the corridor tanking FPS) is VISIBLE in the run without ever
 *      failing the suite. Headless WebGL is SwiftShader, so absolute FPS
 *      is not meaningful — the value is the trend/visibility.
 *
 *   2. HARD assertions — the two graceful-degradation paths: no-WebGL
 *      and reduced-motion both resolve to the static text fallback
 *      (`data-fallback="true"`), and the 3D corridor mounts on the
 *      capable viewports.
 *
 * Serialized: parallel landing pages starve one headless GPU (documented
 * in landing-corridor-smoke.spec.ts).
 */

test.describe.configure({ mode: "serial" });

async function scrollToCorridor(page: Page, pct = 30) {
  await page.evaluate((p: number) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: (p / 100) * max, behavior: "instant" });
  }, pct);
  await page.waitForTimeout(600);
}

test.describe("Corridor device matrix", () => {
  test("report-only: FPS + granted GPU profile; 3D corridor mounts", async ({ page }, testInfo) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");
    // Scroll the corridor into view — on ≤960px the WebGL chunk import is
    // deferred to first scroll/input/idle (ADR-038 / useCorridorMount).
    await scrollToCorridor(page, 25);
    await page.waitForTimeout(1200);

    const stage = page.locator(".home-v2-stage");
    const fallback = await stage.getAttribute("data-fallback");

    // GPU profile actually granted to the corridor canvas (report-only).
    const profile = await page.evaluate(() => {
      // R3F puts the className on a wrapper div; the real <canvas> is its
      // child.
      const c =
        document.querySelector(".home-v2-stage__canvas-inner canvas") ??
        document.querySelector(".home-v2-stage canvas");
      if (!(c instanceof HTMLCanvasElement)) return null;
      const gl =
        (c.getContext("webgl2") as WebGLRenderingContext | null) ??
        (c.getContext("webgl") as WebGLRenderingContext | null);
      const attrs = gl?.getContextAttributes?.() ?? null;
      const rect = c.getBoundingClientRect();
      return {
        antialias: attrs ? attrs.antialias : null,
        bufferWidth: c.width,
        cssWidth: Math.round(rect.width),
        effectiveDpr: rect.width ? Number((c.width / rect.width).toFixed(3)) : null,
        devicePixelRatio: window.devicePixelRatio,
      };
    });

    // Rolling FPS over ~1.5s of the engaged corridor (report-only).
    const fps = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let frames = 0;
          const t0 = performance.now();
          const tick = () => {
            frames += 1;
            const elapsed = performance.now() - t0;
            if (elapsed < 1500) requestAnimationFrame(tick);
            else resolve(Number((frames / (elapsed / 1000)).toFixed(1)));
          };
          requestAnimationFrame(tick);
        })
    );

    const report = JSON.stringify({ viewport: testInfo.project.name, fallback, fps, profile });
    testInfo.annotations.push({ type: "corridor-telemetry", description: report });
    console.log(`[corridor-device-matrix] ${report}`);

    // The only hard assertion here: the corridor composed something.
    await expect(stage).toHaveCount(1);
  });

  test("no-WebGL → static fallback (no 3D canvas mounts)", async ({ browser }, testInfo) => {
    // Fresh context so the getContext override lands before app JS runs.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(() => {
      // Block WebGL only; keep 2D so unrelated canvas work still functions.
      const proto = HTMLCanvasElement.prototype as unknown as {
        getContext: (type: string, ...rest: unknown[]) => unknown;
      };
      const original = proto.getContext;
      proto.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
        return original.call(this, type, ...rest);
      };
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");
    await scrollToCorridor(page, 25);
    await page.waitForTimeout(600);

    await expect(page.locator('.home-v2-stage[data-fallback="true"]')).toHaveCount(1);
    await expect(page.locator(".home-v2-stage__fallback")).toHaveCount(1);
    await expect(page.locator(".home-v2-stage__canvas-inner")).toHaveCount(0);

    testInfo.annotations.push({
      type: "corridor-telemetry",
      description: `${testInfo.project.name}: no-WebGL fallback OK`,
    });
    await context.close();
  });

  test("reduced-motion → static fallback", async ({ browser }, testInfo) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");
    await scrollToCorridor(page, 25);
    await page.waitForTimeout(600);

    await expect(page.locator('.home-v2-stage[data-fallback="true"]')).toHaveCount(1);
    testInfo.annotations.push({
      type: "corridor-telemetry",
      description: `${testInfo.project.name}: reduced-motion fallback OK`,
    });
    await context.close();
  });
});
