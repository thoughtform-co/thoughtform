/**
 * capture-client-stack — drives `/test/client-stack-lab`, MEASURES the seam's
 * two clocks against the panels they gate, and captures the review stills.
 *
 * The substrate-lab script, one surface over. What is worth restating:
 *
 * HEADLESS ON PURPOSE — the lab is parked DOM with no corridor and no WebGL,
 * so a headless context is honest here.
 *
 * ⚠ `reducedMotion` MUST BE "no-preference", AND THE VIEWPORT ≥ 961px WIDE.
 * `SERVICES_SCROLL_OWNED_MEDIA` is the only tier in which the casefile's spy
 * reads the browse channel; below it the surface is a static document and
 * every frame would be the same picture of client one.
 *
 * ⚠ THE WAIT IS ON A STAMP THE PAGE WRITES AFTER READING ITSELF. The lab's
 * readout samples the LIVE DOM two rAFs after each channel write — which tab
 * carries `data-on`, which row does — and only then stamps
 * `seam|bias|replay|t`. So a satisfied wait means the shipped component has
 * committed its own client/row decision, not merely that the script's own
 * input landed (the substrate-lab lesson: a wait a script can satisfy itself
 * is not a wait).
 *
 * ⚠ ONE NAVIGATION PER GROUP, then the lab handle. A decode REPLAY only
 * happens when the slug changes while the component stays MOUNTED — the
 * reveal's first sync settles silently by contract — so a script that
 * re-navigated per frame could never photograph the thing it is testing.
 *
 * Usage (dev server must already be running):
 *   node scripts/capture-client-stack.mjs [--port 3003] [--out docs/design/client-stack]
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/client-stack");

/** The three reference viewports this surface is authored and judged at. */
const VIEWPORTS = [
  { id: "1280x720", width: 1280, height: 720 },
  { id: "1440x800", width: 1440, height: 800 },
  { id: "1920x1080", width: 1920, height: 1080 },
];
const THEMES = ["dark", "light"];
/** Seam-local crossings. 0.5 is the swap midpoint, where both clocks are 0. */
const SEAM_STOPS = [0.15, 0.35, 0.5, 0.65, 0.85];
/** What ships. The matrix runs at this length only. */
const SHIPPED_SEAM = 0.5;
/** The comparison row — one viewport, one theme, bias off. */
const SEAM_LENGTHS = [0.3, 0.5, 0.8];

/** A benign, site-wide report-only CSP notice — not this route's doing. */
const IGNORED_ERROR = /upgrade-insecure-requests' is ignored when delivered in a report-only/;

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const errors = [];
const note = (t) => !IGNORED_ERROR.test(t) && errors.push(t);

/** Hide the console chrome so a still is the surface, not the harness. The
 *  numbers it prints go to the report table instead. */
const HIDE_CONSOLE = `.csl-console, .csl-gate-warn { display: none !important; }`;

const rows = [];
const replayRows = [];

/**
 * What the frame actually paints, read off computed style. This is the
 * measurement the stills cannot make: whether the FOUR marked panels are at
 * zero while the HOUSING is at one.
 */
async function readFrame(page) {
  return page.evaluate(() => {
    const host = document.querySelector(".fl-case");
    const read = document.querySelector(".csl-read");
    const g = (k) => read?.getAttribute(`data-${k}`) ?? "";
    const op = (el) => Number.parseFloat(getComputedStyle(el).opacity);
    const marked = Array.from(host.querySelectorAll("[data-fl-panel][data-fl-client-panel]"));
    const housing = Array.from(host.querySelectorAll("[data-fl-panel]")).filter(
      (el) => !el.hasAttribute("data-fl-client-panel")
    );
    const label = (el) =>
      el.classList.contains("fl-brief")
        ? "brief"
        : el.classList.contains("fl-proof-register")
          ? "register"
          : el.classList.contains("fl-dir")
            ? "directory"
            : el.classList.contains("fl-panel__viz")
              ? "visual"
              : el.classList.contains("fl-split")
                ? "split"
                : el.classList.contains("fl-ret")
                  ? "reticle"
                  : "chrome";
    return {
      t: g("t"),
      seamT: g("seam-t"),
      clientIn: Number.parseFloat(g("client-in") || "1"),
      clientOut: Number.parseFloat(g("client-out") || "0"),
      tab: g("tab"),
      row: g("row"),
      marked: marked.map((el) => ({ name: label(el), opacity: op(el) })),
      housing: housing.map((el) => ({ name: label(el), opacity: op(el) })),
    };
  });
}

