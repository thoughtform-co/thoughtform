/**
 * probe-mobile-deck — the phone's deck flip, measured (ADR-115).
 *
 * On the ring rung the services band's copy UN-TYPES over the band's exit
 * while the four cards STACK, `#about` is a sticky band welded to the
 * band's release, the deck FLIPS to the portrait on the about clock, the name
 * and the first paragraph decode in, a chevron discloses the rest, and at the
 * runway's end the WebGL portrait hands over to a DOM image of the same bake.
 * This walks all of it at a few phone shapes, prints the stamps at each stop
 * and shoots a still per stop; it fails loudly on the contracts the smoke
 * cannot read (the weld's arithmetic, the handover's pixels, the frame
 * deltas over the exit and the flip).
 *
 * ⚠ CHROMIUM IS NOT iOS (ADR-113's own caveat): the units are one number
 * here and the device is the other half. ⚠ HEADED BY DEFAULT — the corridor
 * is WebGL and the stills are the owner's read; `--headless` runs
 * SwiftShader.
 *
 *   node scripts/probe-mobile-deck.mjs --theme dark
 *   node scripts/probe-mobile-deck.mjs --theme light --shapes 390x844,430x932,390x745
 */
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "@playwright/test";

const require = createRequire(import.meta.url);
let sharp = null;
try {
  sharp = require("sharp");
} catch {
  sharp = null;
}

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const THEME = argOf("--theme", "dark");
const PORT = argOf("--port", "3003");
const SHAPES = argOf("--shapes", "390x844,430x932,390x745")
  .split(",")
  .map((s) => s.split("x").map(Number));
const OUT_BASE = argOf("--out", ".cursor/mobile-deck");
const HEADLESS = args.includes("--headless");
/* The band's leave (ringMath `RING_MOBILE_LEAVE_START`) and the about band's
   reading state (`ABOUT_BAND_READ`) — restated here as a reading, and the
   probe prints the page's own values beside them. */
const LEAVE = 0.73;
/* ADR-115 U2: the reading seat is the EXPANDED state; the flip's end is the
   folded one. */
const READ = 0.7;
const COVER = 0.26;

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.log(`  ✘ ${msg}`);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

const browser = await chromium.launch({
  headless: HEADLESS,
  ...(HEADLESS ? { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } : {}),
});

