/**
 * Capture docs/design/offer-one-pager.html at 1280x720, both slide variants
 * (default parchment + Suri client skin). Loaded via file:// so no dev
 * server needed; the template is a standalone HTML artifact with the deck
 * shell + Avantt base64 fonts inlined.
 *
 * ⚠ The sandbox sets PLAYWRIGHT_BROWSERS_PATH at an empty cache. If Chromium
 * fails to launch, override for this run only:
 *
 *   $env:PLAYWRIGHT_BROWSERS_PATH = "$env:USERPROFILE\AppData\Local\ms-playwright"
 *   node scripts/capture-offer-one-pager.mjs
 *
 * Writes to docs/design/_shots/ (gitignore this folder if you don't want the
 * shots tracked).
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const src = resolve("docs/design/offer-one-pager.html");
const outDir = resolve("docs/design/_shots");
mkdirSync(outDir, { recursive: true });

const url = pathToFileURL(src).href;
console.log("loading:", url);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();
await page.goto(url, { waitUntil: "load" });

// wait for Avantt base64 fonts to be ready — they're inlined so this is fast,
// but the browser still needs a beat to parse and apply them.
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(150);

const sections = await page.$$("section.slide");
console.log("sections found:", sections.length);

for (let i = 0; i < sections.length; i++) {
  const el = sections[i];
  const id = await el.evaluate((n) => n.id || `slide-${Math.random().toString(36).slice(2)}`);
  const file = join(outDir, `${String(i + 1).padStart(2, "0")}-${id}.png`);
  await el.screenshot({ path: file });
  console.log("wrote:", file);
}

await browser.close();
