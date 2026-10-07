import { expect, test } from "@playwright/test";

/**
 * ADR-149 Phase 2 — the sheet aliases its tokens to the lattice, and NOTHING
 * MOVES. This is the byte-identity proof: every sheet route at two viewports in
 * both themes, `toHaveScreenshot` at ZERO diff pixels, against baselines
 * recorded at the pre-alias commit.
 *
 *   npx playwright test tests/visual/lattice-parity.spec.ts --project=desktop --update-snapshots   # at the PRE-alias tree
 *   npx playwright test tests/visual/lattice-parity.spec.ts --project=desktop                      # after the aliases
 *
 * ⚠ A COMPARISON'S GUARD GOES WITH THE COMPARISON (ADR-070 U35): this spec and
 * its PNGs are deleted at the Phase 3 ruling. The durable readout is
 * `lattice-alias-readout.spec.ts`, beside it.
 *
 * ⚠ `/arcs` is the owner's page (ADR-117): the gate is open under `next dev`,
 * which is where this runs.
 *
 * ⚠ THE KIT'S FOUR CELLS WERE RE-RECORDED ONCE (2026-10-06, Phase 3): the kit
 * prints a console of every registered knob, so adding the `lattice` knob
 * changed ~1 % of its pixels — the console box alone, read off the diff. The
 * five public routes stayed at zero. A re-record without a diff read is a
 * guard that stopped guarding.
 */

/* `/home-sessions` left the sheet for its own composition (ADR-150), so it
   is no longer a sheet route this parity can speak for. */
/* ⚠ `/arcs` IS NOT HERE, AND THAT IS ARITHMETIC: the instrument reads TODAY
   (the NOW cursor, the "Today" readout) and every new filing, so its pixels
   change daily with no CSS moving — its parity was read on 2026-10-06 and
   recorded in ADR-149; its own smoke is arcs-instrument-smoke. */
const ROUTES = [
  "/arcs/loop",
  "/musings",
  "/musings/navigate-the-intelligence",
  "/test/subpage-kit",
];
const VIEWPORTS: [number, number][] = [
  [1280, 720],
  [1920, 1247],
];
const THEMES = ["dark", "light"] as const;

test.describe("lattice parity — the sheet on the lattice is the sheet (ADR-149)", () => {
  test.describe.configure({ mode: "parallel" });
  for (const route of ROUTES) {
    for (const [w, h] of VIEWPORTS) {
      for (const theme of THEMES) {
        test(`${route} ${w}x${h} ${theme}`, async ({ page }) => {
          await page.setViewportSize({ width: w, height: h });
          await page.emulateMedia({ reducedMotion: "reduce" });
          const url = `${route}${route.includes("?") ? "&" : "?"}theme=${theme}`;
          await page.goto(url);
          await page.locator(".sh-root[data-sh-ready]").waitFor({ timeout: 45_000 });
          // the instrument writes its own observable once the dossier settles
          if (route === "/arcs") {
            await page.locator(".sh-root[data-dos-id]").waitFor({ timeout: 45_000 });
          }
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(600);
          const slug = route.replace(/^\//, "").replace(/[\/?=&]/g, "-") || "root";
          await expect(page).toHaveScreenshot(`${slug}-${w}x${h}-${theme}.png`, {
            fullPage: true,
            animations: "disabled",
            caret: "hide",
            maxDiffPixels: 0,
            timeout: 30_000,
          });
        });
      }
    }
  }
});