for (const [w, h] of SHAPES) {
  const out = `${OUT_BASE}/${THEME}-${w}x${h}`;
  mkdirSync(out, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    reducedMotion: "no-preference",
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/${THEME === "light" ? "?theme=light" : ""}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("#voidwalker[data-vw-surface]", { timeout: 60_000 });
  await page.waitForTimeout(800);

  const settle = (cap = 1600) =>
    page.evaluate(
      (c) =>
        new Promise((resolve) => {
          const t0 = performance.now();
          let last = scrollY;
          let still = 0;
          const tick = () => {
            still = Math.abs(scrollY - last) < 0.5 ? still + 1 : 0;
            last = scrollY;
            if (still >= 6 || performance.now() - t0 > c)
              resolve(Math.round(performance.now() - t0));
            else requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
      cap
    );
  const roll = async (y) => {
    await page.evaluate(async (t) => {
      const step = Math.max(300, innerHeight * 0.5);
      let a = scrollY;
      while (Math.abs(t - a) > step) {
        a += Math.sign(t - a) * step;
        scrollTo(0, a);
        await new Promise((r) => requestAnimationFrame(r));
      }
      scrollTo(0, t);
    }, y);
    await page.waitForTimeout(200);
    await settle();
  };
  const vh = await page.evaluate(() => document.documentElement.clientHeight);

  /* Seat the SERVICES band at fraction `f` of its own scroll, converging.
     Returns where it LANDED — a landing that will not converge is the snap
     doing its work (a stop near a seat is pulled onto it), and the reading
     is the landing, not a miss. */
  const seatBand = async (f) => {
    let landed = NaN;
    for (let pass = 0; pass < 4; pass += 1) {
      const target = await page.evaluate((frac) => {
        const el = document.querySelector(".svc-ring-runway");
        if (!el) return NaN;
        const r = el.getBoundingClientRect();
        const v = document.documentElement.clientHeight;
        return Math.round(r.top + scrollY + frac * (r.height - v));
      }, f);
      if (Number.isNaN(target)) return NaN;
      await roll(target);
      landed = await page.evaluate(() => {
        const el = document.querySelector(".svc-ring-runway");
        const r = el.getBoundingClientRect();
        return -r.top / Math.max(1, r.height - document.documentElement.clientHeight);
      });
      if (Math.abs(landed - f) < 0.01) return landed;
    }
    return landed;
  };
  /* Seat the ABOUT band at progress `p`, converging on the station's rect;
     same contract — the landing comes back, converged or pulled. */
  const seatAbout = async (p) => {
    let landed = NaN;
    for (let pass = 0; pass < 4; pass += 1) {
      const target = await page.evaluate((prog) => {
        const el = document.getElementById("about");
        const r = el.getBoundingClientRect();
        const v = document.documentElement.clientHeight;
        return Math.round(r.top + scrollY + prog * (r.height - v));
      }, p);
      await roll(target);
      landed = await page.evaluate(() =>
        Number.parseFloat(document.getElementById("about").style.getPropertyValue("--about-band-p"))
      );
      if (Math.abs(landed - p) < 0.008) return landed;
    }
    return landed;
  };
  const still = (name) => page.screenshot({ path: `${out}/${name}.png` });

  const readExit = () =>
    page.evaluate(() => {
      const stage = document.querySelector(".services-stage");
      const head = document.querySelector(".svc-ring-band .services-masthead");
      const leaves = Array.from(document.querySelectorAll(".svc-ring-band__decode__line")).filter(
        (l) => !l.hidden
      );
      return {
        exit: Number.parseFloat(stage?.style.getPropertyValue("--svc-exit") ?? "0") || 0,
        step: stage?.getAttribute("data-active-step") ?? null,
        untype: head?.getAttribute("data-untype") ?? null,
        leaves: leaves.length,
        ink: leaves
          .map((l) => l.textContent ?? "")
          .join("")
          .replace(/\s/g, "").length,
        hits: document.querySelectorAll(".svc-ring-hits__hit").length,
        plateOpen: stage?.getAttribute("data-plate-open") ?? null,
      };
    });
  const readAbout = () =>
    page.evaluate(() => {
      const about = document.getElementById("about");
      const band = about?.querySelector(":scope > .voidwalker");
      const slot = about?.querySelector(".voidwalker__orbit__portrait");
      const img = slot?.querySelector("img");
      const name = about?.querySelector(".voidwalker__name");
      const copy = about?.querySelector(".voidwalker__copy > .voidwalker__bio");
      const rest = about?.querySelector(".voidwalker__rest");
      const leaves = Array.from(document.querySelectorAll(".voidwalker__decode__line")).filter(
        (l) => !l.hidden
      );
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          x: +r.left.toFixed(1),
          y: +r.top.toFixed(1),
          w: +r.width.toFixed(1),
          h: +r.height.toFixed(1),
        };
      };
      return {
        p: Number.parseFloat(about?.style.getPropertyValue("--about-band-p") ?? "NaN"),
        band: about?.getAttribute("data-about-band") ?? null,
        deck: about?.getAttribute("data-about-deck") ?? null,
        vwName: about?.getAttribute("data-vw-name") ?? null,
        vwCopy: about?.getAttribute("data-vw-copy") ?? null,
        slotState: about?.getAttribute("data-about-slot") ?? null,
        portrait: about?.getAttribute("data-about-portrait") ?? null,
        bandTop: band ? +band.getBoundingClientRect().top.toFixed(1) : NaN,
        bandPos: band ? getComputedStyle(band).position : null,
        slot: rect(slot),
        imgVisible: img ? getComputedStyle(img).visibility : null,
        imgSrc: img?.currentSrc?.slice(0, 24) ?? null,
        nameVisible: name ? getComputedStyle(name).visibility : null,
        copyVisible: copy ? getComputedStyle(copy).visibility : null,
        leaves: leaves.length,
        ink: leaves
          .map((l) => l.textContent ?? "")
          .join("")
          .replace(/\s/g, "").length,
        bioOpen: band?.getAttribute("data-bio-open") ?? null,
        restH: rest ? +rest.getBoundingClientRect().height.toFixed(1) : NaN,
        copyTop: copy ? +copy.getBoundingClientRect().top.toFixed(1) : NaN,
        ringLive: document.documentElement.getAttribute("data-card-ring-live"),
        ambient: document.documentElement.getAttribute("data-services-ambient"),
      };
    });

  console.log(`\n═══ ${THEME} ${w}×${h} (vh ${vh}) ═══`);

  /* ── the exit ─────────────────────────────────────────────────────── */
  console.log(
    "· the services band's exit (fraction · --svc-exit · step · untype · leaves/ink · hits)"
  );
  await seatBand(0.6);
  for (const f of [0.6, LEAVE, LEAVE + 0.27 * 0.35, LEAVE + 0.27 * 0.7, 0.99]) {
    const landed = await seatBand(f);
    const e = await readExit();
    const pulled = Math.abs(landed - f) >= 0.01;
    console.log(
      `  f ${landed.toFixed(3)}${pulled ? ` (asked ${f.toFixed(2)}, pulled)` : "".padEnd(19)}  exit ${e.exit.toFixed(3)}  step ${e.step}  ${String(e.untype).padEnd(5)}  ${e.leaves}/${e.ink}  hits ${e.hits}  open ${e.plateOpen}`
    );
    await still(`exit-${f.toFixed(2)}`);
    if (f > LEAVE + 0.1 && e.hits !== 0) fail(`cards still take taps at f ${f.toFixed(2)}`);
  }
  {
    const e = await readExit();
    if (e.untype !== "gone" || e.ink !== 0)
      fail(`the copy is not gone at the exit's end (${e.untype}, ink ${e.ink})`);
    else ok("the copy un-typed to blank by the exit's end");
  }

  /* ── the weld ─────────────────────────────────────────────────────── */
  await seatBand(1);
  const weld = await page.evaluate(() => {
    const runway = document.querySelector(".svc-ring-runway").getBoundingClientRect();
    const about = document.getElementById("about").getBoundingClientRect();
    const v = document.documentElement.clientHeight;
    return { travelEnd: +(runway.bottom - v).toFixed(1), aboutTop: +about.top.toFixed(1) };
  });
  console.log(
    `· the weld at f 1: services travel ends at ${weld.travelEnd}, #about's top at ${weld.aboutTop}`
  );
  if (Math.abs(weld.aboutTop) > 2 || Math.abs(weld.travelEnd) > 2)
    fail(
      `the about band does not pin on the frame the services band releases (${weld.aboutTop} / ${weld.travelEnd})`
    );
  else ok("the about band pins as the services band's travel ends");

  /* ── the flip and the decode ──────────────────────────────────────── */
  console.log("· the about band (p · deck · name · copy · slot · img · leaves/ink)");
  const stops = [0.02, 0.11, 0.22, 0.3, 0.36, 0.45, 0.55, READ, 0.8, 0.99, 1.0];
  let lastSlot = null;
  for (const p of stops) {
    const landed = await seatAbout(p);
    const a = await readAbout();
    const pulled = Math.abs(landed - p) >= 0.008;
    console.log(
      `  p ${landed.toFixed(3)}${pulled ? ` (asked ${p.toFixed(2)}, pulled)` : "".padEnd(19)}  ${String(a.deck).padEnd(4)}  name ${String(a.vwName).padEnd(7)} copy ${String(a.vwCopy).padEnd(7)}  slot ${a.slot ? `${a.slot.w}×${a.slot.h}@${a.slot.y}` : "-"}  img ${a.imgVisible}/${a.portrait}  ${a.leaves}/${a.ink}`
    );
    await still(`about-${p.toFixed(2)}`);
    const at = landed;
    if (a.band !== "on") fail(`data-about-band is ${a.band} at p ${p}`);
    if (at < 0.99 && a.deck !== "live" && a.ringLive === "on")
      fail(`the DOM portrait took over early at p ${at}`);
    if (at >= 1 && a.deck !== "done") fail(`the deck was not killed at p ${at} (${a.deck})`);
    if (at >= READ && a.vwName !== "1") fail(`the name is not resolved at p ${at} (${a.vwName})`);
    if (at >= READ && a.vwCopy !== "1") fail(`the paragraph is not typed at p ${at} (${a.vwCopy})`);
    // Nothing may rest mid-decode: a landing inside either window is a pull
    // that did not happen (`ABOUT_BAND_NAME_WINDOW` / `_COPY_WINDOW`).
    const inName = at > 0.3 && at < 0.42;
    const inCopy = at > 0.42 && at < 0.6;
    if ((inName || inCopy) && pulled)
      fail(`a stop was pulled INTO a decode window (p ${at.toFixed(3)})`);
    if (a.slot && a.slot.h < 140 && a.slotState !== "hidden")
      fail(`a ${a.slot.h}px slot is not hidden`);
    lastSlot = a.slot;
  }

  /* ── the handover ─────────────────────────────────────────────────── */
  if (sharp && lastSlot) {
    const clip = {
      x: Math.max(0, lastSlot.x),
      y: Math.max(0, lastSlot.y),
      width: lastSlot.w,
      height: lastSlot.h,
    };
    await seatAbout(0.99);
    await page.waitForTimeout(150);
    const before = await page.screenshot({ clip });
    await seatAbout(1.0);
    await page.waitForTimeout(150);
    const after = await page.screenshot({ clip });
    const a = await sharp(before).raw().toBuffer({ resolveWithObject: true });
    const b = await sharp(after).raw().toBuffer({ resolveWithObject: true });
    let sum = 0;
    let over = 0;
    const n = Math.min(a.data.length, b.data.length);
    for (let i = 0; i < n; i += 1) {
      const d = Math.abs(a.data[i] - b.data[i]);
      sum += d;
      if (d > 40) over += 1;
    }
    const mean = sum / n;
    const overShare = over / n;
    console.log(
      `· the handover (WebGL at 0.99 → DOM at 1.0): mean |Δ| ${mean.toFixed(2)}/255, ${(overShare * 100).toFixed(2)} % of samples over 40`
    );
    await sharp(before).toFile(`${out}/handover-webgl.png`);
    await sharp(after).toFile(`${out}/handover-dom.png`);
    if (mean > 8 || overShare > 0.05)
      fail("the handover frame differs visibly (see handover-*.png)");
    else ok("the handover is one picture");
  } else if (!sharp) {
    console.log("· the handover: `sharp` unavailable, stills only");
  }

  /* ── the rest, with the thumb (ADR-115 U3) ────────────────────────── */
  await seatAbout(COVER);
  await page.waitForTimeout(700);
  const closed = await readAbout();
  await seatAbout(READ);
  await page.waitForTimeout(700);
  const opened = await readAbout();
  await still("rest-open");
  await seatAbout(COVER);
  await page.waitForTimeout(700);
  const reclosed = await readAbout();
  console.log(
    `· the rest on the clock: slot ${closed.slot?.h} → ${opened.slot?.h} (${opened.slotState ?? "shown"}) → ${reclosed.slot?.h}; rest ${closed.restH} → ${opened.restH} → ${reclosed.restH}; open ${closed.bioOpen} → ${opened.bioOpen} → ${reclosed.bioOpen}`
  );
  if (closed.bioOpen !== null) fail("the rest is open on the flip's-end seat");
  if (opened.bioOpen !== "1" || !(opened.restH > closed.restH + 40))
    fail("the rest did not unfold on the reading seat");
  if (opened.slot && closed.slot && !(opened.slot.h < closed.slot.h))
    fail("the seat did not give up height to the copy");
  if (reclosed.bioOpen !== null || Math.abs((reclosed.slot?.h ?? 0) - (closed.slot?.h ?? 0)) > 2)
    fail("scrolling back did not fold the rest and restore the seat");
  else ok("the rest unfolds, folds on the way back, and the seat follows");

  /* The unfold SAMPLED (U3): the snap off for the sweep (every position in the
     window is inside the reading seat's pull), twelve stops across it. The
     rest must grow and the seat shrink monotonically, and the paragraph may
     never sit above the seat's foot — one continuous motion, no step. */
  await page.addStyleTag({ content: "html { scroll-snap-type: none !important; }" });
  const sweep = [];
  for (let i = 0; i <= 12; i += 1) {
    const target = 0.55 + (0.72 - 0.55) * (i / 12);
    await seatAbout(target);
    await page.waitForTimeout(120);
    const a = await readAbout();
    sweep.push(a);
  }
  await page.addStyleTag({ content: "html { scroll-snap-type: y proximity !important; }" });
  console.log(
    "· the unfold, sampled: " +
      sweep.map((a) => `p ${a.p.toFixed(3)} rest ${a.restH} slot ${a.slot?.h ?? "-"}`).join(" | ")
  );
  let mono = true;
  let under = false;
  for (let i = 1; i < sweep.length; i += 1) {
    if (sweep[i].restH + 0.5 < sweep[i - 1].restH) mono = false;
    if ((sweep[i].slot?.h ?? 0) > (sweep[i - 1].slot?.h ?? 0) + 0.5) mono = false;
  }
  for (const a of sweep) {
    if (a.slot && a.copyTop + 0.5 < a.slot.y + a.slot.h) under = true;
  }
  if (!mono) fail("the unfold is not monotonic across its window");
  else if (under) fail("the paragraph rose over the seat's foot mid-unfold");
  else ok("the unfold is one continuous motion across its window");

  /* ── the snap seat ────────────────────────────────────────────────── */
  const snapTop = await page.evaluate(() => {
    const el = document.querySelector(".voidwalker__snap");
    return el ? Math.round(el.getBoundingClientRect().top + scrollY) : NaN;
  });
  await roll(snapTop - 40);
  await page.waitForTimeout(300);
  await settle(1800);
  const snapped = await readAbout();
  console.log(
    `· the snap: a stop 40px short of the reading seat lands at p ${snapped.p.toFixed(3)} (READ ${READ})`
  );
  if (Math.abs(snapped.p - READ) > 0.01)
    fail("a stop short of the reading seat did not glide onto it");
  else ok("the reading state is the seat");
  await still("snap-read");

  /* ── frame deltas over the exit + the flip ────────────────────────── */
  await seatBand(0.7);
  const deltas = await page.evaluate(
    () =>
      new Promise((resolve) => {
        const out = [];
        let last = performance.now();
        let n = 0;
        const tick = () => {
          const now = performance.now();
          out.push(now - last);
          last = now;
          scrollBy(0, 24);
          n += 1;
          if (n < 150) requestAnimationFrame(tick);
          else resolve(out.slice(2));
        };
        requestAnimationFrame(tick);
      })
  );
  const sorted = [...deltas].sort((a, b) => a - b);
  const q = (f) => sorted[Math.min(sorted.length - 1, Math.floor(f * sorted.length))];
  console.log(
    `· frame deltas over exit → flip (24px/frame, ${deltas.length} frames): p50 ${q(0.5).toFixed(1)}ms  p95 ${q(0.95).toFixed(1)}ms  max ${sorted[sorted.length - 1].toFixed(1)}ms`
  );
  if (q(0.95) > 50)
    fail(
      `p95 frame delta ${q(0.95).toFixed(1)}ms over the exit and the flip (Chromium proxy; the device is the reading)`
    );

  await ctx.close();
}

await browser.close();
console.log(failures ? `\n${failures} failure(s)` : "\nall clear");
process.exit(failures ? 1 : 0);
