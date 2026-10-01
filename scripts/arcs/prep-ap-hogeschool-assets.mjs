/**
 * prep-ap-hogeschool-assets — the one picture the AP Hogeschool lecture adds
 * (ADR-141): In The Pocket's nine sector heroes on one wall, converted to web
 * weight from the signed-off finals on Drive.
 *
 * READS ONLY: the Drive folder is never written. Output is one WebP under
 * `public/arcs/ap-hogeschool/`. The page's other frames are the course's own
 * (`public/arcs/ai-storytelling/`), imported by path, so nothing is drawn
 * twice. Prints the file's size and dimensions.
 *
 *   node scripts/arcs/prep-ap-hogeschool-assets.mjs
 *
 * ⚠ THE CELLS ARE 16:9, NOT THE FINALS' 4:3. `.arc-media__frame img` is
 * `width: 100%; height: auto`, so the wall's aspect IS the beat's height: a
 * 4:3 wall runs ~750px tall at the 1280 band and breaks the one-screen law
 * (ADR-131), where this one lands near the Tom wall's. `fit: "cover"` crops
 * each hero to its middle band, and the retail hero, the campaign's anchor,
 * takes the centre cell. If the headed capture still reports the beat over
 * one frame, the next cut is 2:1 cells (460 × 230), never a smaller wall.
 */

import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

/* The finals as delivered on 2026-08-31 (MANIFEST.csv beside them), each
   2400 × 1792. `main-visual.png` and `2x/` are not read: the main visual is
   already on disk for the course page and the page reuses it by path. */
const ITP = "I:/My Drive/04_Arcs/04_Production/20260820_ITP_AI Readiness/03_Final";
const OUT = path.join(process.cwd(), "public", "arcs", "ap-hogeschool");

/* MANIFEST order, with the anchor moved to the centre cell (index 4). */
const SECTORS = [
  "finance",
  "government",
  "health",
  "insurance",
  "retail",
  "public-transport",
  "social-secretariats",
  "telco",
  "utilities",
];

const WALL = {
  name: "itp-nine-sectors-wall",
  cols: 3,
  rows: 3,
  cellW: 460,
  cellH: 259,
  gap: 4,
};

await mkdir(OUT, { recursive: true });
const width = WALL.cols * WALL.cellW + (WALL.cols - 1) * WALL.gap;
const height = WALL.rows * WALL.cellH + (WALL.rows - 1) * WALL.gap;
const tiles = await Promise.all(
  SECTORS.map(async (sector, i) => ({
    input: await sharp(`${ITP}/${sector}.png`)
      .resize({ width: WALL.cellW, height: WALL.cellH, fit: "cover" })
      .toBuffer(),
    left: (i % WALL.cols) * (WALL.cellW + WALL.gap),
    top: Math.floor(i / WALL.cols) * (WALL.cellH + WALL.gap),
  }))
);
const file = path.join(OUT, `${WALL.name}.webp`);
await sharp({ create: { width, height, channels: 3, background: "#0a0908" } })
  .composite(tiles)
  .webp({ quality: 80 })
  .toFile(file);
const { size } = await stat(file);
console.log(
  `${WALL.name}.webp  ${width}x${height}  ${(size / 1024).toFixed(0)} kB  (${SECTORS.length} sectors)`
);
