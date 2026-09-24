/**
 * Shoot the musings list and the footer's bed (ADR-122 / ADR-105 U3), and
 * measure what no unit test and no mechanical gate can. (The file keeps the
 * row's name: the station was a row when it was written.)
 *
 * ⚠ **HEADED, AND REAL SCROLLS.** The station is a transparent stage under a
 * scroll-driven WebGL corridor: a headless context leaves the canvas dead and
 * a teleport skips the engagement band, so the corridor's exit attributes —
 * which decide whether this station's band is painting as the ambient's COVER
 * — never publish. `scripts/capture-site-footer.mjs`'s own law, one station up.
 *
 * ⚠ **THE THINGS THAT CANNOT BE GATED ANY OTHER WAY.** `arrive` and
 * `headDecode` are pure and unit-pinned, and the list's mechanic is two CSS
 * transitions; nothing there knows whether the browser opened a note, whether
 * a title was cut, whether the sign landed on the cover's floor, whether the
 * glass is applied, or whether the footer is uncovering. Specifically:
 *   · `coverOpaque`   — the cover's own ground, the ADR-030 §6 contract (the
 *                       footer on the stage rung since ADR-105 U4).
 *   · `headBlank`     — the head is EMPTY at every stop the stage is not parked:
 *                       text never travels (ADR-119 U2).
 *   · `headWhole`     — and whole through the dwell.
 *   · `rest`          — note 0 open at rest; every title whole on one line;
 *                       every note a focusable link; the notes inside the
 *                       rails' last tick; the covers unframed, one thumbnail
 *                       size, the open one square.
 *   · `signFloor`     — the open note's byline and way in end on its cover's
 *                       floor (±1.5px), at rest, on hover and on Tab.
 *   · `hover`         — the pointer over note 2 opens it and closes note 0;
 *                       leaving the list LEAVES it open (ADR-122: a list whose
 *                       open card is taller than the rest would move every
 *                       note under a hand travelling to them).
 *   · `keyboard`      — tabbing into note 1 opens it: focus opens as hover does.
 *   · `glass`         — every note carries the blur on the stage rung in dark,
 *                       none in light, none under reduced motion.
 *   · `rise`          — the footer rising over the PINNED list (ADR-105 U4):
 *                       its top at vh·(1 − k) at each quarter of the rise,
 *                       the list `in` and the head whole under it, the stage
 *                       drifting a quarter of the rise and the veil dimming,
 *                       the corridor alive at k 0.25 and dead at k 1, the
 *                       readout on CONTACT once the footer holds the middle,
 *                       and a whole list when the reader scrolls back up.
 *   · `notchPaint`    — the corner, HIT-TESTED rather than parsed, from both ends.
 *   · `--perf`        — the long-frame share while parked and while the pointer
 *                       sweeps the list, against the proof card's recorded 15 %.
 *
 *   node scripts/capture-musings-row.mjs --vp 1920x1247 --theme dark --perf
 *   node scripts/capture-musings-row.mjs --vp 1920x1247 --theme light
 *   node scripts/capture-musings-row.mjs --vp 1280x720  --theme dark
 *   node scripts/capture-musings-row.mjs --vp 390x844   --theme dark
 *   node scripts/capture-musings-row.mjs --lab --n 5 --vp 1920x1247 --theme dark
 *
 * `--lab` drives `/test/musings-row` (the placeholder host) instead of the
 * landing: same gates on the list, none on the corridor or the footer, which
 * that route does not have.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const arg = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const [W, H] = arg("--vp", "1920x1247").split("x").map(Number);
const THEME = arg("--theme", "dark");
const PORT = arg("--port", "3003");
const OUT = arg("--out", "shots/musings");
const LAB = process.argv.includes("--lab");
const PERF = process.argv.includes("--perf");
const N = arg("--n", "5");
mkdirSync(OUT, { recursive: true });

/* `musings.css`'s `--mu-note-grow` (560ms) plus a frame's margin — the wait
   after a hover. */
const GROW_MS = 700;
/* The proof card's recorded long-frame share at 1920×1247 (ADR-097) — the bar
   the row's glass has to clear, or the recorded fallback applies. */
const PERF_LONG_SHARE_MAX = 15;

const tag = `${W}x${H}-${THEME}${LAB ? `-lab${N}` : ""}`;
const url = LAB
  ? `http://localhost:${PORT}/test/musings-row?theme=${THEME}&n=${N}&console=0`
  : `http://localhost:${PORT}/?theme=${THEME}`;
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));

await page.goto(url, { waitUntil: "domcontentloaded" });
/* ⚠ `attached`, NEVER VISIBLE: the notes are hidden while the arrival
   AWAITS the head (an absent stamp means shown — a present `await` means not
   yet), so a visibility wait times out on the pinned rung. */
await page.waitForSelector("#musings .mu-note", { state: "attached", timeout: 30_000 });

/**
 * Walk down in real steps until `#musings` sits at the given progress.
 *
 * ⚠ THE WRITER'S CLOCK, NOT THE RUNWAY'S (ADR-105 U4). The runway is the dwell
 * PLUS the rise, and the writer measures `p` over the dwell alone, so p 1 is
 * the end of the dwell and the rise is p ∈ (1, 1 + rise/dwell]. `riseK` asks
 * for a fraction of the rise instead. The rise is read off a probe sized by
 * `--mu-rise` (a custom property is a string until something lays it out),
 * and only counts where the runway is pinned — off the rung it has no tail.
 */
async function rollToP(target, riseK = null) {
  for (let pass = 0; pass < 240; pass += 1) {
    const state = await page.evaluate(() => {
      const runway = document.querySelector(".mu__runway");
      const sec = document.getElementById("musings");
      if (!runway || !sec) return null;
      const ready = !!document.querySelector(".mu[data-mu-ready]");
      const probe = document.createElement("i");
      probe.style.cssText = "position:absolute;width:0;height:var(--mu-rise,0px);visibility:hidden";
      sec.appendChild(probe);
      const rise = ready ? probe.offsetHeight : 0;
      probe.remove();
      const vh = document.documentElement.clientHeight;
      const travel = Math.max(1, runway.offsetHeight - vh - rise);
      const top = runway.getBoundingClientRect().top;
      return { p: -top / travel, travel, rise };
    });
    if (!state) return null;
    const want = riseK == null ? target : 1 + (riseK * state.rise) / state.travel;
    /* ⚠ CONVERGE, NEVER SOLVE ONCE. The corridor's lazy chunks grow the
       document under the scroll and this station's own runway appears at
       hydration, so a position solved before the roll lands somewhere else
       (the trinny route's `rollToP` law, and ADR-102's `rollToS`). */
    if (Math.abs(state.p - want) < 0.004) return state.p;
    const delta = (want - state.p) * state.travel;
    await page.evaluate((d) => window.scrollBy({ top: d, behavior: "instant" }), Math.round(delta));
    await page.waitForTimeout(70);
  }
  return null;
}

/* Engage the corridor with real wheel steps first — the exit attributes only
   publish on the way through, and the cover's role depends on them. */
for (let i = 0; i < 90; i += 1) {
  const top = await page.evaluate(
    () => document.querySelector("#musings")?.getBoundingClientRect().top ?? 1e9
  );
  if (top <= H * 0.9) break;
  await page.mouse.wheel(0, Math.round(H * 0.9));
  await page.waitForTimeout(70);
}
await page.waitForTimeout(900);

