/**
 * capture-map-readings — the map console's three readings ON THE REAL
 * LANDING, plus the 01 → 02 morph, captured mid-flight.
 *
 * HEADED by default: the casefile sits inside the scroll-driven WebGL
 * corridor, and a headless context leaves the canvas dead — the instrument
 * never mounts and every shot is of an empty stage. Pass `--headless` only to
 * check the DOM.
 *
 * Real scrolls, never a teleport (`.claude/rules/services-ring.md`): an
 * instant jump skips the corridor's engagement band. And the corridor is a
 * lazy chunk, so the runway is measured only after `.home-v2-stage` exists.
 *
 * Usage (dev server must already be running):
 *   node scripts/capture-map-readings.mjs [--port 3003] [--vp 1280x720]
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/map-readings");
const HEADLESS = args.includes("--headless");
const THEME = argOf("--theme", "dark");
const [VW, VH] = argOf("--vp", "1280x720").split("x").map(Number);

/**
 * Mirrors SERVICES_PROOF_RUNWAY_VH; the dwell's front is the casefile's.
 *
 * ⚠ SCROLL IS THE ROW SELECTOR. The front 62.5 % of the dwell is the BROWSE
 * BAND and it is divided into one quarter per directory row, so the fraction
 * below chooses WHICH PLATE mounts. The map is row one, which lives in the
 * first quarter — 0.35 of the runway lands on the Studio row's sheets, which
 * is how this script first came up empty looking for `.fl-pda__svg`.
 */
const PROOF_RUNWAY_VH = 3.2;
const DWELL = Number(argOf("--at", "0.09"));

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: HEADLESS });
const ctx = await browser.newContext({
  viewport: { width: VW, height: VH },
  reducedMotion: "no-preference",
  colorScheme: THEME === "light" ? "light" : "dark",
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

/* The CONSOLE box, not the plate: the plate carries a few px of transparent
   clearance and a shot of it shows the page behind at the edges. */
const shot = (name) =>
  page.locator(".fl-con__console").screenshot({ path: `${OUT}/${VW}x${VH}_${THEME}_${name}.png` });

try {
  await page.goto(`http://localhost:${PORT}/${THEME === "light" ? "?theme=light" : ""}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".home-v2-stage", { timeout: 60_000 });

  const target = await page.evaluate(
    ({ vh, at }) => {
      const runway = document.querySelector(".services-stage-root");
      if (!runway) return null;
      const rect = runway.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const travel = Math.max(0, rect.height - window.innerHeight);
      return Math.round(top + Math.min(travel, window.innerHeight * vh) * at);
    },
    { vh: PROOF_RUNWAY_VH, at: DWELL }
  );
  if (target == null) throw new Error("no .services-stage-root — the corridor never mounted");

  await page.evaluate((y) => window.scrollTo(0, y), target);
  await page.waitForTimeout(700);
  await page.waitForSelector("[data-proof-settled]", { timeout: 30_000 });
  await page.waitForSelector(".fl-pda__svg", { timeout: 30_000 }).catch(async () => {
    /* The band selected another row — say WHICH, rather than timing out on a
       selector that was never going to appear. */
    const mounted = await page.evaluate(() =>
      [...document.querySelectorAll("[class*='fl-plate--']")].map((el) => el.className).join(" | ")
    );
    throw new Error(`the map plate is not the selected row at --at ${DWELL}. Mounted: ${mounted}`);
  });
  await page.waitForTimeout(900);

  /* Reading 01, then the morph into 02 sampled mid-flight (the dock is
     420ms), then settled, then 03. */
  await shot("01-work");

  const hit = page.locator(".fl-pda-hit").nth(5);
  const opened = (await hit.getAttribute("aria-label")) ?? "";
  await hit.click({ force: true });
  await page.waitForTimeout(150);
  await shot("02-morph-150ms");
  await page.waitForTimeout(150);
  await shot("02-morph-300ms");
  await page.waitForTimeout(1200);
  await shot("02-configuration");

  const view = await page.locator(".fl-pda").getAttribute("data-view");
  const read = await page.evaluate(() => {
    const svg = document.querySelector(".fl-pda__svg");
    const field = document.querySelector(".fl-con__field");
    if (!svg || !field) return null;
    const [vx, vy, vw, vh] = (svg.getAttribute("viewBox") ?? "0 0 1 1").split(/\s+/).map(Number);
    const b = svg.getBoundingClientRect();
    const k = Math.min(b.width / vw, b.height / vh);
    let minPx = Infinity;
    let texts = 0;
    const clipped = [];
    for (const t of svg.querySelectorAll("text")) {
      const label = (t.textContent ?? "").trim();
      if (!label) continue;
      texts += 1;
      const bb = t.getBBox();
      minPx = Math.min(minPx, parseFloat(getComputedStyle(t).fontSize) * k);
      if (
        bb.x < vx - 0.5 ||
        bb.x + bb.width > vx + vw + 0.5 ||
        bb.y < vy - 0.5 ||
        bb.y + bb.height > vy + vh + 0.5
      )
        clipped.push(label);
    }
    return {
      field: `${Math.round(field.clientWidth)}x${Math.round(field.clientHeight)}`,
      crop: `${vw}x${vh}`,
      meet: k.toFixed(3),
      texts,
      minPx: minPx.toFixed(2),
      clipped,
    };
  });



  /* The readout is the one reactive line — hover a package and it swaps. */
  const pkg = page.locator(".fl-pda__svg text", { hasText: "SKILL" }).first();
  await pkg.hover({ force: true }).catch(() => {});
  await page.waitForTimeout(200);
  await shot("02-hover-runs");

  await page.locator(".fl-con__stn").nth(2).click();
  await page.waitForTimeout(900);
  await shot("03-substrate");

  console.log(`opened: ${opened}`);
  console.log(`data-view after click: ${view}`);
  console.log(JSON.stringify(read, null, 2));
  if (errors.length) console.log(`PAGE ERRORS:\n  ${errors.join("\n  ")}`);
  console.log(`stills in ${OUT}/`);
} finally {
  await browser.close();
}
