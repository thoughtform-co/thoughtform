#!/usr/bin/env node
/**
 * Stills for /test/loop-proof-lab (and the live X-Bionic beats it redraws).
 *
 *   node scripts/capture-loop-proof-lab.mjs --base http://localhost:3012 \
 *     --path /test/loop-proof-lab --sel "#lp-a-practice-studio" --vp 1470x830 --out dir
 *
 * Several --sel are allowed; each is scrolled into view (real scroll, the
 * reveal ladder runs) and shot as the viewport, so the still is what a
 * reader sees with the card seated.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const get = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : d;
};
const all = (k) => args.flatMap((a, i) => (a === k ? [args[i + 1]] : []));

const base = get("--base", "http://localhost:3012");
const p = get("--path", "/test/loop-proof-lab");
const out = get("--out", "docs/design/loop-proof-lab/stills");
const vps = all("--vp").length ? all("--vp") : ["1470x830"];
const sels = all("--sel");
const theme = get("--theme", "dark");
const full = args.includes("--full");

fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: !args.includes("--headed") });
for (const vp of vps) {
  const [w, h] = vp.split("x").map(Number);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
  const page = await ctx.newPage();
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }, theme);
  await page.goto(base + p, { waitUntil: "networkidle", timeout: 240000 });
  await page.waitForTimeout(1500);
  for (const sel of sels) {
    const el = page.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    // seat the element's top a little under the header
    await page.evaluate((s) => {
      const e = document.querySelector(s);
      if (!e) return;
      const r = e.getBoundingClientRect();
      const free = window.innerHeight - r.height;
      window.scrollBy(0, r.top - Math.max(0, Math.min(free / 2, 96)));
    }, sel);
    await page.waitForTimeout(1600);
    const name = `${sel.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}-${vp}.png`;
    const file = path.join(out, name);
    if (full) await el.screenshot({ path: file });
    else await page.screenshot({ path: file });
    const box = await el.boundingBox();
    console.log(file, box ? `${Math.round(box.width)}x${Math.round(box.height)}` : "no box");
  }
  await ctx.close();
}
await browser.close();
