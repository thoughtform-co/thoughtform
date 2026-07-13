import { expect, test, type Page } from "@playwright/test";

/**
 * Services card ring smoke (ADR-029).
 *
 * Structural contracts only — no screenshot baselines (mirrors
 * gateway-motion-smoke.spec.ts). Covers:
 *   - ring mode retires the console racks on desktop (the orbiting cards
 *     carry their full C3 copy on the baked face);
 *   - the scroll clock advances the active service (rack copy + step);
 *   - the regenerated photo assets resolve (the embedded/workshop.webp 404
 *     regression);
 *   - the /test/services-orbit lab mounts one sized WebGL canvas;
 *   - mobile + reduced-motion keep the plate accordion, with no ring
 *     overlays in the DOM.
 *
 * Note: WebGL canvas CONTENT is not asserted (corridor canvas runs
 * preserveDrawingBuffer: false); the ring's math is pinned by
 * tests/lib/services-ring-math.test.ts instead.
 */

// The desktop assertions depend on the corridor WebGL pipeline actually
// painting (card anchors publish from useFrame) — running several landing
// pages in parallel against one dev server starves headless GPU contexts
// and the instrument never mounts. Serialize this file's tests.
test.describe.configure({ mode: "serial" });

/** Scroll the window so the services runway sits at `progress` (0..1).
 *
 * MUST use the two-arg `window.scrollTo(0, y)` form (rides the page's
 * smooth scroll), NOT `{ behavior: "instant" }`: an instant teleport skips
 * the corridor's scroll-driven engagement band, the canvas frameloop never
 * wakes, and the instrument (mark + card ring) renders nothing — the smoke
 * then fails on a dead canvas that no real scroll path produces. */
async function scrollServicesRunway(page: Page, progress: number): Promise<boolean> {
  const target = await page.evaluate((p) => {
    const runway = document.querySelector(".services-stage-root");
    if (!runway) return null;
    const rect = runway.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const travel = Math.max(0, rect.height - window.innerHeight);
    return Math.round(top + travel * p);
  }, progress);
  if (target == null) return false;
  await page.evaluate((y) => window.scrollTo(0, y), target);
  await page.waitForTimeout(600);
  return true;
}

function isDesktopViewport(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) >= 961;
}

