// Probe: where does the corridor's `navigate` band sit, per viewport?
//
// ⚠ TWO THINGS THIS EXISTS TO RECORD.
//
// 1. The stage is sized in viewport units, so the same scroll `y` lands
//    at a different FRACTION of the corridor on every project. Any smoke
//    that navigates the corridor by a hardcoded pixel count is measuring
//    the viewport, not the corridor.
//
// 2. `data-corridor-phase` is written from the WebGL frameloop off a
//    SMOOTHED scroll value, so it is a LAGGING function of scrollY. A
//    walk that settles on requestAnimationFrame alone never sees the
//    attribute change at all — it reports `thesis` from 0 to the bottom
//    of the stage. Settling costs real milliseconds; `SETTLE_MS` below
//    is the budget that was measured to be enough.
//
//   node scripts/probe-corridor-phase.mjs [settleMs]

import { chromium } from "playwright";

const SETTLE_MS = Number(process.argv[2] ?? 700);

const SHAPES = [
  ["iphone-14", 390, 844],
  ["iphone-14-pro-max", 430, 932],
  ["tablet", 820, 1180],
  ["desktop", 1440, 900],
];

const FRACS = [];
for (let f = 0.2; f <= 0.75; f += 0.05) FRACS.push(+f.toFixed(2));

const browser = await chromium.launch();

for (const [name, width, height] of SHAPES) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto("http://localhost:3003/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);

  const stage = await page.evaluate(() => {
    const el = document.querySelector(".home-v2-stage");
    return el ? Math.round(el.getBoundingClientRect().height) : 9000;
  });

  const seen = [];
  for (const f of FRACS) {
    const y = Math.round(stage * f);
    await page.evaluate(async (target) => {
      const step = Math.max(300, window.innerHeight * 0.5);
      const from = window.scrollY;
      const dir = target > from ? 1 : -1;
      for (let y = from; dir > 0 ? y < target : y > target; y += dir * step) {
        window.scrollTo(0, y);
        await new Promise((r) => requestAnimationFrame(r));
      }
      window.scrollTo(0, target);
    }, y);
    await page.waitForTimeout(SETTLE_MS);
    const phase = await page.evaluate(() =>
      document.documentElement.getAttribute("data-corridor-phase")
    );
    seen.push([f, y, phase]);
  }

  const band = seen.filter(([, , p]) => p === "navigate");
  console.log(
    `${name.padEnd(20)} ${width}x${height}  stage=${stage}  ` +
      `navigate=${band.length ? `${band[0][0]}..${band[band.length - 1][0]}` : "NONE"}`
  );
  console.log("   " + seen.map(([f, y, p]) => `${f}(${y}):${p ?? "-"}`).join("  "));
  await page.close();
}

await browser.close();
