/**
 * probe-corridor-frames — frame-time + style-recalc probe for the corridor
 * journey, segment by segment.
 *
 * This is the harness that found the 2026-07-29 corridor-exit regression
 * (ADR-056 Update 4): the dissipate window was running 89.5 ms/frame with a
 * 236 ms p95 while mid-corridor sat at ~57 ms. It exists so the wave-2 items
 * in `docs/plans/corridor-exit-perf-wave-2.md` can be judged on numbers
 * rather than feel — every one of them is gated on a before/after here.
 *
 * WHAT IT MEASURES, per segment:
 *   - frame deltas from a rAF loop that drives a REAL scroll (16px/frame):
 *     avg / p50 / p95 / max, and the share of frames over 33 ms;
 *   - long-task wall time (PerformanceObserver), the honest "did it stutter"
 *     signal;
 *   - CDP `Performance.getMetrics` deltas normalised per wall-second:
 *     RecalcStyleDuration is the tell for a CSS-var invalidation storm,
 *     LayoutCount for forced synchronous layout.
 *
 * USAGE
 *   Dev (fast, noisy — fine for A/B of one change):
 *     npm run dev
 *     node scripts/probe-corridor-frames.mjs
 *
 *   Prod (the honest numbers — what the ADR quotes):
 *     npm run build && npx next start -p 3010     # never build with dev running
 *     node scripts/probe-corridor-frames.mjs --url http://localhost:3010
 *
 *   Options: --url <origin> --width <px> --height <px> --dpr <n> --runs <n>
 *
 * THREE RULES THIS SCRIPT ENCODES (each one cost a debugging session):
 *   1. Launch with real GPU flags. Default headless is SwiftShader, which
 *      trips `data-fallback="true"` and measures a different corridor.
 *   2. Warm-scroll the whole journey BEFORE measuring anything, then
 *      re-measure the runway rect. The corridor is a lazy chunk; rects taken
 *      before it inflates land tens of px off, which is enough to sit outside
 *      the ADR-056 park gates and read as a decode bug.
 *   3. Drive scroll progressively with two-arg `window.scrollTo(0, y)`. An
 *      instant teleport skips the engagement band and the canvas never wakes.
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const args = process.argv.slice(2);
const opt = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const URL = opt("--url", "http://localhost:3003");
const WIDTH = Number(opt("--width", 1600));
const HEIGHT = Number(opt("--height", 900));
const DPR = Number(opt("--dpr", 2));
const RUNS = Number(opt("--runs", 1));

/** Scroll-drive step, px per animation frame. */
const STEP_PX = 16;

