/**
 * probe-voidwalker-phone — the phone twin of `probe-voidwalker-eras`.
 *
 * ADR-082 U23 made `#voidwalker`'s phone interior FIT rather than scroll: the
 * stage is `overflow: clip`, so a reading that no longer fits is CUT rather
 * than reachable. That is the right failure mode — loud here, where a
 * scrollbar was quiet — but only if something looks. This is that something.
 *
 * ⚠ THE BINDING SHAPE IS INVISIBLE TO CI. `100svh` on real iOS Safari is the
 * SMALL viewport (~745 of 844 on a 14, ~553 of 667 on an SE), while Chromium —
 * every phone project this repo has, since ADR-107 U1 deleted the WebKit ones —
 * resolves it to the full height. So the walk includes two SYNTHETIC short
 * shapes that stand in for what the real browser does, and they are the ones
 * that decide.
 *
 * ⚠ IT ASKS WHETHER THE PAGE SCROLLS, NOT WHETHER A BOX IS WIDE. The first
 * cut compared `scrollWidth` against `clientWidth` and reported a 31px
 * horizontal overflow at every shape, era and tab — which is real arithmetic
 * about `.gateway` and `.hud`, two FIXED site-chrome layers that measure
 * 100vw + the classic scrollbar gutter, and is not a scrollbar: `body` carries
 * `overflow-x: hidden`, and `scrollTo(200, y)` leaves `scrollX` at 0. A number
 * that is true and answers a question nobody asked fails 100 cells and hides
 * the one that matters.
 * ⚠ AND IT MEASURES INK, NOT BOXES. `scrollHeight − clientHeight` on the
 * figure tab counts `.vwh__base__glow` — 192px of decorative projector bloom,
 * absolutely positioned, hanging ~71px past the stage's floor under the
 * figure's own feet. Clipping it is the fix, not the defect; what may never be
 * cut is a line of the record.
 *
 * ⚠ AND THE CHROME IS FIXED AND CANNOT SEE THE DOCUMENT. `.rin-settings` (the
 * theme switch + session mark) is `position: fixed` on the bottom margin line
 * and is never gated off; `.hud__nav__btn` holds the top-right. Inside a 100svh
 * instrument the stops' own bottom edge IS the viewport floor, so their
 * clearance is a real measurement, not a layout assumption.
 */
import { chromium } from "@playwright/test";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3003";
const TABS = ["figure", "record", "scope", "transmission"];
/* Two real phones, then the two shapes real iOS actually hands `100svh`, then
   the smallest phone still in use. */
const SHAPES = [
  [390, 844],
  [430, 932],
  [375, 667],
  [390, 745],
  [375, 553],
];

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
};

const findings = [];

/** Put `.vwd`'s top back on the viewport's, after anything that may have
 *  reflowed the document above it. */
async function reseat(page) {
  for (let i = 0; i < 40; i++) {
    const done = await page.evaluate(() => {
      const el = document.querySelector(".vwd");
      if (!el) return true;
      const r = el.getBoundingClientRect();
      if (Math.abs(r.top) <= 2) return true;
      window.scrollBy(0, r.top);
      return false;
    });
    if (done) return;
    await page.waitForTimeout(80);
  }
}

