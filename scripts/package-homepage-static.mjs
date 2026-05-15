/**
 * package-homepage-static.mjs
 *
 * Builds a self-contained static export of the LIVE marketing page (the
 * production Next.js app) and packages it as a shareable zip.
 *
 * Why: the prototype zip (`scripts/package-homepage.mjs`) ships only the v7
 * design source. The live thoughtform.co page layers a chunk of React-rendered
 * choreography on top — fixed brandmark, parametric celestial connectors,
 * practice-orbit telemetry, motion runtime. This script ships THAT version.
 *
 * Approach:
 *   1. Quarantine routes that aren't statically exportable by renaming them
 *      with a leading `_` (Next.js treats `_*` as private folders, excluded
 *      from routing). Targets: app/api, app/(admin), app/(internal),
 *      middleware.ts, app/not-found-page (if any non-static).
 *   2. Run `next build` with NEXT_OUTPUT_EXPORT=1 — next.config.mjs flips on
 *      `output: "export"` and `images: { unoptimized: true }`, and disables
 *      the /v7 redirect (incompatible with static export).
 *   3. Restore everything (always — try/finally).
 *   4. Zip `out/` plus a tiny serve script + README into
 *      `dist/thoughtform-homepage-live.zip`.
 *
 * Output zip layout (when unzipped):
 *   thoughtform-homepage-live/
 *     index.html, _next/, fonts/, images/, ... (the full export)
 *     README.md
 *     serve.cmd / serve.sh   — optional one-click static server
 */

import { existsSync, renameSync, rmSync, mkdirSync, writeFileSync, readFileSync, statSync, readdirSync, copyFileSync } from "node:fs";
import { dirname, join, resolve, relative, posix as pathPosix } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const SUFFIX = ".export-skip";

// Roots whose route entry-points (`route.ts`, `route.tsx`, `page.ts`,
// `page.tsx`) we rename to .export-skip before the build, so Next.js no
// longer treats those paths as routes. We rename per-file (not whole
// directories) because renaming a directory while VSCode/Cursor TS server,
// ESLint, or any file watcher holds a handle on a file inside it triggers
// EPERM on Windows. Per-file renames are atomic and rarely fail.
const QUARANTINE_ROOTS = [
  "app/api",
  "app/(admin)",
  "app/(internal)",
];

// Plus a couple of standalone files we just rename directly.
const QUARANTINE_FILES = [
  "middleware.ts",
];

const moves = [];

function findRouteEntries(dirAbs) {
  if (!existsSync(dirAbs)) return [];
  const out = [];
  const stack = [dirAbs];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const p = join(cur, entry.name);
      if (entry.isDirectory()) {
        stack.push(p);
      } else if (
        entry.name === "route.ts" ||
        entry.name === "route.tsx" ||
        entry.name === "page.ts" ||
        entry.name === "page.tsx" ||
        entry.name === "layout.tsx" ||
        entry.name === "layout.ts" ||
        entry.name === "default.tsx" ||
        entry.name === "default.ts"
      ) {
        out.push(p);
      }
    }
  }
  return out;
}

function renameWithRetry(from, to, attempts = 5) {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      renameSync(from, to);
      return;
    } catch (err) {
      lastErr = err;
      // Brief synchronous sleep to give file watchers a chance to release.
      const until = Date.now() + 250;
      while (Date.now() < until) {
        /* spin */
      }
    }
  }
  throw lastErr;
}

function move(from, to) {
  if (!existsSync(from)) {
    return false;
  }
  if (existsSync(to)) {
    throw new Error(
      `Quarantine target already exists: ${relative(root, to)}. Restore from a previous failed run before rebuilding.`
    );
  }
  renameWithRetry(from, to);
  moves.push([from, to]);
  return true;
}

function restoreAll() {
  // Reverse order so nested moves restore correctly.
  for (let i = moves.length - 1; i >= 0; i -= 1) {
    const [originalAbs, quarantinedAbs] = moves[i];
    if (existsSync(quarantinedAbs)) {
      try {
        renameWithRetry(quarantinedAbs, originalAbs);
      } catch (err) {
        console.error(`  ! FAILED to restore ${relative(root, quarantinedAbs)} → ${relative(root, originalAbs)}: ${err.message}`);
      }
    }
  }
}