async function probeOnce(run) {
  const browser = await chromium.launch({ args: ["--enable-gpu", "--use-angle=metal"] });
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: DPR,
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForSelector(".home-v2-stage", { timeout: 40_000 });
  await page.waitForTimeout(6000);

  // Rule 3: progressive real scroll, never a teleport.
  const drive = (y) =>
    page.evaluate(async (target) => {
      document.documentElement.style.scrollBehavior = "auto";
      const from = window.scrollY;
      const step = from < target ? 250 : -250;
      for (let v = from; step > 0 ? v < target : v > target; v += step) {
        window.scrollTo(0, v);
        await new Promise((r) => setTimeout(r, 25));
      }
      window.scrollTo(0, target);
    }, y);

  const runwayTop = async () =>
    page.evaluate(() => {
      const el = document.querySelector(".services-stage-root");
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return Math.round(r.top + window.scrollY);
    });

  // Rule 2: warm the whole journey, THEN take the rect that defines segments.
  let top = await runwayTop();
  if (top == null) {
    await browser.close();
    throw new Error("`.services-stage-root` not found — is the corridor mounted?");
  }
  await drive(top + 2400);
  await page.waitForTimeout(1500);
  top = await runwayTop();

  const fallback = await page.evaluate(
    () => document.querySelector(".home-v2-stage")?.dataset.fallback ?? "unset"
  );
  if (fallback === "true" && run === 0) {
    console.warn("⚠  data-fallback=true — no real GPU; numbers are NOT comparable.\n");
  }

  const segments = [
    ["corridor-mid", top - 4200, top - 2800],
    ["dissipate-approach", top - 1400, top],
    ["casefile-dwell", top, top + 1080],
    ["ring-zone", top + 1200, top + 2400],
  ];

  const metrics = async () => {
    const { metrics: m } = await cdp.send("Performance.getMetrics");
    const g = (n) => m.find((x) => x.name === n)?.value ?? 0;
    return {
      style: g("RecalcStyleDuration"),
      layout: g("LayoutDuration"),
      task: g("TaskDuration"),
      styleN: g("RecalcStyleCount"),
      layoutN: g("LayoutCount"),
      ts: g("Timestamp"),
    };
  };

  const rows = [];
  for (const [name, from, to] of segments) {
    await drive(from);
    await page.waitForTimeout(700);
    const m0 = await metrics();
    const stats = await page.evaluate(
      ({ to, step }) =>
        new Promise((resolve) => {
          const deltas = [];
          let long = 0;
          const po = new PerformanceObserver((list) => {
            for (const e of list.getEntries()) long += e.duration;
          });
          try {
            po.observe({ type: "longtask" });
          } catch {
            /* Safari/older Chromium — long-task total stays 0 */
          }
          let last = performance.now();
          const t0 = last;
          const tick = () => {
            const now = performance.now();
            deltas.push(now - last);
            last = now;
            window.scrollBy(0, step);
            if (window.scrollY >= to - 2 || now - t0 > 15_000) {
              po.disconnect();
              deltas.shift(); // first delta straddles the settle wait
              const sorted = [...deltas].sort((a, b) => a - b);
              const q = (p) =>
                sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0;
              resolve({
                frames: deltas.length,
                avg: deltas.reduce((a, b) => a + b, 0) / deltas.length,
                p50: q(0.5),
                p95: q(0.95),
                max: Math.max(...deltas),
                over33: (100 * deltas.filter((d) => d > 33).length) / deltas.length,
                longMs: long,
                wallMs: now - t0,
              });
            } else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
      { to, step: STEP_PX }
    );
    const m1 = await metrics();
    const wall = m1.ts - m0.ts || 1;
    rows.push({
      name,
      ...stats,
      stylePerSec: (m1.style - m0.style) / wall,
      layoutPerSec: (m1.layout - m0.layout) / wall,
      styleN: m1.styleN - m0.styleN,
      layoutN: m1.layoutN - m0.layoutN,
    });
  }

  await browser.close();
  return rows;
}

const all = [];
for (let run = 0; run < RUNS; run++) {
  if (RUNS > 1) console.log(`— run ${run + 1}/${RUNS} —`);
  all.push(await probeOnce(run));
}

// Average across runs, segment by segment.
const merged = all[0].map((_, i) => {
  const set = all.map((r) => r[i]);
  const mean = (k) => set.reduce((a, r) => a + r[k], 0) / set.length;
  return {
    name: set[0].name,
    avg: mean("avg"),
    p50: mean("p50"),
    p95: mean("p95"),
    max: Math.max(...set.map((r) => r.max)),
    over33: mean("over33"),
    longShare: (100 * mean("longMs")) / mean("wallMs"),
    stylePerSec: mean("stylePerSec"),
    layoutN: mean("layoutN"),
  };
});

console.log(`\n${URL}  ${WIDTH}×${HEIGHT} @${DPR}x   ${RUNS} run(s), ${STEP_PX}px/frame\n`);
console.log(
  "segment                 avg     p50     p95     max   >33ms   long   style/s  layouts"
);
for (const r of merged) {
  console.log(
    `${r.name.padEnd(20)} ${r.avg.toFixed(1).padStart(6)}ms ${r.p50.toFixed(1).padStart(6)} ` +
      `${r.p95.toFixed(1).padStart(6)} ${r.max.toFixed(0).padStart(6)} ` +
      `${r.over33.toFixed(0).padStart(5)}% ${r.longShare.toFixed(0).padStart(5)}% ` +
      `${r.stylePerSec.toFixed(2).padStart(8)} ${r.layoutN.toFixed(0).padStart(8)}`
  );
}
console.log(
  "\nBaseline after the 2026-07-29 wave-1 pass (prod, M2, 1600×900 @2x):\n" +
    "  corridor-mid 19.9 · dissipate-approach 39.4 (p95 48.5) · casefile-dwell 24.0 · ring-zone 20.5\n" +
    "Pre-pass, same rig: 56.7 / 89.5 (p95 236) / 75.7 / 34.6.\n"
);
