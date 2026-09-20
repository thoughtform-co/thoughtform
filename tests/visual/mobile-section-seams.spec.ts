import { expect, test, type Page, type TestInfo } from "@playwright/test";

/**
 * Mobile section seams — the guard for `.claude/rules/mobile-sections.md`.
 *
 * The phone composition has no rail and no brandmark, but it still carries
 * FIXED chrome over a flowing document: the TR readout (`.hud-nav-overlay`
 * → `.hud__nav__btn`, z 60), the BR settings cluster (`.rin-settings`,
 * z 60), the two corner brackets, and — through the corridor's epilogue —
 * `.home-v2-mobile-signal`. Every one of them paints over whatever is
 * scrolling underneath, and none of them can see the document.
 *
 * The laws this file holds, in the order they fail:
 *   1. stations do not overlap each other,
 *   2. no station copy is handed to the chrome (and nothing overflows the
 *      viewport sideways),
 *   3. the epilogue signal is dead by the time #services owns the screen,
 *   4. the chrome stays inside the two bands the stations reserve,
 *   5. the padding floor and the content-visibility opt-out are live,
 *   6. the stations are snap stops and nothing inside them is (ADR-113),
 *   7. a stop short of a station glides onto its seat, and the one-screen
 *      instrument seats itself from either side (ADR-113).
 *
 * ⚠ NEVER NAVIGATE BY A HARDCODED PIXEL COUNT (landing-corridor-smoke's
 * law). The corridor stage is sized in viewport units and its lazy content
 * changes the document height as it mounts — a `scrollTo` can land short
 * and stay there. Every position in this file is SOUGHT: a real
 * viewport-stepped scroll, then a Playwright-side loop with a timeout that
 * re-reads where the page actually is. No bare waits, no teleports; the
 * corridor is WebGL and only a real scroll drives its frameloop.
 *
 * ⚠ A PROGRAMMATIC SCROLL IS A SNAP CANDIDATE (ADR-113). The root scroller is
 * `scroll-snap-type: y proximity` on the phone rung, and Chromium re-snaps
 * after a `scrollTo` exactly as after a flick — so a target inside the
 * proximity radius of a station's seat LANDS ON THE SEAT, and a seek that
 * insists on its own number never settles. `seekTo` therefore accepts a
 * landing on a seat as settled and reports it; `rollTo` waits for the snap
 * animation, not a fixed 650ms; and every rest below is either a seat or a
 * mid-station read well outside the radius (Blink's is a third of the
 * snapport: ~221px at 390×664, ~310px at 430×932).
 */

test.describe.configure({ mode: "serial" });

/* The two WebKit phone projects, and (ADR-107) their Chromium-backed copies,
   which are the ones that can reach the local dev server. */
const PHONE_PROJECTS = new Set([
  "iphone-14",
  "iphone-14-pro-max",
  "iphone-14-chromium",
  "iphone-14-pro-max-chromium",
]);

/** The stations' DOM order on the marketing route, top to bottom. */
const STATION_IDS = ["hero", "services", "about", "voidwalker", "contact"] as const;

/**
 * The always-mounted fixed chrome, by the element that actually PAINTS.
 * ⚠ `.hud-nav-overlay` itself is a 0x0 anchor at the corner (measured
 * [368, 16, 0, 0] at 390x844) — it positions the nav and hosts the scrim
 * pseudo-element, but it has no box of its own to measure. The readout
 * button is the painted object, and it is also the drawer trigger.
 * `.home-v2-mobile-signal` is deliberately NOT here: while the epilogue is
 * playing it is CONTENT that owns the middle of the screen, which is what
 * test 3 is about instead.
 */
const CHROME_SELECTORS = [
  ".hud__nav__btn",
  ".rin-settings",
  ".hud__corner--tl",
  ".hud__corner--br",
] as const;

/**
 * ⚠ THE OPEN CHROME-OVER-COPY DEBT, PINNED RATHER THAN TOLERATED.
 *
 * The ≤960 padding floors reserve the two bands at a station's ENDS; they
 * cannot reach a multi-viewport station's middle, and the TR scrim buys
 * LEGIBILITY for what passes behind the corner without licensing a
 * collision. This map lists the ink runs that still land inside a chrome rect
 * at the stations' rest positions. An entry comes OUT in the same commit as
 * the measurement that finds it gone; a collision on ANY station fails the
 * test outright, which is what stops one appearing quietly.
 *
 * ⚠ EMPTY SINCE ADR-113 (2026-09-20), BY MEASUREMENT. The rests moved with
 * the snap seats — `stationRests()`: the seat, then NEAR (`top + 340`, the
 * first position a reader can hold past the seat) and MID (half the height)
 * on the tall stations — and the register read `(none)` on every station at
 * all three, on both phone projects (390×844, 430×932). The six entries the
 * old single rest (`top + min(0.35h, 300)`) carried, kept here as the record
 * of what to look for if one returns:
 *
 *   #services · `.hud__nav__btn` / `.rin-settings` — the casefile's `27 → 47`
 *               counter and `Intelligence Map` title under the readout, a
 *               `DEEP` lane label and the directory sentence at the foot
 *               (measured 2026-09-01, before ADR-096/107 replaced the casefile
 *               with the pile; the pile's sheets are clear at seat, near, mid)
 *   #about    · `.hud__nav__btn` / `.hud__corner--tl` / `.rin-settings` — a
 *               15px bio line at the top of the beat under the readout (and
 *               its left end under the bracket at 390), the `MODE` / `∂`
 *               telemetry on the settings row's line at the foot. At the seat
 *               the beat's top sits inside its own 56px band; at `top + 340`
 *               that line has scrolled clear.
 *   #contact  · `.hud__nav__btn` — `Plot your` under the readout at the
 *               document's end (ADR-105 deleted that line with the footer)
 *   #voidwalker · `.rin-settings` / `.hud__corner--br` — never voidwalker's
 *               own copy: `#contact`'s title and nav row passing under the
 *               cluster and the bracket because the old rest (`top + 300`)
 *               put `#contact`'s top ~696px into the frame. `.vwd` is one
 *               screen and its rest is its SEAT now; that position is not
 *               a rest any more.
 */
