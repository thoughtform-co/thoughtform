/**
 * capture-proposal-kit — the review stills for `/test/proposal-kit`: every
 * section of every board (the control first), at the owner's viewports, in
 * both themes, with a fit gate and a contact sheet per board.
 *
 * The gate, per still (a FAILED gate still writes its still, marked ✗):
 *   - no lettered thing crosses a rail;
 *   - no text renders below 12px (SVG text measured after its scale);
 *   - no two lettered things print through each other;
 * and it REPORTS, without failing, whether the section fits one screen.
 *
 * A green gate is not a pass: every still is read by eye against its control.
 *
 * Usage (dev server already running):
 *   node scripts/capture-proposal-kit.mjs --port 3019
 *     [--board system|flow|job|close] [--only flow-f1,flow-f2]
 *     [--sizes 1280x720,1470x830,1920x1247] [--themes dark,light]
 *     [--job 1] [--out docs/design/proposal-kit/round-01] [--dpr 1]
 */

import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3019");
const OUT = argOf("--out", "docs/design/proposal-kit/round-01");
const BOARD = argOf("--board", "");
const ONLY = argOf("--only", "").split(",").filter(Boolean);
const SIZES = argOf("--sizes", "1280x720,1470x830,1920x1247")
  .split(",")
  .map((s) => s.split("x").map(Number));
const THEMES = argOf("--themes", "dark,light").split(",");
const JOB = argOf("--job", "1");
const DPR = Number(argOf("--dpr", "1"));
const BASE = `http://localhost:${PORT}/test/proposal-kit`;

function gate(id) {
  const out = [];
  const slot = document.getElementById(id);
  if (!slot) return { problems: [`no section #${id}`], fits: false, height: 0 };
  const label = (el) => (el.textContent || el.tagName).trim().replace(/\s+/g, " ").slice(0, 44);
  const rails = [...document.querySelectorAll(".hud__rail")].map((r) => r.getBoundingClientRect());
  const left = rails.length ? Math.min(...rails.map((r) => r.right)) : 0;
  const right = rails.length > 1 ? Math.max(...rails.map((r) => r.left)) : innerWidth;

  // lettered leaves: an element whose own text nodes carry ink
  const leaves = [];
  for (const el of slot.querySelectorAll("*")) {
    if (el.closest(".pkit-tag, svg")) continue;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
    const range = document.createRange();
    range.selectNodeContents(el);
    const r = range.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    // sr-only and clipped text is not lettered
    if (r.width <= 2 || cs.clip === "rect(0px, 0px, 0px, 0px)") continue;
    leaves.push({ el, r, px: parseFloat(cs.fontSize) });
  }
  for (const { el, r, px } of leaves) {
    if (px < 11.95) out.push(`text at ${px.toFixed(1)}px: "${label(el)}"`);
    if (r.left < left - 0.5 || r.right > right + 0.5)
      out.push(`crosses a rail: "${label(el)}" ${Math.round(r.left)} → ${Math.round(r.right)}`);
  }
  for (const t of slot.querySelectorAll("svg text")) {
    const m = t.ownerSVGElement.getScreenCTM();
    const px = parseFloat(getComputedStyle(t).fontSize) * (m ? Math.hypot(m.a, m.b) : 1);
    if (px < 11.95) out.push(`svg text at ${px.toFixed(1)}px: "${label(t)}"`);
  }
  for (let i = 0; i < leaves.length; i++) {
    for (let j = i + 1; j < leaves.length; j++) {
      const a = leaves[i];
      const b = leaves[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      // two lines of one heading share a tight leading by design
      if (a.el.parentElement === b.el.parentElement && a.el.closest("h1, h2, h3")) continue;
      const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (w > 1.5 && h > 1.5) out.push(`overlap: "${label(a.el)}" × "${label(b.el)}"`);
    }
  }
  const height = Math.round(slot.getBoundingClientRect().height);
  return { problems: out, fits: height <= innerHeight + 1, height };
}

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });

