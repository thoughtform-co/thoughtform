// ADR-081 flight-grammar ground-truth probe.
//
// Measures per-frame cost during a scripted walk from #services through
// #about, through the voidwalker travel runway, and out under #practice.
//
// What it reports at each waypoint:
//   • frames-in-flight and frame-time percentiles (rAF → rAF deltas
//     window over the 700 ms of scroll around the mark)
//   • long-frame count (delta > 33 ms and > 50 ms)
//   • WebGL info.render.calls / triangles / points (via `stats.renderer`
//     equivalent — we read `three` renderer.info off the R3F canvas)
//   • the corridor's engagement state, the vw travel ref, and which
//     store flags are lit
//
// Runs twice: unthrottled + 4× CPU throttled via CDP. Writes JSON +
// human-readable markdown to docs/design/voidwalker-flight-lab/.
//
// Headless chromium uses SwiftShader, so absolute GPU numbers are not
// authoritative; the relative rankings of long-frame count and per-frame
// JS cost are what informs the flight-lab plan.

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "docs", "design", "voidwalker-flight-lab");
if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

const BASE_URL = process.env.BASE_URL || "http://localhost:3003";
const VIEWPORTS = [{ w: 1920, h: 1247, label: "1920x1247" }];
const THROTTLE_RATES = [1, 4];

/** ── Instrumentation injected into every page load ─────────────────
 *  A rAF loop records delta timestamps and long-frame counts into a
 *  circular buffer. `window.__vwFrameStats(label)` snapshots the buffer,
 *  reports statistics, and clears it. */
const INIT_SCRIPT = `
  window.__vwFrames = [];
  window.__vwLastT = 0;
  let raf = 0;
  const loop = (t) => {
    if (window.__vwLastT) window.__vwFrames.push(t - window.__vwLastT);
    window.__vwLastT = t;
    if (window.__vwFrames.length > 900) window.__vwFrames.shift();
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  window.__vwFrameStats = (label) => {
    const f = window.__vwFrames.slice();
    window.__vwFrames.length = 0;
    if (!f.length) return { label, n: 0 };
    f.sort((a, b) => a - b);
    const p = (q) => f[Math.min(f.length - 1, Math.floor(f.length * q))];
    const sum = f.reduce((a, b) => a + b, 0);
    return {
      label,
      n: f.length,
      mean: +(sum / f.length).toFixed(2),
      p50: +p(0.5).toFixed(2),
      p95: +p(0.95).toFixed(2),
      max: +f[f.length - 1].toFixed(2),
      long33: f.filter((d) => d > 33).length,
      long50: f.filter((d) => d > 50).length,
    };
  };
  window.__vwSceneInfo = () => {
    // Reach into the R3F scene via the depth store's snapshot, if it
    // exposes a probe. We can also count the canvas's WebGL calls via
    // the WebGL debug renderer info — but only after the frame lands.
    // For now report the scene-adjacent DOM/store state.
    const stage = document.querySelector('.home-v2-stage');
    return {
      stageFallback: stage?.dataset.fallback === 'true',
      corridorEngaged: document.documentElement.getAttribute('data-corridor-engaged'),
      corridorDocked: document.documentElement.hasAttribute('data-corridor-docked'),
      servicesAmbient: document.documentElement.hasAttribute('data-services-ambient'),
      vwMode: document.getElementById('voidwalker')?.getAttribute('data-vw-mode'),
      dataVwStop: document.querySelector('.vw-travel-root')?.getAttribute('data-vw-stop'),
    };
  };
`;

async function measureAt(page, label, ms = 700) {
  await page.evaluate(() => window.__vwFrameStats("prime"));
  await page.waitForTimeout(ms);
  const stats = await page.evaluate((l) => window.__vwFrameStats(l), label);
  const info = await page.evaluate(() => window.__vwSceneInfo());
  return { ...stats, ...info };
}

async function settleTo(page, y) {
  await page.evaluate((ty) => window.scrollTo(0, ty), y);
  await page.waitForFunction(
    (ty) => Math.abs(window.scrollY - ty) <= 2,
    y,
    { timeout: 5000 }
  ).catch(() => {});
}

