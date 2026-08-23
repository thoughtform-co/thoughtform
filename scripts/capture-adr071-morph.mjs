/**
 * ADR-071 U1 — the skill chip's SHAPE MORPH, verified against the live page.
 *
 * Two questions only a browser can answer:
 *   1. Does CSS `d` interpolation actually PLAY (sampled mid-flight — a
 *      structure mismatch or an unsupported engine snaps it discrete, with
 *      nothing on screen to say so)?
 *   2. Does the choreography read right (frames at ~140/280ms, both
 *      directions, plus the settled states)?
 *
 * Usage: dev server on 3003, then `node scripts/capture-adr071-morph.mjs`.
 * Frames land in `.cursor/morph-shots/`.
 */
import { mkdirSync } from "node:fs";

import { chromium } from "@playwright/test";

const OUT = ".cursor/morph-shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  reducedMotion: "no-preference",
  colorScheme: "dark",
});
const page = await ctx.newPage();
page.on("console", (m) => {
  if (m.type() === "error") console.log("[console.error]", m.text().slice(0, 300));
});
await page.goto("http://localhost:3003/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".home-v2-stage", { timeout: 60_000 });
const target = await page.evaluate(() => {
  const runway = document.querySelector(".services-stage-root");
  if (!runway) return null;
  const rect = runway.getBoundingClientRect();
  const top = rect.top + window.scrollY;
  const travel = Math.max(0, rect.height - window.innerHeight);
  return Math.round(top + Math.min(travel, window.innerHeight * 3.2) * 0.09);
});
await page.evaluate((y) => window.scrollTo(0, y), target);
await page.waitForTimeout(700);
await page.waitForSelector("[data-proof-settled]", { timeout: 30_000 });
await page.waitForSelector(".fl-pda__svg", { timeout: 30_000 });
await page.waitForTimeout(900);

/* Open a CONFIGURED stream (the round4 capture's own pick). */
await page.locator(".fl-pda-hit").nth(5).click({ force: true });
await page.waitForTimeout(700);
const view2 = await page.evaluate(() =>
  document.querySelector(".fl-pda")?.getAttribute("data-view")
);
console.log("after cartridge click, data-view =", view2);

/* ── 2 → 3: sample the morphing path's computed `d` in-page ───────────── */
const arrive = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const root = document.querySelector(".fl-pda");
  const stations = [...root.querySelectorAll(".fl-con__stn")];
  stations[2].click();
  const out = [];
  for (let i = 0; i < 9; i += 1) {
    await sleep(50);
    const el = document.querySelector(".fl-pda-chip-morph");
    if (!el) {
      out.push({ t: (i + 1) * 50, missing: true });
      continue;
    }
    const cs = getComputedStyle(el);
    const d = cs.d || "";
    const m = d.match(/M ?(-?\d+\.?\d*)[ ,](-?\d+\.?\d*)/);
    const name = document.querySelector(".fl-pda-chip-name");
    out.push({
      t: (i + 1) * 50,
      x: m ? Number(m[1]) : null,
      y: m ? Number(m[2]) : null,
      op: Number(cs.opacity).toFixed(2),
      nameT: name ? getComputedStyle(name).transform.slice(0, 40) : "gone",
    });
  }
  await sleep(500);
  const el = document.querySelector(".fl-pda-chip-morph");
  return {
    samples: out,
    finalOpacity: el ? getComputedStyle(el).opacity : "unmounted",
    view: root.getAttribute("data-view"),
  };
});
console.log("2→3 morph samples:", JSON.stringify(arrive, null, 1));

/* ── The frames. ⚠ PLAYWRIGHT'S CLICK + SCREENSHOT ROUNDTRIPS COST 400–900ms
   — every "140ms after click" frame is really post-fade fiction. So the
   frames are taken with the ANIMATION CLOCK SLOWED 12× via CDP: the 620ms
   morph takes ~7.4s, and a leisurely screenshot lands mid-shape. */
const cdp = await ctx.newCDPSession(page);
await cdp.send("Animation.enable");

/* Back to 02 first (at full speed), settle. */
await page.locator(".fl-con__stn").nth(1).click();
await page.waitForTimeout(1400);

await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 / 12 });
await page.locator(".fl-con__stn").nth(2).click();
await page.waitForTimeout(1600); /* ≈133ms of animation time */
await page.locator(".fl-con__console").screenshot({ path: `${OUT}/a_2to3_early.png` });
await page.waitForTimeout(2200); /* ≈316ms */
await page.locator(".fl-con__console").screenshot({ path: `${OUT}/a_2to3_mid.png` });
await page.waitForTimeout(1800); /* ≈466ms */
await page.locator(".fl-con__console").screenshot({ path: `${OUT}/a_2to3_late.png` });
await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 });
await page.waitForTimeout(1200);
await page.locator(".fl-con__console").screenshot({ path: `${OUT}/a_2to3_settled.png` });

/* ── 3 → 2: the return ────────────────────────────────────────────────── */
await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 / 12 });
await page.locator(".fl-con__stn").nth(1).click();
await page.waitForTimeout(1600);
await page.locator(".fl-con__console").screenshot({ path: `${OUT}/b_3to2_early.png` });
await page.waitForTimeout(2200);
await page.locator(".fl-con__console").screenshot({ path: `${OUT}/b_3to2_mid.png` });
await page.waitForTimeout(1800);
await page.locator(".fl-con__console").screenshot({ path: `${OUT}/b_3to2_late.png` });
await cdp.send("Animation.setPlaybackRate", { playbackRate: 1 });
await page.waitForTimeout(1200);
await page.locator(".fl-con__console").screenshot({ path: `${OUT}/b_3to2_settled.png` });

const returned = await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const root = document.querySelector(".fl-pda");
  const stations = [...root.querySelectorAll(".fl-con__stn")];
  /* go 3, settle, then sample the return in-page */
  stations[2].click();
  await sleep(1400);
  stations[1].click();
  const out = [];
  for (let i = 0; i < 9; i += 1) {
    await sleep(50);
    const el = document.querySelector(".fl-pda-chip-morph");
    if (!el) {
      out.push({ t: (i + 1) * 50, missing: true });
      continue;
    }
    const cs = getComputedStyle(el);
    const d = cs.d || "";
    const m = d.match(/M ?(-?\d+\.?\d*)[ ,](-?\d+\.?\d*)/);
    out.push({
      t: (i + 1) * 50,
      x: m ? Number(m[1]) : null,
      y: m ? Number(m[2]) : null,
      op: Number(cs.opacity).toFixed(2),
    });
  }
  const reveal = document.querySelector(".fl-pda-chip-reveal");
  return {
    samples: out,
    revealOpacity: reveal ? getComputedStyle(reveal).opacity : "no reveal group",
    view: root.getAttribute("data-view"),
  };
});
console.log("3→2 morph samples:", JSON.stringify(returned, null, 1));

await browser.close();
console.log(`frames in ${OUT}/`);
