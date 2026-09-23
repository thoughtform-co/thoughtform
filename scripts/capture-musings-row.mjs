/**
 * Shoot the musings row and the footer's bed (ADR-121 / ADR-105 U3), and
 * measure what no unit test and no mechanical gate can.
 *
 * ⚠ **HEADED, AND REAL SCROLLS.** The station is a transparent stage under a
 * scroll-driven WebGL corridor: a headless context leaves the canvas dead and
 * a teleport skips the engagement band, so the corridor's exit attributes —
 * which decide whether this station's band is painting as the ambient's COVER
 * — never publish. `scripts/capture-site-footer.mjs`'s own law, one station up.
 *
 * ⚠ **THE THINGS THAT CANNOT BE GATED ANY OTHER WAY.** `arrive` and
 * `headDecode` are pure and unit-pinned, and the mechanic is one CSS
 * transition; nothing there knows whether the browser opened a card, whether
 * the title reflowed while it did, whether the glass is actually applied, or
 * whether the footer is uncovering. Specifically:
 *   · `coverOpaque`   — the band's own ground, the ADR-030 §6 contract.
 *   · `headBlank`     — the head is EMPTY at every stop the stage is not parked:
 *                       text never travels (ADR-119 U2).
 *   · `headWhole`     — and whole through the dwell.
 *   · `rest`          — card 0 open at rest, at ≥ 3× a strip's width.
 *   · `hover`         — the pointer over card 2 opens it inside `--mu-grow`
 *                       and card 0 collapses; leaving the row restores card 0.
 *   · `keyboard`      — Tab from card 0 opens card 1: focus opens as hover does.
 *   · `noReflow`      — the title's laid-out width is the same open and closed:
 *                       the body is set at the open width and UNCOVERED.
 *   · `glass`         — every face carries the blur on the stage rung in dark,
 *                       none in light, none under reduced motion.
 *   · `reveal`        — the footer's visible height growing as the row leaves.
 *   · `notchPaint`    — the corner, HIT-TESTED rather than parsed, from both ends.
 *   · `--perf`        — the long-frame share while parked and while the pointer
 *                       sweeps the row, against the proof card's recorded 15 %.
 *
 *   node scripts/capture-musings-row.mjs --vp 1920x1247 --theme dark --perf
 *   node scripts/capture-musings-row.mjs --vp 1920x1247 --theme light
 *   node scripts/capture-musings-row.mjs --vp 1280x720  --theme dark
 *   node scripts/capture-musings-row.mjs --vp 390x844   --theme dark
 *   node scripts/capture-musings-row.mjs --lab --n 5 --vp 1920x1247 --theme dark
 *
 * `--lab` drives `/test/musings-row` (the placeholder host, ADR-121) instead of
 * the landing: same gates on the row, none on the corridor or the footer,
 * which that route does not have.
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

/* Mirrored from `musings.css`'s `--mu-grow` (900ms) — the wait after a hover. */
const GROW_MS = 900;
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
await page.waitForSelector("#musings .mu-card", { timeout: 30_000 });

/** Walk down in real steps until `#musings` sits at the given runway fraction. */
async function rollToP(target) {
  for (let pass = 0; pass < 240; pass += 1) {
    const state = await page.evaluate(() => {
      const runway = document.querySelector(".mu__runway");
      if (!runway) return null;
      const travel = Math.max(1, runway.offsetHeight - document.documentElement.clientHeight);
      const top = runway.getBoundingClientRect().top;
      return { p: -top / travel, travel };
    });
    if (!state) return null;
    /* ⚠ CONVERGE, NEVER SOLVE ONCE. The corridor's lazy chunks grow the
       document under the scroll and this station's own runway appears at
       hydration, so a position solved before the roll lands somewhere else
       (the trinny route's `rollToP` law, and ADR-102's `rollToS`). */
    if (Math.abs(state.p - target) < 0.004) return state.p;
    const delta = (target - state.p) * state.travel;
    await page.evaluate((d) => window.scrollBy({ top: d, behavior: "instant" }), Math.round(delta));
    await page.waitForTimeout(70);
  }
  return null;
}

