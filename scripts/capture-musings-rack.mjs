/**
 * Shoot the musings row and the footer's bed (ADR-119 U2 / ADR-105 U3), and
 * measure what no unit test and no mechanical gate can.
 *
 * ⚠ **HEADED, AND REAL SCROLLS.** The rack is the first opaque station under a
 * scroll-driven WebGL corridor: a headless context leaves the canvas dead and
 * a teleport skips the engagement band, so the corridor's exit attributes —
 * which decide whether this station is painting as the ambient's COVER — never
 * publish. `scripts/capture-site-footer.mjs`'s own law, one station up.
 *
 * ⚠ **THE THINGS THAT CANNOT BE GATED ANY OTHER WAY.** `rowMath` and
 * `headDecode` are pure and unit-pinned, but nothing there knows whether the
 * browser applied a pose to an element, whether a card's ink prints through
 * its neighbour, or whether the footer is actually uncovering. Specifically:
 *   · `coverOpaque`   — the station's own ground, the ADR-030 §6 contract.
 *   · `poses`         — every card's transform actually assigned, not computed.
 *   · `tilt`          — every neighbour's COMPUTED matrix is a pure X rotation
 *                       (U2: "rotated on the x-axis"; U0 and U1 were Y).
 *   · `centred`       — the card being read sits on the band's centre (U2).
 *   · `headBlank`     — the head is EMPTY at every stop the stage is not parked:
 *                       text never travels (U2 — U1's head was never blank).
 *   · `headWhole`     — and whole through the reading band.
 *   · `telemetry`     — the row's fade is fully transparent before the right
 *                       rail's readouts begin, so no plate lies under them.
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
    /* ⚠ THE COVER IS THE BAND, NOT THE STATION (ADR-119 U1). On the stage
       rung `#musings` is TRANSPARENT and promoted — the corridor is alive
       behind the whole beat, by the owner's ruling — and the opaque thing
       that kills it is the 100svh `.mu__band` at the foot of the runway. On
       every lower rung the station is opaque again and IS its own cover, so
       the fallback is not a convenience: it is the other two rungs. */
    const band = document.querySelector("#musings .mu__band");
    const stage = st?.dataset.muMode === "stage";
    const cover = stage && band ? band : st;
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
      /* ⚠ THE HUD'S OWN READOUT. `#contact` is sticky through this beat, and
         a picker reading the PAINTED rect reports it as the active station
         from the moment the bed arms — the corner said CONTACT for the whole
         of the musings beat and the `musings` row never lit. */
      activeStation: document.documentElement.getAttribute("data-active-station"),
      muReady: mu?.hasAttribute("data-mu-ready") ?? false,

      /* The cover contract (ADR-030 §6): its own opaque ground AND a painted
         surface. A station whose only ground is its content fails both. */
      coverGround: cs(cover)?.backgroundColor ?? null,
      coverImage: (cs(cover)?.backgroundImage ?? "none").slice(0, 26),
      coverPosition: cs(st)?.position ?? null,
      stageMode: stage,
      coverZ: cs(st)?.zIndex ?? null,
      coverBox: box(cover),

      /* The footer's bed. `revealed` is how much of it the reader can see. */
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
        const brief = document.querySelector(".mu__brief-typed [data-mu-decode]")?.textContent ?? "";
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
      windowBox: box(document.querySelector(".mu__window")),
      rin: [...document.querySelectorAll(".rin-tele")]
        .map((e) => box(e))
        .filter((b) => b && b.w > 0 && b.h > 0),
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
          tilt: c.dataset.muTilt ?? null,
          /* ⚠ THE COMPUTED MATRIX, NOT THE ASSIGNED STRING: a pure rotation
             about X leaves the X basis untouched — m11 = 1 and m12 = m13 =
             m21 = m31 = 0 — whatever the tilt and wherever the translate.
             Any Y or Z turn, from any rule, shows up here. */
          pureX: (() => {
            const m = s.transform.match(/matrix3d\(([^)]+)\)/);
            if (!m) return s.transform === "none" || /^matrix\(1, 0, 0, 1,/.test(s.transform);
            const v = m[1].split(",").map(Number);
            const ok = (a, b) => Math.abs(a - b) < 1e-3;
            return ok(v[0], 1) && ok(v[1], 0) && ok(v[2], 0) && ok(v[4], 0) && ok(v[8], 0);
          })(),
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
    const face = card?.querySelector(".mu-card__front");
    if (!card || !face) return null;
    const ch = parseFloat(getComputedStyle(card).getPropertyValue("--mu-ch")) || 18;
    /* A point well inside each corner's chamfer triangle: 30 % along the cut
       from the corner, which is outside the polygon for a cut corner and
       inside it for a square one. */
    const d = ch * 0.3;

    /* ⚠ A BOUNDING RECT IS NOT THE SHAPE, AND UNDER A 3D POSE IT IS NOT EVEN
       THE RIGHT QUADRILATERAL. U1's shelf stood at a few degrees about Y, so a
       card projected to a TRAPEZOID and `getBoundingClientRect` reported its
       axis-aligned bound — a box whose four corners are all OUTSIDE the shape.
       The row's open card is upright, but the probe keeps the method: it is
       the one that stays right if a pose ever moves it. Probed there, every
       corner of a correctly notched card reports "cut", and the gate agrees
       with itself while measuring nothing: four falses read as three
       unlawful notches. So the probe points are resolved the way this house
       resolves a custom property — through a real element laid out in the
       face's OWN space, whose rect is the projected position of that local
       point (ADR-102's law, one surface over). */
    /* ⚠ EVERY MARKER IS SEATED, READ AND REMOVED BEFORE ANY HIT TEST RUNS.
       Interleaving them reads the earlier points against a subtree that the
       later `appendChild`/`remove` pairs are still mutating, and the singular
       `elementFromPoint` then answers about a layout that no longer exists
       while `elementsFromPoint`, called after the last mutation, answers
       correctly — two readings of the same point disagreeing, which is how
       this probe reported a card it could not reach at all. */
    const local = {
      tl: [`${d}px`, `${d}px`],
      tr: [`calc(100% - ${d}px)`, `${d}px`],
      bl: [`${d}px`, `calc(100% - ${d}px)`],
      br: [`calc(100% - ${d}px)`, `calc(100% - ${d}px)`],
      /* ⚠ NO `onCut` PROBE. It asked at `ch × 0.5` from the corner, which is
         EXACTLY ON the cut's diagonal (the chamfer runs from `(w − ch, 0)` to
         `(w, ch)`, so `y = x − (w − ch)` passes through that point) — a
         boundary case that resolves by rounding and read FALSE at 1920×1247
         and TRUE at 390×844 on one unchanged card. And it was redundant: `tr`
         already probes 30 % along the cut, well inside the removed triangle,
         which is the question. A gate whose answer depends on which side of a
         pixel a device lands is not a gate.
         The ring cannot be hit-tested at all — it is `pointer-events: none`. */
      /* The centre, which must hit whatever happens at the corners — a card
         the probe cannot reach at all is a broken probe, not a square card. */
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
    /* Settle the subtree the markers were appended to before hit-testing it. */
    void face.getBoundingClientRect();

    const hits = {};
    const out = { ch: Math.round(ch * 10) / 10 };
    /* ⚠ **`elementFromPoint` AND `elementsFromPoint()[0]` DISAGREE INSIDE A 3D
       RENDERING CONTEXT, AND THE SINGULAR ONE IS WRONG HERE.** Measured at
       1920×1247 on the same six points: the plural form returns
       `span.mu-cover__field` / `a.mu-card`, the singular form returns
       `div.mu__rig` / `div.mu__rack` — the shelf's `preserve-3d` ANCESTORS, at
       a point the card demonstrably paints. Every corner then reads "cut" and
       a card with one lawful notch is reported as having three unlawful ones,
       with no pixel on screen to say so. ADR-098 U5 chose a hit test over a
       regex because a computed `clip-path` measures its own serialisation;
       this is the next layer of the same lesson — a hit test is only a hit
       test if it walks the stack the browser actually painted.

       ⚠ AND THE QUESTION IS ASKED OF THE FACE, NOT THE CARD. The clip lives on
       `.mu-card__front` since the pivot had to give up every grouping
       property; the PIVOT still occupies its full unclipped box, so
       `card.contains(el)` is true inside the chamfer and the notch reads as
       absent. */
    for (const [k, [x, y]] of Object.entries(points)) {
      const el = document.elementsFromPoint(x, y)[0] ?? null;
      hits[k] = el
        ? `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ")[0]}`
        : "null";
      out[k] = el ? face.contains(el) || el === face : false;
    }
    out.hits = hits;
    return out;
  });

