/**
 * capture-proof-sphere — grabs a still of the Arc substrate sphere for the
 * `/test/proof-highlight-lab` directions.
 *
 * WHY A STILL. The lab's four directions all want the corridor artefact as a
 * Loop-applied subject, but a LIVE canvas inside `#proof` would breach three
 * separate contracts at once: ADR-054 (no canvas coupling, no portal on that
 * station), the landing-performance rule that keeps `three` out of the landing
 * DOM path, and ADR-021's no-rotation-behind-readable-copy. A captured image
 * costs the station nothing. The lab keeps a LIVE toggle so the trade can still
 * be judged, but this is what promotion would ship.
 *
 * HEADED ON PURPOSE. The source route is scroll-driven WebGL; a headless
 * context leaves the canvas dead, and rAF throttles to a standstill in hidden
 * documents.
 *
 * Usage (dev server must already be running):
 *   node scripts/capture-proof-sphere.mjs [--port 3003] [--system none|physics-core]
 */

import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { dirname } from "node:path";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
/** "none" = sphere only (the schematic subject); "physics-core" = mark inside. */
const SYSTEM = argOf("--system", "none");
const OUT = "public/proof-lab/sphere-still.webp";
/** Deploy-weight ceiling — the still is lab-only, but keep it honest. */
const MAX_BYTES = 200 * 1024;

const SYSTEM_LABEL = {
  none: "Hidden — sphere only",
  "physics-core": "Physics core (GPGPU, current production)",
}[SYSTEM];
if (!SYSTEM_LABEL) throw new Error(`unknown --system ${SYSTEM}`);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({
  headless: false,
  args: ["--enable-gpu", "--use-gl=angle", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({
  viewport: { width: 2200, height: 1240 },
  deviceScaleFactor: 2,
});

try {
  await page.goto(`http://localhost:${PORT}/test/brandmark-in-sphere`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("canvas", { timeout: 40_000 });
  await wait(2500);

  // Subject + backdrop.
  await page.getByRole("radio", { name: SYSTEM_LABEL }).check();
  await page.getByRole("radio", { name: "Pure black" }).check();

  // Freeze the gimbal: a spinning sphere makes every re-capture a different
  // image, and the shipped still must be reproducible.
  const idle = page.getByRole("slider", { name: "Idle spin speed" });
  await idle.fill("0");
  await idle.dispatchEvent("change");

  // Widen the lens so the globe sits INSIDE the crop with margin. At the lab's
  // default the sphere fills ~89% of viewport height and its poles clip against
  // a square crop — which reads as a mistake rather than a framing.
  const fov = page.getByRole("slider", { name: "Camera FOV" });
  await fov.fill("46");
  await fov.dispatchEvent("change");

  await wait(3000);

  // Centred square crop. The control panel is fixed at right:24 with a 360px
  // width, so at 2200 CSS px it starts at x≈1816 and stays clear of this box.
  const size = 1100;
  const clip = { x: (2200 - size) / 2, y: (1240 - size) / 2, width: size, height: size };
  const raw = await page.screenshot({ clip });

  await mkdir(dirname(OUT), { recursive: true });
  await sharp(raw).resize(900, 900).webp({ quality: 80 }).toFile(OUT);

  const { size: bytes } = await stat(OUT);
  const kb = Math.round(bytes / 1024);
  if (bytes > MAX_BYTES) {
    throw new Error(`${OUT} is ${kb} kB — over the ${MAX_BYTES / 1024} kB budget`);
  }
  console.log(`captured ${OUT} — ${kb} kB (system: ${SYSTEM})`);
} finally {
  await browser.close();
}
