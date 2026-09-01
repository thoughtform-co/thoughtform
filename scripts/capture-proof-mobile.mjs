/**
 * capture-proof-mobile — the ADR-083 phone Proof instrument.
 *
 * At <=960px the casefile drops out of the scroll-driven runway into the
 * static flow with the BRIEF/PROOF/ARTIFACT mode switch and the four-stop
 * case rail; the desktop Directory stays mounted for state parity but is
 * visually retired. We capture at 320×568, 390×844 and the 960px boundary,
 * per the ADR's verification matrix.
 *
 * ⚠ ARTIFACT IS WALKED AT ALL FOUR STOPS, AND IT WAS NOT. The mode loop
 * selected `.fl-mobile-views button[data-view="…"]`, an attribute
 * `ServicesCasefile` has never rendered (the buttons carry
 * `id="svc-casefile-view-<mode>"`), so `count() === 0` and every mode
 * `continue`d — the run produced a `_full` and a `_case2` and NOTHING ELSE,
 * silently. And `.fl-mobile-rail button` counts the previous/next steps, so
 * `nth(1)` was the FIRST stop, not the second: `_case2` was the map row
 * again. Both are the failure this file exists to catch — a capture that
 * reports OK on states it never visited.
 *
 * Each ARTIFACT still is measured as it is taken: the seat's resting bottom
 * edge is walked against every line box inside it, so a mid-label clip is a
 * printed line rather than something the reviewer has to spot.
 *
 * Usage: node scripts/capture-proof-mobile.mjs [--out docs/design/...] [--theme dark|light]
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/proof-pass/before/mobile");
const THEME = argOf("--theme", "dark");

const VIEWPORTS = [
  { w: 320, h: 568, tag: "320x568" },
  { w: 390, h: 844, tag: "390x844" },
  { w: 960, h: 900, tag: "960x900" },
];

const MODES = ["brief", "proof", "artifact"];

await mkdir(OUT, { recursive: true });

/**
 * THE RESTING FOLD, MEASURED IN THE PAGE. Runs in the browser: parks every
 * scroller inside the visible seat at its top (the state a reader arrives
 * on), then walks each text node's LINE BOXES — not its element box, which
 * reports a wrapped paragraph as one tall rect and hides which line the edge
 * actually crosses. A line box straddling the seat's bottom edge by more
 * than a subpixel IS the defect the owner reported.
 */
const readRestingFold = () => {
  const seat = [".fl-brief", ".fl-proof-register", ".fl-panel"]
    .map((selector) => document.querySelector(selector))
    .find((element) => element && getComputedStyle(element).display !== "none");
  if (!seat) return null;
  const scrollers = [seat, ...seat.querySelectorAll("*")].filter((element) => {
    const style = getComputedStyle(element);
    return /auto|scroll/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
  });
  for (const element of scrollers) element.scrollTop = 0;

  const edge = seat.getBoundingClientRect().bottom;
  const walker = document.createTreeWalker(seat, NodeFilter.SHOW_TEXT);
  const clips = [];
  let node;
  while ((node = walker.nextNode())) {
    const text = node.nodeValue?.trim();
    const parent = node.parentElement;
    if (!text || !parent) continue;
    const style = getComputedStyle(parent);
    if (style.visibility === "hidden" || style.display === "none") continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const box of Array.from(range.getClientRects())) {
      if (box.height < 1 || box.width < 1) continue;
      if (box.top < edge - 0.75 && box.bottom > edge + 0.75)
        clips.push(
          `${(parent.className || parent.tagName).toString().split(" ")[0]}«${text.slice(0, 24)}»@${Math.round(
            ((edge - box.top) / box.height) * 100
          )}%`
        );
    }
  }
  const scroller = scrollers[0];
  return {
    seatH: Math.round(seat.getBoundingClientRect().height),
    inner: scroller
      ? `${Math.round(scroller.scrollHeight)}/${Math.round(scroller.clientHeight)}`
      : "fits",
    clips: clips.slice(0, 4),
  };
};

/** `Software for few` → `software-for-few`, for a filename that names its row. */
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);

const browser = await chromium.launch({ headless: false });

