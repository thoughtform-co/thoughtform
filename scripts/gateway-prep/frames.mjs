// Gateway Motion prep — frame-sequence packaging (ffmpeg).
//
// Turns a video (or an image sequence directory from TouchDesigner/Unreal)
// into the scroll-scrub contract consumed by ScrubSequenceGateway:
//
//   public/gateway-motion/<visual>/frames/f_0001.webp ... f_NNNN.webp
//   + `sequence` block written into the visual's meta.json (SequenceMeta)
//
//   node scripts/gateway-prep/frames.mjs --input public/videos/thoughtform-key-visual-2-web.mp4 \
//        --visual gateway-v1 --fps 24 --width 1280 [--format webp|avif] [--quality 80] [--trim 8]
//
// --input may be a video file OR a directory of numbered PNG/JPG frames
// (TD "Movie File Out" image sequences, Unreal MRQ output). --trim caps the
// duration in seconds for video inputs. WebP for proxy iterations; AVIF only
// for final renders (libaom still-image encode is slow).

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";
import { OUT_PUBLIC, VISUALS } from "./config.mjs";

function parseArgs(argv) {
  const args = { input: null, visual: null, fps: 24, width: 1280, format: "webp", quality: 80, trim: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input") args.input = argv[++i];
    else if (a === "--visual") args.visual = argv[++i];
    else if (a === "--fps") args.fps = Number(argv[++i]);
    else if (a === "--width") args.width = Number(argv[++i]);
    else if (a === "--format") args.format = argv[++i];
    else if (a === "--quality") args.quality = Number(argv[++i]);
    else if (a === "--trim") args.trim = Number(argv[++i]);
    else {
      console.error(`Unknown arg: ${a}`);
      process.exit(1);
    }
  }
  return args;
}

function extractVideoFrames(input, framesDir, args) {
  // ffmpeg does the decode + fps resample + scale; sharp handles final encode
  // only for AVIF (ffmpeg's native webp encoder is fine for proxies).
  const vf = `fps=${args.fps},scale=${args.width}:-2:flags=lanczos`;
  const ffArgs = ["-hide_banner", "-loglevel", "error", "-y", "-i", input];
  if (args.trim) ffArgs.push("-t", String(args.trim));
  ffArgs.push("-vf", vf);
  if (args.format === "webp") {
    ffArgs.push("-c:v", "libwebp", "-quality", String(args.quality), path.join(framesDir, "f_%04d.webp"));
  } else {
    // Extract PNG, transcode to AVIF with sharp below.
    ffArgs.push(path.join(framesDir, "f_%04d.png"));
  }
  const res = spawnSync("ffmpeg", ffArgs, { stdio: "inherit", shell: false });
  if (res.status !== 0) throw new Error(`ffmpeg failed (exit ${res.status})`);
}

async function importImageSequence(inputDir, framesDir, args) {
  const files = readdirSync(inputDir)
    .filter((f) => /\.(png|jpe?g|webp|tiff?)$/i.test(f))
    .sort();
  if (!files.length) throw new Error(`No frames found in ${inputDir}`);
  let index = 1;
  for (const f of files) {
    const out = path.join(framesDir, `f_${String(index).padStart(4, "0")}.${args.format}`);
    const pipeline = sharp(path.join(inputDir, f)).resize({ width: args.width });
    await (args.format === "avif"
      ? pipeline.avif({ quality: args.quality, effort: 4 })
      : pipeline.webp({ quality: args.quality })
    ).toFile(out);
    index++;
  }
  return files.length;
}

async function transcodePngsToAvif(framesDir, args) {
  const pngs = readdirSync(framesDir).filter((f) => f.endsWith(".png")).sort();
  for (const f of pngs) {
    const out = path.join(framesDir, f.replace(/\.png$/, ".avif"));
    await sharp(path.join(framesDir, f)).avif({ quality: args.quality, effort: 4 }).toFile(out);
    rmSync(path.join(framesDir, f));
  }
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.input || !args.visual) {
    console.error("Usage: node scripts/gateway-prep/frames.mjs --input <video|frameDir> --visual <id> [--fps 24] [--width 1280] [--format webp|avif] [--quality 80] [--trim <sec>]");
    process.exit(1);
  }
  if (!VISUALS.some((v) => v.id === args.visual)) {
    console.error(`Unknown visual id: ${args.visual}`);
    process.exit(1);
  }
  if (!existsSync(args.input)) {
    console.error(`Input not found: ${args.input}`);
    process.exit(1);
  }

  const repoRoot = process.cwd();
  const outDir = path.join(repoRoot, OUT_PUBLIC, args.visual);
  const framesDir = path.join(outDir, "frames");
  rmSync(framesDir, { recursive: true, force: true });
  mkdirSync(framesDir, { recursive: true });

  if (statSync(args.input).isDirectory()) {
    await importImageSequence(args.input, framesDir, args);
  } else {
    extractVideoFrames(args.input, framesDir, args);
    if (args.format === "avif") await transcodePngsToAvif(framesDir, args);
  }

  const frames = readdirSync(framesDir).filter((f) => f.startsWith("f_")).sort();
  if (!frames.length) throw new Error("No frames were produced");
  const firstMeta = await sharp(path.join(framesDir, frames[0])).metadata();

  // Poster = middle frame as webp next to the sequence.
  const posterSrc = path.join(framesDir, frames[Math.floor(frames.length / 2)]);
  const posterOut = path.join(outDir, "sequence-poster.webp");
  await sharp(posterSrc).webp({ quality: 80 }).toFile(posterOut);

  const publicBase = `/gateway-motion/${args.visual}`;
  const sequence = {
    fps: args.fps,
    frameCount: frames.length,
    urlPattern: `${publicBase}/frames/f_{index4}.${args.format}`,
    width: firstMeta.width,
    height: firstMeta.height,
    poster: `${publicBase}/sequence-poster.webp`,
    format: args.format,
  };

  const metaPath = path.join(outDir, "meta.json");
  if (!existsSync(metaPath)) {
    console.error(`meta.json missing for ${args.visual} — run gateway:prep first`);
    process.exit(1);
  }
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  meta.sequence = sequence;
  writeFileSync(metaPath, JSON.stringify(meta, null, 2));

  // Refresh the root manifest with the new sequence block.
  const manifestPath = path.join(repoRoot, OUT_PUBLIC, "manifest.json");
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const entry = manifest.visuals.find((v) => v.id === args.visual);
    if (entry) entry.sequence = sequence;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  const totalBytes = frames.reduce((sum, f) => sum + statSync(path.join(framesDir, f)).size, 0);
  console.log(
    `[frames] ${args.visual}: ${frames.length} frames @ ${firstMeta.width}x${firstMeta.height} ${args.format}, ` +
      `${(totalBytes / 1024 / 1024).toFixed(1)} MB total`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
