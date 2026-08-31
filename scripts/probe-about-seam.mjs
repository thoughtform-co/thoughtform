/**
 * probe-about-seam — is the Voidwalker station transparent where it overlaps
 * `#about`?
 *
 * The capable station is a TRANSPARENT stage the corridor's ambient survives
 * (ADR-082 U2), and it additionally overlaps `#about` by -120svh for the
 * handoff seam. So any opaque paint on its root — or on the composition inside
 * it — is not a background at all: it is a pane that slides over the previous
 * section as the reader crosses. That is invisible to every geometry guard,
 * because nothing MOVES wrongly; the wrong thing is only that you cannot see
 * through it.
 *
 * ⚠ HEADED — the corridor is WebGL and headless leaves the canvas dead, which
 * would make the ambient look absent whatever the CSS says.
 *
 * Usage (dev server running):
 *   node scripts/probe-about-seam.mjs [--port 3003] [--vp 1440x900]
 *     [--out docs/design/era-stage-pass/seam]
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/era-stage-pass/seam");
const [VW, VH] = argOf("--vp", "1440x900").split("x").map(Number);

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: VW, height: VH } });
await page.goto(`http://localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#voidwalker .vw", { timeout: 90_000 });
await page.locator(".home-v2-stage").first().scrollIntoViewIfNeeded().catch(() => {});
await page.waitForTimeout(1200);

const geom = await page.evaluate(() => {
  const about = document.querySelector("#about");
  const top = about.getBoundingClientRect().top + window.scrollY;
  return { top, travel: about.offsetHeight - window.innerHeight };
});

let bad = 0;
/* Across the handoff window: About's copy is still on screen while the
   station has already begun overlapping it. */
for (const at of [0.6, 0.78, 0.88, 0.96]) {
  const target = Math.round(geom.top + at * geom.travel);
  await page.evaluate(async (to) => {
    let y = window.scrollY;
    while (Math.abs(to - y) > 600) {
      y += Math.sign(to - y) * 600;
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, to);
  }, target);
  await page.waitForTimeout(1000);

  const s = await page.evaluate(() => {
    const alpha = (c) => {
      const m = /rgba?\(([^)]+)\)/.exec(c || "");
      if (!m) return null;
      const p = m[1].split(",").map((v) => parseFloat(v));
      return p.length > 3 ? p[3] : 1;
    };
    const opaque = [];
    // Walk the station's own subtree for anything painting an opaque ground.
    const station = document.querySelector("#voidwalker");
    if (station) {
      for (const el of station.querySelectorAll("*")) {
        const c = getComputedStyle(el);
        const a = alpha(c.backgroundColor);
        // The figure's own masked floor is EXPECTED to be opaque — it is what
        // the additive blend composites onto, and it lives inside the slot.
        const isFigureFloor = el.classList.contains("vwh__media-wrap");
        if (a === 1 && !isFigureFloor) {
          const r = el.getBoundingClientRect();
          if (r.width > 200 && r.height > 200) {
            opaque.push(`${el.className || el.tagName} ${Math.round(r.width)}x${Math.round(r.height)} ${c.backgroundColor}`);
          }
        }
      }
    }
    const root = document.querySelector("#voidwalker .vwd");
    return {
      stationBg: getComputedStyle(document.querySelector("#voidwalker")).backgroundColor,
      rootBg: root ? getComputedStyle(root).backgroundColor : "(no root)",
      aboutNameVisible: (() => {
        const n = document.querySelector("[data-about-handoff-name]");
        if (!n) return null;
        const r = n.getBoundingClientRect();
        return r.bottom > 0 && r.top < window.innerHeight;
      })(),
      opaquePanes: opaque,
    };
  });

  const flag = s.opaquePanes.length ? "FAIL" : "ok  ";
  if (s.opaquePanes.length) bad += 1;
  console.log(`${flag} about@${at.toFixed(2)}  root=${s.rootBg}  station=${s.stationBg}  aboutNameOnScreen=${s.aboutNameVisible}`);
  if (s.opaquePanes.length) s.opaquePanes.forEach((p) => console.log(`       opaque: ${p}`));
  await page.screenshot({ path: `${OUT}/${VW}x${VH}_about${String(at).replace("0.", "")}.png` });
}

await browser.close();
console.log(bad ? `\n${bad} sample(s) with an opaque pane over #about` : "\nthe station is transparent across the seam");
process.exit(bad ? 1 : 0);
