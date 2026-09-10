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
    gold: [...document.querySelectorAll(".rin-cl--journey .rin-mark, .rin-settings .rin-mark")]
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

// The proof stack (ADR-094): each card pinned in turn, then the pile mid-cover
// — the recession is what the stills have to show. Positions are read off
// the slots' own computed pin offsets, never a hardcoded pixel count.
const slots = await page.evaluate(() =>
  [...document.querySelectorAll("[data-pc-slot]")].map((el) => {
    const r = el.getBoundingClientRect();
    return {
      top: Math.round(r.top + window.scrollY),
      pin: Number.parseFloat(getComputedStyle(el).top) || 0,
    };
  })
);
await rollTo((await topOf("services")) + 120);
await shoot("08-proof-arrive", "the first card arriving on the dissipate");
for (let i = 0; i < slots.length; i++) {
  await rollTo(slots[i].top - slots[i].pin + 40);
  await shoot(`09-card${i + 1}`, `the proof stack — card ${i + 1} pinned`);
}
if (slots.length > 1) {
  await rollTo(slots[1].top - Math.round(h * 0.55));
  await shoot("10-stack-cover", "the second card arriving over the first");
}

// The turn (ADR-095 + U1): the parked mark re-forming as the client's while
// the products sweep in, the ground warming to their coral, and the line
// decoding in place on top of it. Its clock is a pure function of the
// station's rect — `p = (vh − top) / (vh + runway)`, runway = height − vh —
// so each stop is solved for a `p` rather than guessed in pixels. The morph
// runs 0.20→0.56, the products 0.30→0.69, the line 0.62→0.78 — and the
// wash swells 0.36→0.68 and then HOLDS (U4): the proposal below carries the
// SAME field, so the client's colour crosses the seam instead of resolving
// before it. Where the ground ends is geometry, not a stop on this clock.
const turnRect = () =>
  page.evaluate(() => {
    const r = document.getElementById("turn")?.getBoundingClientRect();
    return { top: (r?.top ?? 0) + window.scrollY, height: r?.height ?? 0 };
  });
/** ⚠ CONVERGE ON THE PUBLISHED CLOCK, never on one solved `y`. The document
 *  grows under the scroll as the lazy chunks mount, so a `y` computed before
 *  a roll lands at a different `p` — measured 0.84 asked, 0.64 arrived, which
 *  is the difference between the line lit and the line still mid-decode. The
 *  writer publishes what it actually computed, so re-solve against THAT until
 *  it agrees. */
const rollToP = async (p) => {
  for (let pass = 0; pass < 5; pass++) {
    const { top, height } = await turnRect();
    const runway = Math.max(1, height - h);
    await rollTo(Math.round(top + p * (h + runway) - h));
    const actual = Number(
      await page.evaluate(
        () => document.getElementById("turn")?.getAttribute("data-tl-turn") ?? "0"
      )
    );
    if (Math.abs(actual - p) <= 0.01) break;
  }
};
for (const [p, name, note] of [
  [0.35, "14-turn-arrive", "the turn — the last card leaving, the first particles in flight"],
  [0.6, "15-turn-mark", "the turn — their mark, on a ground already warming"],
  [0.84, "16-turn-line", "the turn — the line decoded in place, the products at rest"],
  [0.94, "17-turn-clear", "the turn — the products sweeping OUT, the line un-typing (U5)"],
  [1.0, "18-turn-resolve", "the turn — the stage bare, the ground HOLDING (U4)"],
]) {
  await rollToP(p);
  await page.waitForTimeout(600);
  await shoot(name, note);
}

/* The proposal (ADR-095 U5). It is a PINNED station now, so its record is
   deliberately blank while the station travels and powers on once the stage
   has parked — `q` is how far into that pinned stretch the reader is, and
   `data-tl-prop` is what the writer publishes.
   ⚠ SOLVING FOR `topOf("proposition")` SHOOTS THE ONE FRAME THE RECORD IS
   GUARANTEED TO BE EMPTY IN: the top at the viewport top IS `q = 0`, the
   instant before the reveal opens. That still is worth having — it is the
   proof there is no travel to see — but it is not the proposal. Same law as
   `rollToP`: converge on the published clock. */
/* ⚠ AND THE PIN IS NOT THE STATION'S TOP. `.station` carries top padding —
   140px at 1920×1247 — so the stage is still that far short of pinning in
   the frame the station's top reaches the viewport top. The clock measures
   the STAGE's own travel, and so does this. */
const propRect = () =>
  page.evaluate(() => {
    const el = document.getElementById("proposition");
    const st = el?.querySelector("[data-tl-prop-stage]");
    const r = el?.getBoundingClientRect();
    return {
      top: (r?.top ?? 0) + window.scrollY,
      height: r?.height ?? 0,
      pad: st?.offsetTop ?? 0,
      stageH: st?.offsetHeight ?? 0,
    };
  });
const rollToQ = async (q) => {
  for (let pass = 0; pass < 5; pass++) {
    const { top, height, pad, stageH } = await propRect();
    const travel = Math.max(1, height - pad - stageH);
    await rollTo(Math.round(top + pad + q * travel));
    const actual = Number(
      await page.evaluate(
        () => document.getElementById("proposition")?.getAttribute("data-tl-prop") ?? "0"
      )
    );
    if (Math.abs(actual - q) <= 0.02) break;
  }
};
for (const [q, name, note] of [
  [0, "19-prop-armed", "the proposal — pinned and blank, the frame with nothing travelling"],
  [0.26, "20-prop-strike", "the proposal — the record striking on, in place"],
  [0.7, "12-proposition", "the proposal — the configuration drawing, lit"],
]) {
  await rollToQ(q);
  await page.waitForTimeout(900);
  await shoot(name, note);
}

await rollTo(await topOf("contact"));
await shoot("13-contact", "the exit");

console.log(`\nwrote ${outDir}\n`);
await browser.close();
