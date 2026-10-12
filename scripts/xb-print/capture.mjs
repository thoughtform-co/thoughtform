/* The X-Bionic proposal, one 1920×1080 still per print page, shot off the
   live page itself so every pixel is the page's own. Scroll-driven sections
   are shot in their designed static state (reduced motion), or with one
   project isolated. Usage: node capture.mjs <outDir> [origin] [only] */
import { chromium } from "playwright";
import fs from "node:fs";
const out = process.argv[2];
const origin = process.argv[3] ?? "http://localhost:3026";
const only = process.argv[4]?.split(",");
const URL = `${origin}/arcs/x-bionic/proposal`;
fs.mkdirSync(out, { recursive: true });

const top = (sel) => `document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect().top + scrollY`;
const isolate = (keep) => `
  .arc-lps__panel:not(#${keep}) { visibility: hidden !important; }`;
/* name, mode, scroll target (expression), offset, extra css */
const PAGES = [
  ["01-hero", "motion", "0", 0],
  ["02-vision", "motion", top("#vision"), 0],
  ["03-steps", "prm", top("#adoption"), 0],
  ["04-network", "prm", top("#adoption"), 1620],
  ["05-loop", "motion", top("#proof-loop"), 0],
  ["06-loop-frontier", "motion", top("#practice-frontier"), -200, isolate("practice-frontier")],
  ["07-loop-tools", "motion", top("#practice-tools"), -200, isolate("practice-tools")],
  ["08-loop-studio", "motion", top("#practice-studio"), -200, isolate("practice-studio")],
  ["09-loop-layer", "motion", top("#practice-layer"), -290, isolate("practice-layer")],
  ["10-brands", "motion", top("#proof-brands"), 0],
  ["11-job-production", "motion", top("#job-production"), 0],
  ["12-job-ops", "motion", top("#job-ops"), 0],
  ["13-job-review", "motion", top("#job-review"), 0],
  ["14-job-strategy", "motion", top("#job-strategy"), 0],
  ["15-offer", "motion", top("#offer"), 0],
  ["16-weeks", "motion", top("#phases"), 57],
  ["17-who", "motion", top("#how-we-work"), 64],
  ["18-fee", "motion", top("#pricing"), 0],
  ["19-about", "motion", top("#about"), 0],
  ["20-close", "motion", top("#close"), 0],
];

const b = await chromium.launch({ headless: false, args: ["--window-size=1920,1080"] });
for (const mode of ["motion", "prm"]) {
  const pages = PAGES.filter((p) => p[1] === mode && (!only || only.some((o) => p[0].startsWith(o))));
  if (!pages.length) continue;
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, reducedMotion: mode === "prm" ? "reduce" : "no-preference" });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle", timeout: 240000 });
  await p.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await p.waitForTimeout(2500);
  let y = 0;
  for (const [name, , expr, off, css] of pages) {
    const t = Math.round((await p.evaluate(expr)) + off);
    // walk with wheel steps so every scroll-driven writer sees the frames
    while (Math.abs(y - t) > 1) {
      const d = Math.max(-240, Math.min(240, t - y));
      await p.mouse.wheel(0, d); y += d; await p.waitForTimeout(35);
    }
    await p.waitForTimeout(1600);
    const sy = await p.evaluate(() => scrollY);
    let tag;
    if (css) tag = await p.addStyleTag({ content: css });
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/${name}.png` });
    if (tag) await tag.evaluate((n) => n.remove());
    console.log(name, t, sy);
  }
  await ctx.close();
}
await b.close();