test.describe("Services card ring smoke (ADR-029)", () => {
  test("desktop: ring mode retires the racks; cards expose their CTA", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "ring mode is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });
    expect(await scrollServicesRunway(page, 0.3)).toBe(true);
    // Step clock + scramble decode settle.
    await page.waitForTimeout(1600);

    const stage = page.locator(".services-stage");
    await expect(stage).toHaveAttribute("data-card-ring", "on");
    await expect(stage).toHaveAttribute("data-active-step", "1");

    // Racks exist in the DOM (mobile path needs them) but render none.
    const rackDisplay = await page
      .locator(".svc-rack")
      .first()
      .evaluate((el) => getComputedStyle(el).display);
    expect(rackDisplay).toBe("none");

    // Leader lines retire with the racks in ring mode.
    await expect(page.locator(".services-scan-connectors")).toHaveCount(0);

    // The cards carry their full copy on the baked face; the DOM exposes
    // the front card's CTA as a real link plus side-card view targets.
    // Generous timeout: cold dev-server compile + texture bakes + the
    // parked-anchor gate all precede the first publish.
    await expect(page.locator(".svc-ring-hits")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Open an advisory" })).toBeVisible({
      timeout: 20_000,
    });
    // The readout tracks the same active-service clock (service 01).
    await expect(page.locator(".services-readout")).toContainText("ADVISORY");

    // SOURCE BUS register (ADR-033 split — the services half of the
    // retired ToolsRailRegister) renders its four verb rows in the
    // authored right-rail slot, with the active row tracking service 01.
    await expect(page.locator(".tools-rail-register__heading--services")).toHaveText(
      "SOURCE BUS · 04"
    );
    await expect(page.locator(".tools-rail-register__row--service")).toHaveCount(4);
    await expect(page.locator(".tools-rail-register__row--service[data-active]")).toHaveCount(1);
  });

  test("desktop: the services → about seam ends the ambient hold under the bio cover", async ({
    page,
  }) => {
    test.skip(!isDesktopViewport(page), "the exit seam is desktop-only (dock gate)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });

    // #about directly follows #services (ADR-033 funnel).
    const followsServices = await page.evaluate(() => {
      const services = document.getElementById("services");
      const about = document.getElementById("about");
      if (!services || !about) return false;
      return about.offsetTop > services.offsetTop;
    });
    expect(followsServices).toBe(true);

    // Ride the runway to its end, then walk into #about: the ambient
    // hold (and its body-veil exit band) must clear as the opaque bio
    // covers the viewport — no receded-mark ghost behind About.
    expect(await scrollServicesRunway(page, 0.98)).toBe(true);
    await page.waitForTimeout(900);
    const aboutTop = await page.evaluate(() => {
      const about = document.getElementById("about");
      if (!about) return null;
      const rect = about.getBoundingClientRect();
      return Math.round(rect.top + window.scrollY + window.innerHeight * 0.25);
    });
    expect(aboutTop).not.toBeNull();
    await page.evaluate((y) => window.scrollTo(0, y as number), aboutTop);
    await page.waitForTimeout(900);

    const seam = await page.evaluate(() => ({
      ambient: document.documentElement.hasAttribute("data-services-ambient"),
      exit: document.documentElement.hasAttribute("data-corridor-exit"),
      aboutVisible: (() => {
        const about = document.getElementById("about");
        if (!about) return false;
        const rect = about.getBoundingClientRect();
        return rect.top <= 0 && rect.bottom > window.innerHeight * 0.5;
      })(),
    }));
    expect(seam.aboutVisible).toBe(true);
    expect(seam.ambient).toBe(false);
    expect(seam.exit).toBe(false);
  });

  test("desktop: the scroll clock advances the active service", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "ring mode is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });

    expect(await scrollServicesRunway(page, 0.3)).toBe(true);
    await page.waitForTimeout(1600);
    await expect(page.locator(".services-readout")).toContainText("ADVISORY");
    await expect(page.getByRole("link", { name: "Open an advisory" })).toBeVisible({
      timeout: 20_000,
    });

    // 6-beat runway since ADR-030: p=0.6 → floor(3.6) = step 3 (Keynote).
    // (0.7 would land in step 4 / Workshop now.)
    expect(await scrollServicesRunway(page, 0.6)).toBe(true);
    await page.waitForTimeout(1600);
    await expect(page.locator(".services-readout")).toContainText("KEYNOTE");
    // The ring rotated with the clock: the front card (and so its CTA
    // link) is now the Keynote plate.
    await expect(page.getByRole("link", { name: "Book a keynote" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator(".services-stage")).toHaveAttribute("data-active-step", "3");

    // Exit-hold beat (ADR-030): deep in the runway the step clock reads 5
    // while the LAST service stays active — an unclamped step would wrap
    // the readout back to Advisory (the bug the clamps kill).
    expect(await scrollServicesRunway(page, 0.95)).toBe(true);
    await page.waitForTimeout(1200);
    await expect(page.locator(".services-stage")).toHaveAttribute("data-active-step", "5");
    await expect(page.locator(".services-readout")).toContainText("WORKSHOP");
  });

  test("desktop: wheel over the instrument snaps beats; below the band it scrolls on", async ({
    page,
  }) => {
    test.skip(!isDesktopViewport(page), "ring wheel is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });
    expect(await scrollServicesRunway(page, 0.3)).toBe(true);
    // Park + texture bakes settle before the wheel hook engages.
    await page.waitForTimeout(4000);

    // Wheel with the pointer ON the instrument → one beat per gesture.
    await page.mouse.move(720, 400);
    await page.mouse.wheel(0, 140);
    await expect(page.locator(".services-readout")).toContainText("EMBEDDED", {
      timeout: 10_000,
    });
    await expect(page.locator(".services-stage")).toHaveAttribute("data-active-step", "2");

    // Pointer BELOW the instrument band → wheel stays native page scroll.
    await page.waitForTimeout(900); // let the snap scroll settle
    const heldY = await page.evaluate(() => window.scrollY);
    await page.mouse.move(720, 830);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(800);
    const movedY = await page.evaluate(() => window.scrollY);
    expect(movedY).toBeGreaterThan(heldY);
  });

  test("regenerated service photos resolve (embedded/workshop.webp 404 regression)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const statuses = await page.evaluate(async () => {
      const urls = [
        "/images/services/strategic.webp",
        "/images/services/keynote.webp",
        "/images/services/embedded.webp",
        "/images/services/workshop.webp",
        "/images/services/strategic.jpg",
      ];
      return Promise.all(
        urls.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "no-cache" });
            return `${url}:${res.status}`;
          } catch {
            return `${url}:0`;
          }
        })
      );
    });
    for (const status of statuses) {
      expect(status.endsWith(":200"), status).toBe(true);
    }
  });

  test("orbit lab mounts exactly one WebGL canvas, sized to the stage", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "the orbit lab is a desktop look-dev surface");

    await page.goto("/test/services-orbit", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("canvas", { timeout: 15_000 });
    // Texture bakes (fonts + photos) take a moment.
    await page.waitForTimeout(2500);

    const canvases = page.locator("canvas");
    await expect(canvases).toHaveCount(1);
    const size = await canvases.first().evaluate((c: HTMLCanvasElement) => [c.width, c.height]);
    expect(size[0]).toBeGreaterThan(400); // not the 300x150 default buffer
    expect(size[1]).toBeGreaterThan(200);
  });

  test("mobile/tablet: the plate accordion is untouched by ring mode", async ({ page }) => {
    test.skip(isDesktopViewport(page), "accordion path is <961px");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });
    await page.evaluate(() => {
      document.querySelector(".services-stage")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(800);

    // All four plates present and flowing (racks dissolve to contents).
    await expect(page.locator(".svc-plate")).toHaveCount(4);
    // No ring overlays mount below the desktop gate.
    await expect(page.locator(".svc-ring-hits")).toHaveCount(0);
  });

  test("reduced motion keeps the accordion and mounts no ring overlays", async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });
    await page.evaluate(() => {
      document.querySelector(".services-stage")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(800);

    await expect(page.locator(".svc-plate")).toHaveCount(4);
    await expect(page.locator(".svc-ring-hits")).toHaveCount(0);
    await context.close();
  });
});
