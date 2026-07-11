// Gateway Motion prep — web derivatives for one visual (sharp).
//
// Reads the source plate + analysis masters (scripts/gateway-prep/out/<id>/)
// and writes everything the runtime consumes to public/gateway-motion/<id>/:
//
//   plate-2560.avif / .webp, plate-1600.avif / .webp
//   depth-8.webp        1024w near-lossless grayscale
//   depth-packed.webp   1024w lossless, 16-bit depth packed R=hi G=lo
//                       (shader decode: (R*255*256 + G*255) / 65535)
//   mask-artifact.webp, mask-stars.webp (1024w), background-1600.webp
//   meta.json           per-visual manifest entry (assembled by prep.mjs)
//
// Usage: node scripts/gateway-prep/derive.mjs --visual gateway-v1 [--src <dir>]

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";
import {
  AVIF_QUALITY,
  BACKGROUND_WEB_WIDTH,
  DEFAULT_SRC_DIR,
  DEPTH_WEB_WIDTH,
  LQIP_WIDTH,
  MASK_WEB_WIDTH,
  OUT_MASTERS,
  OUT_PUBLIC,
  PLATE_WIDTHS,
  VISUALS,
  WEBP_QUALITY,
} from "./config.mjs";

function parseArgs(argv) {
  const args = { src: DEFAULT_SRC_DIR, visual: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--visual") args.visual = argv[++i];
    else if (argv[i] === "--src") args.src = argv[++i];
  }
  return args;
}

const rel = (p) => "/" + path.relative("public", p).split(path.sep).join("/");

export async function deriveVisual(visualId, srcDir = DEFAULT_SRC_DIR, repoRoot = process.cwd()) {
  const visual = VISUALS.find((v) => v.id === visualId);
  if (!visual) throw new Error(`Unknown visual id: ${visualId}`);

  const srcPlate = path.join(srcDir, visual.srcFile);
  const masterDir = path.join(repoRoot, OUT_MASTERS, visual.id);
  const outDir = path.join(repoRoot, OUT_PUBLIC, visual.id);
  if (!existsSync(srcPlate)) throw new Error(`Source plate missing: ${srcPlate}`);
  mkdirSync(outDir, { recursive: true });

  const srcMeta = await sharp(srcPlate).metadata();
  const entry = {
    id: visual.id,
    name: visual.name,
    source: { file: visual.srcFile, width: srcMeta.width, height: srcMeta.height },
    plate: { avif: [], webp: [], lqip: "" },
    depth: null,
    masks: { artifact: null, stars: null, background: null },
    sequence: null,
  };

  // ---- plates
  for (const w of PLATE_WIDTHS) {
    const base = path.join(outDir, `plate-${w}`);
    await sharp(srcPlate).resize({ width: w }).avif({ quality: AVIF_QUALITY, effort: 4 }).toFile(`${base}.avif`);
    await sharp(srcPlate).resize({ width: w }).webp({ quality: WEBP_QUALITY }).toFile(`${base}.webp`);
    entry.plate.avif.push({ w, src: rel(`${base}.avif`) });
    entry.plate.webp.push({ w, src: rel(`${base}.webp`) });
    console.log(`[derive] ${visual.id} plate-${w} written`);
  }

  const lqipBuf = await sharp(srcPlate).resize({ width: LQIP_WIDTH }).webp({ quality: 40 }).toBuffer();
  entry.plate.lqip = `data:image/webp;base64,${lqipBuf.toString("base64")}`;

  // ---- depth (from 16-bit master)
  const depthMaster = path.join(masterDir, "depth-16.png");
  if (existsSync(depthMaster)) {
    const depthOut = path.join(outDir, "depth-8.webp");
    await sharp(depthMaster)
      .resize({ width: DEPTH_WEB_WIDTH })
      .webp({ nearLossless: true, quality: 80 })
      .toFile(depthOut);

    // RG-packed 16-bit: read master as raw ushort, split hi/lo bytes.
    const { data, info } = await sharp(depthMaster)
      .resize({ width: DEPTH_WEB_WIDTH })
      .raw({ depth: "ushort" })
      .toBuffer({ resolveWithObject: true });
    const u16 = new Uint16Array(data.buffer, data.byteOffset, info.width * info.height * info.channels);
    const rgb = Buffer.alloc(info.width * info.height * 3);
    for (let i = 0, px = 0; i < u16.length; i += info.channels, px++) {
      const v = u16[i];
      rgb[px * 3] = v >> 8;
      rgb[px * 3 + 1] = v & 0xff;
      rgb[px * 3 + 2] = 0;
    }
    const packedOut = path.join(outDir, "depth-packed.webp");
    await sharp(rgb, { raw: { width: info.width, height: info.height, channels: 3 } })
      .webp({ lossless: true })
      .toFile(packedOut);

    const depthWebMeta = await sharp(depthOut).metadata();
    entry.depth = {
      src8: rel(depthOut),
      srcPacked: rel(packedOut),
      width: depthWebMeta.width,
      height: depthWebMeta.height,
    };
    console.log(`[derive] ${visual.id} depth-8 + depth-packed written`);
  } else {
    console.warn(`[derive] ${visual.id}: no depth master (${depthMaster}) — run analyze.py first`);
  }

  // ---- masks + background
  const masks = [
    ["mask-artifact.png", "mask-artifact.webp", MASK_WEB_WIDTH, "artifact"],
    ["mask-stars.png", "mask-stars.webp", MASK_WEB_WIDTH, "stars"],
    ["background.png", "background-1600.webp", BACKGROUND_WEB_WIDTH, "background"],
  ];
  for (const [srcName, outName, width, key] of masks) {
    const masterPath = path.join(masterDir, srcName);
    if (!existsSync(masterPath)) continue;
    const outPath = path.join(outDir, outName);
    const isMask = key !== "background";
    const pipeline = sharp(masterPath).resize({ width });
    await (isMask
      ? pipeline.webp({ nearLossless: true, quality: 70 })
      : pipeline.webp({ quality: WEBP_QUALITY })
    ).toFile(outPath);
    entry.masks[key] = rel(outPath);
  }

  // Preserve an existing sequence block (frames.mjs writes it independently).
  const metaPath = path.join(outDir, "meta.json");
  if (existsSync(metaPath)) {
    try {
      const prev = JSON.parse(readFileSync(metaPath, "utf8"));
      if (prev.sequence) entry.sequence = prev.sequence;
      if (prev.tuning) entry.tuning = prev.tuning;
    } catch {
      /* regenerate from scratch */
    }
  }

  writeFileSync(metaPath, JSON.stringify(entry, null, 2));
  console.log(`[derive] ${visual.id} meta.json written`);
  return entry;
}

const isMain = process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]));
if (isMain) {
  const args = parseArgs(process.argv);
  if (!args.visual) {
    console.error("Usage: node scripts/gateway-prep/derive.mjs --visual <id> [--src <dir>]");
    process.exit(1);
  }
  deriveVisual(args.visual, args.src).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
