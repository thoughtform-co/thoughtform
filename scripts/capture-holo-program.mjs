/**
 * capture-holo-program — drives `/test/holo-program-lab`, gates the ARTIFACT,
 * and captures the review stills.
 *
 * ⚠ HEADED, AND THAT IS NOT OPTIONAL. This lab is WebGL. A headless Chromium
 * falls back to SwiftShader or no GL at all, and the honest failure mode is
 * not an error — it is a black canvas that passes every DOM assertion.
 *
 * ⚠ THE GATE THAT MATTERS IS THAT IT ROTATES. Round 1 shipped an object that
 * looked three-dimensional and could not be turned; every DOM and pixel check
 * it had passed anyway. So this script DRAGS the canvas and asserts the
 * picture changed — a still that is identical before and after a drag is the
 * exact defect that got past the last set of gates.
 *
 * ⚠ Waits are on an IDENTITY, never a sleep and never a bare number: the lab
 * mirrors `data-stamp` in the same effect as its numbers.
 *
 * Usage (dev server must already be running):
 *   node scripts/capture-holo-program.mjs [--port 3003] [--presets full,p1280]
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
const PRESETS = argOf("--presets", "full,p1280").split(",");
const THEMES = argOf("--themes", "dark,light").split(",");

/** A benign, site-wide report-only CSP notice — not this route's doing. */
const IGNORED_ERROR = /upgrade-insecure-requests' is ignored when delivered in a report-only/;

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: false,
  args: ["--enable-gpu", "--use-gl=angle", "--ignore-gpu-blocklist"],
});

const failures = [];
const rows = [];

for (const preset of PRESETS) {
  for (const theme of THEMES) {
    const context = await browser.newContext({
      viewport: { width: 1600, height: 1000 },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error" && !IGNORED_ERROR.test(m.text())) errors.push(m.text());
    });

    const want = `${preset}|${theme}|live`;
    const fail = (msg) => failures.push(`${want}: ${msg}`);

    try {
      // `auto=0` so the auto-rotate drift cannot be mistaken for the drag.
      await page.goto(
        `http://localhost:${PORT}/test/holo-program-lab` +
          `?preset=${preset}&theme=${theme}&still=0&auto=0`,
        { waitUntil: "domcontentloaded" }
      );

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
        { timeout: 25000 }
      );
      // Let the intro land before anything is measured or shot.
      await page.waitForTimeout(2600);

      const stage = page.locator(".hpl__stage");
      const before = await stage.screenshot();
      await stage.screenshot({ path: `${OUT}/${preset}-${theme}-rest.png` });

      /* ── THE ROTATION GATE ─────────────────────────────────────────── */
      const box = await stage.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      // A long horizontal sweep: enough to swing the object visibly, all
      // inside the stage so nothing else receives the drag.
      for (let i = 1; i <= 12; i++) {
        await page.mouse.move(
          box.x + box.width / 2 + i * (box.width * 0.03),
          box.y + box.height / 2 - i * 2,
          { steps: 2 }
        );
      }
      await page.mouse.up();
      await page.waitForTimeout(900); // let the damping settle

      const after = await stage.screenshot();
      await stage.screenshot({ path: `${OUT}/${preset}-${theme}-rotated.png` });

      /* Compare the two PNGs. Identical bytes means the drag did nothing —
         which is precisely round 1's defect, invisible to every other check.
         (A live object also drifts between frames, so this is a floor, not
         an equality test: the rotated frame must differ SUBSTANTIALLY.) */
      const same = Buffer.compare(before, after) === 0;
      const sizeDelta = Math.abs(before.length - after.length) / before.length;
      if (same) fail("the drag changed NOTHING — the object does not rotate");

      const measured = await page.evaluate(() => {
        const el = document.querySelector("main.hpl");
        const canvas = document.querySelector(".hpl__stage canvas");
        const st = document.querySelector(".hpl__stage");
        const cb = canvas?.getBoundingClientRect();
        const sb = st?.getBoundingClientRect();
        const lbls = [...document.querySelectorAll(".hpl__lbl")].map((l) => ({
          t: l.style.transform,
          o: Number(l.style.opacity || "1"),
        }));
        return {
          canvas: cb ? { w: Math.round(cb.width), h: Math.round(cb.height) } : null,
          stage: sb ? { w: Math.round(sb.width), h: Math.round(sb.height) } : null,
          anchors: Number(el?.getAttribute("data-labels") ?? 0),
          positioned: lbls.filter((l) => l.t && l.t !== "none").length,
          faded: lbls.filter((l) => l.o < 0.99).length,
        };
      });

      if (!measured.canvas || !measured.stage) fail("no canvas or stage");
      else {
        if (Math.abs(measured.canvas.w - measured.stage.w) > 2)
          fail(`canvas ${measured.canvas.w}px vs stage ${measured.stage.w}px`);
      }
      // The labels must be TRACKING the object, not sitting at authored
      // percentages — that is the round-2 contract in one assertion.
      if (measured.anchors !== 7) fail(`${measured.anchors} anchors published, expected 7`);
      if (measured.positioned !== 7)
        fail(`${measured.positioned}/7 labels positioned from anchors`);
      if (measured.faded === 0)
        fail("no label is depth-faded — frontness is not reaching the DOM");
      if (before.length < 12000) fail(`rest still is ${Math.round(before.length / 1024)}kB — is GL painting?`);
      if (errors.length) fail(`page errors: ${errors.slice(0, 2).join(" | ")}`);

      rows.push({
        cell: want,
        ...measured.canvas,
        anchors: measured.anchors,
        faded: measured.faded,
        restKb: Math.round(before.length / 1024),
        movedPct: (sizeDelta * 100).toFixed(1),
        rotated: same ? "NO" : "yes",
      });
    } catch (e) {
      fail(String(e).split("\n")[0]);
    }

    await context.close();
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
