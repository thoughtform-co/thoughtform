/**
 * Shoot the site footer (ADR-105), and measure what no guard can.
 *
 * ⚠ **HEADED, AND A REAL SCROLL.** The footer is the last station under a
 * scroll-driven WebGL corridor: a headless context leaves the canvas dead and
 * a teleport skips the engagement band, so the corridor's exit attributes —
 * which decide whether this station is painting as the ambient's opaque COVER
 * — never publish.
 *
 * ⚠ **U1: THE PLATE IS THE STATION BOX.** It was a 46svh strip anchored to the
 * floor; it is the station's whole ground now, so `plateIsStation` is the
 * reading that says the negated-padding geometry still holds on this rung.
 *
 * ⚠ **NOTHING MECHANICAL MEASURES CONTRAST OVER AN IMAGE.** `theme-css-sweep`
 * checks selector laws, `type-material-tokens` counts literals, and the
 * mechanical gate composites against a background COLOUR. The legal bar and
 * the HUD's own fixed corners sit on a photograph here, so this one is
 * CAPTURED, not gated: read the stills.
 *
 *   node scripts/capture-site-footer.mjs --vp 1920x1247 --theme dark
 *   node scripts/capture-site-footer.mjs --vp 1440x900  --theme light
 *   node scripts/capture-site-footer.mjs --vp 390x844   --theme dark
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const arg = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const [W, H] = arg("--vp", "1440x900").split("x").map(Number);
const THEME = arg("--theme", "dark");
const PORT = arg("--port", "3003");
const OUT = "shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));

await page.goto(`http://localhost:${PORT}/?theme=${THEME}`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".ft-foot", { timeout: 30_000 });

/* Walk down in real steps so the corridor's clocks run. A single scrollTo to
   the document's end leaves `data-corridor-exit` unpublished and the station
   measured in a state no reader ever sees. */
for (let i = 0; i < 60; i += 1) {
  const done = await page.evaluate(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return window.scrollY >= max - 2;
  });
  if (done) break;
  await page.mouse.wheel(0, Math.round(H * 0.9));
  await page.waitForTimeout(90);
}
await page.waitForTimeout(1200);

const read = await page.evaluate(() => {
  const px = (v) => Math.round(v);
  const st = document.getElementById("contact");
  const foot = document.querySelector(".ft-foot");
  const band = document.querySelector(".ft-foot__band");
  const plate = document.querySelector(".ft-foot__plate");
  const bar = document.querySelector(".ft-foot__bar");
  const title = document.querySelector(".ft-foot__title");
  const dark = document.querySelector(".ft-foot__plate-img--dark");
  const light = document.querySelector(".ft-foot__plate-img--light");
  const heroImg = document.querySelector(".hero__bg img");
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: px(r.left), y: px(r.top), w: px(r.width), h: px(r.height) };
  };
  /* The HUD's fixed corners print over whatever is under them (ADR-043), so
     their boxes against the plate's are the collision worth reporting. */
  const chrome = [...document.querySelectorAll(".hud__brand, .rin-settings, .hud__corner--br")]
    .map((el) => ({ cls: el.className.toString().slice(0, 34), ...box(el) }))
    .filter((c) => c.w > 0);
  return {
    ambient: document.documentElement.hasAttribute("data-services-ambient"),
    exit: document.documentElement.hasAttribute("data-corridor-exit"),
    stationGround: cs(st)?.backgroundColor ?? null,
    stationImage: (cs(st)?.backgroundImage ?? "none").slice(0, 28),
    stationZ: cs(st)?.zIndex ?? null,
    contentVisibility: cs(st)?.contentVisibility ?? null,
    foot: box(foot),
    band: box(band),
    plate: box(plate),
    station: box(st),
    /* ⚠ THE PLATE'S BOX MUST BE THE STATION'S. Its insets negate the
       station's own padding tokens, so a padding change on one side only
       shows up here as a few pixels of drift — not as anything visible. */
    plateIsStation: (() => {
      if (!plate || !st) return null;
      const a = plate.getBoundingClientRect();
      const b = st.getBoundingClientRect();
      return (
        Math.abs(a.left - b.left) <= 1 &&
        Math.abs(a.top - b.top) <= 1 &&
        Math.abs(a.right - b.right) <= 1 &&
        Math.abs(a.bottom - b.bottom) <= 1
      );
    })(),
    /* In dark this must EQUAL the hero's own `currentSrc` — same file, same
       AVIF/WebP pick, so the footer's plate costs nothing. And the hidden
       theme's img must report `""`: a `display: none` + lazy image is never
       fetched, which is the whole reason the swap is two elements. */
    plateSrc: (dark?.currentSrc || "").split("/").pop() || "",
    lightSrc: (light?.currentSrc || "").split("/").pop() || "",
    heroSrc: (heroImg?.currentSrc || "").split("/").pop() || "",
    bar: box(bar),
    titlePx: cs(title)?.fontSize ?? null,
    /* The band must land on the SAME left edge as the rest of the page's
       editorial column — `--hud-content-inset` + `--rail-inset`. Below the
       1200px crossover `--rail-inset` is 0, so a divergence only shows on a
       wide window (ADR-099 U1). */
    bandLeft: band ? px(band.getBoundingClientRect().left) : null,
    railInset: getComputedStyle(document.documentElement).getPropertyValue("--rail-inset").trim(),
    /* ⚠ THE SELECTOR IS `[data-social]`, NOT `.ft-foot__socials a` — the icon
       row is deleted (ADR-105 U2) and LinkedIn / X are named rows in the
       Connect column. A count that still walked the old class would read 0
       forever and report it as correct. */
    socials: document.querySelectorAll(".ft-foot [data-social]").length,
    links: document.querySelectorAll(".ft-foot a[href]").length,
    /* Widened past `href="#"`: an empty href and a missing one are both dead
       and both render as a perfectly good link. */
    deadLinks: [
      ...document.querySelectorAll(
        '.ft-foot a[href="#"], .ft-foot a[href=""], .ft-foot a:not([href])'
      ),
    ].length,
    chrome,
  };
});

