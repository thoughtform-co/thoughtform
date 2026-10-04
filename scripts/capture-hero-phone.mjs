/**
 * Shoot the hero on a phone (ADR-145), and measure what no guard can: the
 * copy's contrast against the plate actually painted under it, and WHICH
 * plates the page fetched.
 *
 * ⚠ THE CONTRAST IS THE FOOTER'S G3, COPIED (`capture-site-footer.mjs`): hide
 * the ink with `visibility`, shoot the bed, restore the ink, shoot again; a
 * pixel that differs between the two IS ink, and each role is measured at
 * exactly those pixels against its own computed colour. A bounding box is not
 * the ink, so a role is never judged by the background between its glyphs.
 *
 * ⚠ THE FETCH COUNT IS A FRESH CONTEXT EVERY RUN. The portrait plate exists so
 * a phone pays for ONE plate on the LCP path: the preload and the `<picture>`
 * must agree, so the count of hero plates requested is the reading, and on a
 * desktop viewport the portrait must never appear.
 *
 *   node scripts/capture-hero-phone.mjs --vp 390x844 --theme dark
 *   node scripts/capture-hero-phone.mjs --vp 360x780 --theme light
 *   node scripts/capture-hero-phone.mjs --vp 390x844 --route /arcs/thoughtform/workshop-v3
 *   node scripts/capture-hero-phone.mjs --vp 1440x900   # the desktop must not fetch the portrait
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const arg = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const [W, H] = arg("--vp", "390x844").split("x").map(Number);
const THEME = arg("--theme", "dark");
const PORT = arg("--port", "3003");
const ROUTE = arg("--route", "/");
const OUT = "shots";
mkdirSync(OUT, { recursive: true });
const tag = `${ROUTE === "/" ? "home" : ROUTE.replace(/\W+/g, "-").replace(/^-|-$/g, "")}-${W}x${H}-${THEME}`;

const browser = await chromium.launch();
const phone = W <= 640;
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  isMobile: phone,
  hasTouch: phone,
});
const page = await context.newPage();
const plates = [];
page.on("request", (r) => {
  const u = r.url();
  if (/\/images\/(ThoughtForm|Gateway)[^/]*\.(avif|webp)/.test(u)) plates.push(u.replace(/^.*\/images\//, ""));
});
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));

const sep = ROUTE.includes("?") ? "&" : "?";
await page.goto(`http://localhost:${PORT}${ROUTE}${sep}theme=${THEME}`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".hero .hero__headline", { timeout: 60_000 });
/* The boot types the headline and unfurls the paragraph; measure the settled
   state, never a frame of the scramble. */
await page.waitForTimeout(6500);

const read = await page.evaluate(() => {
  const hero = document.querySelector(".hero");
  const img = hero?.querySelector(".hero__bg img");
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  return {
    theme: document.documentElement.getAttribute("data-theme"),
    src: img ? img.currentSrc.replace(/^.*\/images\//, "") : null,
    pos: img ? getComputedStyle(img).objectPosition : null,
    justify: hero ? getComputedStyle(hero).justifyContent : null,
    content: box(hero?.querySelector(".hero__content")),
    flywheel: box(hero?.querySelector(".hero__flywheel--ipa")),
    preload: [...document.querySelectorAll('link[rel="preload"][as="image"]')].map((l) =>
      l.getAttribute("href")
    ),
  };
});
console.log(`=== ${ROUTE} ${W}x${H} ${THEME}`);
console.log(`  painted ${read.src}  object-position ${read.pos}  justify ${read.justify}`);
console.log(`  preload ${JSON.stringify(read.preload)}`);
console.log(`  plates fetched (${plates.length}): ${JSON.stringify([...new Set(plates)])}`);
console.log(`  content ${JSON.stringify(read.content)}  flywheel ${JSON.stringify(read.flywheel)}`);
if (errors.length) console.log(`  ⚠ page errors: ${JSON.stringify(errors.slice(0, 3))}`);

/* The FILLED primary button is self-contained (its label sits on its own gold
   fill, so the bed under it is not what its label is read against) and the
   glyph mask would count the whole fill as ink; the ghost button's label and
   border sit on the plate, so it is the CTA this measures. */
const SEL = [".hero__headline", ".hero__desc", ".hero__cta__btn--ghost", ".hero__flywheel--ipa"];
const targets = await page.evaluate((sels) => {
  const out = [];
  for (const sel of sels) {
    for (const el of document.querySelectorAll(`.hero ${sel}`)) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) continue;
      out.push({ sel, color: getComputedStyle(el).color, rect: { x: r.x, y: r.y, w: r.width, h: r.height } });
    }
  }
  return out;
}, SEL);
const hideInk = (v) =>
  page.evaluate((vis) => {
    document.querySelectorAll(".hero .hero__content, .hero .hero__flywheel").forEach((n) => {
      n.style.visibility = vis;
    });
  }, v);