const KNOWN_CHROME_COLLISIONS: Record<string, readonly string[]> = {
  /* ADR-115 (2026-09-20): the ring band's runway grew 300 → 330svh for the
     deck's exit, and `#services`' MID rest (half its height) slid ~15svh
     down into the proof pile — where a field sheet's sentence ("Relative
     draw measured against workload.") passes under the settings cluster and
     the BR bracket, mid-station copy the padding floor cannot reach (§1).
     Measured on both phone projects; the seat and NEAR read `(none)`. */
  services: [".rin-settings", ".hud__corner--br"],
};

const BOOT_TIMEOUT = 20_000;
const SEEK_TIMEOUT = 12_000;
const SETTLE_MS = 650;

type Rect = { x: number; y: number; width: number; height: number };
type ChromeBox = { sel: string; rect: Rect };
// Same shape, declared for the in-page closure (which cannot see the
// module's types once it is serialised into the browser).
type ChromeBoxLike = ChromeBox;

function phonesOnly(testInfo: TestInfo) {
  test.skip(
    !PHONE_PROJECTS.has(testInfo.project.name),
    "the mobile seam laws are ≤960 rules; the tablet and desktop projects are a different composition"
  );
}

async function settle(page: Page, extraMs = 80) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
  if (extraMs) await page.waitForTimeout(extraMs);
}

async function boot(page: Page) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-v2-stage", { timeout: BOOT_TIMEOUT });
  // The mobile branch publishes the surface but never the desktop handoff
  // attributes (about-voidwalker-handoff-boundaries pins that), so this is
  // the one attribute that says "the phone composition has mounted".
  await expect(page.locator("#voidwalker")).toHaveAttribute("data-vw-surface", "hologram", {
    timeout: BOOT_TIMEOUT,
  });
  await settle(page, SETTLE_MS);
}

/**
 * Wait for the scroll — the smooth `scrollTo` AND the snap animation that
 * Chromium starts at scroll-end — to come to rest: `scrollend` if the engine
 * fires it, else twelve consecutive still frames, capped.
 * ⚠ A THREE-FRAME STILL IS NOT ENOUGH HERE: the snap starts a few frames
 * after the smooth scroll stops, and a read taken in that gap sees a page
 * that is about to move again.
 */
async function settleSnap(page: Page, capMs = 1500) {
  await page.evaluate(
    (cap) =>
      new Promise<void>((resolve) => {
        const start = performance.now();
        let last = window.scrollY;
        let still = 0;
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          window.removeEventListener("scrollend", onEnd);
          resolve();
        };
        const onEnd = () => {
          // One more frame so the post-snap layout is what gets read.
          requestAnimationFrame(() => requestAnimationFrame(finish));
        };
        window.addEventListener("scrollend", onEnd, { once: true });
        const tick = () => {
          if (done) return;
          const now = window.scrollY;
          still = Math.abs(now - last) < 0.5 ? still + 1 : 0;
          last = now;
          if (still >= 12 || performance.now() - start > cap) finish();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    capMs
  );
}

/** Roll to `y` in viewport-sized steps so the WebGL frameloop sees the travel. */
async function rollTo(page: Page, y: number) {
  await page.evaluate(async (target: number) => {
    const step = Math.max(300, window.innerHeight * 0.5);
    const from = window.scrollY;
    const dir = target > from ? 1 : -1;
    for (let at = from; dir > 0 ? at < target : at > target; at += dir * step) {
      window.scrollTo(0, at);
      await new Promise((r) => requestAnimationFrame(r));
    }
    window.scrollTo(0, target);
  }, y);
  await page.waitForTimeout(SETTLE_MS);
  await settleSnap(page);
}

/** The document y of every snap seat on the page (ADR-113): the three
 *  station stops and the instrument's own top. Read fresh each time — the
 *  corridor's lazy content moves them. */
async function snapSeats(page: Page): Promise<number[]> {
  return page.evaluate(() => {
    /* Every aligned position the page declares, by what its alignment NAMES:
       a `start` stop's top, an `end` stop's bottom on the snapport's bottom
       (ADR-115's flip's-end target). `#about` is listed for the flag-off
       page, where it is still a `start` stop; on the band it computes `none`
       and drops out, and its two targets take its place. */
    const seats: number[] = [];
    const vh = document.documentElement.clientHeight;
    for (const sel of [
      "#services",
      "#about",
      ".voidwalker__snap-in",
      ".voidwalker__snap",
      "#contact",
      ".vwd",
    ]) {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) continue;
      const align = getComputedStyle(el).scrollSnapAlign;
      if (align === "none") continue;
      const r = el.getBoundingClientRect();
      seats.push((align.includes("end") ? r.bottom - vh : r.top) + window.scrollY);
    }
    return seats;
  });
}

/**
 * Roll to `y` and keep rolling until the page agrees it is there.
 * ⚠ ONE `rollTo` IS NOT ENOUGH AND THIS IS MEASURED: the corridor's content
 * mounts and unmounts as it enters the rendering window, so the document
 * height moves under the scroll and a single pass can land ~1200px short
 * (seen at the #services approach). The loop is the fix, the timeout is
 * what keeps it a test rather than a hang.
 * ⚠ AND A LANDING ON A SNAP SEAT COUNTS AS SETTLED (ADR-113): the engine
 * has answered the request the way it answers a reader's flick, and a loop
 * that keeps asking for the un-snapped number never converges.
 */
async function seekTo(page: Page, y: number, tolerance = 8): Promise<number> {
  const deadline = Date.now() + SEEK_TIMEOUT;
  let at = await page.evaluate(() => window.scrollY);
  while (Date.now() < deadline) {
    await rollTo(page, y);
    at = await page.evaluate(() => window.scrollY);
    if (Math.abs(at - y) <= tolerance) return at;
    // A target past the document's end is legitimately unreachable.
    const capped = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight
    );
    if (y >= capped && at >= capped - tolerance) return at;
    // Snapped: the page is resting on a seat within reach of the ask.
    const seats = await snapSeats(page);
    if (seats.some((s) => Math.abs(at - s) <= 1.5)) return at;
  }
  throw new Error(`seek never settled on ${y} (last read ${at})`);
}

