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
 * ⚠ AND AT <=700px IT IS A DIFFERENT INSTRUMENT, SO IT IS A DIFFERENT WALK.
 * The phone rung (ADR-083, voidwalker-datum.css §E) is ONE screen — `.vwd` is
 * `height: 100svh; overflow: hidden` with a tab row choosing which single
 * head+body pair the stage shows — so there are no four seats to collide and
 * nothing to overflow a fixed seat. What can go wrong there is the opposite:
 * a short era leaving a DEAD BAND between the copy and the era reel, and the
 * fixed bottom-right theme/session cluster printing through the reel's own
 * right-hand chips. `--vp 390x844` measures those instead.
 *
 * Usage (dev server must already be running, headed — the corridor is WebGL):
 *   node scripts/probe-voidwalker-eras.mjs [--port 3003] [--vp 1440x900]
 *   node scripts/probe-voidwalker-eras.mjs --vp 390x844      # the phone rung
 */

import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const [VW, VH] = argOf("--vp", "1440x900").split("x").map(Number);
/* The §E rung's own gate, read from the viewport rather than from a flag: the
   phone instrument IS the composition below 701px and there is no attribute
   that says so. Everything else in this file is the desktop walk, untouched. */
const PHONE = VW <= 700;

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

/* ⚠ THE REEL'S PITCH IS SOLVED AGAINST A CONTRACT NOBODY HAS EXERCISED YET.
   `--vwd-cell` clears the widest SHIPPED `short` (11 chars) comfortably, but
   `character-eras.test.ts` pins `short.length <= 14`, and at 14 the clearance
   falls to ~10px at the two binding rungs (1101px and the 700px phone). So
   measure the rendered names rather than trusting the arithmetic: a 14-char
   era added later would touch its neighbour with every other guard green.

   ⚠ BOTH RUNGS RUN THIS, WHICH IS WHY IT IS A FUNCTION. The 700px phone is one
   of the two the clearance is solved at, and a hit-test the desktop walk owns
   privately is a contract the rung that binds hardest never exercises. */
