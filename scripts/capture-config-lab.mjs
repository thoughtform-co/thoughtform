/**
 * capture-config-lab — drives `/test/intelligence-config-lab`, ASSERTS its
 * fit gates across the whole matrix, and captures the review stills.
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
 * onto `data-*` attributes two rAFs after mount, and the script waits for a
 * real `data-minpx` before sampling.
 *
 * Usage (dev server must already be running):
 *   node scripts/capture-config-lab.mjs [--port 3003] [--v die,chain] [--w W-017]
 *   node scripts/capture-config-lab.mjs --measure   # pin PRESETS from production
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const has = (flag) => args.includes(flag);

const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/intelligence-config-lab");
const VARIANTS = argOf("--v", "shipped,die,chain,section,schematic").split(",");
const SUBJECTS = argOf("--w", "W-017,W-004,W-026,W-040,W-063").split(",");
const THEMES = argOf("--themes", "dark,light").split(",");

/** A benign, site-wide report-only CSP notice — not this route's doing. */
const IGNORED_ERROR = /upgrade-insecure-requests' is ignored when delivered in a report-only/;

/* ── --measure: pin the PRESETS from the production console ─────────────
   Loads the LANDING at three reference viewports, real-scrolls into the
   casefile dwell (the map row is the default panel), waits for
   `data-proof-settled`, and prints the PDA console's real boxes. Paste the
   `.fl-con` numbers into ConfigLabShell's PRESETS. */
async function measureProduction(browser) {
  const VIEWPORTS = [
    { id: "1280x720", width: 1280, height: 720 },
    { id: "1440x800", width: 1440, height: 800 },
    { id: "1920x1080", width: 1920, height: 1080 },
  ];
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: "no-preference",
      colorScheme: "dark",
    });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
    // The corridor is a lazy client chunk — `.home-v2-stage` appearing is
    // what means the layout above #services has its final height (the
    // smoke's own rule; measuring earlier lands the scroll above the runway).
    await page.waitForSelector(".home-v2-stage", { timeout: 60_000 });

    // A REAL two-arg scrollTo into the casefile dwell (the smoke's
    // `scrollCasefileDwell`). 3.2 mirrors SERVICES_PROOF_RUNWAY_VH — if the
    // runway is retuned, update this with it (measure-only constant).
    const PROOF_RUNWAY_VH = 3.2;
    const target = await page.evaluate(
      ({ p, proofVh }) => {
        const runway = document.querySelector(".services-stage-root");
        if (!runway) return null;
        const rect = runway.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const travel = Math.max(0, rect.height - window.innerHeight);
        return Math.round(top + Math.min(travel, window.innerHeight * proofVh) * p);
      },
      { p: 0.35, proofVh: PROOF_RUNWAY_VH }
    );
    if (target == null) throw new Error("no .services-stage-root");
    await page.evaluate((y) => window.scrollTo(0, y), target);
    await page.waitForTimeout(600);
    await page.waitForSelector("[data-proof-settled]", { state: "attached", timeout: 30_000 });

    const boxes = await page.evaluate(() => {
      // The console frame is SHARED chrome — its box is plate-independent,
      // so whichever directory row the browse band has selected, `.fl-con`
      // is the housing the lab must pin.
      const con = document.querySelector(".fl-con");
      const field = con?.querySelector(".fl-con__field");
      const rect = (el) =>
        el
          ? (({ width, height }) => ({ w: Math.round(width), h: Math.round(height) }))(
              el.getBoundingClientRect()
            )
          : null;
      return { con: rect(con), field: rect(field) };
    });
    console.log(`${vp.id}  .fl-con ${JSON.stringify(boxes.con)}  .fl-con__field ${JSON.stringify(boxes.field)}`);
    await ctx.close();
  }
}

/* ── The matrix run ─────────────────────────────────────────────────── */
async function run(browser) {
  await mkdir(OUT, { recursive: true });
  const rows = [];

  /** p1280 for the full matrix; p1920 once per variant on the lead subject. */
  const samples = [];
  for (const v of VARIANTS)
    for (const w of SUBJECTS)
      for (const t of THEMES) samples.push({ v, w, t, preset: "p1280" });
  for (const v of VARIANTS) samples.push({ v, w: SUBJECTS[0], t: "dark", preset: "p1920" });

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

  for (const s of samples) {
    const before = errors.length;
    await page.goto(
      `http://localhost:${PORT}/test/intelligence-config-lab?v=${s.v}&work=${s.w}&theme=${s.t}&preset=${s.preset}`,
      { waitUntil: "domcontentloaded" }
    );
    let settled = true;
    await page
      .waitForFunction(
        (want) => {
          const read = document.querySelector(".icl-read");
          const svg = document.querySelector("svg.fl-pda__svg");
          if (!read || !svg) return false;
          // The deep link must have been adopted before the sample counts.
          const url = new URL(window.location.href);
          if (url.searchParams.get("v") !== want.v) return false;
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
      .screenshot({ path: `${OUT}/${s.preset}_${s.v}_${s.w}_${s.t}.png`, animations: "disabled" });
  }
  await ctx.close();

  // ── Report ──────────────────────────────────────────────────────────
  const pad = (x, n) => String(x ?? "").padEnd(n).slice(0, n);
  console.log(
    [pad("variant", 10), pad("work", 6), pad("theme", 6), pad("preset", 7), pad("ok", 3), pad("texts", 6), pad("minPx", 6), pad("coll", 5), pad("clip", 5), pad("ovf", 4), "err"].join(" ")
  );
  for (const r of rows) {
    console.log(
      [pad(r.v, 10), pad(r.w, 6), pad(r.t, 6), pad(r.preset, 7), pad(r.settled ? "y" : "N", 3), pad(r.texts, 6), pad(r.minPx.toFixed(1), 6), pad(r.collisions, 5), pad(r.clipped, 5), pad(r.overflow, 4), r.errors].join(" ")
    );
  }

  // ── Gates ───────────────────────────────────────────────────────────
  const fail = [];
  const bad = (pred, msg) => {
    const hits = rows.filter(pred);
    if (hits.length)
      fail.push(`${msg}: ${hits.map((r) => `${r.v}/${r.w}/${r.t}/${r.preset}`).join(", ")}`);
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
}

const browser = await chromium.launch({ headless: true });
try {
  if (has("--measure")) await measureProduction(browser);
  else await run(browser);
} finally {
  await browser.close();
}