const readRow = () =>
  page.evaluate(() => {
    const px = (v) => Math.round(v * 100) / 100;
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: px(r.left), y: px(r.top), w: px(r.width), h: px(r.height) };
    };
    const st = document.getElementById("musings");
    /* ⚠ THE COVER IS THE FOOTER ON THE STAGE RUNG (ADR-105 U4). `#musings` is
       TRANSPARENT and promoted there — the corridor is alive behind the whole
       beat — and the opaque thing that kills it is `#contact`, welded up over
       the runway's last viewport and rising OVER the pinned stage. (ADR-119's
       100svh `.mu__band` held the role until then and is deleted.) On every
       lower rung the station is opaque again and IS its own cover. */
    const stage = st?.dataset.muMode === "stage";
    const contactEl = document.getElementById("contact");
    const cover = stage && contactEl ? contactEl : st;
    const riseProbe = document.createElement("i");
    riseProbe.style.cssText =
      "position:absolute;width:0;height:var(--mu-rise,0px);visibility:hidden";
    st?.appendChild(riseProbe);
    const rise = riseProbe.offsetHeight;
    riseProbe.remove();
    const stageEl = document.querySelector(".mu__stage");
    const stageCs = stageEl ? getComputedStyle(stageEl) : null;
    const tf = stageCs?.transform && stageCs.transform !== "none" ? stageCs.transform : "";
    const stageTy = tf ? px(parseFloat(tf.slice(tf.indexOf("(") + 1).split(",")[5])) : 0;
    const mu = document.querySelector(".mu");
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const notes = [...document.querySelectorAll(".mu-note")];
    const open = notes.findIndex((c) => c.hasAttribute("data-mu-open"));

    /* ⚠ LAID-OUT INK, NOT ELEMENT BOXES — AND NOT CLIPPED. A Range's client
       rects are the line boxes the text was laid out into, which the face's
       `overflow: hidden` does not shrink: so the same title reports the same
       width whether its card is a strip or open, which is exactly the
       no-reflow question. */
    const inkOf = (el) => {
      if (!el) return null;
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
      range.detach();
      if (!rects.length) return null;
      const x = Math.min(...rects.map((r) => r.left));
      const r = Math.max(...rects.map((r2) => r2.right));
      /* One rect per LINE, counted by distinct tops: the kicker is three
         inline runs on one line and must count as one. */
      const lines = new Set(rects.map((q) => Math.round(q.top))).size;
      return {
        x: px(x),
        y: px(Math.min(...rects.map((q) => q.top))),
        b: px(Math.max(...rects.map((q) => q.bottom))),
        w: px(r - x),
        lines,
      };
    };

    /* The rails' last tick, as the stage lays it out: the notes may not end
       below it (the stage's bottom padding IS `--hud-rail-y-end`). */
    const railEnd = stageEl
      ? px(
          stageEl.getBoundingClientRect().bottom -
            parseFloat(getComputedStyle(stageEl).paddingBottom)
        )
      : null;
    const listEl = document.querySelector(".mu__list");

    /* The right rail's telemetry — BEARING · SECTOR · LOCAL — as painted. */
    const tele = [...document.querySelectorAll(".rin-tele")]
      .map((el) => ({
        k: (el.querySelector(".rin-tele__k")?.textContent ?? "").trim(),
        ...box(el),
      }))
      .filter((t) => t.w > 0 && t.h > 0);

    const contact = contactEl;
    const vh = document.documentElement.clientHeight;

    /* ── The seam with the era stage (ADR-121 U3) ──
       The station is welded one viewport over `#voidwalker` on the stage
       rung. What is read: the weld as laid out, the era's exit level, whether
       the era's lit chip still takes the click through the transparent
       station (it must, until the era goes inert), and how many of the era's
       text runs are still inked inside the frame (none once the head decodes). */
    const era = (() => {
      const vw = document.getElementById("voidwalker");
      const vwd = vw?.querySelector(".vwd") ?? null;
      const stRect = st?.getBoundingClientRect();
      const vwRect = vw?.getBoundingClientRect();
      const chip =
        vw?.querySelector('.vwd__band [role="tab"][aria-selected="true"]') ??
        vw?.querySelector('.vwd__band [role="tab"]') ??
        null;
      let chipHit = null;
      if (chip) {
        const r = chip.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh) {
          const top = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2)[0];
          chipHit = {
            inBand: !!top?.closest(".vwd__band"),
            inMusings: !!top?.closest("#musings"),
          };
        }
      }
      let inked = 0;
      if (vwd) {
        const vwW = document.documentElement.clientWidth;
        const faded = (el) => {
          for (let e = el; e && e !== vwd.parentElement; e = e.parentElement) {
            const s = getComputedStyle(e);
            if (s.visibility === "hidden" || s.display === "none" || parseFloat(s.opacity) < 0.05)
              return true;
          }
          return false;
        };
        const walker = document.createTreeWalker(vwd, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (!node.textContent.trim() || !node.parentElement || faded(node.parentElement))
            continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          const hit = [...range.getClientRects()].some(
            (q) =>
              q.width > 0 &&
              q.height > 0 &&
              q.bottom > 0 &&
              q.top < vh &&
              q.right > 0 &&
              q.left < vwW
          );
          range.detach();
          if (hit) inked += 1;
        }
      }
      return {
        present: !!vw,
        exit: vwd?.style.getPropertyValue("--vwh-exit") || null,
        inert: vwd?.inert ?? null,
        chipHit,
        inked,
        weld: st ? px(parseFloat(getComputedStyle(st).marginTop)) : null,
        edge: st?.getAttribute("data-station-edge") ?? null,
        /* The station's top against the era's bottom: −vh welded, 0 in flow. */
        gap: stRect && vwRect ? px(stRect.top - vwRect.bottom) : null,
        vwDocTop: vwRect ? px(vwRect.top + window.scrollY) : null,
        vwH: vw?.offsetHeight ?? null,
        /* ⚠ Document offsets are read HERE, at the stop — a `scrollY` read
           after the walk is the document's end, not this frame. */
        muDocTop: (() => {
          const r = document.querySelector(".mu__runway")?.getBoundingClientRect();
          return r ? px(r.top + window.scrollY) : null;
        })(),
      };
    })();

    return {
      vh,
      era,
      runwayBox: box(document.querySelector(".mu__runway")),
      rise,
      stageTy,
      stageAnim: stageCs?.animationName ?? null,
      veil: stageEl ? px(parseFloat(getComputedStyle(stageEl, "::after").opacity || "0")) : 0,
      ambient: document.documentElement.hasAttribute("data-services-ambient"),
      exit: document.documentElement.hasAttribute("data-corridor-exit"),
      activeStation: document.documentElement.getAttribute("data-active-station"),
      muReady: mu?.hasAttribute("data-mu-ready") ?? false,
      arrive: mu?.dataset.muArrive ?? null,
      coverGround: cs(cover)?.backgroundColor ?? null,
      coverImage: (cs(cover)?.backgroundImage ?? "none").slice(0, 26),
      coverPosition: cs(st)?.position ?? null,
      stageMode: stage,
      coverZ: cs(st)?.zIndex ?? null,
      coverBox: box(cover),
      contactPosition: cs(contact)?.position ?? null,
      contactZ: cs(contact)?.zIndex ?? null,
      contactBox: box(contact),
      contactMt: cs(contact)?.marginTop ?? null,
      /* ⚠ PARKED IS THE RUNWAY COVERING THE FRAME — the writer's own test. The
         head may only show while this is true (U2). */
      pinned: (() => {
        const r = document.querySelector(".mu__runway")?.getBoundingClientRect();
        return r ? r.top <= 0.5 && r.bottom >= vh - 0.5 : false;
      })(),
      headState: (() => {
        const runs = [...document.querySelectorAll(".mu__head [data-mu-decode]")];
        const title = [...document.querySelectorAll(".mu__title [data-mu-decode]")]
          .map((e) => e.textContent)
          .join(" ");
        const brief =
          document.querySelector(".mu__brief-typed [data-mu-decode]")?.textContent ?? "";
        const ghost = document.querySelector(".mu__brief-ghost")?.textContent ?? "";
        return {
          level: cs(mu)?.getPropertyValue("--mu-head").trim() || null,
          blank: runs.every((e) => (e.textContent ?? "").trim() === ""),
          whole:
            title === (document.querySelector(".mu__title")?.getAttribute("aria-label") ?? "") &&
            brief === ghost,
          sample: title.slice(0, 24),
        };
      })(),
      notesBox: box(document.querySelector(".mu__notes")),
      listBox: box(listEl),
      listScrolls: listEl ? listEl.scrollHeight > listEl.clientHeight + 1 : null,
      railEnd,
      tele,
      teleLeft: tele.length ? px(Math.min(...tele.map((t) => t.x))) : null,
      sb: window.innerWidth - document.documentElement.clientWidth,
      open,
      notes: notes.map((n, i) => {
        const s = getComputedStyle(n);
        const on = n.hasAttribute("data-mu-open");
        const title = n.querySelector(".mu-note__title");
        const row = n.querySelector(".mu-note__row");
        const lede = n.querySelector(".mu-note__lede");
        const meta = n.querySelector(".mu-note__meta");
        const coverEl = n.querySelector(".mu-note__cover");
        return {
          i,
          open: on,
          box: box(n),
          transition: s.transitionProperty,
          backdrop: s.backdropFilter || s.webkitBackdropFilter || "none",
          lip: getComputedStyle(n, "::before").backgroundColor,
          title: inkOf(title),
          /* nowrap + ellipsis: a cut title is one whose content outruns its box. */
          titleCut: title ? title.scrollWidth > title.clientWidth + 1 : null,
          titlePx: title ? px(parseFloat(getComputedStyle(title).fontSize)) : null,
          ledePx: lede ? px(parseFloat(getComputedStyle(lede).fontSize)) : null,
          metaPx: meta ? px(parseFloat(getComputedStyle(meta).fontSize)) : null,
          cover: box(coverEl),
          coverBorder: coverEl ? getComputedStyle(coverEl).borderTopWidth : null,
          coverGround: coverEl ? getComputedStyle(coverEl).backgroundColor : null,
          sign: on ? box(n.querySelector(".mu-note__sign")) : null,
          tabbable: !!row && row.tabIndex >= 0 && !row.closest("[aria-hidden]"),
        };
      }),
      head: box(document.querySelector(".mu__head")),
      titlePx: px(parseFloat(cs(document.querySelector(".mu__title"))?.fontSize ?? "0")),
      all: box(document.querySelector(".mu__all")),
    };
  });

