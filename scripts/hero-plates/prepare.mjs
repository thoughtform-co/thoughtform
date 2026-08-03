/**
 * scripts/hero-plates/prepare.mjs
 *
 * Encodes the two hero key-visual plates the landing page swaps between
 * (ADR-058 Update 2 — light mode gets its own artwork instead of framing a
 * dark one).
 *
 *   dark   public/images/Gateway_v1b.avif   ← assets-staging/hero-candidates/Gateway_v1b.q50.avif
 *   light  public/images/Gateway_v2-light.webp ← assets-staging/hero-candidates/Gateway_v2-light.png
 *
 * ⚠ MASTERS LIVE IN `assets-staging/`, WHICH IS GITIGNORED. The light master
 * is a 7 MB PNG that was briefly dropped straight into `public/images/` —
 * i.e. publicly served at full weight. Anything in `public/` ships; put
 * masters in staging and encode INTO public.
 *
 * ⚠ NO RESAMPLING. Both plates encode at their native pixel size (dark
 * 2880×1620, light 2912×1632 — a 0.4 % aspect difference that `cover`
 * absorbs). The owner asked for compression "without losing resolution", and
 * both the CSS `background-size: cover` and the glitch canvas cover-map each
 * plate independently, so they never need to agree on a box.
 *
 * ⚠ THE DARK PLATE IS A PROMOTION, NOT AN ENCODE. `Gateway_v1b.q50.avif` was
 * encoded during the perf sweep and parked "awaiting Vince" (see the
 * landing-performance skill). Re-encoding it here from the shipped WebP
 * would stack a second generation of loss on an already-lossy source. If the
 * staged file is missing, this script says so rather than guessing.
 *
 * ⚠ THE TWO PLATES USE DIFFERENT CODECS ON PURPOSE — measured, not chosen.
 * Both are the same painterly artwork with the same film grain, but the
 * grain sits on near-black in one and on parchment in the other, and that
 * decides the encoder:
 *
 *   dark   AVIF q50  346 kB   flats + ring hatching + micro-annotations all
 *                             survive; block artifacts are invisible against
 *                             near-black. (q45 = 190 kB was the cheaper
 *                             staged candidate; q60 costs 743 kB — past the
 *                             WebP it replaces, so q50 is the knee.)
 *   light  WebP q85  435 kB   AVIF BANDS THE PARCHMENT. At q50 the upper-left
 *                             wash breaks into visible rectangular tone
 *                             blocks (max err 101 vs WebP's 26), and it is
 *                             still visible at q68 — which by then costs
 *                             381 kB, i.e. no saving for a worse image. The
 *                             compression AVIF wins here comes precisely
 *                             from flattening the grain the eye is reading.
 *
 * So do not "harmonise" the two on one format. The asymmetry is the finding.
 *
 * Usage:
 *   node scripts/hero-plates/prepare.mjs           # write both plates
 *   node scripts/hero-plates/prepare.mjs --dry     # report sizes, write nothing
 */

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..", "..");
const pub = (...p) => path.join(REPO, "public", ...p);
const staged = (...p) => path.join(REPO, "assets-staging", "hero-candidates", ...p);

const DRY = process.argv.includes("--dry");

/* q85 clears the parchment flats without banding them; measured against q80
   (visible stepping in the upper-left wash) and q90 (+38 % bytes, no visible
   gain). The budget is the dark plate's own weight — a light visitor should
   not pay more than a dark one. */
const LIGHT_WEBP_Q = 85;
const LIGHT_BUDGET_BYTES = 700 * 1024;

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

async function encodeLight() {
  const src = staged("Gateway_v2-light.png");
  const out = pub("images", "Gateway_v2-light.webp");

  if (!fs.existsSync(src)) {
    console.error(`✗ light master missing: ${path.relative(REPO, src)}`);
    console.error("  Drop the source PNG there (gitignored) and re-run.");
    return null;
  }

  const meta = await sharp(src).metadata();
  const buf = await sharp(src).webp({ quality: LIGHT_WEBP_Q }).toBuffer();

  // For the record only — the light plate ships as WebP to match the way the
  // CSS swap and the glitch loader treat it as one file per theme.
  const avifBuf = await sharp(src).avif({ quality: 50, effort: 4 }).toBuffer();

  console.log(`light  ${meta.width}×${meta.height}`);
  console.log(`  png master      ${kb(fs.statSync(src).size)}`);
  console.log(`  webp q${LIGHT_WEBP_Q}        ${kb(buf.length)}  ← shipping`);
  console.log(`  avif q50        ${kb(avifBuf.length)}  (reference)`);

  if (buf.length > LIGHT_BUDGET_BYTES) {
    console.warn(`  ⚠ over the ${kb(LIGHT_BUDGET_BYTES)} budget — drop quality or ask.`);
  }

  if (!DRY) {
    fs.writeFileSync(out, buf);
    console.log(`  → ${path.relative(REPO, out)}`);
  }
  return buf.length;
}

async function promoteDark() {
  const src = staged("Gateway_v1b.q50.avif");
  const out = pub("images", "Gateway_v1b.avif");
  const shipped = pub("images", "Gateway_v1b.webp");

  if (!fs.existsSync(src)) {
    console.error(`✗ staged dark AVIF missing: ${path.relative(REPO, src)}`);
    console.error("  Do NOT re-encode from Gateway_v1b.webp — that stacks generational loss.");
    return null;
  }

  const meta = await sharp(src).metadata();
  const bytes = fs.statSync(src).size;
  console.log(`dark   ${meta.width}×${meta.height}`);
  if (fs.existsSync(shipped)) {
    console.log(`  webp (current)  ${kb(fs.statSync(shipped).size)}`);
  }
  console.log(`  avif q50        ${kb(bytes)}  ← shipping`);

  if (!DRY) {
    fs.copyFileSync(src, out);
    console.log(`  → ${path.relative(REPO, out)}`);
  }
  return bytes;
}

console.log(DRY ? "hero plates (dry run)\n" : "hero plates\n");
await promoteDark();
console.log("");
await encodeLight();
