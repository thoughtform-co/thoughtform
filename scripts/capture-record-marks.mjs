/**
 * capture-record-marks — the ON RECORD thumbnails' UNLABELLED contact sheet
 * (ADR-082 U43), beside the FACTS marks they share a station with.
 *
 * The record marks are legal by `tests/lib/record-marks.test.ts` and legible
 * only by eye: the magazine's four pixel cuts each passed every clause and each
 * read as something else (a C, a person, a bin). So a change to a drawing
 * re-runs this sheet and is judged WITHOUT its name — if the labels are needed
 * to tell the three apart, the set has failed.
 *
 * Static DOM, no server: the drawings are imported straight from the record
 * (both modules are zero-import), laid out in the card's own well (21px mark,
 * 10px pad, 1px border — 43px), on the void in dark and on parchment in light,
 * and shot at DPR 3 so the still is the browser's own raster of the 21px mark,
 * not a re-scaled drawing. The facts' four 14px pixel marks sit on the same
 * row, because the owner reads them together.
 *
 *   node --experimental-strip-types scripts/capture-record-marks.mjs
 *   → docs/design/voidwalker-record-marks/record-marks-{dark,light}.png
 *
 * ⚠ `--experimental-strip-types` is what lets a `.mjs` import the two `.ts`
 * records on Node 22; from Node 23.6 it is the default.
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { ERA_MARKS } from "../lib/voidwalker/eraMarks.ts";
import { RECORD_MARKS } from "../lib/voidwalker/recordMarks.ts";

const OUT = path.resolve("docs/design/voidwalker-record-marks");
const DPR = 3;

/** The site's two inks, as the theme flip resolves them (ADR-058 swaps
 *  `--dawn-rgb` and `--void-rgb`). */
const THEMES = {
  dark: { ground: "10, 9, 8", dawn: "235, 227, 214" },
  light: { ground: "235, 227, 214", dawn: "10, 9, 8" },
};

const recordSvg = (mark, px) =>
  `<svg viewBox="0 0 21 21" width="${px}" height="${px}" style="display:block;shape-rendering:geometricPrecision">` +
  mark.lines
    .map(
      ([x1, y1, x2, y2]) =>
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" fill="none" stroke="rgba(var(--dawn), .62)" stroke-width="1"/>`
    )
    .join("") +
  `<rect x="${mark.signal.x}" y="${mark.signal.y}" width="${mark.signal.w}" height="${mark.signal.h}" fill="rgb(var(--dawn))"/></svg>`;

const pixelSvg = (mark, px) => {
  const cells = (pts, alpha) =>
    pts
      .map(
        ([x, y]) =>
          `<rect x="${x}" y="${y}" width="1" height="1" fill="rgba(var(--dawn), ${alpha})"/>`
      )
      .join("");
  return (
    `<svg viewBox="0 0 7 7" width="${px}" height="${px}" style="display:block;shape-rendering:crispEdges">` +
    cells(mark.dr, 0.3) +
    cells(mark.sk, 0.62) +
    cells(mark.sig, 1) +
    `</svg>`
  );
};

const well = (inner) =>
  `<span style="display:block;box-sizing:content-box;width:21px;height:21px;padding:10px;border:1px solid rgba(var(--dawn), .2)">${inner}</span>`;

function page(theme) {
  const t = THEMES[theme];
  const records = Object.values(RECORD_MARKS)
    .map((m) => well(recordSvg(m, 21)))
    .join("");
  const facts = ["base", "move", "reach", "result"]
    .map((k) => `<span style="display:block">${pixelSvg(ERA_MARKS[k], 14)}</span>`)
    .join("");
  // Row two: the thumbnails at the card's own size again, on their own, so the
  // read is not steered by the neighbouring row.
  const bare = Object.values(RECORD_MARKS)
    .map((m) => `<span style="display:block">${recordSvg(m, 21)}</span>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    :root { --dawn: ${t.dawn}; }
    html, body { margin: 0; background: rgb(${t.ground}); }
    body { padding: 28px; width: max-content; }
    .row { display: flex; align-items: center; gap: 18px; }
    .row + .row { margin-top: 26px; }
    .gap { width: 24px; }
  </style></head><body>
    <div class="row">${records}<span class="gap"></span>${facts}</div>
    <div class="row">${bare}</div>
  </body></html>`;
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const theme of Object.keys(THEMES)) {
    const ctx = await browser.newContext({
      viewport: { width: 520, height: 200 },
      deviceScaleFactor: DPR,
    });
    const p = await ctx.newPage();
    await p.setContent(page(theme), { waitUntil: "load" });
    const body = p.locator("body");
    const file = path.join(OUT, `record-marks-${theme}.png`);
    await body.screenshot({ path: file });
    console.log(`${theme}: ${file}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
