/**
 * package-homepage.mjs
 *
 * Builds a single self-contained, shareable folder of the Thoughtform homepage
 * from the v7 prototype source (`public/prototypes/v7/landing-v7-motion.html`).
 *
 * Output:
 *   dist/thoughtform-homepage/
 *     index.html                  (paths rewritten to be relative)
 *     tokens.css                  (italic @font-face commented out — no asset shipped)
 *     README.md
 *     assets/logos/*.svg
 *     assets/vince-portrait.jpg
 *     videos/*.mp4 + poster
 *     images/Thoughtform_Key Visual_14d.webp
 *     fonts/*.otf + *.ttf
 *
 * Open `index.html` in any modern browser — no server, no Node, no internet
 * required. (Some browsers prefer a tiny static server for `file://` font
 * loading; the README explains how.)
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, statSync, existsSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const src = (p) => join(root, p);
const out = (p) => join(root, "dist/thoughtform-homepage", p);

const STAGE_DIR = join(root, "dist/thoughtform-homepage");

// ── 1. Reset staging directory ──────────────────────────────────────────────
if (existsSync(STAGE_DIR)) rmSync(STAGE_DIR, { recursive: true, force: true });
mkdirSync(STAGE_DIR, { recursive: true });

// ── 2. index.html — read prototype, rewrite absolute paths to relative ──────
let html = readFileSync(src("public/prototypes/v7/landing-v7-motion.html"), "utf8");

// Rewrite production-absolute paths (`/videos/...`, `/images/...`) to be
// co-located beside index.html. The relative `assets/...` references already
// match the layout we ship.
html = html
  .replace(/\/videos\//g, "videos/")
  .replace(/\/images\//g, "images/");

// Tighten the title so the file looks polished when opened.
html = html.replace(
  /<title>[\s\S]*?<\/title>/,
  "<title>Thoughtform — Navigate Intelligence</title>"
);

// The prototype's inline scroll script references HUD IDs that, in production,
// are injected by React (NavigationCockpitV2). Inject hidden span stubs so the
// script can read/write to them without throwing — visible behavior stays the
// same; the console stays clean.
const STUB_IDS = ["progressBar", "hudSignalV", "hudStatus", "coordR", "coordZ"];
const stubBlock = `
<script id="standalone-hud-stubs">
/* injected by scripts/package-homepage.mjs — stubs HUD IDs that the production
   build renders via React. Keeps the prototype's scroll handler crash-free. */
