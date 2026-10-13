/**
 * capture-proposal-travel — the stack across three sections, shot by real
 * scroll at fixed stops: section 1 at rest, the arrival into Navigate,
 * Encode, Build, its close, and the hand-over to "Marketing first".
 *
 * Two pages, the same stops:
 *   --page travel       /test/proposal-travel   (the copy: the stack travels)
 *   --page production   /arcs/x-bionic/proposal (the proposal as sent)
 *
 * and a pixel diff of two shoots, which is how "the sent page did not
 * change" is checked after an edit to a file it shares:
 *   --diff <dirA> <dirB>
 *
 * Usage (dev server already running):
 *   node scripts/capture-proposal-travel.mjs --port 3019 --page travel
 *     [--sizes 1280x720,1470x830,1920x1247] [--themes dark,light]
 *     [--out docs/design/proposal-kit/round-02/travel] [--only arrive-50,pin]
 *     [--hero index]   the opening's other figure (the copy only)
 */

import { chromium } from "@playwright/test";
import { mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

/* ---- the diff ---------------------------------------------------------- */

const di = args.indexOf("--diff");
if (di >= 0) {
  const [a, b] = [args[di + 1], args[di + 2]];
  const files = (await readdir(a)).filter((f) => f.endsWith(".png")).sort();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let bad = 0;
  for (const f of files) {
    const [pa, pb] = await Promise.all([
      readFile(path.join(a, f)),
      readFile(path.join(b, f)).catch(() => null),
    ]);
    if (!pb) {
      bad++;
      console.log(`✗ ${f}: missing in ${b}`);
      continue;
    }
    if (pa.equals(pb)) {
      console.log(`✓ ${f}: identical`);
      continue;
    }
    // not byte-equal: count the pixels that differ
    const n = await page.evaluate(
      async ([x, y]) => {
        const load = (src) =>
          new Promise((res) => {
            const im = new Image();
            im.onload = () => res(im);
            im.src = src;
          });
        const [ia, ib] = await Promise.all([load(x), load(y)]);
        if (ia.width !== ib.width || ia.height !== ib.height) return -1;
        const px = (im) => {
          const c = new OffscreenCanvas(im.width, im.height).getContext("2d");
          c.drawImage(im, 0, 0);
          return c.getImageData(0, 0, im.width, im.height).data;
        };
        const [da, db] = [px(ia), px(ib)];
        let d = 0;
        for (let i = 0; i < da.length; i += 4)
          if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2]) d++;
        return d;
      },
      [pa, pb].map((p) => `data:image/png;base64,${p.toString("base64")}`)
    );
    if (n === 0) console.log(`✓ ${f}: identical pixels`);
    else {
      bad++;
      console.log(`✗ ${f}: ${n < 0 ? "different size" : `${n} pixels differ`}`);
    }
  }
  await browser.close();
  console.log(bad ? `\n${bad} still(s) differ.` : `\nAll ${files.length} stills identical.`);
  process.exit(bad ? 1 : 0);
}

/* ---- the shoot --------------------------------------------------------- */

const PORT = argOf("--port", "3019");
const PAGE = argOf("--page", "travel");
const OUT = argOf("--out", `docs/design/proposal-kit/round-02/${PAGE}`);
const ONLY = argOf("--only", "").split(",").filter(Boolean);
const SIZES = argOf("--sizes", "1280x720,1470x830,1920x1247")
  .split(",")
  .map((s) => s.split("x").map(Number));
const THEMES = argOf("--themes", "dark,light").split(",");
const HERO = argOf("--hero", "");
const URL =
  PAGE === "production"
    ? `http://localhost:${PORT}/arcs/x-bionic/proposal`
    : `http://localhost:${PORT}/test/proposal-travel${HERO ? `?hero=${HERO}` : ""}`;

/* Each stop is [name, section, t]: for `arrive`, t is q (0 when the runway's
   top is at the screen's bottom, 1 when it pins); for a pinned section, t is
   its progress through the pin. */
const STOPS = [
  ["s1", "vision", 0],
  ["arrive-25", "es-arrive", 0.25],
  ["arrive-50", "es-arrive", 0.5],
  ["arrive-75", "es-arrive", 0.75],
  ["pin", "es", 0],
  ["steps-25", "es", 0.25],
  ["steps-50", "es", 0.5],
  ["steps-78", "es", 0.78],
  ["steps-100", "es", 1],
  ["net-arrive", "xn-arrive", 0.5],
  ["net-00", "xn", 0],
  ["net-20", "xn", 0.2],
  ["net-35", "xn", 0.35],
  ["net-45", "xn", 0.45],
  ["net-50", "xn", 0.5],
  ["net-60", "xn", 0.6],
  ["net-80", "xn", 0.8],
  ["net-100", "xn", 1],
].filter(([name]) => !ONLY.length || ONLY.includes(name));

function scrollTarget([, section, t]) {
  const vh = window.innerHeight;
  const top = (el) => el.getBoundingClientRect().top + window.scrollY;
  const q = (sel) => document.querySelector(sel);
  if (section === "vision") return top(q("#vision"));
  const el = q(section.startsWith("es") ? ".es-runway" : ".xn");
  if (!el) return null;
  if (section.endsWith("-arrive")) return top(el) - vh * (1 - t);
  return top(el) + t * (el.getBoundingClientRect().height - vh);
}

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });
for (const theme of THEMES) {
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
    });
    await ctx.addInitScript((t) => {
      try {
        if (t === "light") localStorage.setItem("tf-theme", "light");
        else localStorage.removeItem("tf-theme");
      } catch {}
    }, theme);
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: "load" });
    await page.waitForSelector(".es-runway", { timeout: 240000 });
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        "nextjs-portal{display:none!important} html{scroll-behavior:auto!important} *,*::before,*::after{transition:none!important;animation:none!important}",
    });
    for (const stop of STOPS) {
      const y = await page.evaluate(scrollTarget, stop);
      if (y == null) {
        console.log(`– ${stop[0]}: no section`);
        continue;
      }
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      // the readers are rAF-throttled, and one of them re-renders through React
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      );
      // long enough for the corner readout to finish decoding the section's name
      await page.waitForTimeout(900);
      const suffix = `${w}x${h}${theme === "light" ? "-light" : ""}`;
      await page.screenshot({ path: path.join(OUT, `${stop[0]}-${suffix}.png`) });
      console.log(`· ${stop[0]} ${suffix}`);
    }
    await ctx.close();
  }
}
await browser.close();