/**
 * Nothing on the page may be wider than the viewport, and the page may not
 * pan sideways (ADR-082 U28 clipped the root; this is the CI half of that
 * device read). Fixed chrome is skipped — `.gateway`/`.hud` are `100vw` plus
 * a gutter by design and never scroll — and so is anything under an
 * ancestor that clips or scrolls in x (the era reel's five-cell track behind
 * its three-cell window is wider on purpose and creates no scrollable
 * overflow). Candidate sources, should this ever go red: `.station:not(.hero)`'s
 * `100vw` margin trick, `.svc-ring-runway`'s negative `margin-inline`, the
 * entry-hold cell (`home-v2.css`), the canvas' `100vw`.
 */
async function horizontalOverflow(
  page: Page
): Promise<{ scrollWidth: number; clientWidth: number; scrollX: number; wide: string[] }> {
  return page.evaluate(() => {
    const y = window.scrollY;
    const clientWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    window.scrollTo(400, y);
    const scrollX = window.scrollX;
    window.scrollTo(0, y);
    const clipsX = (el: Element): boolean => {
      let p: Element | null = el.parentElement;
      while (p && p !== document.documentElement) {
        const o = getComputedStyle(p).overflowX;
        if (o === "clip" || o === "hidden" || o === "auto" || o === "scroll") return true;
        p = p.parentElement;
      }
      return false;
    };
    const wide: string[] = [];
    const vh = window.innerHeight;
    for (const el of document.body.querySelectorAll<HTMLElement>("*")) {
      const s = getComputedStyle(el);
      if (s.display === "none" || s.visibility === "hidden") continue;
      if (Number.parseFloat(s.opacity) < 0.05) continue;
      if (s.position === "fixed") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.bottom < 0 || r.top > vh) continue;
      if (r.right <= clientWidth + 1 && r.left >= -1) continue;
      if (clipsX(el)) continue;
      const tag = el.tagName.toLowerCase();
      const cls =
        el.className && typeof el.className === "string"
          ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
          : "";
      wide.push(`${tag}${cls} [${Math.round(r.left)}…${Math.round(r.right)}]`);
      if (wide.length >= 12) break;
    }
    return { scrollWidth, clientWidth, scrollX, wide };
  });
}

/** Scroll until `probe()` reports true, in viewport-fraction steps. */
async function seekUntil(
  page: Page,
  from: number,
  probe: () => Promise<boolean>,
  label: string
): Promise<number> {
  const vh = await page.evaluate(() => window.innerHeight);
  const deadline = Date.now() + SEEK_TIMEOUT * 2;
  let y = from;
  const seen: number[] = [];
  while (Date.now() < deadline) {
    const at = await seekTo(page, Math.round(y));
    if (await probe()) return at;
    seen.push(at);
    y = at + vh * 0.25;
    const capped = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight
    );
    if (at >= capped) break;
  }
  throw new Error(`never reached ${label} (walked ${seen.join(", ")})`);
}

/**
 * ⚠ THE BANDS ARE A `calc()` AND MUST BE RESOLVED BY THE ENGINE, NOT PARSED.
 * `getPropertyValue("--mobile-chrome-top")` hands back the authored
 * expression, not a length. A throwaway element that spends them as padding
 * is what makes the computed style report pixels.
 */
async function chromeBands(page: Page): Promise<{ top: number; bottom: number }> {
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.cssText = [
      "position:fixed",
      "top:0",
      "left:0",
      "width:0",
      "height:0",
      "visibility:hidden",
      "pointer-events:none",
      "padding-top:var(--mobile-chrome-top)",
      "padding-bottom:var(--mobile-chrome-bottom)",
    ].join(";");
    document.body.appendChild(probe);
    const s = getComputedStyle(probe);
    const out = {
      top: Number.parseFloat(s.paddingTop),
      bottom: Number.parseFloat(s.paddingBottom),
    };
    probe.remove();
    return out;
  });
}

/**
 * Every chrome element that is actually PAINTING right now, as its painted
 * rect.
 *
 * ⚠ A BOUNDING RECT IS NOT A PAINTED RECT ON THIS SURFACE, AND THAT IS THE
 * WHOLE REASON THIS HELPER EXISTS. The HUD frame is revealed by a CLIP that
 * tracks the hero's exit (`--hero-lift`; `.hud__corner--tl` /
 * `.hud__corner--br` in landing.css), so behind the curtain the brackets
 * report a full 28x28 rect while `clip-path` computes to `inset(828px …)`
 * on a 28px box — they paint nothing at all. Measured at 390x844: at
 * scrollY 0 BOTH brackets are fully clipped; at scrollY 295 the TL still is.
 * Take the rect at face value and every hero headline reads as "copy under
 * chrome" against chrome that is not on screen.
 */
async function visibleChrome(page: Page, selectors: readonly string[]): Promise<ChromeBox[]> {
  return page.evaluate((sels) => {
    // `inset()` takes the CSS box shorthand: 1 → all, 2 → block/inline,
    // 3 → top/inline/bottom, 4 → top/right/bottom/left. Computed style
    // resolves every term to px, so no calc() survives to here.
    const insetOf = (clip: string): [number, number, number, number] | null => {
      const m = clip.match(/^inset\(([^)]*)\)/);
      if (!m) return null;
      const parts = m[1]!
        .trim()
        .split(/\s+/)
        .map((p) => Number.parseFloat(p));
      if (parts.some((p) => Number.isNaN(p))) return null;
      const [a, b, c, d] = parts;
      if (parts.length === 1) return [a!, a!, a!, a!];
      if (parts.length === 2) return [a!, b!, a!, b!];
      if (parts.length === 3) return [a!, b!, c!, b!];
      if (parts.length >= 4) return [a!, b!, c!, d!];
      return null;
    };

    const out: ChromeBoxLike[] = [];
    for (const sel of sels) {
      for (const el of document.querySelectorAll<HTMLElement>(sel)) {
        const s = getComputedStyle(el);
        if (s.display === "none" || s.visibility === "hidden") continue;
        if (Number.parseFloat(s.opacity) < 0.05) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) continue;

        let { x, y, width, height } = r;
        const inset = s.clipPath && s.clipPath !== "none" ? insetOf(s.clipPath) : null;
        if (inset) {
          const [t, right, b, left] = inset;
          x += Math.max(0, left);
          y += Math.max(0, t);
          width -= Math.max(0, left) + Math.max(0, right);
          height -= Math.max(0, t) + Math.max(0, b);
        }
        if (width < 1 || height < 1) continue;
        out.push({ sel, rect: { x, y, width, height } });
      }
    }
    return out;
  }, selectors);
}