const clip = { x: 0, y: 0, width: W, height: H };
await hideInk("hidden");
const bed = (await page.screenshot({ clip })).toString("base64");
await page.screenshot({ path: `${OUT}/hero-phone-${tag}-bed.png` });
await hideInk("");
const ink = (await page.screenshot({ clip })).toString("base64");

const rows = await page.evaluate(
  async ({ bed, ink, targets }) => {
    const load = async (b64) => {
      const im = new Image();
      im.src = `data:image/png;base64,${b64}`;
      await im.decode();
      return im;
    };
    const [a, b] = [await load(bed), await load(ink)];
    const ca = new OffscreenCanvas(a.naturalWidth, a.naturalHeight);
    ca.getContext("2d").drawImage(a, 0, 0);
    const cb = new OffscreenCanvas(b.naturalWidth, b.naturalHeight);
    cb.getContext("2d").drawImage(b, 0, 0);
    const lin = (v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const lum = (r, g, bl) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl);
    const ratio = (x, y) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    const out = [];
    for (const t of targets) {
      const x0 = Math.max(0, Math.floor(t.rect.x));
      const y0 = Math.max(0, Math.floor(t.rect.y));
      const w = Math.min(a.naturalWidth - x0, Math.max(1, Math.floor(t.rect.w)));
      const h = Math.min(a.naturalHeight - y0, Math.max(1, Math.floor(t.rect.h)));
      if (w < 1 || h < 1) continue;
      const da = ca.getContext("2d").getImageData(x0, y0, w, h).data;
      const db = cb.getContext("2d").getImageData(x0, y0, w, h).data;
      const m = t.color.match(/[\d.]+/g).map(Number);
      const inkL = lum(m[0], m[1], m[2]);
      let worst = Infinity;
      let sum = 0;
      let n = 0;
      for (let i = 0; i < da.length; i += 4) {
        const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
        if (d < 24) continue;
        const r = ratio(inkL, lum(da[i], da[i + 1], da[i + 2]));
        worst = Math.min(worst, r);
        sum += r;
        n++;
      }
      if (n) out.push({ sel: t.sel, min: Math.round(worst * 100) / 100, mean: Math.round((sum / n) * 100) / 100, px: n });
    }
    return out;
  },
  { bed, ink, targets }
);
const worst = new Map();
for (const r of rows) {
  const c = worst.get(r.sel);
  if (!c || r.min < c.min) worst.set(r.sel, r);
}
let fails = 0;
console.log("  ink contrast — masked to the glyphs, min vs the composited plate (4.5 floor):");
for (const [sel, r] of worst) {
  const ok = r.min >= 4.5;
  if (!ok) fails++;
  console.log(`    ${ok ? "ok  " : "FAIL"} ${sel.padEnd(22)} min ${r.min}  mean ${r.mean}  ink px ${r.px}`);
}
console.log(`  G3 ${fails === 0 ? "pass" : `FAIL on ${fails}`}`);
/* Both themes paint a portrait on the phone since the obsidian light plate
   (ADR-145), so the check is per theme: a phone fetches THIS theme's portrait
   alone, a desktop never fetches a portrait at all. */
const portraitFetched = plates.some((p) => p.includes("portrait"));
const want = THEME === "light" ? "ThoughtForm_v1-portrait-light.webp" : "ThoughtForm_v1b-portrait.avif";
const onlyWanted = plates.length > 0 && plates.every((p) => p === want);
console.log(
  `  fetch check: portrait ${portraitFetched ? "yes" : "no"}  ` +
    (phone
      ? onlyWanted ? `OK (one plate, ${want})` : `⚠ expected ${want} alone`
      : !portraitFetched ? "OK (no portrait)" : "⚠ portrait fetched off its rung")
);
await page.screenshot({ path: `${OUT}/hero-phone-${tag}.png` });
console.log(`  shot -> ${OUT}/hero-phone-${tag}.png`);
await browser.close();