// Track state so a SIGINT or unexpected exit still tries to restore.
let restored = false;
const safeRestore = () => {
  if (restored) return;
  restored = true;
  console.log("\n→ Restoring quarantined paths");
  restoreAll();
};
process.on("SIGINT", () => {
  safeRestore();
  process.exit(130);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  safeRestore();
  process.exit(1);
});

try {
  // ── 1. Clean any stale `out/` from a prior export ─────────────────────────
  const outDir = join(root, "out");
  if (existsSync(outDir)) {
    console.log("→ Removing stale out/");
    rmSync(outDir, { recursive: true, force: true });
  }

  // ── 2. Quarantine non-marketing routes ────────────────────────────────────
  console.log("→ Quarantining non-marketing routes");
  let quarantineCount = 0;
  for (const dir of QUARANTINE_ROOTS) {
    const dirAbs = join(root, dir);
    const entries = findRouteEntries(dirAbs);
    for (const fileAbs of entries) {
      if (move(fileAbs, fileAbs + SUFFIX)) quarantineCount += 1;
    }
  }
  for (const file of QUARANTINE_FILES) {
    const fileAbs = join(root, file);
    if (move(fileAbs, fileAbs + SUFFIX)) quarantineCount += 1;
  }
  console.log(`  · ${quarantineCount} files quarantined`);

  // ── 3. Run the build ──────────────────────────────────────────────────────
  console.log("\n→ Running next build (NEXT_OUTPUT_EXPORT=1)");
  // shell: true is essential on Windows so PATH lookup finds npm.cmd / npx.cmd
  // when invoked via spawnSync. Without it, spawnSync can fail to start the
  // process entirely (exit status null).
  const result = spawnSync("npx next build", {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      NEXT_OUTPUT_EXPORT: "1",
      NODE_ENV: "production",
    },
  });

  if (result.error) {
    throw new Error(`Failed to spawn build: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`next build failed with exit code ${result.status}`);
  }

  if (!existsSync(outDir)) {
    throw new Error("Build succeeded but out/ directory was not produced.");
  }

  // ── 4. Stage out/ + README + serve scripts into dist/ ─────────────────────
  console.log("\n→ Staging dist/thoughtform-homepage-live/");
  const stage = join(root, "dist/thoughtform-homepage-live");
  if (existsSync(stage)) rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });

  // Copy out/ → stage/ (recursive)
  const copyRecursive = (src, dst) => {
    const stat = statSync(src);
    if (stat.isDirectory()) {
      mkdirSync(dst, { recursive: true });
      for (const entry of readdirSync(src)) {
        copyRecursive(join(src, entry), join(dst, entry));
      }
    } else {
      copyFileSync(src, dst);
    }
  };
  copyRecursive(outDir, stage);

  // Drop README + tiny serve scripts
  const readme = `# Thoughtform — Live Homepage Snapshot

This is the actual production Thoughtform.co homepage exported as a static
site. Fully interactive — React choreography, scroll-driven HUD updates,
parametric celestial connectors, the works.

## How to view

Modern browsers will not load JS modules over the \`file://\` protocol, so this
build needs a tiny local static server. Three options:

### Option A — Use the provided script

* Windows: double-click \`serve.cmd\`
* macOS / Linux: \`./serve.sh\`

(Both require Node.js. They run \`npx serve .\` on port 4173.)

### Option B — Python (built into macOS / Linux, optional on Windows)

\`\`\`bash
python -m http.server 8000
\`\`\`

Then open <http://localhost:8000>.

### Option C — VS Code "Live Server" extension

Right-click \`index.html\` → "Open with Live Server".

## What's included

The full Next.js static export of the marketing page:

* \`index.html\` — the prerendered homepage
* \`_next/\` — JavaScript chunks (React, Framer Motion, the v7 choreography)
* \`fonts/\`, \`images/\`, \`logos/\`, \`videos/\`, \`prototypes/\` — public assets
* All CSS, including the v7 design tokens

## What's NOT included

* Admin tools (\`/admin\`, \`/astrogation\`, \`/orrery\`)
* Internal/test routes (\`/test/*\`, \`/archive/*\`)
* API endpoints — none of them are needed by the marketing page at runtime
* Live Supabase data — celestial connector designs use the bundled seed data

The recipient sees exactly what visitors of thoughtform.co see when they
land on the homepage. No login required, no internet required (after unzip).
`;
  writeFileSync(join(stage, "README.md"), readme, "utf8");

  const serveCmd = `@echo off
echo Starting local server on http://localhost:4173 ...
echo Press Ctrl+C to stop.
npx --yes serve "%~dp0" -p 4173
`;
  writeFileSync(join(stage, "serve.cmd"), serveCmd, "utf8");

  const serveSh = `#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
echo "Starting local server on http://localhost:4173 ..."
echo "Press Ctrl+C to stop."
exec npx --yes serve "$DIR" -p 4173
`;
  writeFileSync(join(stage, "serve.sh"), serveSh, { mode: 0o755 });

  // ── 5. Trim unreferenced public assets ────────────────────────────────────
  // Next's static export copies the entire public/ folder. The marketing
  // page only references a small subset (a few logos, two videos, a few
  // images). We trim the rest to keep the zip shareable.
  //
  // Strategy: scan all HTML / CSS / JS / JSON files for `/<dir>/...` asset
  // references. For directories listed in TRIMMABLE, delete any file whose
  // path doesn't appear in the reference set.
  console.log("\n→ Trimming unreferenced public assets");
  const TRIMMABLE = ["videos", "logos", "images", "prototypes", "showcase"];
  // Read all text files and build a reference set
  const referencedPaths = new Set();
  const walkText = (p) => {
    const s = statSync(p);
    if (s.isDirectory()) {
      for (const e of readdirSync(p)) walkText(join(p, e));
      return;
    }
    if (!/\.(html?|css|js|mjs|json|txt|svg|map)$/i.test(p)) return;
    let txt;
    try {
      txt = readFileSync(p, "utf8");
    } catch {
      return;
    }
    for (const dir of TRIMMABLE) {
      const re = new RegExp(`/${dir}/[A-Za-z0-9_%\\-./()+ ]+?\\.[A-Za-z0-9]{2,5}`, "g");
      const matches = txt.match(re);
      if (!matches) continue;
      for (const m of matches) {
        // Decode %20 etc. so referenced paths match filesystem paths.
        let decoded = m;
        try {
          decoded = decodeURIComponent(m);
        } catch {
          /* keep as-is */
        }
        referencedPaths.add(decoded);
      }
    }
  };
  walkText(stage);

  let trimmedCount = 0;
  let trimmedBytes = 0;
  for (const dir of TRIMMABLE) {
    const dirAbs = join(stage, dir);
    if (!existsSync(dirAbs)) continue;
    const stack = [dirAbs];
    const filesToDelete = [];
    while (stack.length) {
      const cur = stack.pop();
      for (const entry of readdirSync(cur, { withFileTypes: true })) {
        const p = join(cur, entry.name);
        if (entry.isDirectory()) {
          stack.push(p);
          continue;
        }
        // Convert the file's path under stage/ to a leading-/ posix path so
        // we can compare against `referencedPaths` (which use forward
        // slashes).
        const rel = "/" + relative(stage, p).split(/[\\/]/).join("/");
        if (!referencedPaths.has(rel)) {
          filesToDelete.push([p, statSync(p).size]);
        }
      }
    }
    for (const [p, sz] of filesToDelete) {
      rmSync(p, { force: true });
      trimmedCount += 1;
      trimmedBytes += sz;
    }
    // Remove now-empty directories
    const cleanEmpty = (d) => {
      const entries = readdirSync(d, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) cleanEmpty(join(d, e.name));
      }
      const remaining = readdirSync(d);
      if (remaining.length === 0 && d !== dirAbs) {
        rmSync(d, { recursive: true, force: true });
      }
    };
    cleanEmpty(dirAbs);
  }
  console.log(`  · trimmed ${trimmedCount} files (${(trimmedBytes / 1024 / 1024).toFixed(2)} MB)`);

  // ── 6. Report ─────────────────────────────────────────────────────────────
  let totalBytes = 0;
  const walk = (p) => {
    const s = statSync(p);
    if (s.isDirectory()) for (const e of readdirSync(p)) walk(join(p, e));
    else totalBytes += s.size;
  };
  walk(stage);
  const mb = (totalBytes / 1024 / 1024).toFixed(2);

  console.log(`\n✓ Staged dist/thoughtform-homepage-live/  —  ${mb} MB`);
  console.log("  → next: zip and ship");
} finally {
  safeRestore();
}
