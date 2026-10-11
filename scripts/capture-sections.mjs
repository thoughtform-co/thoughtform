#!/usr/bin/env node
/**
 * capture-sections — one viewport still per section id, at 1280×720 and
 * 1470×830, headed (the arc shell's reveals stall in a hidden document).
 *
 *     node scripts/capture-sections.mjs --path /test/x-bionic-core --ids core-o1,core-o2 --out <dir>
 *
 * Flags: --port 3003 · --themes dark,light (default dark) · --offset 0 (px
 * past the section top) · --vps 1280x720,1470x830
 *
 * Also prints, per still, the section's text that ends outside the viewport
 * and any text under 12px, so a still is never the only check.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const PORT = argOf("--port", "3003");
const ROUTE = argOf("--path", "/test/x-bionic-core");
const IDS = argOf("--ids", "").split(",").filter(Boolean);
const OUT = path.resolve(argOf("--out", "docs/design/xbionic-proposal/core-stills"));
const THEMES = argOf("--themes", "dark").split(",");
const OFFSET = Number(argOf("--offset", "0"));
const VPS = argOf("--vps", "1280x720,1470x830")
  .split(",")
  .map((s) => s.split("x").map(Number));

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: false });
for (const theme of THEMES) {
  for (const [w, h] of VPS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript((t) => {
      try {
        localStorage.setItem("theme", t);
      } catch {}
    }, theme);
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${PORT}${ROUTE}`, { waitUntil: "load", timeout: 120000 });
    await page.waitForTimeout(1500);
    // walk the page once so every reveal arms
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += h * 0.7) {
      await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y);
      await page.waitForTimeout(120);
    }
    for (const id of IDS) {
      await page.evaluate(
        ([sid, off]) => {
          const el = document.getElementById(sid);
          if (!el) return;
          const top = el.getBoundingClientRect().top + window.scrollY + off;
          window.scrollTo({ top, behavior: "instant" });
        },
        [id, OFFSET]
      );
      await page.waitForTimeout(1400);
      const file = path.join(OUT, `${id}-${w}x${h}-${theme}.png`);
      await page.screenshot({ path: file });
      const report = await page.evaluate(
        ([sid, vh]) => {
          const el = document.getElementById(sid);
          if (!el) return { missing: true };
          const small = new Set();
          const below = [];
          for (const n of el.querySelectorAll("*")) {
            const own = [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
            if (!own) continue;
            const cs = getComputedStyle(n);
            if (cs.visibility === "hidden" || cs.display === "none") continue;
            const r = n.getBoundingClientRect();
            if (!r.width) continue;
            if (parseFloat(cs.fontSize) < 12) small.add(`${cs.fontSize} "${n.textContent.trim().slice(0, 24)}"`);
            if (r.bottom > vh + 1) below.push(`"${n.textContent.trim().slice(0, 30)}" +${Math.round(r.bottom - vh)}`);
          }
          return { small: [...small].slice(0, 8), below: below.slice(0, 6) };
        },
        [id, h]
      );
      console.log(path.basename(file), JSON.stringify(report));
    }
    await ctx.close();
  }
}
await browser.close();
