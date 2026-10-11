#!/usr/bin/env node
/**
 * Stills + a layout audit for /test/halyard (the X-Bionic offer sections).
 *
 *   node scripts/capture-halyard.mjs [--port 3003] [--only a1,b] [--headed]
 *
 * Cells: A at steps 1–3, B, C — each at 1280×720 and 1470×830. Writes
 * docs/design/halyard/stills/<cell>-<w>x<h>.png and prints, per cell: the
 * smallest rendered type, the title's size, anything outside the band, and
 * any label printing over line work or another label.
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const arg = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const PORT = arg("port", "3003");
const HEADED = args.includes("--headed");
const ONLY = arg("only", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const CELLS = [
  { id: "a1", q: "d=a&step=1" },
  { id: "a2", q: "d=a&step=2" },
  { id: "a3", q: "d=a&step=3" },
  { id: "b", q: "d=b" },
  { id: "c", q: "d=c" },
].filter((c) => ONLY.length === 0 || ONLY.includes(c.id));
const VIEWPORTS = [
  [1280, 720],
  [1470, 830],
];

const OUT = resolve("docs/design/halyard/stills");
mkdirSync(OUT, { recursive: true });

function audit() {
  const box = document.querySelector(".hy-box");
  if (!box) return { error: "no .hy-box" };
  const B = box.getBoundingClientRect();
  const out = { minFont: 99, minFontAt: "", title: 0, outside: [], overlaps: [], tight: [] };

  const title = box.querySelector(".hy-title");
  if (title) out.title = parseFloat(getComputedStyle(title).fontSize);

  /* every element that paints text */
  const texts = [];
  const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest("title")) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    let op = 1;
    for (let a = el; a && a !== box; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
    if (op < 0.05) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const r = range.getBoundingClientRect();
    if (r.width < 1) continue;
    texts.push({ el, r, text: n.textContent.trim().slice(0, 28), svg: el instanceof SVGElement });
    const fs = parseFloat(cs.fontSize);
    if (fs < out.minFont) {
      out.minFont = fs;
      out.minFontAt = n.textContent.trim().slice(0, 24);
    }
  }

  /* outside the band */
  for (const t of texts) {
    const r = t.r;
    if (r.left < B.left - 1 || r.right > B.right + 1 || r.top < B.top - 1 || r.bottom > B.bottom + 1) {
      out.outside.push(`${t.text} [${Math.round(r.left)},${Math.round(r.top)} → ${Math.round(r.right)},${Math.round(r.bottom)}]`);
    }
  }
  for (const el of box.querySelectorAll("svg path, svg rect")) {
    let op = 1;
    for (let a = el; a && a !== box; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
    if (op < 0.05) continue;
    let r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    /* a clipping svg bounds what its children can paint */
    const svg = el.closest("svg");
    if (svg && getComputedStyle(svg).overflow === "hidden") {
      const c = svg.getBoundingClientRect();
      r = { left: Math.max(r.left, c.left), right: Math.min(r.right, c.right) };
    }
    if (r.left < B.left - 2 || r.right > B.right + 2) {
      out.outside.push(`<${el.getAttribute("class") || el.tagName}> x ${Math.round(r.left)}..${Math.round(r.right)} vs band ${Math.round(B.left)}..${Math.round(B.right)}`);
    }
  }

  /* label on label */
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i].r,
        b = texts[j].r;
      if (texts[i].el === texts[j].el) continue;
      const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ix > 1 && iy > 1) out.overlaps.push(`"${texts[i].text}" × "${texts[j].text}"`);
    }
  }

  /* label on line work: sample the label's box (inflated) against every
     visible stroked path, in each path's own user space */
  const paths = [...box.querySelectorAll("svg path, svg rect")].filter((p) => {
    let op = 1;
    for (let a = p; a && a !== box; a = a.parentElement) op *= parseFloat(getComputedStyle(a).opacity);
    const cs = getComputedStyle(p);
    /* the floor grid is knocked out under type, by the label's own stroke */
    if (p.classList.contains("hy-hair")) return false;
    /* a lettered key is a box built around its letter */
    if (p.classList.contains("hy-key")) return false;
    return op > 0.05 && cs.stroke !== "none" && parseFloat(cs.strokeOpacity || "1") > 0;
  });
  for (const t of texts) {
    const pad = t.svg ? 4 : 12;
    const r = t.r;
    let hit = null;
    for (const p of paths) {
      const m = p.getScreenCTM();
      if (!m) continue;
      const inv = m.inverse();
      const pr = p.getBoundingClientRect();
      if (pr.right < r.left - pad || pr.left > r.right + pad || pr.bottom < r.top - pad || pr.top > r.bottom + pad) continue;
      for (let x = r.left - pad; x <= r.right + pad && !hit; x += 2) {
        for (let y = r.top - pad; y <= r.bottom + pad && !hit; y += 2) {
          const lp = new DOMPoint(x, y).matrixTransform(inv);
          const sp = new DOMPoint(lp.x, lp.y);
          if (p.isPointInStroke && p.isPointInStroke(sp)) hit = p.getAttribute("class") || p.tagName;
        }
      }
      if (hit) break;
    }
    if (hit) out.tight.push(`"${t.text}" ~ <${hit}>`);
  }
  return out;
}

const browser = await chromium.launch({ headless: !HEADED });
let failed = 0;
for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  for (const cell of CELLS) {
    const url = `http://localhost:${PORT}/test/halyard?${cell.q}&still=1`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelectorAll("#leftTicks .hud__rail__tick").length === 13, null, { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => !!document.querySelector(".hy-box"), null, { timeout: 15000 });
    await page.waitForTimeout(600);
    const file = resolve(OUT, `${cell.id}-${w}x${h}.png`);
    await page.screenshot({ path: file, animations: "disabled" });
    const a = await page.evaluate(audit);
    const flag = a.error || a.minFont < 12 || a.outside.length || a.overlaps.length || a.tight.length;
    if (flag) failed++;
    console.log(`\n${cell.id} ${w}x${h}  ${flag ? "CHECK" : "OK"}  min ${a.minFont}px (${a.minFontAt})  title ${a.title}px`);
    for (const k of ["outside", "overlaps", "tight"]) for (const line of a[k] || []) console.log(`  ${k}: ${line}`);
    if (a.error) console.log(`  ${a.error}`);
  }
  await ctx.close();
}
await browser.close();
console.log(`\nstills → ${OUT}`);
process.exit(failed ? 1 : 0);