/**
 * The scroll positions at which a station is "at rest" — where a reader
 * actually stops on it, as `{ label, y }` pairs.
 *
 * ⚠ THE HERO'S REST IS scrollY 0 AND NOTHING ELSE. It is the departing
 * curtain (ADR-022 v8): any position inside its own viewport is the card
 * mid-travel with its headline half off the top, which is a motion frame,
 * not a beat anyone reads.
 *
 * ⚠ SINCE ADR-113 THE FIRST REST IS THE SEAT — the station's snap stop
 * (`.vwd`'s top for #voidwalker, whose station keeps its own padding), which
 * is where a stop anywhere inside the proximity radius ends up. The old single
 * rest, `top + min(0.35h, 300)`, sat within 11px of Blink's radius at 430×932
 * (a third of the snapport: 311; measured 280 in 40px steps) — one layout
 * shift from being pulled onto the seat with the seek reporting a miss. A
 * station taller than ~1.6 viewports keeps two more reads: NEAR, at `top +
 * 340` — the first position a reader can hold past the seat, where the old
 * rest's collisions (the bio line under the readout) were measured — and MID,
 * at half its height, for a long station's middle (the pile). The ledger
 * below is about those two.
 */
async function stationRests(page: Page, id: string): Promise<{ label: string; y: number }[]> {
  if (id === "hero") return [{ label: "seat", y: 0 }];
  return page.evaluate((stationId) => {
    const el = document.getElementById(stationId);
    if (!el) throw new Error(`missing station #${stationId}`);
    // The seat is the INSTRUMENT: `.vwd` for the eras; the reading state's
    // snap target for the about band (ADR-115), the station otherwise.
    const seatEl =
      stationId === "voidwalker"
        ? (el.querySelector<HTMLElement>(".vwd") ?? el)
        : stationId === "about"
          ? (el.querySelector<HTMLElement>(".voidwalker__snap") ?? el)
          : el;
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    const seat = Math.round(seatEl.getBoundingClientRect().top + window.scrollY);
    const rests = [{ label: "seat", y: seat }];
    /* ADR-115: the about BAND's rests are its three holdable STATES, not
       NEAR and MID — a runway with two aligned targets inside it pulls
       `top + 340` back onto the flip's end (33px at 390×844) and half its
       height onto the reading seat (309px at 430×932), and the seek reports
       a miss on a page doing exactly what it should. The reading seat
       (`.voidwalker__snap`), the flip's end (`.voidwalker__snap-in`'s bottom
       on the fold) and the RELEASE (the band's last pinned frame, p = 1,
       past both radii — the handover) are where a reader can stop. */
    if (stationId === "about" && el.getAttribute("data-about-band") === "on") {
      const snapIn = el.querySelector<HTMLElement>(".voidwalker__snap-in");
      if (snapIn) {
        rests.push({
          label: "flip-end",
          y: Math.round(
            snapIn.getBoundingClientRect().bottom + window.scrollY - window.innerHeight
          ),
        });
      }
      rests.push({ label: "release", y: Math.round(top + r.height - window.innerHeight) });
      return rests;
    }
    if (r.height > window.innerHeight * 1.6) {
      rests.push({ label: "near", y: Math.round(top + 340) });
      rests.push({ label: "mid", y: Math.round(top + r.height * 0.5) });
    }
    return rests;
  }, id);
}

