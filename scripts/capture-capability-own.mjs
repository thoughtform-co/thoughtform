/**
 * capture-capability-own — /test/capability-own, each variant held at named
 * moments of its runway (`?v=<id>&p=<p>&still=1`), so two shoots are the same
 * picture.
 *
 * Usage (dev server already running):
 *   node scripts/capture-capability-own.mjs --port 3021
 *     [--only a,b] [--ps 0,0.3,0.6,1] [--sizes 1976x966,1920x1247]
 *     [--themes dark,light] [--out docs/design/capability-own/round-01]
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3021");
const ONLY = argOf("--only", "a,b,c,d").split(",").filter(Boolean);
const PS = argOf("--ps", "0,0.25,0.5,0.75,1").split(",").map(Number);
const SIZES = argOf("--sizes", "1976x966")
  .split(",")
  .map((s) => s.split("x").map(Number));
const THEMES = argOf("--themes", "dark").split(",");
const OUT = argOf("--out", "docs/design/capability-own/round-01");

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });
for (const theme of THEMES) {
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
    });
    await ctx.addInitScript((t) => {
      try {
        if (t === "light") localStorage.setItem("tf-theme", "light");
        else localStorage.removeItem("tf-theme");
      } catch {}
    }, theme);
    const page = await ctx.newPage();
    page.on("pageerror", (e) => console.log(`! page error: ${e.message}`));
    for (const v of ONLY) {
      for (const p of PS) {
        await page.goto(`http://localhost:${PORT}/test/capability-own?v=${v}&p=${p}&still=1`, {
          waitUntil: "load",
        });
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({
          content:
            "nextjs-portal{display:none!important} html{scroll-behavior:auto!important} *,*::before,*::after{transition:none!important;animation:none!important}",
        });
        /* the variant's pinned screen: scroll its runway's top to the screen's */
        await page.evaluate((id) => {
          const el = document.getElementById(id);
          if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
        }, `co-${v}`);
        await page.waitForTimeout(450);
        const file = path.join(
          OUT,
          `${v}-p${String(Math.round(p * 100)).padStart(3, "0")}-${w}x${h}${theme === "light" ? "-light" : ""}.png`
        );
        await page.screenshot({ path: file });
        console.log(`· ${path.basename(file)}`);
      }
    }
    await ctx.close();
  }
}
await browser.close();