const tag = `${W}x${H}-${THEME}`;
console.log(`\n── the footer @ ${tag} ────────────────────────────────`);
console.log(`  ambient ${read.ambient}   corridor-exit ${read.exit}`);
console.log(
  `  station  ground ${read.stationGround}  image ${read.stationImage}  z ${read.stationZ}  cv ${read.contentVisibility}`
);
console.log(`  foot  ${JSON.stringify(read.foot)}`);
console.log(
  `  band  ${JSON.stringify(read.band)}   left ${read.bandLeft}  (--rail-inset ${read.railInset})`
);
console.log(`  plate ${JSON.stringify(read.plate)}   == station ${read.plateIsStation}`);
console.log(`  stn   ${JSON.stringify(read.station)}`);
console.log(`  src   dark "${read.plateSrc}"  light "${read.lightSrc}"  hero "${read.heroSrc}"`);
console.log(`  bar   ${JSON.stringify(read.bar)}   title ${read.titlePx}`);
console.log(`  socials ${read.socials}   links ${read.links}   dead links ${read.deadLinks}`);
for (const c of read.chrome)
  console.log(`  chrome  ${c.cls}  ${JSON.stringify({ x: c.x, y: c.y, w: c.w, h: c.h })}`);
if (errors.length) console.log(`  ⚠ page errors: ${JSON.stringify(errors.slice(0, 3))}`);

/* ── G3 · the ink's contrast against what is actually painted under it ──
   ⚠ THIS IS THE READING U1 MADE BY EYE AND ANSWERED BY DELETING A COLUMN.
   The band carries a link grid now, so "does the gold mono land on near-white"
   has to be a number. The method composites exactly what ships: hide the ink
   with `visibility` (which keeps layout), screenshot the band's own rect so
   the plate arrives WITH its scrim and the station's ground already composited,
   read it back through an OffscreenCanvas, and measure each text rect's
   darkest underlying pixel against that element's own computed colour.
   ⚠ `visibility`, never `display` — a `display: none` band measures ZERO and
   the clip would be taken from the wrong box. */
const SEL = [
  ".ft-foot__title",
  ".ft-foot__lede",
  ".ft-foot__cta",
  ".ft-foot__mail",
  ".ft-foot__wordmark",
  ".ft-foot__tagline",
  ".ft-foot__col-head",
  ".ft-foot__link",
  ".ft-foot__mark",
];

const inkTargets = await page.evaluate((sels) => {
  const out = [];
  for (const sel of sels) {
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      out.push({
        sel,
        color: getComputedStyle(el).color,
        rect: { x: r.x, y: r.y, w: r.width, h: r.height },
      });
    }
  }
  document.querySelectorAll(".ft-foot__band, .ft-foot__crest, .ft-foot__bar").forEach((n) => {
    n.style.visibility = "hidden";
  });
  return out;
}, SEL);

