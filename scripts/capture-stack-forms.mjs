/**
 * capture-stack-forms — stills of /test/stack-forms, one direction at a time,
 * at the owner's viewport first (1920x1247), then the two smaller ones.
 *
 * Each still is the drawing alone (`?still=1`: no chrome, no motion), so two
 * shoots of the same direction at the same pose are the same picture.
 *
 * Usage (dev server already running):
 *   node scripts/capture-stack-forms.mjs --port 3019
 *     [--only wire,wire-b,print,…]         some of them (default: all nine)
 *     [--open 0,0.5,1]                     the poses (0 closed, 1 opened)
 *     [--sizes 1920x1247,1470x830,1280x720]
 *     [--dpr 1]
 *     [--out docs/design/stack-forms/round-01]
 *     [--clip x,y,w,h]                     a close-up, in CSS px
 *     [--twice]                            shoot each twice and report any that differ
 *     [--sheet]                            also one contact sheet a pose and a size
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3019");
const OUT = argOf("--out", "docs/design/stack-forms/round-01");
const ONLY = argOf("--only", "wire,wire-b,print,readout,swarm,swarm-b,swarm-c,phosphor,phosphor-b")
  .split(",")
  .filter(Boolean);
const OPEN = argOf("--open", "0,0.5,1").split(",").map(Number);
const SIZES = argOf("--sizes", "1920x1247,1470x830,1280x720")
  .split(",")
  .map((s) => s.split("x").map(Number));
const DPR = Number(argOf("--dpr", "1"));
const CLIP = argOf("--clip", "");
const TWICE = args.includes("--twice");

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });
let differ = 0;
for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: DPR,
    reducedMotion: "no-preference",
  });
  const page = await ctx.newPage();
  for (const id of ONLY) {
    for (const open of OPEN) {
      const url = `http://localhost:${PORT}/test/stack-forms?v=${id}&open=${open}&still=1`;
      const shoot = async () => {
        await page.goto(url, { waitUntil: "load" });
        /* the layouts above render nothing until the session has loaded */
        await page.waitForSelector('.sf-root[data-sf-ready="1"]', { timeout: 240000 });
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
        await page.evaluate(
          () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        );
        await page.waitForTimeout(350);
        const shot = {};
        if (CLIP) {
          const [x, y, cw, ch] = CLIP.split(",").map(Number);
          shot.clip = { x, y, width: cw, height: ch };
        }
        return page.screenshot(shot);
      };
      const name = `${id}-open${String(Math.round(open * 100)).padStart(3, "0")}-${w}x${h}${CLIP ? "-clip" : ""}.png`;
      const png = await shoot();
      await (await import("node:fs/promises")).writeFile(path.join(OUT, name), png);
      let note = "";
      if (TWICE) {
        const again = await shoot();
        if (!png.equals(again)) {
          differ++;
          note = "  ✗ a second shoot differs";
        } else note = "  ✓ repeatable";
      }
      console.log(`· ${name}${note}`);
    }
  }
  await ctx.close();
}

/* --sheet: the drawings side by side, one sheet a pose and a size, so they
   can be told apart at a glance: one row up to five, a square grid beyond
   (stills inlined: a file:// image does not load into a blank page) */
if (args.includes("--sheet") && !CLIP) {
  const { readFile } = await import("node:fs/promises");
  const page = await browser.newPage({ viewport: { width: 2400, height: 1000 } });
  for (const [w, h] of SIZES) {
    for (const open of OPEN) {
      const tag = `open${String(Math.round(open * 100)).padStart(3, "0")}-${w}x${h}`;
      const cells = [];
      for (const id of ONLY) {
        const png = await readFile(path.join(OUT, `${id}-${tag}.png`)).catch(() => null);
        if (png)
          cells.push(
            `<figure><img src="data:image/png;base64,${png.toString("base64")}"><figcaption>${id}</figcaption></figure>`
          );
      }
      if (!cells.length) continue;
      const cols = cells.length > 5 ? Math.ceil(Math.sqrt(cells.length)) : cells.length;
      await page.setContent(
        `<!doctype html><style>html{background:#0a0908}body{margin:0;display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;padding:8px}figure{margin:0}img{width:100%;display:block}figcaption{font:12px monospace;letter-spacing:.1em;text-transform:uppercase;color:#8a857c;padding:6px 2px}</style>${cells.join("")}`
      );
      await page.screenshot({ path: path.join(OUT, `sheet-${tag}.png`), fullPage: true });
      console.log(`· sheet-${tag}.png`);
    }
  }
}

await browser.close();
if (TWICE)
  console.log(differ ? `\n${differ} still(s) are not repeatable.` : "\nEvery still is repeatable.");
process.exit(differ ? 1 : 0);
