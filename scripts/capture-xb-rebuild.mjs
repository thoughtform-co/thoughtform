/**
 * capture-xb-rebuild — the review stills for the X-Bionic proposal's two
 * rebuilt sections (`/test/xb-offer-rebuild`), at the brief's two desktop
 * sizes, with a fit gate that fails loudly rather than ship a clipped still.
 *
 * The gate, per still:
 *   - nothing inside the column crosses the column's box (so nothing crosses
 *     the rails);
 *   - no text renders below 12px (SVG text is measured after its scale);
 *   - no text box sits within 12px of a ruled frame's edge.
 *
 * Usage (dev server already running):
 *   node scripts/capture-xb-rebuild.mjs [--port 3003] [--only a,b,c,2a,2b,2c]
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/xbionic-proposal/rebuild-2026-10-11");
const ONLY = argOf("--only", "a,b,c,2a,2b,2c,p1,p2,p3").split(",");
const SIZES = [
  [1280, 720],
  [1470, 830],
];

const SHOTS = [
  { id: "a", name: "offer-a-s1", q: "d=a&step=1" },
  { id: "a", name: "offer-a-s2", q: "d=a&step=2" },
  { id: "a", name: "offer-a-s3", q: "d=a&step=3" },
  { id: "b", name: "offer-b", q: "d=b" },
  { id: "c", name: "offer-c", q: "d=c" },
  { id: "2a", name: "layer-a-s1", q: "d=2a&step=1" },
  { id: "2a", name: "layer-a-s2", q: "d=2a&step=2" },
  { id: "2a", name: "layer-a-s3", q: "d=2a&step=3" },
  { id: "2b", name: "layer-b", q: "d=2b" },
  { id: "2c", name: "layer-c", q: "d=2c" },
  { id: "p1", name: "substrate-p1", q: "d=p1" },
  { id: "p2", name: "substrate-p2", q: "d=p2" },
  { id: "p3", name: "substrate-p3", q: "d=p3" },
].filter((s) => ONLY.includes(s.id));

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
    const m = svg.getScreenCTM();
    const px = parseFloat(getComputedStyle(t).fontSize) * (m ? Math.hypot(m.a, m.b) : 1);
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
    await page.goto(`http://localhost:${PORT}/test/xb-offer-rebuild?${s.q}`, { waitUntil: "load" });
    await page.waitForFunction(() => document.documentElement.dataset.xbReady === "1", null, { timeout: 60000 });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important} *{transition:none!important}" });
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