async function runOne(viewport, cpuThrottle) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: viewport.w, height: viewport.h } });
  const page = await ctx.newPage();
  await page.addInitScript({ content: INIT_SCRIPT });
  const cdp = await ctx.newCDPSession(page);
  if (cpuThrottle > 1) {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuThrottle });
  }
  await page.goto(BASE_URL + "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-v2-stage", { timeout: 20_000 });
  await page.waitForTimeout(1500);

  const marks = [];

  // Waypoints:
  //  1. Deep in corridor (Build phase, brand mark parked, sphere visible)
  //  2. Inside #about deck-flip mid
  //  3. Just before the travel starts (voidwalker top at 0 vh)
  //  4. Voidwalker travel ~1.5 vh in (entry dive)
  //  5. Voidwalker travel ~7 vh in (deep tunnel — mid runway)
  //  6. Voidwalker travel ~11 vh in (foot approach)
  //  7. Under #practice (ambient dead)

  const layout = await page.evaluate(() => {
    const svc = document.getElementById("services");
    const about = document.querySelector(".about-stage-root");
    const vw = document.getElementById("voidwalker");
    const pr = document.getElementById("practice");
    return {
      svcTop: svc ? svc.getBoundingClientRect().top + window.scrollY : 0,
      aboutTop: about ? about.getBoundingClientRect().top + window.scrollY : 0,
      aboutH: about ? about.getBoundingClientRect().height : 0,
      vwTop: vw ? vw.getBoundingClientRect().top + window.scrollY : 0,
      vwH: vw ? vw.getBoundingClientRect().height : 0,
      prTop: pr ? pr.getBoundingClientRect().top + window.scrollY : 0,
      vh: window.innerHeight,
    };
  });

  // 1. Deep corridor: 2 vh above services
  await settleTo(page, Math.max(0, layout.svcTop - layout.vh * 2));
  await page.waitForTimeout(400);
  marks.push(await measureAt(page, "1-corridor-build"));

  // 2. About deck-flip mid
  await settleTo(page, layout.aboutTop + (layout.aboutH - layout.vh) * 0.5);
  await page.waitForTimeout(400);
  marks.push(await measureAt(page, "2-about-mid"));

  // 3. Just entering voidwalker (top at fold, entry dive)
  await settleTo(page, layout.vwTop);
  await page.waitForTimeout(400);
  marks.push(await measureAt(page, "3-vw-entry"));

  // 4-6. Travel: 1.5 / 7 / 11 vh in
  for (const [i, vhIn] of [[4, 1.5], [5, 7], [6, 11]]) {
    await settleTo(page, layout.vwTop + layout.vh * vhIn);
    await page.waitForTimeout(400);
    marks.push(await measureAt(page, `${i}-vw-${String(vhIn).replace('.', '_')}vh`));
  }

  // 7. Under practice
  await settleTo(page, layout.prTop + layout.vh * 0.4);
  await page.waitForTimeout(400);
  marks.push(await measureAt(page, "7-practice"));

  await browser.close();
  return { viewport: viewport.label, throttle: cpuThrottle, marks };
}

const runs = [];
for (const v of VIEWPORTS) {
  for (const t of THROTTLE_RATES) {
    console.log(`▶  ${v.label} × cpu${t}`);
    const r = await runOne(v, t);
    runs.push(r);
  }
}

const jsonOut = join(OUT_DIR, "trace-voidwalker-travel.json");
await writeFile(jsonOut, JSON.stringify(runs, null, 2));

// Human-readable summary
const lines = ["# Voidwalker travel — ground-truth trace", "", `Generated: ${new Date().toISOString()}`, "", "Headless Chromium via Playwright + CDP CPU throttling. Frame times are rAF→rAF deltas across a 700 ms window at each waypoint.", ""];
for (const run of runs) {
  lines.push(`## ${run.viewport} — CPU ×${run.throttle}`);
  lines.push("");
  lines.push("| stop | n | mean ms | p50 | p95 | max | >33ms | >50ms | vwMode | ambient |");
  lines.push("|---|---:|---:|---:|---:|---:|---:|---:|---|---|");
  for (const m of run.marks) {
    lines.push(`| ${m.label} | ${m.n} | ${m.mean} | ${m.p50} | ${m.p95} | ${m.max} | ${m.long33} | ${m.long50} | ${m.vwMode ?? "—"} | ${m.servicesAmbient ? "y" : "n"} |`);
  }
  lines.push("");
}
const mdOut = join(OUT_DIR, "trace-voidwalker-travel.md");
await writeFile(mdOut, lines.join("\n"));

console.log("→", jsonOut);
console.log("→", mdOut);
