/**
 * scripts/hero-kv-lab/prepare.mjs
 *
 * Encodes the owner's Thought + Form Midjourney keepers for `/test/hero-kv-lab`,
 * the hero lab that swaps key visuals under the live hero copy.
 *
 *   source  I:\My Drive\01_Thoughtform Branding\05_Key Visuals\2026\Home World\
 *           02_Creation\mj\2026-10-03_mind-in-form\Selection\*.png   (his keepers)
 *   output  public/_previews/hero-kv/<job>.webp       the plate, native size
 *           public/_previews/hero-kv/<job>-m.webp     the plate mirrored
 *           public/_previews/hero-kv/<job>-thumb.webp a 320px filmstrip thumb
 *           (and -m-thumb)
 *
 * ⚠ `public/_previews/` IS GITIGNORED. The pixels are the owner's working
 * keepers, not shipped art: they stay local, and this script is the record of
 * how they were made. A plate promoted to the landing goes through
 * `scripts/hero-plates/prepare.mjs` and its own measurement instead.
 *
 * ⚠ THE MIRROR IS MADE HERE, NOT IN CSS. The lab zooms each plate about its
 * LEFT edge to push the subject right of the text column; a CSS `scaleX(-1)`
 * on the same element would flip about that origin and throw the plate off
 * screen. A file is the honest version of a mirrored picture.
 *
 * The job id is read from the Midjourney file name (`…_<8 hex>-<4 hex>-…`), so
 * the lab's data (`app/(internal)/test/hero-kv-lab/kvs.ts`) can name a plate
 * by the job it came from.
 *
 *   node scripts/hero-kv-lab/prepare.mjs [<source dir>]
 */
import { mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";

const SOURCE =
  process.argv[2] ||
  String.raw`I:\My Drive\01_Thoughtform Branding\05_Key Visuals\2026\Home World\02_Creation\mj\2026-10-03_mind-in-form\Selection`;
const OUT = resolve("public/_previews/hero-kv");
const JOB = /_([0-9a-f]{8})-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

if (!existsSync(SOURCE)) {
  console.error(`no source folder: ${SOURCE}`);
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const files = readdirSync(SOURCE).filter(
  (f) => f.toLowerCase().endsWith(".png") && !f.startsWith("_")
);
let n = 0;
for (const f of files) {
  const m = f.match(JOB);
  if (!m) {
    console.warn(`  skip  ${f} (no job id in the name)`);
    continue;
  }
  const job = m[1];
  const src = join(SOURCE, f);
  for (const [suffix, flop] of [
    ["", false],
    ["-m", true],
  ]) {
    const base = sharp(src).flop(flop);
    await base
      .clone()
      .webp({ quality: 82, effort: 5 })
      .toFile(join(OUT, `${job}${suffix}.webp`));
    await base
      .clone()
      .resize({ width: 320 })
      .webp({ quality: 70 })
      .toFile(join(OUT, `${job}${suffix}-thumb.webp`));
  }
  const { width, height } = await sharp(src).metadata();
  console.log(`  ok    ${job}  ${width}×${height}`);
  n++;
}
console.log(`  ${n} keepers → ${OUT}`);
