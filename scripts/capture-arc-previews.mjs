#!/usr/bin/env node
/**
 * capture-arc-previews — every engagement's first screen, for the arcs
 * overview's dossier (ADR-118).
 *
 * Six of the nine engagements shared one card photograph, so the dossier —
 * the log's one picture — showed the same room for most of the record. A
 * PREVIEW is the page the reader is about to open, which is the one picture
 * that can only belong to it.
 *
 *     node scripts/capture-arc-previews.mjs [--base http://localhost:3003] [--only id,id]
 *
 * ⚠ IT READS THE LIST OFF THE PAGE, NEVER THE REGISTRY. The engagements are
 * the rows `/arcs` renders (`.sh-log__row`: `data-id` + `href`), so a script
 * cannot shoot a list the page does not draw, and needs no TypeScript loader.
 * `/arcs` is the owner's page (ADR-117): open under `next dev`; against a
 * production server pass the pass through `OWNER_PASS_COOKIE` (`tf_owner=…`),
 * which is read from the environment and never printed.
 *
 * Writes `public/arcs/previews/<id>.webp` (1280 × 800) and
 * `lib/arcs/previews.json`, the sizes READ OFF THE WRITTEN FILES — a declared
 * size is never typed (the sheet's own rule, ADR-114).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argOf = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const BASE = argOf("--base", process.env.BASE_URL || "http://localhost:3003");
const ONLY = (argOf("--only", "") || "").split(",").filter(Boolean);
const OUT_DIR = path.join(ROOT, "public", "arcs", "previews");
const MANIFEST = path.join(ROOT, "lib", "arcs", "previews.json");
/** The shot: a 16:10 laptop frame, stored at the dossier's own scale. */
const SHOT = { width: 1440, height: 900 };
const STORED = { width: 1280, height: 800 };

const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: SHOT, deviceScaleFactor: 1 });
  const pass = process.env.OWNER_PASS_COOKIE;
  if (pass) {
    const [name, ...rest] = pass.split("=");
    await ctx.addCookies([{ name, value: rest.join("="), url: `${BASE}/arcs` }]);
  }
  /* ⚠ A PUBLIC FILE IS SERVED FROM DISK. A local `next start` on Windows
     answers 404 for `/logos/Thoughtform_Wordmark_Lockup-Vertical (Dual).svg`
     (the encoded parentheses), while `next dev` and the live site serve it —
     so a preview shot off a local build showed a broken wordmark. Anything
     that exists under `public/` is the same bytes either way. */
  const publicDir = path.join(ROOT, "public");
  const origin = new URL(BASE).origin;
  await ctx.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === origin && !url.pathname.startsWith("/_next/")) {
      const file = path.join(publicDir, decodeURIComponent(url.pathname));
      if (file.startsWith(publicDir) && fs.existsSync(file) && fs.statSync(file).isFile())
        return route.fulfill({ path: file });
    }
    return route.continue();
  });
  const page = await ctx.newPage();

  const res = await page.goto(`${BASE}/arcs`, { waitUntil: "domcontentloaded" });
  if (!res || res.status() !== 200)
    throw new Error(`/arcs answered ${res?.status()} — under production, set OWNER_PASS_COOKIE`);
  await page.locator(".sh-log__row").first().waitFor({ timeout: 60_000 });
  const rows = await page.$$eval(".sh-log__row", (els) =>
    els.map((el) => ({ id: el.getAttribute("data-id"), href: el.getAttribute("href") }))
  );
  const todo = rows.filter((r) => r.id && r.href && (!ONLY.length || ONLY.includes(r.id)));
  if (!todo.length) throw new Error("no engagement rows to shoot");

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : {};
  for (const { id, href } of todo) {
    const r = await page.goto(`${BASE}${href}`, { waitUntil: "networkidle", timeout: 120_000 });
    if (!r || r.status() !== 200) throw new Error(`${href} answered ${r?.status()}`);
    await page.evaluate(() => document.fonts.ready);
    // The hero boots (a decode, a plate glitch): give it time to land, then shoot.
    await page.waitForTimeout(2600);
    const png = await page.screenshot({ type: "png" });
    const file = path.join(OUT_DIR, `${id}.webp`);
    await sharp(png).resize(STORED.width, STORED.height).webp({ quality: 80 }).toFile(file);
    const meta = await sharp(file).metadata();
    manifest[id] = { src: `/arcs/previews/${id}.webp`, width: meta.width, height: meta.height };
    console.log(
      `  ${id.padEnd(26)} ${href.padEnd(32)} ${meta.width}x${meta.height}  ${fs.statSync(file).size} B`
    );
  }
  const sorted = Object.fromEntries(
    Object.keys(manifest)
      .sort()
      .map((k) => [k, manifest[k]])
  );
  fs.writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`  wrote ${path.relative(ROOT, MANIFEST)} (${Object.keys(sorted).length} previews)`);
} finally {
  await browser.close();
}
