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
   ⚠ NO ERA IS EXCLUDED ANY MORE (ADR-082 U31). `azeroth` stood here as a named
   pre-existing defect from U25 — its delivery predated `post.py`'s seat step
   and hovered 23.6px above the disc at 1920x1247 (27.3 under U29's overscan).
   `-v11` is the 33-row shift this comment asked for
   (`scripts/voidwalker-avatar/reseat_azeroth.py`), so all five eras are pinned
   to one foot line. The set stays as the mechanism: an era that lands here
   again must arrive with its number and its reason, never as a looser limit. */
const FOOT_DRIFT_LIMIT_PX = 8;
const UNSEATED = new Set([]);

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
    const inkY = Number.parseFloat(slot.getAttribute("data-vwh-head-y") ?? "NaN");
    const footY = Number.parseFloat(slot.getAttribute("data-vwh-foot-y") ?? "NaN");
    /* ⚠ A KNEELING ERA IS MEASURED BY THE MAN IT DRAWS (ADR-082 U32). Its ink
       tops out at a rifle's muzzle ~0.9 of a standing height down, so its
       painted extent, its "cap" and its centre are not a standing era's. With
       `data-vwh-stature` present the head line is `footY − stature` — where a
       standing head would paint — and every law below reads that; the ink's
       own top is reported beside it. */
    const stature = Number.parseFloat(slot.getAttribute("data-vwh-stature") ?? "NaN");
    const kneels = Number.isFinite(stature);
    const headY = kneels ? footY - stature : inkY;
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

    /* ⚠ THE WRAP'S CLIP AGAINST THE PAINTED BOX (ADR-082 U31). Every guard on
       this surface asked whether the wrap sits inside the slot — it does, a
       `clip-path` does not change a rect — and none asked whether the MEDIA
       sits inside the wrap's clip. That is how U29's overscan shipped azeroth
       with ~27px of pauldron cut off each side: his is the one box larger than
       its wrap. The computed `inset()` is resolved to px here (a percentage is
       of the wrap's own width / height) and the media box must fit inside the
       opened area. ⚠ A mask hides overflow as well, so an opened clip under a
       live `mask-image` is still a crop — the mask is reported beside it. */
    const wrap = document.querySelector("#voidwalker .vwh__media-wrap");
    let cut = null;
    let mask = null;
    if (wrap) {
      const wr = wrap.getBoundingClientRect();
      const ws = getComputedStyle(wrap);
      mask = ws.maskImage || ws.webkitMaskImage || "none";
      const m = /inset\(([^)]*)\)/.exec(ws.clipPath || "");
      const parts = m ? m[1].trim().split(/\s+/) : ["0px"];
      const px = (v, base) =>
        v.endsWith("%") ? (Number.parseFloat(v) / 100) * base : Number.parseFloat(v) || 0;
      // CSS shorthand expansion: 1 → all, 2 → v h, 3 → t h b, 4 → t r b l.
      const [t, r, b, l] =
        parts.length === 1
          ? [parts[0], parts[0], parts[0], parts[0]]
          : parts.length === 2
            ? [parts[0], parts[1], parts[0], parts[1]]
            : parts.length === 3
              ? [parts[0], parts[1], parts[2], parts[1]]
              : parts;
      const open = {
        top: wr.top + px(t, wr.height),
        right: wr.right - px(r, wr.width),
        bottom: wr.bottom - px(b, wr.height),
        left: wr.left + px(l, wr.width),
      };
      const hidden = mask !== "none";
      // With a mask on, the paintable area is the wrap's own box at most.
      const lim = hidden
        ? { top: wr.top, right: wr.right, bottom: wr.bottom, left: wr.left }
        : open;
      cut = {
        left: Math.max(0, Math.max(lim.left, open.left) - box.left),
        right: Math.max(0, box.right - Math.min(lim.right, open.right)),
      };
    }
    /* ── THE LIFT (ADR-082 U31). Four numbers nothing reported before:
         · `liftPx`   the figure cell's computed `top` — the lift itself. It is
                      RELATIVE POSITION, not a transform, because the handoff's
                      seat is measured with offset geometry; and a percentage
                      `top` that failed to resolve would read `auto`/0 here.
         · `headPx`   where the cap PAINTS (viewport px), against
         · `stagePx`  the stage's top edge — the four panel heads' own row line,
                      which is where `--vwd-rise: 1` puts every standing cap.
         · `slackPx`  `slotH − slotW × 16/9`: the height the stage can still
                      lose before the picture starts to shrink. The thumbnail
                      band is paid out of this, so it may never go negative. */
    const figure = document.querySelector("#voidwalker .vwd__figure");
    const stage = document.querySelector("#voidwalker .vwd__stage");
    const disc = document.querySelector("#voidwalker .vwh__base__disc");
    const ring = document.querySelector("#voidwalker .vwd__reticle");
    const ringBox =
      ring && getComputedStyle(ring).display !== "none" ? ring.getBoundingClientRect() : null;
    const slotBox = slot.getBoundingClientRect();
    const liftRaw = figure ? getComputedStyle(figure).top : "auto";
    return {
      fit,
      liftPx: Number.parseFloat(liftRaw) || 0,
      headPx: Number((box.bottom - picture * (1 - headY)).toFixed(1)),
      stagePx: stage ? Number(stage.getBoundingClientRect().top.toFixed(1)) : null,
      discPx: disc ? Number(disc.getBoundingClientRect().top.toFixed(1)) : null,
      // The reticle's centre, against the middle of the painted figure.
      ringPx: ringBox ? Number((ringBox.top + ringBox.height / 2).toFixed(1)) : null,
      slackPx: Number((slotBox.height - (slotBox.width * 16) / 9).toFixed(1)),
      cutL: cut ? Number(cut.left.toFixed(1)) : null,
      cutR: cut ? Number(cut.right.toFixed(1)) : null,
      masked: mask !== null && mask !== "none",
      span: Number((footY - headY).toFixed(4)),
      box: `${Math.round(box.width)}x${Math.round(box.height)}`,
      figurePx: Number((picture * (footY - headY)).toFixed(1)),
      kneels,
      inkPx: Number((picture * (footY - inkY)).toFixed(1)),
      inkTopPx: Number((box.bottom - picture * (1 - inkY)).toFixed(1)),
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
console.log(
  ["era", "fit", "span", "mediaBox", "figure", "footLine", "cut L/R", "titleW", "lines"].join("  ")
);
for (const r of rows) {
  console.log(
    [
      r.era.padEnd(11),
      String(Number(r.fit.toFixed(4))).padEnd(6),
      String(r.span).padEnd(7),
      r.box.padEnd(9),
      `${r.figurePx}px`.padEnd(8),
      `${r.footPx}`.padEnd(9),
      `${r.cutL}/${r.cutR}${r.masked ? " M" : ""}`.padEnd(11),
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
for (const r of rows.filter((x) => x.kneels)) {
  console.log(
    `  · ${r.era} KNEELS: a standing ${r.figurePx}px man drawn as ${r.inkPx}px of ink; its top (the muzzle) paints at ${r.inkTopPx}, ${(r.inkTopPx - r.headPx).toFixed(1)}px under his standing head line`
  );
}
for (const r of rows.filter((x) => UNSEATED.has(x.era))) {
  const hover = Math.max(...fs) - r.footPx;
  console.log(
    `  ! ${r.era} is UNSEATED and hovers ${hover.toFixed(1)}px above the disc — known, ADR-082 U25`
  );
}
console.log(`title          case=${t.case}  track=${t.track}  glow=${t.glow}`);

const heads = rows.map((r) => r.headPx);
const discs = rows.map((r) => r.discPx).filter((v) => v !== null);
const lifted = rows.some((r) => Math.abs(r.liftPx) > 0.5);
console.log(
  `lift           top ${rows[0].liftPx}px  · stage top ${rows[0].stagePx}  · heads ${Math.min(...heads)} .. ${Math.max(...heads)}  · disc ${Math.min(...discs)} .. ${Math.max(...discs)}  · ring ${rows[0].ringPx} vs figure centre ${((rows[0].headPx + rows[0].footPx) / 2).toFixed(1)}  · slack ${rows[0].slackPx}px`
);
console.log(
  `               head / feet / centre  ${((Math.min(...heads) / VH) * 100).toFixed(1)} / ${((Math.max(...fs) / VH) * 100).toFixed(1)} / ${(((Math.min(...heads) + Math.max(...fs)) / 2 / VH) * 100).toFixed(1)} % of the frame`
);

const fails = [];
/* ⚠ THE LIFT'S THREE LAWS (ADR-082 U31). They are asserted only where the lift
   is armed — PRM, the corridor fallback and a window under 720px tall compute
   `top: 0px` by design, and the probe must stay usable there. */
if (lifted) {
  // Every standing cap on the panel heads' row line. ±6px is the spread of the
  // deliveries' own foot seats (0.993–0.998) carried up through one span.
  for (const r of rows) {
    const off = r.headPx - r.stagePx;
    if (Math.abs(off) > 6)
      fails.push(
        `${r.era}: the cap paints ${off.toFixed(1)}px off the stage's top edge (limit ±6)`
      );
  }
  // One disc line: the lift is era-independent, so the disc may not move.
  if (Math.max(...discs) - Math.min(...discs) > 0.5)
    fails.push(
      `the projector disc moves ${(Math.max(...discs) - Math.min(...discs)).toFixed(1)}px between eras`
    );
  // The ring is centred on the painted figure by arithmetic, not by a dial.
  for (const r of rows) {
    if (r.ringPx === null) continue;
    const mid = (r.headPx + r.footPx) / 2;
    if (Math.abs(r.ringPx - mid) > 6)
      fails.push(
        `${r.era}: the reticle is ${(r.ringPx - mid).toFixed(1)}px off the figure's centre (limit ±6)`
      );
  }
}
if (rows[0].slackPx < 0)
  fails.push(
    `the slot is height-bound by ${(-rows[0].slackPx).toFixed(1)}px — the band has started to shrink the figure`
  );
if (spreadPct > SPREAD_LIMIT_PCT)
  fails.push(`figure heights spread ${spreadPct.toFixed(2)} % (limit ${SPREAD_LIMIT_PCT})`);
if (footDrift > FOOT_DRIFT_LIMIT_PX)
  fails.push(`the seated eras' boots left the disc by ${footDrift.toFixed(1)}px`);
/* ⚠ THE MEDIA BOX MAY NOT BE CUT BY ITS OWN WRAP (ADR-082 U31). 1px is
   sub-pixel rounding on a percentage inset; anything above it is a crop. */
for (const r of rows) {
  const worst = Math.max(r.cutL ?? 0, r.cutR ?? 0);
  if (worst > 1)
    fails.push(
      `${r.era}: the wrap cuts ${r.cutL}px / ${r.cutR}px off the media box (L/R)${r.masked ? " — a mask-image is still live on the wrap" : ""}`
    );
}
if (rows.some((r) => r.titleLines > 1)) fails.push("the era title wrapped");
if (t.case !== "uppercase") fails.push("the title is not on the house recipe (case)");
if (!t.glow) fails.push("the title is not on the house recipe (glow)");

if (fails.length) {
  console.log(`\nx ${fails.join("\n  x ")}`);
  process.exit(1);
}
console.log("\nok  one figure height, boots on the disc, title on the house recipe");