/**
 * The corner, hit-tested.
 *
 * ⚠ A COMPUTED `clip-path` KEEPS ITS PERCENTAGES AND `calc()`s, so parsing it
 * measures the SERIALISATION. `elementsFromPoint` asks what actually painted —
 * and the corner is pinned from BOTH ENDS, because "the TR is cut" passing
 * tells you nothing if the other three are cut too (ADR-065 U5's own lesson).
 */
const readNotch = () =>
  page.evaluate(() => {
    /* The note carries the clip itself: its own box is the plate (ADR-122 —
       ADR-121's face span went with the grow it was separated from). */
    const card = document.querySelector(".mu-note[data-mu-open]");
    const face = card;
    if (!card) return null;
    const ch = parseFloat(getComputedStyle(card).getPropertyValue("--mu-ch")) || 18;
    /* A point well inside each corner's chamfer triangle: 30 % along the cut
       from the corner, which is outside the polygon for a cut corner and
       inside it for a square one. ⚠ NO `onCut` PROBE at `ch × 0.5` — that is
       exactly ON the diagonal and resolves by rounding (ADR-119 U1). */
    const d = ch * 0.3;
    /* The probe points are resolved through markers laid out in the face's
       OWN space (ADR-102's law): the row has no 3D context now, but a probe
       that would stay right if a pose ever returned is the one to keep. Every
       marker is seated, read and removed BEFORE any hit test runs. */
    const local = {
      tl: [`${d}px`, `${d}px`],
      tr: [`calc(100% - ${d}px)`, `${d}px`],
      bl: [`${d}px`, `calc(100% - ${d}px)`],
      br: [`calc(100% - ${d}px)`, `calc(100% - ${d}px)`],
      mid: ["50%", "50%"],
    };
    const points = {};
    for (const [k, [lx, ly]] of Object.entries(local)) {
      const m = document.createElement("i");
      m.style.cssText = `position:absolute;left:${lx};top:${ly};width:0;height:0;pointer-events:none`;
      face.appendChild(m);
      const b = m.getBoundingClientRect();
      m.remove();
      points[k] = [Math.round(b.left), Math.round(b.top)];
    }
    void face.getBoundingClientRect();
    const hits = {};
    const out = { ch: Math.round(ch * 10) / 10 };
    /* ⚠ `elementsFromPoint()[0]`, never `elementFromPoint` — the two disagreed
       inside ADR-119's 3D context and the singular one was wrong. There is no
       3D context left; the plural form is kept because it is the one that was
       right, and ADR-121's first run is where the singular one is re-verified
       against it (the ADR records the answer). ⚠ Asked of the FACE, which is
       what carries the clip. */
    for (const [k, [x, y]] of Object.entries(points)) {
      const el = document.elementsFromPoint(x, y)[0] ?? null;
      const single = document.elementFromPoint(x, y);
      hits[k] = el
        ? `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]}`
        : "null";
      out[k] = el ? face.contains(el) || el === face : false;
      out[`${k}Agree`] = el === single;
    }
    out.hits = hits;
    return out;
  });

/* A rAF-delta sampler in the page; the cost of a `backdrop-filter` is the
   per-frame SNAPSHOT (ADR-056), so what matters is the share of long frames,
   not the mean. Copied from `capture-proof-stack.mjs --perf`. */
