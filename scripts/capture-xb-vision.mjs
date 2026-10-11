/**
 * capture-xb-vision — stills of the X-Bionic proposal's vision beat
 * (/arcs/x-bionic/proposal#vision) with S1 A's pinned build in the left
 * cell, at the brief's two desktop sizes, at the build's three steps
 * (the runway's start, middle and end). The fit gate on each: the section
 * pinned (the band does not move across the runway), every label 12px or
 * more after the SVG's scale, inside the cell's padded box, no two labels
 * on one another (skewed labels are tested as quads), and the console
 * whole inside the viewport.
 *
 *   node scripts/capture-xb-vision.mjs [--port 3003] [--out dir] [--theme dark|light]
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/xbionic-proposal/vision-s1a");
const THEME = argOf("--theme", "dark");
const SIZES = [
  [1280, 720],
  [1470, 830],
  [1920, 1247],
];
const STOPS = [0.02, 0.5, 0.98];

function gate() {
  const out = [];
  const cell = document.querySelector("#vision .arc-lev__idea");
  if (!cell) return { problems: ["no .arc-lev__idea in #vision"] };
  const svg = cell.querySelector(".arc-lev__build svg");
  if (!svg) return { problems: ["no S1 A drawing in the cell"] };
  const cs = getComputedStyle(cell);
  const c = cell.getBoundingClientRect();
  const box = {
    l: c.left + parseFloat(cs.paddingLeft) - 0.5,
    r: c.right - parseFloat(cs.paddingRight) + 0.5,
    t: c.top + parseFloat(cs.paddingTop) - 0.5,
    b: c.bottom - parseFloat(cs.paddingBottom) + 0.5,
  };
  /* a label counts if anything of it paints: its group opacities multiply */
  const shown = (t) => {
    let o = 1;
    for (let n = t; n && n !== svg; n = n.parentElement) {
      const a = n.getAttribute("opacity");
      if (a !== null) o *= parseFloat(a);
    }
    return o > 0.05;
  };
  const texts = [...svg.querySelectorAll("text")].filter(shown);
  const quads = texts.map((t) => {
    const b = t.getBBox();
    const q = t.getScreenCTM();
    const at = (x, y) => [q.a * x + q.c * y + q.e, q.b * x + q.d * y + q.f];
    return {
      t: (t.textContent || "").trim(),
      pts: [
        at(b.x, b.y),
        at(b.x + b.width, b.y),
        at(b.x + b.width, b.y + b.height),
        at(b.x, b.y + b.height),
      ],
      px: parseFloat(getComputedStyle(t).fontSize) * Math.hypot(q.a, q.b),
    };
  });
  for (const q of quads) {
    if (q.px < 11.95) out.push(`"${q.t}" at ${q.px.toFixed(1)}px`);
    if (q.pts.some(([x, y]) => x < box.l || x > box.r || y < box.t || y > box.b))
      out.push(`"${q.t}" outside the cell's padded box`);
  }
  const sep = (a, b) => {
    for (const poly of [a, b])
      for (let i = 0; i < 4; i++) {
        const [x1, y1] = poly[i];
        const [x2, y2] = poly[(i + 1) % 4];
        const nx = y2 - y1;
        const ny = x1 - x2;
        const len = Math.hypot(nx, ny) || 1;
        const pa = a.map(([x, y]) => (x * nx + y * ny) / len);
        const pb = b.map(([x, y]) => (x * nx + y * ny) / len);
        if (Math.max(...pa) < Math.min(...pb) + 1 || Math.max(...pb) < Math.min(...pa) + 1)
          return true;
      }
    return false;
  };
  for (let i = 0; i < quads.length; i++)
    for (let j = i + 1; j < quads.length; j++)
      if (!sep(quads[i].pts, quads[j].pts)) out.push(`"${quads[i].t}" on "${quads[j].t}"`);
  const con = document.querySelector("#vision .arc-lev").getBoundingClientRect();
  if (con.top < -0.5 || con.bottom > innerHeight + 0.5)
    out.push(
      `console ${Math.round(con.top)}–${Math.round(con.bottom)} outside the ${innerHeight}px screen`
    );
  /* the head's extent, its hanging eyebrow and marks included */
  const headEl = document.querySelector("#vision > .arc-band > .arc-head");
  let hTop = Infinity;
  let hBottom = -Infinity;
  for (const n of [headEl, ...headEl.querySelectorAll("*")]) {
    const r = n.getBoundingClientRect();
    if (!r.height) continue;
    hTop = Math.min(hTop, r.top);
    hBottom = Math.max(hBottom, r.bottom);
  }
  const headWhole = hTop >= -0.5 && hBottom <= innerHeight + 0.5;
  const headGone = hBottom <= 0.5;
  if (!headWhole && !headGone)
    out.push(`the head is cut at the screen's edge (${Math.round(hTop)}–${Math.round(hBottom)})`);
  const s = svg.getBoundingClientRect();
  return {
    problems: out,
    step: document.querySelector("#vision .arc-lev__build").dataset.levStep,
    bandTop: Math.round(document.querySelector("#vision > .arc-band").getBoundingClientRect().top),
    info: `${headWhole ? "title on screen" : "title off screen"} · cell ${Math.round(c.width)}×${Math.round(c.height)} · svg ${Math.round(s.width)}×${Math.round(s.height)} · console ${Math.round(con.height)}`,
  };
}

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });
let failed = 0;
for (const [w, h] of SIZES) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 2,
    colorScheme: THEME,
  });
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem("tf-theme", t);
    } catch {}
  }, THEME);
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/arcs/x-bionic/proposal`, {
    waitUntil: "load",
    timeout: 180000,
  });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.evaluate(() => document.getElementById("vision")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1200);
  const tops = [];
  for (const [k, f] of STOPS.entries()) {
    await page.evaluate((t) => {
      const sec = document.getElementById("vision");
      const run = sec.querySelector(":scope > .arc-lev__run").offsetHeight;
      const pin = parseFloat(sec.style.getPropertyValue("--lev-pin")) || 0;
      const datum = parseFloat(getComputedStyle(sec).paddingTop) || 0;
      const docTop = sec.getBoundingClientRect().top + scrollY;
      window.scrollTo(0, docTop - (pin - datum) + t * run);
    }, f);
    await page.waitForTimeout(900);
    const res = await page.evaluate(gate);
    tops.push(res.bandTop);
    await page.screenshot({ path: `${OUT}/vision-${THEME}-${w}x${h}-s${k + 1}.png` });
    if (res.problems.length) {
      failed++;
      console.log(`✗ ${w}x${h} stop ${k + 1} (step ${res.step}) ${res.info ?? ""}`);
      for (const p of res.problems.slice(0, 12)) console.log(`    ${p}`);
    } else console.log(`✓ ${w}x${h} stop ${k + 1} (step ${res.step}) ${res.info}`);
  }
  if (Math.max(...tops) - Math.min(...tops) > 1) {
    failed++;
    console.log(`✗ ${w}x${h} the band moved across the runway: ${tops.join(", ")}`);
  } else console.log(`✓ ${w}x${h} pinned at ${tops[0]}px across the runway`);
  await ctx.close();
}
await browser.close();
if (failed) process.exit(1);