/* ── The walk ───────────────────────────────────────────────────────── */
/* ⚠ −0.3 AND 1.15 ARE OFF THE PIN ON PURPOSE: the approach and the release,
   where the stage travels and the head must be EMPTY (U2). */
const stops = [-0.3, 0.02, 0.14, 0.3, 0.45, 0.6, 0.75, 0.9, 0.99, 1.15];
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
/* ⚠ WAIT ON THE ARRIVAL, NEVER A FIXED SLEEP (ADR-119 U2). Re-entering the
   beat from below replays the owner's order — the head decodes (~0.7s), THEN
   the row's aperture opens (0.72s) — so a probe that sleeps for the detent
   alone reads the face mid-aperture, with every corner outside its clip. */
/* ⚠ ONLY WHERE THE ROW RUNS. On the phone rung the writer parks and there is
   no arrival stamp at all — the rail is the finished page. */
if (W > 960)
  await page.waitForFunction(
    () => {
      const mu = document.querySelector(".mu");
      const face = document.querySelector(".mu-card[data-mu-front] .mu-card__front");
      return mu?.dataset.muArrive === "in" && face && face.getAnimations().length === 0;
    },
    null,
    { timeout: 8000 }
  );
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
line(`notch     ch ${notch?.ch} · mid ${notch?.mid} · TL ${notch?.tl} TR ${notch?.tr} BL ${notch?.bl} BR ${notch?.br}`);
line(`notch     hits ${JSON.stringify(notch?.hits)}`);
line("");
line("  p      landed  ready  pinned open  head (level · text)              ambient/exit  ftReveal  readout   #contact            revealed");
for (const s of walk) {
  const pad = (v, n) => String(v).padEnd(n);
  const head = s.headState ? `${s.headState.level ?? "—"} · "${s.headState.sample}"` : "—";
  line(
    `  ${pad(s.p, 6)} ${pad(s.landed, 7)} ${pad(s.muReady, 6)} ${pad(s.pinned, 6)} ${pad(s.front, 5)} ` +
      `${pad(head, 34)} ${pad(`${s.ambient}/${s.exit}`, 13)} ` +
      `${pad(s.ftReveal, 9)} ${pad(s.activeStation, 9)} ${pad(`${s.contactPosition} z${s.contactZ} y${s.contactBox?.y}`, 19)} ${s.revealed}`
  );
}

