/**
 * capture-machine-mind — stills of /test/machine-mind, one direction at a
 * time, at the owner's viewport first (1920x1247), then a laptop.
 *
 * Each still is the drawing alone (`?still=1`: no chrome) with the clock
 * frozen (`?t=`), so two shoots of the same direction are the same picture.
 *
 * Usage (dev server already running):
 *   node scripts/capture-machine-mind.mjs --port 3013
 *     [--only e1,…,d1,…,today]           some of them (default: all of them)
 *     [--themes dark,light]
 *     [--views iso,front]
 *     [--parted]                       also each direction parted
 *     [--t 6]                          the frozen clock, seconds
 *     [--sizes 1920x1247,1440x820]
 *     [--dpr 1]
 *     [--out docs/design/machine-mind/round-01]
 *     [--clip x,y,w,h]                 a close-up, in CSS px
 *     [--twice]                        shoot each twice and report any that differ
 */

import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3013");
const OUT = argOf("--out", "docs/design/machine-mind/round-01");
const ONLY = argOf("--only", "h1,g1,f1,f2,f3,e1,e2,e3,d1,d2,d3,d4,d5,d6,today").split(",").filter(Boolean);
const THEMES = argOf("--themes", "dark,light").split(",").filter(Boolean);
const VIEWS = argOf("--views", "iso,front").split(",").filter(Boolean);
const PARTED = args.includes("--parted");
const T = argOf("--t", "6");
const SIZES = argOf("--sizes", "1920x1247,1440x820")
  .split(",")
  .map((s) => s.split("x").map(Number));
const DPR = Number(argOf("--dpr", "1"));
const CLIP = argOf("--clip", "");
const TWICE = args.includes("--twice");

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });
let differ = 0;
for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: DPR, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  for (const id of ONLY) {
    for (const theme of THEMES) {
      for (const view of VIEWS) {
        for (const parted of PARTED ? [false, true] : [false]) {
          const q = [`v=${id}`, "still=1", `t=${T}`, theme === "light" ? "theme=light" : "", view === "front" ? "view=front" : "", parted ? "parted=1" : ""].filter(Boolean).join("&");
          const url = `http://localhost:${PORT}/test/machine-mind?${q}`;
          const shoot = async () => {
            await page.goto(url, { waitUntil: "load" });
            /* the test layout renders nothing until the session has loaded */
            await page.waitForSelector("canvas[data-mm-stage][data-mm-ready]", { timeout: 240000 });
            await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
            /* the dev env banner (components/dev/DevEnvBanner.tsx) is page chrome, not the drawing */
            await page.evaluate(() => {
              for (const el of document.querySelectorAll("div")) if (el.textContent?.startsWith("DEV: Supabase env missing")) el.style.display = "none";
            });
            await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
            await page.waitForTimeout(300);
            const shot = {};
            if (CLIP) {
              const [x, y, cw, ch] = CLIP.split(",").map(Number);
              shot.clip = { x, y, width: cw, height: ch };
            }
            return page.screenshot(shot);
          };
          const name = `${id}-${theme}-${view}${parted ? "-parted" : ""}-${w}x${h}${CLIP ? "-clip" : ""}.png`;
          const png = await shoot();
          await writeFile(path.join(OUT, name), png);
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
    }
  }
  await ctx.close();
}
await browser.close();
if (TWICE) console.log(differ ? `\n${differ} still(s) are not repeatable.` : "\nEvery still is repeatable.");
process.exit(differ ? 1 : 0);