/** Set the browse fraction through the lab handle and WAIT FOR THE PAGE to
 *  say it has re-read itself at that value. */
async function driveTo(page, t, stampPrefix) {
  await page.evaluate((v) => window.__clientStackLab.setT(v), t);
  await page.waitForFunction(
    (want) => document.querySelector(".csl-read")?.getAttribute("data-stamp") === want,
    `${stampPrefix}|${t.toFixed(4)}`,
    { timeout: 15_000 }
  );
}

async function openLab(vp, theme, { seam, bias, replay }) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    reducedMotion: "no-preference",
    colorScheme: theme === "light" ? "light" : "dark",
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => note(String(e)));
  page.on("console", (m) => m.type() === "error" && note(m.text()));
  const q = `seam=${seam}&bias=${bias ? 1 : 0}&replay=${replay ? 1 : 0}&t=0&theme=${theme}`;
  await page.goto(`http://localhost:${PORT}/test/client-stack-lab?${q}`, {
    waitUntil: "domcontentloaded",
  });
  /* ⚠ WAIT FOR THE PREFIX, NOT MERELY FOR A STAMP. The lab SSRs its defaults
     and adopts the URL in a mount effect (never `useSearchParams`, which
     bails the route out to CSR), so "a stamp exists" is satisfied by the
     DEFAULT seam length one frame before the requested one lands — and
     `seamBand()` would then hand back the wrong band. Same defect the
     substrate lab's `data-stamp` was introduced to close. */
  const prefix = `${seam}|${bias ? 1 : 0}|${replay ? 1 : 0}`;
  await page.waitForFunction(
    (want) =>
      Boolean(window.__clientStackLab) &&
      (document.querySelector(".csl-read")?.getAttribute("data-stamp") ?? "").startsWith(
        `${want}|`
      ),
    prefix,
    { timeout: 30_000 }
  );
  await page.addStyleTag({ content: HIDE_CONSOLE });
  const band = await page.evaluate(() => ({
    seam: window.__clientStackLab.seamBand(),
    rest: [window.__clientStackLab.restAt(0), window.__clientStackLab.restAt(1)],
  }));
  return { ctx, page, band, prefix };
}

/* ── The matrix: 7 positions × 3 viewports × 2 themes × bias off/on ─────── */
for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    for (const bias of [false, true]) {
      const cfg = { seam: SHIPPED_SEAM, bias, replay: true };
      const { ctx, page, band, prefix } = await openLab(vp, theme, cfg);
      const stops = [
        { label: "rest01", t: band.rest[0] },
        ...SEAM_STOPS.map((s) => ({
          label: `s${String(s.toFixed(2)).replace(".", "")}`,
          t: band.seam.start + s * (band.seam.end - band.seam.start),
        })),
        { label: "rest02", t: band.rest[1] },
      ];
      for (const stop of stops) {
        const before = errors.length;
        await driveTo(page, stop.t, prefix);
        const frame = await readFrame(page);
        rows.push({
          vp: vp.id,
          theme,
          bias: bias ? "on" : "off",
          seam: SHIPPED_SEAM,
          stop: stop.label,
          ...frame,
          errors: errors.length - before,
        });
        await page.screenshot({
          path: `${OUT}/${vp.id}_${theme}_bias-${bias ? "on" : "off"}_${stop.label}.png`,
          animations: "disabled",
        });
      }
      await ctx.close();
    }
  }
}

