/**
 * scripts/services-photos/prepare.mjs
 *
 * Prepares the #services "signal plate" card photos and (optionally) a
 * web-ready batch of the navigator photo dump.
 *
 * Card crops (default run):
 *   - Cover-crop each source to the card portrait aspect (420 x 680 = 0.618)
 *     centered on a per-photo focal point so the SUBJECT (Vince) stays
 *     horizontally centered — the sources put him center / center-right, so a
 *     naive center-crop would cut him off (embedded) or lean the frame onto the
 *     projection. Vertical framing is inherent (landscape/near-square sources
 *     fill the full height, matching the design handoff's cover behaviour).
 *   - Output stripped-metadata WebP (primary) + JPG fallback at 2x card size
 *     (840 x 1360) to public/images/services/{id}.{webp,jpg}.
 *   - Centering is baked into the asset, so the card CSS can use
 *     `background-size: cover; background-position: center` and the subject
 *     stays centered + un-stretched at any card size.
 *
 * Navigator batch (`--navigator` adds it, `--navigator-only` runs just it):
 *   - Downsizes every navigator original (some up to ~19 MB) to a web-ready max
 *     long-edge of 2000px, WebP + JPG, into public/images/navigator/optimized/.
 *     Originals are left untouched.
 *
 * Tune the `fx` focal fractions below, re-run, and eyeball
 * public/images/services/*.jpg (the crop IS the card window).
 *
 * Usage:
 *   node scripts/services-photos/prepare.mjs                # card crops
 *   node scripts/services-photos/prepare.mjs --navigator    # cards + navigator
 *   node scripts/services-photos/prepare.mjs --navigator-only
 */

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..", "..");
const pub = (...p) => path.join(REPO, "public", ...p);

/* Card geometry (from the handoff: 420 x 680 body). Output at 2x for retina. */
const CARD_W = 420;
const CARD_H = 680;
const TARGET_AR = CARD_W / CARD_H; // 0.6176…
const OUT_H = 1360;
const OUT_W = Math.round(OUT_H * TARGET_AR); // 840
const WEBP_Q = 80;
const JPG_Q = 82;

/**
 * Per-card sources + focal points.
 *   fx — horizontal fraction (0..1) the SUBJECT sits at; the crop centers here.
 *   fy — vertical fraction of the face; only used when a source is TALLER than
 *        the card aspect (none currently are, but kept for robustness).
 *
 * 2026-07-10: sources repointed at the new `-2` drops (staged directly in
 * public/images/services/) for the card-ring pass, and `strategic` added so
 * Strategic Advisory gets a photo for the first time (ADR-029). The old
 * navigator sources are superseded.
 */
const CARDS = [
  {
    // Vince at the advisory table (laptop, smiling) — face sits left of center.
    id: "strategic",
    src: pub("images", "services", "strategic-2.webp"),
    fx: 0.48,
    fy: 0.28,
  },
  {
    // On stage with the mic, pointing up-right — bias left so the gesture keeps air.
    id: "keynote",
    src: pub("images", "services", "keynote-2.webp"),
    fx: 0.45,
    fy: 0.2,
  },
  {
    // Over-the-shoulder pairing at the monitor — both subjects left of center.
    id: "workshop",
    src: pub("images", "services", "workshop-2.jpg"),
    fx: 0.47,
    fy: 0.3,
  },
  {
    // Wide session room (landscape) — center the portrait crop on Vince at the screen.
    id: "embedded",
    src: pub("images", "services", "embedded-2.jpeg"),
    fx: 0.42,
    fy: 0.28,
  },
];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const kb = (buf) => `${(buf.length / 1024).toFixed(0)}KB`;

/** Compute the cover-crop extract box for the card aspect, centered on the focal point. */
async function cropBox(src, fx, fy) {
  const meta = await sharp(src, { failOn: "none" }).rotate().metadata();
  const W = meta.width;
  const H = meta.height;
  const srcAR = W / H;
  if (srcAR >= TARGET_AR) {
    // Wider than the card → keep full height, crop width, center on the subject.
    const ch = H;
    const cw = Math.round(H * TARGET_AR);
    const left = clamp(Math.round(fx * W - cw / 2), 0, W - cw);
    return { left, top: 0, width: cw, height: ch };
  }
  // Taller than the card → keep full width, crop height, anchor the face high.
  const faceAnchor = 0.36;
  const cw = W;
  const ch = Math.round(W / TARGET_AR);
  const top = clamp(Math.round(fy * H - faceAnchor * ch), 0, H - ch);
  return { left: 0, top, width: cw, height: ch };
}

async function buildCards() {
  const outDir = pub("images", "services");
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`\ncard crops → public/images/services  (${OUT_W}x${OUT_H}, AR ${TARGET_AR.toFixed(3)})`);
  for (const c of CARDS) {
    if (!fs.existsSync(c.src)) {
      console.warn(`  ! MISSING source for ${c.id}: ${c.src}`);
      continue;
    }
    const box = await cropBox(c.src, c.fx, c.fy);
    const base = sharp(c.src, { failOn: "none" })
      .rotate()
      .extract(box)
      .resize(OUT_W, OUT_H, { fit: "cover", position: "centre" });
    const webpBuf = await base.clone().webp({ quality: WEBP_Q }).toBuffer();
    fs.writeFileSync(path.join(outDir, `${c.id}.webp`), webpBuf);
    const jpgBuf = await base.clone().jpeg({ quality: JPG_Q, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(outDir, `${c.id}.jpg`), jpgBuf);
    console.log(`  ${c.id.padEnd(9)} fx=${c.fx}  webp ${kb(webpBuf).padStart(6)}  jpg ${kb(jpgBuf).padStart(6)}`);
  }
}

async function buildNavigator() {
  const inDir = pub("images", "navigator");
  const outDir = path.join(inDir, "optimized");
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`\nnavigator batch → public/images/navigator/optimized  (max 2000px long edge)`);
  const files = fs
    .readdirSync(inDir)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .filter((f) => fs.statSync(path.join(inDir, f)).isFile());
  for (const f of files) {
    const src = path.join(inDir, f);
    const stem = f.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "_");
    const pipe = sharp(src, { failOn: "none" })
      .rotate()
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true });
    const webpBuf = await pipe.clone().webp({ quality: 80 }).toBuffer();
    fs.writeFileSync(path.join(outDir, `${stem}.webp`), webpBuf);
    const jpgBuf = await pipe.clone().jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    fs.writeFileSync(path.join(outDir, `${stem}.jpg`), jpgBuf);
    console.log(`  ${f.padEnd(48)} webp ${kb(webpBuf).padStart(6)}  jpg ${kb(jpgBuf).padStart(6)}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--navigator-only")) {
    await buildNavigator();
  } else {
    await buildCards();
    if (args.includes("--navigator")) await buildNavigator();
  }
  console.log("\ndone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