test.describe("mobile section seams", () => {
  test("adjacent stations never print over one another", async ({ page }, testInfo) => {
    phonesOnly(testInfo);
    await boot(page);

    const present = await page.evaluate(
      (ids) => ids.filter((id) => Boolean(document.getElementById(id))),
      [...STATION_IDS]
    );
    expect(present.length).toBeGreaterThan(3);

    for (let i = 0; i < present.length - 1; i += 1) {
      const [aId, bId] = [present[i]!, present[i + 1]!];
      await test.step(`${aId} → ${bId}`, async () => {
        // Put the LATER station's top at ~50 % of the viewport: the seam is
        // then mid-screen, where a sticky runway that has not released or a
        // negative margin that has not been cancelled is visible as an
        // overlap rather than hidden past an edge.
        const target = await page.evaluate((id) => {
          const el = document.getElementById(id)!;
          const top = el.getBoundingClientRect().top + window.scrollY;
          return Math.max(0, Math.round(top - window.innerHeight * 0.5));
        }, bId);
        await seekTo(page, target);
        await settle(page, SETTLE_MS);

        const seam = await page.evaluate(
          ({ a, b }) => {
            const ae = document.getElementById(a)!.getBoundingClientRect();
            const bEl = document.getElementById(b)!;
            const be = bEl.getBoundingClientRect();
            /* ADR-115: the ONE sanctioned overlap. `#about` on the ring rung
               is welded to `#services` by exactly one small viewport
               (`margin-top: -100svh`), so its band pins on the frame the
               services band's travel ends. Inside the weld the services
               band's copy must be BLANK (its `[data-untype]` stamp reads
               `gone`) — an overlap over legible copy is the defect this case
               exists for. */
            const weld = b === "about" && bEl.getAttribute("data-about-band") === "on";
            const probe = document.createElement("div");
            probe.style.cssText = "position:absolute;visibility:hidden;height:100svh";
            document.body.appendChild(probe);
            const svh = probe.getBoundingClientRect().height;
            probe.remove();
            const untype =
              document
                .querySelector(".svc-ring-band .services-masthead")
                ?.getAttribute("data-untype") ?? null;
            // What the about band PAINTS at this position: every text-bearing
            // element (and the portrait) inside the sticky band that is
            // visible and inside the frame. Before its windows the band's
            // runs are `visibility: hidden` by the run stamps, and the DOM
            // portrait by `data-about-deck="live"`.
            const inked: string[] = [];
            if (weld) {
              const band = bEl.querySelector<HTMLElement>(".voidwalker");
              const els = band
                ? [...band.querySelectorAll<HTMLElement>("h1, h2, h3, p, button, img, span, a")]
                : [];
              for (const el of els) {
                if (!el.textContent?.trim() && el.tagName !== "IMG") continue;
                const cs = getComputedStyle(el);
                if (cs.visibility === "hidden" || cs.display === "none") continue;
                if (Number.parseFloat(cs.opacity) < 0.05) continue;
                const r = el.getBoundingClientRect();
                if (r.width < 1 || r.height < 1) continue;
                if (r.bottom <= 0 || r.top >= window.innerHeight) continue;
                inked.push(
                  `${el.className || el.tagName}: ${(el.textContent ?? "").trim().slice(0, 40)}`
                );
              }
            }
            return {
              aBottom: ae.bottom,
              bTop: be.top,
              bTopDoc: be.top + window.scrollY,
              weld,
              svh,
              untype,
              inked,
            };
          },
          { a: aId, b: bId }
        );
        // 1px of tolerance: the corridor host's own sticky runway lands on
        // fractional device pixels, and a seam is a seam at 0.5px.
        if (seam.weld) {
          expect(
            seam.aBottom - seam.bTop,
            `#about's weld to #services is not one viewport (${(seam.aBottom - seam.bTop).toFixed(1)} against ${seam.svh})`
          ).toBeCloseTo(seam.svh, 0);
          // Mid-seam the services band is still pinned with half a viewport
          // of its exit to run, so its copy is mid-un-type (`live`) — and the
          // about band, half a viewport down, may paint NOTHING yet: two
          // bands inside one weld, at most one of them lettered.
          expect(seam.untype, "the services band's copy is not un-typing inside the weld").toMatch(
            /^(live|gone)$/
          );
          expect(
            seam.inked,
            "the about band prints while the services band's copy is still on screen"
          ).toEqual([]);
          // Then the weld frame itself — #about's top on the frame's top, the
          // services band's travel ended: its copy must be GONE.
          const landed = await seekTo(page, Math.round(seam.bTopDoc));
          await settle(page, SETTLE_MS);
          const atWeld = await page.evaluate(() => ({
            untype:
              document
                .querySelector(".svc-ring-band .services-masthead")
                ?.getAttribute("data-untype") ?? null,
            aboutTop: document.getElementById("about")!.getBoundingClientRect().top,
          }));
          expect(
            Math.abs(atWeld.aboutTop),
            `the weld frame could not be seated (landed ${landed}, #about top ${atWeld.aboutTop.toFixed(1)})`
          ).toBeLessThan(2);
          expect(atWeld.untype, "the services band's copy is still printed at the weld").toBe(
            "gone"
          );
          return;
        }
        expect(
          seam.bTop,
          `#${bId} starts ${(seam.aBottom - seam.bTop).toFixed(1)}px inside #${aId}`
        ).toBeGreaterThanOrEqual(seam.aBottom - 1);
      });
    }
  });

  test("no station copy sits under the fixed chrome at rest", async ({ page }, testInfo) => {
    phonesOnly(testInfo);
    await boot(page);

    const open: string[] = [];
    const sideways: string[] = [];
    for (const id of STATION_IDS) {
      const exists = await page.evaluate((s) => Boolean(document.getElementById(s)), id);
      if (!exists) continue;

      // Warm the lazy corridor before the rests are solved: a seat read
      // from the hero is a seat the mount then moves.
      const rests = await stationRests(page, id);
      for (const rest of rests) {
        await test.step(`#${id} @${rest.label}`, async () => {
          await seekTo(page, rest.y);
          await settle(page, SETTLE_MS);

          // Law 2's other axis (ADR-082 U28 / ADR-113): nothing wider than
          // the viewport, and no sideways pan, at every rest.
          const h = await horizontalOverflow(page);
          sideways.push(
            `#${id} @${rest.label}: scrollWidth ${h.scrollWidth}/${h.clientWidth}, scrollX ${h.scrollX}` +
              (h.wide.length ? `, wide: ${h.wide.join(" | ")}` : "")
          );
          expect(h.scrollX, `#${id} @${rest.label}: the page pans sideways`).toBe(0);
          expect(
            h.scrollWidth,
            `#${id} @${rest.label}: the document is wider than the viewport`
          ).toBeLessThanOrEqual(h.clientWidth + 1);
          expect(h.wide, `#${id} @${rest.label}: content overflows the viewport sideways`).toEqual(
            []
          );

          const chrome = await visibleChrome(page, CHROME_SELECTORS);
          // ⚠ #hero legitimately paints NO frame: the whole HUD is clipped
          // away behind the curtain until `--hero-lift` opens it. Everywhere
          // else, finding nothing means the probe has stopped measuring.
          if (id !== "hero") {
            expect(
              chrome.length,
              "no fixed chrome found — the probe is measuring nothing"
            ).toBeGreaterThan(0);
          }

          const hits = await page.evaluate((boxes) => {
            /**
             * ⚠ AN ELEMENT BOX IS NOT AN INK BOX, AND THE FIRST CUT OF THIS
             * TEST FAILED ON THE DIFFERENCE. A `.fl-brief` container is 200px
             * tall around a 39px line of type, so an element-rect test reports
             * a collision for a headline sitting 90px clear of the corner.
             * Range client rects are the actual glyph runs — one per line box,
             * measured where the letters are.
             *
             * ⚠ AND `elementsFromPoint` CANNOT DO THIS JOB AT ALL: it skips
             * `pointer-events: none`, which is every piece of chrome on this
             * surface, and it answers about a POINT when the question is about
             * an AREA. The chrome is z 60 over everything, so any station ink
             * inside a chrome rect is by definition painting underneath it.
             */
            const found: { sel: string; text: string; rect: number[]; fontSize: number }[] = [];
            for (const station of document.querySelectorAll(".station")) {
              const walker = document.createTreeWalker(station, NodeFilter.SHOW_TEXT);
              let node: Node | null;
              while ((node = walker.nextNode())) {
                const text = (node.textContent || "").trim();
                if (text.length < 2) continue;
                const parent = node.parentElement;
                if (!parent) continue;
                const cs = getComputedStyle(parent);
                if (cs.display === "none" || cs.visibility === "hidden") continue;
                if (Number.parseFloat(cs.opacity) < 0.05) continue;
                const range = document.createRange();
                range.selectNodeContents(node);
                for (const r of Array.from(range.getClientRects())) {
                  if (r.width < 1 || r.height < 1) continue;
                  for (const box of boxes) {
                    const b = box.rect;
                    if (
                      r.left < b.x + b.width &&
                      b.x < r.right &&
                      r.top < b.y + b.height &&
                      b.y < r.bottom
                    ) {
                      found.push({
                        sel: box.sel,
                        text: text.slice(0, 40),
                        rect: [
                          Math.round(r.left),
                          Math.round(r.top),
                          Math.round(r.width),
                          Math.round(r.height),
                        ],
                        fontSize: Number.parseFloat(cs.fontSize),
                      });
                    }
                  }
                }
              }
            }
            return found;
          }, chrome);

          for (const h of hits) {
            open.push(
              `#${id} @${rest.label} ${h.sel} ∩ "${h.text}" @[${h.rect.join(",")}] ${h.fontSize}px`
            );
          }

          const collided = [...new Set(hits.map((h) => h.sel))].sort();
          const allowed = [...(KNOWN_CHROME_COLLISIONS[id] ?? [])].sort();
          const unlisted = collided.filter((sel) => !allowed.includes(sel));

          expect(
            unlisted,
            `NEW chrome-over-copy on #${id} @${rest.label}: ${hits
              .filter((h) => unlisted.includes(h.sel))
              .map((h) => `${h.sel} ∩ "${h.text}"`)
              .join(" | ")}`
          ).toEqual([]);
        });
      }
    }

    // The register, on every run, passing or not — an allowlist nobody can
    // read is an allowlist that grows.
    await testInfo.attach("chrome-over-copy", {
      body: open.length ? open.join("\n") : "(none)",
      contentType: "text/plain",
    });
    await testInfo.attach("horizontal-overflow", {
      body: sideways.join("\n"),
      contentType: "text/plain",
    });
  });

  test("the mobile epilogue signal is dead once #services owns the screen", async ({
    page,
  }, testInfo) => {
    phonesOnly(testInfo);
    await boot(page);

    const svcTop = await page.evaluate(
      () => document.getElementById("services")!.getBoundingClientRect().top + window.scrollY
    );

    // Walk in from well before the seam so the signal is genuinely alive
    // first — asserting it is dead somewhere it was never shown proves
    // nothing. Measured at 390x844: opacity 1 from #services' top at ~166 %
    // of the viewport down to ~47 %, then 0.
    const alive = await page.evaluate(() => {
      const sig = document.querySelector<HTMLElement>(".home-v2-mobile-signal");
      return sig ? getComputedStyle(sig).display : "(absent)";
    });
    expect(alive, "the mobile signal is not mounted on this width").toBe("block");

    await seekUntil(
      page,
      Math.max(0, svcTop - 1600),
      async () =>
        page.evaluate(() => {
          const svc = document.getElementById("services")!;
          return svc.getBoundingClientRect().top / window.innerHeight < 0.45;
        }),
      "#services' top crossing 45 % of the viewport"
    );
    await settle(page, SETTLE_MS);

    const state = await page.evaluate(() => {
      const sig = document.querySelector<HTMLElement>(".home-v2-mobile-signal")!;
      const svc = document.getElementById("services")!;
      return {
        topPct: svc.getBoundingClientRect().top / window.innerHeight,
        opacity: Number.parseFloat(getComputedStyle(sig).opacity),
        inert: sig.hasAttribute("inert"),
      };
    });

    expect(state.topPct).toBeLessThan(0.45);
    expect(state.opacity, "the signal is still painting over #services").toBeLessThanOrEqual(0.01);
    expect(state.inert, "the signal still takes taps over #services").toBe(true);

    // Reversible: scroll back out of the band and the signal returns. A
    // kill that only latches one way is a kill that strands the epilogue
    // for anyone who scrolls up.
    await seekTo(page, Math.max(0, Math.round(svcTop - 600)));
    await settle(page, SETTLE_MS);
    const back = await page.evaluate(() => {
      const svc = document.getElementById("services")!;
      return svc.getBoundingClientRect().top / window.innerHeight;
    });
    expect(back, "the walk back never left the kill band").toBeGreaterThan(0.45);
  });

  test("every fixed chrome rect stays inside a reserved band", async ({ page }, testInfo) => {
    phonesOnly(testInfo);
    await boot(page);

    const bands = await chromeBands(page);
    expect(bands.top, "--mobile-chrome-top does not resolve at this width").toBeGreaterThan(0);
    expect(bands.bottom, "--mobile-chrome-bottom does not resolve at this width").toBeGreaterThan(
      0
    );

    for (const id of STATION_IDS) {
      const exists = await page.evaluate((s) => Boolean(document.getElementById(s)), id);
      if (!exists) continue;

      for (const rest of await stationRests(page, id)) {
        await test.step(`#${id} @${rest.label}`, async () => {
          await seekTo(page, rest.y);
          await settle(page, SETTLE_MS);

          const vh = await page.evaluate(() => window.innerHeight);
          const chrome = await visibleChrome(page, CHROME_SELECTORS);
          if (id !== "hero") expect(chrome.length).toBeGreaterThan(0);

          const strays = chrome.filter((c) => {
            const inTop = c.rect.y + c.rect.height <= bands.top + 1;
            const inBottom = c.rect.y >= vh - bands.bottom - 1;
            return !inTop && !inBottom;
          });

          expect(
            strays.map(
              (s) =>
                `${s.sel} at y ${s.rect.y.toFixed(1)}…${(s.rect.y + s.rect.height).toFixed(1)} ` +
                `(bands: 0…${bands.top}, ${vh - bands.bottom}…${vh})`
            ),
            "fixed chrome is painting outside the bands the stations reserve — either move it back into a band or re-derive the two tokens in this same commit"
          ).toEqual([]);
        });
      }
    }
  });

  test("the padding floor and the content-visibility opt-out are live", async ({
    page,
  }, testInfo) => {
    phonesOnly(testInfo);
    await boot(page);

    const bands = await chromeBands(page);
    const report = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>(".station")].map((el) => {
        const s = getComputedStyle(el);
        /* ADR-115: a station whose composition is a sticky BAND reserves the
           chrome ON THE BAND (ADR-109's `.svc-ring-band`, and `#about`'s
           `.voidwalker` under `data-about-band`), and its own paddings are 0
           — the weld needs the two stations' travel to abut. The floor is
           whichever of the two reserves it. */
        const band =
          el.id === "about" && el.getAttribute("data-about-band") === "on"
            ? el.querySelector<HTMLElement>(":scope > .voidwalker")
            : el.querySelector<HTMLElement>(".svc-ring-band");
        const b = band ? getComputedStyle(band) : null;
        const bandTop = b ? Number.parseFloat(b.paddingTop) : 0;
        const bandBottom = b ? Number.parseFloat(b.paddingBottom) : 0;
        return {
          id: el.id || "(none)",
          hero: el.classList.contains("hero"),
          cover: el.classList.contains("station--cover"),
          padTop: Math.max(Number.parseFloat(s.paddingTop), bandTop),
          padBottom: Math.max(Number.parseFloat(s.paddingBottom), bandBottom),
          contentVisibility: s.contentVisibility,
        };
      })
    );

    for (const st of report) {
      if (st.hero) continue;
      // Law 4 — `content-visibility: auto` is a desktop optimisation. Its
      // `contain-intrinsic-size` guess is one viewport, and a phone station
      // runs 1.2–2.7 of them; the correction reflows the document under the
      // reader's thumb. Measured: #contact reserved 1204px for an 844px box.
      expect(st.contentVisibility, `#${st.id} still skips its contents on mobile`).not.toBe("auto");

      // Law 1 — the chrome bands are reserved. #voidwalker is the named
      // exception: `.vwd` is a one-screen 100svh instrument that clears the
      // chrome from inside, so its own id rule keeps the station.
      if (st.cover || st.id === "voidwalker") continue;
      expect(st.padTop, `#${st.id} does not reserve the top chrome band`).toBeGreaterThanOrEqual(
        bands.top - 0.5
      );
      expect(
        st.padBottom,
        `#${st.id} does not reserve the bottom chrome band`
      ).toBeGreaterThanOrEqual(bands.bottom - 0.5);
    }
  });

  /* ── ADR-113: the stations are snap stops ─────────────────────────── */

  /* ADR-115: `#about`'s stops are two absolute targets inside its runway —
     the FLIP'S END (`.voidwalker__snap-in`, `end`-aligned: its bottom on the
     snapport's bottom is the one position it names) and the READING SEAT
     (`.voidwalker__snap`, `start`-aligned, one screen: a stop near it lands
     on it, from either side) — never the station itself and never the
     sticky band. ⚠ Measured in Blink: an aligned position attracts within
     ~280px either way and a covering area never overrides one. */
  const SNAP_STOPS = [
    "#services",
    ".voidwalker__snap-in",
    ".voidwalker__snap",
    "#contact",
    ".vwd",
  ] as const;
  /** The alignment each stop declares; `end` names its BOTTOM edge. */
  const SNAP_ALIGN: Record<(typeof SNAP_STOPS)[number], "start" | "end"> = {
    "#services": "start",
    ".voidwalker__snap-in": "end",
    ".voidwalker__snap": "start",
    "#contact": "start",
    ".vwd": "start",
  };
  const NOT_SNAP_AREAS = [
    "#hero",
    "#about",
    "#voidwalker",
    ".home-v2-stage",
    ".home-v2-stage__sticky",
    ".pf-stack",
    ".pf-slot",
    ".svc-ring-runway",
    ".svc-ring-band",
    ".voidwalker",
    ".vwd__band",
  ] as const;

  async function readSnap(page: Page) {
    return page.evaluate(
      ({ stops, inert }) => {
        const align = (sel: string) => {
          const el = document.querySelector<HTMLElement>(sel);
          return el ? getComputedStyle(el).scrollSnapAlign : "(absent)";
        };
        return {
          root: getComputedStyle(document.documentElement).scrollSnapType,
          stops: stops.map((s) => [s, align(s)] as const),
          inert: inert.map((s) => [s, align(s)] as const),
        };
      },
      { stops: [...SNAP_STOPS], inert: [...NOT_SNAP_AREAS] }
    );
  }

  test("the stations are snap stops, and nothing inside them is (ADR-113)", async ({
    page,
  }, testInfo) => {
    phonesOnly(testInfo);
    await boot(page);

    const snap = await readSnap(page);
    // ⚠ `scroll-snap-type: y proximity` COMPUTES TO `"y"`: proximity is the
    // default strictness and the serialisation drops it. `y mandatory` would
    // keep its keyword — and would be the wrong container for this page.
    expect(snap.root, "the root is not a proximity snap container on the phone").toMatch(
      /^y( proximity)?$/
    );
    for (const [sel, v] of snap.stops) {
      const want = SNAP_ALIGN[sel as (typeof SNAP_STOPS)[number]];
      expect(v, `${sel} is not a snap stop (${want})`).toMatch(new RegExp(`^${want}`));
    }
    // ⚠ The seat is the INSTRUMENT: `#voidwalker` keeps ~67px of its own
    // padding on the phone, so a station-top stop would seat the 100svh
    // instrument 67px down and its era stops below the fold. The hero and
    // the corridor host are deliberately not stops, and no sticky child
    // (the ring band, the proof slots) may become one.
    for (const [sel, v] of snap.inert) {
      expect(v, `${sel} became a snap area`).toMatch(/^(none|\(absent\))$/);
    }
  });

  test("a stop short of a station glides onto its seat; the instrument seats itself (ADR-113)", async ({
    page,
  }, testInfo) => {
    phonesOnly(testInfo);
    await boot(page);

    // A stop's SEAT is the scroll position its alignment names: the top for
    // `start`, the bottom edge less the snapport for `end` (ADR-115's cover).
    const seatOf = (sel: string) =>
      page.evaluate(
        ({ s, align }) => {
          const el = document.querySelector<HTMLElement>(s);
          if (!el) throw new Error(`missing ${s}`);
          const r = el.getBoundingClientRect();
          const vh = document.documentElement.clientHeight;
          return Math.round((align === "end" ? r.bottom - vh : r.top) + window.scrollY);
        },
        { s: sel, align: SNAP_ALIGN[sel as (typeof SNAP_STOPS)[number]] }
      );
    // The stop's box relative to its seat: `top` is 0 on the seat for both
    // alignments (an `end` target's seat puts its bottom on the fold).
    const topOf = (sel: string) =>
      page.evaluate(
        ({ s, align }) => {
          const el = document.querySelector<HTMLElement>(s)!;
          const r = el.getBoundingClientRect();
          const vh = document.documentElement.clientHeight;
          return {
            top: align === "end" ? r.bottom - vh : r.top,
            height: r.height,
            vh: window.innerHeight,
          };
        },
        { s: sel, align: SNAP_ALIGN[sel as (typeof SNAP_STOPS)[number]] }
      );
    const maxScroll = () =>
      page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);

    const landings: string[] = [];
    for (const sel of SNAP_STOPS) {
      await test.step(sel, async () => {
        // Get near first so the lazy corridor has mounted, then re-read the
        // seat: a seat solved from the hero is a seat the mount then moves.
        await seekTo(page, Math.max(0, (await seatOf(sel)) - 40));
        const seat = await seatOf(sel);

        // Short of the seat: inside the proximity radius, so the stop
        // glides onto it — the owner's "components lock in".
        await rollTo(page, Math.max(0, seat - 40));
        const short = await topOf(sel);
        landings.push(`${sel} seat−40 → top ${short.top.toFixed(1)}`);
        expect(
          Math.abs(short.top),
          `${sel}: a stop 40px short of the seat did not glide onto it`
        ).toBeLessThanOrEqual(1.5);

        // Past the seat. A station TALLER than the screen stays where the
        // reader stopped (the covering rule — right for a section you read
        // down); the one-screen instrument snaps back, which is the second
        // of the owner's two stills.
        if (seat + 60 > (await maxScroll())) {
          landings.push(`${sel} seat+60 → (past the document's end, not asked)`);
          return;
        }
        await rollTo(page, seat + 60);
        const past = await topOf(sel);
        landings.push(
          `${sel} seat+60 → top ${past.top.toFixed(1)} (h ${Math.round(past.height)} / vh ${past.vh})`
        );
        /* ADR-115: the covering rule needs a box that still COVERS the
           snapport 60px past its seat. A `start` station taller than the
           screen does; an `end` target's box ends on the fold at its seat,
           so 60px past it the bottom of the screen is uncovered and the
           aligned position pulls the stop back — which is what the flip's
           end is FOR (a stop inside the name's window returns to the
           portrait alone). Measured in Blink, about-band.css's header. */
        const covers =
          past.height > past.vh + 1 && SNAP_ALIGN[sel as (typeof SNAP_STOPS)[number]] === "start";
        if (covers) {
          expect(
            past.top,
            `${sel}: a station taller than the screen was pulled back to its seat from 60px past it`
          ).toBeLessThanOrEqual(-58);
        } else {
          expect(
            Math.abs(past.top),
            `${sel}: the seat did not pull a stop 60px past it back (a one-screen instrument, or an end-aligned target)`
          ).toBeLessThanOrEqual(1.5);
        }
      });
    }

    // The seated instrument, both stills at once: the era stops on screen
    // above the settings row, the title clear of the readout and the TL
    // bracket. This is what the snap is FOR.
    await test.step(".vwd seated", async () => {
      await seekTo(page, await seatOf(".vwd"));
      await settle(page, SETTLE_MS);
      const chrome = await visibleChrome(page, [
        ".hud__nav__btn",
        ".hud__corner--tl",
        ".rin-settings",
      ]);
      const seated = await page.evaluate((boxes) => {
        const vwd = document.querySelector<HTMLElement>(".vwd")!;
        const band = vwd.querySelector<HTMLElement>(".vwd__band");
        const title = vwd.querySelector<HTMLElement>(".vwd__mast__title");
        const hits: string[] = [];
        if (title) {
          const range = document.createRange();
          range.selectNodeContents(title);
          for (const r of Array.from(range.getClientRects())) {
            for (const b of boxes) {
              const x = b.rect;
              if (
                r.left < x.x + x.width &&
                x.x < r.right &&
                r.top < x.y + x.height &&
                x.y < r.bottom
              ) {
                hits.push(`${b.sel} ∩ title`);
              }
            }
          }
        }
        const settings = boxes.find((b) => b.sel === ".rin-settings");
        const bandRect = band?.getBoundingClientRect() ?? null;
        // ⚠ THE BAND'S BOX REACHES THE FLOOR BY DESIGN — it is `bottom: 0`
        // inside `.vwd` and its padding-bottom IS the chrome reserve. What may
        // not run under the settings row is the STOPS' ink: the chips' union,
        // which `probe-voidwalker-phone.mjs` measures the same way.
        const chips = Array.from(vwd.querySelectorAll<HTMLElement>(".vwd__chip"))
          .map((c) => c.getBoundingClientRect())
          .filter((r) => r.width > 0 && r.height > 0);
        const chipsBottom = chips.length ? Math.max(...chips.map((r) => r.bottom)) : null;
        return {
          vwdTop: vwd.getBoundingClientRect().top,
          bandBottom: bandRect ? bandRect.bottom : null,
          chipsBottom,
          settingsTop: settings ? settings.rect.y : null,
          vh: window.innerHeight,
          hits,
        };
      }, chrome);
      expect(Math.abs(seated.vwdTop), "the instrument is not on its seat").toBeLessThanOrEqual(1.5);
      expect(seated.bandBottom, "the era band is missing").not.toBeNull();
      expect(seated.bandBottom!, "the era band is below the fold").toBeLessThanOrEqual(
        seated.vh + 1
      );
      expect(seated.chipsBottom, "no era stops are painting").not.toBeNull();
      expect(seated.chipsBottom!, "the era stops are below the fold").toBeLessThanOrEqual(
        seated.vh + 1
      );
      if (seated.settingsTop !== null) {
        expect(
          seated.chipsBottom!,
          `the era stops (bottom ${seated.chipsBottom!.toFixed(1)}) run under the settings row (top ${seated.settingsTop.toFixed(1)})`
        ).toBeLessThanOrEqual(seated.settingsTop + 0.5);
      }
      expect(seated.hits, "the title prints under the chrome").toEqual([]);
    });

    await testInfo.attach("snap-landings", {
      body: landings.join("\n"),
      contentType: "text/plain",
    });
  });

  test("the desktop declares no snap (byte-identity)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "the snap seats are a phone rule");
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage", { timeout: BOOT_TIMEOUT });
    const snap = await readSnap(page);
    expect(snap.root).toBe("none");
    for (const [sel, v] of [...snap.stops, ...snap.inert]) {
      expect(v, `${sel} snaps on the desktop`).toMatch(/^(none|\(absent\))$/);
    }
  });
});
