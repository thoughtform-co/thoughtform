/**
 * probe-voidwalker-figure-span — does every era paint a figure of the SAME
 * HEIGHT, still standing on the projector disc? (ADR-082 U25.)
 *
 * ⚠ THE BOX WAS NEVER THE DEFECT, WHICH IS WHY NOTHING CAUGHT THIS. Every era
 * is delivered on the same 720x1280 canvas and the figure column is 9:16 by
 * construction, so the media box is identical to the pixel on all five eras —
 * and every existing guard measures boxes. What differs is the figure INSIDE
 * the canvas: `post.py` normalises the FOOT and leaves `headY` wherever the
 * generator put it, so the delivered spans ran 0.9524 / 0.9367 / 0.876 /
 * 0.7343, a 23 % spread. This probe measures the thing the eye compares.
 *
 * ⚠ IT WALKS THE REEL WITH THE KEYBOARD, not with a click per chip (ADR-082
 * U20's finding): the band is a bounded reel window, two of the five chips are
 * always outside it, and an `overflow: clip` box is not scrollable — a
 * `page.click` on an off-reel chip times out reporting "element is not stable",
 * which reads like an animation fault and is really "that chip is off the reel".
 *
 * ⚠ HEADED. The corridor is WebGL and the station is four stations down it;
 * headless leaves the canvas dead and the runway un-inflated.
 *
 *   node scripts/probe-voidwalker-figure-span.mjs --vp 1920x1247
 *   node scripts/probe-voidwalker-figure-span.mjs --vp 1280x720 --shots <dir>
 */
import { mkdirSync } from "node:fs";

import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const [VW, VH] = argOf("--vp", "1920x1247").split("x").map(Number);
const PORT = argOf("--port", "3003");
const SHOTS = argOf("--shots", "");
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

/* The spread a reader would call "the same height". 1.5 % of a ~600px figure
   is ~9px, which is under the eye's threshold beside a reticle and a panel
   ladder; anything above it is the defect coming back. */
const SPREAD_LIMIT_PCT = 1.5;
/* The boots must keep the disc. The fit scales the picture about the box's
   bottom edge, so where the boots land is `(1 - footY)` of the picture — a
   property of the DELIVERY, not of the fit.
   ⚠ AZEROTH IS EXCLUDED, AND IT IS A NAMED PRE-EXISTING DEFECT RATHER THAN A
   LOOSENED NUMBER. `post.py`'s `seat_frames` seats every delivery's foot at
   0.995 and says in its own docstring that "the canonical pair ends at 0.998
   and azeroth at 0.970"; azeroth predates that step and was never re-seated,
   so its whole composite hovers ~2.7 % of the picture above the disc — 23.6px
   at 1920x1247, measured, and visible in the still. The four seated eras are
   pinned tight here; azeroth's hover is REPORTED with its number so that
   re-seating it (a 33-row shift, which its canvas has room for) is a
   measurable close rather than a taste call. */
const FOOT_DRIFT_LIMIT_PX = 8;
const UNSEATED = new Set(["azeroth"]);