const perfStart = () =>
  page.evaluate(() => {
    window.__muPerf = [];
    window.__muPerfOn = true;
    let last = performance.now();
    const tick = (t) => {
      window.__muPerf.push(t - last);
      last = t;
      if (window.__muPerfOn) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
const perfStop = () =>
  page.evaluate(() => {
    window.__muPerfOn = false;
    const d = window.__muPerf.slice(1).sort((a, b) => a - b);
    const n = d.length;
    const mean = d.reduce((a, b) => a + b, 0) / Math.max(1, n);
    const p95 = d[Math.min(n - 1, Math.floor(n * 0.95))] ?? 0;
    const long = d.filter((x) => x > 33).length;
    return {
      frames: n,
      mean: +mean.toFixed(1),
      p95: +p95.toFixed(1),
      max: +(d[n - 1] ?? 0).toFixed(1),
      longShare: +((100 * long) / Math.max(1, n)).toFixed(1),
    };
  });

/* ── The walk ───────────────────────────────────────────────────────── */
/* ⚠ −1.0, −0.3 AND −0.15 ARE OFF THE PIN ON PURPOSE: the approach, where the
   stage travels and the head must be EMPTY (U2). (1.15 — the release — went
   with ADR-105 U4: past the dwell is the RISE now, walked in quarters below,
   and the stage releases only once the footer covers it.) Since
   the weld (U3) the approach is the ERA'S OWN LAST VIEWPORT: −1.0 is era p
   0.625 (the era band on screen, its chip must still take the click through
   the transparent station), −0.3 is 0.89 and −0.15 is 0.94 (mid-exit), and
   the corner must read VOIDWALKER at all three. The pointer parks in the left
   margin for the whole walk, so no card is hovered by accident. */
await page.mouse.move(8, Math.round(H / 2));
const phone = W <= 960;
const stops = [-1.0, -0.3, -0.15, 0.02, 0.14, 0.3, 0.45, 0.6, 0.75, 0.9, 0.99];
const walk = [];
for (const p of stops) {
  const landed = await rollToP(p);
  await page.waitForTimeout(820); // the head's decode, plus a frame
  const r = await readRow();
  walk.push({ p, landed: landed == null ? null : Math.round(landed * 1000) / 1000, ...r });
  await page.screenshot({ path: `${OUT}/mu-${tag}-p${String(p).replace(".", "")}.png` });
}
/* ── The rise (ADR-105 U4): the footer over the pinned list, in quarters. ──
   On the pinned rungs only — off them nothing pins and the footer follows the
   list in flow. Landing only: the labs have no footer and no rise. */
const RISE_KS = [0.25, 0.5, 0.75, 1];
const rise = [];
if (!phone && !LAB) {
  for (const k of RISE_KS) {
    await rollToP(null, k);
    await page.waitForTimeout(600);
    const r = await readRow();
    rise.push({ k, ...r });
    await page.screenshot({ path: `${OUT}/mu-${tag}-rise${String(k).replace(".", "")}.png` });
  }
}

/* ── The row, seated and arrived ────────────────────────────────────── */
await rollToP(0.45);
/* ⚠ WAIT ON THE ARRIVAL, NEVER A FIXED SLEEP (ADR-119 U2). Re-entering the
   beat from below replays the owner's order — the head decodes (~0.7s), THEN
   the notes unfold one after another — so a probe that sleeps reads a note
   mid-unfold, with every corner outside its clip. `subtree` because the lip
   runs its own animation on `::before`. ⚠ ONLY WHERE THE LIST PINS: on the
   phone rung the writer parks and there is no arrival stamp. */
if (!phone)
  await page.waitForFunction(
    () => {
      const mu = document.querySelector(".mu");
      const list = document.querySelector(".mu__notes");
      return (
        mu?.dataset.muArrive === "in" && list && list.getAnimations({ subtree: true }).length === 0
      );
    },
    null,
    { timeout: 12_000 }
  );
await page.waitForTimeout(GROW_MS + 100);
const rest = await readRow();
await page.screenshot({ path: `${OUT}/mu-${tag}-rest.png` });

/* ── The head's seat (ADR-121 U2) ─────────────────────────────────────
   The pinned head hangs from the SERVICES line. ⚠ `--band-top` IS A `calc()`
   AND A CUSTOM PROPERTY IS A STRING UNTIL SOMETHING LAYS IT OUT, so it is
   resolved through a probe box inside `.mu`, never parsed. The survey chrome
   is reported against the frame's own corner marks, which the raised head now
   sits beside. */
const seat = await page.evaluate(() => {
  const mu = document.querySelector(".mu");
  const title = document.querySelector(".mu__title");
  const brief = document.querySelector(".mu__brief");
  const all = document.querySelector(".mu__all");
  const desig = document.querySelector(".mu__desig");
  const stage = document.querySelector(".mu__stage");
  if (!mu || !title || !stage) return null;
  const probe = document.createElement("i");
  probe.style.cssText = "position:absolute;width:0;height:var(--band-top);visibility:hidden";
  mu.appendChild(probe);
  const bandTop = probe.getBoundingClientRect().height;
  probe.remove();
  const r = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return {
      x: Math.round(b.x * 10) / 10,
      y: Math.round(b.y * 10) / 10,
      b: Math.round(b.bottom * 10) / 10,
    };
  };
  const stageTop = stage.getBoundingClientRect().top;
  const tl = document.querySelector(".hud__corner--tl");
  const nav = document.querySelector(".hud__nav__btn");
  return {
    bandTop: Math.round(bandTop * 10) / 10,
    stageTop: Math.round(stageTop * 10) / 10,
    title: r(title),
    brief: r(brief),
    all: r(all),
    desig: r(desig),
    cornerTl: r(tl),
    nav: r(nav),
    vh: window.innerHeight,
    vw: window.innerWidth,
  };
});

/* Hover, leave, keyboard — the mechanic, asked of the browser. */
let hover = null;
let hoverTrace = [];
let back = null;
let kb = null;
let perfIdle = null;
let perfHover = null;
if (!phone && rest.notes.length >= 2) {
  const want = Math.min(2, rest.notes.length - 1);
  /* A row's centre, read LIVE: opening a note moves every note below it. */
  const rowCentre = (i) =>
    page.evaluate((k) => {
      const r = document.querySelectorAll(".mu-note__row")[k]?.getBoundingClientRect();
      return r ? [r.left + r.width / 2, r.top + r.height / 2] : null;
    }, i);
  /* ⚠ THE HOVER GATES CARRY THEIR OWN TRACE. A hover probe that fails with
     only an end state ("note 0 is open") says what, never why; this records
     every pointer and focus event the list receives, every move of
     `data-mu-open` and every scroll from here to the Tab read, and the gates
     print it whenever one of them fails. */
  await page.evaluate(() => {
    window.__muTrace = [];
    const list = document.querySelector(".mu__list");
    const idx = (el) => [...list.children].indexOf(el?.closest?.(".mu-note"));
    const t0 = performance.now();
    const at = () => `${Math.round(performance.now() - t0)}ms`;
    for (const type of ["pointerover", "pointerleave", "focusin", "focusout"])
      list.addEventListener(type, (e) =>
        window.__muTrace.push(
          `${at()} ${type} note ${idx(e.target)} @${Math.round(e.clientX ?? -1)},${Math.round(e.clientY ?? -1)}`
        )
      );
    new MutationObserver((ms) => {
      for (const m of ms)
        window.__muTrace.push(
          `${at()} data-mu-open ${m.target.hasAttribute("data-mu-open") ? "set on" : "cleared from"} note ${idx(m.target)}`
        );
    }).observe(list, { subtree: true, attributes: true, attributeFilter: ["data-mu-open"] });
    window.addEventListener("scroll", () =>
      window.__muTrace.push(`${at()} scroll ${Math.round(scrollY)}`)
    );
  });
  const target = await rowCentre(want);
  if (target) await page.mouse.move(...target, { steps: 4 });
  await page.waitForTimeout(GROW_MS + 150);
  hover = await readRow();
  await page.screenshot({ path: `${OUT}/mu-${tag}-hover.png` });
  /* Leave the list: back to the margin. The note stays open (ADR-122). */
  await page.mouse.move(8, Math.round(H / 2), { steps: 4 });
  await page.waitForTimeout(GROW_MS + 150);
  back = await readRow();
  /* Keyboard: focus note 0's row, then Tab until focus is inside note 1 —
     note 0 is open, so its own way in is the next stop on the way. */
  await page.evaluate(() => document.querySelector(".mu-note__row")?.focus());
  await page.waitForTimeout(GROW_MS + 150);
  for (let step = 0; step < 4; step += 1) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(90);
    const at = await page.evaluate(() => {
      const n = document.activeElement?.closest?.(".mu-note");
      return n ? [...n.parentElement.children].indexOf(n) : -1;
    });
    if (at === 1) break;
  }
  await page.waitForTimeout(GROW_MS + 150);
  kb = await readRow();
  await page.screenshot({ path: `${OUT}/mu-${tag}-focus.png` });
  await page.evaluate(() => document.activeElement?.blur());
  await page.waitForTimeout(200);
  hoverTrace = await page.evaluate(() => window.__muTrace ?? []);

  /* ── `--perf`: parked, then the pointer sweeping the list ──────────── */
  if (PERF) {
    await perfStart();
    await page.waitForTimeout(1500);
    perfIdle = await perfStop();
    await perfStart();
    for (let pass = 0; pass < 2; pass += 1) {
      for (let i = 0; i < rest.notes.length; i += 1) {
        const c = await rowCentre(i);
        if (c) await page.mouse.move(...c, { steps: 6 });
        await page.waitForTimeout(240);
      }
    }
    await page.mouse.move(8, Math.round(H / 2), { steps: 4 });
    await page.waitForTimeout(GROW_MS);
    perfHover = await perfStop();
  }
}

/* ⚠ THE NOTCH IS READ WHILE THE ROW IS ON SCREEN AND AT REST. `elementsFromPoint`
   works in the VISUAL viewport: read after the footer walk, the open card is
   two viewports above the frame and every probe lands outside it. */
const notch = await readNotch();

/* Past the list: the document's end, where the footer fills the frame, then
   BACK UP into the rise — the footer must lift off a whole list, not a folded
   one (ADR-105 U4: the footer covering the list is its only exit at the
   bottom). Landing only — the lab has no footer and no corridor. */
let backUp = null;
if (!LAB) {
  await page.evaluate(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: max, behavior: "instant" });
  });
  await page.waitForTimeout(700);
  const r = await readRow();
  walk.push({ p: "footer-end", landed: null, ...r });
  await page.screenshot({ path: `${OUT}/mu-${tag}-footer-end.png` });
  if (!phone) {
    await rollToP(null, 0.5);
    await page.waitForTimeout(700);
    backUp = await readRow();
  }
}

