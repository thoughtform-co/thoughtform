#!/usr/bin/env node
/**
 * sync-voidwalker-avatar-preview.mjs
 *
 * Copies the voidwalker-avatar waves into `public/_previews/voidwalker-avatar/`
 * so the internal preview route at `/test/voidwalker-avatar-preview` can serve
 * them.
 *
 * ⚠ TWO SOURCES SINCE ADR-082 U31. The offline skill's `waves/` holds the
 * history (azeroth, the canonical pair); the in-repo chain
 * (`scripts/voidwalker-avatar/waves/`) holds everything since ADR-082 U24 —
 * genai, expanse, and the two-step plates. Both use `waves/<YYYYMMDD>-<era>-v<N>/`,
 * so they merge by wave id; a wave present in both takes the in-repo copy.
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
// The in-repo chain (ADR-082 U31). ⚠ The two-root edit shipped READING this
// constant without DECLARING it, so the first run died on a ReferenceError
// before it copied a byte — and nothing else imports the script to notice.
const REPO_WAVES = join(REPO, "scripts", "voidwalker-avatar", "waves");
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

/**
 * Per-frame working directories, which a wave carries by the thousand and the
 * gallery never reads.
 *
 * ⚠ THE FILTER IS ON THE DIRECTORY, NOT THE EXTENSION. A wave's frame folders
 * hold ordinary `.png`s — the same extension as every still we DO want — so an
 * extension rule cannot tell an intermediate from a deliverable. The azeroth-v4
 * wave measured 1.1 GB synced against ~9 MB of actual delivery files: 454 MB of
 * keyed video frames, 202 MB of framed copies, 193 MB of graded copies. That is
 * a working set, and it is regenerable from the scripts beside it.
 */
/**
 * ⚠ AND A NEW ROUTE BRINGS NEW SCRATCH NAMES. The Blender wave writes its RGBA
 * sequence to `render/` and its comparison cut to `render-solo/` — 149 PNGs
 * each, ~166 MB per directory — which the v4 rule did not match, so the mirror
 * went 289 MB to 456 MB the first time this wave synced. Same defect the
 * comment above records, one pipeline later: a frame folder is a WORKING SET,
 * regenerable from the scripts beside it, and only its NAME distinguishes it.
 */
/**
 * ⚠ AND THE IN-REPO CHAIN'S WORKING SETS (ADR-082 U31): `post.py` writes
 * `veo/frames/`, `veo/loop/` and `graded/`, which a bare-name rule has to name.
 *
 * ⚠ `refs/` IS NOT A WORKING SET, IT IS A PRIVACY BOUNDARY. A wave's references
 * are crops of the owner's photographs AND of the people standing beside him in
 * them — the Expanse set frames carry three other visitors — and a mirror into
 * `public/` is one deploy away from serving them. It is excluded by name here
 * and `public/_previews` is in `.vercelignore` besides; neither alone is enough.
 */
const SCRATCH_DIRS =
  /^(_|frames?$|frames?[-_]|loop$|graded$|refs$|render$|render[-_]|gif-raw$|gif-framed$|capture|framed|veo-framed$|nano-framed$|kling-framed$)/i;

/**
 * ⚠ A BLIND SHEET'S ANSWER KEY NEVER REACHES THE MIRROR. `gold.py --selftest`
 * writes `g0-key.json` beside the G0 pair and `sheet.py` writes `sheet-key.json`
 * beside every pick sheet — the letter-to-source map that makes the sheet blind.
 * `.json` is otherwise mirrored as metadata, so without this the answer sits one
 * URL away from the question on the page he is asked to judge it on.
 */
const ANSWER_KEY = /(^|[-_])key\.json$/i;

async function walk(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Wave roots are never scratch; only folders INSIDE a wave are tested,
      // so a wave called `_something` still syncs.
      if (dir !== base && SCRATCH_DIRS.test(entry.name)) continue;
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
  const roots = [SKILL_WAVES, REPO_WAVES].filter((root) => existsSync(root));
  if (!roots.length) {
    console.error(`ERROR: no waves folder found at ${SKILL_WAVES} or ${REPO_WAVES}`);
    process.exit(2);
  }

  if (clean && existsSync(DEST)) {
    console.log(`cleaning ${DEST}...`);
    await rm(DEST, { recursive: true, force: true });
  }

  await ensureDir(DEST);

  /* Later roots win on a shared relative path — the in-repo chain is listed
     last, so its copy of a wave is the one that lands. */
  const byRel = new Map();
  for (const root of roots) for (const file of await walk(root)) byRel.set(file.rel, file);
  const files = [...byRel.values()];
  const manifest = {
    generated_at: new Date().toISOString(),
    source: roots,
    waves: /** @type {Record<string, any>} */ ({}),
  };

  let copiedMedia = 0;
  let skipped = 0;
  let totalBytes = 0;

  for (const file of files) {
    const ext = file.rel.slice(file.rel.lastIndexOf(".")).toLowerCase();
    const isMedia = MEDIA_EXTENSIONS.has(ext);
    const isMeta = METADATA_EXTENSIONS.has(ext);
    if ((!isMedia && !isMeta) || ANSWER_KEY.test(file.rel.split("/").pop() ?? "")) {
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

  await writeFile(join(DEST, "manifest.json"), JSON.stringify(manifest, null, 2));

  console.log(
    `synced ${copiedMedia} media files (${(totalBytes / (1024 * 1024)).toFixed(1)} MB) across ${Object.keys(manifest.waves).length} waves to ${relative(REPO, DEST)}`
  );
  if (skipped) console.log(`skipped ${skipped} non-media files`);
}

await main();