(() => {
  const ids = ${JSON.stringify(STUB_IDS)};
  for (const id of ids) {
    if (document.getElementById(id)) continue;
    const el = document.createElement("span");
    el.id = id;
    el.setAttribute("data-stub", "true");
    el.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none;";
    document.body.appendChild(el);
  }
})();
</script>
`;
html = html.replace(/(<script>\s*\/\* ═+\s*Station detection)/, stubBlock + "$1");

writeFileSync(out("index.html"), html, "utf8");

// ── 3. tokens.css — comment out missing italic font-face for clean DevTools ─
let tokens = readFileSync(src("public/prototypes/v7/tokens.css"), "utf8");
tokens = tokens.replace(
  /@font-face\s*\{\s*font-family:\s*'PP Neue Montreal';\s*src:\s*url\('fonts\/PPNeueMontreal-Italic\.otf'\)[^}]*\}/,
  "/* italic weight not bundled in standalone build (file unavailable) */"
);
writeFileSync(out("tokens.css"), tokens, "utf8");

// ── 4. Copy referenced assets ───────────────────────────────────────────────
const assetMap = [
  // Logos
  ["public/logos/Thoughtform_Brandmark.svg",                "assets/logos/Thoughtform_Brandmark.svg"],
  ["public/logos/Thoughtform_Brandmark_Outline.svg",        "assets/logos/Thoughtform_Brandmark_Outline.svg"],
  ["public/logos/Thoughtform_Wordmark_Lockup-Vertical (Dual).svg",
   "assets/logos/Thoughtform_Wordmark_Lockup-Vertical (Dual).svg"],
  // Founder portrait (referenced as assets/vince-portrait.jpg)
  ["public/images/vince-portrait.jpg",                      "assets/vince-portrait.jpg"],
  // Hero key visual (still + video)
  ["public/images/Thoughtform_Key Visual_14d.webp",         "images/Thoughtform_Key Visual_14d.webp"],
  ["public/videos/thoughtform-key-visual-2-web.mp4",        "videos/thoughtform-key-visual-2-web.mp4"],
  ["public/videos/thoughtform-key-visual-2-poster.jpg",     "videos/thoughtform-key-visual-2-poster.jpg"],
  // Fonts
  ["public/fonts/PPNeueMontreal-Light.otf",                 "fonts/PPNeueMontreal-Light.otf"],
  ["public/fonts/PPNeueMontreal-Book.otf",                  "fonts/PPNeueMontreal-Book.otf"],
  ["public/fonts/PPNeueMontreal-Medium.otf",                "fonts/PPNeueMontreal-Medium.otf"],
  ["public/fonts/PPNeueMontreal-Bold.otf",                  "fonts/PPNeueMontreal-Bold.otf"],
  ["public/fonts/PTMono-Regular.ttf",                       "fonts/PTMono-Regular.ttf"],
  ["public/fonts/PTMono-Bold.ttf",                          "fonts/PTMono-Bold.ttf"],
];

let totalBytes = statSync(out("index.html")).size + statSync(out("tokens.css")).size;
const missing = [];

for (const [from, to] of assetMap) {
  const fromAbs = src(from);
  const toAbs = out(to);
  if (!existsSync(fromAbs)) {
    missing.push(from);
    continue;
  }
  mkdirSync(dirname(toAbs), { recursive: true });
  copyFileSync(fromAbs, toAbs);
  totalBytes += statSync(toAbs).size;
}

if (missing.length) {
  console.warn("⚠ Missing source assets (skipped):");
  for (const m of missing) console.warn("   " + m);
}

// ── 5. README ──────────────────────────────────────────────────────────────
const readme = `# Thoughtform — Homepage Preview

Self-contained snapshot of the Thoughtform.co landing page (v7).
No server, no Node, no internet connection required.

## How to view

1. Unzip this folder anywhere on your machine.
2. Open \`index.html\` in any modern browser (Chrome, Edge, Firefox, Safari).
3. Scroll. The HUD, station reveals, parallax, and motion choreography all run
   from inline JavaScript and CSS — purely client-side.

### If fonts look wrong

Some browsers refuse to load \`@font-face\` files from \`file://\` URLs for
security reasons. If the typography falls back to a system font, run a tiny
local server from this folder instead:

\`\`\`bash
# Option A — Python 3 (built into macOS/Linux, optional on Windows)
python -m http.server 8000

# Option B — Node.js (any version)
npx serve .

# Option C — VS Code "Live Server" extension
\`\`\`

Then open <http://localhost:8000> (or whichever port the tool prints).

## What's included

- \`index.html\` — the full landing page markup, scroll JS, motion runtime
- \`tokens.css\` — the Thoughtform design system tokens (colors, type, spacing)
- \`assets/logos/\` — brandmark + wordmark SVGs
- \`assets/vince-portrait.jpg\` — founder portrait used in the manifesto section
- \`images/Thoughtform_Key Visual_14d.webp\` — hero key visual still
- \`videos/thoughtform-key-visual-2-web.mp4\` + poster — hero motion key visual
- \`fonts/\` — PP Neue Montreal (4 weights) + PT Mono (regular & bold)

## What this is

This is the **canonical design source** for the live thoughtform.co homepage.
The production site (Next.js + React) parses this same HTML at build time and
adds React-driven choreography on top (the floating brandmark, parametric
celestial connectors, Three.js gateway). The standalone preview shows the full
scroll layout, HUD, station system, and motion as designed.
`;
writeFileSync(out("README.md"), readme, "utf8");
totalBytes += statSync(out("README.md")).size;

// ── 6. Report ──────────────────────────────────────────────────────────────
const mb = (totalBytes / 1024 / 1024).toFixed(2);
console.log(`✓ Staged dist/thoughtform-homepage/ — ${mb} MB across ${assetMap.length - missing.length + 3} files`);
console.log(`  → next: zip it and ship`);
