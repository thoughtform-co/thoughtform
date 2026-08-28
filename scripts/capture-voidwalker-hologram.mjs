/**
 * capture-voidwalker-hologram — the ADR-082 character stage at the AZEROTH era,
 * in both themes, on the real landing.
 *
 * The station's hologram mode only arms at `min-width: 1101px` with motion
 * allowed and a live corridor, so this is HEADED by default (`--headless` for
 * the DOM alone) and walks the scroll rather than teleporting, the way every
 * other capture on this surface does — the corridor-exit clocks read travel.
 *
 * ⚠ The alpha branch is a DECODE PROBE at mount (`holoAlphaSupport`), so the
 * `data-holo-alpha` attribute is what says whether the WebM or the opaque
 * H.264 floor is on screen. Chromium answers yes; the report prints it because
 * a capture that silently fell back to the floor looks fine on black and is
 * the whole failure mode over parchment.
 *
 * Usage (dev server must already be running):
 *   node scripts/capture-voidwalker-hologram.mjs [--port 3003] [--vp 1440x900]
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/voidwalker-hologram");
const ERA = argOf("--era", "azeroth");
const HEADLESS = args.includes("--headless");
const [VW, VH] = argOf("--vp", "1440x900").split("x").map(Number);

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: HEADLESS });
const report = [];

for (const theme of ["dark", "light"]) {
  const ctx = await browser.newContext({
    viewport: { width: VW, height: VH },
    reducedMotion: "no-preference",
    colorScheme: theme,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(`http://localhost:${PORT}/?theme=${theme}`, { waitUntil: "load" });
  await page.waitForTimeout(2500);

  const station = page.locator("#voidwalker");
  await station.waitFor({ state: "attached", timeout: 30000 });

  // Real steps of ≤ .5vh so every scroll-driven clock sees the travel.
  await page.evaluate(async () => {
    const target = document.querySelector("#voidwalker");
    const step = window.innerHeight * 0.5;
    const stop = () => target.getBoundingClientRect().top + window.scrollY;
    while (window.scrollY < stop() - window.innerHeight * 0.1) {
      window.scrollTo(0, window.scrollY + step);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    await new Promise((r) => setTimeout(r, 400));
  });
  await page.waitForTimeout(1500);

  const tab = page.locator(`[data-vwh-era-tab="${ERA}"]`);
  if (await tab.count()) {
    await tab.first().click();
    await page.waitForTimeout(1800);
  }

  const state = await page.evaluate(() => {
    const sheet = document.querySelector("[data-vwh-region='character-sheet']");
    const video = document.querySelector("[data-vwh-region='figure'] video");
    const img = document.querySelector("[data-vwh-region='figure'] img");
    const alphaHost = document.querySelector("[data-holo-alpha]");
    return {
      era: sheet?.getAttribute("data-vwh-era") ?? null,
      mode: document.querySelector("[data-vw-mode]")?.getAttribute("data-vw-mode") ?? null,
      alpha: alphaHost?.getAttribute("data-holo-alpha") ?? null,
      videoSources: video ? [...video.querySelectorAll("source")].map((s) => s.src) : [],
      videoCurrentSrc: video?.currentSrc ?? null,
      posterSrc: img?.currentSrc ?? video?.poster ?? null,
      videoReadyState: video?.readyState ?? null,
      paused: video?.paused ?? null,
    };
  });

  const path = `${OUT}/${VW}x${VH}_${theme}_${ERA}.png`;
  await page.screenshot({ path });
  const figure = page.locator("[data-vwh-region='figure']").first();
  if (await figure.count()) {
    await figure.screenshot({ path: `${OUT}/${VW}x${VH}_${theme}_${ERA}_figure.png` });
  }

  report.push({ theme, path, ...state, errors });
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(report, null, 2));
