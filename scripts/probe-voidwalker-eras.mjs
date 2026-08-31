/**
 * probe-voidwalker-eras — walk every era on the live hologram and measure the
 * dossier panels for clipping.
 *
 * The roster is authored copy in fixed seats (`--vwh-lede-h` / `--vwh-seat-h`,
 * ADR-082 U11), so a new era is a new chance to overrun one. A screenshot
 * cannot settle it: text that overflows a seat by a line looks like text that
 * ends there.
 *
 * ⚠ AND `scrollHeight === clientHeight` IS NOT THE WHOLE TEST. A centred box
 * spills equally through its top and bottom and reports zero overflow — the
 * casefile learned that one plate over. So this measures the RECTS too: the
 * lede's painted bottom against the seat below it, which is where a long
 * record body would actually land.
 *
 * Usage (dev server must already be running, headed — the corridor is WebGL):
 *   node scripts/probe-voidwalker-eras.mjs [--port 3003] [--vp 1440x900]
 */

import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const [VW, VH] = argOf("--vp", "1440x900").split("x").map(Number);

const browser = await chromium.launch({ headless: args.includes("--headless") });
const ctx = await browser.newContext({
  viewport: { width: VW, height: VH },
  reducedMotion: "no-preference",
});
const page = await ctx.newPage();
await page.goto(`http://localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
// ⚠ The corridor is lazy and inflates layout late, so the station's own node is
// the ready signal — a fixed sleep races the dev server's first compile.
await page.waitForSelector("#voidwalker .vw", { timeout: 90_000 });
await page
  .locator(".home-v2-stage")
  .first()
  .scrollIntoViewIfNeeded()
  .catch(() => {});
await page.waitForTimeout(1500);

/* ⚠ WALK TO A MEASURED FRACTION OF THE RUNWAY, NOT A COUNT OF WHEEL NOTCHES —
   and read the mode off the STATION.

   Both halves were wrong and they hid each other. `data-vw-mode` is written on
   `#voidwalker` (voidwalker.css:50 selects `#voidwalker[data-vw-mode=…]`), so
   the old `#voidwalker .vw` read returned null forever and the loop always ran
   its full 40 notches; 40 × 400px then overshot into the part of the runway
   where `--vwh-in` is 0, where every chip is at `opacity: 0`. Playwright
   reports that as "<div class='vw vw--hologram'> intercepts pointer events",
   which reads like a z-index fault and is really "you are looking at the wrong
   scroll position". Measured at 1440×900: runway 0.30 → chip opacity 0 and
   `elementFromPoint` returns nothing; runway 0.45 → the chip hit-tests itself.

   The station is a 260svh pinned runway and the era band is [0.16, 0.72] of it
   (ADR-082 U10), so 0.45 is the middle of the hold — clear of the entry and the
   exit at both ends. This is `capture-voidwalker-station.mjs`'s own walk. */
const geom = await page.evaluate(() => {
  const runway = document.querySelector("#voidwalker .vw");
  if (!runway) return null;
  return {
    top: runway.getBoundingClientRect().top + window.scrollY,
    travel: runway.offsetHeight - window.innerHeight,
  };
});
if (!geom || geom.travel <= 0) {
  console.log("  x the station has no runway — is the capable gate met at this viewport?");
  await browser.close();
  process.exit(1);
}
await page.evaluate(
  async (to) => {
    let y = window.scrollY;
    while (Math.abs(to - y) > 600) {
      y += Math.sign(to - y) * 600;
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, to);
  },
  Math.round(geom.top + 0.45 * geom.travel)
);
await page.waitForTimeout(1200);

const mode = await page.getAttribute("#voidwalker", "data-vw-mode");
if (mode !== "hologram") {
  console.log(`  ! the station is in mode "${mode}", not "hologram" — measuring anyway`);
}

const tabs = await page
  .locator("[data-vwh-era-tab]")
  .evaluateAll((els) => els.map((e) => e.getAttribute("data-vwh-era-tab")));
console.log("eras on the rail:", tabs.join(" · "));

/* ⚠ WALK THE ERAS WITH THE KEYBOARD, NOT WITH A CLICK PER CHIP (ADR-082 U20).
   The band is a bounded reel window that keeps the selected era at its centre,
   so at any moment two of the five chips are outside it — clipped, and an
   `overflow: clip` box is not scrollable, so Playwright cannot bring one into
   view. It retries until it times out and reports "element is not stable",
   which reads like an animation fault and is really "that chip is off the
   reel". Measured: the composition settles in ~400ms and every rect is then
   byte-identical frame to frame.

   The roving focus IS the answer rather than a workaround — `Home` and
   `ArrowRight` are how a keyboard reader drives this control, `selectAndFocus`
   re-centres the reel on each step, and it exercises the real handler. The
   pointer contract is asserted separately below, on the centred chip, which is
   the only one a pointer can ever be over. */
await page.locator("[data-vwh-era-tab][data-on='true']").first().focus();
await page.keyboard.press("Home");
await page.waitForTimeout(700);

const rows = [];
for (const era of tabs) {
  if (era !== tabs[0]) {
    await page.keyboard.press("ArrowRight");
  }
  // ⚠ WAIT OUT THE MASTHEAD DECODE. An era change re-scrambles the title, so a
  // short settle reports "The campaign commaIW4P" and any title assertion is
  // reading a frame of the animation rather than the copy.
  await page.waitForTimeout(1800);
  const r = await page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        sel,
        over: el.scrollHeight - el.clientHeight,
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        h: Math.round(rect.height),
      };
    };
    // ⚠ MEASURE THE INK, NOT THE BOX. A panel's box carries padding and the
    // seats are deliberately tight, so box overlap is the normal composition —
    // it reported 24px on `genai`, an era nobody had touched and which reads
    // correctly on screen. What actually matters is whether one panel's
    // GLYPHS reach into another's, and a Range over the text nodes is the only
    // thing that answers it.
    const inkOf = (el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let top = Infinity;
      let bottom = -Infinity;
      let left = Infinity;
      let right = -Infinity;
      let node;
      while ((node = walker.nextNode())) {
        if (!node.nodeValue.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
          if (r.width < 0.5 || r.height < 0.5) continue;
          top = Math.min(top, r.top);
          bottom = Math.max(bottom, r.bottom);
          left = Math.min(left, r.left);
          right = Math.max(right, r.right);
        }
      }
      return Number.isFinite(top) ? { top, bottom, left, right } : null;
    };

    const panels = [...document.querySelectorAll("#voidwalker .vwd__body")]
      .map((el) => {
        /* ⚠ THE HEAD IS A SIBLING, NOT A CHILD (ADR-082 U19). The datum
           composition makes each head and body separate grid items on
           purpose — that is what puts a head's bottom edge exactly ON a row
           boundary, which is where its rail runs. Looking for it inside the
           body finds nothing and every panel reports "?". */
        const cell = el.getAttribute("data-cell");
        const head = cell
          ? document.querySelector(`#voidwalker .vwd__head[data-cell="${cell}"]`)
          : null;
        const ink = inkOf(el);
        if (!ink) return null;
        return {
          head: head ? head.textContent.trim() : "?",
          over: el.scrollHeight - el.clientHeight,
          /* ⚠ REPORT THE MARGIN, NOT JUST THE VERDICT. `over === 0` says a
             panel fits; it does not say by how much, so a seat with 2px left
             and one with 60px read identically and the next pass that spends
             height cannot tell which viewport it is about to break.
             ⚠ AND `clientHeight - scrollHeight` CANNOT BE THAT NUMBER: on an
             `overflow: hidden` box `scrollHeight` is `max(clientHeight,
             content)`, so it is exactly 0 whenever the content fits and only
             ever measures the overflow. The honest headroom is the gap between
             the LAST GLYPH and the box's own bottom edge. */
          foot: Math.round(el.getBoundingClientRect().bottom - ink.bottom),
          top: Math.round(ink.top),
          bottom: Math.round(ink.bottom),
          left: Math.round(ink.left),
          right: Math.round(ink.right),
        };
      })
      .filter(Boolean);
    return {
      era: document.querySelector("#voidwalker .vwd")?.getAttribute("data-vwh-era"),
      title: document.querySelector("#voidwalker .vwd__mast__title")?.textContent,
      slot: box("#voidwalker .vwh__slot"),
      panels,
    };
  });
  rows.push({ era, ...r });
}

