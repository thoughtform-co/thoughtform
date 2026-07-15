import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Arc Cases Card smoke (ADR-036; phased reveal ADR-041; DOM cue trigger ADR-042).
 *
 * Structural contracts only — the in-canvas card + the node-stream fold are
 * verified visually against the running dev server; the arm/band/phase/layout
 * math is pinned in `tests/lib/arc-cases-*.test.ts`. This suite proves the DOM
 * half:
 *   - the CUE docks UNDER the Build station title (upper viewport, centred) and
 *     only offers itself once the sources/surfaces notes have SETTLED — inert
 *     mid-corridor and while they're still accreting;
 *   - arming fades the stack labels to nothing AND reveals the hit layer, which
 *     requires the CARD's R3F level writer to actually run (both read the
 *     `arcCasesLevelRef` the card writes);
 *   - THE ORDERING (ADR-041): the card has ZERO presence while the node fold is
 *     still running — the hit layer's region rides `cardPresence`, so it must
 *     still be at 0 on the frame the labels have already begun to fade;
 *   - stepping swaps the front slot, CLOSE drains, Escape returns focus to the
 *     cue, and walking out of the band auto-disarms.
 *
 * Unlike the retired ADR-041 sphere sigil, the cue sits at the top of the
 * viewport, clear of the centred card — so it stays visible AND interactive
 * while armed (that is how a second click / Escape closes it).
 *
 * Desktop-only feature (ARC_CASES_MEDIA ≥ 1101×760 + no reduced motion):
 * the mobile/tablet projects assert absence instead.
 */

/** Corridor raw stage progress for the Build park:
 *  paintProgress 0.9225 × EPILOGUE_START (620/820). */
const BUILD_PARK_RAW = 0.9225 * (620 / 820);

/** Mid-Build, while the sources/surfaces are still ACCRETING (paintProgress
 *  0.90 — the stack window is [0.875, 0.95]). The cue must not offer itself
 *  here: the notes are still moving. */
const NOTES_ACCRETING_RAW = 0.9 * (620 / 820);

const CUE = ".home-v2-cases-cue";
const CUE_BTN = ".home-v2-cases-cue__btn";

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

/**
 * Click a re-projected / parallaxed hit target by its box centre.
 *
 * `locator.click()` cannot be relied on: the cue rides the Build header's
 * per-frame gyro parallax, and the baked pager / ✕ hit frame is re-projected
 * every frame with a continuous idle drift, so their bounding boxes never repeat
 * across two animation frames and Playwright's actionability check fails forever
 * with "element is not stable". (That is test strictness, not a usability
 * problem — the drift is sub-pixel.) `page.mouse.click` still routes through the
 * browser's real hit test, so this keeps proving the pointer-events opt-in and
 * the z-order: if anything covered the target, the click would land on that
 * instead and the arm assertions after each call would fail.
 */
