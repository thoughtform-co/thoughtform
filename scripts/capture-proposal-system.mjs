#!/usr/bin/env node
/**
 * capture-proposal-system — stills of `/test/proposal-system` per
 * (direction × viewport × theme), one still per beat, with the page's own
 * gate on each cell (the proposal system, 2026-10-10). The instrument
 * capture's shape (`capture-instrument.mjs`): no wave folder, a stills
 * folder and a report.
 *
 *     node scripts/capture-proposal-system.mjs --dry-run
 *     node scripts/capture-proposal-system.mjs --k PA,PZ --setting laptop
 *     node scripts/capture-proposal-system.mjs
 *
 * Flags
 *   --out <dir>            default docs/design/proposal-system/stills
 *   --k PA,PB              directions (default: every direction in the registry)
 *   --setting air|laptop|window|all   1440x790 | 1470x830 | 1920x1200 (default all)
 *   --themes dark,light    default both
 *   --port 3003
 *   --headless             default headed: the lab sits in the real HUD frame and a
 *                          hidden document's rAF stalls
 *   --timeout 60000
 *   --dry-run              print the matrix and exit
 *
 * ⚠ THE WAIT IS ON THE STAMP THE PAGE COMPUTED (`.ps-read[data-stamp]`:
 * knobs|theme|beats|js), on the prefix this script asked for AND on
 * `beats > 0` and `js = 1`, which only the real page produces.
 *
 * ⚠ THE GATE IS `window.__proposal.measure()`: every beat's content ends
 * inside the screen, no horizontal scroll, no text under 10px. Only the
 * control (PA) can fail this script; a direction failing is the finding.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};
const has = (f) => args.includes(f);
const listOf = (f) => {
  const v = argOf(f, "");
  return v
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
};

const ROOT = process.cwd();
const REGISTRY = JSON.parse(
  fs.readFileSync(path.join(ROOT, "lib", "proposal-system", "directions.json"), "utf8")
);
const ROUTE = "/test/proposal-system";
const PORT = argOf("--port", "3003");
const OUT = path.resolve(argOf("--out", "docs/design/proposal-system/stills"));
const ONLY_K = listOf("--k");
const SETTING = argOf("--setting", "all");
const ONLY_THEMES = listOf("--themes");
const HEADED = !has("--headless");
const DRY = has("--dry-run");
const TIMEOUT = Number(argOf("--timeout", "60000"));

const SETTINGS = {
  air: { w: 1440, h: 790 },
  laptop: { w: 1470, h: 830 },
  window: { w: 1920, h: 1200 },
};
const settings =
  SETTING === "all" ? Object.entries(SETTINGS) : [[SETTING, SETTINGS[SETTING] ?? SETTINGS.laptop]];

const directions = REGISTRY.directions.filter((d) => !ONLY_K.length || ONLY_K.includes(d.id));
const themes = ONLY_THEMES.length ? ONLY_THEMES : REGISTRY.wave.themes;

const knobKeys = Object.keys(REGISTRY.knobs);
const defaults = Object.fromEntries(knobKeys.map((k) => [k, REGISTRY.knobs[k].values[0]]));
const knobsFor = (d) => ({ ...defaults, ...d.knobs });
const knobString = (knobs) => knobKeys.map((k) => `${k}=${knobs[k]}`).join(",");

const cells = [];
for (const d of directions)
  for (const [name, vp] of settings)
    for (const theme of themes) cells.push({ d, setting: name, vp, theme });

console.log(
  `  ${cells.length} cells · ${directions.map((d) => d.id).join(",")} · ${settings.map(([n]) => n).join(",")} · ${themes.join(",")}`
);
if (DRY) process.exit(0);

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: !HEADED });
const report = [];

/** Walk the document once so every reveal has landed and the curtain has released. */
async function walk(page) {
  await page.evaluate(async () => {
    const step = Math.round(innerHeight * 0.8);
    const max = document.documentElement.scrollHeight;
    const frame = () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    for (let y = 0; y < max; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await frame();
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await frame();
  });
  await page
    .waitForFunction(
      () =>
        document
          .getAnimations()
          .every(
            (a) => a.playState !== "running" || a.effect?.getTiming?.().iterations === Infinity
          ),
      null,
      { timeout: 4000 }
    )
    .catch(() => {});
  await page.waitForTimeout(250);
}

for (const cell of cells) {
  const knobs = knobsFor(cell.d);
  const query = new URLSearchParams({ k: cell.d.id, ...knobs, theme: cell.theme, console: "0" });
  const url = `http://localhost:${PORT}${ROUTE}?${query}`;
  const context = await browser.newContext({
    viewport: { width: cell.vp.w, height: cell.vp.h },
    reducedMotion: "no-preference",
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" }).catch(() => {});
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: TIMEOUT });
  const prefix = `${knobString(knobs)}|${cell.theme}|`;
  await page.waitForFunction(
    (pre) => {
      const el = document.querySelector(".ps-read[data-stamp]");
      if (!el) return false;
      const stamp = el.getAttribute("data-stamp") ?? "";
      return (
        stamp.startsWith(pre) &&
        Number(el.getAttribute("data-beats")) > 0 &&
        el.getAttribute("data-js") === "1"
      );
    },
    prefix,
    { timeout: TIMEOUT }
  );
  await walk(page);
  const read = await page.evaluate(() => window.__proposal?.measure());
  const theme = cell.theme === "light" ? "parchment" : "void";
  const base = `PS-${cell.d.id.toLowerCase()}__${theme}_${cell.vp.w}x${cell.vp.h}`;
  await page.screenshot({ path: path.join(OUT, `${base}_00-page.png`), fullPage: true });
  const ids = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".arc-root .arc-section")).map((s) => s.id)
  );
  for (const [i, id] of ids.entries()) {
    const n = String(i + 1).padStart(2, "0");
    /* A pinned beat is a RUNWAY: three stills, at its start, its middle and
       its end, with the scroll-driven animations LEFT RUNNING (disabling them
       jumps a view timeline to its end, which is the static figure). */
    const runway = await page.evaluate(
      (sid) => document.getElementById(sid)?.classList.contains("arc-sec--instrument-pin") ?? false,
      id
    );
    if (runway) {
      for (const [tag, at] of [
        ["start", 0],
        ["mid", 0.5],
        ["end", 1],
      ]) {
        await page.evaluate(
          ([sid, k]) => {
            const el = document.getElementById(sid);
            if (!el) return;
            const top = el.getBoundingClientRect().top + window.scrollY;
            const run = el.offsetHeight - window.innerHeight;
            window.scrollTo({ top: top + run * Number(k), behavior: "instant" });
          },
          [id, at]
        );
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(OUT, `${base}_${n}-${id}-${tag}.png`) });
      }
      continue;
    }
    await page.evaluate((sid) => {
      document.getElementById(sid)?.scrollIntoView({ block: "start", behavior: "instant" });
    }, id);
    await page.waitForTimeout(420);
    await page.screenshot({
      path: path.join(OUT, `${base}_${n}-${id}.png`),
      animations: "disabled",
    });
  }
  const over = read ? read.beats.filter((b) => b.overflowsScreen).map((b) => b.id) : [];
  report.push({
    d: cell.d.id,
    setting: cell.setting,
    vp: `${cell.vp.w}x${cell.vp.h}`,
    theme: cell.theme,
    base,
    read,
    over,
  });
  console.log(
    `  ${base}  ${read?.ok ? "every beat one screen" : `over: ${over.join(", ") || "?"}${read?.hScroll ? " · hscroll" : ""}${read?.smallText?.length ? ` · ${read.smallText.length} small` : ""}`}`
  );
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log(`  stills in ${OUT}`);
const controlFaults = report.filter((r) => r.d === "PA" && r.read && !r.read.ok);
if (controlFaults.length) {
  console.error(`  the control fails on ${controlFaults.length} cells`);
  process.exit(1);
}
