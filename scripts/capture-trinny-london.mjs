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
 *                                          [--url /arcs/trinny-london/proposal] [--out <dir>]
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
const path = arg("url", "/arcs/trinny-london/proposal");
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

/* The proposal (ADR-101 §A). The stops are solved for `q`, the station's
   ARRIVAL: 0 with its top at the viewport's bottom edge, 1 at the top.
   ⚠ AND THE MIDDLE OF THAT RANGE IS NOW DELIBERATELY EMPTY. ADR-099's
   stops shot the record RISING at q 0.35 and 0.7; it does not rise any more,
   it is struck in, seated, at q = 1 (owner, 2026-09-14: the elements "don't
   have to fly in … they need to have a glitch effect"). So the three stops
   are the empty frame before it, the burst, and the settled record — which
   is what has to be looked at, in that order.
   Solve, roll, re-solve — the document grows under the scroll as the lazy
   chunks mount, so one solved `y` lands somewhere else (the `rollToP` law,
   one beat up). */
const rollToQ = async (q) => {
  for (let pass = 0; pass < 4; pass++) {
    const top = await topOf("proposition");
    await rollTo(Math.round(top - (1 - q) * h));
    const actual = Number(
      await page.evaluate(
        () => document.getElementById("proposition")?.getAttribute("data-tl-prop") ?? "0"
      )
    );
    if (Math.abs(actual - q) <= 0.02) break;
  }
};
await rollToQ(0.95);
await page.waitForTimeout(600);
await shoot("19-turn-empties", "the frame the turn hands over — ground and ghost, nothing else");

/* ⚠ THE BURST IS 640ms AND IT ENDS ON THE CASCADE, so a still taken late is
   a still of the settled record with nothing to say. 260ms lands inside the
   strike's own dead band (opacity .12) where the comb is still cutting; 1.6s
   is past the ledger's last rung (960ms + 640ms of delay). */
await rollToQ(1.0);
await page.waitForTimeout(260);
await shoot("20-config-strike", "the configuration STRIKING in — the comb mid-cut");
await page.waitForTimeout(1400);
await shoot("20b-config-struck", "the same frame, settled — the strike ends on the cascade");
await shoot("12-proposition", "the configuration seated on the head's datum");

/* The offer (ADR-094 U9, extended by ADR-099). Each beat is its own
   `.arc-sec` with the section's id, so a stop is solved off the BEAT's box
   rather than the station's — and rolled to TWICE, because the arcs' reveal
   is an IntersectionObserver with a -10% dead band and the first roll out of
   the beat above can land before it has fired. */
/* THE SCENE (ADR-102): `#proposition` is a pinned stage now, and everything
   between the record's arrival and the offer is a pure function of its own
   clock `sv` — viewports past the pin, published as `data-tl-scene`. Solved
   off the STATION's rect (the stage is sticky, so its rect reports wherever
   it is pinned; and the clock clamps, so a target at its floor lands
   anywhere above it), and converged on the published value. The stops are the
   windows: the dwell, the board's head and the ledger closing, the nodes
   folding into the chip, the hand-over, the slide to plate 1, the title, the
   three unrolls with the two copies between them, the paragraph, and the
   settled scene. ⚠ Look at every one of them: the two defects the first cut
   shipped (a missing layer, a replayed strike on the way back) were on the
   readout and on the still, and on no gate. */
const rollToS = async (sv) => {
  for (let pass = 0; pass < 6; pass++) {
    const g = await page.evaluate(() => {
      const r = document.getElementById("proposition").getBoundingClientRect();
      return {
        docTop: r.top + window.scrollY,
        vh: window.innerHeight,
        runway: r.height - window.innerHeight,
      };
    });
    await rollTo(Math.round(g.docTop + Math.min(sv * g.vh, g.runway)));
    const actual = Number(
      await page.evaluate(
        () => document.getElementById("proposition")?.getAttribute("data-tl-scene") ?? "0"
      )
    );
    if (Math.abs(actual - Math.min(sv, g.runway / g.vh)) <= 0.02) break;
  }
};
for (const [sv, name, note] of [
  [0.15, "21-scene-dwell", "the scene pinned — the record whole, nothing moving yet"],
  [0.55, "22-scene-withdraw", "the board's head and the ledger closing to the centre"],
  [0.85, "23-scene-fold", "the nodes folding into the chip, ribbons retracting"],
  [1.12, "24-scene-handover", "the chip handed to the carrier — the frame holds one object"],
  [1.3, "25-scene-slide", "the chip sliding to the far left, becoming plate 1's band"],
  [1.5, "26-scene-title", "plate 1's band landed, the title decoding in place (ADR-103)"],
  [1.65, "27-scene-unroll1", "plate 1 unrolling out of its band; the copy born on it"],
  [1.85, "28-scene-copy2", "the copy travelling to plate 2's column"],
  [2.1, "29-scene-unroll2", "plate 2 unrolling"],
  [2.35, "30-scene-copy3", "the second copy travelling to plate 3's column"],
  [2.6, "31-scene-unroll3", "plate 3 unrolling"],
  [2.9, "32-scene-paragraph", "the paragraph typing in place, last (ADR-103)"],
  [3.1, "33-scene-phases", "the phases whole — three plates, title and paragraph"],
  /* ADR-103: the outcomes. ⚠ Look at 34 for rings on the collapsing plates'
     travelling edge, at 36 for one material in flight, at 38 for the scan
     sweeping with its first callouts, at 41/42 for the feet at 720h. */
  [3.45, "34-scene-collapse", "the plates rolling back into their bands, the title decoding"],
  [3.66, "35-scene-bands", "three bands, the outcomes' title landed"],
  [3.9, "36-scene-stack", "the bands travelling to the rows, one material"],
  [4.25, "37-scene-stacked", "a list of three, all lit, the paragraph typing"],
  [4.6, "38-scene-step1", "row 1 open and filled, the packshot read on the dial"],
  [4.9, "39-scene-crossover", "one row closing as the next opens, both apertures crossing"],
  [5.15, "40-scene-step2", "row 2 open, the run travelling its four stations"],
  [5.65, "41-scene-step3", "row 3 open, the engagement arc running to its terminus"],
  [5.95, "42-scene-settled", "the scene settled — every figure on the dial finished"],
]) {
  await rollToS(sv);
  await page.waitForTimeout(200);
  await shoot(name, note);
}

for (const [id, name, note] of [
  ["flow", "43-offer-flow", "the offer — the pipeline: brief → renders → markets"],
  ["pricing", "44-offer-pricing", "the offer — the fee table beside its terms"],
]) {
  await rollTo(await topOf(id));
  await rollTo(await topOf(id));
  await page.waitForTimeout(1400);
  await shoot(name, note);
}

await rollTo(await topOf("contact"));
await shoot("13-contact", "the exit");

console.log(`\nwrote ${outDir}\n`);
await browser.close();
