#!/usr/bin/env node
/**
 * measure-arc-beats — is every beat of an arc page one screen?
 *
 * The fill rhythm (ADR-128, ADR-153's 2026-10-09 amendment) holds a beat to
 * one screen by its CONTENT BOTTOM: the lowest painted box inside the
 * section, measured from the section's top. A section box that is taller
 * than the frame is fine when the content inside it is not; the reverse is
 * the defect. This prints both for every `section[id]` on the page.
 *
 *   node scripts/measure-arc-beats.mjs                       # x-bionic, 1280x720, dark
 *   node scripts/measure-arc-beats.mjs --vp 1470x830 --theme light
 *   node scripts/measure-arc-beats.mjs --path /arcs/pandora/proposal --ids vision,pricing
 *
 * The dev server must be running (`npm run dev`). The port is `--port`, then
 * `$PORT`, then 3003. Where Playwright's own browser is not installed, run
 * `npx playwright install chromium` once; a container with a system
 * Chromium at /opt/pw-browsers/chromium uses that one.
 *
 * The page is scrolled through once before measuring, because the arcs'
 * reveals hold their boxes at rest until they have been seen.
 */
import { existsSync } from "node:fs";

import { chromium } from "@playwright/test";

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const [W, H] = arg("--vp", "1280x720").split("x").map(Number);
const theme = arg("--theme", "dark");
const port = arg("--port", process.env.PORT || "3003");
const path = arg("--path", "/arcs/x-bionic/proposal");
const ids = arg("--ids", "").split(",").filter(Boolean);

const SYSTEM_CHROMIUM = "/opt/pw-browsers/chromium";
const browser = await chromium.launch(
  existsSync(SYSTEM_CHROMIUM) ? { executablePath: SYSTEM_CHROMIUM } : {}
);
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  reducedMotion: "no-preference",
});
await ctx.addInitScript((t) => {
  try {
    localStorage.setItem("theme", t);
  } catch {}
}, theme);
const page = await ctx.newPage();
await page.goto(`http://localhost:${port}${path}`, { waitUntil: "load", timeout: 120000 });
await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
for (
  let y = 0;
  y < (await page.evaluate(() => document.body.scrollHeight));
  y += Math.round(H * 0.6)
) {
  await page.evaluate((to) => window.scrollTo(0, to), y);
  await page.waitForTimeout(40);
}
await page.waitForTimeout(1200);

const rows = await page.evaluate((only) => {
  const secs = [...document.querySelectorAll("section[id]")].filter(
    (s) => !only.length || only.includes(s.id)
  );
  return secs.map((s) => {
    const box = s.getBoundingClientRect();
    let bottom = box.top;
    for (const el of s.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      bottom = Math.max(bottom, r.bottom);
    }
    return { id: s.id, h: Math.round(box.height), content: Math.round(bottom - box.top) };
  });
}, ids);

console.log(`${path} at ${W}x${H}, ${theme}`);
for (const r of rows) {
  const over = r.content > H ? `  over by ${r.content - H}px` : "";
  console.log(
    `${r.id.padEnd(22)} box ${String(r.h).padStart(5)}  content ${String(r.content).padStart(5)}${over}`
  );
}
await browser.close();