/* ── The seam-length comparison row: 1440×800, dark, bias off ───────────── */
const cmpVp = VIEWPORTS[1];
for (const seam of SEAM_LENGTHS) {
  const { ctx, page, band, prefix } = await openLab(cmpVp, "dark", {
    seam,
    bias: false,
    replay: true,
  });
  for (const s of SEAM_STOPS) {
    const t = band.seam.start + s * (band.seam.end - band.seam.start);
    await driveTo(page, t, prefix);
    const frame = await readFrame(page);
    rows.push({
      vp: cmpVp.id,
      theme: "dark",
      bias: "off",
      seam,
      stop: `s${String(s.toFixed(2)).replace(".", "")}`,
      ...frame,
      errors: 0,
    });
    await page.screenshot({
      path: `${OUT}/seamlen-${seam}_${cmpVp.id}_dark_s${String(s.toFixed(2)).replace(".", "")}.png`,
      animations: "disabled",
    });
  }
  await ctx.close();
}

/* ── Decode replay: does the incoming client's copy actually decode? ─────
   A still cannot answer this on its own — the scramble is rAF-driven text
   with a ~0.33s life, so a screenshot is a lottery ticket. The measurement
   is the answer and the stills are the evidence: cross the swap, then poll
   the tab names for 600ms and record whether any of them was ever something
   OTHER than its own `data-fl-text`. Off ⇒ never; on ⇒ at least once. */
for (const replay of [true, false]) {
  const { ctx, page, band, prefix } = await openLab(cmpVp, "dark", {
    seam: SHIPPED_SEAM,
    bias: false,
    replay,
  });
  // Park just BEFORE the swap window so the identity is still client one.
  await driveTo(page, band.seam.start + 0.3 * (band.seam.end - band.seam.start), prefix);
  const swapT = band.seam.start + 0.62 * (band.seam.end - band.seam.start);
  const probe = await page.evaluate(
    async ({ v, ms }) => {
      const names = () =>
        Array.from(document.querySelectorAll(".fl-tabs__name")).map((el) => ({
          want: el.getAttribute("data-fl-text") ?? "",
          got: el.textContent ?? "",
        }));
      const before = names().map((n) => n.got);
      window.__clientStackLab.setT(v);
      let scrambledFrames = 0;
      const t0 = performance.now();
      while (performance.now() - t0 < ms) {
        if (names().some((n) => n.got !== n.want)) scrambledFrames += 1;
        await new Promise((r) => requestAnimationFrame(r));
      }
      return { before, scrambledFrames, after: names() };
    },
    { v: swapT, ms: 600 }
  );
  await driveTo(page, swapT, prefix);
  const frame = await readFrame(page);
  replayRows.push({ replay, scrambledFrames: probe.scrambledFrames, tab: frame.tab });
  // A mid-decode still, taken on a SECOND crossing so the frame is honest
  // about what a reader sees rather than about what the poll left behind.
  await driveTo(page, band.seam.start + 0.3 * (band.seam.end - band.seam.start), prefix);
  await page.evaluate((v) => window.__clientStackLab.setT(v), swapT);
  await page.waitForTimeout(110);
  await page.screenshot({
    path: `${OUT}/replay-${replay ? "on" : "off"}_${cmpVp.id}_dark_mid-decode.png`,
    animations: "disabled",
  });
  await ctx.close();
}

/* ── The blank stretch ──────────────────────────────────────────────────
   THE MEASUREMENT NO STILL MAKES. The fold reaches zero exactly at the
   midpoint (`--co` saturates when `--svc-client-out` hits 1) but the arrival
   cannot START until the composed clock clears the SMALLEST `--ci-off` on the
   four marked panels — so there is a stretch after the swap in which the
   housing stands over nothing. This sweeps the seam and reports its bounds. */