const browser = await chromium.launch({ headless: false });
for (const [w, h] of SHAPES) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    reducedMotion: "no-preference",
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?theme=${arg("--theme", "dark")}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#voidwalker", { timeout: 60000 });

  /* ⚠ SEAT `.vwd`, NOT `#voidwalker`, AND THAT IS NOT A DETAIL. The station
     keeps its own `padding-block: clamp(72px, 11svh, 132px)` on this rung, so
     aligning the STATION's top to the viewport puts the 100svh instrument 76px
     down and its last 76px — which is exactly where the era stops now live —
     below the fold. Every rect here that is compared against FIXED chrome
     (`.rin-settings`, `.hud__nav__btn`) is scroll-dependent, so measuring at a
     position the reader never rests at reports a collision that is not there,
     and would hide one that is.
     ⚠ AND NEVER A HARDCODED PIXEL COUNT, never one pass: the proof stack above
     keeps inflating as its imagery loads, which walks the instrument down after
     the first seek (landing-corridor-smoke's own law). */
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < 90; i++) {
      const done = await page.evaluate(() => {
        const el = document.querySelector(".vwd");
        if (!el) return false;
        const r = el.getBoundingClientRect();
        if (Math.abs(r.top) <= 2) return true;
        window.scrollBy(0, r.top);
        return false;
      });
      if (done) break;
      await page.waitForTimeout(90);
    }
    await page.waitForTimeout(260);
  }

  const eras = await page.$$eval("[data-vwh-era-tab]", (els) =>
    els.map((e) => e.getAttribute("data-vwh-era-tab"))
  );

  for (const era of eras) {
    await page.click(`[data-vwh-era-tab="${era}"]`);
    await page.waitForTimeout(120);
    await reseat(page);
    for (const tab of TABS) {
      await page.evaluate((t) => {
        const btns = [...document.querySelectorAll(".vwd__tab")];
        const hit =
          t === "figure"
            ? btns.find((b) => b.classList.contains("vwd__tab--figure"))
            : btns.find((b) => b.textContent?.trim().toLowerCase().startsWith(t));
        if (hit && !hit.disabled) hit.click();
      }, tab);
      await page.waitForTimeout(90);
      await reseat(page);

      const m = await page.evaluate(() => {
        const sheet = document.querySelector(".vwd__sheet");
        const stage = document.querySelector(".vwd__stage");
        const title = document.querySelector(".vwd__mast__title");
        const nav = document.querySelector(".hud__nav__btn");
        const settings = document.querySelector(".rin-settings");
        const chips = [...document.querySelectorAll(".vwd__chip")];
        if (!sheet || !stage) return null;
        const cs = getComputedStyle(stage);
        const rect = (el) => (el ? el.getBoundingClientRect() : null);
        /* ⚠ A BOUNDING RECT IS NOT AN INK RECT (mobile-section-seams' own
           finding): a container is tall around a short line of type. The title
           is measured by its glyph runs. */
        const inkBottom = (el) => {
          if (!el) return null;
          const r = document.createRange();
          r.selectNodeContents(el);
          const boxes = [...r.getClientRects()].filter((b) => b.width > 0 && b.height > 0);
          if (!boxes.length) return null;
          return {
            top: Math.min(...boxes.map((b) => b.top)),
            bottom: Math.max(...boxes.map((b) => b.bottom)),
            left: Math.min(...boxes.map((b) => b.left)),
            right: Math.max(...boxes.map((b) => b.right)),
          };
        };
        const chipBoxes = chips.map((c) => c.getBoundingClientRect());
        const chipUnion = chipBoxes.length
          ? {
              top: Math.min(...chipBoxes.map((b) => b.top)),
              bottom: Math.max(...chipBoxes.map((b) => b.bottom)),
              left: Math.min(...chipBoxes.map((b) => b.left)),
              right: Math.max(...chipBoxes.map((b) => b.right)),
            }
          : null;
        return {
          tab: document.querySelector(".vwd__sheet")?.getAttribute("data-vwd-tab"),
          overflow: cs.overflow,
          /* The real question: can anything here be scrolled? A clipped box
             refuses, so these stay 0 unless a rung regresses to `auto`. */
          stageScrolls: (() => {
            stage.scrollTop = 999;
            stage.scrollLeft = 999;
            const moved = stage.scrollTop > 0 || stage.scrollLeft > 0;
            stage.scrollTop = 0;
            stage.scrollLeft = 0;
            return moved;
          })(),
          pageScrollsX: (() => {
            const y = window.scrollY;
            window.scrollTo(400, y);
            const moved = window.scrollX > 0;
            window.scrollTo(0, y);
            return moved;
          })(),
          rootScrolls: (() => {
            const root = document.querySelector(".vwd");
            if (!root) return false;
            root.scrollTop = 999;
            const moved = root.scrollTop > 0;
            root.scrollTop = 0;
            return moved;
          })(),
          /* Every text run in the stage, against the stage's own box. This is
             what `overflow: clip` can silently eat. */
          cutInk: (() => {
            const box = stage.getBoundingClientRect();
            const walker = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT);
            let worst = 0;
            let node;
            while ((node = walker.nextNode())) {
              if (!node.nodeValue || !node.nodeValue.trim()) continue;
              const r = document.createRange();
              r.selectNodeContents(node);
              for (const b of r.getClientRects()) {
                if (b.width === 0 || b.height === 0) continue;
                worst = Math.max(worst, b.bottom - box.bottom, box.top - b.top);
              }
            }
            return +worst.toFixed(1);
          })(),
          titleInk: inkBottom(title),
          navRect: rect(nav),
          settingsRect: rect(settings),
          chipUnion,
          /* ⚠ THE GUTTER, WHICH THIS PROBE COLLECTED AND THREW AWAY
             (ADR-082 U27). `chipUnion.left/right` were computed above and
             compared to nothing, and the tab row was only ever a DRIVER here,
             never a measurement — so a station running its two hairlines to
             the viewport's own edges passed 100 cells green. Every horizontal
             question this file asks is new. */
          gutter: Number.parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--hud-margin")
          ),
          tabsRect: (() => {
            const t = document.querySelector(".vwd__tabs");
            if (!t) return null;
            const r = t.getBoundingClientRect();
            return r.width ? { left: r.left, right: r.right } : null;
          })(),
          bandRect: (() => {
            const t = document.querySelector(".vwd__band");
            if (!t) return null;
            const r = t.getBoundingClientRect();
            return r.width ? { left: r.left, right: r.right } : null;
          })(),
          chipMin: chips.length
            ? Math.min(...chipBoxes.map((b) => Math.min(b.width, b.height)))
            : null,
          /* ⚠ THE BAND IS OUTSIDE THE STAGE, so the ink walk above cannot see
             it. Its stops are the only navigation on this surface and they sit
             on the viewport's own floor — measure them against it. */
          stopsBelowFold: (() => {
            if (!chipBoxes.length) return 0;
            const fold = document.querySelector(".vwd").getBoundingClientRect().bottom;
            return +Math.max(0, Math.max(...chipBoxes.map((b) => b.bottom)) - fold).toFixed(1);
          })(),
          /* The last glyph in the stage against the stage's own floor — the
             `foot` metric, because `scrollHeight - clientHeight` is exactly 0
             on a clipped box whether the content fits or is cut. */
          foot: (() => {
            const ink = inkBottom(stage);
            if (!ink) return null;
            return +(stage.getBoundingClientRect().bottom - ink.bottom).toFixed(1);
          })(),
          stageInkTop: (() => {
            const ink = inkBottom(stage);
            return ink ? +(ink.top - stage.getBoundingClientRect().top).toFixed(1) : null;
          })(),
        };
      });

      if (!m) {
        findings.push(`${w}x${h} ${era}/${tab}: no sheet`);
        continue;
      }

      const label = `${w}x${h} ${era.padEnd(11)} ${(m.tab ?? tab).padEnd(13)}`;
      const bad = [];
      if (m.overflow !== "clip") bad.push(`stage overflow ${m.overflow}`);
      if (m.stageScrolls) bad.push("stage scrolls");
      if (m.rootScrolls) bad.push("root scrolls");
      if (m.pageScrollsX) bad.push("page scrolls horizontally");
      /* ⚠ BOTH EDGES. The slack split uses auto margins, and a box centred by
         them spills equally through the top and the bottom — `scrollHeight`
         reports exactly zero for that, which is the trap this file's
         neighbours have all paid for. */
      if (m.cutInk > 0.5) bad.push(`ink cut by ${m.cutInk}px`);
      if (m.chipUnion && m.settingsRect && m.chipUnion.bottom > m.settingsRect.top + 0.5) {
        bad.push(
          `stops under .rin-settings by ${(m.chipUnion.bottom - m.settingsRect.top).toFixed(1)}px`
        );
      }
      if (m.titleInk && m.navRect) {
        const overlapsX = m.titleInk.right > m.navRect.left && m.titleInk.left < m.navRect.right;
        const overlapsY = m.titleInk.top < m.navRect.bottom && m.titleInk.bottom > m.navRect.top;
        if (overlapsX && overlapsY) bad.push("title under .hud__nav__btn");
      }
      /* ⚠ NOTHING TOUCHES THE BORDERS (ADR-082 U27, owner: the elements
         "should just be contained within the top-left and bottom-right
         corners"). The corner brackets sit on `--hud-margin`, so that token IS
         the line, and the tabs and the band must land on it together — "the
         band the same width as the tabs above" is his second ask and this is
         the assertion that keeps it true. */
      const g = m.gutter;
      if (Number.isFinite(g)) {
        for (const [name, r] of [
          ["the tab row", m.tabsRect],
          ["the era band", m.bandRect],
        ]) {
          if (!r) continue;
          if (r.left < g - 0.5)
            bad.push(`${name} starts ${(g - r.left).toFixed(1)}px outside the gutter`);
          if (r.right > w - g + 0.5)
            bad.push(`${name} ends ${(r.right - (w - g)).toFixed(1)}px outside the gutter`);
        }
        if (m.tabsRect && m.bandRect) {
          const dl = Math.abs(m.tabsRect.left - m.bandRect.left);
          const dr = Math.abs(m.tabsRect.right - m.bandRect.right);
          if (Math.max(dl, dr) > 0.5)
            bad.push(`the band is not the tabs' width (${dl.toFixed(1)}/${dr.toFixed(1)}px apart)`);
        }
      }
      if (m.chipMin !== null && m.chipMin < 43.5)
        bad.push(`stop target ${m.chipMin.toFixed(1)}px < 44`);
      if (m.stopsBelowFold > 0.5)
        bad.push(`stops ${m.stopsBelowFold}px below the instrument's floor`);

      if (bad.length) {
        findings.push(`${label} ${bad.join(" · ")}`);
        console.log(`FAIL ${label} ${bad.join(" · ")}`);
      } else {
        console.log(`ok   ${label} foot ${m.foot}px`);
      }
    }
  }
  await ctx.close();
}
await browser.close();

console.log("");
if (findings.length) {
  console.log(`${findings.length} finding(s):`);
  for (const f of findings) console.log(`  ${f}`);
  process.exitCode = 1;
} else {
  console.log("the phone instrument fits at every shape, era and tab");
}