// the sections, read off the page itself, so the script cannot drift from the boards
const probe = await browser.newPage();
await probe.goto(`${BASE}${BOARD ? `?b=${BOARD}` : ""}`, { waitUntil: "load" });
await probe.waitForFunction(() => document.documentElement.dataset.xbReady === "1", null, {
  timeout: 240000,
});
let sections = await probe.evaluate(() =>
  [...document.querySelectorAll(".pkit-slot")].map((s) => ({ id: s.id, board: s.dataset.board }))
);
await probe.close();
if (ONLY.length) sections = sections.filter((s) => ONLY.includes(s.id));
if (!sections.length) {
  console.log("no sections matched");
  await browser.close();
  process.exit(1);
}

let failed = 0;
const sheets = new Map();
for (const theme of THEMES) {
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: DPR,
      reducedMotion: "no-preference",
    });
    await ctx.addInitScript((t) => {
      try {
        if (t === "light") localStorage.setItem("tf-theme", "light");
        else localStorage.removeItem("tf-theme");
      } catch {}
    }, theme);
    const page = await ctx.newPage();
    for (const s of sections) {
      const q = `d=${s.id}&still=1${s.board === "job" ? `&job=${JOB}` : ""}`;
      await page.goto(`${BASE}?${q}`, { waitUntil: "load" });
      await page.waitForFunction(() => document.documentElement.dataset.xbReady === "1", null, {
        timeout: 240000,
      });
      await page.addStyleTag({
        content:
          "nextjs-portal{display:none!important} *,*::before,*::after{transition:none!important;animation:none!important}",
      });
      await page.waitForTimeout(350);
      const res = await page.evaluate(gate, s.id);
      const suffix = `${w}x${h}${theme === "light" ? "-light" : ""}`;
      const dir = path.join(OUT, s.board);
      await mkdir(dir, { recursive: true });
      const file = path.join(dir, `${s.id}-${suffix}.png`);
      await page.screenshot({ path: file });
      if (!res.fits) {
        // the frame is fixed to the viewport: in a stitched full-height still it
        // would print once, across whatever sits at that scroll offset
        await page.addStyleTag({ content: ".hud,.theme-toggle{visibility:hidden!important}" });
        await page
          .locator(`#${s.id}`)
          .screenshot({ path: path.join(dir, `${s.id}-${suffix}-full.png`) });
      }
      const key = `${s.board}-${suffix}`;
      if (!sheets.has(key)) sheets.set(key, { board: s.board, suffix, w, h, files: [] });
      sheets.get(key).files.push({ id: s.id, file });
      const fit = res.fits ? "one screen" : `${res.height}px in a ${h}px screen`;
      if (res.problems.length) {
        failed++;
        console.log(`✗ ${s.id} ${suffix} (${fit})`);
        for (const p of res.problems.slice(0, 14)) console.log(`    ${p}`);
      } else console.log(`✓ ${s.id} ${suffix} (${fit})`);
    }
    await ctx.close();
  }
}

// one contact sheet per board, viewport and theme: the control beside its directions
const sheetPage = await browser.newPage({ viewport: { width: 1600, height: 900 } });
for (const { board, suffix, w, h, files } of sheets.values()) {
  if (files.length < 2) continue;
  const cols = files.length > 4 ? 3 : 2;
  const cellW = Math.floor(1600 / cols);
  const data = await Promise.all(
    files.map(async (f) => `data:image/png;base64,${(await readFile(f.file)).toString("base64")}`)
  );
  const html = `<body style="margin:0;background:#050504;display:grid;grid-template-columns:repeat(${cols},1fr);gap:2px">${files
    .map(
      (f, i) =>
        `<figure style="margin:0;position:relative"><img src="${data[i]}" style="display:block;width:100%"><figcaption style="position:absolute;left:8px;top:8px;font:12px ui-monospace,monospace;color:#caa554;background:#050504;padding:3px 6px">${f.id}</figcaption></figure>`
    )
    .join("")}</body>`;
  await sheetPage.setContent(html, { waitUntil: "load" });
  const rows = Math.ceil(files.length / cols);
  await sheetPage.setViewportSize({
    width: 1600,
    height: Math.ceil(rows * ((cellW * h) / w)) + rows * 2,
  });
  await sheetPage.screenshot({ path: path.join(OUT, `contact-${board}-${suffix}.png`) });
}
await browser.close();

if (failed) {
  console.log(`\n${failed} still(s) failed the fit gate.`);
  process.exit(1);
}
