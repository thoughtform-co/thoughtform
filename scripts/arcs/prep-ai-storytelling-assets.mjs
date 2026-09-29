/**
 * prep-ai-storytelling-assets — the Tom on the Moon frames the course page
 * shows (ADR-134), converted to web weight from the ship and its Drive folder.
 *
 * READS ONLY: the ship (`Arcs_Tom On The Moon`) and its pixels on Drive are
 * never written. Output is WebP under `public/arcs/ai-storytelling/`, named for
 * what each frame is, with the long edge per role below. Prints each file's
 * size, its dimensions, and the total.
 *
 *   node scripts/arcs/prep-ai-storytelling-assets.mjs
 */

import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const SHIP = "C:/Users/buyss/Manifold Delta/Artifacts/Arcs_Tom On The Moon";
const DRIVE = "I:/My Drive/04_Arcs/04_Production/20260831_Tom On The Moon";
const CREATION = `${DRIVE}/02_Creation`;
const OUT = path.join(process.cwd(), "public", "arcs", "ai-storytelling");

/** [output name, source, long edge] */
const FRAMES = [
  /* The four directions, the first frame of each board (boards/*.json). */
  ["dir-a-garden-moon", `${CREATION}/wave-04-vary/A/A__w4-close__nano_01.png`, 900],
  ["dir-b-infrared", `${CREATION}/wave-03-moon/B/B__w3-gravelbars__nano_01.png`, 900],
  ["dir-c-graphic-novel", `${CREATION}/wave-04-fill/C/C__w4-hollow__nano_01.png`, 900],
  ["dir-d-space-rebels", `${CREATION}/wave-10-edge/D/D__w10-edge__nano_02.png`, 900],
  /* The ten worlds, one shot type across all of them so they compare. */
  ["world-01-rose-garden", `${CREATION}/wave-14-close/W1/W1__two-walk__nano_01.png`, 720],
  ["world-02-infrared", `${CREATION}/wave-14-close/W2/W2__two-walk__nano_01.png`, 720],
  ["world-03-rose-script", `${CREATION}/wave-14-close/W3/W3__two-walk__nano_01.png`, 720],
  ["world-04-mirrorlight", `${CREATION}/wave-14-close/W4/W4__two-walk__nano_01.png`, 720],
  ["world-05-furnished", `${CREATION}/wave-14-close/W5/W5__two-walk__nano_01.png`, 720],
  ["world-06-nightside", `${CREATION}/wave-15-newworlds/W6/W6__two-walk__nano_01.png`, 720],
  ["world-07-seam-ice", `${CREATION}/wave-15-newworlds/W7/W7__two-walk__nano_01.png`, 720],
  ["world-08-sulphur-field", `${CREATION}/wave-15-newworlds/W8/W8__two-walk__nano_01.png`, 720],
  ["world-09-amber-still", `${CREATION}/wave-15-newworlds/W9/W9__two-walk__nano_01.png`, 720],
  ["world-10-tideline", `${CREATION}/wave-19-fix/W/W__A-ext__nano_01.png`, 720],
  /* One planet, two regions. */
  [
    "region-r1-mineral-dunes",
    `${CREATION}/wave-21-world-people/P/P__R1-creative-table__nano_02.png`,
    1400,
  ],
  [
    "region-r2-living-arches",
    `${CREATION}/wave-21-world-people/I/I__R2-L4-design__nano_01.png`,
    1400,
  ],
  /* The anchor: the frame the client called perfect, pinned in the ship. */
  ["anchor-r1-chic-glazing", `${SHIP}/references/anchor-R1-chic-glazing-204-56.png`, 1400],
  /* The bench's two other inputs: a flag and a fail, with their gates. */
  [
    "flag-r1-vista-shaded-moon",
    `${CREATION}/wave-21-world-people/X/X__R1-vista-arch-small__nano_02.png`,
    1400,
  ],
  ["fail-our-own-moon", `${CREATION}/wave-20-atwork/O/O__shelf-laptop__nano_01.png`, 1400],
];

/* Cut to 16:9 for the offer card, so it sits level with the Thoughtform
   plate beside it: [output name, source, width]. */
const CUTS = [
  [
    "offer-tom-creative-table",
    `${CREATION}/wave-21-world-people/P/P__R1-creative-table__nano_02.png`,
    1400,
  ],
];

/* At scale: every keeper of wave 23 on one wall, in the order the ship's
   `_keepers.json` lists them, each cut to one 3:2 cell so the wall reads as a
   wall. The frames are the delivered web-weight JPEGs, untouched. */
const WALL = {
  name: "wall-wave-23-keepers",
  dir: `${CREATION}/wave-23-lead/_figma`,
  /* Twelve across and nine down: 108 of the wave's 114 delivered frames,
     so the wall ends on a full row rather than half of one. */
  cols: 12,
  rows: 9,
  cellW: 200,
  cellH: 134,
  gap: 4,
};

await mkdir(OUT, { recursive: true });
let total = 0;
for (const [name, src, edge] of FRAMES) {
  const file = path.join(OUT, `${name}.webp`);
  const info = await sharp(src)
    .resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(file);
  const { size } = await stat(file);
  total += size;
  console.log(`${name}.webp  ${info.width}x${info.height}  ${(size / 1024).toFixed(0)} kB`);
}
for (const [name, src, w] of CUTS) {
  const file = path.join(OUT, `${name}.webp`);
  const info = await sharp(src)
    .resize({ width: w, height: Math.round((w * 9) / 16), fit: "cover" })
    .webp({ quality: 80 })
    .toFile(file);
  const { size } = await stat(file);
  total += size;
  console.log(`${name}.webp  ${info.width}x${info.height}  ${(size / 1024).toFixed(0)} kB`);
}
{
  const { readFile } = await import("node:fs/promises");
  const keepers = JSON.parse(await readFile(`${WALL.dir}/_keepers.json`, "utf8"));
  const files = keepers.map((k) => k.file).slice(0, WALL.cols * WALL.rows);
  const rows = WALL.rows;
  const width = WALL.cols * WALL.cellW + (WALL.cols - 1) * WALL.gap;
  const height = rows * WALL.cellH + (rows - 1) * WALL.gap;
  const tiles = await Promise.all(
    files.map(async (f, i) => ({
      input: await sharp(`${WALL.dir}/${f}`)
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
  total += size;
  console.log(
    `${WALL.name}.webp  ${width}x${height}  ${(size / 1024).toFixed(0)} kB  (${files.length} of ${keepers.length} frames)`
  );
}
console.log(`total ${(total / 1024).toFixed(0)} kB in ${FRAMES.length + CUTS.length + 1} files`);