/* ── Reduced motion: the rail, and no glass ─────────────────────────── */
const prmCtx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
const prmPage = await prmCtx.newPage();
await prmPage.goto(url, { waitUntil: "domcontentloaded" });
await prmPage.waitForSelector("#musings .mu-note", { state: "attached", timeout: 30_000 });
await prmPage.waitForTimeout(600);
const prm = await prmPage.evaluate(() => {
  const mu = document.querySelector(".mu");
  const notes = [...document.querySelectorAll(".mu-note")];
  return {
    ready: mu?.hasAttribute("data-mu-ready") ?? false,
    open: notes.findIndex((c) => c.hasAttribute("data-mu-open")),
    backdrops: notes.map((f) => {
      const s = getComputedStyle(f);
      return s.backdropFilter || s.webkitBackdropFilter || "none";
    }),
    display: mu ? getComputedStyle(document.querySelector(".mu__list")).display : null,
  };
});
await prmCtx.close();

/* ── The readout ────────────────────────────────────────────────────── */
const line = (s) => console.log(s);
line(`\n══ MUSINGS LIST · ${tag} · port ${PORT}${LAB ? " · lab" : ""} ══`);
const first = walk[0];
line(`cover     ground ${first.coverGround} · image ${first.coverImage}`);
line(`          position ${first.coverPosition} z ${first.coverZ} · vh ${first.vh}`);
line(`head      ${JSON.stringify(first.head)} · display ${first.titlePx}px`);
line(
  `notes     ${first.notes.length} · type ${first.notes[0]?.titlePx}/${first.notes[0]?.ledePx}/${first.notes[0]?.metaPx}px`
);
line(
  `notch     ch ${notch?.ch} · mid ${notch?.mid} · TL ${notch?.tl} TR ${notch?.tr} BL ${notch?.bl} BR ${notch?.br}`
);
line(`notch     hits ${JSON.stringify(notch?.hits)}`);
line(
  `notch     singular/plural agree ${notch ? ["tl", "tr", "bl", "br", "mid"].map((k) => `${k}:${notch[`${k}Agree`] ? "y" : "N"}`).join(" ") : "—"}`
);
line("");
line(
  "  p      landed  ready  pinned open  arrive  head (level · text)              ambient/exit  readout   #contact"
);
for (const s of walk) {
  const pad = (v, n) => String(v).padEnd(n);
  const head = s.headState ? `${s.headState.level ?? "—"} · "${s.headState.sample}"` : "—";
  line(
    `  ${pad(s.p, 6)} ${pad(s.landed, 7)} ${pad(s.muReady, 6)} ${pad(s.pinned, 6)} ${pad(s.open, 5)} ${pad(s.arrive, 7)} ` +
      `${pad(head, 34)} ${pad(`${s.ambient}/${s.exit}`, 13)} ` +
      `${pad(s.activeStation, 9)} ${pad(`${s.contactPosition} z${s.contactZ} y${s.contactBox?.y} mt ${s.contactMt}`, 36)}`
  );
}

/* The open note's sign against its cover's floor: the owner's ask ("the call
   to action and the author … aligned to the bottom of that visual"). */
const floorOf = (r) => {
  const c = r?.notes.find((n) => n.open);
  return c && c.sign && c.cover
    ? Math.round((c.sign.y + c.sign.h - (c.cover.y + c.cover.h)) * 10) / 10
    : null;
};
if (rise.length) {
  line(
    "\n  rise   footer top  (want)    stage ty (want)   veil   arrive  head      ambient/exit  readout"
  );
  for (const r of rise) {
    const want = Math.round(r.vh * (1 - r.k) * 10) / 10;
    const wantTy = Math.round(-0.25 * r.rise * r.k * 10) / 10;
    line(
      `  ${String(r.k).padEnd(6)} ${String(r.contactBox?.y).padEnd(11)} (${String(want).padEnd(7)}) ` +
        `${String(r.stageTy).padEnd(9)} (${String(wantTy).padEnd(6)}) ${String(r.veil).padEnd(6)} ` +
        `${String(r.arrive).padEnd(7)} ${String(r.headState?.level).padEnd(9)} ${String(`${r.ambient}/${r.exit}`).padEnd(13)} ${r.activeStation}`
    );
  }
}

