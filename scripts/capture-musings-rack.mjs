/**
 * Shoot the musings rack and the footer's bed (ADR-119 / ADR-105 U3), and
 * measure what no unit test and no mechanical gate can.
 *
 * ⚠ **HEADED, AND REAL SCROLLS.** The rack is the first opaque station under a
 * scroll-driven WebGL corridor: a headless context leaves the canvas dead and
 * a teleport skips the engagement band, so the corridor's exit attributes —
 * which decide whether this station is painting as the ambient's COVER — never
 * publish. `scripts/capture-site-footer.mjs`'s own law, one station up.
 *
 * ⚠ **THE THINGS THAT CANNOT BE GATED ANY OTHER WAY.** `rackMath` is pure and
 * unit-pinned, but nothing there knows whether the browser applied a pose to
 * an element, whether a card's ink prints through its neighbour, or whether
 * the footer is actually uncovering. Specifically:
 *   · `coverOpaque`   — the station's own ground, the ADR-030 §6 contract.
 *   · `poses`         — every card's transform actually assigned, not computed.
 *   · `frontInk`      — the front card's title/lede clear of its neighbours.
 *   · `detent`        — one whole card per step of the reading band.
 *   · `reveal`        — the footer's visible height growing as the rack leaves.
 *   · `notchPaint`    — the corner, HIT-TESTED rather than parsed: a computed
 *                       `clip-path` keeps its percentages and `calc()`s, so a
 *                       pixel-pair regex measures the serialisation and finds
 *                       one point in five (ADR-098 U5).
 *
 *   node scripts/capture-musings-rack.mjs --vp 1920x1247 --theme dark
 *   node scripts/capture-musings-rack.mjs --vp 1280x720  --theme light
 *   node scripts/capture-musings-rack.mjs --vp 390x844   --theme dark
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
mkdirSync(OUT, { recursive: true });

const tag = `${W}x${H}-${THEME}`;
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));

await page.goto(`http://localhost:${PORT}/?theme=${THEME}`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#musings", { timeout: 30_000 });

/** Walk down in real steps until `#musings` sits at the given runway fraction. */
async function rollToP(target) {
  for (let pass = 0; pass < 240; pass += 1) {
    const state = await page.evaluate(() => {
      const runway = document.querySelector(".mu__runway");
      if (!runway) return null;
      const travel = Math.max(1, runway.offsetHeight - document.documentElement.clientHeight);
      const top = runway.getBoundingClientRect().top;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return { p: -top / travel, y: window.scrollY, max, wantY: window.scrollY - top };
    });
    if (!state) return null;
    /* ⚠ CONVERGE, NEVER SOLVE ONCE. The corridor's lazy chunks grow the
       document under the scroll and this station's own runway appears at
       hydration, so a position solved before the roll lands somewhere else
       (the trinny route's `rollToP` law, and ADR-102's `rollToS`). */
    const travel = state.max;
    const want = Math.max(0, Math.min(travel, state.wantY + target * (H * 0 + 1) * 0));
    if (Math.abs(state.p - target) < 0.004) return state.p;
    const runwayTravel = await page.evaluate(() => {
      const r = document.querySelector(".mu__runway");
      return Math.max(1, r.offsetHeight - document.documentElement.clientHeight);
    });
    const delta = (target - state.p) * runwayTravel;
    await page.evaluate(
      (d) => window.scrollBy({ top: d, behavior: "instant" }),
      Math.round(delta)
    );
    await page.waitForTimeout(70);
    void want;
    void travel;
  }
  return null;
}

/* Engage the corridor with real wheel steps first — the exit attributes only
   publish on the way through, and the rack's own cover role depends on them. */
for (let i = 0; i < 90; i += 1) {
  const top = await page.evaluate(
    () => document.querySelector("#musings")?.getBoundingClientRect().top ?? 1e9
  );
  if (top <= H * 0.9) break;
  await page.mouse.wheel(0, Math.round(H * 0.9));
  await page.waitForTimeout(70);
}
await page.waitForTimeout(900);

