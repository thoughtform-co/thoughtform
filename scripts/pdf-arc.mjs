/**
 * pdf-arc — any arc, one 1280x720 page per section, as a pixel-perfect PDF.
 *
 *   node scripts/pdf-arc.mjs --slug plopsa-workshop --out "<file.pdf>"
 *   node scripts/pdf-arc.mjs --slug plopsa-workshop --base http://localhost:3005 --vp 1280x720 --scale 2
 *
 * The site has no print stylesheet and the arcs are flowing pages, so the
 * handout is made the way the decks' PDFs are checked: a screenshot of every
 * section at the projector's size, assembled into one PDF with PyMuPDF. Raster
 * by construction, so what the room saw is what the page holds; nothing
 * reflows. The sweep is the reveal grammar's, as in capture-arc-portfolio.mjs:
 * scroll each section into view, wait for its `.arc-reveal` children to carry
 * `is-in`, shoot the viewport.
 *
 * The hero is page one. A section taller than the viewport is shot from its
 * top; cut its copy, never the page.
 *
 * Needs the site's Playwright and a Python with PyMuPDF (`pip install pymupdf`).
 * Shots land in the session's scratchpad, never under `public/`.
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const BASE = arg("--base", "http://localhost:3003");
const SLUG = arg("--slug", "");
const OUT = arg("--out", `${SLUG}.pdf`);
const [W, H] = arg("--vp", "1280x720").split("x").map(Number);
const SCALE = Number(arg("--scale", "2"));
if (!SLUG) {
  console.error("usage: node scripts/pdf-arc.mjs --slug <arc> [--out <pdf>] [--base <origin>] [--vp 1280x720] [--scale 2]");
  process.exit(1);
}

const shots = path.join(os.tmpdir(), `pdf-arc-${SLUG}-${Date.now()}`);
await mkdir(shots, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.goto(`${BASE}/arcs/${SLUG}`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
// Reveal every beat once so nothing is mid-transition in a shot; the sweep
// below still scrolls each into view so IntersectionObserver-gated work runs.
const ids = await page.evaluate(() =>
  [...document.querySelectorAll("main .arc-hero, main section[id]")].map((el) => el.id || "hero"),
);
console.log(`${ids.length} beats: ${ids.join(", ")}`);
const files = [];
for (const [i, id] of ids.entries()) {
  await page.evaluate((id) => {
    const el = id === "hero" ? document.querySelector("main .arc-hero") : document.getElementById(id);
    el?.scrollIntoView({ block: "start", behavior: "instant" });
  }, id);
  await page.waitForTimeout(350);
  await page.evaluate(async (id) => {
    const el = id === "hero" ? document.querySelector("main .arc-hero") : document.getElementById(id);
    const pending = () => [...(el?.querySelectorAll(".arc-reveal") ?? [])].filter((n) => !n.classList.contains("is-in"));
    for (let t = 0; t < 40 && pending().length; t++) await new Promise((r) => setTimeout(r, 50));
  }, id);
  await page.waitForTimeout(250);
  const file = path.join(shots, `${String(i + 1).padStart(2, "0")}-${id}.png`);
  // A beat that fits the viewport is shot as the viewport, which is what the
  // room saw. A taller beat gets a page of its own height: the element is
  // shot whole, and the page is sized to it, so nothing is cropped and
  // nothing reflows.
  const h = await page.evaluate((id) => {
    const el = id === "hero" ? document.querySelector("main .arc-hero") : document.getElementById(id);
    return Math.ceil(el?.getBoundingClientRect().height ?? 0);
  }, id);
  const tall = h > H;
  if (tall) {
    const el = id === "hero" ? page.locator("main .arc-hero") : page.locator(`#${id}`);
    await el.screenshot({ path: file });
  } else {
    await page.screenshot({ path: file, fullPage: false });
  }
  files.push({ file, w: W, h: tall ? h : H });
  console.log(`  shot ${path.basename(file)}${tall ? `  (tall: ${h}px page)` : ""}`);
}
await browser.close();

const py = `
import fitz, sys, json
spec = json.loads(sys.argv[2])
doc = fitz.open()
for s in spec:
    page = doc.new_page(width=s["w"], height=s["h"])
    page.insert_image(page.rect, filename=s["file"])
doc.set_metadata({"title": "${SLUG}", "producer": "pdf-arc"})
doc.save(sys.argv[1], garbage=4, deflate=True)
print("wrote", sys.argv[1], len(spec), "pages")
`;
const script = path.join(shots, "assemble.py");
await writeFile(script, py, "utf8");
const r = spawnSync("python", [script, path.resolve(OUT), JSON.stringify(files)], { stdio: "inherit" });
process.exit(r.status ?? 1);
