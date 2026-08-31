/**
 * capture-voidwalker-station — shoot `#voidwalker` on the LIVE landing.
 *
 * The lab proves the composition; this proves the STATION — the pin, the
 * handoff targets, the scroll-derived era, and the fact that the corridor's
 * ambient survives behind it. Those exist only on the home page.
 *
 * ⚠ HEADED. Two independent reasons: the corridor is WebGL and headless
 * leaves the canvas dead, and the figure is a `<video>` whose MP4 fallback
 * Playwright's Chromium cannot decode (no H.264) — a headless frame shows a
 * lit projector disc with no figure on it, which reads as a layout bug.
 *
 * ⚠ REAL SCROLLS, NEVER A TELEPORT. The station is a 260svh pinned runway and
 * the era is DERIVED from progress inside it (ADR-082 U10), so `scrollTo` to a
 * single offset lands on whatever era that offset happens to name. This walks
 * the hold in steps and shoots at fractions of the runway.
 *
 * Usage (dev server must already be running):
 *   node scripts/capture-voidwalker-station.mjs [--port 3003]
 *     [--vp 1440x900] [--theme dark|light] [--at 0.2,0.45,0.7] [--out <dir>]
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/era-stage-pass/station");
const THEME = argOf("--theme", "dark");
const [VW, VH] = argOf("--vp", "1440x900").split("x").map(Number);
/** Fractions of the runway's travel. The era band is [0.16, 0.72] of it. */
const STOPS = argOf("--at", "0.22,0.45,0.68").split(",").map(Number);

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: VW, height: VH },
  deviceScaleFactor: 1,
  reducedMotion: "no-preference",
});
const page = await context.newPage();

await page.goto(`http://localhost:${PORT}/?theme=${THEME}`, { waitUntil: "domcontentloaded" });
// The corridor is lazy and inflates layout late; the station selector is the
// honest signal that it has.
await page.waitForSelector("#voidwalker .vw", { timeout: 90_000 });
await page.locator(".home-v2-stage").first().scrollIntoViewIfNeeded().catch(() => {});
await page.waitForTimeout(1200);

const geom = await page.evaluate(() => {
  const runway = document.querySelector("#voidwalker .vw");
  if (!runway) return null;
  const top = runway.getBoundingClientRect().top + window.scrollY;
  return { top, travel: runway.offsetHeight - window.innerHeight };
});
if (!geom || geom.travel <= 0) {
  console.log("  x station has no runway — is the capable gate met at this viewport?");
  await browser.close();
  process.exit(1);
}

let shots = 0;
for (const at of STOPS) {
  const target = Math.round(geom.top + at * geom.travel);
  // Walk in, rather than teleport: the writer smooths, and the era it names
  // depends on where the reader came from (its hysteresis takes a side).
  await page.evaluate(async (to) => {
    const step = 600;
    let y = window.scrollY;
    while (Math.abs(to - y) > step) {
      y += Math.sign(to - y) * step;
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, to);
  }, target);
  await page.waitForTimeout(1400);

  const state = await page.evaluate(() => {
    const root = document.querySelector("#voidwalker .vwd, #voidwalker .vwh");
    const station = document.querySelector("#voidwalker");
    const q = (s) => document.querySelector(s);
    return {
      layout: root?.className.split(" ").find((c) => c === "vwd" || c === "vwh") ?? "(none)",
      era: root?.getAttribute("data-vwh-era") ?? "(none)",
      mode: station?.getAttribute("data-vw-mode") ?? "(none)",
      handoff: station?.getAttribute("data-vw-handoff") ?? "(none)",
      ready: root?.hasAttribute("data-vwh-ready") ?? false,
      targets: {
        portrait: !!q("[data-vwh-handoff-target='portrait']"),
        dossier: !!q("[data-vwh-handoff-target='dossier']"),
        eraTitle: !!q("[data-vwh-handoff-target='era-title']"),
      },
      pinned: (() => {
        const r = root?.getBoundingClientRect();
        return r ? Math.round(r.top) : null;
      })(),
    };
  });

  const name = `${VW}x${VH}_${THEME}_at${String(at).replace("0.", "")}_${state.era}.png`;
  await page.screenshot({ path: `${OUT}/${name}` });
  console.log(`  ok ${name}`);
  console.log(`     ${JSON.stringify(state)}`);
  shots += 1;
}

await context.close();
await browser.close();
console.log(`\ndone - ${shots} shots, ${OUT}/`);
