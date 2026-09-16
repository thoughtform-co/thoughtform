/**
 * probe-bake-advance — the REAL per-character advance of the faces the
 * services card bakes with, measured on the live page (ADR-110). The back
 * face's fit solver (`lib/services-ring/backFace.ts`) bounds every record
 * with an advance MODEL (`MODEL_ADVANCE_SANS` / `_MONO`); this is where those
 * constants come from, so re-run it before moving either.
 *
 *   PW_CHROMIUM=/opt/pw-browsers/chromium node scripts/probe-bake-advance.mjs
 *
 * Prints, per face, the mean and the max of `measureText(s).width / (len × px)`
 * over the back's own strings (every title, breakdown line and spec value).
 */
import { chromium } from "playwright";

import { SERVICE_PLATES } from "../components/landing/home-v2/services/servicePlateData.ts";

// The sans letters the sentence-case strings, the mono the uppercase
// chrome — measured with their own faces (uppercase in the sans would
// report ~0.7 em and bound nothing the back letters).
const sansStrings = SERVICE_PLATES.flatMap((p) => [
  p.title,
  ...p.breakdown,
  ...Object.values(p.spec),
]);
const monoStrings = SERVICE_PLATES.flatMap((p) => [
  p.chip.toUpperCase(),
  p.ctaLabel.toUpperCase(),
  "01 / WHAT",
  "02 / HOW",
  "PARTICIPANTS",
  "LEAVES WITH",
]);
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PW_CHROMIUM || undefined,
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("http://localhost:3003/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
const out = await page.evaluate(
  async ({ sansList, monoList }) => {
    await Promise.all([
      document.fonts.load('400 40px "PP Neue Montreal"'),
      document.fonts.load('400 30px "PT Mono"'),
      document.fonts.load('700 30px "PT Mono"'),
    ]);
    const ctx = document.createElement("canvas").getContext("2d");
    const ratio = (font, track, s, px) => {
      ctx.font = font;
      ctx.letterSpacing = track;
      return ctx.measureText(s).width / (s.length * px);
    };
    const stat = (rs) => ({
      mean: +(rs.reduce((a, b) => a + b, 0) / rs.length).toFixed(4),
      max: +Math.max(...rs).toFixed(4),
    });
    const sans = sansList.map((s) => ratio('400 40px "PP Neue Montreal"', "0px", s, 40));
    const display = sansList.map((s) => ratio('400 58px "PP Neue Montreal"', "-1.2px", s, 58));
    const mono = monoList.map((s) => ratio('400 34px "PT Mono"', "0px", s, 34));
    const monoBold = monoList.map((s) => ratio('700 34px "PT Mono"', "0px", s, 34));
    return {
      loaded: document.fonts.check('400 40px "PP Neue Montreal"'),
      sans: stat(sans),
      sansDisplay: stat(display),
      mono: stat(mono),
      monoBold: stat(monoBold),
    };
  },
  { sansList: sansStrings, monoList: monoStrings }
);
console.log(JSON.stringify(out, null, 2));
await browser.close();
