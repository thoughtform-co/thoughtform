/**
 * capture-era-media — the TRANSMISSION pile, measured and shot (ADR-082 U31).
 *
 * The era stage's lower-left seat holds a pile of glass folder cards
 * (`EraMediaStack`): one card per asset, the front one carrying the frame and
 * the title, the ones behind it standing empty with their tabs fanned along the
 * top edge. The record holds ONE film on two eras today, so the pile's real
 * subject exists only as the datum lab's fixture — which is what this drives:
 *
 *   http://localhost:<port>/test/voidwalker-datum-lab?media=<n>&era=<id>&theme=<t>
 *
 * ⚠ THE LAB IS A WINDOW ONTO PRODUCTION (ADR-070 U35): it mounts
 * `HoloDatumPanels` and imports `voidwalker-datum.css`, so what is gated here
 * is the landing's own composition with a fixture handed through one seam.
 *
 * WHAT IT GATES, per pile size × viewport × theme — each of these was a way
 * the card could be wrong with every property computing correctly:
 *
 *   · the pile sits INSIDE its seat (the frame is what gives, never the title)
 *   · every tab sits inside ITS OWN card's box — a tab past the card's right
 *     edge is clipped away by the silhouette it belongs to, silently
 *   · tabs climb monotonically: each is further right AND further up than the
 *     one before it (the by-depth order's whole argument)
 *   · the tab's lettering ends before its slant begins
 *   · the title is not clipped (scrollHeight vs clientHeight is useless on a
 *     box that wraps; the last line's Range rect is inside the card)
 *   · the frame kept its 72px floor
 *   · choosing a back tab brings THAT card to the front, and the head's tag
 *     follows the front card's duration
 *
 * ⚠ HEADED BY DEFAULT. Headless Chromium has no H.264, so the figure beside
 * the pile paints nothing and a still looks like a broken stage. The gates do
 * not need the figure; the stills do. `--headless` is for the gates alone.
 *
 *   node scripts/capture-era-media.mjs --vp 1920x1247 --theme dark --out <dir>
 *   node scripts/capture-era-media.mjs --vp 1280x720  --piles 1,4
 *   node scripts/capture-era-media.mjs --vp 1280x720  --record --era loop
 *
 * ⚠ `--record` GATES THE ERA'S OWN PILE (ADR-082 U33), not the fixture: the
 * URL carries no `media=`, so the lab mounts the registry's pile for `--era`
 * and the card count is read off the pile's published `data-vwd-media-count`.
 * Since U33 three eras carry a real pile, and a fixture that fits proves only
 * that the fixture's titles fit.
 */
import { mkdirSync } from "node:fs";

import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const [VW, VH] = argOf("--vp", "1920x1247").split("x").map(Number);
const PORT = argOf("--port", "3003");
const THEME = argOf("--theme", "dark");
const ERA = argOf("--era", "genai");
const RECORD = args.includes("--record");
/* `null` is the record's own pile, whose size is only known once it renders. */
const PILES = RECORD ? [null] : argOf("--piles", "1,2,3,4").split(",").map(Number);
const OUT = argOf("--out", "");
if (OUT) mkdirSync(OUT, { recursive: true });
/* The sheet's own phone rung. There the reading FITS rather than scrolls
   (`overflow: clip`, ADR-082 U23), so the pile has one more thing to clear:
   the stage's floor, above the era stops' strip. */
const PHONE = VW <= 700;

