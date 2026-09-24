/**
 * capture-holo-glitch — the era figure's transition (ADR-082 U42), held still.
 *
 * The glitch runs 640ms on a rAF, and Playwright's round trips cost 100–300ms
 * each, so an unslowed "mid-run" still is a guess. `.vwd` takes
 * `data-vwh-glitch-slow="N"` (read once per run by `useHoloGlitch`) and the
 * run is stretched N×; the samples below are then real frames of the same
 * choreography at the same fractions.
 *
 * ⚠ HEADED, REAL SCROLLS, the station's own reasons (`capture-voidwalker-
 * station.mjs`): the corridor is WebGL, the figure is a `<video>`, and the era
 * is DERIVED from the runway with hysteresis. It walks to the floor era's
 * slice (0.44, the boundaries spec's own stop), then changes era by KEYBOARD
 * on the band — the same path a click takes — and samples:
 *
 *   · frame 0 (the outgoing plate, whole — before the browser has painted the
 *     swapped video), 25 / 50 / 75 % (the tear, the flip cascade, the settle),
 *     the last 2 % (the kernel's near-identity frame) and AFTER the canvas
 *     lifts — each a clip of the figure's slot, plus the slot's state;
 *   · the NO-POP number: the mean absolute difference between the last frame
 *     under the canvas and the first frame without it, over the slot. ADR-060's
 *     `done` invariant, measured live rather than assumed.
 *
 * Both directions (forward to the Expanse, back to Azeroth: the floor era is
 * the one whose box exceeds the wrap, so it is the pair that would show a
 * clip). Usage (dev server running):
 *
 *   node scripts/capture-holo-glitch.mjs [--port 3003] [--vp 1920x1247]
 *     [--theme dark|light] [--slow 8] [--out <dir>]
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i === -1 ? fallback : args[i + 1];
};
const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/era-stage-pass/glitch");
const THEME = argOf("--theme", "dark");
const SLOW = Number(argOf("--slow", "8")) || 8;
const [VW, VH] = argOf("--vp", "1920x1247").split("x").map(Number);
/** The kernel's run, unslowed (lib/key-visual/themeGlitch.ts). */
const RUN_MS = 640;
const FRACTIONS = [0.25, 0.5, 0.75, 0.98];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  viewport: { width: VW, height: VH },
  deviceScaleFactor: 1,
  reducedMotion: "no-preference",
});
const page = await context.newPage();
page.on("pageerror", (e) => console.log("  ! page error:", e.message));

