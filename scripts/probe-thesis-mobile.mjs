// Probe: the mobile Thoughtform beat's composition — title above the mark,
// paragraphs below it, the three phase labels between (ADR-018 mobile
// addendum, 2026-09-16).
//
// Every one of these boxes is a world anchor positioned AND scaled per frame
// by `useWorldDomTracker` (sceneGeom.ts `COPY_ANCHORS`), so the only honest
// measurement is `getBoundingClientRect` on the live page, swept across the
// beat's dwell: the mark, the compass, the body block and (since this pass)
// the phase labels all RISE from rest to the gate centre by
// `thoughtformHold`, and a composition that clears at rest can collide at
// the hold or vice versa. The walk keeps, per pair, the WORST frame.
//
// What is asserted, per shape, on every visible frame of the dwell:
//   1. no pairwise overlap between the title block, the body block and the
//      three phase labels (ENCODE is the one nearest the body);
//   2. the body's bottom edge stays above the bottom chrome band and the
//      title's top below the top one (`--mobile-chrome-*`, 56px at both
//      reference shapes — `.claude/rules/mobile-sections.md` §1);
//   3. the body sits BELOW the title (the owner's ask, stated as a number).
//
// ⚠ NEVER NAVIGATE THIS CORRIDOR BY A FIXED PIXEL COUNT — the stage is
// sized in viewport units (probe-corridor-caption's law). The sweep is in
// fractions of `.home-v2-stage`'s height over the mobile dwell
// (`MOBILE_THOUGHTFORM_END` = 0.30 of the stage's scroll span).
//
// ⚠ THE CORRIDOR IS WEBGL. Headed by default (the canvas is dead headless
// on a plain launch, which leaves every anchored box untransformed, i.e.
// trivially passing); `--headless` launches new-headless Chromium on
// SwiftShader, which `corridorCapable()` admits under `navigator.webdriver`.
// A frame in which the tracker has written no transform is skipped, and a
// shape on which NO frame was measured fails rather than passes.
//
//   node scripts/probe-thesis-mobile.mjs [--headless] [settleMs]

import { chromium } from "playwright";

const args = process.argv.slice(2);
const HEADLESS = args.includes("--headless");
const SETTLE_MS = Number(args.find((a) => /^\d+$/.test(a)) ?? 220);
const CHROME_BAND = 56; // --mobile-chrome-top / -bottom at both reference shapes
const TOL = 1;
const VIS = 0.05;
/** The mobile dwell is the thesis hold + rise of the phone paint clock
 *  (ADR-125: 100svh of the 820svh stage, i.e. 0.122 of it); sweep a touch
 *  past it into the flight. */
const SWEEP = { from: 0.0, to: 0.16, step: 0.005 };

const SHAPES = [
  ["iphone-14", 390, 844],
  ["iphone-14-pro-max", 430, 932],
];

const BOXES = [
  ["title", '[data-world-anchor="thoughtform.leftCopy"]'],
  ["body", '[data-world-anchor="thoughtform.mobileBody"]'],
  ["navigate", '[data-world-anchor="thoughtform.phase.navigate"]'],
  ["encode", '[data-world-anchor="thoughtform.phase.encode"]'],
  ["build", '[data-world-anchor="thoughtform.phase.build"]'],
];

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

async function readBoxes(page) {
  return page.evaluate((boxes) => {
    const out = {};
    for (const [key, sel] of boxes) {
      const el = document.querySelector(sel);
      if (!el) {
        out[key] = null;
        continue;
      }
      const r = el.getBoundingClientRect();
      out[key] = {
        left: r.left,
        right: r.right,
        top: r.top,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
        alpha: Number(getComputedStyle(el).opacity),
        // The tracker writes an inline transform once it has projected the
        // anchor; an empty one is a frame it has not painted yet.
        placed: el.style.transform !== "",
      };
    }
    return out;
  }, BOXES);
}

const overlap = (a, b) =>
  Math.min(a.right, b.right) - Math.max(a.left, b.left) > TOL &&
  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > TOL;

const browser = await chromium.launch({
  headless: HEADLESS,
  // A harness that pins its own Chromium (PLAYWRIGHT_BROWSERS_PATH with an
  // older build than the package expects) hands it over here.
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: HEADLESS ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : [],
});
let failures = 0;