const measureReel = () =>
  page.evaluate(() => {
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

/* ═══ THE PHONE INSTRUMENT (<=700px) ════════════════════════════════════
   ⚠ THERE IS NO RUNWAY DOWN HERE, SO THERE IS NOTHING TO WALK A FRACTION OF.
   `data-vw-mode="hologram"` is written at >=1101px only, so below 701 the
   station is plain flow: `.vw--hologram` never takes its 260svh and the
   desktop walk's `offsetHeight - innerHeight` is ~0, which makes it bail with
   "the station has no runway". The reading position is instead the one where
   the instrument IS the screen — `.vwd` is `height: 100svh`, so aligning its
   top with the viewport's puts the era reel's bottom edge on the viewport's
   bottom edge. That is also the only position at which the FIXED bottom-right
   settings cluster can print through the reel, so it is the position the
   clearance has to be measured at. */
if (PHONE) {
  const parkPhone = () =>
    page.evaluate(async () => {
      const root = document.querySelector("#voidwalker .vwd");
      if (!root) return null;
      const to = Math.round(root.getBoundingClientRect().top + window.scrollY);
      let y = window.scrollY;
      while (Math.abs(to - y) > 600) {
        y += Math.sign(to - y) * 600;
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, to);
      return to;
    });
  // Twice: the corridor inflates layout late, so the first park is measured
  // against a document that is still growing above the station.
  if ((await parkPhone()) === null) {
    console.log("  x no `.vwd` on the page — is the phone composition mounted at this viewport?");
    await browser.close();
    process.exit(1);
  }
  await page.waitForTimeout(700);
  await parkPhone();
  await page.waitForTimeout(700);

  const eras = await page
    .locator("#voidwalker [data-vwh-era-tab]")
    .evaluateAll((els) => els.map((e) => e.getAttribute("data-vwh-era-tab")));
  const tabNames = await page
    .locator("#voidwalker .vwd__tab")
    .evaluateAll((els) =>
      els.map((e) =>
        e.classList.contains("vwd__tab--figure")
          ? "figure"
          : (e.firstChild?.nodeValue || e.textContent || "").trim().split(/\s+/)[0]
      )
    );
  console.log(`eras on the reel: ${eras.join(" · ")}`);
  console.log(`readings on the row: ${tabNames.join(" · ")}`);

  /* One page-side read per stop. Everything it returns is a RECT, because the
     two defects this rung has are both about where a box ends up. */
  const readStop = () =>
    page.evaluate(() => {
      const stage = document.querySelector("#voidwalker .vwd__stage");
      const band = document.querySelector("#voidwalker .vwd__band");
      const sheet = document.querySelector("#voidwalker .vwd__sheet");
      if (!stage || !band || !sheet) return null;

      /* ⚠ THE INK, NOT THE BOX — the desktop walk's own helper, for the same
         reason: a cell's box carries padding the reader cannot see, so the
         composition a reader judges is where the GLYPHS start and stop. */
      const inkOf = (el) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let top = Infinity;
        let bottom = -Infinity;
        let node;
        while ((node = walker.nextNode())) {
          if (!node.nodeValue.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const r of range.getClientRects()) {
            if (r.width < 0.5 || r.height < 0.5) continue;
            top = Math.min(top, r.top);
            bottom = Math.max(bottom, r.bottom);
          }
        }
        return Number.isFinite(top) ? { top, bottom } : null;
      };

      /* ⚠ THE CONTENT BOX, NOT THE BORDER BOX. The free space a flex `auto`
         margin divides is the CONTAINER'S CONTENT box, and this stage carries
         an asymmetric padding (a top pad, no bottom pad) — measured against the
         border box a perfectly halved slack reports a ~16px bias that is really
         the padding, and the guard would be tuned around its own error. */
      const cs = getComputedStyle(stage);
      const sr = stage.getBoundingClientRect();
      const inner = {
        top: sr.top + parseFloat(cs.paddingTop),
        bottom: sr.bottom - parseFloat(cs.paddingBottom),
      };

      const shown = [...stage.children].filter((el) => {
        const r = el.getBoundingClientRect();
        return getComputedStyle(el).display !== "none" && r.height > 0.5;
      });
      const cellName = (el) => {
        const c = el.classList.contains("vwd__head")
          ? "head"
          : el.classList.contains("vwd__body")
            ? "body"
            : "figure";
        const d = el.getAttribute("data-cell");
        return d ? `${c}[${d}]` : c;
      };

      const first = shown[0] ?? null;
      const last = shown[shown.length - 1] ?? null;
      let ink = null;
      for (const el of shown) {
        const i = inkOf(el);
        if (!i) continue;
        ink = ink ? { top: Math.min(ink.top, i.top), bottom: Math.max(ink.bottom, i.bottom) } : i;
      }

      /* ⚠ THE BAND'S OWN RECT CANNOT BE THE CLEARANCE TEST, and that is
         arithmetic rather than a shortcut. The reel sits at the foot of a
         100svh instrument, so its border box ends ON the viewport's bottom
         edge whatever padding it carries — and the fixed cluster is inside
         that edge by construction. Padding moves the CHIPS up, not the box, so
         the chips' union is what has to clear. (Same class of thing as the
         `clientHeight - scrollHeight` note above: measure the drawing, not a
         model of it.) */
      const chipsBox = [...document.querySelectorAll("#voidwalker .vwd__chip")].reduce(
        (acc, el) => {
          const r = el.getBoundingClientRect();
          if (r.width < 0.5 || r.height < 0.5) return acc;
          return acc
            ? {
                top: Math.min(acc.top, r.top),
                bottom: Math.max(acc.bottom, r.bottom),
                left: Math.min(acc.left, r.left),
                right: Math.max(acc.right, r.right),
              }
            : { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        },
        null
      );

      /* ⚠ THE CLUSTER IS TALLER THAN ITS OWN BOX. `.rin-settings` is
         `height: var(--hud-corner-zone)` (28px on a phone) with `align-items:
         center` over 36–44px controls, so the controls OVERHANG it top and
         bottom. Measuring the host alone under-reports the painted chrome by
         ~8px a side, which is exactly the size of the miss this guard exists
         to catch. */
      const rin = document.querySelector(".rin-settings");
      let chrome = null;
      if (rin) {
        for (const el of [rin, ...rin.querySelectorAll("*")]) {
          const st = getComputedStyle(el);
          if (st.display === "none" || st.visibility === "hidden") continue;
          const r = el.getBoundingClientRect();
          if (r.width < 0.5 || r.height < 0.5) continue;
          chrome = chrome
            ? {
                top: Math.min(chrome.top, r.top),
                bottom: Math.max(chrome.bottom, r.bottom),
                left: Math.min(chrome.left, r.left),
                right: Math.max(chrome.right, r.right),
              }
            : { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        }
      }

      const tabH = [...document.querySelectorAll("#voidwalker .vwd__tab")].map(
        (e) => e.getBoundingClientRect().height
      );

      return {
        era: document.querySelector("#voidwalker .vwd")?.getAttribute("data-vwh-era"),
        tab: sheet.getAttribute("data-vwd-tab"),
        cells: shown.map(cellName),
        above: first ? first.getBoundingClientRect().top - inner.top : null,
        below: last ? inner.bottom - last.getBoundingClientRect().bottom : null,
        inkAbove: ink ? ink.top - inner.top : null,
        inkBelow: ink ? inner.bottom - ink.bottom : null,
        over: stage.scrollHeight - stage.clientHeight,
        band: (({ top, bottom, left, right }) => ({ top, bottom, left, right }))(
          band.getBoundingClientRect()
        ),
        chips: chipsBox,
        chrome,
        tabMin: tabH.length ? Math.min(...tabH) : null,
      };
    });

  const stops = [];
  await page.locator("#voidwalker [data-vwh-era-tab][data-on='true']").first().focus();
  await page.keyboard.press("Home");
  await page.waitForTimeout(700);

  /* ⚠ ERAS OUTSIDE, READINGS INSIDE — the loop order is a contract, not a
     preference. `selectEra` silently drops TRANSMISSION back to RECORD when
     the era it is moving to has no film, so walking eras inside a held
     transmission tab reads that tab exactly once and then measures RECORD
     four more times while reporting "transmission". Setting the era first and
     switching readings under it cannot degrade: a reading change never moves
     the reel, and the tab is `disabled` where there is no film. */
  for (let i = 0; i < eras.length; i += 1) {
    if (i > 0) {
      await page.locator("#voidwalker [data-vwh-era-tab][data-on='true']").first().focus();
      await page.keyboard.press("ArrowRight");
      // The reel's transform is a 420ms glide and the masthead re-scrambles;
      // measured, every rect is byte-identical frame to frame past ~700ms.
      await page.waitForTimeout(900);
    }
    for (let t = 0; t < tabNames.length; t += 1) {
      const btn = page.locator("#voidwalker .vwd__tab").nth(t);
      if (await btn.isDisabled()) {
        console.log(
          `  -  ${String(eras[i]).padEnd(11)} ${tabNames[t].padEnd(13)} disabled (no film)`
        );
        continue;
      }
      await btn.click();
      await page.waitForTimeout(400);
      const s = await readStop();
      if (s) stops.push(s);
    }
  }

  const reelPhone = await measureReel();
  await browser.close();

  let phoneBad = 0;
  if (reelPhone) {
    const slack = Math.round((reelPhone.cell - reelPhone.widest) * 10) / 10;
    const ok = slack >= 12 && reelPhone.hit === true;
    if (!ok) phoneBad += 1;
    console.log(
      `${ok ? "ok  " : "FAIL"} reel pitch ${reelPhone.cell}px vs widest name "${reelPhone.who}" ` +
        `${reelPhone.widest}px — ${slack}px slack (need >= 12), centred chip takes a pointer: ${reelPhone.hit}`
    );
  }

  let minClear = Infinity;
  let minTab = Infinity;
  for (const s of stops) {
    /* (a) SPLIT, NOT POOLED — and only where there IS slack to split. An
       overflowing stage has none: the auto margins resolve to 0 by the
       flexbox rules, which is the whole reason they are safe on a scroll
       container, so asserting a balance there would fail the correct state. */
    const bal =
      s.over > 1 || s.above === null || s.below === null ? null : Math.abs(s.above - s.below);
    const balOk = bal === null || bal <= 8;
    // (b) the reel's chips against the fixed bottom-right cluster
    let clear = null;
    if (s.chips && s.chrome) {
      const overlapH =
        Math.min(s.chips.right, s.chrome.right) - Math.max(s.chips.left, s.chrome.left);
      clear =
        overlapH > 1
          ? Math.round((s.chrome.top - s.chips.bottom) * 10) / 10
          : Number.POSITIVE_INFINITY;
      minClear = Math.min(minClear, clear);
    }
    const clearOk = clear === null || clear > 0;
    // (c) the tab row is the only navigation on this surface
    if (s.tabMin !== null) minTab = Math.min(minTab, s.tabMin);
    const tabOk = s.tabMin === null || s.tabMin >= 44;

    const ok = balOk && clearOk && tabOk;
    if (!ok) phoneBad += 1;
    console.log(
      `${ok ? "ok  " : "FAIL"} ${String(s.era).padEnd(11)} ${String(s.tab).padEnd(13)}` +
        ` cells ${s.cells.join(" ")}` +
        (s.above === null
          ? ""
          : `  box ${Math.round(s.above)}/${Math.round(s.below)}` +
            (bal === null ? " (overflowing)" : ` Δ${Math.round(bal)}`)) +
        (s.inkAbove === null ? "" : `  ink ${Math.round(s.inkAbove)}/${Math.round(s.inkBelow)}`) +
        (s.over > 1 ? `  stage over ${s.over}px` : "") +
        (clear === null || clear === Number.POSITIVE_INFINITY ? "" : `  chip↔chrome ${clear}px`)
    );
  }
  console.log(
    `\n${Number.isFinite(minClear) ? `reel clears the BR cluster by ${minClear}px (need > 0)` : "reel and BR cluster never share a column"}` +
      `; tab row min-height ${Math.round(minTab)}px (need >= 44)`
  );
  console.log(
    phoneBad
      ? `\n${phoneBad} finding(s) — a pooled slack, a chip under the settings cluster, or a short control`
      : "\nall eras clean on the phone rung"
  );
  process.exit(phoneBad ? 1 : 0);
}

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
        /* ⚠ THE HEAD IS A SIBLING, NOT A CHILD (ADR-082 U19, and the split
           OUTLIVES the U21 rail deletion). The datum composition keeps each
           head and body as separate grid items — that is what holds both
           columns' heads on one shared row and keeps the entry/exit
           transforms composed rather than nested. Looking for the head
           inside the body finds nothing and every panel reports "?". */
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

const reel = await measureReel();

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
