/**
 * capture-services-figures — the three MATERIALS on the re-cut four
 * (`/test/services-card-face-lab?v=raster|volume|wire`, 2026-09-19): one still
 * per card per material per theme at the reference viewport and the owner's
 * own, plus ONE contact sheet per theme (materials down, cards across), and
 * the numbers no eye reads reliably — how much of the poster band each
 * figure's ink fills.
 *
 *   node scripts/capture-services-figures.mjs
 *   node scripts/capture-services-figures.mjs --v raster,wire --themes dark --vp 1920x1247
 *   node scripts/capture-services-figures.mjs --headless      # SwiftShader, for a machine with no display
 *
 * HEADED BY DEFAULT: the lab is the real WebGL ring under a bloom pass, and
 * a headless SwiftShader context renders it slowly and not always faithfully
 * (`.claude/rules/services-ring.md` — verify the ring on a real GPU).
 *
 * Waits are on OBSERVABLES: the front card's hit shim exists only once the
 * ring has parked and published its anchors, which is after the faces have
 * baked; a short settle after that is for the bloom's mip chain, nothing
 * else. Each card is a fresh navigation at its own park (`?svc=N`, the ring's
 * `ringParkProgress`), because the lab's progress bridge is a slider and a
 * slider is not a scroll.
 *
 * The dev server must already be running.
 */

import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const has = (flag) => args.includes(flag);

const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/services-figures/stills");
const VARIANTS = argOf("--v", "raster,volume,wire").split(",");
const THEMES = argOf("--themes", "dark,light").split(",");
const VIEWPORTS = argOf("--vp", "1600x1000,1920x1247")
  .split(",")
  .map((s) => s.split("x").map(Number));
const HEADLESS = has("--headless");

/** The four slots, in the ring's order. The park is the RING's own
 *  (`ringParkProgress`, reached through the lab's `?svc=` deep link) — a
 *  progress at which the turn has finished, never a beat centre. */
const SLOTS = ["keynote", "workshop", "embedded", "guided-build"];

/** The poster band as fractions of the card's own rect (bake 840×1360:
 *  x 52…788, y 358…1014). */
const BAND = { x0: 52 / 840, x1: 788 / 840, y0: 358 / 1360, y1: 1014 / 1360 };

/** A benign, site-wide report-only CSP notice — not this route's doing. */
const IGNORED_ERROR = /upgrade-insecure-requests' is ignored when delivered in a report-only/;

const browser = await chromium.launch({
  headless: HEADLESS,
  args: HEADLESS ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : [],
});

/** The ink's bounding box inside a region of a PNG buffer, as fractions of
 *  the region — pixels whose luminance sits more than `threshold` above the
 *  region's darkest 5 % (the ground). */
async function inkBox(png, region, threshold = 26) {
  const { data, info } = await sharp(png)
    .extract({
      left: Math.round(region.x),
      top: Math.round(region.y),
      width: Math.max(1, Math.round(region.w)),
      height: Math.max(1, Math.round(region.h)),
    })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const lums = new Float32Array(info.width * info.height);
  for (let i = 0; i < lums.length; i++) {
    const o = i * info.channels;
    lums[i] = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
  }
  const sorted = Float32Array.from(lums).sort();
  const ground = sorted[Math.floor(sorted.length * 0.05)];
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  let count = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (lums[y * info.width + x] - ground > threshold) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { fillW: 0, fillH: 0, coverage: 0 };
  return {
    fillW: (maxX - minX + 1) / info.width,
    fillH: (maxY - minY + 1) / info.height,
    coverage: count / (info.width * info.height),
  };
}

const report = [];

