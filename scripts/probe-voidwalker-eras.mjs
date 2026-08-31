/**
 * probe-voidwalker-eras — walk every era on the live hologram and measure the
 * dossier panels for clipping.
 *
 * The roster is authored copy in fixed seats (`--vwh-lede-h` / `--vwh-seat-h`,
 * ADR-082 U11), so a new era is a new chance to overrun one. A screenshot
 * cannot settle it: text that overflows a seat by a line looks like text that
 * ends there.
 *
 * ⚠ AND `scrollHeight === clientHeight` IS NOT THE WHOLE TEST. A centred box
 * spills equally through its top and bottom and reports zero overflow — the
 * casefile learned that one plate over. So this measures the RECTS too: the
 * lede's painted bottom against the seat below it, which is where a long
 * record body would actually land.
 *
 * Usage (dev server must already be running, headed — the corridor is WebGL):
 *   node scripts/probe-voidwalker-eras.mjs [--port 3003] [--vp 1440x900]
 */

import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const [VW, VH] = argOf("--vp", "1440x900").split("x").map(Number);

const browser = await chromium.launch({ headless: args.includes("--headless") });
const ctx = await browser.newContext({
  viewport: { width: VW, height: VH },
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();
await page.goto(`http://localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
// ⚠ The corridor is lazy and inflates layout late, so the station's own node is
// the ready signal — a fixed sleep races the dev server's first compile.
await page.waitForSelector("#voidwalker .vw", { timeout: 90_000 });
await page.waitForTimeout(1500);

// Walk into the station the way a reader does; a teleport leaves the corridor
// clocks unarmed and the stage never enters hologram mode.
const station = await page.locator("#voidwalker").first();
await station.scrollIntoViewIfNeeded();
for (let i = 0; i < 40; i += 1) {
  const mode = await page.getAttribute("#voidwalker .vw", "data-vw-mode");
  if (mode === "hologram") break;
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(120);
}

const tabs = await page.locator("[data-vwh-era-tab]").evaluateAll((els) =>
  els.map((e) => e.getAttribute("data-vwh-era-tab"))
);
console.log("eras on the rail:", tabs.join(" · "));

const rows = [];
for (const era of tabs) {
  await page.click(`[data-vwh-era-tab='${era}']`);
  // ⚠ WAIT OUT THE MASTHEAD DECODE. An era click re-scrambles the title, so a
  // short settle reports "The campaign commaIW4P" and any title assertion is
  // reading a frame of the animation rather than the copy.
  await page.waitForTimeout(1800);
  const r = await page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        sel,
        over: el.scrollHeight - el.clientHeight,
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        h: Math.round(rect.height),
      };
    };
    // ⚠ MEASURE THE INK, NOT THE BOX. A panel's box carries padding and the
    // seats are deliberately tight, so box overlap is the normal composition —
    // it reported 24px on `genai`, an era nobody had touched and which reads
    // correctly on screen. What actually matters is whether one panel's
    // GLYPHS reach into another's, and a Range over the text nodes is the only
    // thing that answers it.
    const inkOf = (el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let top = Infinity;
      let bottom = -Infinity;
      let left = Infinity;
      let right = -Infinity;
      let node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
          if (r.width < 0.5 || r.height < 0.5) continue;
          top = Math.min(top, r.top);
          bottom = Math.max(bottom, r.bottom);
          left = Math.min(left, r.left);
          right = Math.max(right, r.right);
        }
      }
      return Number.isFinite(top) ? { top, bottom, left, right } : null;
    };

    const panels = [...document.querySelectorAll("#voidwalker .vwd__body")]
      .map((el) => {
        /* ⚠ THE HEAD IS A SIBLING, NOT A CHILD (ADR-082 U19). The datum
           composition makes each head and body separate grid items on
           purpose — that is what puts a head's bottom edge exactly ON a row
           boundary, which is where its rail runs. Looking for it inside the
           body finds nothing and every panel reports "?". */
        const cell = el.getAttribute("data-cell");
        const head = cell
          ? document.querySelector(`#voidwalker .vwd__head[data-cell="${cell}"]`)
          : null;
        const ink = inkOf(el);
        if (!ink) return null;
        return {
          head: head ? head.textContent.trim() : "?",
          over: el.scrollHeight - el.clientHeight,
          top: Math.round(ink.top),
          bottom: Math.round(ink.bottom),
          left: Math.round(ink.left),
          right: Math.round(ink.right),
        };
      })
      .filter(Boolean);
    return {
      era: document.querySelector("#voidwalker .vwd")?.getAttribute("data-vwh-era"),
      title: document.querySelector("#voidwalker .vwd__mast__title")?.textContent,
      slot: box("#voidwalker .vwh__slot"),
      panels,
    };
  });
  rows.push({ era, ...r });
}

let bad = 0;
for (const r of rows) {
  const overflows = r.panels.filter((p) => p.over > 1);
  // A panel whose painted box reaches into another's is the failure a
  // scrollHeight check cannot see.
  //
  // ⚠ IT MUST OVERLAP ON BOTH AXES. The sheet is TWO COLUMNS — Scope left,
  // Transmission and On-record right (ADR-082 U11) — so panels sharing a band
  // of rows is the normal composition, not a fault. A vertical-only test fired
  // on `genai`, an era this pass never touched, which is how you can tell the
  // guard is wrong rather than the layout.
  const collisions = [];
  for (let i = 0; i < r.panels.length - 1; i += 1) {
    for (let j = i + 1; j < r.panels.length; j += 1) {
      const a = r.panels[i];
      const b = r.panels[j];
      const overlapV = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      const overlapH = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      if (overlapV > 1 && overlapH > 1) collisions.push(`${a.head} → ${b.head} (${overlapV}px)`);
    }
  }
  const flag = overflows.length || collisions.length ? "FAIL" : "ok  ";
  if (overflows.length || collisions.length) bad += 1;
  console.log(
    `${flag} ${String(r.era).padEnd(11)} "${r.title}"  panels=${r.panels.length}` +
      (overflows.length ? `  OVERFLOW: ${overflows.map((p) => `${p.head}+${p.over}px`).join(", ")}` : "") +
      (collisions.length ? `  COLLIDE: ${collisions.join(", ")}` : "")
  );
}

await browser.close();
console.log(bad ? `\n${bad} era(s) with a clipped or colliding panel` : "\nall eras clean");
process.exit(bad ? 1 : 0);