const union = inkTargets.reduce(
  (a, t) => ({
    x0: Math.min(a.x0, t.rect.x),
    y0: Math.min(a.y0, t.rect.y),
    x1: Math.max(a.x1, t.rect.x + t.rect.w),
    y1: Math.max(a.y1, t.rect.y + t.rect.h),
  }),
  { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }
);
const clip = {
  x: Math.max(0, Math.floor(union.x0)),
  y: Math.max(0, Math.floor(union.y0)),
  width: Math.min(W, Math.ceil(union.x1 - union.x0)),
  height: Math.min(H, Math.ceil(union.y1 - union.y0)),
};
/* ⚠ TWO SHOTS, BECAUSE A BOUNDING BOX IS NOT THE INK. The first cut gated on
   the darkest pixel anywhere in each text rect and reported `.ft-foot__link` at
   1.36:1 in light, on a footer that reads perfectly — because a 44px row's box
   is mostly background and the light plate's line-art landscape runs through it
   where no glyph does. That is this house's own recurring finding (a guard
   measuring a MODEL of the drawing rather than the drawing), and the fix is not
   a looser number: it is to mask to the pixels the glyphs actually cover.
   Shot A is the bed alone, shot B the same clip with the ink restored; a pixel
   that differs between them IS ink, and the bed is read at exactly those. */
const bedPng = (await page.screenshot({ clip })).toString("base64");
await page.evaluate(() => {
  document.querySelectorAll(".ft-foot__band, .ft-foot__crest, .ft-foot__bar").forEach((n) => {
    n.style.visibility = "";
  });
});
const inkPng = (await page.screenshot({ clip })).toString("base64");

const inkContrast = await page.evaluate(
  async ({ png, inkPngB64, clip, targets }) => {
    const load = async (b64) => {
      const im = new Image();
      im.src = `data:image/png;base64,${b64}`;
      await im.decode();
      return im;
    };
    const img = await load(png);
    const imgInk = await load(inkPngB64);
    const c = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const c2 = new OffscreenCanvas(img.naturalWidth, img.naturalHeight);
    const ctx2 = c2.getContext("2d");
    ctx2.drawImage(imgInk, 0, 0);
    const sx = img.naturalWidth / clip.width;
    const sy = img.naturalHeight / clip.height;
    const lin = (v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const inkOf = (css) => {
      const m = css.match(/[\d.]+/g).map(Number);
      return lum(m[0], m[1], m[2]);
    };
    const rows = [];
    for (const t of targets) {
      const x0 = Math.max(0, Math.floor((t.rect.x - clip.x) * sx));
      const y0 = Math.max(0, Math.floor((t.rect.y - clip.y) * sy));
      const w = Math.max(1, Math.floor(t.rect.w * sx));
      const h = Math.max(1, Math.floor(t.rect.h * sy));
      if (x0 + w > img.naturalWidth || y0 + h > img.naturalHeight) continue;
      const { data } = ctx.getImageData(x0, y0, w, h);
      const inkData = ctx2.getImageData(x0, y0, w, h).data;
      const ink = inkOf(t.color);
      let worst = Infinity;
      let sum = 0;
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        /* The glyph mask: this pixel changed when the ink came back. The
           threshold keeps antialiasing and sub-pixel jitter out. */
        const d =
          Math.abs(data[i] - inkData[i]) +
          Math.abs(data[i + 1] - inkData[i + 1]) +
          Math.abs(data[i + 2] - inkData[i + 2]);
        if (d < 24) continue;
        const r = ratio(ink, lum(data[i], data[i + 1], data[i + 2]));
        worst = Math.min(worst, r);
        sum += r;
        n++;
      }
      if (!n) continue; // nothing painted under this rect
      rows.push({
        sel: t.sel,
        min: Math.round(worst * 100) / 100,
        mean: Math.round((sum / n) * 100) / 100,
        px: n,
      });
    }
    return rows;
  },
  { png: bedPng, inkPngB64: inkPng, clip, targets: inkTargets }
);

const worstBySel = new Map();
for (const r of inkContrast) {
  const cur = worstBySel.get(r.sel);
  if (!cur || r.min < cur.min) worstBySel.set(r.sel, r);
}
console.log("  ink contrast — masked to the glyphs, min vs the composited plate (4.5 floor):");
let inkFails = 0;
for (const [sel, r] of worstBySel) {
  const ok = r.min >= 4.5;
  if (!ok) inkFails++;
  console.log(
    `    ${ok ? "ok  " : "FAIL"} ${sel.padEnd(22)} min ${r.min}  mean ${r.mean}  ink px ${r.px}`
  );
}
console.log(`  G3 ${inkFails === 0 ? "pass" : `FAIL on ${inkFails}`}`);

/* The band's floor as a fraction of the plate — what `--ft-band-floor` is set
   from, and what the ≤960 rung's stops are read off. */
const bandFloorFrac =
  Math.round(((read.band.y + read.band.h - read.plate.y) / read.plate.h) * 1000) / 1000;
const bandRightFrac = Math.round(((read.band.x + read.band.w) / W) * 1000) / 1000;
console.log(`  bandBottomFrac ${bandFloorFrac}   bandRightFrac ${bandRightFrac}`);

await page.screenshot({ path: `${OUT}/site-footer-${tag}.png` });
console.log(`\n  shot -> ${OUT}/site-footer-${tag}.png`);
await browser.close();
