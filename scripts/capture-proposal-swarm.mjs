/**
 * capture-proposal-swarm — the swarm across three sections, shot by real
 * scroll at the page's own named stops (`engine/clocks.ts`, `STOPS`): the
 * opening at rest, the hop into the steps, the steps, the hop into the
 * network, the bars, the view drawn back, and every team.
 *
 * The page is asked for a still (`?still=1`): nothing rides the clock, so two
 * shoots of one stop are the same picture. `--twice` shoots everything a
 * second time and says whether they are.
 *
 * Usage (dev server already running):
 *   node scripts/capture-proposal-swarm.mjs --port 3021
 *     [--fly march|drift|rigid] [--n 3|4]
 *     [--sizes 1280x720,1470x830,1920x1247] [--themes dark,light]
 *     [--out docs/design/proposal-swarm/round-01] [--only opening,hop1-40]
 *     [--twice]
 */

import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3021");
const FLY = argOf("--fly", "march");
const N = argOf("--n", "");
const OUT = argOf("--out", "docs/design/proposal-swarm/round-01");
const ONLY = argOf("--only", "").split(",").filter(Boolean);
const SIZES = argOf("--sizes", "1920x1247")
  .split(",")
  .map((s) => s.split("x").map(Number));
const THEMES = argOf("--themes", "dark").split(",");
const TWICE = args.includes("--twice");

const query = new URLSearchParams({ still: "1" });
if (FLY !== "march") query.set("fly", FLY);
if (N) query.set("n", N);
const URL = `http://localhost:${PORT}/test/proposal-swarm?${query}`;

async function shoot(browser, dir) {
  await mkdir(dir, { recursive: true });
  const shot = [];
  for (const theme of THEMES) {
    for (const [w, h] of SIZES) {
      const ctx = await browser.newContext({
        viewport: { width: w, height: h },
        deviceScaleFactor: 1,
        reducedMotion: "no-preference",
      });
      await ctx.addInitScript((t) => {
        try {
          if (t === "light") localStorage.setItem("tf-theme", "light");
          else localStorage.removeItem("tf-theme");
        } catch {}
      }, theme);
      const page = await ctx.newPage();
      page.on("pageerror", (e) => console.log(`! page error: ${e.message}`));
      await page.goto(URL, { waitUntil: "load" });
      await page.waitForSelector("[data-psw-ready]", { timeout: 240000 });
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({
        content:
          "nextjs-portal{display:none!important} html{scroll-behavior:auto!important} *,*::before,*::after{transition:none!important;animation:none!important}",
      });
      // the canvas rebuilds once the faces are in: let it
      await page.waitForTimeout(400);
      const facts = await page.evaluate(() => {
        const t = document.querySelector("[data-psw-ready]");
        return {
          stops: JSON.parse(t.dataset.pswStops ?? "{}"),
          dots: t.dataset.pswDots,
          lattice: t.dataset.pswLattice,
          width: t.dataset.pswWidth,
        };
      });
      console.log(
        `${w}x${h} ${theme} · ${facts.dots} dots · ${facts.lattice} · plate ${facts.width}px`
      );
      for (const [name, y] of Object.entries(facts.stops)) {
        if (ONLY.length && !ONLY.includes(name)) continue;
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        // the readers are rAF-throttled, and one of them re-renders through React
        await page.evaluate(
          () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        );
        // long enough for the corner readout to finish decoding the section's name
        await page.waitForTimeout(900);
        const file = `${name}-${FLY}${N ? `-n${N}` : ""}-${w}x${h}${theme === "light" ? "-light" : ""}.png`;
        await page.screenshot({ path: path.join(dir, file) });
        shot.push(file);
        console.log(`· ${file}`);
      }
      await ctx.close();
    }
  }
  return shot;
}

const browser = await chromium.launch();
const files = await shoot(browser, OUT);
if (TWICE) {
  const again = `${OUT}-again`;
  await shoot(browser, again);
  let bad = 0;
  for (const f of files) {
    const [a, b] = await Promise.all([readFile(path.join(OUT, f)), readFile(path.join(again, f))]);
    if (!a.equals(b)) {
      bad++;
      console.log(`✗ ${f}: the two shoots differ`);
    }
  }
  console.log(bad ? `\n${bad} still(s) differ.` : `\nAll ${files.length} stills identical twice.`);
  process.exitCode = bad ? 1 : 0;
}
await browser.close();
