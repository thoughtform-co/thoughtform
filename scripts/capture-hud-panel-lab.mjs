#!/usr/bin/env node
/**
 * capture-hud-panel-lab — the HUD panel lab's stills and its gates.
 *
 * Six directions x two surfaces x four viewports x two themes, plus the gate
 * walks that a still cannot show. What it asserts is not "does it look right"
 * but the handful of things this house has learned go wrong SILENTLY on these
 * two surfaces:
 *
 *   1  CLIP        a panel that outgrows its box, measured from the INK
 *                  (`scrollHeight` is `max(clientHeight, content)` on an
 *                  `overflow: hidden` box, so it reports 0 whenever content
 *                  fits AND whenever a centred box spills equally both ways)
 *   2  CONTAINMENT every era's four seats and the figure inside the frame box
 *   3  WIDE INK    the ADR-082 U21 sweep: nothing wider than the reading band
 *                  paints a border or a ground
 *   4  LADDER      no painted line's x-extent enters either rail box, and
 *                  nothing paints inside the right rail's telemetry rects
 *   5  TICKS       every drawn horizontal seam sits on a real `.hud__rail__tick`
 *   6  LEDGER      structure is dawn at the frame's own weights; gold only on
 *                  the listed marks
 *   7  TYPE        production chrome >= 8.5px, lab chrome >= 10px, no ordinal
 *   8  ERRORS      zero page errors, and the figure on its alpha branch
 *
 * ⚠ EVERY WAIT IS ON AN OBSERVABLE THE PAGE WROTE AFTER READING ITSELF —
 * `.hpl-read[data-stamp]` is stamped only after the live DOM is sampled. A
 * wait a script can satisfy by itself is not a wait (the substrate-lab
 * lesson): the first version of that harness gated one variant's numbers
 * against another variant's drawing and reported green.
 *
 * ⚠ `reducedMotion: "no-preference"` IS MANDATORY. PRM turns the casefile
 * into a static document, unwraps the console and collapses the map — three
 * surfaces this lab exists to look at.
 *
 * ⚠ THEME COMES FROM `?theme=`, NEVER `colorScheme`. This site's theme is a
 * pre-paint attribute; a context-level colour scheme captures dark twice and
 * reports a light pass that never happened.
 *
 * Usage:
 *   node scripts/capture-hud-panel-lab.mjs
 *   node scripts/capture-hud-panel-lab.mjs --s eras --v v2 --vp 1920x1247
 *   node scripts/capture-hud-panel-lab.mjs --headed --port 3003
 */

import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ARGS = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = ARGS.indexOf(`--${name}`);
  return i >= 0 && ARGS[i + 1] && !ARGS[i + 1].startsWith("--") ? ARGS[i + 1] : fallback;
};
const has = (name) => ARGS.includes(`--${name}`);

const PORT = flag("port", process.env.PORT || "3003");
const BASE = `http://localhost:${PORT}/test/hud-panel-lab`;
const OUT = join(process.cwd(), "docs/design/hud-panel-lab");

const SURFACES = flag("s") ? [flag("s")] : ["proof", "eras"];
const DIRECTIONS = flag("v") ? [flag("v")] : ["v0", "v1", "v2", "v3", "v4", "v5"];
const THEMES = flag("theme") ? [flag("theme")] : ["dark", "light"];
const VIEWPORTS = (
  flag("vp") ? [flag("vp")] : ["1280x720", "1440x800", "1920x1080", "1920x1247"]
).map((s) => {
  const [w, h] = s.split("x").map(Number);
  return { w, h, label: s };
});

/** The binding viewport — every per-era / per-row gate walk runs here. */
const BINDING = "1280x720";

/* The subjects are READ OFF THE PAGE, never hardcoded. Three of four track
   ids were guessed wrong on the first run and `parseHplQuery` silently fell
   back to row one, so four "different" rows shot the same still with every
   gate green — the exact shape of failure a lab exists to prevent. The ids
   live in one place; this asks that place. */
let ERAS = [];
let ROWS = [];

/** Noise a dev server produces that says nothing about the composition. */
const IGNORED = [
  /favicon/i,
  /Download the React DevTools/i,
  /react-refresh/i,
  /Fast Refresh/i,
  /ResizeObserver loop/i,
];

mkdirSync(OUT, { recursive: true });