const browser = await chromium.launch({ headless: args.includes("--headless") });
const context = await browser.newContext({
  viewport: { width: VW, height: VH },
  deviceScaleFactor: 2,
  reducedMotion: "no-preference",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

const read = () =>
  page.evaluate(() => {
    const box = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height };
    };
    const seat = document.querySelector('.vwd__body[data-cell="ll"]');
    const stack = document.querySelector(".vwd__mstack");
    if (!seat || !stack) return null;
    const cs = getComputedStyle(seat);
    const seatBox = box(seat);
    // The seat's CONTENT box: the pile may use the padding for nothing.
    const content = {
      t: seatBox.t + parseFloat(cs.paddingTop),
      b: seatBox.b - parseFloat(cs.paddingBottom),
      l: seatBox.l,
      r: seatBox.r,
    };
    const cards = [...stack.querySelectorAll(".vwd__mcard")].map((card) => {
      const tab = card.querySelector(".vwd__mcard__tab");
      const title = card.querySelector(".vwd__mcard__title");
      // The lettering's own ink, not the button's box.
      let ink = null;
      if (tab) {
        const range = document.createRange();
        range.selectNodeContents(tab);
        const rects = [...range.getClientRects()].filter((r) => r.width > 0);
        if (rects.length) {
          ink = {
            l: Math.min(...rects.map((r) => r.left)),
            r: Math.max(...rects.map((r) => r.right)),
          };
        }
      }
      let titleInk = null;
      if (title) {
        const range = document.createRange();
        range.selectNodeContents(title);
        const rects = [...range.getClientRects()];
        titleInk = { b: Math.max(...rects.map((r) => r.bottom)), lines: rects.length };
      }
      const tabH = tab ? tab.getBoundingClientRect().height : 0;
      return {
        depth: Number(card.dataset.vwdMediaDepth),
        kind: card.dataset.vwdMediaKind,
        card: box(card),
        tab: box(tab),
        tabText: tab?.textContent ?? "",
        pressed: tab?.getAttribute("aria-pressed"),
        ink,
        slantStart: tab ? tab.getBoundingClientRect().right - tabH : null,
        frame: box(card.querySelector(".vwd__mcard__frame")),
        title: box(title),
        titleInk,
      };
    });
    const tag = document.querySelector('.vwd__head[data-cell="ll"] .vwd__head__tag');
    const stage = document.querySelector(".vwd__stage");
    const stageFloor = stage
      ? stage.getBoundingClientRect().bottom - parseFloat(getComputedStyle(stage).paddingBottom)
      : null;
    return {
      seat: seatBox,
      stageFloor,
      content,
      stack: box(stack),
      cards,
      tag: tag?.textContent ?? "",
      absent: document.querySelector('.vwd__body[data-cell="ll"] .vwd__absent')?.textContent ?? "",
    };
  });

let failed = 0;
const fail = (msg) => {
  failed += 1;
  console.log(`  x ${msg}`);
};
const px = (n) => n.toFixed(1);

/** Every fit gate, against ONE read of the pile. Run on the resting pile AND on
 *  each rotation: the fixture's second card carries a title that wraps, so the
 *  binding case is a rotated state, not the one the page opens on. */
