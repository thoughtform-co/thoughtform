// Probe: do the corridor's copy boxes clear the phone gutter?
//
// ⚠ THREE THINGS THIS EXISTS TO MEASURE, AND THE AUTHORED WIDTH IS NOT
// ONE OF THEM.
//
// 1. `.home-v2-readout__caption` and the `--title` cluster are positioned
//    AND SCALED per frame by `useWorldDomTracker` against their anchor's
//    `perspectiveScale` (sceneGeom.ts). A `width` in the sheet is what the
//    box is BEFORE that multiply, so the only honest measurement is
//    `getBoundingClientRect`, which reports the live transform. The
//    contract is `left >= floor - TOL` and `right <= layoutW - floor + TOL`
//    (one pixel of tolerance for subpixel layout; `floor` is
//    `--copy-gutter` less half a classic scrollbar — see below).
//
// 2. The three gates do NOT share a scale. navigate.title/support cap at
//    1.1, the diagnostic and intelligence pair at 1.15 — so a box measured
//    on whichever beat you happen to land on is a box measured against one
//    of three answers. All three are walked, and the widest VISIBLE frame
//    of each is what the assertion runs on.
//
// 3. The TITLE cluster's line count is the other half of the trade: the
//    gutter is bought by narrowing the box, and "NAVIGATE THE INTELLIGENCE."
//    is the string that decides whether that costs a line. Printed rather
//    than asserted, because today the title's own `max-width: 36ch` is
//    narrower than the cluster at both phone widths and the count is
//    therefore NOT this box's to control — that stops being true below
//    ~330w, which is exactly when this line becomes a reading again.
//
// ⚠ NEVER NAVIGATE THIS CORRIDOR BY A FIXED PIXEL COUNT — the stage is
// sized in viewport units, so one `y` lands at a different FRACTION on
// every shape (landing-corridor-smoke's `walkToArc` law). And settling
// costs real MILLISECONDS: `data-corridor-phase` is written from the WebGL
// frameloop off a SMOOTHED scroll value, so a walk that settles on
// requestAnimationFrame alone never sees the attribute change at all. The
// search below is a Playwright-side loop with a timeout per probe.
//
// ⚠ AND PARKING ON THE PHASE IS NOT ENOUGH — THE FIRST CUT OF THIS PROBE
// MEASURED THE WRONG FRAME. `data-corridor-phase` flips at the BAND edge
// (CORRIDOR_BEAT_ENTER), which is where the gate ahead is still at
// `opacity: 0` and the tracker has not written a transform at all: the box
// then reports its AUTHORED width at a resting `left: -3`, i.e. the probe
// reads a failure on a box that paints nothing, and never sees the peak.
// So the walk SWEEPS the corridor and keeps, per gate, the sample with the
// LARGEST rendered width among frames where the gate is actually visible
// (α ≥ VIS). That frame is the anchor at its `perspectiveScale.max`, which
// is the only frame the gutter has to survive.
//
// ⚠ AND `100vw` IS NOT THE CONTENT WIDTH UNDER A CLASSIC SCROLLBAR. The
// site paints a 6px `::-webkit-scrollbar`, so desktop Chromium (which is
// what a Playwright phone emulation is) reports `innerWidth` 390 against a
// LAYOUT viewport of 384 — while `.home-v2-stage` is `100vw`, i.e. 390, and
// overflows it. The tracker's projection is centred on the layout viewport
// (measured: the box's centre is `clientWidth / 2` to the pixel at both
// shapes), so the CSS spends a 390-wide budget inside a 384-wide window and
// each gutter comes out 3px short. On a real phone the scrollbar is an
// overlay, `innerWidth === clientWidth`, and the gutter is exactly
// `--copy-gutter`. So the floor here is `--copy-gutter - scrollbar/2`, the
// scrollbar is printed, and a run on a device with overlay bars asserts the
// full 24px with no change to this file.
//
// ⚠ HEADED, because the corridor is WebGL and headless leaves the canvas
// dead — which also leaves every world-anchored box untransformed, i.e.
// passing.
//
//   node scripts/probe-corridor-caption.mjs [settleMs]

import { chromium } from "playwright";

const SETTLE_MS = Number(process.argv[2] ?? 260);
const COPY_GUTTER = 24; // must equal --copy-gutter (home-v2.css, ≤760)
const TOL = 1;
/** A gate below this alpha is not on screen, so its box is not a reading. */
const VIS = 0.05;
/** Sweep window + step, as fractions of `.home-v2-stage`'s height. */
const SWEEP = { from: 0.18, to: 0.92, step: 0.02 };

const SHAPES = [
  ["iphone-14", 390, 844],
  ["iphone-14-pro-max", 430, 932],
];

/**
 * The three gates, by the `data-world-anchor` base `StationTitle` renders
 * (CopyAnchors.tsx): the corridor's `navigate` / `encode` / `build` phases
 * mount `navigate` / `diagnostic` / `intelligence`.
 */
const GATES = [
  ["navigate", "navigate"],
  ["encode", "diagnostic"],
  ["build", "intelligence"],
];

/** Roll to `y` in viewport-sized steps, then let the corridor catch up. */
async function rollTo(page, y) {
  await page.evaluate(async (target) => {
    const step = Math.max(300, window.innerHeight * 0.5);
    const from = window.scrollY;
    const dir = target > from ? 1 : -1;
    for (let at = from; dir > 0 ? at < target : at > target; at += dir * step) {
      window.scrollTo(0, at);
      await new Promise((r) => requestAnimationFrame(r));
    }
    window.scrollTo(0, target);
  }, y);
  await page.waitForTimeout(SETTLE_MS);
}

