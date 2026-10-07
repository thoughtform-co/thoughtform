#!/usr/bin/env node
/**
 * capture-sessions — stills of /home-sessions (ADR-150).
 *
 * The page is its own composition, not a sheet, so the subpages capture
 * cannot settle on it (it waits on `.sh-root[data-sh-ready]`). This walks the
 * page with REAL wheel steps so every one-shot reveal fires, waits on the
 * page's own stamp, and shoots the first screen, one still per section and
 * the morning's dial at its second step, per viewport and theme.
 *
 *   node scripts/capture-sessions.mjs --wave sessions-01 --vp 1280x720,1920x1247 --themes dark,light
 *   node scripts/capture-sessions.mjs --vp 390x844 --themes dark --port 3003
 *
 * Writes `test-results/sessions/<wave>/` (gitignored) and prints one JSON
 * line per cell: the stamp, the dial's step readings, the page's width
 * against the viewport's, and any page error.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "playwright";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const WAVE = arg("wave", "sessions-local");
const VPS = arg("vp", "1280x720,1920x1247").split(",");
const THEMES = arg("themes", "dark,light").split(",");
const PORT = arg("port", process.env.PORT || "3003");
const OUT = join(process.cwd(), "test-results", "sessions", WAVE);
const SECTIONS = ["the-morning", "dates", "field", "the-table", "reserve"];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
let failed = false;

for (const vpArg of VPS) {
  const [w, h] = vpArg.split("x").map(Number);
  for (const theme of THEMES) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
    await page.goto(`http://localhost:${PORT}/home-sessions?theme=${theme}`, {
      waitUntil: "networkidle",
      timeout: 120_000,
    });
    // ⚠ the stamp carries values only the page can produce (faces, sections, rail)
    await page.waitForSelector(".hs-root[data-hs-ready]", { timeout: 60_000 });
    await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += Math.round(h / 3)) {
      await page.mouse.wheel(0, Math.round(h / 3));
      await page.waitForTimeout(50);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1400);
    const tag = `${vpArg}-${theme}`;
    await page.screenshot({ path: join(OUT, `00-hero-${tag}.png`) });
    for (const [i, id] of SECTIONS.entries()) {
      await page.evaluate((id) => {
        const el = document.querySelector(`[data-hs-section="${id}"]`);
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
      }, id);
      await page.waitForTimeout(900);
      await page.screenshot({
        path: join(OUT, `${String(i + 1).padStart(2, "0")}-${id}-${tag}.png`),
      });
    }
    const steps = [];
    const n = await page.locator(".hs-step").count();
    for (let i = 0; i < n; i++) {
      await page.evaluate((i) => {
        const r = document.querySelectorAll(".hs-step")[i].getBoundingClientRect();
        window.scrollTo(0, window.scrollY + r.top + r.height / 2 - window.innerHeight / 2);
      }, i);
      await page.waitForTimeout(600);
      steps.push(await page.getAttribute("#the-morning", "data-step"));
      if (i === 1) await page.screenshot({ path: join(OUT, `01b-dial-step2-${tag}.png`) });
    }
    const row = {
      cell: tag,
      ready: await page.getAttribute(".hs-root", "data-hs-ready"),
      steps,
      sideways: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      errors,
    };
    if (row.sideways || errors.length || steps.join("") !== [...Array(n).keys()].join(""))
      failed = true;
    console.log(JSON.stringify(row));
    await ctx.close();
  }
}
await browser.close();
console.log(`stills: ${OUT}`);
process.exit(failed ? 1 : 0);
