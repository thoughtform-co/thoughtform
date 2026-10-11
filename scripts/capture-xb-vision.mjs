/**
 * capture-xb-vision — stills of the X-Bionic proposal's vision beat
 * (/arcs/x-bionic/proposal#vision) at the brief's two desktop sizes, with a
 * fit gate on the left cell's configuration drawing: no text under 12px
 * after the SVG's scale, every label at least 8px inside the cell's padded
 * box, and no two labels on one another.
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
const OUT = argOf("--out", "docs/design/xbionic-proposal/vision-config");
const THEME = argOf("--theme", "dark");
const SIZES = [
  [1280, 720],
  [1470, 830],
];

function gate() {
  const out = [];
  const cell = document.querySelector("#vision .arc-lev__idea");
  if (!cell) return ["no .arc-lev__idea in #vision"];
  const svg = cell.querySelector("svg.arc-lev__config");
  if (!svg) return ["no configuration drawing in the cell"];
  const cs = getComputedStyle(cell);
  const c = cell.getBoundingClientRect();
  const box = {
    l: c.left + parseFloat(cs.paddingLeft) - 0.5,
    r: c.right - parseFloat(cs.paddingRight) + 0.5,
    t: c.top + parseFloat(cs.paddingTop) - 0.5,
    b: c.bottom - parseFloat(cs.paddingBottom) + 0.5,
  };
  const m = svg.getScreenCTM();
  const k = m ? Math.hypot(m.a, m.b) : 1;
  const texts = [...svg.querySelectorAll("text")];
  /* Each label's ink box as a screen quad: a label laid on a plane is
     skewed, and its axis-aligned rect would overlap its neighbours'. */
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
  /* separating-axis test on two convex quads, with a 1px allowance */
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
  const s = svg.getBoundingClientRect();
  const uses = document.querySelector("#vision .arc-lev__uses").getBoundingClientRect();
  const sec = document.getElementById("vision").getBoundingClientRect();
  return {
    problems: out,
    heights: `drawing+pad ${Math.round(s.height + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom))} · uses ${Math.round(uses.height)} · beat ${Math.round(sec.height)} / ${innerHeight}`,
    cell: `${Math.round(c.width)}×${Math.round(c.height)}`,
    svg: `${Math.round(s.width)}×${Math.round(s.height)}`,
    scale: k.toFixed(3),
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
  await page.waitForTimeout(400);
  await page.evaluate(() => document.getElementById("vision")?.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(1600);
  const res = await page.evaluate(gate);
  await page.screenshot({ path: `${OUT}/vision-${THEME}-${w}x${h}.png` });
  const problems = Array.isArray(res) ? res : res.problems;
  const info = Array.isArray(res)
    ? ""
    : ` cell ${res.cell} · svg ${res.svg} · k ${res.scale} · ${res.heights}`;
  if (problems.length) {
    failed++;
    console.log(`✗ ${w}x${h}${info}`);
    for (const p of problems.slice(0, 12)) console.log(`    ${p}`);
  } else console.log(`✓ ${w}x${h}${info}`);
  await ctx.close();
}
await browser.close();
if (failed) process.exit(1);
