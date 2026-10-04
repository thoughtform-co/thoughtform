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
 *   node scripts/hero-plates/prepare.mjs --thoughtform   # the Thought + Form plate + share card only
 *   node scripts/hero-plates/prepare.mjs --footer        # the footer's own plate (ADR-145)
 *   node scripts/hero-plates/prepare.mjs --portrait      # the phone hero's portrait plate (ADR-145)
 *   node scripts/hero-plates/prepare.mjs --light-tf      # the three Thought + Form LIGHT plates (ADR-145)
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

/* ── The light plate's color correction (owner, 2026-08-03) ─────────────
   The plate sits ON the page: `.hero__bg` composites it over the light
   `--void` (#ece3d6), and the section below continues in the same token —
   so if the artwork's PAPER is not that color, the hero reads as a pasted
   rectangle with a visible seam at its bottom edge. The first master was
   hand-tinted toward the background and measured (225, 218, 201): warm but
   ~13 too dark in blue, which is exactly the cool/pink cast the owner
   spotted against the real page.

   So the correction is COMPUTED, not eyeballed: a per-channel white
   balance mapping the RAW master's measured paper to the token.

     RAW paper  (223, 218, 208)  — mean of min(r,g,b)>190 pixels across
                                   three paper-only crops, 824k samples
     target     (236, 227, 214)  — #ece3d6, theme.css light `--void`
     gains      target / paper   =  R ×1.0592 · G ×1.0397 · B ×1.0295

   Applied as `.linear(gain, 0)` — a levels white-point move. Multiply
   keeps black at black (the ring core measures 0,0,0 before AND after)
   and lands the paper within 0.7 of the token. Clipping exposure is
   0.108 % of pixels (isolated bright specks), harmless.

   ⚠ Two things NOT to "fix" later:
   · The bottom strip corrects to ~(229, 219, 206), still ~7 under the
     token. That is the DRAWN GROUND — artwork, darker than open paper by
     design. Deriving the gains from that strip instead pushes the open
     paper ~7 ABOVE the page and multiplies the clipping. The scrim's
     bottom lift is what blends that edge.
   · The gains are constants on purpose. They encode a measurement of THIS
     raw master against THIS token; if either changes, re-measure — do not
     tune by eye against a screenshot. */
const LIGHT_GAINS = [1.0592, 1.0397, 1.0295];

const kb = (n) => `${(n / 1024).toFixed(1)} kB`;

