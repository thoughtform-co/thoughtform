/**
 * Capture /trinny-london at the owner's own viewport (ADR-093).
 *
 * ⚠ HEADED, ALWAYS. The corridor is WebGL; headless leaves the canvas dead
 * and every corridor frame comes back black.
 *
 * ⚠ AND AT 1920×1247 BY DEFAULT, not at a reference shape. Every reference
 * viewport in this repo is landscape (1280×720, 1440×800, 1920×1080) while
 * the owner runs a tall window — three consecutive ADR-070 updates each
 * shipped a crop that filled one shape and letterboxed the other with every
 * assertion green. Capture what he looks at before saying it is done.
 *
 *   node scripts/capture-trinny-london.mjs [--vp 1920x1247] [--port 3003]
 *                                          [--url /trinny-london] [--out <dir>]
 *
 * Writes to `.cursor/trinny-shots/` (gitignored) and prints one line per
 * stop with what the frame is supposed to show.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const [w, h] = arg("vp", "1920x1247").split("x").map(Number);
const port = arg("port", "3003");
const path = arg("url", "/trinny-london");
const outDir = arg("out", join(".cursor", "trinny-shots"));
mkdirSync(outDir, { recursive: true });

const base = `http://localhost:${port}`;
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: w, height: h } });

const readState = () =>
  page.evaluate(() => ({
    y: Math.round(window.scrollY),
    station: document.documentElement.getAttribute("data-active-station"),
    phase: document.documentElement.getAttribute("data-corridor-phase"),
    gold: [
      ...document.querySelectorAll(".rin-cl--journey .rin-mark, .rin-settings .rin-mark"),
    ]
      .filter((m) => m.dataset.state === "here")
      .map((m) => m.dataset.mark)
      .join(","),
    sector: document.querySelector(".rin-tele:nth-of-type(2) .rin-tele__v")?.textContent ?? "-",
  }));

/** Real, stepped scrolls — the corridor is scroll-composed and a teleport
 *  lands on a frame the clocks have not caught up to. The document also
 *  GROWS as the lazy chunks mount, so the height is re-read every step. */
async function rollTo(target) {
  await page.evaluate(async (y) => {
    const step = Math.max(300, window.innerHeight * 0.5);
    const from = window.scrollY;
    const dir = y > from ? 1 : -1;
    for (let at = from; dir > 0 ? at < y : at > y; at += dir * step) {
      window.scrollTo(0, at);
      await new Promise((r) => requestAnimationFrame(r));
    }
    window.scrollTo(0, y);
  }, target);
  await page.waitForTimeout(750);
}

const shoot = async (name, note) => {
  const s = await readState();
  const file = join(outDir, `${name}.png`);
  await page.screenshot({ path: file });
  console.log(
    `${name.padEnd(16)} y=${String(s.y).padStart(6)} station=${(s.station ?? "-").padEnd(9)} ` +
      `phase=${(s.phase ?? "-").padEnd(9)} gold=${s.gold.padEnd(9)} sector=${s.sector}  ${note}`
  );
};

await page.goto(base + path, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".home-v2-stage", { timeout: 30_000 });
await page.waitForTimeout(1800);

console.log(`\n${base}${path}  @ ${w}×${h}\n`);
await shoot("01-hero", "the hero, in light");

const topOf = (id) =>
  page.evaluate((sel) => {
    const el = document.getElementById(sel);
    return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : 0;
  }, id);

await rollTo((await topOf("about")) + 120);
await shoot("02-about", "the bio — the entry hold must NOT cover it");

const stage = await page.evaluate(
  () => document.querySelector(".home-v2-stage")?.getBoundingClientRect().height ?? 9000
);
for (const [frac, name, note] of [
  [0.18, "03-thesis", "the thesis beat"],
  [0.36, "04-navigate", "the Arc — Navigate"],
  [0.52, "05-encode", "the Arc — Encode"],
  [0.7, "06-build", "the Arc — Build"],
  [0.92, "07-epilogue", "the epilogue signal"],
]) {
  await rollTo(Math.round(stage * frac));
  await shoot(name, note);
}

// The casefile's dwell at the front of the services runway.
const runway = await page.evaluate(() => {
  const el = document.querySelector(".services-stage-root");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: Math.round(r.top + window.scrollY), travel: Math.round(r.height - innerHeight) };
});
if (runway) {
  const proof = Math.min(runway.travel, Math.round(h * 3.2));
  for (const [p, name, note] of [
    [0.12, "08-proof-row1", "the casefile, row 1 — the Intelligence Map"],
    [0.4, "09-proof-row3", "the casefile, row 3 — the Studio sheets"],
  ]) {
    await rollTo(runway.top + Math.round(proof * p));
    await shoot(name, note);
  }
  await rollTo(runway.top + proof + Math.round((runway.travel - proof) * 0.55));
  await shoot("10-ring", "the services card ring, behind the casefile");
}

await rollTo(await topOf("contact"));
await shoot("11-contact", "the exit");

console.log(`\nwrote ${outDir}\n`);
await browser.close();
