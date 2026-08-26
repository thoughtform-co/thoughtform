#!/usr/bin/env node
/**
 * sync-voidwalker-avatar-preview.mjs
 *
 * Copies the voidwalker-avatar skill's `waves/` folder into
 * `public/_previews/voidwalker-avatar/` so the internal preview route
 * at `/test/voidwalker-avatar-preview` can serve them.
 *
 * ⚠ READ-ONLY against the skill: this script only READS from the source
 * waves and WRITES to the repo's `public/_previews/`. It never mutates
 * anything under `C:\Users\buyss\.claude\skills\voidwalker-avatar\`.
 *
 * ⚠ EXCLUDED from git (`public/_previews/` is in .gitignore); it is a
 * per-machine cache of the current wave state.
 *
 * Usage:
 *   node scripts/sync-voidwalker-avatar-preview.mjs
 *   node scripts/sync-voidwalker-avatar-preview.mjs --clean
 */

import { readdir, stat, mkdir, copyFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, relative } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO = resolve(__dirname, "..");

// The skill lives outside the repo — resolve from the user's home,
// which is the same on both known dev machines.
const SKILL_WAVES = "C:\\Users\\buyss\\.claude\\skills\\voidwalker-avatar\\waves";
const SKILL_EVALS = "C:\\Users\\buyss\\.claude\\skills\\voidwalker-avatar\\evals";
const DEST = join(REPO, "public", "_previews", "voidwalker-avatar");

const clean = process.argv.includes("--clean");

const MEDIA_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".mp4",
  ".webm",
  ".mov",
  ".glb",
]);

const METADATA_EXTENSIONS = new Set([".json", ".md"]);

async function walk(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path, base)));
    } else {
      files.push({ path, rel: relative(base, path).split("\\").join("/") });
    }
  }
  return files;
}

async function ensureDir(dir) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

async function main() {
  if (!existsSync(SKILL_WAVES)) {
    console.error(`ERROR: skill waves folder not found at ${SKILL_WAVES}`);
    process.exit(2);
  }

  if (clean && existsSync(DEST)) {
    console.log(`cleaning ${DEST}...`);
    await rm(DEST, { recursive: true, force: true });
  }

  await ensureDir(DEST);

  const files = await walk(SKILL_WAVES);
  const manifest = {
    generated_at: new Date().toISOString(),
    source: SKILL_WAVES,
    waves: /** @type {Record<string, any>} */ ({}),
  };

  let copiedMedia = 0;
  let skipped = 0;
  let totalBytes = 0;

  for (const file of files) {
    const ext = file.rel.slice(file.rel.lastIndexOf(".")).toLowerCase();
    const isMedia = MEDIA_EXTENSIONS.has(ext);
    const isMeta = METADATA_EXTENSIONS.has(ext);
    if (!isMedia && !isMeta) {
      skipped++;
      continue;
    }
    const destPath = join(DEST, file.rel);
    await ensureDir(dirname(destPath));
    await copyFile(file.path, destPath);
    if (isMedia) {
      copiedMedia++;
      const s = await stat(destPath);
      totalBytes += s.size;
    }

    // Track the wave in the manifest.
    const parts = file.rel.split("/");
    const waveId = parts[0];
    if (!waveId) continue;
    if (!manifest.waves[waveId]) {
      manifest.waves[waveId] = /** @type {any} */ ({ files: [], meta: [] });
    }
    const rec = { rel: file.rel, size: (await stat(file.path)).size };
    if (isMedia) manifest.waves[waveId].files.push(rec);
    else manifest.waves[waveId].meta.push(rec);
  }

  // Copy the eval log too — it carries the narrative for each wave.
  if (existsSync(SKILL_EVALS)) {
    const evalLog = join(SKILL_EVALS, "EVAL_LOG.md");
    if (existsSync(evalLog)) {
      await copyFile(evalLog, join(DEST, "EVAL_LOG.md"));
      manifest.eval_log = "EVAL_LOG.md";
    }
  }

  await writeFile(
    join(DEST, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  console.log(
    `synced ${copiedMedia} media files (${(totalBytes / (1024 * 1024)).toFixed(1)} MB) across ${Object.keys(manifest.waves).length} waves to ${relative(REPO, DEST)}`
  );
  if (skipped) console.log(`skipped ${skipped} non-media files`);
}

await main();
