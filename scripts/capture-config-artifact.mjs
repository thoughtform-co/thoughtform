/**
 * capture-config-artifact — the review stills for the configuration
 * artifact's five permutations (`/test/config-artifact`), each in its
 * section-1 and section-2 frame, at the brief's two desktop sizes, with the
 * same fit gate as capture-xb-rebuild.mjs (column, 12px floor, SVG text cut
 * by its drawing, text against a ruled frame).
 *
 * Usage (dev server already running):
 *   node scripts/capture-config-artifact.mjs [--port 3013] [--only 1,2,3,4,5]
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3013");
const OUT = argOf("--out", "docs/design/xbionic-proposal/config-artifact-2026-10-11");
const ONLY = argOf("--only", "1,2,3,4,5").split(",");
const SIZES = [
  [1280, 720],
  [1470, 830],
];

const SHOTS = [1, 2, 3, 4, 5].flatMap((n) =>
  [1, 2].map((f) => ({ id: String(n), name: `p${n}-s${f}`, q: `p=${n}&f=${f}` })),
).filter((s) => ONLY.includes(s.id));

function gate() {
  const out = [];
  const col = document.querySelector("[data-xb-col]");
  if (!col) return ["no column"];
  const c = col.getBoundingClientRect();
  const label = (el) => (el.textContent || el.tagName).trim().slice(0, 40);
  for (const el of col.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (getComputedStyle(el).visibility === "hidden") continue;
    if (r.left < c.left - 0.5 || r.right > c.right + 0.5 || r.top < c.top - 0.5 || r.bottom > c.bottom + 0.5) {
      out.push(`outside column: <${el.tagName.toLowerCase()}> "${label(el)}" ${Math.round(r.left)},${Math.round(r.top)} → ${Math.round(r.right)},${Math.round(r.bottom)}`);
    }
  }
  for (const t of col.querySelectorAll("svg text")) {
    const svg = t.ownerSVGElement;
    // The text's own transform counts too (labels laid in a plane, engraved
    // on a face): its vertical scale is what sets the rendered cap height.
    const m = t.getScreenCTM();
    const px = parseFloat(getComputedStyle(t).fontSize) * (m ? Math.hypot(m.c, m.d) : 1);
    if (px < 11.95) out.push(`svg text at ${px.toFixed(1)}px: "${label(t)}"`);
    // An SVG clips at its own box, so text past it is cut, not overflowing.
    const s = svg.getBoundingClientRect();
    const r = t.getBoundingClientRect();
    if (r.left < s.left - 0.5 || r.right > s.right + 0.5 || r.top < s.top - 0.5 || r.bottom > s.bottom + 0.5) {
      out.push(`svg text cut by its drawing's edge: "${label(t)}"`);
    }
  }
  for (const el of col.querySelectorAll("p, span, li, h2, div")) {
    if (el.children.length || !el.textContent.trim()) continue;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px < 12) out.push(`text at ${px}px: "${label(el)}"`);
  }
  for (const f of col.querySelectorAll("[data-xb-ruled]")) {
    const fr = f.getBoundingClientRect();
    for (const t of f.querySelectorAll("[data-xb-ruled] text, [data-xb-ruled] p, [data-xb-ruled] span")) {
      if (t.children.length && t.tagName !== "text") continue;
      const r = t.getBoundingClientRect();
      if (!r.width) continue;
      const near = Math.min(r.left - fr.left, fr.right - r.right, r.top - fr.top, fr.bottom - r.bottom);
      if (near < 12) out.push(`text ${near.toFixed(0)}px from its frame: "${label(t)}"`);
    }
  }
  return out;
}

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });
let failed = 0;
for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  for (const s of SHOTS) {
    await page.goto(`http://localhost:${PORT}/test/config-artifact?${s.q}`, { waitUntil: "load" });
    await page.waitForFunction(() => document.documentElement.dataset.xbReady === "1", null, { timeout: 60000 });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important} *{transition:none!important}" });
    // The dev-only env banner is not part of the design.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("div")) if (el.textContent?.startsWith("DEV: Supabase env missing")) el.remove();
    });
    const problems = await page.evaluate(gate);
    const file = `${OUT}/${s.name}-${w}x${h}.png`;
    await page.screenshot({ path: file });
    if (problems.length) {
      failed++;
      console.log(`✗ ${s.name} ${w}x${h}`);
      for (const p of problems.slice(0, 12)) console.log(`    ${p}`);
    } else console.log(`✓ ${s.name} ${w}x${h}`);
  }
  await ctx.close();
}
await browser.close();
if (failed) {
  console.log(`\n${failed} still(s) failed the fit gate.`);
  process.exit(1);
}
