/**
 * capture-xb-flow — block 8 on /test/proposition-artifact, the flow from S1 A
 * into P3 B, shot at points along its runway at the brief's two desktop
 * sizes, with the fit gate on each: no visible text under 12px (SVG text
 * measured after its scale, skipped while its groups hold it under 5 %
 * opacity), and the stage pinned at the screen's top across the runway.
 *
 *   node scripts/capture-xb-flow.mjs [--port 3003] [--out dir]
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/xbionic-proposal/proposition-artifact/flow");
const SIZES = [
  [1280, 720],
  [1470, 830],
];
/* S1 A step 1 · step 2 · built · the flow at a quarter, half, three
   quarters · P3 B */
const STOPS = [0.02, 0.21, 0.46, 0.6, 0.71, 0.82, 0.97];

function gate() {
  const out = [];
  const root = document.getElementById("flow-ab");
  const vh = innerHeight;
  const label = (el) => (el.textContent || "").trim().slice(0, 40);
  const svg = root.querySelector("svg");
  const shown = (t) => {
    let o = 1;
    for (let n = t; n && n !== svg; n = n.parentElement) {
      const a = n.getAttribute("opacity");
      if (a !== null) o *= parseFloat(a);
      const fo = n.getAttribute("fill-opacity");
      if (n === t && fo !== null) o *= parseFloat(fo);
    }
    return o;
  };
  for (const t of svg.querySelectorAll("text")) {
    if (shown(t) < 0.05) continue;
    const r = t.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > vh) continue;
    const m = t.getScreenCTM();
    const px = parseFloat(getComputedStyle(t).fontSize) * (m ? Math.hypot(m.a, m.b) : 1);
    if (px < 11.95) out.push(`svg text at ${px.toFixed(1)}px: "${label(t)}"`);
    if (r.left < 0 || r.right > innerWidth) out.push(`svg text off screen: "${label(t)}"`);
  }
  for (const el of root.querySelectorAll("p, span, li, h2, div")) {
    if (el.children.length || !el.textContent.trim()) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || r.bottom < 0 || r.top > vh) continue;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px < 12) out.push(`text at ${px}px: "${label(el)}"`);
  }
  return {
    out,
    t: root.querySelector("[data-flow-t]").dataset.flowT,
    top: Math.round(root.querySelector(".xb-stage").getBoundingClientRect().top),
  };
}

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });
let failed = 0;
for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/test/proposition-artifact`, {
    waitUntil: "load",
    timeout: 180000,
  });
  await page.waitForFunction(() => document.documentElement.dataset.xbReady === "1", null, {
    timeout: 60000,
  });
  await page.addStyleTag({
    content:
      "nextjs-portal,.pa-index{display:none!important} *{transition:none!important} html{scroll-behavior:auto!important}",
  });
  const tops = [];
  for (const [k, f] of STOPS.entries()) {
    await page.evaluate((f) => {
      const run = document.querySelector("#flow-ab [data-flow-t]");
      const top = run.getBoundingClientRect().top + scrollY;
      window.scrollTo(0, top + f * (run.offsetHeight - innerHeight));
    }, f);
    await page.waitForTimeout(500);
    const res = await page.evaluate(gate);
    tops.push(res.top);
    const name = `flow-${String(k + 1).padStart(2, "0")}-${w}x${h}.png`;
    await page.screenshot({ path: `${OUT}/${name}` });
    if (res.out.length) {
      failed++;
      console.log(`✗ ${w}x${h} t ${res.t}`);
      for (const p of res.out.slice(0, 10)) console.log(`    ${p}`);
    } else console.log(`✓ ${w}x${h} t ${res.t}`);
  }
  if (tops.some((t) => Math.abs(t) > 1)) {
    failed++;
    console.log(`✗ ${w}x${h} the stage did not pin: ${tops.join(", ")}`);
  } else console.log(`✓ ${w}x${h} pinned across the runway`);
  await ctx.close();
}
await browser.close();
if (failed) process.exit(1);