/* Engage the corridor with real wheel steps first — the exit attributes only
   publish on the way through, and the band's cover role depends on them. */
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
    /* ⚠ THE COVER IS THE BAND, NOT THE STATION (ADR-119 U1). On the stage
       rung `#musings` is TRANSPARENT and promoted — the corridor is alive
       behind the whole beat, by the owner's ruling — and the opaque thing
       that kills it is the 100svh `.mu__band` at the foot of the runway. On
       every lower rung the station is opaque again and IS its own cover. */
    const band = document.querySelector("#musings .mu__band");
    const stage = st?.dataset.muMode === "stage";
    const cover = stage && band ? band : st;
    const mu = document.querySelector(".mu");
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const cards = [...document.querySelectorAll(".mu-card")];
    const open = cards.findIndex((c) => c.hasAttribute("data-mu-open"));

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
      return { x: px(x), w: px(r - x), lines: rects.length };
    };

    const contact = document.getElementById("contact");
    const vh = document.documentElement.clientHeight;
    /* ⚠ "REVEALED" IS MEASURED OFF THE STATION'S BOTTOM, NOT THE FOOTER'S
       RECT. A sticky-bottom box's rect is PINNED to the frame's floor for the
       whole of the reveal, so intersecting it with the viewport reports the
       full viewport height at every stop (measured: 1247 → 1247). What the
       reader can see is the strip the opaque station above has left. */
    const mb = st?.getBoundingClientRect().bottom ?? vh;

    return {
      vh,
      ambient: document.documentElement.hasAttribute("data-services-ambient"),
      exit: document.documentElement.hasAttribute("data-corridor-exit"),
      ftReveal: document.documentElement.hasAttribute("data-ft-reveal"),
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
      revealed: px(Math.max(0, Math.min(vh, vh - mb))),
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
      rowBox: box(document.querySelector(".mu__row")),
      open,
      cards: cards.map((c, i) => {
        const s = getComputedStyle(c);
        const face = c.querySelector(".mu-card__front");
        const fs = getComputedStyle(face);
        return {
          i,
          open: c.hasAttribute("data-mu-open"),
          box: box(c),
          flexGrow: s.flexGrow,
          transition: s.transitionProperty,
          backdrop: fs.backdropFilter || fs.webkitBackdropFilter || "none",
          lip: getComputedStyle(face, "::before").backgroundColor,
          title: inkOf(c.querySelector(".mu-card__title")),
          lede: inkOf(c.querySelector(".mu-card__lede")),
          titlePx: px(parseFloat(getComputedStyle(c.querySelector(".mu-card__title")).fontSize)),
          ledePx: px(parseFloat(getComputedStyle(c.querySelector(".mu-card__lede")).fontSize)),
          kickerPx: px(parseFloat(getComputedStyle(c.querySelector(".mu-card__kicker")).fontSize)),
          cover: box(c.querySelector(".mu-cover")),
          beat: box(c.querySelector(".mu-cover__beat")),
          litMark: box(c.querySelector(".mu-cover__mark--lit")),
          tabbable: c.tabIndex >= 0 && !c.hasAttribute("aria-hidden"),
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
    const card = document.querySelector(".mu-card[data-mu-open]");
    const face = card?.querySelector(".mu-card__front");
    if (!card || !face) return null;
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
/* ⚠ −0.3 AND 1.15 ARE OFF THE PIN ON PURPOSE: the approach and the release,
   where the stage travels and the head must be EMPTY (U2). The pointer parks
   in the left margin for the whole walk, so no card is hovered by accident. */
await page.mouse.move(8, Math.round(H / 2));
const stops = [-0.3, 0.02, 0.14, 0.3, 0.45, 0.6, 0.75, 0.9, 0.99, 1.15];
const walk = [];
for (const p of stops) {
  const landed = await rollToP(p);
  await page.waitForTimeout(820); // the head's decode, plus a frame
  const r = await readRow();
  walk.push({ p, landed: landed == null ? null : Math.round(landed * 1000) / 1000, ...r });
  await page.screenshot({ path: `${OUT}/mu-${tag}-p${String(p).replace(".", "")}.png` });
}

const phone = W <= 960;

/* ── The row, seated and arrived ────────────────────────────────────── */
await rollToP(0.45);
/* ⚠ WAIT ON THE ARRIVAL, NEVER A FIXED SLEEP (ADR-119 U2). Re-entering the
   beat from below replays the owner's order — the head decodes (~0.7s), THEN
   the row's aperture opens (0.72s) — so a probe that sleeps reads the face
   mid-aperture, with every corner outside its clip. ⚠ ONLY WHERE THE ROW
   RUNS: on the phone rung the writer parks and there is no arrival stamp. */
if (!phone)
  await page.waitForFunction(
    () => {
      const mu = document.querySelector(".mu");
      const face = document.querySelector(".mu-card[data-mu-open] .mu-card__front");
      return mu?.dataset.muArrive === "in" && face && face.getAnimations().length === 0;
    },
    null,
    { timeout: 8000 }
  );
await page.waitForTimeout(GROW_MS + 100);
const rest = await readRow();
await page.screenshot({ path: `${OUT}/mu-${tag}-rest.png` });

/* Hover, leave, keyboard — the mechanic, asked of the browser. */
let hover = null;
let back = null;
let kb = null;
let perfIdle = null;
let perfHover = null;
if (!phone && rest.cards.length >= 2) {
  const t = rest.cards[Math.min(2, rest.cards.length - 1)];
  const centre = (c) => [c.box.x + c.box.w / 2, c.box.y + c.box.h / 2];
  await page.mouse.move(...centre(t), { steps: 4 });
  await page.waitForTimeout(GROW_MS + 150);
  hover = await readRow();
  await page.screenshot({ path: `${OUT}/mu-${tag}-hover.png` });
  /* Leave the row: back to the margin. */
  await page.mouse.move(8, Math.round(H / 2), { steps: 4 });
  await page.waitForTimeout(GROW_MS + 150);
  back = await readRow();
  /* Keyboard: focus card 0, Tab to card 1 — focus opens as hover does. */
  await page.evaluate(() => document.querySelector(".mu-card")?.focus());
  await page.keyboard.press("Tab");
  await page.waitForTimeout(GROW_MS + 150);
  kb = await readRow();
  await page.screenshot({ path: `${OUT}/mu-${tag}-focus.png` });
  await page.evaluate(() => document.activeElement?.blur());
  await page.waitForTimeout(GROW_MS + 150);

  /* ── `--perf`: parked, then the pointer sweeping the row ───────────── */
  if (PERF) {
    await perfStart();
    await page.waitForTimeout(1500);
    perfIdle = await perfStop();
    await perfStart();
    for (let pass = 0; pass < 2; pass += 1) {
      for (const c of rest.cards) {
        await page.mouse.move(...centre(c), { steps: 6 });
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

/* Past the row: the footer uncovering, then the document's end. Landing only —
   the lab has no footer and no corridor. */
if (!LAB) {
  for (const [name, frac] of [
    ["footer-half", 1.06],
    ["footer-end", 2.0],
  ]) {
    await page.evaluate(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: max, behavior: "instant" });
    });
    if (name === "footer-half") {
      /* ⚠ SEEK OFF THE STATION, NOT THE FOOTER. `#contact` is sticky through
         the whole reveal, so its rect is pinned and solving a scroll position
         from it converges on wherever the page already is. Half revealed
         means the station's BOTTOM sits at 55 % of the frame. */
      await page.evaluate(() => {
        const m = document.getElementById("musings");
        const y = m.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * 0.55;
        window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
      });
    }
    await page.waitForTimeout(700);
    const r = await readRow();
    walk.push({ p: name, landed: frac, ...r });
    await page.screenshot({ path: `${OUT}/mu-${tag}-${name}.png` });
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
await prmPage.waitForSelector("#musings .mu-card", { timeout: 30_000 });
await prmPage.waitForTimeout(600);
const prm = await prmPage.evaluate(() => {
  const mu = document.querySelector(".mu");
  const faces = [...document.querySelectorAll(".mu-card__front")];
  return {
    ready: mu?.hasAttribute("data-mu-ready") ?? false,
    open: [...document.querySelectorAll(".mu-card")].findIndex((c) =>
      c.hasAttribute("data-mu-open")
    ),
    backdrops: faces.map((f) => {
      const s = getComputedStyle(f);
      return s.backdropFilter || s.webkitBackdropFilter || "none";
    }),
    display: mu ? getComputedStyle(document.querySelector(".mu__row")).display : null,
  };
});
await prmCtx.close();

/* ── The readout ────────────────────────────────────────────────────── */
const line = (s) => console.log(s);
line(`\n══ MUSINGS ROW · ${tag} · port ${PORT}${LAB ? " · lab" : ""} ══`);
const first = walk[0];
line(`cover     ground ${first.coverGround} · image ${first.coverImage}`);
line(`          position ${first.coverPosition} z ${first.coverZ} · vh ${first.vh}`);
line(`head      ${JSON.stringify(first.head)} · display ${first.titlePx}px`);
line(
  `cards     ${first.cards.length} · type ${first.cards[0]?.titlePx}/${first.cards[0]?.ledePx}/${first.cards[0]?.kickerPx}px`
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
  "  p      landed  ready  pinned open  arrive  head (level · text)              ambient/exit  ftReveal  readout   #contact            revealed"
);
for (const s of walk) {
  const pad = (v, n) => String(v).padEnd(n);
  const head = s.headState ? `${s.headState.level ?? "—"} · "${s.headState.sample}"` : "—";
  line(
    `  ${pad(s.p, 6)} ${pad(s.landed, 7)} ${pad(s.muReady, 6)} ${pad(s.pinned, 6)} ${pad(s.open, 5)} ${pad(s.arrive, 7)} ` +
      `${pad(head, 34)} ${pad(`${s.ambient}/${s.exit}`, 13)} ` +
      `${pad(s.ftReveal, 9)} ${pad(s.activeStation, 9)} ${pad(`${s.contactPosition} z${s.contactZ} y${s.contactBox?.y}`, 19)} ${s.revealed}`
  );
}

const showCards = (label, r) => {
  if (!r) return;
  line(`\n── ${label} (open ${r.open}) · row ${JSON.stringify(r.rowBox)} ──`);
  for (const c of r.cards) {
    line(
      `  ${c.i}${c.open ? "*" : " "} w ${String(c.box?.w).padEnd(8)} grow ${String(c.flexGrow).padEnd(4)} ` +
        `title w ${String(c.title?.w).padEnd(8)} lines ${c.title?.lines}  glass ${c.backdrop.slice(0, 12).padEnd(12)} ` +
        `lip ${c.lip}  cover ${c.cover?.h}px  glyph ${c.beat?.w ?? "—"}px`
    );
  }
};
showCards("rest", rest);
showCards("hover card 2", hover);
showCards("Tab from card 0", kb);
line(
  `\nreduced motion  ready ${prm.ready} · open ${prm.open} · row ${prm.display} · glass ${[...new Set(prm.backdrops)].join(",")}`
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
  if (!/^rgba?\([^)]*, 1\)$|^rgb\(/.test(killStop.coverGround ?? ""))
    fails.push(`the cover's ground is not opaque: ${killStop.coverGround}`);
  if ((killStop.coverImage ?? "none") === "none") fails.push("the cover paints no surface");
  if (killStop.stageMode && (killStop.coverBox?.h ?? 0) < killStop.vh - 1)
    fails.push(`the band is ${killStop.coverBox?.h}px against a ${killStop.vh}px frame`);
}
for (const s of walk) {
  if (typeof s.p !== "number") continue;
  if (phone) {
    if (s.muReady) fails.push(`the row pinned itself on the phone rung at p ${s.p}`);
    if (s.ftReveal) fails.push(`the footer's bed armed on the phone rung at p ${s.p}`);
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
  /* The cards arrive AFTER the head and close BEFORE it leaves. */
  const mid = walk.find((s) => s.p === 0.45);
  if (mid && mid.arrive !== "in") fails.push(`the row is ${mid.arrive} at p 0.45, not in`);
  const late = walk.find((s) => s.p === 0.99);
  if (late && late.arrive === "in") fails.push("the row is still open at p 0.99");

  /* ── REST: the newest post open, at three strips' width or more. ── */
  const strips = rest.cards.filter((c) => !c.open);
  const stripW = strips.length ? Math.min(...strips.map((c) => c.box.w)) : 0;
  const stripMax = strips.length ? Math.max(...strips.map((c) => c.box.w)) : 0;
  if (rest.open !== 0) fails.push(`card ${rest.open} is open at rest, not card 0`);
  if (rest.cards[0] && stripW > 0 && rest.cards[0].box.w < 3 * stripW)
    fails.push(`the open card is ${rest.cards[0].box.w}px against strips of ${stripW}px (< 3×)`);
  if (stripMax - stripW > 1) fails.push(`the strips are not one width (${stripW}–${stripMax})`);
  if (rest.cards[0] && !/flex-grow/.test(rest.cards[0].transition))
    fails.push(`the card transitions ${rest.cards[0].transition}, not flex-grow`);
  if (rest.cards.some((c) => !c.tabbable)) fails.push("a card is not focusable");
  /* Every cover ends on one datum; every glyph is whole in the narrowest strip.
     ⚠ AND EVERY COVER IS ITS CARD'S WIDTH. The body's definite open width grew
     the face's `auto` column to itself on the first run, and the cover
     stretched with it — a 930px cover inside a 120px strip, its glyph 464px
     in. The glyph gate saw it; this is the direct question. */
  const coverHs = new Set(rest.cards.map((c) => Math.round(c.cover?.h ?? 0)));
  if (coverHs.size > 1) fails.push(`the covers are not one height (${[...coverHs].join(", ")})`);
  for (const c of rest.cards)
    if (c.cover && c.box && Math.abs(c.cover.w - c.box.w) > 1)
      fails.push(`card ${c.i}'s cover is ${c.cover.w}px wide in a ${c.box.w}px card`);
  for (const c of strips)
    if (c.beat && c.box && (c.beat.x < c.box.x || c.beat.x + c.beat.w > c.box.x + c.box.w))
      fails.push(`card ${c.i}'s glyph is not whole inside its strip`);

  /* ── HOVER: card 2 opens inside the grow; card 0 collapses; leave restores. ── */
  if (hover) {
    const want = Math.min(2, rest.cards.length - 1);
    if (hover.open !== want) fails.push(`hovering card ${want} opened card ${hover.open}`);
    const c0 = hover.cards[0];
    const cw = hover.cards[want];
    if (cw && c0 && cw.box.w < 3 * c0.box.w)
      fails.push(
        `the hovered card is ${cw.box.w}px against card 0's ${c0.box.w}px (< 3×) after the grow`
      );
    if (c0 && Math.abs(c0.box.w - stripW) > 1.5)
      fails.push(`card 0 did not collapse to a strip (${c0.box.w}px against ${stripW})`);
    /* ⚠ NO REFLOW: the title's laid-out width is the same open and closed. */
    const closedTitle = rest.cards[want]?.title;
    const openTitle = cw?.title;
    if (closedTitle && openTitle && Math.abs(closedTitle.w - openTitle.w) > 0.6)
      fails.push(`the title reflowed on open (${closedTitle.w} → ${openTitle.w}px)`);
    if (closedTitle && openTitle && closedTitle.lines !== openTitle.lines)
      fails.push(
        `the title's line count changed on open (${closedTitle.lines} → ${openTitle.lines})`
      );
  }
  if (back && back.open !== 0) fails.push(`leaving the row left card ${back.open} open`);
  if (kb && kb.open !== 1) fails.push(`Tab from card 0 opened card ${kb.open}, not card 1`);

  /* ── GLASS: on every face on the stage rung in dark; none in light. ── */
  const glass = rest.cards.map((c) => c.backdrop);
  if (rest.stageMode && THEME === "dark") {
    if (!glass.every((g) => /blur\(/.test(g)))
      fails.push(`a face has no glass on the stage rung: ${glass.join(" | ")}`);
  } else if (glass.some((g) => /blur\(/.test(g)))
    fails.push(
      `glass where there is nothing to blur (${THEME}, stage ${rest.stageMode}): ${glass.join(" | ")}`
    );
  if (prm.backdrops.some((g) => /blur\(/.test(g))) fails.push("glass under reduced motion");
  if (prm.ready) fails.push("the row pinned itself under reduced motion");
  if (prm.open !== 0) fails.push(`reduced motion rests on card ${prm.open}`);

  /* ── The bed, the readout, the footer (landing only). ── */
  if (!LAB) {
    const ends = walk.filter((s) => typeof s.p === "number" && s.p >= 0.9 && s.p <= 0.99);
    const armed = walk.filter((s) => s.ftReveal);
    if (!armed.length) fails.push("the footer's bed was never armed");
    if (!rest.stageMode && ends.some((s) => !s.ftReveal))
      fails.push("the footer's bed was not armed inside the row");
    if (rest.stageMode && ends.some((s) => s.ftReveal))
      fails.push("the footer's bed armed while the row was still over the live corridor");
    const half = walk.find((s) => s.p === "footer-half");
    const end = walk.find((s) => s.p === "footer-end");
    if (half && end && !(end.revealed > half.revealed + 8))
      fails.push(`the footer did not uncover (${half.revealed} → ${end.revealed})`);
    if (end && end.contactPosition !== "sticky")
      fails.push(`#contact is ${end.contactPosition}, not sticky, at the document's end`);
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
for (const c of rest.cards)
  if (c.open && (c.titlePx < 16 || c.ledePx < 12 || c.kickerPx < 10))
    fails.push(`type under the floor: ${c.titlePx}/${c.ledePx}/${c.kickerPx}`);
if (errors.length) fails.push(`page errors: ${errors.join(" | ")}`);

line("");
if (fails.length === 0) line(`PASS · ${tag} · stills in ${OUT}/`);
else {
  line(`FAIL · ${tag}`);
  for (const f2 of fails) line(`  · ${f2}`);
}
await browser.close();
process.exit(fails.length === 0 ? 0 : 1);