/* Poses and ink, at a stop where the row is open and being read. */
const open = walk.find((s) => s.p === 0.45) ?? walk[4];
line(`\n── poses at p ${open.p} (front ${open.front}) ──`);
for (const c of open.cards) {
  line(
    `  ${c.i}${c.front ? "*" : " "} op ${String(c.opacity).padEnd(6)} z ${String(c.zIndex).padEnd(3)} ` +
      `tilt ${String(c.tilt).padEnd(3)} pureX ${c.pureX ? "y" : "N"} box ${JSON.stringify(c.box)}  ${c.assigned ?? "NO POSE ASSIGNED"}`
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

/* The row's tilt, mirrored from `rowMath.ts`'s `ROW_TILT`, which
   `tests/lib/musings-row.test.ts` pins. */
const ROW_TILT = 60;

/* ── The gates ──────────────────────────────────────────────────────── */
const fails = [];
/* ⚠ THE CORRIDOR IS ALIVE THROUGH THE WHOLE BEAT, BY THE OWNER'S RULING
   (ADR-119 U1), SO THIS GATE ASKS THE OPPOSITE QUESTION IT USED TO. The rack
   shipped as an opaque station and the first version of this gate asserted the
   corridor was DEAD inside it; the owner read that live and it is the complaint
   that deleted `#practice` (ADR-105) — an opaque station in normal flow can
   only arrive by TRAVELLING over a pinned stage that does not move, which is
   what he named as parallax. On the stage rung the cards paint over the living
   corridor and the KILL is the band at the foot. The cover contract (ADR-030
   §6 — its own opaque ground AND a painted surface) is unchanged; it is asked
   of the band. */
const killStop = walk.find((s) => typeof s.p === "number" && s.p >= 0.3 && s.p <= 0.99);
if (killStop) {
  if (killStop.stageMode && !(killStop.ambient && killStop.exit))
    fails.push(`the corridor died inside the shelf (ambient ${killStop.ambient}, exit ${killStop.exit})`);
  if (!killStop.stageMode && (killStop.ambient || killStop.exit))
    fails.push(`the corridor outlived an opaque station (ambient ${killStop.ambient}, exit ${killStop.exit})`);
  if (!/^rgba?\([^)]*, 1\)$|^rgb\(/.test(killStop.coverGround ?? ""))
    fails.push(`the cover's ground is not opaque: ${killStop.coverGround}`);
  if ((killStop.coverImage ?? "none") === "none") fails.push("the cover paints no surface");
  if (killStop.stageMode && (killStop.coverBox?.h ?? 0) < killStop.vh - 1)
    fails.push(`the band is ${killStop.coverBox?.h}px against a ${killStop.vh}px frame`);
}
const phone = W <= 960;
for (const s of walk) {
  if (typeof s.p !== "number") continue;
  if (phone) {
    if (s.muReady) fails.push(`the rack posed itself on the phone rung at p ${s.p}`);
    if (s.ftReveal) fails.push(`the footer's bed armed on the phone rung at p ${s.p}`);
  } else if (!s.muReady && s.p >= 0 && s.p <= 1) fails.push(`no data-mu-ready at p ${s.p}`);
}
if (!phone) {
  const seen = new Set(walk.filter((s) => typeof s.p === "number").map((s) => s.front));
  if (seen.size < 2) fails.push(`the detent never advanced (front stayed ${[...seen]})`);
  if (open.cards.some((c) => !c.assigned)) fails.push("a card was never posed by the writer");
  if (clashes.length) fails.push(`front ink under a card above it: ${clashes.join(", ")}`);
  /* ⚠ THE ROW TURNS ABOUT X AND NOTHING ELSE (U2), asked of the COMPUTED
     matrix so no rule anywhere can slip a Y turn back in. */
  for (const c of open.cards) {
    if (!c.pureX) fails.push(`card ${c.i} carries a rotation other than about X`);
    if (c.front) {
      if (c.tilt !== "0") fails.push(`the card being read reads tilt ${c.tilt}`);
      continue;
    }
    if (c.tilt !== String(ROW_TILT)) fails.push(`card ${c.i} reads tilt ${c.tilt}, not ${ROW_TILT}`);
  }
  /* ⚠ CENTRED ON THE BAND (U2 — "the entire stack … should be centered"). The
     card being read is upright, so its rect IS its shape. */
  const fc = open.cards[open.front];
  if (fc?.box && open.windowBox) {
    const dx = fc.box.x + fc.box.w / 2 - (open.windowBox.x + open.windowBox.w / 2);
    if (Math.abs(dx) > 2) fails.push(`the card being read sits ${dx.toFixed(1)}px off the band's centre`);
  }
  /* ⚠ THE FADE ENDS BEFORE THE TELEMETRY BEGINS. The window's mask is fully
     transparent from 97 % out, so that is the row's last paintable column. */
  if (open.windowBox && open.rin.length) {
    const lastInk = open.windowBox.x + open.windowBox.w * 0.97;
    const firstTele = Math.min(...open.rin.map((b) => b.x));
    if (lastInk > firstTele + 0.5)
      fails.push(`the row can paint to x ${lastInk.toFixed(0)}, past the readouts at ${firstTele}`);
  }
  /* ⚠ TEXT NEVER TRAVELS (U2). Wherever the stage is not parked the head is
     EMPTY — U1's head was never blank, so its glyphs rode the stage in and
     out — and through the reading band it is whole. */
  for (const s of walk) {
    if (typeof s.p !== "number" || !s.headState) continue;
    if (!s.pinned && !s.headState.blank)
      fails.push(`the head shows "${s.headState.sample}" on a moving stage at p ${s.p}`);
    if (s.pinned && s.p >= 0.3 && s.p <= 0.9 && !s.headState.whole)
      fails.push(`the head is not whole in the reading band at p ${s.p} ("${s.headState.sample}")`);
  }
  /* ⚠ THE BED ARMS ON THE BAND'S TOP, NOT THE RUNWAY'S (ADR-119 U1). On the
     stage rung the shelf's whole runway is transparent, so an armed bed there
     would put the held footer under a live canvas for three viewports. The
     edge is the band's own top, which is the last viewport of the station. */
  const ends = walk.filter((s) => typeof s.p === "number" && s.p >= 0.9 && s.p <= 0.99);
  const armed = walk.filter((s) => s.ftReveal);
  if (!armed.length) fails.push("the footer's bed was never armed");
  /* ⚠ THE READOUT NAMES THIS STATION FOR THE WHOLE BEAT. It is the one thing
     the sticky bed can silently take away, and nothing measured it. */
  for (const s of walk) {
    if (typeof s.p !== "number" || s.p < 0 || s.p > 1) continue;
    if (s.activeStation !== "musings")
      fails.push(`the HUD reads ${s.activeStation} at p ${s.p}, not musings`);
  }
  if (!open.stageMode && ends.some((s) => !s.ftReveal))
    fails.push("the footer's bed was not armed inside the shelf");
  if (open.stageMode && ends.some((s) => s.ftReveal))
    fails.push("the footer's bed armed while the shelf was still over the live corridor");
  const half = walk.find((s) => s.p === "footer-half");
  const end = walk.find((s) => s.p === "footer-end");
  if (half && end && !(end.revealed > half.revealed + 8))
    fails.push(`the footer did not uncover (${half.revealed} → ${end.revealed})`);
  if (end && end.contactPosition !== "sticky")
    fails.push(`#contact is ${end.contactPosition}, not sticky, at the document's end`);
}
if (notch) {
  /* ⚠ PINNED FROM BOTH ENDS, AND THE CENTRE FIRST. A one-sided read cannot
     tell a notch from a card the probe never reached: under the shelf's yaw
     the old rect-corner probe missed the shape entirely and reported three
     unlawful notches on a card that has one. */
  if (!notch.mid) fails.push("the probe never reached the open card at all");
  else {
    if (!notch.tl || !notch.bl || !notch.br) fails.push("a corner other than the top-right is cut");
    if (notch.tr) fails.push("the top-right corner is NOT cut");
  }
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