for (const [vw, vh] of VIEWPORTS) {
  for (const theme of THEMES) {
    const sheetCells = [];
    for (const variant of VARIANTS) {
      for (let i = 0; i < SLOTS.length; i++) {
        const ctx = await browser.newContext({
          viewport: { width: vw, height: vh },
          reducedMotion: "no-preference",
          colorScheme: theme === "light" ? "light" : "dark",
          deviceScaleFactor: 1,
        });
        const page = await ctx.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(String(e)));
        page.on("console", (m) => {
          if (m.type() === "error" && !IGNORED_ERROR.test(m.text())) errors.push(m.text());
        });
        const url = `http://localhost:${PORT}/test/services-card-face-lab?v=${variant}&svc=${i}${
          theme === "light" ? "&theme=light" : ""
        }`;
        await page.goto(url, { waitUntil: "domcontentloaded" });
        // The lab's <main> pins its own data-theme; the ring reads the store,
        // which the ?theme= bootstrap set. Bring the DOM chrome in line.
        await page.evaluate((t) => {
          document.querySelector("main.scfl")?.setAttribute("data-theme", t);
        }, theme);
        // The lab publishes the front card's anchor rect once the ring is
        // parked and baked (`.scfl-front-rect`, CardFaceFrame).
        const front = page.locator(".scfl-front-rect");
        await front.first().waitFor({ state: "attached", timeout: 90_000 });
        await page.waitForTimeout(1800);
        const rect = await front.first().evaluate((el) => ({
          x: Number(el.getAttribute("data-x")),
          y: Number(el.getAttribute("data-y")),
          width: Number(el.getAttribute("data-w")),
          height: Number(el.getAttribute("data-h")),
        }));
        if (!(rect.width > 8)) throw new Error(`no front rect on ${variant}/${SLOTS[i]}`);
        const service = await front.first().getAttribute("data-service");
        const dir = path.join(OUT, `${vw}x${vh}`, theme);
        await mkdir(dir, { recursive: true });
        const frameFile = path.join(dir, `${variant}-${SLOTS[i]}-frame.png`);
        await page.screenshot({ path: frameFile, fullPage: false });
        // The card, with 8 % of air for the glow and the chamfer.
        const pad = rect.width * 0.08;
        const clip = {
          x: Math.max(0, rect.x - pad),
          y: Math.max(0, rect.y - pad),
          width: Math.min(vw - Math.max(0, rect.x - pad), rect.width + pad * 2),
          height: Math.min(vh - Math.max(0, rect.y - pad), rect.height + pad * 2),
        };
        const cardFile = path.join(dir, `${variant}-${SLOTS[i]}.png`);
        const cardPng = await page.screenshot({ path: cardFile, clip });
        const band = {
          x: pad + rect.width * BAND.x0,
          y: pad + rect.height * BAND.y0,
          w: rect.width * (BAND.x1 - BAND.x0),
          h: rect.height * (BAND.y1 - BAND.y0),
        };
        const ink = await inkBox(cardPng, band);
        const row = {
          viewport: `${vw}x${vh}`,
          theme,
          variant,
          slot: SLOTS[i],
          service,
          cardW: Math.round(rect.width),
          cardH: Math.round(rect.height),
          bandFillW: Number(ink.fillW.toFixed(3)),
          bandFillH: Number(ink.fillH.toFixed(3)),
          bandCoverage: Number(ink.coverage.toFixed(3)),
          errors: errors.length,
        };
        report.push(row);
        console.log(
          `${row.viewport} ${theme} ${variant.padEnd(6)} ${SLOTS[i].padEnd(12)} card ${row.cardW}×${row.cardH}  band fill ${row.bandFillW}×${row.bandFillH}  coverage ${row.bandCoverage}${
            errors.length ? `  ⚠ ${errors.length} error(s): ${errors[0]}` : ""
          }`
        );
        sheetCells.push({ variant, slot: SLOTS[i], file: cardFile, w: clip.width, h: clip.height });
        await ctx.close();
      }
    }

    /* The contact sheet: materials down, cards across, one per theme. Every
       cell is scaled to one height so the four cards read in a row. */
    const cellH = 520;
    const cells = await Promise.all(
      sheetCells.map(async (c) => {
        const buf = await sharp(c.file).resize({ height: cellH }).png().toBuffer();
        const meta = await sharp(buf).metadata();
        return { ...c, buf, w: meta.width ?? 0 };
      })
    );
    const cols = SLOTS.length;
    const rows = VARIANTS.length;
    const cellW = Math.max(...cells.map((c) => c.w));
    const gap = 24;
    const labelH = 28;
    const sheetW = gap + cols * (cellW + gap);
    const sheetH = gap + rows * (cellH + labelH + gap);
    const composite = [];
    const labels = [];
    cells.forEach((c, k) => {
      const r = Math.floor(k / cols);
      const col = k % cols;
      const left = gap + col * (cellW + gap) + Math.round((cellW - c.w) / 2);
      const top = gap + r * (cellH + labelH + gap) + labelH;
      composite.push({ input: c.buf, left, top });
      labels.push(
        `<text x="${gap + col * (cellW + gap)}" y="${top - 10}" font-family="PT Mono, monospace" font-size="12" letter-spacing="1.5" fill="#caa554">${c.variant.toUpperCase()} · ${c.slot.toUpperCase()}</text>`
      );
    });
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}">${labels.join("")}</svg>`
    );
    const sheetFile = path.join(OUT, `${vw}x${vh}`, `contact-${theme}.png`);
    await sharp({
      create: { width: sheetW, height: sheetH, channels: 3, background: theme === "light" ? "#ebe3d6" : "#050403" },
    })
      .composite([...composite, { input: svg, left: 0, top: 0 }])
      .png()
      .toFile(sheetFile);
    console.log(`sheet → ${sheetFile}`);
  }
}

await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
await browser.close();
const bad = report.filter((r) => r.errors > 0);
if (bad.length) {
  console.error(`⚠ ${bad.length} still(s) logged a page error`);
  process.exitCode = 1;
}
