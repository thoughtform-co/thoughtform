#!/usr/bin/env node
/**
 * design-eval/capture-anchors — the judge's ground truth.
 *
 * Shoots three SHIPPED, SANCTIONED surfaces into
 * `.claude/skills/thoughtform-design/eval/anchors/`. The judge shows them to the
 * vision model alongside every candidate, labelled as real Thoughtform work.
 *
 * ⚠ Why this exists at all: without ground truth the judge is a critic with no
 * reference and scores everything about an 8 — reasonable-looking numbers that
 * discriminate nothing. The anchors are what make a 6 mean "worse than what we
 * ship" rather than "worse than the model's idea of good".
 *
 * ⚠ HEADED. The landing is a scroll-driven WebGL corridor and a headless
 * context leaves the canvas dead — a black anchor is worse than none.
 *
 *   node scripts/design-eval/capture-anchors.mjs
 *
 * Re-shoot after any deliberate change to these surfaces, and re-run the golden
 * set afterwards (rubric §Regression protocol): moving the standard moves every
 * score measured against it.
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const PORT = argOf("--port", "3003");
const OUT = path.resolve(process.cwd(), ".claude/skills/thoughtform-design/eval/anchors");

/** The dwell the casefile is pinned across (unifiedServicesInstrument.ts). */
const PROOF_RUNWAY_VH = 3.2;

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference",
  colorScheme: "dark",
});
const page = await ctx.newPage();
const shot = (name, buf) => {
  fs.writeFileSync(path.join(OUT, name), buf);
  console.log(`  wrote ${name} (${Math.round(buf.length / 1024)}kB)`);
};

try {
  // ── 1. the landing hero ──────────────────────────────────────────────────
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(6000); // the gateway plate + boot choreography
  shot("landing-hero.png", await page.screenshot());

  // ── 2. the casefile console ──────────────────────────────────────────────
  // Scroll-driven: drive REAL scrolls into the dwell, never a teleport, or the
  // corridor never engages and the panel is not built.
  // Both the section offset AND the viewport height must be read INSIDE the
  // page — `window` does not exist in this process.
  const geom = await page.evaluate(() => {
    const el = document.querySelector("#services");
    return el ? { top: el.getBoundingClientRect().top + window.scrollY, vh: window.innerHeight } : null;
  });
  if (geom) {
    const servicesTop = geom.top;
    const target = servicesTop + geom.vh * PROOF_RUNWAY_VH * 0.09;
    const steps = 40;
    for (let i = 1; i <= steps; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), (target * i) / steps);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(2500);
    const con = await page.$(".fl-con");
    if (con) shot("casefile-console.png", await con.screenshot());
    else console.log("  ! .fl-con not found at the dwell — casefile-console.png NOT written");
  } else {
    console.log("  ! #services not found — casefile-console.png NOT written");
  }

  // ── 3. the shipped card face ─────────────────────────────────────────────
  // ⚠ The lab OPENS ON V0, which is the superseded ADR-029 five-element face and
  // is labelled "REFERENCE ONLY" on the panel itself — the read the owner
  // rejected as overwhelming. Anchoring on it would teach the judge the wrong
  // standard, so select the TIGHT face (V1, what actually ships) first.
  await page.goto(`http://localhost:${PORT}/test/services-card-face-lab`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(4000);
  const tight = page.locator("button", { hasText: /TIGHT FACE/i }).first();
  if (await tight.count()) {
    await tight.click();
    await page.waitForTimeout(4000); // the bake is async: photo + LUT + typeset
  } else {
    console.log("  ! no TIGHT FACE control found — check the lab's variant buttons");
  }
  const canvas = await page.$("canvas");
  if (canvas) shot("card-face-shipped.png", await canvas.screenshot());
  else console.log("  ! no canvas on the face lab — card-face-shipped.png NOT written");
} catch (err) {
  console.error(`capture failed: ${err.message}`);
  await browser.close();
  process.exit(1);
}

await browser.close();
const have = fs.readdirSync(OUT).filter((f) => f.endsWith(".png"));
console.log(`\n  ${have.length}/3 anchors in ${OUT}`);
console.log(`  ${have.length === 3 ? "the judge is AUTHORITATIVE" : "the judge stays ADVISORY until all three exist"}\n`);
