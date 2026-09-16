/**
 * probe-thesis-frame — the DOM brandmark against the WebGL compass frame,
 * across the Thoughtform dwell on a phone (ADR-018, 2026-09-16 addendum).
 *
 * The frame is drawn in the corridor canvas (`.home-v2-stage__sticky`,
 * `100svh`); the mark is a DOM SVG projected by `useWorldDomTracker`. Both
 * ride the mobile rise and the camera's look-at, so the one invariant is
 * that they share a CENTRE — never that either sits at the cell's centre.
 * The frame has no DOM box, so it is read off a screenshot with every DOM
 * layer hidden: the gold dashed square's bounding box in the frame's
 * middle band. Pre-fix (projectors reading `window.inner*` while the
 * canvas is `100svh`) this printed dy 40.9 / dx 16.0 in emulation; the
 * fixed tree prints |dy| ≤ 2.4, dx 0.5 at 0.04–0.16.
 *
 *   PW_CHROMIUM=/opt/pw-browsers/chromium node scripts/probe-thesis-frame.mjs [fracs]
 *
 * `fracs` is a comma list of RAW stage fractions (default 0.04…0.16). Past
 * ~0.18 the frame dissolves and the mark departs the station — a sample
 * there measures the choreography, not the projection.
 */
import { chromium } from "playwright";
import sharp from "sharp";

const FRACS = (process.argv[2] ?? "0.04,0.07,0.10,0.12,0.14,0.16").split(",").map(Number);
const SHAPES = [
  ["iphone-14", 390, 844],
  ["iphone-14-pro-max", 430, 932],
];
const HIDE =
  ".home-v2-copy-layer, .home-v2-projected-brandmark, .hud, .home-v2-station-headers, .home-v2-readout, .home-v2-mobile-signal";
const TOL = 4;

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
let failures = 0;

for (const [name, width, height] of SHAPES) {
  const page = await browser.newPage({
    viewport: { width, height },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  await page.goto("http://localhost:3003/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-v2-stage");
  await page.waitForTimeout(2500);
  const roll = async (y) => {
    await page.evaluate(async (t) => {
      const step = Math.max(300, innerHeight * 0.5);
      let a = scrollY;
      while (Math.abs(t - a) > step) {
        a += Math.sign(t - a) * step;
        scrollTo(0, a);
        await new Promise((r) => requestAnimationFrame(r));
      }
      scrollTo(0, t);
    }, y);
    await page.waitForTimeout(900);
  };
  const { stageTop, stageH } = await page.evaluate(() => {
    const r = document.querySelector(".home-v2-stage").getBoundingClientRect();
    return { stageTop: r.top + scrollY, stageH: r.height };
  });
  const span = stageH - height;
  console.log(`\n═══ ${name}  ${width}×${height}`);

  for (const frac of FRACS) {
    await roll(Math.round(stageTop + span * frac));
    const mark = await page.evaluate(() => {
      const m = document.querySelector('[data-world-anchor="home-v2.brandmark"]');
      const r = m.getBoundingClientRect();
      return {
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
        alpha: getComputedStyle(m).opacity,
      };
    });
    await page.evaluate((sel) => {
      for (const el of document.querySelectorAll(sel)) el.style.visibility = "hidden";
    }, HIDE);
    await page.waitForTimeout(150);
    const shot = await page.screenshot({ clip: { x: 0, y: 0, width, height } });
    await page.evaluate((sel) => {
      for (const el of document.querySelectorAll(sel)) el.style.visibility = "";
    }, HIDE);
    const { data, info } = await sharp(shot)
      .resize(width, height)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let n = 0;
    for (let y = Math.round(height * 0.14); y < Math.round(height * 0.9); y += 1) {
      for (let x = 20; x < info.width - 20; x += 1) {
        const i = (y * info.width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 120 && g > 90 && b < 110 && r > b + 40) {
          n += 1;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (n < 80) {
      console.log(`   frac ${frac.toFixed(2)}  ⚠ no frame found (n=${n})`);
      failures += 1;
      continue;
    }
    const dx = mark.cx - (minX + maxX) / 2;
    const dy = mark.cy - (minY + maxY) / 2;
    const ok = Math.abs(dx) <= TOL && Math.abs(dy) <= TOL;
    if (!ok) failures += 1;
    console.log(
      `   frac ${frac.toFixed(2)}  frame [${minX},${minY}]–[${maxX},${maxY}] (n=${n})  mark (${mark.cx.toFixed(1)}, ${mark.cy.toFixed(1)}) α ${mark.alpha}  → dx ${dx.toFixed(1)}  dy ${dy.toFixed(1)}  ${ok ? "OK" : "⚠ OFF THE FRAME"}`
    );
  }
  await page.close();
}

await browser.close();
console.log(
  failures ? `\n${failures} finding(s).` : "\nThe mark sits on the frame at every frame."
);
process.exit(failures ? 1 : 0);