const readRack = () =>
  page.evaluate(() => {
    const px = (v) => Math.round(v * 100) / 100;
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: px(r.left), y: px(r.top), w: px(r.width), h: px(r.height) };
    };
    const st = document.getElementById("musings");
    const mu = document.querySelector(".mu");
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const cards = [...document.querySelectorAll(".mu-card")];
    const front = cards.findIndex((c) => c.hasAttribute("data-mu-front"));

    /* Ink rects, not element boxes: a card is 400px around a 26px title, so an
       element-rect overlap test reports collisions for type that is clear
       (mobile-sections.md §5's own finding). */
    const inkOf = (el) => {
      if (!el) return null;
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
      range.detach();
      if (!rects.length) return null;
      return {
        x: px(Math.min(...rects.map((r) => r.left))),
        y: px(Math.min(...rects.map((r) => r.top))),
        r: px(Math.max(...rects.map((r) => r.right))),
        b: px(Math.max(...rects.map((r) => r.bottom))),
      };
    };

    const contact = document.getElementById("contact");
    const vh = document.documentElement.clientHeight;
    /* ⚠ **"REVEALED" IS MEASURED OFF THE RACK'S BOTTOM, NOT THE FOOTER'S OWN
       RECT — AND THE FIRST CUT OF THIS SCRIPT GOT IT WRONG.** A sticky-bottom
       box's rect is PINNED to the frame's floor for the whole of the reveal,
       so intersecting it with the viewport reports the full viewport height
       at every stop and the gate passed a footer that was never uncovered
       (measured: 1247 → 1247 at 1920×1247). What the reader can see is the
       strip the opaque station above has left, which is the station's own
       bottom edge. A guard measuring a model of the drawing rather than the
       drawing, one surface later. */
    const mb = document.getElementById("musings")?.getBoundingClientRect().bottom ?? vh;

    return {
      vh,
      ambient: document.documentElement.hasAttribute("data-services-ambient"),
      exit: document.documentElement.hasAttribute("data-corridor-exit"),
      ftReveal: document.documentElement.hasAttribute("data-ft-reveal"),
      muReady: mu?.hasAttribute("data-mu-ready") ?? false,

      /* The cover contract (ADR-030 §6): its own opaque ground AND a painted
         surface. A station whose only ground is its content fails both. */
      coverGround: cs(st)?.backgroundColor ?? null,
      coverImage: (cs(st)?.backgroundImage ?? "none").slice(0, 26),
      coverPosition: cs(st)?.position ?? null,
      coverZ: cs(st)?.zIndex ?? null,
      coverBox: box(st),

      /* The footer's bed. `revealed` is how much of it the reader can see. */
      contactPosition: cs(contact)?.position ?? null,
      contactZ: cs(contact)?.zIndex ?? null,
      contactBox: box(contact),
      revealed: px(Math.max(0, Math.min(vh, vh - mb))),

      clock: {
        entry: cs(mu)?.getPropertyValue("--mu-entry").trim() || null,
        fan: cs(mu)?.getPropertyValue("--mu-fan").trim() || null,
        drift: cs(mu)?.getPropertyValue("--mu-drift").trim() || null,
      },
      front,
      cards: cards.map((c, i) => {
        const s = getComputedStyle(c);
        return {
          i,
          front: c.hasAttribute("data-mu-front"),
          /* ⚠ THE INLINE STYLE, NOT THE COMPUTED MATRIX. A computed
             `transform` is a resolved matrix mid-transition, so it cannot say
             whether the WRITER assigned a pose — only where the card is right
             now. Both are reported: `assigned` proves the writer ran, `box`
             proves the browser applied it. */
          assigned: c.style.transform ? c.style.transform.slice(0, 96) : null,
          opacity: px(Number(s.opacity)),
          zIndex: s.zIndex,
          box: box(c),
          title: inkOf(c.querySelector(".mu-card__title")),
          lede: inkOf(c.querySelector(".mu-card__lede")),
          titlePx: px(parseFloat(getComputedStyle(c.querySelector(".mu-card__title")).fontSize)),
          ledePx: px(parseFloat(getComputedStyle(c.querySelector(".mu-card__lede")).fontSize)),
          kickerPx: px(
            parseFloat(getComputedStyle(c.querySelector(".mu-card__kicker")).fontSize)
          ),
          cover: box(c.querySelector(".mu-cover")),
          beat: !!c.querySelector(".mu-cover__beat"),
          litMark: box(c.querySelector(".mu-cover__mark--lit")),
        };
      }),
      rig: box(document.querySelector(".mu__rig")),
      head: box(document.querySelector(".mu__head")),
      titlePx: px(parseFloat(cs(document.querySelector(".mu__title"))?.fontSize ?? "0")),
      all: box(document.querySelector(".mu__all")),
    };
  });