/* ── The page-side probe ───────────────────────────────────────────────────
   One evaluate per sample. Everything it needs from the cascade it resolves
   through a throwaway element, because `getComputedStyle` on `:root` returns
   the UNRESOLVED `calc()` for a custom property — the reason the
   hud-instruments capture uses the same trick. */
function probe() {
  const px = (expr) => {
    const el = document.createElement("div");
    el.style.cssText = "position:absolute;visibility:hidden;padding-left:" + expr;
    document.body.appendChild(el);
    const v = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    el.remove();
    return v;
  };
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  };
  const alpha = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c || "");
    if (!m) return 0;
    const p = m[1].split(",").map((s) => parseFloat(s));
    return p.length > 3 ? p[3] : 1;
  };
  /** Is this colour on the GOLD side of the palette? Both themes keep gold at
   *  the same hue, so the red channel leading the blue by a wide margin is the
   *  honest test — a hex allow-list would miss every alpha of it. */
  const isGold = (c) => {
    const m = /rgba?\(([^)]+)\)/.exec(c || "");
    if (!m) return false;
    const [r, g, b] = m[1].split(",").map((s) => parseFloat(s));
    return r > 90 && r - b > 40 && r >= g;
  };

  const railY = px("var(--hud-rail-y-start)");
  const railBot = px(
    "max(calc(var(--hud-margin) + var(--hud-corner-zone) + clamp(16px,1.8vw,32px)), calc(var(--hud-margin) + clamp(44px,3.6vw,63px) + 8px))"
  );
  const contentInset = px("var(--hud-content-inset)");
  const instrumentInset = px("var(--instrument-inset, 0px)");
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const frame = { top: railY, bottom: vh - railBot, left: contentInset, right: vw - contentInset };
  /* ⚠ THE TWO SURFACES DO NOT SHARE A BAND, and using one for both reported
     "wide ink" on the CONTROL at 1920. The casefile sits on the INSTRUMENT
     band (`--instrument-inset` on top of the content inset, capped at 1440);
     the era stage builds its own reading band from `--vwd-pad-x`, which is
     the content inset alone — 1536 at 1920 wide. Each surface is measured
     against the band it is actually drawn on. */
  /* ⚠ AND `--vwd-pad-x` IS DECLARED ON `.vwd`, NOT ON `:root`, so the probe
     element above CANNOT resolve it — it came back 0, the band came back as
     the whole viewport, and every "wide ink" test on the era stage passed
     because nothing can be wider than everything. A guard measuring a MODEL
     of the drawing rather than the drawing, in this file, on its first run.
     The stage's own resolved padding is the band. */
  /* ⚠ AND IT IS THE STATION'S BAND, NOT THE DIRECTION'S. A direction that
     moves its content inboard to make room for a housing must not thereby
     narrow the wall the sweep measures it against — that would let any
     enclosure pass by simply pushing its own contents in. The band is the
     one production derives: `max(clamp(20px, 4vw, 72px), --hud-content-inset)`,
     both terms resolvable on `:root`. */
  const isEras = !!document.querySelector(".vwd__stage");
  const bandLeft = isEras
    ? px("max(clamp(20px, 4vw, 72px), var(--hud-content-inset, 161px))")
    : contentInset + instrumentInset;
  const bandWidth = vw - 2 * bandLeft;

  const rails = [...document.querySelectorAll(".hud__rail")].map(box);
  const teles = [...document.querySelectorAll(".rin-tele")].map(box);
  const ticks = [...document.querySelectorAll(".hud__rail--l .hud__rail__tick")].map(
    (t) => t.getBoundingClientRect().y
  );

  const surface = document.querySelector(".hpl-stage");
  /* ⚠ THE PAGE'S OWN GROUND IS NOT A LINE IN THE COMPOSITION. The lab's stage
     and its surface roots paint the void the landing gets from the corridor,
     and a sweep that counts them reports "wide ink" on the control. The
     landing's own U21 test scopes itself to descendants of the station for
     the same reason. */
  const CONTAINERS =
    ".hpl-stage,.hpl-runway,.hpl-eras,.hpl-stationbox,.hpl-proof-stage,.services-stage,.vwd,.vwd__sheet,.hpl__hud,.hud";
  const nodes = surface
    ? [...surface.querySelectorAll("*")].filter((el) => !el.matches(CONTAINERS))
    : [];

  /* 1 — CLIP, measured from the INK. A Range over the box's text gives the
     real bottom of what is drawn; `scrollHeight` cannot, on an
     `overflow: hidden` box that fits OR on a centred box that spills equally
     through both edges (which reports exactly zero). */
  const inkBottom = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rs = [...range.getClientRects()];
    if (range.detach) range.detach();
    if (!rs.length) return null;
    return Math.max.apply(
      null,
      rs.map((r) => r.bottom)
    );
  };
  const clipSel = ".fl-brief,.fl-proof-register,.fl-dir,.fl-panel__viz,.vwd__head,.vwd__body";
  const clips = [];
  for (const el of surface ? surface.querySelectorAll(clipSel) : []) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const ib = inkBottom(el);
    clips.push({
      sel: el.className.split(" ")[0] + (el.dataset.cell ? "[" + el.dataset.cell + "]" : ""),
      over: el.scrollHeight - el.clientHeight,
      foot: ib === null ? null : Math.round((r.bottom - ib) * 10) / 10,
      inViewport: r.top >= -1 && r.bottom <= vh + 1,
    });
  }

  /* 2 — CONTAINMENT inside the frame box. */
  const contained = [];
  for (const el of surface
    ? surface.querySelectorAll(".vwd__body,.vwh__slot,.fl-panel__viz")
    : []) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    /* ⚠ THE ERA STAGE IS A FULL-HEIGHT INSTRUMENT AND ITS SEATS LEGITIMATELY
       RUN BELOW THE RAIL'S LAST TICK — the reel sits at the very foot of the
       viewport by design. Only the casefile's own panel is bound to the rail
       box, because `--fl-panel-end` says so in as many words ("stopping at the
       tick is what keeps the console off the bottom-right cluster"). Gating
       both the same way failed the control, which is the tell. */
    const railBound = el.classList.contains("fl-panel__viz");
    const bottom = railBound ? frame.bottom : vh;
    const top = railBound ? frame.top : 0;
    contained.push({
      sel: el.className.split(" ")[0] + (el.dataset.cell ? "[" + el.dataset.cell + "]" : ""),
      ok:
        r.left >= frame.left - 1 &&
        r.right <= frame.right + 1 &&
        r.top >= top - 1 &&
        r.bottom <= bottom + 1,
      box: {
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
      },
    });
  }

  /* 3, 4, 5, 6 — one walk over everything that PAINTS. */
  const wide = [];
  const crossing = [];
  const seams = [];
  const ledger = [];
  const teleProd = [];
  let paints = 0;
  /* ⚠ THE LEDGER IS TARGETED, NOT A SWEEP. The claim this pass makes is about
     FOUR structure lines: the proof register's row rules, the directory's row
     rule, the column split, and the era heads' rule. Everything else that
     paints gold on these surfaces — the lit tab, the travelling spine, the
     station diamonds, the row glyphs, every plate's own interior — is a MARK
     or is out of this pass's scope, and gating it would fail the control for
     being the thing the control is. */
  const LEDGER_SEL = [
    ".fl-proof-register__item",
    ".fl-dir__list li + li .fl-row",
    ".fl-split",
    ".vwd__head",
  ].join(",");
  for (const el of nodes) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const sides = ["Top", "Right", "Bottom", "Left"].map((s) => ({
      s,
      w: parseFloat(cs["border" + s + "Width"]) || 0,
      c: cs["border" + s + "Color"],
      style: cs["border" + s + "Style"],
    }));
    const painted = sides.filter((b) => b.style !== "none" && b.w > 0 && alpha(b.c) > 0);
    const bg = alpha(cs.backgroundColor) > 0 || cs.backgroundImage !== "none";
    if (!painted.length && !bg) continue;
    paints++;

    const cls =
      el.className && typeof el.className === "string"
        ? el.className.split(" ")[0]
        : el.tagName.toLowerCase();

    /* 3 — nothing wider than the reading band may paint a border or a ground
       (the ADR-082 U21 sweep, scoped to this lab's surface). */
    if (r.width > bandWidth + 3)
      wide.push({ cls, w: Math.round(r.width), band: Math.round(bandWidth) });

    /* 4 — nothing painted may enter a rail's box or a telemetry readout. */
    for (const rail of rails) {
      if (r.right > rail.x + 1 && r.left < rail.x + rail.w - 1) {
        crossing.push({ cls, x: Math.round(r.x), w: Math.round(r.width) });
        break;
      }
    }
    /* ⚠ THE TELEMETRY OVERLAP IS SCOPED TO THE LAB'S OWN CHROME. Production
       already paints under those readouts at 1280x720 — the console's right
       edge is the band's, and the right rail's three readouts extend ~16px
       INSIDE it — so gating every node here would fail `v0`, which is the
       control. What the lab controls is what the lab is answerable for; the
       production overlap is reported as `teleProd` instead. */
    const labChrome = !!(el.dataset && el.dataset.hplChrome);
    /* ⚠ A GROUND UNDER A READOUT IS A DEFECT; A HAIRLINE BEHIND ONE IS NOT.
       A band-width enclosure cannot avoid the right rail's three readouts
       without ceasing to be band-width — production's own console already
       runs under them — so what is gated is a painted GROUND, which is what
       actually costs a readout its legibility. A border crossing behind is
       reported for the owner instead. */
    /* ⚠ THE THRESHOLD IS 0.5, AND IT IS A PROXY THAT SAYS SO. What actually
       costs a readout its legibility is the COMPOSITED contrast behind it, and
       that cannot be settled in a lab whose background is void — the question
       is what the corridor looks like through the glass. `--con-ground` 0.86
       is the value this house tuned by eye for a panel that must hold copy, so
       half of it is the line between a pane and a tint: at 0.42 over void the
       luminance shift behind a dawn readout is under 2%. Anything opaque
       enough to be a slab still fails. */
    const groundy = alpha(cs.backgroundColor) > 0.5;
    for (const t of teles) {
      if (r.right > t.x && r.left < t.x + t.w && r.bottom > t.y && r.top < t.y + t.h) {
        if (labChrome && groundy)
          crossing.push({ cls, over: "telemetry ground", x: Math.round(r.x) });
        else teleProd.push(cls + (labChrome ? " (lab, line only)" : ""));
        break;
      }
    }

    /* 5 — a datum the lab draws must sit on a real tick. */
    const kind = el.dataset ? el.dataset.hplChrome : null;
    if (kind === "seam" || kind === "stub") {
      const y = r.y + r.height / 2;
      const near = ticks.length
        ? Math.min.apply(
            null,
            ticks.map((t) => Math.abs(t - y))
          )
        : 999;
      seams.push({
        kind,
        at: el.dataset.at || el.dataset.tick || "",
        y: Math.round(y),
        off: Math.round(near * 10) / 10,
      });
    }

    /* 6 — the ledger: on the four lines this pass claims, structure is dawn. */
    if (el.matches(LEDGER_SEL)) {
      /* ⚠ BORDERS ONLY. The selected directory row is INVERSE VIDEO — a solid
         gold ground — and that is the lit mark, not the structure between
         rows. The claim this pass makes is about the RULES. */
      for (const b of painted) {
        if (isGold(b.c)) ledger.push({ cls, side: b.s, colour: b.c });
      }
    }
  }

  /* 7 — TYPE floors, and no ordinal in the lab's own chrome. */
  const type = [];
  let ordinal = null;
  for (const el of nodes) {
    if (el.closest(".hpl-console") || el.closest(".hpl-gate-warn")) continue;
    const text = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join("");
    if (!text) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const size = parseFloat(getComputedStyle(el).fontSize);
    const isLab = !!el.closest("[data-hpl-chrome]");
    const floor = isLab ? 10 : 8.5;
    if (size < floor - 0.05) {
      type.push({
        cls: String(el.className || el.tagName).split(" ")[0],
        size: Math.round(size * 10) / 10,
        floor,
        text: text.slice(0, 22),
      });
    }
    if (isLab && /\b\d{2}\s*\/\s*\d{2}\b/.test(text)) ordinal = text.slice(0, 40);
  }

  const slot = document.querySelector(".vwh__slot");
  return {
    frame,
    bandLeft: Math.round(bandLeft),
    bandWidth: Math.round(bandWidth),
    clips,
    contained,
    wide,
    crossing,
    seams,
    ledger,
    teleProd,
    type,
    ordinal,
    paints,
    sector: (document.querySelector(".hud__nav__sector__name") || {}).textContent || "",
    sectorA11y: (document.querySelector(".hud__nav .visually-hidden") || {}).textContent || "",
    holoAlpha: slot ? slot.hasAttribute("data-holo-alpha") : null,
    holoPhase: slot ? slot.dataset.phase : null,
    stamp: (document.querySelector(".hpl-read") || { dataset: {} }).dataset.stamp || "",
  };
}

