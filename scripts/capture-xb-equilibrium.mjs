/**
 * capture-xb-equilibrium — the X-Bionic proposal's second section (the
 * equilibrium, bloom off) and its hand-off into the vision (S1 A): the gate's
 * ring and mark lift out and land on the layer's slot. HEADED: the hologram
 * is WebGL and a headless run would shoot the static fallback.
 *
 * Stops: the equilibrium alone, then the vision's runway top at 80 %, 55 %,
 * 30 %, 8 % and 0 of the screen (S1 A pinned), then a quarter and a half of
 * the way down the runway (the layer half arrived, then whole: the carrier
 * handing over to the drawing). Also checks the scene went live.
 *
 *   node scripts/capture-xb-equilibrium.mjs [--port 3003] [--theme dark|light] [--vp 1470x830]
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const PORT = argOf("--port", "3003");
const THEME = argOf("--theme", "dark");
const [W, H] = argOf("--vp", "1470x830").split("x").map(Number);
const OUT = argOf("--out", "docs/design/xbionic-proposal/equilibrium");
const STOPS = [null, 0.8, 0.55, 0.3, 0.08, 0, "q", "h"];

const browser = await chromium.launch({ headless: false });
await mkdir(OUT, { recursive: true });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: THEME });
await ctx.addInitScript((t) => {
  try {
    localStorage.setItem("tf-theme", t);
  } catch {}
}, THEME);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(`http://localhost:${PORT}/arcs/x-bionic/proposal`, { waitUntil: "load", timeout: 180000 });
await page.addStyleTag({ content: "nextjs-portal{display:none!important} html{scroll-behavior:auto!important}" });
for (const [k, f] of STOPS.entries()) {
  await page.evaluate((f) => {
    if (f === null) {
      const eq = document.getElementById("one-motion");
      window.scrollTo(0, eq.getBoundingClientRect().top + scrollY);
      return;
    }
    const v = document.querySelector("#vision .xbA-runway") ?? document.getElementById("vision");
    const r = v.getBoundingClientRect();
    if (typeof f === "string") {
      const span = r.height - innerHeight;
      window.scrollTo(0, r.top + scrollY + (f === "q" ? 0.25 : 0.5) * span);
      return;
    }
    window.scrollTo(0, r.top + scrollY - f * innerHeight);
  }, f);
  await page.waitForTimeout(k === 0 ? 7000 : 1200);
  const info = await page.evaluate(() => ({
    holo: document.querySelector("#equilibrium")?.getAttribute("data-holo"),
    carrier: getComputedStyle(document.querySelector(".arc-eq-carrier")).visibility,
    visionTop: Math.round(document.getElementById("vision").getBoundingClientRect().top),
    opacity: document.querySelector(".arc-eq-carrier")?.style.opacity,
  }));
  await page.screenshot({ path: `${OUT}/eq-${THEME}-${W}x${H}-${k + 1}.png` });
  console.log(`stop ${k + 1}`, JSON.stringify(info));
}
if (errors.length) console.log("page errors:", errors.slice(0, 3));
await browser.close();
