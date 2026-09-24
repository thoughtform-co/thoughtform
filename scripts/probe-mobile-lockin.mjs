/**
 * probe-mobile-lockin — the phone's snap seats, measured (ADR-113).
 *
 * The root scroller is `scroll-snap-type: y proximity` on the phone rung and
 * `#services`, `#about`, `#contact` and `.vwd` are its stops. This walks each
 * one at a few phone shapes and prints what the engine does with a stop that
 * ends short of a seat, past a seat, and inside the proximity radius — and
 * what it leaves alone (the hero's first flick, the corridor, the pile's
 * pins, the ring's beat tween). One still per landing.
 *
 * ⚠ CHROMIUM IS NOT iOS. Blink's proximity radius is a third of the snapport
 * and WebKit's is undocumented; `svh`, `dvh`, `lvh` and `innerHeight` are ONE
 * number here; the resize twin below moves `clientHeight` together with every
 * unit and so proves only that the writers re-solve on resize, never which
 * viewport they read. The device checklist in ADR-113 is the other half.
 *
 * ⚠ HEADED BY DEFAULT: the corridor is WebGL and the seats are solved from a
 * document its lazy content keeps growing; `--headless` runs SwiftShader.
 *
 *   node scripts/probe-mobile-lockin.mjs --theme dark
 *   node scripts/probe-mobile-lockin.mjs --shapes 390x664,430x932,390x745 --out .cursor/mobile-lockin
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const THEME = argOf("--theme", "dark");
const PORT = argOf("--port", "3003");
/* The two phone projects' shapes, then the height real iOS hands `100svh` on
   an iPhone 14 with the toolbar shown (the ring rung opens at 681). */
const SHAPES = argOf("--shapes", "390x844,430x932,390x745")
  .split(",")
  .map((s) => s.split("x").map(Number));
const OUT_BASE = argOf("--out", ".cursor/mobile-lockin");
const HEADLESS = args.includes("--headless");
/* ADR-115 took `#about` off the list (its two targets are the stops); ADR-123
   adds the band's release, makes the era STATION the stop and adds its
   release target. `.vwd` is pinned inside the runway and no longer a stop. */
