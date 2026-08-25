// Is the rail layer drawing? Counts GL draw calls by primitive mode.
// Version-independent: hooks drawArrays/drawElements before the scene
// mounts, so LINES-mode draws are unambiguous evidence the rail
// LineSegments is in the graph and being submitted.
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 800 } });
const page = await ctx.newPage();

await page.addInitScript(() => {
  const tally = { LINES: 0, POINTS: 0, TRIANGLES: 0, other: 0 };
  window.__glTally = tally;
  const name = (m) => (m === 1 ? "LINES" : m === 0 ? "POINTS" : m === 4 ? "TRIANGLES" : "other");
  for (const proto of [
    window.WebGLRenderingContext?.prototype,
    window.WebGL2RenderingContext?.prototype,
  ]) {
    if (!proto) continue;
    for (const fn of ["drawArrays", "drawElements", "drawArraysInstanced"]) {
      const orig = proto[fn];
      if (!orig) continue;
      proto[fn] = function (mode, ...rest) {
        tally[name(mode)]++;
        return orig.call(this, mode, ...rest);
      };
    }
  }
});

const THEME = process.argv[2] === "light" ? "light" : "dark";
await page.goto(`http://localhost:3003/?theme=${THEME}`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".home-v2-stage", { timeout: 30000 });
await page.waitForTimeout(2500);

async function walkTo(y) {
  await page.evaluate(async (target) => {
    const step = Math.max(80, window.innerHeight * 0.5);
    const dir = Math.sign(target - window.scrollY) || 1;
    while (Math.abs(target - window.scrollY) > step) {
      window.scrollTo(0, window.scrollY + dir * step);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    window.scrollTo(0, target);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, y);
  await page.waitForTimeout(240);
}

const geom = await page.evaluate(() => {
  const rw = document.querySelector(".vw-travel-root");
  const r = rw?.getBoundingClientRect();
  return { top: r ? r.top + scrollY : 0, h: r ? r.height : 0 };
});

await walkTo(Math.max(0, Math.round(geom.top + (geom.h - 800) * 0.09)));
await page.waitForTimeout(600);

// Reset the tally, then sample exactly one second of travel frames.
await page.evaluate(() => {
  const t = window.__glTally;
  t.LINES = 0;
  t.POINTS = 0;
  t.TRIANGLES = 0;
  t.other = 0;
});
await page.waitForTimeout(1000);

const out = await page.evaluate(() => ({
  tally: window.__glTally,
  entry: getComputedStyle(document.querySelector(".vw-travel-stage") ?? document.body)
    .getPropertyValue("--vw-entry")
    .trim(),
}));
console.log(JSON.stringify(out));
await page.screenshot({
  path: `docs/design/voidwalker-flight-lab/entry-probe/rail-check-${THEME}.png`,
});
await browser.close();
