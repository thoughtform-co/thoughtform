/**
 * capture-datum-lab — drives `/test/voidwalker-datum-lab` and captures the
 * review stills for the D2 "datum rails" era stage (ADR-082 successor pass).
 *
 * ⚠ HEADED BY DEFAULT, AND THAT IS A CODEC DECISION, NOT A PREFERENCE.
 * The figure is a `<video>`, and Playwright's bundled Chromium ships without
 * the proprietary H.264 decoder. Azeroth captures fine headless because its
 * pair is VP9-in-WebM (an open codec), while every other era falls back to
 * `CANONICAL_CHARACTER_ERA_HOLOGRAM`'s `.mp4` — which reports `readyState 4`
 * and then paints NOTHING, so the frame comes out with a lit projector disc
 * and no figure on it. That reads exactly like a layout bug and is not one;
 * it cost a round of chasing before the codec was the answer. `--headless`
 * is available for the DOM-only checks where the figure does not matter.
 *
 * Waits are on OBSERVABLES, never sleeps: the figure's own phase attribute
 * (`.vwh__slot[data-phase]`) leaves `reveal` when the 900ms materialize is
 * done, and the chips carry `data-on`.
 *
 * ⚠ `reducedMotion: "no-preference"` — `HoloFigure` skips autoplay and the
 * materialize under PRM, so a PRM context captures a still poster and none of
 * the treatment this pass is being judged on.
 *
 * Usage (dev server must already be running):
 *   node scripts/capture-datum-lab.mjs [--port 3003] [--era azeroth,expanse]
 *     [--vp 1440x900,1920x1247] [--theme dark|light] [--out <dir>] [--headless]
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/era-stage-pass/datum-lab");
const THEME = argOf("--theme", "dark");
/** Azeroth is the only era with its own authored hologram; The Expanse is the
 *  only one with a film, so it is the era that exercises TRANSMISSION. */
const ERAS = argOf("--era", "azeroth,expanse").split(",").filter(Boolean);
const VIEWPORTS = argOf("--vp", "1440x900,1920x1247")
  .split(",")
  .filter(Boolean)
  .map((s) => {
    const [w, h] = s.split("x").map(Number);
    return { w, h, label: s };
  });

const ERA_INDEX = {
  loop: 0,
  genai: 1,
  azeroth: 2,
  expanse: 3,
  "pokemon-go": 4,
};

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: args.includes("--headless") });
let shots = 0;
let fail = 0;

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();

  const url = `http://localhost:${PORT}/test/voidwalker-datum-lab?theme=${THEME}`;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector(".vdl__stage", { timeout: 20000 });

  for (const era of ERAS) {
    const idx = ERA_INDEX[era];
    if (idx === undefined) {
      console.log(`  x unknown era "${era}" — known: ${Object.keys(ERA_INDEX).join(", ")}`);
      fail += 1;
      continue;
    }

    // Click the chip rather than poking state: the chip IS the control this
    // pass is judging, so a capture that bypassed it would not prove it works.
    await page.locator(".vdl__chip").nth(idx).click();
    await page.waitForFunction(
      (i) => document.querySelectorAll(".vdl__chip")[i]?.dataset.on === "true",
      idx,
      { timeout: 5000 }
    );
    /* The figure re-materializes on every pick. Two waits, and the second is
       the one that matters: the slot's phase attribute leaves `reveal` when
       the 900ms animation ends, but the MEDIA can still be undecoded — a
       headless capture then writes a frame with a lit projector disc and no
       figure on it, which looks like a layout bug and is not one. Wait on the
       element's own readiness (`readyState >= 2` / `naturalWidth`), not on
       the choreography that merely uncovers it. */
    await page
      .waitForFunction(
        () => document.querySelector(".vwh__slot")?.dataset.phase !== "reveal",
        undefined,
        { timeout: 4000 }
      )
      .catch(() => {});
    await page
      .waitForFunction(
        () => {
          const m = document.querySelector(".vwh__media");
          if (!m) return false;
          return m.tagName === "VIDEO" ? m.readyState >= 2 : m.complete && m.naturalWidth > 0;
        },
        undefined,
        { timeout: 8000 }
      )
      .catch(() => console.log("  ! media not ready — frame may show an empty slot"));

    const name = `${vp.label}_${THEME}_${era}.png`;
    await page.screenshot({ path: `${OUT}/${name}` });
    console.log(`  ok ${name}`);
    shots += 1;
  }

  await context.close();
}

await browser.close();
console.log(`\ndone - ${shots} shots, ${fail} fail, ${OUT}/`);