async function clickByBox(page: Page, locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

async function clickCue(page: Page) {
  await clickByBox(page, page.locator(CUE_BTN));
}

test.describe("Arc cases card smoke (ADR-036 / ADR-041 / ADR-042)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");
    await page.waitForTimeout(800);
  });

  test("the cue docks under the Build title and waits for the notes to settle", async ({
    page,
  }) => {
    test.skip(!isDesktop(page), "desktop-only feature");
    const cue = page.locator(CUE);
    await expect(cue).toHaveCount(1);

    // The trigger is NOT the retired ADR-035 chip dock (that never returned).
    await expect(page.locator(".home-v2-cases-cta-dock")).toHaveCount(0);

    // Mid-corridor (Encode-ish): inert.
    await scrollToStageProgress(page, 0.45);
    await expect(cue).toHaveAttribute("inert", "");

    // Still inert while the sources/surfaces are ACCRETING — the reveal must
    // not be armable before the notes have landed (ADR-041).
    await scrollToStageProgress(page, NOTES_ACCRETING_RAW);
    await expect(cue).toHaveAttribute("inert", "");

    // Build park: the notes have settled — the cue is live and armable.
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(700);
    await expect(cue).not.toHaveAttribute("inert", "");
    await expect(cue).toHaveClass(/is-armable/);

    // Docked UNDER the Build title: it projects into the UPPER band of the
    // viewport, horizontally centred with the header.
    const box = await page.locator(CUE_BTN).boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    if (box && viewport) {
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      expect(Math.abs(cx - viewport.width / 2)).toBeLessThan(viewport.width * 0.18);
      expect(cy).toBeLessThan(viewport.height * 0.3);
    }
  });

  test("arming fades the stack labels and reveals the hit layer", async ({ page }) => {
    test.skip(!isDesktop(page), "desktop-only feature");
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(800);

    const cue = page.locator(CUE);
    const stepper = page.locator("#arc-cases-terminal");
    await expect(stepper).toHaveCount(1);

    await clickCue(page);
    await expect(cue).toHaveAttribute("data-armed", "true");
    await expect(page.locator(CUE_BTN)).toHaveAttribute("aria-expanded", "true");
    await expect(stepper).toHaveAttribute("data-open", "true");

    // The stepper drops `inert` once cardPresence passes the arrive threshold —
    // proving the CARD's R3F level-writer useFrame is alive.
    await expect(stepper).not.toHaveAttribute("inert", "", { timeout: 5000 });
    await expect(stepper).toBeVisible();

    // The stack labels disappear on the shared arm level.
    const stackChip = page.locator('.home-v2-stack-item[data-stack-side="sources"]').first();
    await expect
      .poll(async () => Number(await stackChip.evaluate((el) => getComputedStyle(el).opacity)), {
        timeout: 5000,
      })
      .toBeLessThan(0.05);

    // Unlike the sigil, the cue sits at the top of the viewport, clear of the
    // centred card — so it stays visible AND interactive while armed (a second
    // click / Escape closes it, and Escape can return focus to it).
    await expect(cue).not.toHaveAttribute("inert", "");
    await expect(cue).toBeVisible();
    expect(await page.locator(CUE_BTN).evaluate((el) => getComputedStyle(el).pointerEvents)).toBe(
      "auto"
    );
  });

  // THE ORDERING INVARIANT (ADR-041) — the reason the phase split exists.
  // The stepper's opacity IS `cardPresence`, so sampling it while the labels
  // are mid-fade proves the card has not begun while the nodes are still
  // folding.
  //
  // Each sample is TIME-STAMPED and the assertion is scoped to the fold window
  // rather than to a fixed sample count: the fold completes when the damped arm
  // level reaches ARC_FOLD_DONE (0.62), i.e. −ln(1 − 0.62) / ARC_ARM_RATE(2.2)
  // ≈ 440 ms. A fixed 5×90 ms probe straddled that edge and caught the card's
  // very first frame (0.004) — a probe artifact, not a violation. FOLD_WINDOW_MS
  // keeps a margin below the real boundary so scheduling jitter can't flake it.
  test("ORDERING: the card has zero presence while the nodes are still folding", async ({
    page,
  }) => {
    test.skip(!isDesktop(page), "desktop-only feature");
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(800);

    /** Safely inside the ~440 ms fold; see the note above. */
    const FOLD_WINDOW_MS = 360;

    const trace = await page.evaluate(async () => {
      const btn = document.querySelector<HTMLElement>(".home-v2-cases-cue__btn");
      const stepper = document.querySelector<HTMLElement>("#arc-cases-terminal");
      const label = document.querySelector<HTMLElement>(
        '[data-world-anchor="intelligence.sourcesLabel"]'
      );
      if (!btn || !stepper || !label) return [];
      const samples: { ms: number; cardPresence: number; label: number }[] = [];
      const t0 = performance.now();
      btn.click();
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => setTimeout(r, 80));
        samples.push({
          ms: performance.now() - t0,
          cardPresence: Number(stepper.style.opacity || 0),
          label: Number(label.style.opacity || 0),
        });
      }
      return samples;
    });

    const inFold = trace.filter((s) => s.ms < FOLD_WINDOW_MS);
    expect(inFold.length).toBeGreaterThanOrEqual(3);

    // The labels must ACTUALLY be fading (the arm is progressing) …
    expect(trace[trace.length - 1].label).toBeLessThan(trace[0].label);

    // … while the card is still completely absent. The fold owns this stretch.
    for (const sample of inFold) {
      expect(sample.cardPresence).toBe(0);
    }

    // And the card DOES arrive afterwards (the phase split delays it, not kills it).
    await expect
      .poll(
        async () =>
          Number(
            await page
              .locator("#arc-cases-terminal")
              .evaluate((el) => (el as HTMLElement).style.opacity)
          ),
        { timeout: 5000 }
      )
      .toBeGreaterThan(0.9);
  });

  test("stepping + selecting swaps the front slot", async ({ page }) => {
    test.skip(!isDesktop(page), "desktop-only feature");
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(800);

    await clickCue(page);
    await expect(page.locator("#arc-cases-terminal")).toHaveAttribute("data-open", "true");

    const pagers = page.locator(".home-v2-cases-hit__pager");
    await expect(pagers).toHaveCount(4);
    await expect(pagers.nth(0)).toHaveAttribute("aria-pressed", "true");

    // ArrowRight steps the pressed pager forward (the baked card face
    // crossfades in the canvas — not asserted here).
    await page.keyboard.press("ArrowRight");
    await expect(pagers.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(pagers.nth(0)).toHaveAttribute("aria-pressed", "false");

    // Clicking a pager ordinal selects it (box-click — the hit frame is
    // re-projected every frame, so `locator.click()` can't stabilise).
    await clickByBox(page, pagers.nth(3));
    await expect(pagers.nth(3)).toHaveAttribute("aria-pressed", "true");
  });

  test("CLOSE drains the reveal — stepper inert, labels recover, cue disarms", async ({ page }) => {
    test.skip(!isDesktop(page), "desktop-only feature");
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(800);

    const cue = page.locator(CUE);
    const stepper = page.locator("#arc-cases-terminal");
    await clickCue(page);
    await expect(stepper).toHaveAttribute("data-open", "true");
    await expect(stepper).not.toHaveAttribute("inert", "", { timeout: 5000 });

    // The ✕ close lives on the card face — a box-click on its welded hit button.
    await clickByBox(page, page.locator(".home-v2-cases-hit__close"));
    await expect(cue).toHaveAttribute("data-armed", "false");
    await expect(stepper).toHaveAttribute("data-open", "false");
    await expect(stepper).toHaveAttribute("inert", "", { timeout: 5000 });

    // Stack labels recover once the level drains back to 0; the cue stayed live.
    const stackChip = page.locator('.home-v2-stack-item[data-stack-side="sources"]').first();
    await expect
      .poll(async () => Number(await stackChip.evaluate((el) => getComputedStyle(el).opacity)), {
        timeout: 5000,
      })
      .toBeGreaterThan(0.3);
    await expect(cue).not.toHaveAttribute("inert", "");
  });

  test("Escape closes and returns focus to the cue", async ({ page }) => {
    test.skip(!isDesktop(page), "desktop-only feature");
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(800);

    await clickCue(page);
    await expect(page.locator("#arc-cases-terminal")).toHaveAttribute("data-open", "true");

    await page.keyboard.press("Escape");
    await expect(page.locator(CUE)).toHaveAttribute("data-armed", "false");
    // The trigger takes focus back (it stays focusable while armed precisely so
    // this works — see ADR-042).
    expect(
      await page.evaluate(() =>
        document.activeElement?.classList.contains("home-v2-cases-cue__btn")
      )
    ).toBe(true);
  });

  test("walking out of the Build band auto-disarms; re-arming is clean", async ({ page }) => {
    test.skip(!isDesktop(page), "desktop-only feature");
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(800);

    const cue = page.locator(CUE);
    await clickCue(page);
    await expect(cue).toHaveAttribute("data-armed", "true");

    // Scroll back toward Encode — the watcher (owned by the cue) disarms.
    await scrollToStageProgress(page, 0.45);
    await expect(cue).toHaveAttribute("data-armed", "false");

    // Return: clean re-arm.
    await scrollToStageProgress(page, BUILD_PARK_RAW);
    await page.waitForTimeout(700);
    await expect(cue).not.toHaveAttribute("inert", "");
    await clickCue(page);
    await expect(cue).toHaveAttribute("data-armed", "true");
    await clickByBox(page, page.locator(".home-v2-cases-hit__close"));
  });

  test("mobile/tablet never shows the cue or the hit layer", async ({ page }) => {
    test.skip(isDesktop(page), "absence check is for small viewports");
    await scrollToStageProgress(page, BUILD_PARK_RAW);

    // Both self-gate on ARC_CASES_MEDIA (render null off-desktop).
    await expect(page.locator("#arc-cases-terminal")).toHaveCount(0);

    // If the cue is in the DOM at all, the ARC_CASES_MEDIA-mirroring CSS hide
    // must keep it invisible (gate parity).
    const cue = page.locator(CUE);
    if ((await cue.count()) > 0) await expect(cue).toBeHidden();
  });
});