/* ── Runner ─────────────────────────────────────────────────────────────── */

const report = [];
const failures = [];

function url({ s, v, theme, era, row }) {
  const q = new URLSearchParams({ s, v, theme, console: "0" });
  if (era) q.set("era", era);
  if (row) q.set("row", row);
  return `${BASE}?${q}`;
}

async function settle(page, wantStamp) {
  await page.waitForFunction(
    (want) => {
      const el = document.querySelector(".hpl-read");
      return !!el && el.dataset.stamp && el.dataset.stamp.startsWith(want);
    },
    wantStamp,
    { timeout: 15000 }
  );
  // The nav corner's readout decodes over ~0.5s; a still shot mid-decode
  // shows noise where the instrument's own label belongs.
  await page
    .waitForFunction(
      () => {
        const t = document.querySelector(".hud__nav__sector__name")?.textContent || "";
        return /^(PROOF|VOIDWALKER|SERVICES|ABOUT|HOME|THESIS|ARC|PRACTICE|CONTACT)$/.test(
          t.trim()
        );
      },
      undefined,
      { timeout: 6000 }
    )
    .catch(() => {});
  // A paused video at frame 0 is the only reproducible frame of a loop.
  await page.evaluate(() => {
    for (const v of document.querySelectorAll("video")) {
      try {
        v.pause();
        v.currentTime = 0;
      } catch {}
    }
  });
}

