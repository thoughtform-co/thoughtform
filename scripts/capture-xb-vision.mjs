/**
 * capture-xb-vision — the X-Bionic proposal's vision section, which is S1 A
 * (the pinned build) ported verbatim from /test/proposition-artifact
 * (owner, 2026-10-11). Shoots it at the start, middle and end of its runway
 * at the brief's two desktop sizes and the owner's own, and gates each
 * still: the stage pinned at the screen's top, no text under 12px (SVG
 * text measured after its scale), no SVG text cut by its drawing, and
 * PARITY with block 1 on the artifact page at the same viewport and the
 * same point of its runway: the column, the text column, the title, the
 * three steps, the drawing and the active step land on the same boxes
 * within 1px.
 *
 *   node scripts/capture-xb-vision.mjs [--port 3003] [--out dir] [--theme dark|light]
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/xbionic-proposal/vision-s1a");
const THEME = argOf("--theme", "dark");
const SIZES = [
  [1280, 720],
  [1470, 830],
  [1920, 1247],
];
const STOPS = [0.02, 0.5, 0.98];

/** Scroll so the block's runway sits at fraction t of its pinned span. */
function seat([rootSel, t]) {
  const run = document.querySelector(`${rootSel} .xbA-runway`);
  const top = run.getBoundingClientRect().top + scrollY;
  window.scrollTo(0, top + t * (run.offsetHeight - innerHeight));
}

function read(rootSel) {
  const root = document.querySelector(rootSel);
  const box = (sel) => {
    const el = root.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10);
  };
  const problems = [];
  const vh = innerHeight;
  const label = (el) => (el.textContent || "").trim().slice(0, 40);
  for (const t of root.querySelectorAll("svg text")) {
    const r = t.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > vh) continue;
    const m = t.ownerSVGElement.getScreenCTM();
    const px = parseFloat(getComputedStyle(t).fontSize) * (m ? Math.hypot(m.a, m.b) : 1);
    if (px < 11.95) problems.push(`svg text at ${px.toFixed(1)}px: "${label(t)}"`);
    const s = t.ownerSVGElement.getBoundingClientRect();
    if (r.left < s.left - 0.5 || r.right > s.right + 0.5 || r.top < s.top - 0.5 || r.bottom > s.bottom + 0.5)
      problems.push(`svg text cut by its drawing: "${label(t)}"`);
  }
  for (const el of root.querySelectorAll("p, span, li, h2, div")) {
    if (el.children.length || !el.textContent.trim()) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > vh) continue;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px < 12) problems.push(`text at ${px}px: "${label(el)}"`);
  }
  return {
    problems,
    stageTop: Math.round(root.querySelector(".xb-stage").getBoundingClientRect().top),
    on: [...root.querySelectorAll(".xbA__step")].findIndex((s) => s.hasAttribute("data-on")) + 1,
    boxes: {
      col: box(".xb-col"),
      text: box(".xbA__text"),
      title: box(".xb-title"),
      steps: box(".xbA__steps"),
      fig: box(".xbA__fig svg"),
    },
  };
}

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });
let failed = 0;
for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
    colorScheme: THEME,
  });
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem("tf-theme", t);
    } catch {}
  }, THEME);
  const page = await ctx.newPage();
  const lab = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/arcs/x-bionic/proposal`, { waitUntil: "load", timeout: 180000 });
  await lab.goto(`http://localhost:${PORT}/test/proposition-artifact`, { waitUntil: "load", timeout: 180000 });
  for (const p of [page, lab]) {
    await p.addStyleTag({ content: "nextjs-portal,.pa-index{display:none!important} *{transition:none!important}" });
    await p.evaluate(() => document.fonts.ready);
  }
  const tops = [];
  for (const [k, f] of STOPS.entries()) {
    await page.evaluate(seat, ["#vision", f]);
    await lab.evaluate(seat, ["#s1-pinned", f]);
    await page.waitForTimeout(700);
    await lab.waitForTimeout(700);
    const a = await page.evaluate(read, "#vision");
    const b = await lab.evaluate(read, "#s1-pinned");
    await page.screenshot({ path: `${OUT}/vision-${THEME}-${w}x${h}-s${k + 1}.png` });
    tops.push(a.stageTop);
    const problems = [...a.problems];
    if (a.on !== b.on) problems.push(`active step ${a.on} against block 1's ${b.on}`);
    for (const key of Object.keys(a.boxes)) {
      const p = a.boxes[key];
      const q = b.boxes[key];
      if (!p || !q || p.some((v, i) => Math.abs(v - q[i]) > 1))
        problems.push(`${key} ${JSON.stringify(p)} against block 1's ${JSON.stringify(q)}`);
    }
    if (problems.length) {
      failed++;
      console.log(`✗ ${w}x${h} stop ${k + 1} (step ${a.on})`);
      for (const p of problems.slice(0, 12)) console.log(`    ${p}`);
    } else console.log(`✓ ${w}x${h} stop ${k + 1} (step ${a.on}) same boxes as block 1`);
  }
  if (tops.some((t) => Math.abs(t) > 1)) {
    failed++;
    console.log(`✗ ${w}x${h} the stage did not pin at the top: ${tops.join(", ")}`);
  } else console.log(`✓ ${w}x${h} pinned at the top across the runway`);
  await ctx.close();
}
await browser.close();
if (failed) process.exit(1);