try {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 2,
      isMobile: vp.w <= 480,
      hasTouch: vp.w <= 480,
      colorScheme: THEME === "light" ? "light" : "dark",
      reducedMotion: "no-preference",
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto(`http://localhost:${PORT}/${THEME === "light" ? "?theme=light" : ""}`, {
      waitUntil: "domcontentloaded",
    });
    /* On <=960px the casefile is in the static document with no runway; we
       just scroll it into view. */
    await page.waitForSelector(".fl-case", { timeout: 30_000 });
    await page.evaluate(() => {
      const el = document.querySelector(".fl-case");
      el?.scrollIntoView({ block: "start", behavior: "instant" });
    });
    await page.waitForTimeout(700);

    /* Capture the full case as it sits, then each mode on the default row.
       The case rail lives under `.fl-mobile-rail`; the mode switch under
       `.fl-mobile-views`. Buttons are addressed by ID — the mode switch has
       no data attribute, and a missing-selector `continue` is how this
       script silently stopped capturing three of its five states. */
    await page.locator(".fl-case").screenshot({
      path: `${OUT}/${vp.tag}_${THEME}_full.png`,
    });

    for (const mode of MODES) {
      await page.locator(`#svc-casefile-view-${mode}`).click();
      await page.waitForTimeout(400);
      await page.locator(".fl-case").screenshot({
        path: `${OUT}/${vp.tag}_${THEME}_${mode}.png`,
      });
    }

    /* ARTIFACT AT ALL FOUR STOPS — map → software → studio → atl, the
       directory's own order (rules/proof.md). Each row mounts a different
       plate in the one seat, so a fit read on the default row proves
       nothing about the other three. `.fl-mobile-rail__stop` excludes the
       previous/next steps, which share the rail's element. */
    await page.locator("#svc-casefile-view-artifact").click();
    await page.waitForTimeout(300);
    const stops = await page.locator(".fl-mobile-rail__stop").count();
    for (let stop = 0; stop < stops; stop++) {
      await page.locator(".fl-mobile-rail__stop").nth(stop).click();
      await page.waitForTimeout(450);
      const title = await page.locator(".fl-mobile-head__title").textContent();
      const row = slug(title ?? `stop${stop}`);
      await page.locator(".fl-case").screenshot({
        path: `${OUT}/${vp.tag}_${THEME}_artifact_${stop + 1}-${row}.png`,
      });
      const fold = await page.evaluate(readRestingFold);
      const verdict = fold?.clips.length ? `CLIP ${fold.clips.join(" ; ")}` : "clear";
      console.log(
        `  ${vp.tag} ${THEME} artifact stop${stop + 1} ${row}: seat=${fold?.seatH} inner=${fold?.inner} ${verdict}`
      );
    }

    const observed = await page.evaluate(() => {
      const case_ = document.querySelector(".fl-case");
      const seat = document.querySelector(".fl-mobile-stage, .fl-mobile-view, .fl-panel");
      const rail = document.querySelector(".fl-mobile-rail");
      const mode = document.querySelector(".fl-mobile-views");
      return {
        caseBox: case_
          ? `${Math.round(case_.getBoundingClientRect().width)}x${Math.round(case_.getBoundingClientRect().height)}`
          : null,
        seatBox: seat
          ? `${Math.round(seat.getBoundingClientRect().width)}x${Math.round(seat.getBoundingClientRect().height)}`
          : null,
        railH: rail ? Math.round(rail.getBoundingClientRect().height) : null,
        modeH: mode ? Math.round(mode.getBoundingClientRect().height) : null,
        directoryHidden: (() => {
          const dir = document.querySelector(".fl-dir");
          if (!dir) return "absent";
          const cs = getComputedStyle(dir);
          return cs.display === "none" || cs.visibility === "hidden" ? "hidden" : "visible";
        })(),
      };
    });
    console.log(`${vp.tag} ${THEME}: ${JSON.stringify(observed)}`);
    if (errors.length) console.log(`  errors: ${errors.join(" | ")}`);

    await ctx.close();
  }
  console.log(`stills in ${OUT}/`);
} finally {
  await browser.close();
}
