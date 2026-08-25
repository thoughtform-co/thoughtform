/**
 * capture-holo-program — drives `/test/holo-program-lab`, gates it, and
 * captures the review stills.
 *
 * ⚠ HEADED, AND THAT IS NOT OPTIONAL. This lab is WebGL. A headless Chromium
 * falls back to SwiftShader or no GL at all, and the honest failure mode is
 * not an error — it is a black canvas that passes every DOM assertion. The
 * corridor smokes learned this; so does the website-screenshot skill.
 *
 * ⚠ WAITS ARE ON AN IDENTITY, NEVER A SLEEP AND NEVER A BARE NUMBER. The lab
 * mirrors `data-stamp` (preset|theme|mode) in the same effect as its numbers,
 * and this waits for the stamp it asked for. A wait a script can satisfy by
 * itself is not a wait — `capture-substrate-lab` gated three directions
 * against the previous cell's measurements that way.
 *
 * Usage (dev server must already be running):
 *   node scripts/capture-holo-program.mjs [--port 3003] [--presets p1280,p1920]
 *                                         [--themes dark,light] [--out DIR]
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/holo-program-lab");
const PRESETS = argOf("--presets", "p1280,p1440,p1920").split(",");
const THEMES = argOf("--themes", "dark,light").split(",");
/** The arrival is choreography; `rest` is the drawing it lands on. Both are
 *  captured because the still is what the reader lives with. */
const MODES = argOf("--modes", "rest,arrive").split(",");

/** A benign, site-wide report-only CSP notice — not this route's doing. */
const IGNORED_ERROR = /upgrade-insecure-requests' is ignored when delivered in a report-only/;

/** The viewport each preset is authored against. The lab sizes the BAND
 *  itself, but the window has to be big enough to hold it unclipped. */
const VIEWPORT = {
  p1280: { width: 1280, height: 900 },
  p1440: { width: 1460, height: 980 },
  p1920: { width: 1920, height: 1180 },
};

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: false,
  args: ["--enable-gpu", "--use-gl=angle", "--ignore-gpu-blocklist"],
});

const failures = [];
const rows = [];

for (const preset of PRESETS) {
  for (const theme of THEMES) {
    for (const mode of MODES) {
      const context = await browser.newContext({
        viewport: VIEWPORT[preset] ?? VIEWPORT.p1280,
        deviceScaleFactor: 1,
        // ⚠ PRM must stay off: the production mount refuses to arm under
        // reduced motion, and a lab run under it would measure the fallback.
        reducedMotion: "no-preference",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (m) => {
        if (m.type() === "error" && !IGNORED_ERROR.test(m.text())) errors.push(m.text());
      });

      const want = `${preset}|${theme}|${mode}`;
      const url =
        `http://localhost:${PORT}/test/holo-program-lab` +
        `?preset=${preset}&theme=${theme}&still=${mode === "rest" ? 1 : 0}`;
      await page.goto(url, { waitUntil: "domcontentloaded" });

      let measured = null;
      try {
        // The identity FIRST, then the readiness — in that order, so a stale
        // cell can never satisfy the gate.
        await page.waitForFunction(
          (stamp) => {
            const el = document.querySelector("main.hpl");
            return (
              !!el &&
              el.getAttribute("data-stamp") === stamp &&
              el.getAttribute("data-ready") === "1"
            );
          },
          want,
          { timeout: 20000 }
        );
        /* The arrival is 2.4s. `--arriveMs` samples it MID-FLIGHT instead of
           after it lands — the only way to see whether the rings really do
           stroke on in date order, which a finished still cannot show. */
        if (mode === "arrive") await page.waitForTimeout(Number(argOf("--arriveMs", "2900")));

        measured = await page.evaluate(() => {
          const el = document.querySelector("main.hpl");
          const canvas = document.querySelector(".hpl__stage canvas");
          const stage = document.querySelector(".hpl__stage");
          const cb = canvas?.getBoundingClientRect();
          const sb = stage?.getBoundingClientRect();
          return {
            canvas: cb ? { w: Math.round(cb.width), h: Math.round(cb.height) } : null,
            stage: sb ? { w: Math.round(sb.width), h: Math.round(sb.height) } : null,
            hits: Number(el?.getAttribute("data-hits") ?? -1),
            aspect: Number(el?.getAttribute("data-aspect") ?? 0),
          };
        });

        const file = `${OUT}/${preset}-${theme}-${mode}.png`;
        const shot = await page.locator(".hpl__stage").screenshot({ path: file });

        /**
         * ⚠ LIVENESS IS MEASURED ON THE SCREENSHOT, NOT ON THE CANVAS.
         * `drawImage(webglCanvas)` returns BLACK once the frame is composited
         * unless `preserveDrawingBuffer` is on — so the obvious in-page pixel
         * probe reports "nothing is painted" for a perfectly good drawing.
         * (It did, on this script's first run.) The composited screenshot is
         * the only honest sample, and a PNG of a blank plate compresses to
         * almost nothing, so its byte length separates drawn from empty
         * without needing a decoder.
         */
        measured.shotKb = Math.round(shot.length / 1024);

        /* ── The gates ─────────────────────────────────────────────── */
        const fail = (msg) => failures.push(`${want}: ${msg}`);
        if (!measured.canvas || !measured.stage) fail("no canvas or stage");
        else {
          // The canvas must FILL the band — a default-sized 300x150 canvas is
          // the signature of an R3F mount that never got a resize observation.
          if (Math.abs(measured.canvas.w - measured.stage.w) > 2)
            fail(`canvas ${measured.canvas.w}px vs stage ${measured.stage.w}px`);
          if (Math.abs(measured.canvas.h - measured.stage.h) > 2)
            fail(`canvas ${measured.canvas.h}px tall vs stage ${measured.stage.h}px`);
        }
        if (measured.hits !== 0) fail(`${measured.hits} ring/station collisions`);
        // An empty plate at this size compresses to a few kB; a drawn one
        // does not. The floor is deliberately low — this is line work on a
        // dark field, not a photograph.
        if (mode === "rest" && measured.shotKb < 12)
          fail(`still is only ${measured.shotKb}kB — is GL painting?`);
        if (errors.length) fail(`page errors: ${errors.slice(0, 2).join(" | ")}`);

        rows.push({ cell: want, ...measured.canvas, hits: measured.hits, kb: measured.shotKb });
      } catch (e) {
        failures.push(`${want}: ${String(e).split("\n")[0]}`);
      }

      await context.close();
    }
  }
}

await browser.close();

console.table(rows);
if (failures.length) {
  console.error(`\n${failures.length} GATE FAILURE(S):`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\nAll gates green. Stills in ${OUT}/`);