await page.goto(`http://localhost:${PORT}/?theme=${THEME}`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#voidwalker .vw", { timeout: 90_000 });
await page
  .locator(".home-v2-stage")
  .first()
  .scrollIntoViewIfNeeded()
  .catch(() => {});
await page.waitForTimeout(1200);

const geom = await page.evaluate(() => {
  const runway = document.querySelector("#voidwalker .vw");
  if (!runway) return null;
  const top = runway.getBoundingClientRect().top + window.scrollY;
  return { top, travel: runway.offsetHeight - window.innerHeight };
});
if (!geom || geom.travel <= 0) {
  console.log("  x station has no runway — is the capable gate met at this viewport?");
  await browser.close();
  process.exit(1);
}

// Walk in, never teleport (the writer smooths; the era's hysteresis takes a side).
await page.evaluate(
  async (to) => {
    const step = 600;
    let y = window.scrollY;
    while (Math.abs(to - y) > step) {
      y += Math.sign(to - y) * step;
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, to);
  },
  Math.round(geom.top + 0.44 * geom.travel)
);
await page.waitForTimeout(1200);
// The walk itself stepped eras (loop → genai → azeroth) and the last run may
// still be in flight; measure from rest, and say how long rest took.
const atRest = async () => {
  const t = Date.now();
  await page
    .waitForFunction(() => !document.querySelector("#voidwalker .vwh__glitch"), null, {
      timeout: 6_000,
    })
    .catch(() =>
      console.log("  ! a canvas is still up 6s after the walk — a run that never lifted")
    );
  console.log(`at rest ${Date.now() - t}ms after the walk's settle`);
};
await atRest();
// ⚠ THE WALK MUST LAND ON THE FLOOR ERA, AND ONE PASS DOES NOT ALWAYS. The
// corridor inflates the document late, so a runway measured too early puts
// 0.44 somewhere else (a run landed on `loop`); re-measure and walk again
// until the era reads azeroth, as the seam specs re-solve their targets.
for (let pass = 0; pass < 3; pass++) {
  const era = await page.evaluate(
    () => document.querySelector("#voidwalker .vwd")?.getAttribute("data-vwh-era") ?? null
  );
  if (era === "azeroth") break;
  const g = await page.evaluate(() => {
    const runway = document.querySelector("#voidwalker .vw");
    if (!runway) return null;
    const top = runway.getBoundingClientRect().top + window.scrollY;
    return { top, travel: runway.offsetHeight - window.innerHeight };
  });
  console.log(`  · era ${era} after pass ${pass}; re-walking to 0.44 (runway top ${g?.top})`);
  if (!g) break;
  await page.evaluate(
    async (to) => {
      const step = 600;
      let y = window.scrollY;
      while (Math.abs(to - y) > step) {
        y += Math.sign(to - y) * step;
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, to);
    },
    Math.round(g.top + 0.44 * g.travel)
  );
  await page.waitForTimeout(1200);
  await atRest();
}

const readSlot = () =>
  page.evaluate(() => {
    const root = document.querySelector("#voidwalker .vwd");
    const slot = document.querySelector("#voidwalker .vwh__slot");
    const wrap = document.querySelector("#voidwalker .vwh__media-wrap");
    const media = document.querySelectorAll("#voidwalker .vwh__media");
    const canvases = document.querySelectorAll("#voidwalker .vwh__glitch");
    const m = media[0] ? getComputedStyle(media[0]) : null;
    const c = canvases[0];
    const cs = c ? getComputedStyle(c) : null;
    const r = (el) => {
      const b = el?.getBoundingClientRect();
      return b
        ? [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]
        : null;
    };
    return {
      era: root?.getAttribute("data-vwh-era") ?? "(none)",
      glitch: slot?.getAttribute("data-vwh-glitch") ?? null,
      alpha: slot?.getAttribute("data-holo-alpha") ?? null,
      mediaCount: media.length,
      mediaVisibility: m?.visibility ?? null,
      mediaOpacity: m ? Number(m.opacity).toFixed(3) : null,
      canvases: canvases.length,
      canvasBox: r(c),
      canvasMask: cs
        ? `${cs.maskPosition || cs.webkitMaskPosition} · ${cs.maskImage === "none" ? "no mask" : "masked"}`
        : null,
      canvasBg: cs?.backgroundColor ?? null,
      wrapBox: r(wrap),
      slotBox: r(slot),
      wrapClip: wrap ? getComputedStyle(wrap).clipPath : null,
    };
  });

const shot = async (name, box) => {
  const file = path.join(OUT, `${VW}x${VH}_${THEME}_${name}.png`);
  await page.screenshot({
    path: file,
    clip: { x: box[0], y: box[1], width: box[2], height: box[3] },
  });
  return file;
};

const meanDiff = async (a, b) => {
  const A = await sharp(a).raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(b).raw().toBuffer({ resolveWithObject: true });
  const n = Math.min(A.data.length, B.data.length);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.abs(A.data[i] - B.data[i]);
  return sum / n;
};

await page.evaluate((slow) => {
  document.querySelector("#voidwalker .vwd")?.setAttribute("data-vwh-glitch-slow", String(slow));
}, SLOW);

const rest = await readSlot();
console.log(
  `rest: era ${rest.era} · alpha ${rest.alpha} · media ${rest.mediaCount} · canvases ${rest.canvases}`
);
if (!rest.alpha) {
  console.log("  x the floor branch: the glitch does not run here (expected on Safari / no codec)");
}
const clip = rest.slotBox;

const runOne = async (key, label) => {
  await page.locator("[data-vwh-era-tab][data-on='true']").first().focus();
  const t0 = Date.now();
  await page.keyboard.press(key);
  const frame0 = await readSlot();
  const f0 = await shot(`${label}_00`, clip);
  console.log(
    `${label} · +${Date.now() - t0}ms · glitch ${frame0.glitch} · canvases ${frame0.canvases} · media ${frame0.mediaCount} ${frame0.mediaVisibility} · box ${frame0.canvasBox} · mask ${frame0.canvasMask} · bg ${frame0.canvasBg}`
  );
  let last = f0;
  for (const f of FRACTIONS) {
    const at = t0 + f * RUN_MS * SLOW;
    const wait = at - Date.now();
    if (wait > 0) await page.waitForTimeout(wait);
    const s = await readSlot();
    const ready = await page.evaluate(() => {
      const v = document.querySelector("#voidwalker video.vwh__media");
      return v
        ? `readyState ${v.readyState} · paused ${v.paused} · t ${v.currentTime.toFixed(2)}`
        : "no video";
    });
    const file = await shot(`${label}_${String(Math.round(f * 100)).padStart(2, "0")}`, clip);
    console.log(
      `${label} · +${Date.now() - t0}ms (${Math.round(f * 100)} %) · glitch ${s.glitch} · canvases ${s.canvases} · media ${s.mediaVisibility} · opacity ${s.mediaOpacity} · clip ${s.wrapClip} · video ${ready}`
    );
    last = file;
  }
  /* After the run: the canvas gone, the media shown, one media element. The
     NO-POP number compares the last frame under the canvas with the first
     frame without it — so the video is PAUSED the instant the canvas lifts
     (an instrument's hold, not a production state; the idle would otherwise
     put a breath's worth of motion into the number). */
  await page
    .waitForFunction(() => !document.querySelector("#voidwalker .vwh__glitch"), null, {
      timeout: RUN_MS * SLOW + 2_000,
    })
    .catch(() => console.log("  ! the canvas did not lift"));
  await page.evaluate(() => document.querySelector("#voidwalker video.vwh__media")?.pause());
  const after = await readSlot();
  const fAfter = await shot(`${label}_after`, clip);
  await page.evaluate(() => document.querySelector("#voidwalker video.vwh__media")?.play());
  const pop = await meanDiff(last, fAfter);
  console.log(
    `${label} · after · era ${after.era} · glitch ${after.glitch} · canvases ${after.canvases} · media ${after.mediaCount} ${after.mediaVisibility} · opacity ${after.mediaOpacity} · no-pop mean |Δ| ${pop.toFixed(2)}/255`
  );
  const ok =
    after.canvases === 0 &&
    after.glitch === null &&
    after.mediaCount === 1 &&
    after.mediaVisibility === "visible" &&
    frame0.canvases === 1 &&
    frame0.mediaVisibility === "hidden" &&
    frame0.canvasBg === "rgba(0, 0, 0, 0)";
  console.log(`${label} · ${ok ? "ok" : "FAIL"}`);
  return ok;
};

const fwd = await runOne("ArrowRight", "azeroth-to-expanse");
await page.waitForTimeout(600);
const back = await runOne("ArrowLeft", "expanse-to-azeroth");

await context.close();
await browser.close();
console.log(`\n${fwd && back ? "done" : "FAILED"} — ${OUT}/`);
process.exit(fwd && back ? 0 : 1);