function gate(s, n, label) {
  const at = `pile ${n}${label}`;
  const front = s.cards.find((c) => c.depth === 0);
  const byDepth = [...s.cards].sort((a, b) => a.depth - b.depth);
  console.log(
    `  ${at} · seat ${px(s.seat.w)}x${px(s.seat.h)} · pile ${px(s.stack.w)}x${px(s.stack.h)}` +
      ` · frame ${front?.frame ? `${px(front.frame.w)}x${px(front.frame.h)}` : "-"}` +
      ` · title ${front?.titleInk?.lines ?? 0} line(s) · tag "${s.tag}"`
  );

  if (s.cards.length !== n) fail(`${at}: ${s.cards.length} cards rendered`);
  if (PHONE && s.stageFloor !== null && s.stack.b > s.stageFloor + 0.5)
    fail(
      `${at}: the pile runs ${px(s.stack.b - s.stageFloor)}px under the stage's floor, into the era stops' strip`
    );
  if (s.stack.b > s.content.b + 0.5 || s.stack.t < s.content.t - 0.5)
    fail(
      `${at}: the pile leaves its seat (pile ${px(s.stack.t)}–${px(s.stack.b)}, seat ${px(s.content.t)}–${px(s.content.b)})`
    );
  for (const c of byDepth) {
    // A card is translated INTO the pile's padding; its box must stay inside the pile's.
    if (c.card.r > s.stack.r + 0.5 || c.card.t < s.stack.t - 0.5)
      fail(`${at} · depth ${c.depth}: the card leaves the pile's box`);
    if (c.tab.r > c.card.r + 0.5)
      fail(`${at} · depth ${c.depth}: the tab runs ${px(c.tab.r - c.card.r)}px past its own card`);
    if (c.ink && c.slantStart !== null && c.ink.r > c.slantStart + 0.5)
      fail(
        `${at} · depth ${c.depth}: "${c.tabText}" runs ${px(c.ink.r - c.slantStart)}px into its slant`
      );
  }
  for (let i = 1; i < byDepth.length; i++) {
    const a = byDepth[i - 1];
    const b = byDepth[i];
    if (!(b.tab.l >= a.tab.r - 0.5)) fail(`${at}: tab ${b.depth} overlaps tab ${a.depth}`);
    if (!(b.tab.t < a.tab.t)) fail(`${at}: tab ${b.depth} does not climb above tab ${a.depth}`);
  }
  if (!front) {
    fail(`${at}: no front card`);
    return;
  }
  if (front.pressed !== "true") fail(`${at}: the front tab is not pressed`);
  if (!front.frame) fail(`${at}: the front card has no frame`);
  else if (front.frame.h < 71.5)
    fail(`${at}: the frame is ${px(front.frame.h)}px, under its 72px floor`);
  if (front.titleInk && front.titleInk.b > front.card.b - 1)
    fail(
      `${at}: the title's last line runs ${px(front.titleInk.b - front.card.b)}px out of its card`
    );
  // ADR-082 U32: the title LEADS the frame — its ink ends above the picture.
  if (front.titleInk && front.frame && front.titleInk.b > front.frame.t + 0.5)
    fail(
      `${at}: the title does not sit above the frame (ink ends ${px(front.titleInk.b - front.frame.t)}px into it)`
    );
  if (byDepth.slice(1).some((c) => c.frame || c.title))
    fail(`${at}: a card behind the front one renders a body`);
}

console.log(`\nera media · ${VW}x${VH} · ${THEME} · era ${ERA}`);