const STOPS = [
  "#services",
  ".voidwalker__snap",
  ".voidwalker__snap-out",
  "#voidwalker",
  ".vw-phone-snap",
  "#musings",
  "#contact",
];
const SWEEP = [40, 80, 120, 160, 200, 240, 280, 320, 360, 400];

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.log(`  ✘ ${msg}`);
};

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
    isMobile: w <= 960,
    hasTouch: w <= 960,
  });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/${THEME === "light" ? "?theme=light" : ""}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("#voidwalker[data-vw-surface]", { timeout: 60_000 });
  await page.waitForTimeout(800);

  /* Resolve on `scrollend` or twelve still frames; the snap animation starts
     a few frames after the smooth scroll stops. Returns the wait and whether
     the engine fired `scrollend`. */
  const settleSnap = (cap = 1500) =>
    page.evaluate(
      (c) =>
        new Promise((resolve) => {
          const t0 = performance.now();
          let last = scrollY;
          let still = 0;
          let done = false;
          let ended = false;
          const finish = () => {
            if (done) return;
            done = true;
            removeEventListener("scrollend", onEnd);
            resolve({ ms: Math.round(performance.now() - t0), scrollend: ended });
          };
          const onEnd = () => {
            ended = true;
            requestAnimationFrame(() => requestAnimationFrame(finish));
          };
          addEventListener("scrollend", onEnd, { once: true });
          const tick = () => {
            if (done) return;
            still = Math.abs(scrollY - last) < 0.5 ? still + 1 : 0;
            last = scrollY;
            if (still >= 12 || performance.now() - t0 > c) finish();
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
    await page.waitForTimeout(250);
    return settleSnap();
  };
  const docTop = (sel) =>
    page.evaluate((s) => {
      const el = document.querySelector(s);
      return el ? Math.round(el.getBoundingClientRect().top + scrollY) : NaN;
    }, sel);
  const topOf = (sel) =>
    page.evaluate((s) => {
      const el = document.querySelector(s);
      return el ? +el.getBoundingClientRect().top.toFixed(1) : NaN;
    }, sel);
  const state = () =>
    page.evaluate(() => ({
      y: Math.round(scrollY),
      exit: document.documentElement.getAttribute("data-corridor-exit"),
      scrollX,
      scrollWidth: document.documentElement.scrollWidth,
    }));

  /* ── header ─────────────────────────────────────────────────────── */
  const head = await page.evaluate((stops) => {
    const probe = (unit) => {
      const d = document.createElement("div");
      d.style.cssText = `position:fixed;top:0;left:0;width:0;height:100${unit};visibility:hidden;pointer-events:none`;
      document.body.appendChild(d);
      const v = d.getBoundingClientRect().height;
      d.remove();
      return Math.round(v);
    };
    return {
      clientWidth: document.documentElement.clientWidth,
      clientHeight: document.documentElement.clientHeight,
      innerHeight,
      svh: probe("svh"),
      dvh: probe("dvh"),
      lvh: probe("lvh"),
      snapType: getComputedStyle(document.documentElement).scrollSnapType,
      stops: stops.map((s) => {
        const el = document.querySelector(s);
        if (!el) return `${s}: (absent)`;
        const r = el.getBoundingClientRect();
        return `${s}: align ${getComputedStyle(el).scrollSnapAlign}, h ${Math.round(r.height)}${r.height > innerHeight + 1 ? " (covers)" : ""}`;
      }),
    };
  }, STOPS);
  console.log(`\n══ ${THEME} ${w}×${h} ══════════════════════════════════════════`);
  console.log(
    `  client ${head.clientWidth}×${head.clientHeight}  inner ${head.innerHeight}  svh/dvh/lvh ${head.svh}/${head.dvh}/${head.lvh}  snap ${head.snapType}`
  );
  for (const s of head.stops) console.log(`  ${s}`);

  if (w > 960) {
    if (head.snapType !== "none")
      fail(`desktop ${w}×${h}: root snap-type is ${head.snapType}, expected none`);
    else console.log("  desktop: no snap, no stops — skipped");
    await ctx.close();
    continue;
  }
  // `y proximity` computes to `y` — proximity is the default strictness.
  if (!/^y( proximity)?$/.test(head.snapType)) fail(`root snap-type is ${head.snapType}`);

  // Warm the lazy corridor so the seats are real before anything is measured.
  await roll(await docTop("#services"));
  await roll(await docTop(".svc-ring-runway"));
  await page.waitForTimeout(600);

  /* ── the proximity radius, per stop ─────────────────────────────── */
  console.log("\n  radius sweep (largest short-stop that lands on the seat)");
  const radii = {};
  for (const sel of ["#services", ".voidwalker__snap", "#voidwalker"]) {
    let byScroll = 0;
    let byWheel = 0;
    for (const n of SWEEP) {
      const seat = await docTop(sel);
      await roll(seat - n);
      if (Math.abs(await topOf(sel)) <= 1.5) byScroll = n;
      else break;
    }
    for (const n of SWEEP) {
      const seat = await docTop(sel);
      await roll(seat - n - 600);
      for (let i = 0; i < 5; i += 1) {
        await page.mouse.wheel(0, 120);
        await page.waitForTimeout(40);
      }
      await settleSnap();
      if (Math.abs(await topOf(sel)) <= 1.5) byWheel = n;
      else break;
    }
    radii[sel] = { byScroll, byWheel };
    console.log(`  ${sel.padEnd(10)} scrollTo ≥ ${byScroll}px   wheel ≥ ${byWheel}px`);
  }

  /* ── every stop, short and past ─────────────────────────────────── */
  console.log("\n  landings");
  for (const sel of STOPS) {
    const tag = sel.replace(/[#.]/g, "");
    const seat = await docTop(sel);
    const maxScroll = await page.evaluate(
      () => document.documentElement.scrollHeight - innerHeight
    );
    const a = await roll(seat - 40);
    const shortTop = await topOf(sel);
    const st = await state();
    console.log(
      `  ${sel.padEnd(10)} seat−40 → top ${shortTop}   ${a.ms}ms${a.scrollend ? " scrollend" : ""}   exit ${st.exit}   scrollX ${st.scrollX} width ${st.scrollWidth}/${w}`
    );
    if (Math.abs(shortTop) > 1.5) fail(`${sel}: a stop 40px short landed at top ${shortTop}`);
    if (st.scrollX !== 0) fail(`${sel}: the page pans sideways (scrollX ${st.scrollX})`);
    await page.screenshot({ path: `${out}/${tag}-minus40.png` });

    if (seat + 60 > maxScroll) {
      console.log(`  ${" ".repeat(10)} seat+60 → past the document's end, not asked`);
      continue;
    }
    const b = await roll(seat + 60);
    const pastTop = await topOf(sel);
    const covers = await page.evaluate(
      (s) => document.querySelector(s).getBoundingClientRect().height > innerHeight + 1,
      sel
    );
    console.log(
      `  ${" ".repeat(10)} seat+60 → top ${pastTop}   ${b.ms}ms${b.scrollend ? " scrollend" : ""}   ${covers ? "covers the snapport (stays by rule)" : "one screen (snaps back)"}`
    );
    if (!covers && Math.abs(pastTop) > 1.5)
      fail(`${sel}: the one-screen stop did not snap back (top ${pastTop})`);
    await page.screenshot({ path: `${out}/${tag}-plus60.png` });
  }

  /* ── the seated instrument ──────────────────────────────────────── */
  await roll(await docTop(".vwd"));
  const seated = await page.evaluate(() => {
    const vwd = document.querySelector(".vwd");
    const band = vwd?.querySelector(".vwd__band");
    const settings = document.querySelector(".rin-settings");
    const title = vwd?.querySelector(".vwd__mast__title");
    const tl = document.querySelector(".hud__corner--tl");
    const rect = (el) => (el ? el.getBoundingClientRect() : null);
    const ink = (el) => {
      if (!el) return null;
      const r = document.createRange();
      r.selectNodeContents(el);
      const rs = [...r.getClientRects()];
      return rs.length ? Math.min(...rs.map((x) => x.top)) : null;
    };
    // ⚠ The band's box reaches the floor by design (`bottom: 0`, its padding
    // IS the chrome reserve); what may not run under the settings row is the
    // STOPS' ink — the chips' union, as probe-voidwalker-phone measures it.
    const chips = [...(vwd?.querySelectorAll(".vwd__chip") ?? [])]
      .map((c) => c.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0);
    return {
      top: rect(vwd)?.top ?? NaN,
      bandBottom: rect(band)?.bottom ?? NaN,
      chipsBottom: chips.length ? Math.max(...chips.map((r) => r.bottom)) : NaN,
      settingsTop: rect(settings)?.top ?? NaN,
      titleInkTop: ink(title),
      tlBottom: rect(tl)?.bottom ?? NaN,
      vh: innerHeight,
    };
  });
  console.log(
    `\n  .vwd seated: top ${seated.top.toFixed(1)}  stops bottom ${seated.chipsBottom.toFixed(1)} / settings top ${seated.settingsTop.toFixed(1)} (band ${seated.bandBottom.toFixed(1)}, vh ${seated.vh})  title ink ${seated.titleInkTop?.toFixed(1)} / TL bracket bottom ${seated.tlBottom.toFixed(1)}`
  );
  if (seated.chipsBottom > seated.vh + 1) fail(".vwd seated: the era stops are below the fold");
  if (seated.chipsBottom > seated.settingsTop + 0.5)
    fail(".vwd seated: the era stops run under the settings row");
  if (seated.titleInkTop !== null && seated.titleInkTop < seated.tlBottom)
    fail(".vwd seated: the title's ink starts above the TL bracket's foot");
  await page.screenshot({ path: `${out}/vwd-seated.png` });

  /* ── the hero's first flick ─────────────────────────────────────── */
  console.log("\n  hero (no stop by decision)");
  for (const y of [150, 300]) {
    await roll(0);
    await roll(y);
    console.log(`  scrollTo ${y} → landed ${Math.round(await page.evaluate(() => scrollY))}`);
  }

  /* ── the pile's pins ────────────────────────────────────────────── */
  console.log("\n  proof pile (sticky slots are not snap areas)");
  const slots = await page.$$eval("[data-pc-slot]", (els) => els.length);
  for (const i of [0, 1, 2].filter((n) => n < slots)) {
    for (let pass = 0; pass < 4; pass += 1) {
      const target = await page.evaluate((idx) => {
        const slot = document.querySelectorAll("[data-pc-slot]")[idx];
        const pin = Number.parseFloat(getComputedStyle(slot).top) || 0;
        // ⚠ never offsetTop: a stuck sticky slot reports its stuck position.
        return Math.round(slot.getBoundingClientRect().top + scrollY - pin + 8);
      }, i);
      await roll(target);
    }
    const r = await page.evaluate((idx) => {
      const slot = document.querySelectorAll("[data-pc-slot]")[idx];
      return {
        state: slot.getAttribute("data-pc-state"),
        enter: slot.style.getPropertyValue("--pc-enter"),
        depth: slot.style.getPropertyValue("--pc-depth"),
        top: +slot.getBoundingClientRect().top.toFixed(1),
      };
    }, i);
    console.log(`  slot ${i}: ${r.state}  enter ${r.enter}  depth ${r.depth}  top ${r.top}`);
  }
  await page.screenshot({ path: `${out}/pile-1.png` });

  /* ── the ring band's clock, and the side tap ────────────────────── */
  console.log("\n  ring band (sticky band is not a snap area)");
  const seatBand = async (p) => {
    for (let pass = 0; pass < 5; pass += 1) {
      const target = await page.evaluate((frac) => {
        const el = document.querySelector(".svc-ring-runway");
        if (!el) return NaN;
        const r = el.getBoundingClientRect();
        const vh = document.documentElement.clientHeight;
        return Math.round(r.top + scrollY + frac * (r.height - vh));
      }, p);
      if (Number.isNaN(target)) return;
      await roll(target);
      const landed = await page.evaluate(() => {
        const r = document.querySelector(".svc-ring-runway").getBoundingClientRect();
        return -r.top / Math.max(1, r.height - document.documentElement.clientHeight);
      });
      if (Math.abs(landed - p) < 0.02) return;
    }
  };
  const band = () =>
    page.evaluate(() => {
      const runway = document.querySelector(".svc-ring-runway");
      const b = document.querySelector(".svc-ring-band");
      return {
        step: document.querySelector(".services-stage")?.getAttribute("data-active-step"),
        bandTop: b ? +b.getBoundingClientRect().top.toFixed(1) : NaN,
        runwayBottom: runway ? Math.round(runway.getBoundingClientRect().bottom + scrollY) : NaN,
      };
    });
  if (await page.$(".svc-ring-runway")) {
    for (const p of [0.4, 0.55, 0.8]) {
      await seatBand(p);
      const r = await band();
      console.log(`  band ${p.toFixed(2)}: step ${r.step}  bandTop ${r.bandTop}`);
    }
    await page.screenshot({ path: `${out}/band-0.80.png` });
    const aboutSeat = await docTop("#about");
    const r80 = await band();
    console.log(
      `  last beat rests ${aboutSeat - (r80.runwayBottom - h)}px above #about's stop (radius ${radii["#about"]?.byScroll ?? "?"}px)`
    );
    // The side tap: a tween of instant scrollTo writes; it must land on its beat.
    await seatBand(0.4);
    // ⚠ The hit layer re-renders as the ring's anchors publish, so a handle
    // taken a frame earlier is "not attached to the DOM" by the time it is
    // tapped. Query and click in one evaluate.
    const side = await page.evaluate(() => {
      const el = document.querySelector(".svc-ring-hits__hit:not(.svc-ring-hits__hit--front)");
      if (!el) return false;
      el.click();
      return true;
    });
    if (side) {
      const before = (await band()).step;
      await page.waitForTimeout(2400);
      await settleSnap();
      const after = await band();
      console.log(`  side tap: step ${before} → ${after.step}  bandTop ${after.bandTop}`);
      if (Math.abs(after.bandTop) > 1)
        fail(`side tap: the band is not pinned after the tween (top ${after.bandTop})`);
    }
    // The resize twin. ⚠ Chromium moves clientHeight with every unit here, so
    // this proves the writers RE-SOLVE, never which viewport they read.
    await seatBand(0.55);
    const pre = await band();
    await page.setViewportSize({ width: w, height: h + 99 });
    await page.waitForTimeout(500);
    await settleSnap();
    const post = await band();
    console.log(
      `  resize +99 (Chromium: clientHeight moved too): step ${pre.step} → ${post.step}  bandTop ${pre.bandTop} → ${post.bandTop}`
    );
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(400);
  } else {
    console.log("  (no ring band on this rung)");
  }

  await ctx.close();
}
await browser.close();

console.log(failures ? `\n${failures} failure(s)` : "\nthe phone locks in at every shape");
process.exit(failures ? 1 : 0);