const browser = await chromium.launch({ headless: !has("headed") });

{
  const boot = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  const page = await boot.newPage();
  await page.goto(`${BASE}?s=proof&v=v0&console=1`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".fl-row", { timeout: 20000 });
  ROWS = await page.evaluate(() =>
    [...document.querySelectorAll(".fl-dir__list [role='tab']")].map((b) =>
      b.id.replace(/^[^-]+-[^-]+-row-|^.*?-row-/, "")
    )
  );
  await page.goto(`${BASE}?s=eras&v=v0&console=1`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".vwd__chip", { timeout: 20000 });
  ERAS = await page.evaluate(() =>
    [...document.querySelectorAll("[data-vwh-era-tab]")].map((b) => b.dataset.vwhEraTab)
  );
  await boot.close();
  if (!ROWS.length || !ERAS.length) {
    console.error("Could not read the subjects off the page — is the dev server on " + PORT + "?");
    process.exit(1);
  }
  console.log(`subjects · rows: ${ROWS.join(", ")}`);
  console.log(`subjects · eras: ${ERAS.join(", ")}`);
}

for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const t = m.text();
      if (!IGNORED.some((re) => re.test(t))) errors.push(t);
    });

    for (const s of SURFACES) {
      for (const v of DIRECTIONS) {
        const isBinding = vp.label === BINDING && theme === "dark";
        // The gate WALK runs at the binding viewport only; every other cell
        // shoots its default subject. Walking all five eras at all eight
        // shapes buys the same information eight times.
        const subjects = isBinding
          ? s === "eras"
            ? ERAS.map((era) => ({ era }))
            : ROWS.map((row) => ({ row }))
          : [s === "eras" ? { era: "azeroth" } : { row: ROWS[0] }];

        for (let i = 0; i < subjects.length; i++) {
          const subject = subjects[i];
          const target = url({ s, v, theme, ...subject });
          await page.goto(target, { waitUntil: "domcontentloaded" });
          const want = `${s}|${v}|${theme}|${subject.era ?? "loop"}|${subject.row ?? ROWS[0]}`;
          try {
            await settle(page, s === "eras" ? `${s}|${v}|${theme}|${subject.era}` : want);
          } catch (e) {
            failures.push(
              `${s}/${v}/${vp.label}/${theme}: never settled (${String(e).slice(0, 80)})`
            );
            continue;
          }

          const p = await page.evaluate(probe);

          // Shoot the first subject of every cell; the walk's other subjects
          // are measured, not photographed.
          if (i === 0) {
            const name = `${s}_${v}_${vp.label}_${theme}.png`;
            await page.screenshot({ path: join(OUT, name), animations: "disabled" });
          }

          const id = `${s}/${v}/${vp.label}/${theme}${subject.era ? "/" + subject.era : subject.row && isBinding ? "/" + subject.row : ""}`;
          const bad = [];
          for (const c of p.clips) {
            if (c.over > 1) bad.push(`clip ${c.sel} over ${c.over}`);
            /* ⚠ A RANGE MEASURES THE LINE BOX, NOT THE GLYPH. A line box runs
               ~1.3em while the ink sits ~0.77em above the baseline, so a few
               px of "spill" is the descender allowance and not a clip. The
               tolerance is set at 8px, which still fails the tens-of-pixels
               overflow this gate exists for, and the number is printed in the
               table either way. */
            if (c.foot !== null && c.foot < -8) bad.push(`ink spill ${c.sel} ${c.foot}`);
          }
          for (const c of p.contained) if (!c.ok) bad.push(`outside frame ${c.sel}`);
          for (const w of p.wide) bad.push(`wide ink ${w.cls} ${w.w}>${w.band}`);
          for (const c of p.crossing) bad.push(`ladder ${c.cls}${c.over ? " over " + c.over : ""}`);
          for (const t of p.type) bad.push(`type ${t.cls} ${t.size}<${t.floor}`);
          /* ⚠ ON `v0` THE GOLD IS THE FINDING, NOT THE FAILURE. The control's
             register rules, directory rule and column split ARE gold — that is
             the defect this lab documents — so the count is REPORTED there and
             asserted zero on every direction that claims the ladder. */
          if (v !== "v0") for (const l of p.ledger) bad.push(`gold structure ${l.cls} ${l.side}`);
          if (p.ordinal) bad.push(`ordinal "${p.ordinal}"`);
          /* ⚠ A STUB CLAIMS A TICK; A SEAM DOES NOT. The datum stubs exist to
             say "this rung of the rail's ladder", so being off one is the
             whole failure. The record column's own seams sit where the
             composition divides — tick 6 for the brief/register seam, and no
             tick at all under the register, because there is none there. The
             offsets are reported so a drift in the ladder itself still shows
             up (`.claude/rules/proof.md`: that drift is the only way this
             design fails silently). */
          for (const sm of p.seams) {
            if (sm.kind === "stub" && sm.off > 1.5)
              bad.push(`stub ${sm.at} ${sm.off}px off its tick`);
          }
          if (s === "eras" && p.holoAlpha === false) bad.push("figure on the FLOOR branch");
          if (errors.length) bad.push(`errors: ${errors.slice(0, 2).join(" | ")}`);

          const minFoot = p.clips
            .filter((c) => c.foot !== null)
            .reduce((m, c) => Math.min(m, c.foot), Infinity);
          report.push({
            id,
            paints: p.paints,
            band: p.bandWidth,
            sector: p.sector || p.sectorA11y,
            foot: Number.isFinite(minFoot) ? minFoot : null,
            gold: p.ledger.length,
            teleProd: p.teleProd.length,
            seams: p.seams.map((x) => `${x.kind}:${x.at}@${x.off}`).join(" "),
            bad,
          });
          if (bad.length) failures.push(`${id}: ${bad.join("; ")}`);
          errors.length = 0;
        }
      }
    }
    await ctx.close();
  }
}

await browser.close();

/* ── Report ─────────────────────────────────────────────────────────────── */

const pad = (s, n) =>
  String(s ?? "")
    .padEnd(n)
    .slice(0, n);
console.log("");
console.log(
  pad("cell", 44) +
    pad("band", 6) +
    pad("corner", 11) +
    pad("foot", 7) +
    pad("gold", 6) +
    pad("datums", 30) +
    "verdict"
);
console.log("-".repeat(130));
for (const r of report) {
  console.log(
    pad(r.id, 44) +
      pad(r.band, 6) +
      pad(r.sector, 11) +
      pad(r.foot, 7) +
      pad(r.gold, 6) +
      pad(r.seams, 30) +
      (r.bad.length ? "FAIL " + r.bad[0] : "ok")
  );
}
console.log("");
writeFileSync(join(OUT, "report.json"), JSON.stringify({ report, failures }, null, 2));

if (failures.length) {
  console.log(`${failures.length} gate failure(s):`);
  for (const f of failures) console.log("  - " + f);
  process.exitCode = 1;
} else {
  console.log(`All gates green across ${report.length} cells. Stills in ${OUT}`);
}