/* ⚠ THE REEL'S PITCH IS SOLVED AGAINST A CONTRACT NOBODY HAS EXERCISED YET.
   `--vwd-cell` clears the widest SHIPPED `short` (11 chars) comfortably, but
   `character-eras.test.ts` pins `short.length <= 14`, and at 14 the clearance
   falls to ~10px at the two binding rungs (1101px and the 700px phone). So
   measure the rendered names rather than trusting the arithmetic: a 14-char
   era added later would touch its neighbour with every other guard green. */
const reel = await page.evaluate(() => {
  const band = document.querySelector("#voidwalker .vwd__band");
  if (!band) return null;
  /* ⚠ THE PITCH COMES FROM THE DRAWING, NOT FROM THE TOKEN. An unregistered
     custom property reads back as its unresolved TEXT — `--vwd-cell` returns
     "max(calc(64px + clamp(24px, 3.2vw, 72px)), 96px)", so `parseFloat` gives
     NaN and the whole check silently skips. Chips are centred in equal cells,
     so the gap between two adjacent chip CENTRES is the cell pitch. */
  const chips = [...document.querySelectorAll("#voidwalker .vwd__chip")];
  if (chips.length < 2) return null;
  const mid = (el) => {
    const r = el.getBoundingClientRect();
    return r.left + r.width / 2;
  };
  const cell = Math.abs(mid(chips[1]) - mid(chips[0]));
  if (!Number.isFinite(cell) || cell <= 0) return null;
  let widest = 0;
  let who = "";
  for (const n of document.querySelectorAll("#voidwalker .vwd__chip__name")) {
    const w = n.getBoundingClientRect().width;
    if (w > widest) {
      widest = w;
      who = n.textContent.trim();
    }
  }
  /* ⚠ THE CENTRED CHIP MUST TAKE A POINTER AT ITS OWN CENTRE. It is the only
     chip a pointer can ever be over, and a mis-click here does not merely light
     the wrong era — it PINS THE SCROLL to that era's slice (ADR-082 U10), so it
     is a navigation error. This is what the cell's `justify-self: center` buys:
     without it every chip stretches to the full pitch and adjacent targets abut
     with no dead ground between them. */
  const live = document.querySelector("#voidwalker .vwd__chip[data-on='true']");
  let hit = null;
  if (live) {
    const r = live.getBoundingClientRect();
    const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    hit = at === live || live.contains(at);
  }
  return {
    cell: Math.round(cell * 10) / 10,
    widest: Math.round(widest * 10) / 10,
    who,
    hit,
  };
});

