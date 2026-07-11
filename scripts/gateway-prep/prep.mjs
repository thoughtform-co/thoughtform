// Gateway Motion prep — orchestrator.
//
//   node scripts/gateway-prep/prep.mjs                      # all visuals, all stages
//   node scripts/gateway-prep/prep.mjs --visual gateway-v1  # one visual (csv ok)
//   node scripts/gateway-prep/prep.mjs --stage analyze      # analyze|derive|manifest
//   node scripts/gateway-prep/prep.mjs --force              # re-run analyze even if masters exist
//   node scripts/gateway-prep/prep.mjs --size 770           # depth net short side (quality pass)
//
// analyze.py (Python: onnxruntime/numpy/PIL) writes masters to
// scripts/gateway-prep/out/<id>/; derive.mjs (sharp) writes web derivatives to
// public/gateway-motion/<id>/; this file assembles public/gateway-motion/manifest.json.
//
// Windows note: source dir lives in Dropbox with spaces in the path — spawnSync
// always gets an argv ARRAY with shell:false (repo precedent: optimize-video.mjs).

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { DEFAULT_SRC_DIR, MODEL_PATH, OUT_MASTERS, OUT_PUBLIC, VISUALS } from "./config.mjs";
import { deriveVisual } from "./derive.mjs";

function parseArgs(argv) {
  const args = { visuals: null, stage: "all", src: DEFAULT_SRC_DIR, force: false, size: 518 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--visual") args.visuals = argv[++i].split(",").map((s) => s.trim());
    else if (a === "--stage") args.stage = argv[++i];
    else if (a === "--src") args.src = argv[++i];
    else if (a === "--force") args.force = true;
    else if (a === "--size") args.size = Number(argv[++i]);
    else {
      console.error(`Unknown arg: ${a}`);
      process.exit(1);
    }
  }
  return args;
}

function runAnalyze(visual, args, repoRoot) {
  const masterDir = path.join(repoRoot, OUT_MASTERS, visual.id);
  const done = ["depth-16.png", "mask-artifact.png", "mask-stars.png", "background.png"].every((f) =>
    existsSync(path.join(masterDir, f))
  );
  if (done && !args.force) {
    console.log(`[prep] ${visual.id}: masters exist, skipping analyze (--force to redo)`);
    return true;
  }
  const plate = path.join(args.src, visual.srcFile);
  const res = spawnSync(
    "python",
    [
      path.join(repoRoot, "scripts/gateway-prep/analyze.py"),
      "--plate", plate,
      "--out", masterDir,
      "--model", path.join(repoRoot, MODEL_PATH),
      "--size", String(args.size),
    ],
    { stdio: "inherit", shell: false }
  );
  if (res.status !== 0) {
    console.error(`[prep] ${visual.id}: analyze.py failed (exit ${res.status})`);
    return false;
  }
  return true;
}

function assembleManifest(repoRoot) {
  const visuals = [];
  for (const v of VISUALS) {
    const metaPath = path.join(repoRoot, OUT_PUBLIC, v.id, "meta.json");
    if (!existsSync(metaPath)) continue;
    try {
      visuals.push(JSON.parse(readFileSync(metaPath, "utf8")));
    } catch (err) {
      console.warn(`[prep] skipping unreadable meta for ${v.id}: ${err.message}`);
    }
  }
  const manifestPath = path.join(repoRoot, OUT_PUBLIC, "manifest.json");

  // Preserve hand-tuned per-visual `tuning` blocks across regenerations.
  if (existsSync(manifestPath)) {
    try {
      const prev = JSON.parse(readFileSync(manifestPath, "utf8"));
      for (const entry of visuals) {
        const old = prev.visuals?.find((p) => p.id === entry.id);
        if (old?.tuning && !entry.tuning) entry.tuning = old.tuning;
      }
    } catch {
      /* fresh manifest */
    }
  }

  const manifest = { version: 1, generatedAt: new Date().toISOString(), visuals };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`[prep] manifest.json written (${visuals.length} visuals)`);
}

async function main() {
  const args = parseArgs(process.argv);
  const repoRoot = process.cwd();
  const targets = args.visuals
    ? VISUALS.filter((v) => args.visuals.includes(v.id))
    : VISUALS.filter((v) => existsSync(path.join(args.src, v.srcFile)));

  if (args.visuals) {
    const unknown = args.visuals.filter((id) => !VISUALS.some((v) => v.id === id));
    if (unknown.length) {
      console.error(`Unknown visual ids: ${unknown.join(", ")}. Known: ${VISUALS.map((v) => v.id).join(", ")}`);
      process.exit(1);
    }
  }
  console.log(`[prep] targets: ${targets.map((v) => v.id).join(", ") || "(none found)"}`);

  let failures = 0;
  for (const visual of targets) {
    if (args.stage === "all" || args.stage === "analyze") {
      if (!runAnalyze(visual, args, repoRoot)) {
        failures++;
        continue;
      }
    }
    if (args.stage === "all" || args.stage === "derive") {
      try {
        await deriveVisual(visual.id, args.src, repoRoot);
      } catch (err) {
        console.error(`[prep] ${visual.id}: derive failed — ${err.message}`);
        failures++;
      }
    }
  }

  if (args.stage === "all" || args.stage === "derive" || args.stage === "manifest") {
    assembleManifest(repoRoot);
  }
  if (failures) {
    console.error(`[prep] completed with ${failures} failure(s)`);
    process.exit(1);
  }
  console.log("[prep] done");
}

main();
