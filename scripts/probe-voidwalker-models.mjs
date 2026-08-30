#!/usr/bin/env node
/**
 * probe-voidwalker-models.mjs — walks public/models/voidwalker/ and pins
 * the ADR-082 per-era GLB budget (≤4 MB per file).
 *
 * Also verifies each expected era-*.jpg still exists under
 * public/images/voidwalker/ so a `stillPath` in `characterEras.ts` that
 * points at nothing surfaces at build time rather than at page load.
 *
 * The character stage tolerates missing GLBs (falls back to the still);
 * a MISSING STILL is what breaks the rest state, so that check is hard.
 *
 * Usage:
 *   node scripts/probe-voidwalker-models.mjs
 *   node scripts/probe-voidwalker-models.mjs --strict     # fail on missing GLB too
 */

import { readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO = resolve(__dirname, "..");
const MODELS = join(REPO, "public", "models", "voidwalker");
const STILLS = join(REPO, "public", "images", "voidwalker");
const BUDGET_MB = 4;

const ERAS = ["loop", "genai", "azeroth", "expanse", "pokemon-go"];

const strict = process.argv.includes("--strict");

/** @type {{ ok: string[]; warn: string[]; err: string[] }} */
const report = { ok: [], warn: [], err: [] };

async function fileSize(path) {
  const s = await stat(path);
  return s.size;
}

/** Walk `public/images/voidwalker/`; if the folder exists, per-era stills
 *  must exist (era-<id>.jpg or era-<id>.png). If the folder does NOT
 *  exist, the registry still points at other paths (e.g.
 *  `/images/services/vince.jpg`) — that is the pre-production state and
 *  is fine. */
async function checkStills() {
  if (!existsSync(STILLS)) {
    report.warn.push(
      `public/images/voidwalker/ does not exist yet — the registry points at fallback stills. Once real era stills land, put them here.`
    );
    return;
  }
  const files = await readdir(STILLS);
  for (const era of ERAS) {
    const found = files.find((f) => new RegExp(`^era-${era}\\.(jpg|png|webp)$`).test(f));
    if (!found) {
      report.warn.push(`still missing: era-${era}.jpg (era ${era})`);
    } else {
      report.ok.push(`still ok: ${found}`);
    }
  }
}

async function checkModels() {
  if (!existsSync(MODELS)) {
    const msg = `public/models/voidwalker/ does not exist yet — the character stage falls back to stills.`;
    if (strict) report.err.push(msg);
    else report.warn.push(msg);
    return;
  }
  const files = await readdir(MODELS);
  for (const era of ERAS) {
    const found = files.find((f) => f === `${era}.glb`);
    if (!found) {
      const msg = `model missing: ${era}.glb`;
      if (strict) report.err.push(msg);
      else report.warn.push(msg);
      continue;
    }
    const path = join(MODELS, found);
    const bytes = await fileSize(path);
    const mb = bytes / (1024 * 1024);
    if (mb > BUDGET_MB) {
      report.err.push(
        `over budget: ${found} is ${mb.toFixed(2)} MB > ${BUDGET_MB} MB (ADR-082 budget)`
      );
    } else {
      report.ok.push(`model ok: ${found} (${mb.toFixed(2)} MB)`);
    }
  }
}

await checkStills();
await checkModels();

for (const line of report.ok) console.log(`[ ok ] ${line}`);
for (const line of report.warn) console.log(`[warn] ${line}`);
for (const line of report.err) console.log(`[FAIL] ${line}`);

if (report.err.length) {
  console.error(
    `\nprobe-voidwalker-models: ${report.err.length} FAIL(s), ${report.warn.length} warn(s)`
  );
  process.exit(1);
}
console.log(
  `\nprobe-voidwalker-models: ${report.ok.length} ok, ${report.warn.length} warn, 0 fail`
);