async function encodeLight() {
  // The RAW master. The first, hand-tinted master (`Gateway_v2-light.png`)
  // is RETIRED — its tint is what the computed correction replaces — but
  // left in staging as the record of what shipped first.
  const src = staged("Gateway_v2-light-raw.png");
  const out = pub("images", "Gateway_v2-light.webp");

  if (!fs.existsSync(src)) {
    console.error(`✗ light master missing: ${path.relative(REPO, src)}`);
    console.error("  Drop the source PNG there (gitignored) and re-run.");
    return null;
  }

  const meta = await sharp(src).metadata();
  const corrected = () => sharp(src).linear(LIGHT_GAINS, [0, 0, 0]);
  const buf = await corrected().webp({ quality: LIGHT_WEBP_Q }).toBuffer();

  // For the record only — the light plate ships as WebP to match the way the
  // CSS swap and the glitch loader treat it as one file per theme.
  const avifBuf = await corrected().avif({ quality: 50, effort: 4 }).toBuffer();

  console.log(
    `light  ${meta.width}×${meta.height}  (paper → #ece3d6, gains ${LIGHT_GAINS.join(" / ")})`
  );
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

/* ── The Thought + Form plate (owner, 2026-10-04) ────────────────────────
   "MF-04 looks insane; let's promote that as our key visual across our
   website." The dark hero becomes his Midjourney keeper (job 63c6e199): the
   marble head in its broken ring on the right, the open plain and black sky
   on the left. The gateway's two files stay in `public/images/`: the light
   theme still paints `Gateway_v2-light.webp` (the obsidian light plate does
   not exist yet), and two course decks show the gateway as a CASE, not as
   the house's hero.

   ⚠ A NEW NAME, NOT AN OVERWRITE. Encoding the head into `Gateway_v1b.*` would
   have reached every consumer in one move and left a file named for a
   picture it no longer holds; the hero's readers point at `ThoughtForm_v1.*`
   instead (heroPreload.ts holds the constants; the prototypes, ArcHero, the
   footer and two arcs' heroes name the file).

   Encoded from the master at NATIVE size (2912×1632, the same as the light
   plate), AVIF q50 on near-black as the dark gateway was measured to want,
   with a WebP fallback at q80. The share card is a 1200×630 crop of the same
   master: it is the first pixel most people see of the site (app/layout.tsx).
   The master is staged, gitignored:
     assets-staging/hero-candidates/ThoughtForm_v1-master.png  ← the keeper */
const TF_AVIF_Q = 50;
const TF_WEBP_Q = 80;

async function encodeThoughtForm() {
  const src = staged("ThoughtForm_v1-master.png");
  if (!fs.existsSync(src)) {
    console.error(`✗ Thought + Form master missing: ${path.relative(REPO, src)}`);
    console.error("  Copy his keeper (Midjourney job 63c6e199) there and re-run.");
    return null;
  }
  const meta = await sharp(src).metadata();
  const avif = await sharp(src).avif({ quality: TF_AVIF_Q, effort: 6 }).toBuffer();
  const webp = await sharp(src).webp({ quality: TF_WEBP_Q, effort: 5 }).toBuffer();
  // The share card: the master cut to 1.905:1 around its vertical centre, so
  // the head and ring keep their place on the right, then 1200×630.
  const og = await sharp(src)
    .resize({ width: 1200, height: 630, fit: "cover", position: "centre" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  console.log(`thought + form  ${meta.width}×${meta.height}`);
  console.log(`  png master      ${kb(fs.statSync(src).size)}`);
  console.log(`  avif q${TF_AVIF_Q}        ${kb(avif.length)}  ← shipping`);
  console.log(`  webp q${TF_WEBP_Q}        ${kb(webp.length)}  ← fallback`);
  console.log(`  og 1200×630     ${kb(og.length)}`);
  if (!DRY) {
    fs.writeFileSync(pub("images", "ThoughtForm_v1.avif"), avif);
    fs.writeFileSync(pub("images", "ThoughtForm_v1.webp"), webp);
    fs.writeFileSync(pub("images", "og", "thoughtform-og.jpg"), og);
    console.log("  → public/images/ThoughtForm_v1.avif, .webp, og/thoughtform-og.jpg");
  }
  return avif.length;
}

/* ── The footer's own plate and the phone's portrait plate (ADR-145) ─────
   The footer stopped sharing the hero's file: it takes MF-10 (Midjourney job
   `c8f094c8`), the keeper whose left half is the quietest in the Selection
   (text band p95 luminance 0.173, phone window 0.376 against 0.70 for the
   hero's). The phone hero takes a PORTRAIT plate: MF-04 extended to 9:16 by
   an edit (the world ship's waves 05/06), the head on the floor and the sky
   above for the copy. Both are the Thought + Form plate's recipe exactly:
   native size, AVIF q50 on near-black, WebP q80 fallback, no resampling.
   Masters staged and gitignored:
     assets-staging/hero-candidates/ThoughtForm_footer_v1-master.png    ← c8f094c8
     assets-staging/hero-candidates/ThoughtForm_v1-portrait-master.png  ← the picked 9:16 */
async function encodePlate(label, master, name, keeper) {
  const src = staged(master);
  if (!fs.existsSync(src)) {
    console.error(`✗ ${label} master missing: ${path.relative(REPO, src)}`);
    console.error(`  Copy ${keeper} there and re-run.`);
    return null;
  }
  const meta = await sharp(src).metadata();
  const avif = await sharp(src).avif({ quality: TF_AVIF_Q, effort: 6 }).toBuffer();
  const webp = await sharp(src).webp({ quality: TF_WEBP_Q, effort: 5 }).toBuffer();
  console.log(`${label}  ${meta.width}×${meta.height}`);
  console.log(`  png master      ${kb(fs.statSync(src).size)}`);
  console.log(`  avif q${TF_AVIF_Q}        ${kb(avif.length)}  ← shipping`);
  console.log(`  webp q${TF_WEBP_Q}        ${kb(webp.length)}  ← fallback`);
  if (!DRY) {
    fs.writeFileSync(pub("images", `${name}.avif`), avif);
    fs.writeFileSync(pub("images", `${name}.webp`), webp);
    console.log(`  → public/images/${name}.avif, .webp`);
  }
  return avif.length;
}

/* ── Thought + Form in LIGHT (ADR-145, owner 2026-10-04: "A · obsidian ring")
   The light theme stops painting the gateway: the same keepers, the statue in
   black obsidian on a pale ground, made by EDITING his frames (the world
   ship's wave 06), never by re-prompting. Three plates, one per surface:
     hero      ThoughtForm_v1-light            ← MO-arcdark__r2__nano_01  (MF-04)
     phone     ThoughtForm_v1-portrait-light   ← MO-arcdarkthird916__nano_01
     footer    ThoughtForm_footer_v1-light     ← MO-risedark__r2__nano_02 (MF-10)
   The gateway light plate's own recipe, re-measured per master: the PAPER is
   read off an open-sky crop (pixels with min(r,g,b) > 190) and white-balanced
   onto the light `--void` #ece3d6 by per-channel gains, so no plate reads as a
   pasted rectangle on the page. WebP q85 for the same reason the gateway is:
   AVIF bands parchment. The gains are printed, not stored — each is a
   measurement of THIS master against THIS token. */
const LIGHT_PAGE = [236, 227, 214];

async function encodeLightThoughtForm(label, master, name, sky) {
  const src = staged(master);
  if (!fs.existsSync(src)) {
    console.error(`✗ ${label} master missing: ${path.relative(REPO, src)}`);
    return null;
  }
  const meta = await sharp(src).metadata();
  const crop = {
    left: Math.round(sky[0] * meta.width),
    top: Math.round(sky[1] * meta.height),
    width: Math.round((sky[2] - sky[0]) * meta.width),
    height: Math.round((sky[3] - sky[1]) * meta.height),
  };
  const { data, info } = await sharp(src).extract(crop).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const sum = [0, 0, 0];
  let n = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (Math.min(r, g, b) <= 190) continue;
    sum[0] += r; sum[1] += g; sum[2] += b; n++;
  }
  if (!n) {
    console.error(`✗ ${label}: no paper pixels in the sky crop`);
    return null;
  }
  const paper = sum.map((s) => s / n);
  const gains = LIGHT_PAGE.map((t, c) => t / paper[c]);
  const webp = await sharp(src)
    .removeAlpha()
    .linear(gains, [0, 0, 0])
    .webp({ quality: LIGHT_WEBP_Q, effort: 5 })
    .toBuffer();
  console.log(`${label}  ${meta.width}×${meta.height}`);
  console.log(`  paper ${paper.map((v) => v.toFixed(1)).join(", ")}  (${n} px)  gains ${gains.map((g) => g.toFixed(4)).join(" · ")}`);
  console.log(`  webp q${LIGHT_WEBP_Q}        ${kb(webp.length)}${webp.length > LIGHT_BUDGET_BYTES ? "  ⚠ OVER BUDGET" : ""}`);
  if (!DRY) {
    fs.writeFileSync(pub("images", `${name}.webp`), webp);
    console.log(`  → public/images/${name}.webp`);
  }
  return webp.length;
}

console.log(DRY ? "hero plates (dry run)\n" : "hero plates\n");
if (process.argv.includes("--light-tf")) {
  // Sky crops as fractions (x0, y0, x1, y1): the open upper-left of each frame.
  await encodeLightThoughtForm("hero light (MF-04 obsidian)", "ThoughtForm_v1-light-master.png", "ThoughtForm_v1-light", [0.03, 0.05, 0.4, 0.45]);
  await encodeLightThoughtForm("phone light (lower third)", "ThoughtForm_v1-portrait-light-master.png", "ThoughtForm_v1-portrait-light", [0.05, 0.05, 0.95, 0.5]);
  await encodeLightThoughtForm("footer light (MF-10 obsidian)", "ThoughtForm_footer_v1-light-master.png", "ThoughtForm_footer_v1-light", [0.03, 0.05, 0.4, 0.45]);
} else if (process.argv.includes("--footer")) {
  await encodePlate("footer (MF-10)", "ThoughtForm_footer_v1-master.png", "ThoughtForm_footer_v1", "his keeper c8f094c8");
} else if (process.argv.includes("--portrait")) {
  await encodePlate("phone portrait", "ThoughtForm_v1-portrait-master.png", "ThoughtForm_v1-portrait", "the picked 9:16 reframe");
} else if (process.argv.includes("--thoughtform")) {
  await encodeThoughtForm();
} else {
  await promoteDark();
  console.log("");
  await encodeLight();
  console.log("");
  await encodeThoughtForm();
}
