/**
 * capture-proof-mobile — the ADR-083 phone Proof instrument.
 *
 * At <=960px the casefile drops out of the scroll-driven runway into the
 * static flow with the BRIEF/PROOF/ARTIFACT mode switch and the four-stop
 * case rail; the desktop Directory stays mounted for state parity but is
 * visually retired. We capture at 320×568, 390×844 and the 960px boundary,
 * per the ADR's verification matrix.
 *
 * Usage: node scripts/capture-proof-mobile.mjs [--out docs/design/...] [--theme dark|light]
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/proof-pass/before/mobile");
const THEME = argOf("--theme", "dark");

const VIEWPORTS = [
  { w: 320, h: 568, tag: "320x568" },
  { w: 390, h: 844, tag: "390x844" },
  { w: 960, h: 900, tag: "960x900" },
];

const MODES = ["brief", "proof", "artifact"];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: false });

try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 2,
      isMobile: vp.w <= 480,
      hasTouch: vp.w <= 480,
      colorScheme: THEME === "light" ? "light" : "dark",
      reducedMotion: "no-preference",
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto(`http://localhost:${PORT}/${THEME === "light" ? "?theme=light" : ""}`, {
      waitUntil: "domcontentloaded",
    });
    /* On <=960px the casefile is in the static document with no runway; we
       just scroll it into view. */
    await page.waitForSelector(".fl-case", { timeout: 30_000 });
    await page.evaluate(() => {
      const el = document.querySelector(".fl-case");
      el?.scrollIntoView({ block: "start", behavior: "instant" });
    });
    await page.waitForTimeout(700);

    /* Capture the full case as it sits, then each mode + first two cases as
       state samples. The case rail lives under `.fl-mobile-rail`; the mode
       switch under `.fl-mobile-views`. */
    await page.locator(".fl-case").screenshot({
      path: `${OUT}/${vp.tag}_${THEME}_full.png`,
    });

    for (const mode of MODES) {
      const modeBtn = page.locator(`.fl-mobile-views button[data-view="${mode}"]`).first();
      if ((await modeBtn.count()) === 0) continue;
      await modeBtn.click({ force: true });
      await page.waitForTimeout(400);
      await page.locator(".fl-case").screenshot({
        path: `${OUT}/${vp.tag}_${THEME}_${mode}.png`,
      });
    }

    /* Rail: click case 2 (the tools track by convention) to sample a non-map
       artifact seat under the current mode. */
    const rail = page.locator(".fl-mobile-rail button").nth(1);
    if ((await rail.count()) > 0) {
      await rail.click({ force: true });
      await page.waitForTimeout(400);
      await page.locator(".fl-case").screenshot({
        path: `${OUT}/${vp.tag}_${THEME}_case2.png`,
      });
    }

    const observed = await page.evaluate(() => {
      const case_ = document.querySelector(".fl-case");
      const seat = document.querySelector(".fl-mobile-stage, .fl-mobile-view, .fl-panel");
      const rail = document.querySelector(".fl-mobile-rail");
      const mode = document.querySelector(".fl-mobile-views");
      return {
        caseBox: case_
          ? `${Math.round(case_.getBoundingClientRect().width)}x${Math.round(case_.getBoundingClientRect().height)}`
          : null,
        seatBox: seat
          ? `${Math.round(seat.getBoundingClientRect().width)}x${Math.round(seat.getBoundingClientRect().height)}`
          : null,
        railH: rail ? Math.round(rail.getBoundingClientRect().height) : null,
        modeH: mode ? Math.round(mode.getBoundingClientRect().height) : null,
        directoryHidden: (() => {
          const dir = document.querySelector(".fl-dir");
          if (!dir) return "absent";
          const cs = getComputedStyle(dir);
          return cs.display === "none" || cs.visibility === "hidden" ? "hidden" : "visible";
        })(),
      };
    });
    console.log(`${vp.tag} ${THEME}: ${JSON.stringify(observed)}`);
    if (errors.length) console.log(`  errors: ${errors.join(" | ")}`);

    await ctx.close();
  }
  console.log(`stills in ${OUT}/`);
} finally {
  await browser.close();
}