/**
 * The corner, hit-tested.
 *
 * ⚠ A COMPUTED `clip-path` KEEPS ITS PERCENTAGES AND `calc()`s, so parsing it
 * measures the SERIALISATION. `elementFromPoint` asks what actually painted —
 * and the corner is pinned from BOTH ENDS, because "the TR is cut" passing
 * tells you nothing if the other three are cut too (ADR-065 U5's own lesson:
 * a one-sided assertion verifies the notch IS somewhere, not that it is right).
 */
const readNotch = () =>
  page.evaluate(() => {
    const card = document.querySelector(".mu-card[data-mu-front]");
    if (!card) return null;
    const r = card.getBoundingClientRect();
    const ch = parseFloat(getComputedStyle(card).getPropertyValue("--mu-ch")) || 18;
    /* A point well inside each corner's chamfer triangle: 30 % along the cut
       from the corner, which is outside the polygon for a cut corner and
       inside it for a square one. */
    const d = ch * 0.3;
    const probe = (x, y) => {
      const el = document.elementFromPoint(Math.round(x), Math.round(y));
      return el ? card.contains(el) || el === card : false;
    };
    return {
      ch: Math.round(ch * 10) / 10,
      tl: probe(r.left + d, r.top + d),
      tr: probe(r.right - d, r.top + d),
      bl: probe(r.left + d, r.bottom - d),
      br: probe(r.right - d, r.bottom - d),
      /* The ring itself: a pixel just inside the diagonal should be the ring's
         own paint, i.e. still the card. */
      onCut: probe(r.right - ch * 0.5, r.top + ch * 0.5),
    };
  });

/* ── The walk ───────────────────────────────────────────────────────── */
const stops = [0.02, 0.14, 0.3, 0.45, 0.6, 0.75, 0.9, 0.99];
const walk = [];
for (const p of stops) {
  const landed = await rollToP(p);
  await page.waitForTimeout(820); // the detent's 720ms transition, plus a frame
  const r = await readRack();
  walk.push({ p, landed: landed == null ? null : Math.round(landed * 1000) / 1000, ...r });
  await page.screenshot({ path: `${OUT}/mu-${tag}-p${String(p).replace(".", "")}.png` });
}

/* ⚠ THE NOTCH IS READ WHILE THE RACK IS ON SCREEN. `elementFromPoint` works
   in the VISUAL viewport: read after the footer walk, the front card's rect is
   two viewports above the frame, every probe lands outside it and all four
   corners report "cut" — which is how the first run of this script reported a
   square card as notched on three sides. Seat it first. */
await rollToP(0.45);
await page.waitForTimeout(820);
const notch = await readNotch();

/* Past the rack: the footer uncovering, then the document's end. */
for (const [name, frac] of [
  ["footer-half", 1.06],
  ["footer-end", 2.0],
]) {
  await page.evaluate(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: max, behavior: "instant" });
  });
  if (name === "footer-half") {
    /* ⚠ SEEK OFF THE RACK, NOT THE FOOTER. `#contact` is sticky through the
       whole reveal, so its rect is pinned and solving a scroll position from
       it converges on wherever the page already is (ADR-102's `rollToS` law:
       a clamped or pinned clock is not a convergence target). Half revealed
       means the rack's BOTTOM sits at 55 % of the frame. */
    await page.evaluate(() => {
      const m = document.getElementById("musings");
      const y = m.getBoundingClientRect().bottom + window.scrollY - window.innerHeight * 0.55;
      window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
    });
  }
  await page.waitForTimeout(700);
  const r = await readRack();
  walk.push({ p: name, landed: frac, ...r });
  await page.screenshot({ path: `${OUT}/mu-${tag}-${name}.png` });
}

/* ── The readout ────────────────────────────────────────────────────── */
const line = (s) => console.log(s);
line(`\n══ MUSINGS RACK · ${tag} · port ${PORT} ══`);
const first = walk[0];
line(`cover     ground ${first.coverGround} · image ${first.coverImage}`);
line(`          position ${first.coverPosition} z ${first.coverZ} · vh ${first.vh}`);
line(`head      ${JSON.stringify(first.head)} · display ${first.titlePx}px`);
line(`cards     ${first.cards.length} · type ${first.cards[0]?.titlePx}/${first.cards[0]?.ledePx}/${first.cards[0]?.kickerPx}px`);
line(`notch     ch ${notch?.ch} · TL ${notch?.tl} TR ${notch?.tr} BL ${notch?.bl} BR ${notch?.br} · onCut ${notch?.onCut}`);
line("");
line("  p      landed  ready  front  entry   fan     ambient/exit  ftReveal  #contact            revealed");
for (const s of walk) {
  const pad = (v, n) => String(v).padEnd(n);
  line(
    `  ${pad(s.p, 6)} ${pad(s.landed, 7)} ${pad(s.muReady, 6)} ${pad(s.front, 6)} ` +
      `${pad(s.clock.entry, 7)} ${pad(s.clock.fan, 7)} ${pad(`${s.ambient}/${s.exit}`, 13)} ` +
      `${pad(s.ftReveal, 9)} ${pad(`${s.contactPosition} z${s.contactZ} y${s.contactBox?.y}`, 19)} ${s.revealed}`
  );
}