for (const [name, width, height] of SHAPES) {
  const page = await browser.newPage({
    viewport: { width, height },
    isMobile: true,
    hasTouch: true,
  });
  await page.goto("http://localhost:3003/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-v2-stage");
  await page.waitForTimeout(2500);

  const { stageTop, stageH } = await page.evaluate(() => {
    const el = document.querySelector(".home-v2-stage");
    const r = el.getBoundingClientRect();
    return { stageTop: r.top + window.scrollY, stageH: r.height };
  });
  // The corridor's scroll span is the stage's height less one viewport.
  const span = stageH - height;

  const pairs = [
    ["title", "body"],
    ["title", "navigate"],
    ["title", "build"],
    ["body", "encode"],
    ["body", "build"],
    ["body", "navigate"],
  ];
  const worst = new Map(); // pair → { gap, frac }
  let measured = 0;
  let bodyBelowTitle = true;
  let worstBodyBottom = -Infinity;
  let worstTitleTop = Infinity;
  const frames = [];

  for (let frac = SWEEP.from; frac <= SWEEP.to + 1e-9; frac += SWEEP.step) {
    await rollTo(page, Math.round(stageTop + span * frac));
    const b = await readBoxes(page);
    const title = b.title;
    const body = b.body;
    if (!title || !body) {
      console.log(`  ${name}: anchors missing — title=${!!title} body=${!!body}`);
      failures += 1;
      break;
    }
    if (!title.placed || !body.placed || !(title.alpha >= VIS) || !(body.alpha >= VIS)) continue;
    measured += 1;
    frames.push({
      frac: frac.toFixed(2),
      title: [Math.round(title.top), Math.round(title.bottom)],
      body: [Math.round(body.top), Math.round(body.bottom)],
      encode: b.encode?.placed ? [Math.round(b.encode.top), Math.round(b.encode.bottom)] : null,
    });
    if (body.top <= title.bottom) bodyBelowTitle = false;
    worstBodyBottom = Math.max(worstBodyBottom, body.bottom);
    worstTitleTop = Math.min(worstTitleTop, title.top);
    for (const [p, q] of pairs) {
      const A = b[p];
      const B = b[q];
      if (!A || !B || !A.placed || !B.placed || !(A.alpha >= VIS) || !(B.alpha >= VIS)) continue;
      // Signed vertical gap (positive = clear). Labels are left/right of
      // centre so a horizontal miss is also a clear.
      const vGap = Math.max(B.top - A.bottom, A.top - B.bottom);
      const hGap = Math.max(B.left - A.right, A.left - B.right);
      const gap = Math.max(vGap, hGap);
      const key = `${p}↔${q}`;
      const prev = worst.get(key);
      if (!prev || gap < prev.gap) worst.set(key, { gap, frac, hit: overlap(A, B) });
    }
  }

  console.log(
    `\n═══ ${name}  ${width}×${height}   stage=${Math.round(stageH)}  frames=${measured}`
  );
  if (measured === 0) {
    console.log("   ⚠ NO FRAME MEASURED — the tracker never placed the anchors (dead canvas?)");
    failures += 1;
  }
  for (const f of frames.filter((_, i) => i % 4 === 0)) {
    console.log(
      `   frac ${f.frac}  title ${f.title[0]}–${f.title[1]}  body ${f.body[0]}–${f.body[1]}` +
        (f.encode ? `  encode ${f.encode[0]}–${f.encode[1]}` : "")
    );
  }
  for (const [key, s] of worst) {
    const ok = !s.hit;
    if (!ok) failures += 1;
    console.log(
      `   ${key.padEnd(18)} worst gap ${s.gap.toFixed(1).padStart(7)}px  @frac ${s.frac.toFixed(2)}  ${ok ? "OK" : "⚠ OVERLAP"}`
    );
  }
  const bottomOk = worstBodyBottom <= height - CHROME_BAND + TOL;
  const topOk = worstTitleTop >= CHROME_BAND - TOL;
  if (!bottomOk) failures += 1;
  if (!topOk) failures += 1;
  if (!bodyBelowTitle) failures += 1;
  console.log(
    `   body bottom max ${worstBodyBottom.toFixed(1)} vs band ${height - CHROME_BAND}  ${bottomOk ? "OK" : "⚠ UNDER THE CHROME"}`
  );
  console.log(
    `   title top min ${worstTitleTop.toFixed(1)} vs band ${CHROME_BAND}  ${topOk ? "OK" : "⚠ UNDER THE CHROME"}`
  );
  console.log(`   body below title on every frame: ${bodyBelowTitle ? "OK" : "⚠ NO"}`);
  await page.close();
}

await browser.close();
console.log(failures ? `\n${failures} finding(s).` : "\nThe composition clears on every frame.");
process.exit(failures ? 1 : 0);
