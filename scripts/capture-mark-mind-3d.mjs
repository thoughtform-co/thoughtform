/**
 * capture-mark-mind-3d — stills of /test/mark-mind-3d (WebGL, headless).
 *
 *   node scripts/capture-mark-mind-3d.mjs [--port 3031] [--t 6] [--sizes 1440x900]
 *     [--themes dark,light] [--out docs/design/mark-mind-3d/r1]
 *
 * Needs the dev server running. Writes <theme>_<w>x<h>.png.
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const arg = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const port = arg("--port", "3031");
const t = arg("--t", "6");
const sizes = arg("--sizes", "1440x900").split(",");
const themes = arg("--themes", "dark,light").split(",");
const out = path.resolve(arg("--out", "docs/design/mark-mind-3d/r1"));

await mkdir(out, { recursive: true });
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const size of sizes) {
  const [w, h] = size.split("x").map(Number);
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  for (const theme of themes) {
    await page.goto(`http://localhost:${port}/test/mark-mind-3d?still=1&t=${t}&theme=${theme}`, { waitUntil: "networkidle", timeout: 180000 });
    await page.waitForSelector("[data-mark-mind-3d][data-ready]", { timeout: 90000 });
    await page.waitForTimeout(1500);
    const name = `${theme}_${w}x${h}.png`;
    await page.screenshot({ path: path.join(out, name) });
    console.log("ok", name);
  }
  await page.close();
}
await browser.close();