/* Poses and ink, at the stop where the rack is fully open. */
const open = walk.find((s) => Number(s.clock?.fan) > 0.98) ?? walk[3];
line(`\n── poses at p ${open.p} (front ${open.front}) ──`);
for (const c of open.cards) {
  line(
    `  ${c.i}${c.front ? "*" : " "} op ${String(c.opacity).padEnd(6)} z ${String(c.zIndex).padEnd(3)} ` +
      `box ${JSON.stringify(c.box)} beat ${c.beat ? "y" : "-"}  ${c.assigned ?? "NO POSE ASSIGNED"}`
  );
}

/* The one reading a still cannot give: does the front card's ink print
   through a neighbour's box? Only the front card is read, because it is the
   only one the reader is asked to read. */
const f = open.cards[open.front];
const clashes = [];
if (f) {
  for (const c of open.cards) {
    if (c.i === f.i || c.opacity < 0.02 || !c.box) continue;
    for (const [what, ink] of [
      ["title", f.title],
      ["lede", f.lede],
    ]) {
      if (!ink) continue;
      const over =
        ink.x < c.box.x + c.box.w && ink.r > c.box.x && ink.y < c.box.y + c.box.h && ink.b > c.box.y;
      /* A neighbour BEHIND the front card overlapping it is the composition;
         what matters is a neighbour painting OVER it, i.e. a higher z. */
      if (over && Number(c.zIndex) > Number(f.zIndex)) clashes.push(`${what} under card ${c.i}`);
    }
  }
}
line(`\nfront ink  ${clashes.length === 0 ? "clear of every card above it" : clashes.join(" · ")}`);

/* ── The gates ──────────────────────────────────────────────────────── */
const fails = [];
const killStop = walk.find((s) => typeof s.p === "number" && s.p >= 0.3);
if (killStop) {
  if (killStop.ambient || killStop.exit)
    fails.push(`the corridor is still live inside the rack (ambient ${killStop.ambient}, exit ${killStop.exit})`);
  if (!/^rgba?\([^)]*, 1\)$|^rgb\(/.test(killStop.coverGround ?? ""))
    fails.push(`the cover's ground is not opaque: ${killStop.coverGround}`);
  if ((killStop.coverImage ?? "none") === "none") fails.push("the cover paints no surface");
}
const phone = W <= 960;
for (const s of walk) {
  if (typeof s.p !== "number") continue;
  if (phone) {
    if (s.muReady) fails.push(`the rack posed itself on the phone rung at p ${s.p}`);
    if (s.ftReveal) fails.push(`the footer's bed armed on the phone rung at p ${s.p}`);
  } else if (!s.muReady) fails.push(`no data-mu-ready at p ${s.p}`);
}
if (!phone) {
  const seen = new Set(walk.filter((s) => typeof s.p === "number").map((s) => s.front));
  if (seen.size < 2) fails.push(`the detent never advanced (front stayed ${[...seen]})`);
  if (open.cards.some((c) => !c.assigned)) fails.push("a card was never posed by the writer");
  if (clashes.length) fails.push(`front ink under a card above it: ${clashes.join(", ")}`);
  const ends = walk.filter((s) => typeof s.p === "number" && s.p >= 0.9);
  if (ends.some((s) => !s.ftReveal)) fails.push("the footer's bed was not armed inside the rack");
  const half = walk.find((s) => s.p === "footer-half");
  const end = walk.find((s) => s.p === "footer-end");
  if (half && end && !(end.revealed > half.revealed + 8))
    fails.push(`the footer did not uncover (${half.revealed} → ${end.revealed})`);
  if (end && end.contactPosition !== "sticky")
    fails.push(`#contact is ${end.contactPosition}, not sticky, at the document's end`);
}
if (notch) {
  if (!notch.tl || !notch.bl || !notch.br) fails.push("a corner other than the top-right is cut");
  if (notch.tr) fails.push("the top-right corner is NOT cut");
}
for (const c of open.cards)
  if (c.front && (c.titlePx < 16 || c.ledePx < 12 || c.kickerPx < 10))
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