const showNotes = (label, r) => {
  if (!r) return;
  line(
    `\n── ${label} (open ${r.open}) · notes ${JSON.stringify(r.notesBox)} · rail end ${r.railEnd} · list scrolls ${r.listScrolls} ──`
  );
  for (const c of r.notes) {
    line(
      `  ${c.i}${c.open ? "*" : " "} h ${String(c.box?.h).padEnd(7)} title ${c.titlePx}px cut ${c.titleCut}  ` +
        `cover ${c.cover?.w}×${c.cover?.h}  glass ${c.backdrop.slice(0, 12).padEnd(12)} lip ${c.lip}`
    );
  }
  line(`  sign → cover floor ${floorOf(r)}px`);
};
showNotes("rest", rest);
showNotes("hover note 2", hover);
showNotes("after leaving the list", back);
showNotes("Tab into note 1", kb);

/* ── The list's end against the right rail's telemetry (ADR-121 U1) ── */
const clearOf = (r) =>
  r && r.teleLeft != null && r.notes.length
    ? Math.round((r.teleLeft - Math.max(...r.notes.map((c) => c.box.x + c.box.w))) * 10) / 10
    : null;
line(
  `\ntelemetry  ${rest.tele.map((t) => `${t.k} x${t.x}–${Math.round((t.x + t.w) * 10) / 10} y${t.y}`).join(" · ") || "none drawn"}`
);
line(
  `list end   right ${rest.notesBox ? Math.round((rest.notesBox.x + rest.notesBox.w) * 10) / 10 : "—"} · ` +
    `clearance to the leftmost readout: rest ${clearOf(rest)} · hover ${clearOf(hover)} · Tab ${clearOf(kb)} · scrollbar ${rest.sb}px`
);
if (seat)
  line(
    `\nhead seat  band-top ${seat.bandTop}px · title top ${seat.title?.y} (from the stage ${Math.round(((seat.title?.y ?? 0) - seat.stageTop) * 10) / 10}) · ` +
      `brief top ${seat.brief?.y ?? "—"} · way out bottom ${seat.all?.b ?? "—"} of ${seat.vh} · ` +
      `designation y ${seat.desig?.y ?? "—"} · TL bracket bottom ${seat.cornerTl?.b ?? "—"} · nav bottom ${seat.nav?.b ?? "—"}`
  );
line(
  `\nreduced motion  ready ${prm.ready} · open ${prm.open} · list ${prm.display} · glass ${[...new Set(prm.backdrops)].join(",")}`
);
if (perfIdle)
  line(
    `perf idle   ${perfIdle.frames} frames  mean ${perfIdle.mean}ms  p95 ${perfIdle.p95}ms  max ${perfIdle.max}ms  >33ms ${perfIdle.longShare}%`
  );
if (perfHover)
  line(
    `perf hover  ${perfHover.frames} frames  mean ${perfHover.mean}ms  p95 ${perfHover.p95}ms  max ${perfHover.max}ms  >33ms ${perfHover.longShare}%`
  );

/* ── The gates ──────────────────────────────────────────────────────── */
const fails = [];
/* ⚠ THE HEAD HANGS FROM THE SERVICES LINE (ADR-121 U2): on the pinned rung
   the title's top is `--band-top` below the stage's, the brief starts on the
   title's line where the two share one, and the way out still ends inside
   the frame. The phone rung flows and has no line to hang from. */
if (!phone) {
  if (!seat || !seat.title) fails.push("the head's seat could not be read");
  else {
    const fromStage = seat.title.y - seat.stageTop;
    if (Math.abs(fromStage - seat.bandTop) > 0.5)
      fails.push(
        `the title sits ${Math.round(fromStage * 10) / 10}px down the stage, not on --band-top's ${seat.bandTop}`
      );
    if (seat.vw > 900 && seat.brief && Math.abs(seat.brief.y - seat.title.y) > 0.5)
      fails.push(`the brief starts at ${seat.brief.y}, not on the title's line at ${seat.title.y}`);
    if (seat.all && seat.all.b > seat.vh)
      fails.push(`the way out ends at ${seat.all.b}, past the ${seat.vh}px frame`);
  }
}
/* ⚠ THE CORRIDOR IS ALIVE THROUGH THE WHOLE BEAT, BY THE OWNER'S RULING
   (ADR-119 U1): on the stage rung the cards paint over the living corridor
   and the KILL is the band at the foot. The cover contract (ADR-030 §6 — its
   own opaque ground AND a painted surface) is asked of the band. */
const killStop = walk.find((s) => typeof s.p === "number" && s.p >= 0.3 && s.p <= 0.99);
if (killStop) {
  if (!LAB && killStop.stageMode && !(killStop.ambient && killStop.exit))
    fails.push(
      `the corridor died inside the row (ambient ${killStop.ambient}, exit ${killStop.exit})`
    );
  if (!LAB && !killStop.stageMode && (killStop.ambient || killStop.exit))
    fails.push(
      `the corridor outlived an opaque station (ambient ${killStop.ambient}, exit ${killStop.exit})`
    );
  /* ⚠ LANDING ONLY: the lab has no footer and no corridor, so with ADR-119's
     band deleted there is no cover to ask anything of there (ADR-105 U4). */
  if (!LAB && !/^rgba?\([^)]*, 1\)$|^rgb\(/.test(killStop.coverGround ?? ""))
    fails.push(`the cover's ground is not opaque: ${killStop.coverGround}`);
  if (!LAB && (killStop.coverImage ?? "none") === "none") fails.push("the cover paints no surface");
  if (!LAB && killStop.stageMode && (killStop.coverBox?.h ?? 0) < killStop.vh - 1)
    fails.push(`the cover is ${killStop.coverBox?.h}px against a ${killStop.vh}px frame`);
  /* ⚠ THE FOOTER IS WELDED ONE RISE OVER THE RUNWAY'S FOOT (ADR-105 U4):
     its top sits exactly `--mu-rise` above the runway's bottom, which is what
     makes it reach the frame's top as the runway releases. A weld that leaked
     or a rise that drifted from `--ft-weld` would open a gap or an overlap
     here, and every ADR-030 §6 reader keys on the footer's own top. */
  if (!LAB && killStop.muReady && killStop.runwayBox && killStop.contactBox) {
    const seam =
      killStop.contactBox.y - (killStop.runwayBox.y + killStop.runwayBox.h) + killStop.rise;
    if (Math.abs(seam) > 1)
      fails.push(
        `the footer sits ${Math.round(seam * 10) / 10}px off one rise above the runway's foot`
      );
  }
}
/* ── The seam with the era stage (ADR-121 U3), landing only ──────────
   On the stage rung the station is welded one viewport over the era stage:
   the station's top is exactly one frame above the era's bottom, the corner
   reads VOIDWALKER for every stop before the pin and MUSINGS from it, the
   era's lit chip still takes the click through the transparent station
   while the era is on screen, and by the time the head decodes the era's
   exit is complete with none of its text inked in the frame. */
