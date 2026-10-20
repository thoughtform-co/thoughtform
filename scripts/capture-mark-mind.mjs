/**
 * capture-mark-mind — stills of /test/mark-mind for reading by eye.
 *
 *   node scripts/capture-mark-mind.mjs [--port 3031] [--t 0] [--sizes 1440x820,1920x1247]
 *     [--themes dark,light] [--floors section,terrace] [--el 50] [--out docs/design/mark-mind/p1]
 *     [--clip x,y,w,h]   a close-up, CSS px, at 2× device scale
 *
 * Needs the dev server running. Writes <floors>_<theme>_<w>x<h>.png.
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
const t = arg("--t", "0");
const sizes = arg("--sizes", "1440x820,1920x1247").split(",");
const themes = arg("--themes", "dark,light").split(",");
const floors = arg("--floors", "section,terrace").split(",");
const el = arg("--el", "38");
const part = arg("--part", "0");
const detail = arg("--detail", "1");
const out = path.resolve(arg("--out", "docs/design/mark-mind/p1"));
const clipArg = arg("--clip", null);

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
for (const size of sizes) {
  const [w, h] = size.split("x").map(Number);
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: clipArg ? 2 : 1 });
  for (const f of floors) {
    for (const theme of themes) {
      const url = `http://localhost:${port}/test/mark-mind?still=1&t=${t}&floors=${f}&theme=${theme}&el=${el}&part=${part}&detail=${detail}`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 180000 });
      await page.waitForSelector("[data-mark-mind][data-ready]", { timeout: 60000 });
      await page.waitForTimeout(400);
      const name = `${f}_${theme}_${w}x${h}${clipArg ? "_clip" : ""}.png`;
      const clip = clipArg ? (([x, y, cw, ch]) => ({ x, y, width: cw, height: ch }))(clipArg.split(",").map(Number)) : undefined;
      await page.screenshot({ path: path.join(out, name), clip });
      console.log("ok", name);
    }
  }
  await page.close();
}
await browser.close();
