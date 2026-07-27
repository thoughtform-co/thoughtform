/**
 * capture-dossier-mark — grabs a still of the parked brandmark for the
 * `/test/proof-dossier-lab` bed.
 *
 * WHY A STILL. The dossier floats over the corridor's parked centerpiece
 * behind `backdrop-filter: blur(12px)`, which erases particle micro-motion
 * outright — a live canvas in the lab would cost a WebGL context, a
 * frameloop and headless flakiness to look identical through the glass. It
 * would also be the wrong rehearsal: the shipped surface keeps `three` off
 * the landing DOM path (landing-performance doctrine), so the still is what
 * the promoted lab bed would use anyway. Production draws the real thing —
 * the dossier simply floats over whatever the corridor already rendered.
 *
 * SUBJECT. The mark WITHOUT the sphere shell: at the services park the
 * substrate sphere is long gone and the wireframe mark is the centerpiece,
 * so `Show sphere` is unchecked here (the one difference from
 * `capture-proof-sphere.mjs`, which wants the shell).
 *
 * HEADED ON PURPOSE. The source route is WebGL; a headless context leaves
 * the canvas dead, and rAF throttles to a standstill in hidden documents.
 *
 * Usage (dev server must already be running):
 *   node scripts/capture-dossier-mark.mjs [--port 3003]
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
const OUT = "public/dossier-lab/mark-still.webp";
/** Deploy-weight ceiling — the still is lab-only, but keep it honest. */
const MAX_BYTES = 200 * 1024;

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

  // Subject: the mark, on black, with no sphere shell around it.
  await page.getByRole("radio", { name: "Physics core (GPGPU, current production)" }).check();
  await page.getByRole("radio", { name: "Pure black" }).check();
  const sphere = page.getByRole("checkbox", { name: "Show sphere" });
  if (await sphere.isChecked()) await sphere.uncheck();

  // Freeze the gimbal: a spinning subject makes every re-capture a different
  // image, and the shipped still must be reproducible.
  const idle = page.getByRole("slider", { name: "Idle spin speed" });
  await idle.fill("0");
  await idle.dispatchEvent("change");

  // Widen the lens so the mark sits inside the crop with margin rather than
  // clipping against its edges.
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
  console.log(`captured ${OUT} — ${kb} kB`);
} finally {
  await browser.close();
}