if (!LAB && !phone) {
  const staged = walk.filter((s) => typeof s.p === "number" && s.stageMode && s.era?.present);
  for (const s of staged) {
    if (s.era.gap == null || Math.abs(s.era.gap + s.vh) > 1)
      fails.push(
        `the station sits ${s.era.gap}px off the era's bottom at p ${s.p} (weld: −${s.vh})`
      );
    if (s.era.edge !== "pin")
      fails.push(`no data-station-edge="pin" on the welded station at p ${s.p}`);
    if (s.p < 0 && s.activeStation !== "voidwalker")
      fails.push(`the HUD reads ${s.activeStation} at p ${s.p}, before the pin`);
    if (s.p >= 0.02 && s.p <= 0.9) {
      if (s.era.exit !== "1.0000")
        fails.push(`the era's exit is ${s.era.exit} at p ${s.p}, not complete`);
      if (s.era.inked > 0) fails.push(`${s.era.inked} era text runs still inked at p ${s.p}`);
    }
  }
  const approach = staged.find((s) => s.p === -1);
  if (approach) {
    if (!approach.era.chipHit) fails.push("the era's chip is not on screen at p −1.0");
    else if (!approach.era.chipHit.inBand || approach.era.chipHit.inMusings)
      fails.push("the transparent station swallows the era's chip at p −1.0");
  }
  const seamStop = staged.find((s) => s.p === 0.02);
  if (seamStop && seamStop.era.vwDocTop != null && seamStop.era.muDocTop != null) {
    /* Print the seam: from the era's content leaving (era p 0.96) to the head
       decoding (musings p 0.02), in px and viewports. 7.6svh since the weld
       (U3); 107.6svh before it. */
    const vwTravel = seamStop.era.vwH - seamStop.vh;
    const eraGoneY = seamStop.era.vwDocTop + 0.96 * vwTravel;
    const travel = seamStop.runwayBox.h - seamStop.vh - seamStop.rise;
    const headY = seamStop.era.muDocTop + 0.02 * travel;
    const seam = headY - eraGoneY;
    line(
      `seam · era content gone → head decodes: ${Math.round(seam)}px (${(seam / seamStop.vh).toFixed(3)} viewports) · weld ${seamStop.era.weld}px`
    );
  }
}
for (const s of walk) {
  if (typeof s.p !== "number") continue;
  if (phone) {
    if (s.muReady) fails.push(`the list pinned itself on the phone rung at p ${s.p}`);
    if (s.contactMt && s.contactMt !== "0px")
      fails.push(`the footer is welded on the phone rung at p ${s.p} (margin-top ${s.contactMt})`);
  } else if (!s.muReady && s.p >= 0 && s.p <= 1) fails.push(`no data-mu-ready at p ${s.p}`);
}
if (!phone) {
  /* ⚠ TEXT NEVER TRAVELS (U2). Wherever the stage is not parked the head is
     EMPTY, and through the dwell it is whole. */
  for (const s of walk) {
    if (typeof s.p !== "number" || !s.headState) continue;
    if (!s.pinned && !s.headState.blank)
      fails.push(`the head shows "${s.headState.sample}" on a moving stage at p ${s.p}`);
    if (s.pinned && s.p >= 0.3 && s.p <= 0.9 && !s.headState.whole)
      fails.push(`the head is not whole in the dwell at p ${s.p} ("${s.headState.sample}")`);
  }
  /* The notes arrive AFTER the head and fold BEFORE it leaves. */
  const mid = walk.find((s) => s.p === 0.45);
  if (mid && mid.arrive !== "in") fails.push(`the list is ${mid.arrive} at p 0.45, not in`);
  /* ⚠ AND NO EXIT AT THE BOTTOM (ADR-105 U4): the footer covering the list is
     the exit, so the list is still `in` at the end of the dwell. */
  const late = walk.find((s) => s.p === 0.99);
  if (late && late.arrive !== "in") fails.push(`the list is ${late.arrive} at p 0.99, not in`);

  /* ── REST: the newest note open; every title whole; every note a link. ── */
  if (rest.open !== 0) fails.push(`note ${rest.open} is open at rest, not note 0`);
  if (rest.notes.some((c) => !c.tabbable)) fails.push("a note's row is not a focusable link");
  if (rest.notes[0] && !/grid-template-columns/.test(rest.notes[0].transition))
    fails.push(`the note transitions ${rest.notes[0].transition}, not its cover column`);
  for (const c of rest.notes) {
    if (c.titleCut) fails.push(`note ${c.i}'s title is cut by its ellipsis`);
    if (c.title && c.title.lines !== 1)
      fails.push(`note ${c.i}'s title takes ${c.title.lines} lines`);
    /* The cover is UNFRAMED: the card is already the frame (round six). */
    if (c.coverBorder && parseFloat(c.coverBorder) > 0)
      fails.push(`note ${c.i}'s cover is framed (${c.coverBorder})`);
    if (c.coverGround && !/rgba\(0, 0, 0, 0\)|transparent/.test(c.coverGround))
      fails.push(`note ${c.i}'s cover paints a ground (${c.coverGround})`);
  }
  /* One thumbnail size; the open cover is square and GROWN. */
  const thumbs = rest.notes.filter((c) => !c.open && c.cover).map((c) => c.cover.w);
  const openNote = rest.notes.find((c) => c.open);
  if (thumbs.length && Math.max(...thumbs) - Math.min(...thumbs) > 1)
    fails.push(`the thumbnails are not one size (${Math.min(...thumbs)}–${Math.max(...thumbs)})`);
  if (openNote?.cover && Math.abs(openNote.cover.w - openNote.cover.h) > 1)
    fails.push(`the open cover is ${openNote.cover.w}×${openNote.cover.h}, not square`);
  if (openNote?.cover && thumbs.length && openNote.cover.w < 2 * Math.max(...thumbs))
    fails.push(
      `the open cover is ${openNote.cover.w}px against ${Math.max(...thumbs)}px thumbnails`
    );
  /* ⚠ INSIDE THE RAILS: the rows are solved from the count so the list ends
     on the rails' last tick; five notes may not scroll on a tall frame. */
  if (rest.notesBox && rest.railEnd != null && rest.notesBox.y + rest.notesBox.h > rest.railEnd + 1)
    fails.push(
      `the notes end at ${Math.round(rest.notesBox.y + rest.notesBox.h)}, past the rails' last tick at ${rest.railEnd}`
    );
  if (rest.notes.length <= 5 && rest.vh >= 1000 && rest.listScrolls)
    fails.push(`the list scrolls at ${rest.notes.length} notes on a ${rest.vh}px frame`);

  /* ── THE SIGN ON THE COVER'S FLOOR, wherever a note is open. ── */
  for (const [label, r] of [
    ["rest", rest],
    ["hover", hover],
    ["Tab", kb],
  ]) {
    if (!r) continue;
    const f = floorOf(r);
    if (f == null) fails.push(`${label}: the open note's sign could not be read`);
    else if (Math.abs(f) > 1.5) fails.push(`${label}: the sign ends ${f}px off the cover's floor`);
  }

  /* ── THE LIST ENDS BEFORE THE TELEMETRY (ADR-121 U1). ── */
  for (const [label, r] of [
    ["rest", rest],
    ["hover", hover],
    ["Tab", kb],
  ]) {
    const clear = clearOf(r);
    if (clear != null && clear < 12)
      fails.push(`${label}: the list ends ${clear}px from the telemetry (needs ≥ 12)`);
  }

  /* ── HOVER: note 2 opens; note 0 closes; leaving keeps note 2 open. ── */
  if (hover) {
    const want = Math.min(2, rest.notes.length - 1);
    if (hover.open !== want) fails.push(`hovering note ${want} opened note ${hover.open}`);
    const c0 = hover.notes[0];
    const cw = hover.notes[want];
    if (c0?.cover && thumbs.length && Math.abs(c0.cover.w - Math.min(...thumbs)) > 1.5)
      fails.push(`note 0 did not close to the thumbnail (${c0.cover.w}px)`);
    if (cw?.cover && openNote?.cover && Math.abs(cw.cover.w - openNote.cover.w) > 1.5)
      fails.push(`the hovered note's cover is ${cw.cover.w}px, not the open ${openNote.cover.w}px`);
  }
  if (back && hover && back.open !== hover.open)
    fails.push(`leaving the list moved the open note from ${hover.open} to ${back.open}`);
  if (kb && kb.open !== 1) fails.push(`tabbing into note 1 opened note ${kb.open}`);
  if (
    fails.some((f) => /^hovering|^note 0 did not|^the hovered|^leaving the list|^tabbing/.test(f))
  ) {
    line("");
    line("── the hover's own trace (it failed) ──");
    for (const e of hoverTrace) line(`  ${e}`);
  }

  /* ── GLASS: on every note on the stage rung in dark; none in light. ── */
  const glass = rest.notes.map((c) => c.backdrop);
  if (rest.stageMode && THEME === "dark") {
    if (!glass.every((g) => /blur\(/.test(g)))
      fails.push(`a note has no glass on the stage rung: ${glass.join(" | ")}`);
  } else if (glass.some((g) => /blur\(/.test(g)))
    fails.push(
      `glass where there is nothing to blur (${THEME}, stage ${rest.stageMode}): ${glass.join(" | ")}`
    );
  if (prm.backdrops.some((g) => /blur\(/.test(g))) fails.push("glass under reduced motion");
  if (prm.ready) fails.push("the list pinned itself under reduced motion");
  if (prm.open !== 0) fails.push(`reduced motion rests on note ${prm.open}`);

  /* ── THE RISE (ADR-105 U4), landing only. The footer rises over the PINNED
     list: at each quarter k of the rise its top is at vh·(1 − k), the list
     is `in` and the head whole under it, the stage has drifted a quarter of
     the rise and the veil dimmed toward 0.4, the corridor is alive while the
     list shows and dead once the frame is covered, and the readout has moved
     to CONTACT once the footer holds the middle. No void can open between the
     list and the footer. ── */
  if (!LAB) {
    if (rise.length !== RISE_KS.length) fails.push("the rise was not walked");
    for (const r of rise) {
      const want = r.vh * (1 - r.k);
      const at = r.contactBox?.y ?? NaN;
      if (!(Math.abs(at - want) <= 2))
        fails.push(`rise ${r.k}: the footer's top is at ${at}, not ${Math.round(want)}`);
      if (r.k < 1 && !r.pinned) fails.push(`rise ${r.k}: the stage unpinned under the footer`);
      if (r.arrive !== "in") fails.push(`rise ${r.k}: the list is ${r.arrive} under the footer`);
      if (r.k < 1 && !r.headState?.whole)
        fails.push(
          `rise ${r.k}: the head is not whole under the footer ("${r.headState?.sample}")`
        );
      if (r.stageAnim === "mu-under") {
        const wantTy = -0.25 * r.rise * r.k;
        if (Math.abs(r.stageTy - wantTy) > 2)
          fails.push(`rise ${r.k}: the stage drifted ${r.stageTy}px, not ${Math.round(wantTy)}`);
        if (Math.abs(r.veil - 0.4 * r.k) > 0.03)
          fails.push(`rise ${r.k}: the veil is ${r.veil}, not ${0.4 * r.k}`);
      }
      /* No void between the two: the stage's bottom stays under the footer. */
      const stageBottom = r.vh + r.stageTy;
      if (stageBottom < at - 1)
        fails.push(`rise ${r.k}: ${Math.round(at - stageBottom)}px of void opens above the footer`);
      if (r.stageMode && r.k <= 0.25 && !(r.ambient && r.exit))
        fails.push(`rise ${r.k}: the corridor died while the list still shows`);
      if (r.k === 1 && (r.ambient || r.exit))
        fails.push("the corridor outlived the footer's full cover");
      if (r.k >= 0.75 && r.activeStation !== "contact")
        fails.push(`rise ${r.k}: the HUD reads ${r.activeStation}, not contact`);
      if (r.k <= 0.25 && r.activeStation !== "musings")
        fails.push(`rise ${r.k}: the HUD reads ${r.activeStation}, not musings`);
    }
    const end = walk.find((s) => s.p === "footer-end");
    if (end) {
      if (!end.contactBox || end.contactBox.y > 0.5)
        fails.push(`the footer's top is at ${end.contactBox?.y} at the document's end`);
      if (end.contactBox && end.contactBox.y + end.contactBox.h < end.vh - 1)
        fails.push("the footer does not fill the frame at the document's end");
      if (end.contactPosition === "sticky")
        fails.push("#contact is still sticky (the bed is back)");
      if (end.muReady && end.contactZ !== "8")
        fails.push(`#contact is at z ${end.contactZ}, not 8`);
    }
    if (backUp) {
      if (backUp.arrive !== "in")
        fails.push(`scrolling back up, the footer lifts off a list that is ${backUp.arrive}`);
      if (!backUp.headState?.whole) fails.push("scrolling back up, the head is not whole");
    }
  }
  /* ⚠ THE READOUT NAMES THIS STATION FOR THE WHOLE BEAT. It is the one thing
     the sticky bed can silently take away, and nothing else measures it. */
  for (const s of walk) {
    if (typeof s.p !== "number" || s.p < 0 || s.p > 1) continue;
    if (s.activeStation !== "musings")
      fails.push(`the HUD reads ${s.activeStation} at p ${s.p}, not musings`);
  }
  /* ── `--perf` ── */
  if (perfHover && perfHover.longShare > PERF_LONG_SHARE_MAX)
    fails.push(
      `long frames while hovering: ${perfHover.longShare}% > ${PERF_LONG_SHARE_MAX}% — apply the recorded fallback (blur on the open card only, strips at .94)`
    );
}
if (notch) {
  /* ⚠ PINNED FROM BOTH ENDS, AND THE CENTRE FIRST. A one-sided read cannot
     tell a notch from a card the probe never reached. */
  if (!notch.mid) fails.push("the probe never reached the open card at all");
  else {
    if (!notch.tl || !notch.bl || !notch.br) fails.push("a corner other than the top-right is cut");
    if (notch.tr) fails.push("the top-right corner is NOT cut");
  }
}
for (const c of rest.notes)
  if (c.titlePx < 20 || (c.open && (c.ledePx < 13 || c.metaPx < 10)))
    fails.push(`type under the floor on note ${c.i}: ${c.titlePx}/${c.ledePx}/${c.metaPx}`);
if (errors.length) fails.push(`page errors: ${errors.join(" | ")}`);

line("");
if (fails.length === 0) line(`PASS · ${tag} · stills in ${OUT}/`);
else {
  line(`FAIL · ${tag}`);
  for (const f2 of fails) line(`  · ${f2}`);
}
await browser.close();
process.exit(fails.length === 0 ? 0 : 1);