const browser = await chromium.launch({ headless: args.includes("--headless") });
const page = await (
  await browser.newContext({ viewport: { width: VW, height: VH }, reducedMotion: "no-preference" })
).newPage();
await page.goto(`http://localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
// The corridor is lazy and inflates layout late, so the station's own node is
// the ready signal — a fixed sleep races the dev server's first compile.
await page.waitForSelector("#voidwalker .vw", { timeout: 90_000 });
await page
  .locator(".home-v2-stage")
  .first()
  .scrollIntoViewIfNeeded()
  .catch(() => {});
await page.waitForTimeout(1500);

const geom = await page.evaluate(() => {
  const runway = document.querySelector("#voidwalker .vw");
  if (!runway) return null;
  return {
    top: runway.getBoundingClientRect().top + window.scrollY,
    travel: runway.offsetHeight - window.innerHeight,
  };
});
if (!geom || geom.travel <= 0) {
  console.log("  x the station has no runway — is the capable gate met at this viewport?");
  await browser.close();
  process.exit(1);
}
// 0.45 is the middle of the [0.16, 0.72] era band — clear of the entry and the
// exit at both ends. Real scrolls, in steps: a teleport lands on a document
// that is still growing above the station.
await page.evaluate(
  async (to) => {
    let y = window.scrollY;
    while (Math.abs(to - y) > 600) {
      y += Math.sign(to - y) * 600;
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, to);
  },
  Math.round(geom.top + 0.45 * geom.travel)
);
await page.waitForTimeout(1200);

const read = () =>
  page.evaluate(() => {
    const slot = document.querySelector("#voidwalker .vwh__slot");
    const media = document.querySelector("#voidwalker .vwh__media");
    const title = document.querySelector("#voidwalker .vwd__mast__title");
    if (!slot || !media || !title) return null;
    const box = media.getBoundingClientRect();
    const headY = Number.parseFloat(slot.getAttribute("data-vwh-head-y") ?? "NaN");
    const footY = Number.parseFloat(slot.getAttribute("data-vwh-foot-y") ?? "NaN");
    const fit = Number.parseFloat(getComputedStyle(slot).getPropertyValue("--holo-fit") || "1");
    /* ⚠ THE PAINTED MEDIA, NOT THE ELEMENT BOX. `contain` paints
       `min(w/720, h/1280)` of the canvas and the FIGURE is `(footY - headY)`
       of THAT — the element box is the thing that was always identical across
       the eras, which is why every box-measuring guard on this surface missed
       this. ⚠ The `min()` is taken live rather than assumed: the slot is not
       reliably the wider of the two (460x845 at 1920x1247 is 0.544 against the
       contract's 0.5625, i.e. width-bound), and assuming height-bound is
       exactly the error that made the first cut of the fit a no-op. */
    const picture = Math.min(box.width / 720, box.height / 1280) * 1280;
    const ts = getComputedStyle(title);
    return {
      fit,
      span: Number((footY - headY).toFixed(4)),
      box: `${Math.round(box.width)}x${Math.round(box.height)}`,
      figurePx: Number((picture * (footY - headY)).toFixed(1)),
      // Where the boots land, in viewport px — the disc's own line.
      footPx: Number((box.bottom - picture * (1 - footY)).toFixed(1)),
      titleW: Math.round(title.getBoundingClientRect().width),
      titleLines: Math.round(
        title.getBoundingClientRect().height / Number.parseFloat(ts.lineHeight || "1")
      ),
      case: ts.textTransform,
      track: ts.letterSpacing,
      glow: ts.textShadow !== "none",
    };
  });

/* ⚠ FOCUS THE LIT CHIP FIRST. The reel has roving focus, so without this the
   keys go to the DOCUMENT — `Home` scrolls the page to the top and every era
   then reads identical, which looks like a broken fit and is really a probe
   that never changed the era. */
await page.locator("[data-vwh-era-tab][data-on='true']").first().focus();
await page.keyboard.press("Home");
await page.waitForTimeout(900);
const tabs = await page
  .locator("[data-vwh-era-tab]")
  .evaluateAll((els) => els.map((e) => e.getAttribute("data-vwh-era-tab")));

const rows = [];
for (let i = 0; i < tabs.length; i++) {
  if (i) await page.keyboard.press("ArrowRight");
  // ⚠ WAIT OUT THE MASTHEAD DECODE. An era change re-scrambles the title, so a
  // short settle measures a frame of the animation rather than the copy.
  await page.waitForTimeout(1800);
  const r = await read();
  if (!r) {
    console.log(`  x no figure on "${tabs[i]}"`);
    await browser.close();
    process.exit(1);
  }
  rows.push({ era: tabs[i], ...r });
  if (SHOTS) {
    await page
      .locator("#voidwalker .vwd")
      .screenshot({ path: `${SHOTS}/${i}-${tabs[i]}.png` })
      .catch(() => {});
  }
}
await browser.close();

console.log(`\n${VW}x${VH}\n`);
console.log(["era", "fit", "span", "mediaBox", "figure", "footLine", "titleW", "lines"].join("  "));
for (const r of rows) {
  console.log(
    [
      r.era.padEnd(11),
      String(r.fit).padEnd(6),
      String(r.span).padEnd(7),
      r.box.padEnd(9),
      `${r.figurePx}px`.padEnd(8),
      `${r.footPx}`.padEnd(9),
      String(r.titleW).padEnd(7),
      r.titleLines,
    ].join("  ")
  );
}

const hs = rows.map((r) => r.figurePx);
const seated = rows.filter((r) => !UNSEATED.has(r.era));
const fs = seated.map((r) => r.footPx);
const spreadPct = (Math.max(...hs) / Math.min(...hs) - 1) * 100;
const footDrift = Math.max(...fs) - Math.min(...fs);
const t = rows[0];

console.log(
  `\nfigure height  ${Math.min(...hs)} .. ${Math.max(...hs)} px  (${spreadPct.toFixed(2)} %)`
);
console.log(
  `foot line      ${Math.min(...fs).toFixed(1)} .. ${Math.max(...fs).toFixed(1)} px  (drift ${footDrift.toFixed(1)}, seated eras only)`
);
for (const r of rows.filter((x) => UNSEATED.has(x.era))) {
  const hover = Math.max(...fs) - r.footPx;
  console.log(
    `  ! ${r.era} is UNSEATED and hovers ${hover.toFixed(1)}px above the disc — known, ADR-082 U25`
  );
}
console.log(`title          case=${t.case}  track=${t.track}  glow=${t.glow}`);

const fails = [];
if (spreadPct > SPREAD_LIMIT_PCT)
  fails.push(`figure heights spread ${spreadPct.toFixed(2)} % (limit ${SPREAD_LIMIT_PCT})`);
if (footDrift > FOOT_DRIFT_LIMIT_PX)
  fails.push(`the seated eras' boots left the disc by ${footDrift.toFixed(1)}px`);
if (rows.some((r) => r.titleLines > 1)) fails.push("the era title wrapped");
if (t.case !== "uppercase") fails.push("the title is not on the house recipe (case)");
if (!t.glow) fails.push("the title is not on the house recipe (glow)");

if (fails.length) {
  console.log(`\nx ${fails.join("\n  x ")}`);
  process.exit(1);
}
console.log("\nok  one figure height, boots on the disc, title on the house recipe");
