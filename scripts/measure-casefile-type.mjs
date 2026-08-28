/**
 * measure-casefile-type — where the left column's type RUNS OUT OF WIDTH, and
 * how much of the sheets' columns is actually inked.
 *
 * Sizing this column by arithmetic has been wrong twice: the CSS's own note
 * claimed the 95-character sentence "wraps to exactly two lines" and it
 * renders on ONE. So measure the single-line width of every string against
 * the width it has, and report the font size at which it would wrap. That
 * number is the ceiling; everything else is a choice inside it.
 */
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const PORT = argOf("--port", "3003");
const THEME = argOf("--theme", "dark");
const [VW, VH] = argOf("--vp", "1920x1247").split("x").map(Number);

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({
  viewport: { width: VW, height: VH },
  reducedMotion: "no-preference",
  colorScheme: THEME === "light" ? "light" : "dark",
});
const page = await ctx.newPage();

try {
  await page.goto(`http://localhost:${PORT}/${THEME === "light" ? "?theme=light" : ""}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".home-v2-stage", { timeout: 60_000 });
  const target = await page.evaluate(() => {
    const runway = document.querySelector(".services-stage-root");
    const rect = runway.getBoundingClientRect();
    return Math.round(
      rect.top + window.scrollY + Math.min(rect.height - innerHeight, innerHeight * 3.2) * 0.09
    );
  });
  await page.evaluate((y) => window.scrollTo(0, y), target);
  await page.waitForTimeout(700);
  await page.waitForSelector("[data-proof-settled]", { timeout: 30_000 });
  await page.waitForTimeout(700);
  await page.locator(".fl-row").nth(2).click();
  await page.waitForTimeout(1000);

  const out = await page.evaluate(() => {
    /* One line's natural width at the CURRENT size, against the width the
       element is given. `maxPx` is the size at which it would fill that
       width exactly — i.e. the first size that wraps. */
    const runOut = (el) => {
      const cs = getComputedStyle(el);
      const avail = el.getBoundingClientRect().width;
      const c = el.cloneNode(true);
      Object.assign(c.style, {
        position: "absolute",
        visibility: "hidden",
        whiteSpace: "nowrap",
        width: "auto",
        maxWidth: "none",
        display: "inline-block",
        webkitLineClamp: "unset",
      });
      el.parentElement.appendChild(c);
      const w = c.getBoundingClientRect().width;
      c.remove();
      const size = parseFloat(cs.fontSize);
      return {
        text: (el.textContent ?? "").trim().slice(0, 46),
        size: +size.toFixed(2),
        oneLine: Math.round(w),
        avail: Math.round(avail),
        maxPx: +(size * (avail / w)).toFixed(2),
      };
    };

    const many = (sel) => [...document.querySelectorAll(sel)].map(runOut);

    /* How much of each sheet column is actually ink. */
    const colFill = [...document.querySelectorAll(".fl-cmp__col")].map((col) => {
      const box = col.getBoundingClientRect();
      const kids = [...col.children].map((k) => k.getBoundingClientRect());
      const ink = kids.reduce((a, r) => a + r.height, 0);
      return {
        col: `${Math.round(box.width)}x${Math.round(box.height)}`,
        ink: Math.round(ink),
        fill: +(ink / box.height).toFixed(3),
        gapTop: Math.round(kids[0].top - box.top),
        biggestGap: Math.round(Math.max(...kids.slice(1).map((r, i) => r.top - kids[i].bottom))),
      };
    });

    return {
      claim: many(".fl-proof-register__claim"),
      desc: many(".fl-proof-register__description"),
      row: many(".fl-row__name"),
      briefBody: many(".fl-brief__body").slice(0, 1),
      colFill,
    };
  });

  console.log(`\n===== ${VW}x${VH} ${THEME} =====`);
  for (const [k, v] of Object.entries(out)) {
    if (k === "colFill") continue;
    console.log(`-- ${k}`);
    for (const r of v)
      console.log(
        `   ${String(r.size).padStart(6)}px  oneLine ${String(r.oneLine).padStart(4)} / avail ${String(r.avail).padStart(4)}  wraps above ${String(r.maxPx).padStart(6)}px   ${r.text}`
      );
  }
  console.log("-- sheet columns (THE LINE)");
  for (const c of out.colFill) console.log("   ", JSON.stringify(c));
} finally {
  await browser.close();
}
