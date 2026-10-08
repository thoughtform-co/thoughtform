#!/usr/bin/env node
/**
 * capture-instrument — stills of `/test/instrument-lab` per (direction ×
 * board × viewport × theme), with the instrument's own gate on each cell
 * (ADR-154). The lattice capture's shape (`capture-lattice.mjs`), cut to what
 * this lab needs: no wave folder yet, a stills folder and a report.
 *
 *     node scripts/capture-instrument.mjs --out /tmp/ins --headed
 *     node scripts/capture-instrument.mjs --k IA --board surfaces --setting binding
 *     node scripts/capture-instrument.mjs --dry-run
 *
 * Flags
 *   --out <dir>            where the stills and report.json go (default .instrument-captures)
 *   --k IA,IB              directions (default: every direction in the registry)
 *   --board altitudes,…    boards (default altitudes,zoom,surfaces; `all` adds phone)
 *   --setting default|laptop|binding|all   1920x1247 | 1470x830 | 1280x720 (default all)
 *   --themes dark,light    default both
 *   --port 3003
 *   --headless             default headed: the lab sits in the real HUD frame and a
 *                          hidden document's rAF stalls
 *   --timeout 60000
 *   --dry-run              print the matrix and exit
 *
 * ⚠ THE WAIT IS ON THE STAMP THE PAGE COMPUTED (`.ins-read[data-stamp]`:
 * board|knobs|theme|figures|boxes), on the prefix this script asked for AND on
 * `figures > 0`, which only a drawn board produces.
 *
 * ⚠ THE GATE IS `window.__instrument.measure()`: collisions, overflow, text
 * under 10px. Only the control (IA) can fail this script; a direction failing
 * is the finding and is written to the report.
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
  fs.readFileSync(path.join(ROOT, "lib", "instrument", "directions.json"), "utf8")
);
const ROUTE = "/test/instrument-lab";
const PORT = argOf("--port", "3003");
const OUT = path.resolve(argOf("--out", ".instrument-captures"));
const ONLY_K = listOf("--k");
const ONLY_BOARDS = listOf("--board");
const SETTING = argOf("--setting", "all");
const ONLY_THEMES = listOf("--themes");
const HEADED = !has("--headless");
const DRY = has("--dry-run");
const TIMEOUT = Number(argOf("--timeout", "60000"));

const SETTINGS = {
  default: { w: 1920, h: 1247, suffix: "" },
  laptop: { w: 1470, h: 830, suffix: "-laptop" },
  binding: { w: 1280, h: 720, suffix: "-binding" },
};
const settings =
  SETTING === "all" ? Object.entries(SETTINGS) : [[SETTING, SETTINGS[SETTING] ?? SETTINGS.binding]];

const directions = REGISTRY.directions.filter((d) => !ONLY_K.length || ONLY_K.includes(d.id));
const boards = ONLY_BOARDS.length
  ? ONLY_BOARDS.includes("all")
    ? ["altitudes", "zoom", "surfaces", "phone"]
    : ONLY_BOARDS
  : ["altitudes", "zoom", "surfaces"];
const themes = ONLY_THEMES.length ? ONLY_THEMES : REGISTRY.wave.themes;

const knobKeys = Object.keys(REGISTRY.knobs);
const defaults = Object.fromEntries(knobKeys.map((k) => [k, REGISTRY.knobs[k].values[0]]));
const knobsFor = (d) => ({ ...defaults, ...d.knobs });
const knobString = (knobs) => knobKeys.map((k) => `${k}=${knobs[k]}`).join(",");

const cells = [];
for (const d of directions)
  for (const board of boards)
    for (const [name, vp] of settings)
      for (const theme of themes) cells.push({ d, board, setting: name, vp, theme });

console.log(
  `  ${cells.length} cells · ${directions.map((d) => d.id).join(",")} · ${boards.join(",")}`
);
if (DRY) process.exit(0);

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: !HEADED });
const report = [];

for (const cell of cells) {
  const knobs = knobsFor(cell.d);
  const query = new URLSearchParams({
    board: cell.board,
    k: cell.d.id,
    ...knobs,
    theme: cell.theme,
    console: "0",
  });
  const url = `http://localhost:${PORT}${ROUTE}?${query}`;
  const context = await browser.newContext({
    viewport: { width: cell.vp.w, height: cell.vp.h },
    reducedMotion: "no-preference",
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  const prefix = `${cell.board}|${knobString(knobs)}|${cell.theme}|`;
  await page.waitForFunction(
    (pre) => {
      const el = document.querySelector(".ins-read[data-stamp]");
      if (!el) return false;
      const stamp = el.getAttribute("data-stamp") ?? "";
      return stamp.startsWith(pre) && Number(el.getAttribute("data-figures")) > 0;
    },
    prefix,
    { timeout: TIMEOUT }
  );
  await page.waitForTimeout(400);
  const read = await page.evaluate(() => window.__instrument?.measure());
  const file = `INS-${cell.d.id.toLowerCase()}__${cell.theme === "light" ? "parchment" : "void"}_${cell.board}${cell.vp.w}x${cell.vp.h}.png`;
  await page.screenshot({ path: path.join(OUT, file), fullPage: true });
  report.push({ ...cell, vp: `${cell.vp.w}x${cell.vp.h}`, d: cell.d.id, file, read });
  const faults = read ? read.collisions.length + read.overflow.length + read.smallText.length : -1;
  console.log(`  ${file}  ${read?.ok ? "clean" : `${faults} faults`}`);
  await context.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
const controlFaults = report.filter((r) => r.d === "IA" && r.read && !r.read.ok);
if (controlFaults.length) {
  console.error(`  the control fails on ${controlFaults.length} cells`);
  process.exit(1);
}
