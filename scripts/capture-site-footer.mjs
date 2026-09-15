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
    socials: document.querySelectorAll(".ft-foot__socials a").length,
    deadLinks: [...document.querySelectorAll('.ft-foot a[href="#"]')].length,
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
console.log(`  socials ${read.socials}   dead links ${read.deadLinks}`);
for (const c of read.chrome)
  console.log(`  chrome  ${c.cls}  ${JSON.stringify({ x: c.x, y: c.y, w: c.w, h: c.h })}`);
if (errors.length) console.log(`  ⚠ page errors: ${JSON.stringify(errors.slice(0, 3))}`);

await page.screenshot({ path: `${OUT}/site-footer-${tag}.png` });
console.log(`\n  shot -> ${OUT}/site-footer-${tag}.png`);
await browser.close();
