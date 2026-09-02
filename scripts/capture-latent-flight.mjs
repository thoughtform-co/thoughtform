/**
 * capture-latent-flight — drives `/test/latent-flight`, gates the vista, and
 * captures the review stills.
 *
 * ⚠ HEADED, AND THAT IS NOT OPTIONAL. The page is WebGL: a headless Chromium
 * falls back to SwiftShader or no GL at all, and the honest failure mode is
 * not an error — it is a black canvas that passes every DOM assertion. The
 * in-app browser pane cannot verify it either: its requestAnimationFrame
 * never fires, so the engine renders its first frames and then holds.
 *
 * Gates (each a number in the report, each a hard failure):
 *   loop alive     `.lf-stage[data-lf-frame]` differs 400 ms apart
 *   rails          two `.hud__rail`, thirteen ticks each, unclipped,
 *                  inside the viewport, `--hero-lift` = 1
 *   non-black      `window.__latentFlight.samplePixels()` — mean luminance
 *                  > 4/255, ≥ 40 distinct values, a near-white maximum (the
 *                  bloomed core)
 *   the pulse      wait for `pulsar().crossing` > 0.8, then a gold-dominant
 *                  pixel within 48 px of the star's projected anchor
 *   page errors    none
 *
 * Usage (the worktree's dev server must be running on --port):
 *   node scripts/capture-latent-flight.mjs [--port 3004] [--out DIR]
 *                                          [--vps 1600x1000,1280x800]
 */

import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3004");
const OUT = argOf("--out", "docs/design/latent-flight");
const VPS = argOf("--vps", "1600x1000,1280x800")
  .split(",")
  .map((s) => s.split("x").map(Number));

const IGNORED_ERROR = /upgrade-insecure-requests' is ignored when delivered in a report-only/;

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: false,
  args: ["--enable-gpu", "--use-gl=angle", "--ignore-gpu-blocklist"],
});

const failures = [];
const rows = [];

for (const [width, height] of VPS) {
  const tag = `${width}x${height}`;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !IGNORED_ERROR.test(m.text())) errors.push(m.text());
  });

  const url = `http://localhost:${PORT}/test/latent-flight?capture=1&boot=0`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('.lf[data-ready="1"]', { timeout: 30000 });

  // ── loop alive ─────────────────────────────────────────────────────────
  const f1 = await page.evaluate(() => Number(document.querySelector(".lf-stage")?.dataset.lfFrame));
  await page.waitForTimeout(400);
  const f2 = await page.evaluate(() => Number(document.querySelector(".lf-stage")?.dataset.lfFrame));
  const alive = f2 > f1;
  if (!alive) failures.push(`${tag}: loop not alive (${f1} → ${f2})`);

  // ── rails ──────────────────────────────────────────────────────────────
  const rails = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll(".hud__rail")).map((r) => {
      const b = r.getBoundingClientRect();
      return {
        ticks: r.querySelectorAll(".hud__rail__tick").length,
        clip: getComputedStyle(r).clipPath,
        inside: b.top >= 0 && b.bottom <= innerHeight && b.left >= 0 && b.right <= innerWidth,
        top: Math.round(b.top),
        height: Math.round(b.height),
      };
    });
    return { list, heroLift: document.documentElement.style.getPropertyValue("--hero-lift") };
  });
  if (rails.list.length !== 2) failures.push(`${tag}: expected 2 rails, got ${rails.list.length}`);
  for (const r of rails.list) {
    if (r.ticks !== 13) failures.push(`${tag}: rail has ${r.ticks} ticks, expected 13`);
    if (!/^(none|inset\(0px)/.test(r.clip)) failures.push(`${tag}: rail is clipped: ${r.clip}`);
    if (!r.inside) failures.push(`${tag}: rail outside the viewport`);
  }
  if (rails.heroLift !== "1") failures.push(`${tag}: --hero-lift is "${rails.heroLift}"`);

  // ── the vista still + non-black gate ───────────────────────────────────
  const vista = await page.evaluate(() => window.__latentFlight.samplePixels());
  if (!(vista.mean > 4)) failures.push(`${tag}: mean luminance ${vista.mean.toFixed(2)} ≤ 4`);
  if (!(vista.distinct >= 40)) failures.push(`${tag}: only ${vista.distinct} distinct values`);
  if (!(vista.max > 200)) failures.push(`${tag}: max luminance ${vista.max} — no bloomed core`);
  await page.screenshot({ path: `${OUT}/vista-${tag}.png` });

  // ── the pulse ──────────────────────────────────────────────────────────
  // Gold is counted INSIDE a radius of the star's projected anchor: the
  // aberration fringes every bright star at the pulse, and a "first gold
  // pixel" scan would land on one of those instead.
  const anchors = await page.evaluate(() => window.__latentFlight.anchors());
  const star = anchors.star ?? null;
  const GOLD_RADIUS = 48;
  let pulse = null;
  const t0 = Date.now();
  while (Date.now() - t0 < 4000) {
    const c = await page.evaluate(() => window.__latentFlight.pulsar().crossing);
    if (c > 0.8) {
      pulse = await page.evaluate(
        ({ s, r }) => window.__latentFlight.samplePixels(s ? { x: s[0], y: s[1], r } : undefined),
        { s: star, r: GOLD_RADIUS }
      );
      await page.screenshot({ path: `${OUT}/pulse-${tag}.png` });
      break;
    }
    await page.waitForTimeout(16);
  }
  if (!pulse) failures.push(`${tag}: no crossing > 0.8 within 4 s`);
  else if (!star) failures.push(`${tag}: no star anchor`);
  else if (!(pulse.goldNear > 0))
    failures.push(`${tag}: no gold-dominant pixel within ${GOLD_RADIUS}px of the star at the pulse`);

  // ── the ground stays void ──────────────────────────────────────────────
  // A bloom spread too wide lifted the whole frame to a warm grey once
  // (mean 55/255); the vista's mean must stay near the void.
  if (!(vista.mean < 24)) failures.push(`${tag}: vista mean ${vista.mean.toFixed(1)} — the ground is lifted`);

  const reading = await page.evaluate(() => window.__latentFlight.pulsar());
  if (errors.length) failures.push(`${tag}: page errors: ${errors.join(" | ")}`);

  rows.push({
    tag,
    frames: [f1, f2],
    rails: rails.list,
    heroLift: rails.heroLift,
    vista: { mean: +vista.mean.toFixed(2), distinct: vista.distinct, max: vista.max, gold: vista.gold },
    pulse: pulse && {
      mean: +pulse.mean.toFixed(2),
      max: pulse.max,
      gold: pulse.gold,
      goldNear: pulse.goldNear,
    },
    star,
    pulses: reading.count,
    errors,
  });
  await context.close();
}

await browser.close();
await writeFile(`${OUT}/report.json`, JSON.stringify({ rows, failures }, null, 2));

for (const r of rows) {
  console.log(
    `${r.tag}  frames ${r.frames.join("→")}  rails ${r.rails.map((x) => x.ticks).join("/")}  ` +
      `vista mean ${r.vista.mean} distinct ${r.vista.distinct} max ${r.vista.max}  ` +
      `pulse ${r.pulse ? `gold ${r.pulse.gold} (${r.pulse.goldNear} near the star)` : "MISSED"}  pulses ${r.pulses}`
  );
}
if (failures.length) {
  console.error("\nFAILED:");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log("\nOK — stills in " + OUT);