for (const seed of PILES) {
  const pileQuery = seed === null ? "" : `media=${seed}&`;
  await page.goto(
    `http://localhost:${PORT}/test/voidwalker-datum-lab?${pileQuery}era=${ERA}&theme=${THEME}`,
    { waitUntil: "domcontentloaded" }
  );
  await page.waitForSelector(".vwd__sheet", { timeout: 90_000 });
  await page.evaluate(() => document.fonts.ready);
  let n = seed;
  if (n === null) {
    // The record's pile: a pile publishes its count; an empty era says so.
    await page.waitForSelector(
      '.vwd__mstack[data-vwd-media-count], .vwd__body[data-cell="ll"] .vwd__absent',
      { state: "attached", timeout: 30_000 }
    );
    n = await page.evaluate(() =>
      Number(document.querySelector(".vwd__mstack")?.getAttribute("data-vwd-media-count") ?? 0)
    );
    console.log(`  the record's pile for ${ERA}: ${n} card(s)`);
  }
  // ≤700px the four panels are ONE seat behind a view switch, and the pile's
  // cell is `display: none` until TRANSMISSION is the open reading. With an
  // empty pile that tab is disabled — which is its own gate.
  if (PHONE) {
    const tab = page.locator(".vwd__tab", { hasText: /^transmission/i });
    if (n === 0) {
      if (!(await tab.isDisabled())) fail("pile 0: the phone's TRANSMISSION tab is not disabled");
      console.log(
        `  pile 0 · phone tab disabled, note "${await tab.locator(".vwd__tab__note").textContent()}"`
      );
      continue;
    }
    await page.waitForSelector(`.vwd__mstack[data-vwd-media-count="${n}"]`, {
      state: "attached",
      timeout: 30_000,
    });
    await tab.click();
  }
  // The fixture is seeded from the URL one render after hydration; wait on the
  // pile's own published count rather than on a timer.
  if (n > 0) {
    await page.waitForSelector(`.vwd__mstack[data-vwd-media-count="${n}"]`, { timeout: 30_000 });
    await page
      .waitForFunction(
        () => {
          const img = document.querySelector(".vwd__mcard__still");
          return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
        },
        undefined,
        { timeout: 30_000 }
      )
      .catch(() => fail(`pile ${n}: the front card's still never decoded`));
  } else {
    await page.waitForSelector('.vwd__body[data-cell="ll"] .vwd__absent', { timeout: 30_000 });
  }
  await page.waitForTimeout(400);

  const s = await read();
  if (n === 0) {
    const absent = await page
      .locator('.vwd__body[data-cell="ll"] .vwd__absent')
      .first()
      .textContent();
    console.log(`  pile 0 · "${absent}"`);
    if (!/no transmission on record/i.test(absent ?? "")) fail("pile 0: the absence is not said");
    continue;
  }
  if (!s) {
    fail(`pile ${n}: no pile rendered`);
    continue;
  }

  gate(s, n, "");

  if (OUT) {
    // Park the pointer off the pile, or the still records a hover.
    await page.mouse.move(4, 4);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/${VW}x${VH}-${THEME}-pile${n}-stage.png` });
    const pad = 28;
    await page.screenshot({
      path: `${OUT}/${VW}x${VH}-${THEME}-pile${n}-seat.png`,
      clip: {
        x: Math.max(0, s.seat.l - pad),
        y: Math.max(0, s.seat.t - pad - 40),
        width: s.seat.w + pad * 2,
        height: s.seat.h + pad * 2 + 40,
      },
    });
  }

  // ── The rotation. Bring EVERY card to the front in turn — by its own tab,
  //    which is a different place each time — and re-run every fit gate on it:
  //    the head's tag must follow the front card's duration (a still has none),
  //    the pressed tab must keep focus, and a title that wraps must still fit.
  for (let target = 1; target < n; target++) {
    await page.locator(".vwd__mcard").nth(target).locator(".vwd__mcard__tab").click();
    // The rotation is a 240ms position transition; wait on the animations
    // rather than on a timer (a rect read mid-slide is a rect in flight).
    await page.evaluate(() =>
      Promise.all(
        [...document.querySelectorAll(".vwd__mcard, .vwd__mcard__tab")]
          .flatMap((el) => el.getAnimations())
          .map((a) => a.finished.catch(() => {}))
      )
    );
    await page.waitForTimeout(120);
    const after = await read();
    const nowFront = after.cards.findIndex((c) => c.depth === 0);
    if (nowFront !== target)
      fail(`pile ${n}: pressing card ${target}'s tab left card ${nowFront} in front`);
    const focusOk = await page.evaluate(
      () => document.activeElement?.classList.contains("vwd__mcard__tab") ?? false
    );
    if (!focusOk) fail(`pile ${n}: the pressed tab lost focus`);
    gate(after, n, ` · card ${target} forward`);
    if (OUT) {
      const pad = 28;
      // Park the pointer off the pile, or the still records a hover.
      await page.mouse.move(4, 4);
      await page.waitForTimeout(200);
      await page.screenshot({
        path: `${OUT}/${VW}x${VH}-${THEME}-pile${n}-card${target}.png`,
        clip: {
          x: Math.max(0, after.seat.l - pad),
          y: Math.max(0, after.seat.t - pad - 40),
          width: after.seat.w + pad * 2,
          height: after.seat.h + pad * 2 + 40,
        },
      });
    }
  }
}

if (errors.length) {
  for (const e of errors) fail(`page error: ${e}`);
}
await browser.close();
console.log(failed ? `\n${failed} gate(s) failed\n` : "\nall gates pass\n");
process.exit(failed ? 1 : 0);