let bad = 0;
if (reel) {
  const slack = Math.round((reel.cell - reel.widest) * 10) / 10;
  const ok = slack >= 12 && reel.hit === true;
  if (!ok) bad += 1;
  console.log(
    `${ok ? "ok  " : "FAIL"} reel pitch ${reel.cell}px vs widest name "${reel.who}" ${reel.widest}px — ` +
      `${slack}px slack (need >= 12), centred chip takes a pointer: ${reel.hit}`
  );
}
for (const r of rows) {
  const overflows = r.panels.filter((p) => p.over > 1);
  // A panel whose painted box reaches into another's is the failure a
  // scrollHeight check cannot see.
  //
  // ⚠ IT MUST OVERLAP ON BOTH AXES. The sheet is TWO COLUMNS — Scope left,
  // Transmission and On-record right (ADR-082 U11) — so panels sharing a band
  // of rows is the normal composition, not a fault. A vertical-only test fired
  // on `genai`, an era this pass never touched, which is how you can tell the
  // guard is wrong rather than the layout.
  const collisions = [];
  for (let i = 0; i < r.panels.length - 1; i += 1) {
    for (let j = i + 1; j < r.panels.length; j += 1) {
      const a = r.panels[i];
      const b = r.panels[j];
      const overlapV = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      const overlapH = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      if (overlapV > 1 && overlapH > 1) collisions.push(`${a.head} → ${b.head} (${overlapV}px)`);
    }
  }
  const flag = overflows.length || collisions.length ? "FAIL" : "ok  ";
  if (overflows.length || collisions.length) bad += 1;
  const tightest = r.panels.reduce((a, p) => (p.foot < a.foot ? p : a), r.panels[0]);
  console.log(
    `${flag} ${String(r.era).padEnd(11)} "${r.title}"  panels=${r.panels.length}` +
      `  tightest=${tightest.head.replace(/\s+/g, " ")} foot ${tightest.foot}px` +
      (overflows.length
        ? `  OVERFLOW: ${overflows.map((p) => `${p.head}+${p.over}px`).join(", ")}`
        : "") +
      (collisions.length ? `  COLLIDE: ${collisions.join(", ")}` : "")
  );
}

await browser.close();
console.log(
  bad
    ? `\n${bad} finding(s) — a clipped panel, a collision, or a reel pitch under its slack`
    : "\nall eras clean"
);
process.exit(bad ? 1 : 0);