/** Live boxes for one gate, with the tracker's scale already in them. */
async function readGate(page, base) {
  return page.evaluate((anchorBase) => {
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, width: r.width, height: r.height };
    };
    const cluster = document.querySelector(`[data-world-anchor="${anchorBase}.title"]`);
    const support = document.querySelector(`[data-world-anchor="${anchorBase}.support"]`);
    const caption = support?.querySelector(".home-v2-readout__caption") ?? null;
    const title = cluster?.querySelector(".home-v2-readout__title") ?? null;

    // ⚠ LINE COUNT COMES FROM RANGE RECTS, NOT height/line-height. The
    // cluster is scaled, so a ratio of two transformed numbers is fine in
    // principle and wrong the moment a rung changes; the client rects of
    // the text's own Range are the runs the browser actually laid out.
    let lines = null;
    let text = null;
    if (title) {
      const rg = document.createRange();
      rg.selectNodeContents(title);
      const rects = Array.from(rg.getClientRects()).filter((r) => r.width > 1 && r.height > 1);
      // Runs on one visual line share a top; collapse to distinct tops.
      const tops = new Set(rects.map((r) => Math.round(r.top)));
      lines = tops.size;
      text = title.textContent?.trim() ?? "";
    }
    const opacityOf = (el) => (el ? Number(getComputedStyle(el).opacity) : null);
    return {
      caption: box(caption),
      cluster: box(cluster),
      titleLines: lines,
      titleText: text,
      captionOpacity: opacityOf(support),
      clusterOpacity: opacityOf(cluster),
    };
  }, base);
}

const browser = await chromium.launch({ headless: false });
let failures = 0;

for (const [name, width, height] of SHAPES) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto("http://localhost:3003/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-v2-stage");
  await page.waitForTimeout(2000);

  const { stage, layoutW, scrollbar } = await page.evaluate(() => {
    const el = document.querySelector(".home-v2-stage");
    return {
      stage: el ? el.getBoundingClientRect().height : 9000,
      layoutW: document.documentElement.clientWidth,
      scrollbar: window.innerWidth - document.documentElement.clientWidth,
    };
  });
  // The gutter the CSS can actually deliver in THIS window (see the header).
  const floor = COPY_GUTTER - scrollbar / 2;

  // worst = the visible sample with the widest rendered box, per gate/box.
  const worst = new Map(); // `${base}:${box}` → sample
  const phasesSeen = new Set();

  for (let frac = SWEEP.from; frac <= SWEEP.to + 1e-9; frac += SWEEP.step) {
    const y = Math.round(stage * frac);
    await rollTo(page, y);
    const phase = await page.evaluate(() =>
      document.documentElement.getAttribute("data-corridor-phase")
    );
    if (phase) phasesSeen.add(phase);

    for (const [, base] of GATES) {
      const r = await readGate(page, base);
      for (const [key, box, alpha] of [
        ["caption", r.caption, r.captionOpacity],
        ["cluster", r.cluster, r.clusterOpacity],
      ]) {
        if (!box || box.width < 1 || !(alpha >= VIS)) continue;
        const id = `${base}:${key}`;
        const prev = worst.get(id);
        if (!prev || box.width > prev.box.width) {
          worst.set(id, { box, alpha, y, frac, phase, lines: r.titleLines, text: r.titleText });
        }
      }
    }
  }

  console.log(
    `\n═══ ${name}  ${width}×${height}   stage=${Math.round(stage)}  ` +
      `layout=${layoutW}  scrollbar=${scrollbar}px  ` +
      `gutter=${COPY_GUTTER}px → floor=${floor}px  tol=±${TOL}px  ` +
      `phases=${[...phasesSeen].join(",")}`
  );

  for (const [phase, base] of GATES) {
    console.log(`  ── ${phase}  (anchor \`${base}\`)`);
    for (const key of ["caption", "cluster"]) {
      const s = worst.get(`${base}:${key}`);
      if (!s) {
        console.log(`     ${key.padEnd(8)} never visible in the sweep — NOT MEASURED`);
        failures += 1;
        continue;
      }
      // Measured against the LAYOUT viewport, which is the window the
      // reader sees; `width` (innerWidth) includes the scrollbar.
      const leftPad = s.box.left;
      const rightPad = layoutW - s.box.right;
      const ok = leftPad >= floor - TOL && rightPad >= floor - TOL;
      if (!ok) failures += 1;
      console.log(
        `     ${key.padEnd(8)} peak w=${s.box.width.toFixed(1).padStart(6)}  ` +
          `left=${leftPad.toFixed(1).padStart(6)}  right=${rightPad.toFixed(1).padStart(6)}  ` +
          `α=${s.alpha.toFixed(2)}  @frac=${s.frac.toFixed(2)} y=${s.y}  ` +
          `${ok ? "OK" : "⚠ INSIDE THE GUTTER"}`
      );
      if (key === "cluster") {
        console.log(`              title lines=${s.lines}  "${s.text}"`);
      }
    }
  }

  await page.close();
}

await browser.close();
console.log(
  failures ? `\n${failures} box(es) inside the gutter.` : "\nEvery box clears the gutter."
);
process.exit(failures ? 1 : 0);
