/**
 * capture-substrate-lab — drives `/test/intelligence-substrate-lab`, ASSERTS
 * its fit gates across the matrix, and captures the review stills.
 *
 * The configuration lab's script, one reading over. Everything load-bearing
 * about it is unchanged and worth restating:
 *
 * HEADLESS ON PURPOSE — the lab is static DOM/SVG with no corridor, so a
 * headless context is honest, and it is the only mode that works when the
 * in-app browser pane cannot composite (the imlab lesson).
 *
 * ⚠ `reducedMotion` MUST BE "no-preference". The console's unwrap gate is
 * `(max-width: 980px), (prefers-reduced-motion: reduce)` in pda.css AND
 * console.css — under PRM the whole console is `display: none` and every
 * sample would measure an empty box.
 *
 * Waits are on OBSERVABLES, never sleeps: the readout mirrors its numbers
 * onto `data-*` two rAFs after mount, and this waits for a real `data-minpx`.
 *
 * Usage (dev server must already be running):
 *   node scripts/capture-substrate-lab.mjs [--port 3003] [--v strata,table]
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/intelligence-substrate-lab");
const VARIANTS = argOf("--v", "shipped,strata,table,tree,seals,density,field").split(",");
const THEMES = argOf("--themes", "dark,light").split(",");
const PRESETS = argOf("--presets", "p1280,p1920").split(",");

/** A benign, site-wide report-only CSP notice — not this route's doing. */
const IGNORED_ERROR = /upgrade-insecure-requests' is ignored when delivered in a report-only/;

await mkdir(OUT, { recursive: true });

const samples = [];
for (const preset of PRESETS) {
  for (const v of VARIANTS) {
    for (const t of THEMES) samples.push({ v, t, preset });
  }
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1760, height: 1000 },
  reducedMotion: "no-preference",
  colorScheme: "dark",
});
const page = await ctx.newPage();
const errors = [];
const note = (t) => !IGNORED_ERROR.test(t) && errors.push(t);
page.on("pageerror", (e) => note(String(e)));
page.on("console", (m) => m.type() === "error" && note(m.text()));

const rows = [];
for (const s of samples) {
  const before = errors.length;
  await page.goto(
    `http://localhost:${PORT}/test/intelligence-substrate-lab?v=${s.v}&theme=${s.t}&preset=${s.preset}`,
    { waitUntil: "domcontentloaded" }
  );
  let settled = true;
  await page
    .waitForFunction(
      (want) => {
        const read = document.querySelector(".icl-read");
        const svg = document.querySelector("svg.fl-pda__svg");
        if (!read || !svg) return false;
        /* ⚠ WAIT ON WHAT WAS MEASURED, NEVER ON THE URL (2026-08-15). The old
           check read `location.search` — which this script SET — so it was
           true from the first paint, before the page adopts the param; and
           `minpx > 0` is satisfied by the DEFAULT variant's own measurement.
           Both passed while the readout still held `shipped`'s figures at
           another preset's scale, so `mosaic` and `grade` were gated against
           the baseline and reported green. The readout now stamps the
           identity it measured, in the same setState as the numbers. */
        if (read.getAttribute("data-stamp") !== `${want.v}|${want.t}|${want.preset}`) return false;
        const minpx = parseFloat(read.getAttribute("data-minpx") ?? "0");
        const texts = parseInt(read.getAttribute("data-texts") ?? "0", 10);
        return minpx > 0 && texts > 0;
      },
      s,
      { timeout: 20_000 }
    )
    .catch(() => {
      settled = false;
    });

  const r = await page.evaluate(() => {
    const read = document.querySelector(".icl-read");
    const g = (k) => read?.getAttribute(`data-${k}`) ?? "";
    return {
      collisions: parseInt(g("collisions") || "0", 10),
      clipped: parseInt(g("clipped") || "0", 10),
      minPx: parseFloat(g("minpx") || "0"),
      texts: parseInt(g("texts") || "0", 10),
      overflow: parseInt(g("overflow") || "0", 10),
    };
  });
  rows.push({ ...s, settled, ...r, errors: errors.length - before });

  await page
    .locator(".icl-stage")
    .screenshot({ path: `${OUT}/${s.preset}_${s.v}_${s.t}.png`, animations: "disabled" });
}
await ctx.close();
await browser.close();

/* ── Report ─────────────────────────────────────────────────────────────── */
const pad = (x, n) =>
  String(x ?? "")
    .padEnd(n)
    .slice(0, n);
console.log(
  [
    pad("variant", 9),
    pad("theme", 6),
    pad("preset", 7),
    pad("ok", 3),
    pad("texts", 6),
    pad("minPx", 6),
    pad("coll", 5),
    pad("clip", 5),
    pad("ovf", 4),
    "err",
  ].join(" ")
);
for (const r of rows) {
  console.log(
    [
      pad(r.v, 9),
      pad(r.t, 6),
      pad(r.preset, 7),
      pad(r.settled ? "y" : "N", 3),
      pad(r.texts, 6),
      pad(r.minPx.toFixed(1), 6),
      pad(r.collisions, 5),
      pad(r.clipped, 5),
      pad(r.overflow, 4),
      r.errors,
    ].join(" ")
  );
}

/* ── Gates ──────────────────────────────────────────────────────────────
   ⚠ `shipped` IS INSIDE THEM ON PURPOSE. The baseline is the thing being
   argued with, and a lab whose gates skip it cannot tell you whether a
   direction is better or merely differently broken. */
const fail = [];
const bad = (pred, msg) => {
  const hits = rows.filter(pred);
  if (hits.length) fail.push(`${msg}: ${hits.map((r) => `${r.v}/${r.t}/${r.preset}`).join(", ")}`);
};
bad((r) => !r.settled, "never settled");
bad((r) => r.collisions > 0, "label-on-label collisions");
bad((r) => r.clipped > 0, "labels clipped by their crop");
bad((r) => r.settled && r.minPx < 4.3, "rendered type under the 4.3px floor");
bad((r) => r.overflow > 1, "the field scrolls");
bad((r) => r.settled && r.texts <= 10, "suspiciously few labels");
bad((r) => r.errors > 0, "page errors");

console.log("");
if (fail.length) {
  console.log("GATES FAILED:");
  for (const f of fail) console.log("  ✗ " + f);
  process.exitCode = 1;
} else {
  console.log(`GATES PASSED · ${rows.length} samples · stills in ${OUT}/`);
}
