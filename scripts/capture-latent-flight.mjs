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

  // ── the boot, held at three cues ───────────────────────────────────────
  // `?hold=<cue>` freezes the boot clock at that cue and stamps its identity;
  // the still is the page exactly there, however long the capture takes.
  for (const cue of ["stars-up", "hud-power", "beacon-tag"]) {
    await page.goto(`http://localhost:${PORT}/test/latent-flight?capture=1&hold=${cue}`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector(`.lf[data-ready="1"][data-stamp="boot|hold:${cue}|dark"]`, {
      timeout: 30000,
    });
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${OUT}/boot-${cue}-${tag}.png` });
  }

  // ── the rest state, after a real boot ──────────────────────────────────
  const url = `http://localhost:${PORT}/test/latent-flight?capture=1`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('.lf[data-ready="1"][data-stamp="vista|VISTA|dark"]', {
    timeout: 30000,
  });
  // The log's read-out outlives the boot; let it reach the idle line.
  await page.waitForTimeout(2200);

  // ── the HUD is on and says what it should ──────────────────────────────
  const hud = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const text = (s) => q(s)?.textContent?.trim() ?? null;
    const op = (s) => Number(getComputedStyle(q(s)).opacity);
    return {
      stateWord: text('[data-lf="state-word"]'),
      stateName: text('[data-lf="state-name"]'),
      tele: Array.from(document.querySelectorAll(".lf-tele__v")).map((e) => e.textContent),
      heading: text('[data-lf="heading"]'),
      comms: text('[data-lf="comms"]'),
      beaconV1: text('[data-lf="beacon-v1"]'),
      marksShown: Array.from(document.querySelectorAll("[data-lf-wp]")).filter(
        (e) => !e.hidden && Number(e.style.opacity) > 0.99
      ).length,
      routeHere: q('[data-lf-route][data-state="here"]')?.dataset.lfRoute ?? null,
      opacities: {
        tape: op('[data-lf="tape"]'),
        reticle: op('[data-lf="look"]'),
        keys: op('[data-lf="keys"]'),
        beacon: op('[data-lf="beacon"]'),
      },
      heroLift: document.documentElement.style.getPropertyValue("--hero-lift"),
    };
  });
  if (hud.stateWord !== "VISTA") failures.push(`${tag}: state word "${hud.stateWord}"`);
  if (hud.stateName !== "HOME") failures.push(`${tag}: state name "${hud.stateName}"`);
  if (JSON.stringify(hud.tele) !== JSON.stringify(["000", "01/07", "0.00"]))
    failures.push(`${tag}: telemetry ${JSON.stringify(hud.tele)}`);
  if (hud.beaconV1 !== "LS-01") failures.push(`${tag}: beacon tag "${hud.beaconV1}"`);
  if (hud.marksShown !== 7) failures.push(`${tag}: ${hud.marksShown} waypoint marks shown, expected 7`);
  if (hud.routeHere !== "home") failures.push(`${tag}: route "here" is ${hud.routeHere}`);
  for (const [k, v] of Object.entries(hud.opacities)) if (v < 0.99) failures.push(`${tag}: ${k} at opacity ${v}`);
  if (!hud.comms) failures.push(`${tag}: the log is empty`);

  // ── no label prints through another ────────────────────────────────────
  // The check containment never makes: every visible piece of HUD text,
  // pairwise, against every other. A still showed SERVICES through
  // VOIDWALKER while every geometry gate was green.
  const overlaps = await page.evaluate(() => {
    const sel =
      ".lf-wp__label, .lf-tag__k, .lf-tag__v, .lf-state, .lf-tape__box, .lf-tele, .lf-meter, .lf-comms, .lf-key, .lf-route";
    const boxes = Array.from(document.querySelectorAll(sel))
      .filter((e) => {
        const cs = getComputedStyle(e);
        if (cs.visibility === "hidden" || Number(cs.opacity) < 0.5) return false;
        let p = e;
        while (p) {
          if (p.hidden || (p.style && Number(p.style.opacity || 1) < 0.5)) return false;
          p = p.parentElement;
        }
        return true;
      })
      .map((e) => ({ name: (e.textContent || e.className).trim().slice(0, 24), r: e.getBoundingClientRect() }))
      .filter((b) => b.r.width > 0 && b.r.height > 0);
    const out = [];
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].r;
        const b = boxes[j].r;
        const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (x > 1 && y > 1) out.push(`${boxes[i].name} × ${boxes[j].name}`);
      }
    return out;
  });
  if (overlaps.length) failures.push(`${tag}: label overlap: ${overlaps.join("; ")}`);

  // ── the rest state still, before anything is touched ───────────────────
  await page.screenshot({ path: `${OUT}/rest-${tag}.png` });

  // ── a lock, by key ─────────────────────────────────────────────────────
  await page.keyboard.press("4");
  await page.waitForTimeout(700);
  const lock = await page.evaluate(() => ({
    target: document.querySelector('[data-lf="target"]')?.hidden === false,
    tag: document.querySelector('[data-lf="target-v1"]')?.textContent,
    range: document.querySelector('[data-lf="target-v2"]')?.textContent,
    pressed: document.querySelector('[data-lf-route="proof"]')?.getAttribute("aria-pressed"),
    live: document.querySelector('[data-lf="live"]')?.textContent,
  }));
  if (!lock.target) failures.push(`${tag}: no lock designator after pressing 4`);
  if (lock.tag !== "PROOF") failures.push(`${tag}: lock tag "${lock.tag}"`);
  if (lock.range !== "0.51") failures.push(`${tag}: lock range "${lock.range}"`);
  if (lock.pressed !== "true") failures.push(`${tag}: route mark not aria-pressed`);
  if (!/Locked: Proof/.test(lock.live ?? "")) failures.push(`${tag}: live region "${lock.live}"`);
  await page.screenshot({ path: `${OUT}/lock-${tag}.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1400);

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
    hud,
    overlaps,
    lock,
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
