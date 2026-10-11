/**
 * capture-proposition-artifact — stills of /test/proposition-artifact at the
 * brief's two desktop sizes, one per block (a pinned block at the start,
 * middle and end of its runway), with the xb fit gate on each: no text under
 * 12px (SVG text measured after its scale), no SVG text cut by its drawing.
 *
 *   node scripts/capture-proposition-artifact.mjs [--port 3003] [--out dir]
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/xbionic-proposal/proposition-artifact");
const SIZES = [
  [1280, 720],
  [1470, 830],
];
const BLOCKS = ["s1-pinned", "halyard-a", "p1-sheets", "p3-board", "s2-pinned"];

function gate(id) {
  const out = [];
  const root = document.getElementById(id);
  const vh = innerHeight;
  const label = (el) => (el.textContent || "").trim().slice(0, 40);
  for (const t of root.querySelectorAll("svg text")) {
    const r = t.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > vh) continue;
    const m = t.ownerSVGElement.getScreenCTM();
    const px = parseFloat(getComputedStyle(t).fontSize) * (m ? Math.hypot(m.a, m.b) : 1);
    if (px < 11.95) out.push(`svg text at ${px.toFixed(1)}px: "${label(t)}"`);
    const s = t.ownerSVGElement.getBoundingClientRect();
    if (r.left < s.left - 0.5 || r.right > s.right + 0.5 || r.top < s.top - 0.5 || r.bottom > s.bottom + 0.5)
      out.push(`svg text cut by its drawing: "${label(t)}"`);
  }
  for (const el of root.querySelectorAll("p, span, li, h2, div")) {
    if (el.children.length || !el.textContent.trim()) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > vh) continue;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px < 12) out.push(`text at ${px}px: "${label(el)}"`);
  }
  return out;
}

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });
let failed = 0;
for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/test/proposition-artifact`, { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(() => document.documentElement.dataset.xbReady === "1", null, { timeout: 60000 });
  await page.addStyleTag({ content: "nextjs-portal,.pa-index{display:none!important} *{transition:none!important}" });
  for (const id of BLOCKS) {
    const run = await page.evaluate((i) => {
      const el = document.getElementById(i);
      return { top: el.getBoundingClientRect().top + scrollY, h: el.offsetHeight };
    }, id);
    const span = Math.max(0, run.h - h);
    const stops = span > h * 0.5 ? [0, 0.5, 1] : [0];
    for (const [k, f] of stops.entries()) {
      await page.evaluate((y) => window.scrollTo(0, y), run.top + span * f);
      await page.waitForTimeout(500);
      const problems = await page.evaluate(gate, id);
      const name = stops.length > 1 ? `${id}-s${k + 1}` : id;
      await page.screenshot({ path: `${OUT}/${name}-${w}x${h}.png` });
      if (problems.length) {
        failed++;
        console.log(`✗ ${name} ${w}x${h}`);
        for (const p of problems.slice(0, 10)) console.log(`    ${p}`);
      } else console.log(`✓ ${name} ${w}x${h}`);
    }
  }
  await ctx.close();
}
await browser.close();
if (failed) {
  console.log(`\n${failed} still(s) failed the fit gate.`);
  process.exit(1);
}