const blank = [];
{
  const { ctx, page, band, prefix } = await openLab(cmpVp, "dark", {
    seam: SHIPPED_SEAM,
    bias: false,
    replay: true,
  });
  for (let i = 30; i <= 90; i += 1) {
    const local = i / 100;
    const t = band.seam.start + local * (band.seam.end - band.seam.start);
    await driveTo(page, t, prefix);
    const frame = await readFrame(page);
    blank.push({
      local,
      maxMarked: Math.max(...frame.marked.map((p) => p.opacity)),
      minHousing: Math.min(...frame.housing.map((p) => p.opacity)),
    });
  }
  await ctx.close();
}

await browser.close();

/* ── Report ─────────────────────────────────────────────────────────────── */
const pad = (x, n) =>
  String(x ?? "")
    .padEnd(n)
    .slice(0, n);

/* ⚠ PRINT THE LEADING DIGIT. The first cut wrote `.toFixed(2).slice(1)` for a
   tidy `.24`, which renders 1.00 and 0.00 as the SAME STRING — so the whole
   first run's table said every panel was blank at rest and the summary line
   said the opposite. A formatter that cannot distinguish the two ends of the
   range it reports is not a compact one, it is a broken one. */
const opsOf = (list) => list.map((p) => `${p.name[0]}${p.opacity.toFixed(2)}`).join(" ");

console.log(
  [
    pad("viewport", 10),
    pad("theme", 6),
    pad("bias", 5),
    pad("seam", 5),
    pad("stop", 7),
    pad("in", 6),
    pad("out", 6),
    pad("tab", 9),
    pad("row", 22),
    pad("marked (b/r/d/v)", 26),
    pad("housing", 20),
    "err",
  ].join(" ")
);
for (const r of rows) {
  console.log(
    [
      pad(r.vp, 10),
      pad(r.theme, 6),
      pad(r.bias, 5),
      pad(r.seam, 5),
      pad(r.stop, 7),
      pad(r.clientIn.toFixed(3), 6),
      pad(r.clientOut.toFixed(3), 6),
      pad(r.tab, 9),
      pad(r.row, 22),
      pad(opsOf(r.marked), 26),
      pad(opsOf(r.housing), 20),
      r.errors,
    ].join(" ")
  );
}

/* The one assertion this script exists to make: at the swap midpoint the four
   marked panels paint NOTHING and the housing paints in full. */
const mids = rows.filter((r) => r.stop === "s050");
const midMarked = Math.max(...mids.flatMap((r) => r.marked.map((p) => p.opacity)));
const midHousing = Math.min(...mids.flatMap((r) => r.housing.map((p) => p.opacity)));
console.log("");
console.log(
  `swap midpoint (${mids.length} frames): marked max opacity ${midMarked.toFixed(4)} ` +
    `(want 0) · housing min opacity ${midHousing.toFixed(4)} (want 1)`
);

const dark = blank.filter((b) => b.maxMarked < 0.005);
console.log("");
if (dark.length) {
  console.log(
    `blank stretch (seam ${SHIPPED_SEAM}, 1440x800): seam t ` +
      `${dark[0].local.toFixed(2)} → ${dark[dark.length - 1].local.toFixed(2)} ` +
      `(${((dark[dark.length - 1].local - dark[0].local + 0.01) * 100).toFixed(0)}% of the seam) ` +
      `· housing min opacity across it ${Math.min(...dark.map((b) => b.minHousing)).toFixed(3)}`
  );
} else {
  console.log(`blank stretch (seam ${SHIPPED_SEAM}, 1440x800): none — something always paints`);
}

console.log("");
console.log("decode replay probe (1440x800, dark, seam 0.5):");
for (const r of replayRows) {
  console.log(
    `  replay ${r.replay ? "ON " : "OFF"} · frames with scrambled tab copy: ${r.scrambledFrames} · settled tab: ${r.tab}`
  );
}

if (errors.length) {
  console.log("");
  console.log(`page errors: ${errors.length}`);
  for (const e of errors.slice(0, 8)) console.log(`  ${e}`);
}
