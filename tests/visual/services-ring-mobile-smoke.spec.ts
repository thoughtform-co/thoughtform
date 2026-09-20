import { expect, test, type Page } from "@playwright/test";

import { SERVICES } from "../../components/landing/home-v2/services/serviceData";
import { ringMobileBandFraction } from "../../lib/services-ring/beatScrollTarget";
import { RING_MOBILE_LEAVE_START, RING_MOBILE_SEAT_FILL } from "../../lib/services-ring/ringMath";

/** Each card's beat, as a fraction of the band's own scroll — the clock's
 *  inverse, never a literal: ADR-115 moved the leave and a fixed 0.4 landed
 *  mid-turn, where only two cards face the reader. */
const BEAT = [0, 1, 2, 3].map((i) => ringMobileBandFraction(i));

/**
 * THE RING ON PHONES (ADR-108) AND ITS BEAT (ADR-109).
 *
 * At `SERVICES_RING_MOBILE_MEDIA` the corridor's card ring — the desktop
 * offer beat's WebGL carousel around the parked mark — mounts on a phone
 * too: `useCorridorExitScroll` lets the ambient hold engage (the corridor's
 * canvas goes FIXED behind `#services`), `ServicesStage` renders a sticky
 * BAND whose scroll is the ring's clock, and `ServicesRingHitAreas` shims
 * one button per visible card. Since ADR-109 the band IS the composition:
 * the masthead's title on top, an empty SEAT the ring fills, the paragraph
 * below — the thesis beat's own order — and a tap on the front card TURNS
 * IT OVER (ADR-110): its back face carries the spec, baked, and the hit
 * layer shims the back's ✕ and CTA onto the card's own rect. The plate
 * accordion does not render on this rung and nothing DOM rises.
 *
 * ⚠ CHROMIUM PHONE PROJECTS ONLY (the ADR-107 spec's own reason: the WebKit
 * iPhone projects cannot reach the local dev server). The corridor is WebGL,
 * so every position is reached by a REAL, stepped scroll — a teleport skips
 * the engagement band and leaves the canvas dead. Emulation has no real GPU:
 * the hit rects prove the ring projected, the stills are the owner's read.
 *
 * ⚠ `innerHeight` IS NOT THE LAYOUT VIEWPORT UNDER MOBILE EMULATION (the
 * ADR-107 spec's finding — the page lays out ~421px wide and the emulator
 * zooms out). Every viewport-derived bound below reads
 * `documentElement.clientWidth/Height`.
 *
 * What this spec does NOT test: the flag off. `SERVICES_CARD_RING_MOBILE` is
 * a source constant; its wiring is pinned by `services-ring-mobile-gate`,
 * and the desktop page is byte-identical by the media gates (the desktop
 * `services-ring-smoke` is the proof).
 */

const NOT_PHONE = ({
  browserName,
  viewport,
}: {
  browserName: string;
  viewport: { width: number } | null;
}) => browserName !== "chromium" || !viewport || viewport.width > 960;

async function settleScroll(page: Page, capMs = 1600): Promise<void> {
  await page.evaluate(async (cap) => {
    const t0 = performance.now();
    let last = window.scrollY;
    let still = 0;
    await new Promise<void>((resolve) => {
      const tick = () => {
        const y = window.scrollY;
        still = Math.abs(y - last) < 0.5 ? still + 1 : 0;
        last = y;
        if (still >= 3 || performance.now() - t0 > cap) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, capMs);
}

/** Roll to `y` in half-viewport steps so the lazy corridor inflates on the way. */
async function rollTo(page: Page, y: number): Promise<void> {
  await page.evaluate(async (target) => {
    const step = Math.max(300, window.innerHeight * 0.5);
    let at = window.scrollY;
    while (Math.abs(target - at) > step) {
      at += Math.sign(target - at) * step;
      window.scrollTo(0, at);
      await new Promise((r) => requestAnimationFrame(r));
    }
    window.scrollTo(0, target);
  }, y);
  await settleScroll(page);
}

/** The band runway's document top, or NaN when the band is not rendered. */
async function bandTop(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector<HTMLElement>(".svc-ring-runway");
    if (!el) return Number.NaN;
    return el.getBoundingClientRect().top + window.scrollY;
  });
}

/**
 * Seat the band at fraction `p` of its own scroll (0 = its top at the
 * frame's top, 1 = released). Converges on the runway's rect — the lazy
 * corridor and the ring's own mount grow the document under the first
 * roll, so one solved `y` lands short (the ADR-095 harness law).
 */
async function seatBand(page: Page, p: number): Promise<void> {
  for (let pass = 0; pass < 5; pass += 1) {
    const target = await page.evaluate((frac) => {
      const el = document.querySelector<HTMLElement>(".svc-ring-runway");
      if (!el) return Number.NaN;
      const r = el.getBoundingClientRect();
      const vh = document.documentElement.clientHeight;
      return Math.round(r.top + window.scrollY + frac * (r.height - vh));
    }, p);
    if (Number.isNaN(target)) return;
    await rollTo(page, target);
    await page.waitForTimeout(250);
    const landed = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>(".svc-ring-runway");
      if (!el) return Number.NaN;
      const r = el.getBoundingClientRect();
      const vh = document.documentElement.clientHeight;
      return -r.top / Math.max(1, r.height - vh);
    });
    if (Math.abs(landed - p) < 0.02) return;
  }
}

function readBand(page: Page) {
  return page.evaluate(() => {
    /* ⚠ A VIEWPORT UNIT IS A STRING UNTIL SOMETHING LAYS IT OUT. `svh`/`lvh`/
       `dvh` cannot be read off a computed custom property, so they are spent
       as a height on a throwaway element — the same idiom `mobile-section-
       seams` uses for the chrome bands' `calc()`. */
    const probeUnit = (unit: "svh" | "lvh" | "dvh") => {
      const el = document.createElement("div");
      el.style.cssText = `position:absolute;visibility:hidden;height:100${unit}`;
      document.body.appendChild(el);
      const h = el.getBoundingClientRect().height;
      el.remove();
      return h;
    };
    const doc = document.documentElement;
    const band = document.querySelector<HTMLElement>(".svc-ring-band");
    const canvas = document.querySelector<HTMLElement>(".home-v2-stage__canvas");
    const stage = document.querySelector<HTMLElement>(".services-stage");
    const signal = document.querySelector<HTMLElement>(".home-v2-mobile-signal");
    const hits = Array.from(document.querySelectorAll<HTMLElement>(".svc-ring-hits__hit")).map(
      (h) => {
        const b = h.getBoundingClientRect();
        return {
          x: b.left,
          y: b.top,
          w: b.width,
          h: b.height,
          front: h.classList.contains("svc-ring-hits__hit--front"),
          cta: h.classList.contains("svc-ring-hits__hit--cta"),
          label: h.getAttribute("aria-label") ?? "",
        };
      }
    );
    return {
      vw: doc.clientWidth,
      vh: doc.clientHeight,
      ambient: doc.getAttribute("data-services-ambient"),
      exit: doc.getAttribute("data-corridor-exit"),
      canvasPosition: canvas ? getComputedStyle(canvas).position : null,
      canvasBottom: canvas ? canvas.getBoundingClientRect().bottom : Number.NaN,
      /* ⚠ THE THREE VIEWPORT UNITS, RECORDED RATHER THAN ASSUMED (ADR-082
         U26). On iOS Safari `svh` is the SMALL viewport and `lvh` the large,
         and every backdrop here was sized in `svh` while the fixed chrome is
         pinned to the real floor — so a ~99px strip of the page painted
         through below the corridor's own void backing. In Chromium all three
         collapse to one number, which is exactly why no project in this repo
         could see it; printing them is what makes a future reader check on a
         device instead of trusting a green run. */
      svh: probeUnit("svh"),
      lvh: probeUnit("lvh"),
      dvh: probeUnit("dvh"),
      ringAttr: stage?.getAttribute("data-card-ring-mobile") ?? null,
      step: stage?.getAttribute("data-active-step") ?? null,
      bandPosition: band ? getComputedStyle(band).position : null,
      bandTop: band ? band.getBoundingClientRect().top : Number.NaN,
      bandHeight: band ? band.getBoundingClientRect().height : Number.NaN,
      signalInert: signal ? signal.hasAttribute("inert") : null,
      drawerShims: document.querySelectorAll(".svc-ring-hits__hit--drawer, .svc-ring-hits__close")
        .length,
      hits,
      // ADR-109: the band's three rows and the sheet.
      plates: document.querySelectorAll(".svc-plate").length,
      plateOpen: stage?.getAttribute("data-plate-open") ?? null,
      title: rect(".svc-ring-band .services-masthead__title"),
      seat: rect(".svc-ring-seat"),
      intro: rect(".svc-ring-band .services-masthead__intro"),
      introText:
        document.querySelector(".svc-ring-band .services-masthead__intro")?.textContent?.trim() ??
        "",
      sheetNodes: document.querySelectorAll(".svc-sheet").length,
      // ADR-110: the turned card's state, all on the hit layer.
      back: (() => {
        const front = document.querySelector<HTMLElement>(".svc-ring-hits__hit--front");
        const cta = document.querySelector<HTMLAnchorElement>(".svc-ring-hits__hit--cta");
        const close = document.querySelector<HTMLElement>(".svc-ring-hits__hit--close");
        const box = (el: Element | null) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.left, y: r.top, w: r.width, h: r.height };
        };
        return {
          expanded: front?.getAttribute("aria-expanded") ?? null,
          turned: front?.dataset.back === "1",
          label: front?.getAttribute("aria-label") ?? "",
          cta: box(cta),
          ctaHref: cta?.getAttribute("href") ?? null,
          close: box(close),
          sr: document.querySelector(".svc-ring-hits__sr")?.textContent ?? "",
        };
      })(),
    };
    function rect(sel: string) {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    }
  });
}

/** Tap the front card and wait out the turn (~450 ms to settle). */
async function openBack(page: Page) {
  const s = await readBand(page);
  const front = s.hits.find((h) => h.front);
  expect(front, "no front-card button").toBeTruthy();
  await page.mouse.click(front!.x + front!.w / 2, front!.y + front!.h / 2);
  await page.waitForTimeout(900);
  return front!;
}

/* ── ADR-115: the about band ──────────────────────────────────────────── */

/** Seat the about band at progress `p` (0 = pinned at the weld, 1 = the
 *  runway's end). Returns the LANDING — a stop near a snap seat is pulled
 *  onto it, and that pull is the page's own behaviour, not a miss. */
async function seatAboutBand(page: Page, p: number): Promise<number> {
  let landed = Number.NaN;
  for (let pass = 0; pass < 4; pass += 1) {
    const target = await page.evaluate((prog) => {
      const el = document.getElementById("about")!;
      const r = el.getBoundingClientRect();
      const vh = document.documentElement.clientHeight;
      return Math.round(r.top + window.scrollY + prog * (r.height - vh));
    }, p);
    await rollTo(page, target);
    await page.waitForTimeout(350);
    landed = await page.evaluate(
      () =>
        Number.parseFloat(
          document.getElementById("about")!.style.getPropertyValue("--about-band-p")
        ) || 0
    );
    if (Math.abs(landed - p) < 0.008) return landed;
  }
  return landed;
}

function readAbout(page: Page) {
  return page.evaluate(() => {
    const about = document.getElementById("about");
    const band = about?.querySelector<HTMLElement>(":scope > .voidwalker") ?? null;
    const slot = about?.querySelector<HTMLElement>(".voidwalker__orbit__portrait") ?? null;
    const img = slot?.querySelector<HTMLImageElement>("img") ?? null;
    const name = about?.querySelector<HTMLElement>(".voidwalker__name") ?? null;
    const copy = about?.querySelector<HTMLElement>(".voidwalker__copy > .voidwalker__bio") ?? null;
    const rest = about?.querySelector<HTMLElement>(".voidwalker__rest") ?? null;
    const restBio = about?.querySelector<HTMLElement>(".voidwalker__rest .voidwalker__bio") ?? null;
    const more = about?.querySelector<HTMLElement>(".voidwalker__more") ?? null;
    const cluster = about?.querySelector<HTMLElement>(".voidwalker__orbit__svg") ?? null;
    const rect = (el: HTMLElement | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    };
    const vis = (el: HTMLElement | null) => (el ? getComputedStyle(el).visibility : null);
    return {
      p: Number.parseFloat(about?.style.getPropertyValue("--about-band-p") ?? "NaN"),
      band: about?.getAttribute("data-about-band") ?? null,
      deck: about?.getAttribute("data-about-deck") ?? null,
      vwName: about?.getAttribute("data-vw-name") ?? null,
      vwCopy: about?.getAttribute("data-vw-copy") ?? null,
      slotState: about?.getAttribute("data-about-slot") ?? null,
      portrait: about?.getAttribute("data-about-portrait") ?? null,
      aboutTop: about ? about.getBoundingClientRect().top : Number.NaN,
      bandPosition: band ? getComputedStyle(band).position : null,
      bandTop: band ? band.getBoundingClientRect().top : Number.NaN,
      bandHeight: band ? band.getBoundingClientRect().height : Number.NaN,
      bioOpen: band?.getAttribute("data-bio-open") ?? null,
      slot: rect(slot),
      imgVisible: vis(img),
      imgSrc: img?.currentSrc ?? "",
      nameVisible: vis(name),
      nameText: name?.textContent?.trim() ?? "",
      copyVisible: vis(copy),
      copyText: copy?.textContent?.trim() ?? "",
      rest: rect(rest),
      restBioVisible: vis(restBio),
      more: rect(more),
      moreExpanded: more?.getAttribute("aria-expanded") ?? null,
      clusterDisplay: cluster ? getComputedStyle(cluster).display : null,
      leaves: Array.from(
        document.querySelectorAll<HTMLElement>(".voidwalker__decode__line")
      ).filter((l) => !l.hidden).length,
      ringLive: document.documentElement.getAttribute("data-card-ring-live"),
      vh: document.documentElement.clientHeight,
    };
  });
}

async function boot(page: Page, theme: "dark" | "light" = "dark") {
  await page.goto(theme === "light" ? "/?theme=light" : "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".services-stage", { timeout: 60_000 });
  // Warm the lazy corridor so the document has its real height before a seat.
  await rollTo(page, await bandTop(page));
  await page.waitForTimeout(600);
}

test.describe("the ring on phones (ADR-108)", () => {
  test.skip(NOT_PHONE, "Chromium phone projects only");

  for (const theme of ["dark", "light"] as const) {
    test(`the band pins under a fixed canvas and publishes the cards — ${theme}`, async ({
      page,
    }) => {
      await boot(page, theme);
      expect(await bandTop(page), "the seat band is not rendered on the ring rung").not.toBeNaN();

      await seatBand(page, BEAT[1]!);
      const s = await readBand(page);

      // The stage declares the rung it took, and the corridor's exit hook
      // took the same one: the ambient hold is on and its canvas is FIXED
      // behind the station (that is what puts the parked mark, and the ring
      // drawn round it, behind this band).
      expect(s.ringAttr).toBe("on");
      expect(s.ambient, "the ambient hold never engaged on the phone").toBe("true");
      expect(s.exit).toBe("true");
      expect(s.canvasPosition, "the corridor canvas is not fixed behind #services").toBe("fixed");

      // The band is the ring's seat: sticky, pinned at the frame's top, one
      // viewport tall, and the step clock is running off its scroll.
      expect(s.bandPosition).toBe("sticky");
      expect(Math.abs(s.bandTop)).toBeLessThanOrEqual(1);
      expect(Math.abs(s.bandHeight - s.vh)).toBeLessThanOrEqual(1);

      /* ⚠ THE CANVAS COVERS THE LARGE VIEWPORT, NOT THE SMALL ONE (ADR-082
         U26). It is the page's only opaque backing through this beat, and at
         `100svh` it stopped ~99px short on iOS Safari — the strip the owner
         read as "a pane at the bottom". This assertion is VACUOUS HERE and
         says so: Chromium collapses svh/lvh/dvh, so `lvh === vh` and the only
         real proof is a device. It exists to fail if the height is ever
         re-pinned to the small viewport. */
      expect(
        s.canvasBottom,
        `the corridor canvas stops short of the large viewport ` +
          `(bottom ${s.canvasBottom}, lvh ${s.lvh}; svh ${s.svh}, dvh ${s.dvh} — ` +
          `equal in Chromium, so verify on a real iPhone)`
      ).toBeGreaterThanOrEqual(s.lvh - 1);
      expect(Number(s.step)).toBeGreaterThanOrEqual(1);

      // The ring projected: the visible cards published their rects and the
      // hit layer shimmed each one. The front card is ONE button (no CTA
      // shim — the `card` face has no CTA box) and there is no drawer.
      expect(s.hits.length, "no card rects published — the ring did not mount").toBe(3);
      expect(s.hits.filter((h) => h.cta)).toHaveLength(0);
      expect(s.drawerShims).toBe(0);
      const front = s.hits.find((h) => h.front);
      expect(front, "no front-card button").toBeTruthy();
      // Touch floor on every target, and the front card sized to the
      // viewport: `ringMobileFrontWidthPx` asks min(260, 0.66·vw) and the
      // ring's pose at any one beat lands within a few percent of it.
      for (const h of s.hits) {
        expect(h.w, `${h.label} narrower than the 44px touch floor`).toBeGreaterThanOrEqual(44);
        expect(h.h, `${h.label} shorter than the 44px touch floor`).toBeGreaterThanOrEqual(44);
      }
      // ADR-109: the seat bounds it too — the card's height may take
      // `RING_MOBILE_SEAT_FILL` of the free band between the two texts.
      expect(s.seat, "no seat row in the band").toBeTruthy();
      const ask = Math.min(260, s.vw * 0.66, s.seat!.h * RING_MOBILE_SEAT_FILL * (420 / 680));
      expect(front!.w).toBeGreaterThan(ask * 0.85);
      expect(front!.w).toBeLessThan(ask * 1.15);
      // The projected rect carries the front pose's tilt; 6 % is that.
      expect(front!.h).toBeLessThan(s.seat!.h * RING_MOBILE_SEAT_FILL * 1.06);
      // Inside the frame — the first cut solved the scale at the mark's
      // depth and the card spilled past both edges of the phone.
      expect(front!.x).toBeGreaterThanOrEqual(-1);
      expect(front!.x + front!.w).toBeLessThanOrEqual(s.vw + 1);
      expect(front!.y).toBeGreaterThanOrEqual(0);
      expect(front!.y + front!.h).toBeLessThanOrEqual(s.vh);

      // The epilogue signal is a fixed painter and this band is deep inside
      // #services: it is dead and inert here (`mobile-sections.md` §2).
      expect(s.signalInert).toBe(true);

      // ── THE BAND IS THE COMPOSITION (ADR-109) ──
      // Title above the cards, the paragraph below, all three inside the
      // frame and clear of the HUD's two 56px chrome bands; the masthead's
      // typewriter is desktop-only, so the paragraph is resolved text.
      expect(s.title, "the masthead's title is not in the band").toBeTruthy();
      expect(s.intro, "the masthead's paragraph is not in the band").toBeTruthy();
      expect(s.title!.y).toBeGreaterThanOrEqual(56);
      expect(s.title!.y + s.title!.h).toBeLessThanOrEqual(front!.y + 1);
      expect(front!.y + front!.h).toBeLessThanOrEqual(s.intro!.y + 1);
      expect(s.intro!.y + s.intro!.h).toBeLessThanOrEqual(s.vh - 56 + 1);
      expect(s.introText.length).toBeGreaterThan(80);
      // The seat is the band between the two texts, and the card sits on it.
      expect(s.seat!.y).toBeGreaterThanOrEqual(s.title!.y + s.title!.h - 1);
      expect(s.seat!.y + s.seat!.h).toBeLessThanOrEqual(s.intro!.y + 1);
      const seatCy = s.seat!.y + s.seat!.h / 2;
      expect(Math.abs(front!.y + front!.h / 2 - seatCy)).toBeLessThan(s.seat!.h * 0.08);
      // No plate accordion on this rung: the cards are the offer, the sheet
      // the readable version — and the four plate photographs stay unfetched.
      expect(s.plates, "the plate accordion rendered on the ring rung").toBe(0);
      // Nothing DOM rises on this rung (ADR-110): no sheet, the card shut,
      // no back shims.
      expect(s.sheetNodes).toBe(0);
      expect(s.back.expanded).toBe("false");
      expect(s.back.turned).toBe(false);
      expect(s.back.cta).toBeNull();
      expect(s.back.close).toBeNull();
      expect(s.plateOpen).toBeNull();
    });
  }

  test("the ring rests off-stage before the band and leaves with it", async ({ page }) => {
    await boot(page);
    const top = await bandTop(page);
    const vh = await page.evaluate(() => document.documentElement.clientHeight);

    // Half a viewport ABOVE the band: the masthead beat — no card is on
    // stage, so nothing publishes a rect and nothing takes a tap.
    await rollTo(page, Math.round(top - vh * 0.5));
    await page.waitForTimeout(400);
    let s = await readBand(page);
    expect(s.hits, "cards published before the band arrived").toHaveLength(0);

    // Past the release: the ring has left with its stage and the next
    // station is the page — nothing shims over it.
    await seatBand(page, 1);
    await rollTo(page, Math.round((await bandTop(page)) + vh * 3.4));
    await page.waitForTimeout(400);
    s = await readBand(page);
    expect(s.hits, "cards still published after the band released").toHaveLength(0);
  });

  for (const theme of ["dark", "light"] as const) {
    test(`tapping the front card turns it over, and ✕ turns it back — ${theme}`, async ({
      page,
    }) => {
      await boot(page, theme);
      await seatBand(page, 0.55);
      const before = await readBand(page);
      const rest = before.hits.find((h) => h.front)!;
      const serviceId = await page.evaluate(
        () =>
          document.querySelector<HTMLElement>(".svc-ring-hits__hit--front")?.dataset.service ?? null
      );
      expect(serviceId, "the front button names no service").toBeTruthy();

      await openBack(page);
      const s = await readBand(page);
      const front = s.hits.find((h) => h.front);
      expect(front, "the front card left while it turned").toBeTruthy();
      // The card has turned: the face is the way back, the back's ✕ and CTA
      // are shimmed onto the card's own rect, and its copy is readable.
      expect(s.back.expanded).toBe("true");
      expect(s.back.turned).toBe(true);
      expect(s.back.label).toMatch(/^Close /);
      expect(s.plateOpen).toBe("1");
      expect(s.sheetNodes).toBe(0);
      expect(s.back.ctaHref).toBe("#contact");
      const inside = (b: { x: number; y: number; w: number; h: number }) =>
        b.x >= front!.x - 1 &&
        b.x + b.w <= front!.x + front!.w + 1 &&
        b.y >= front!.y - 1 &&
        b.y + b.h <= front!.y + front!.h + 1;
      expect(s.back.cta, "no CTA shim on the turned card").toBeTruthy();
      expect(inside(s.back.cta!)).toBe(true);
      expect(s.back.cta!.h).toBeGreaterThanOrEqual(24);
      expect(s.back.close, "no ✕ shim on the turned card").toBeTruthy();
      expect(s.back.close!.w).toBeGreaterThanOrEqual(44);
      expect(s.back.close!.h).toBeGreaterThanOrEqual(44);
      const cx = s.back.close!.x + s.back.close!.w / 2;
      const cy = s.back.close!.y + s.back.close!.h / 2;
      expect(cx).toBeGreaterThan(front!.x + front!.w * 0.7);
      expect(cy).toBeLessThan(front!.y + front!.h * 0.2);
      expect(s.back.sr).toContain("Duration:");
      expect(s.back.sr).toContain("Leaves with:");
      // The card keeps its size and its seat when it turns (owner): the
      // projected rect is the same box mirrored about its centre. ⚠ The
      // resting rect carries the front pose's TILT (the bias yaw/pitch
      // foreshortens it ~5 % taller), and the turn eases that bias out — so
      // the bound is proportional, not a boost detector at 1px.
      expect(Math.abs(front!.w - rest.w) / rest.w).toBeLessThan(0.06);
      expect(Math.abs(front!.h - rest.h) / rest.h).toBeLessThan(0.08);
      expect(Math.abs(front!.y + front!.h / 2 - (rest.y + rest.h / 2))).toBeLessThan(8);
      expect(front!.y).toBeGreaterThanOrEqual(56 - 1);
      expect(front!.y + front!.h).toBeLessThanOrEqual(s.vh - 56 + 1);

      // The ✕ turns it back; the step is untouched. A coordinate tap, not
      // `locator.click()` — Playwright's click scrolls its target "into
      // view" first, and a nudge of the band is exactly what this case must
      // not do (it flaked once as step 2 → 0).
      await page.mouse.click(
        s.back.close!.x + s.back.close!.w / 2,
        s.back.close!.y + s.back.close!.h / 2
      );
      await page.waitForTimeout(700);
      const after = await readBand(page);
      expect(after.back.expanded).toBe("false");
      expect(after.back.turned).toBe(false);
      expect(after.back.cta).toBeNull();
      expect(after.plateOpen).toBeNull();
      expect(after.step).toBe(before.step);
    });
  }

  test("the face, Escape and a beat of scroll turn the card back; a nudge does not", async ({
    page,
  }) => {
    await boot(page);
    await seatBand(page, 0.55);

    // Tapping the turned face turns it back.
    const front = await openBack(page);
    expect((await readBand(page)).back.turned).toBe(true);
    await page.mouse.click(front.x + front.w / 2, front.y + front.h / 2);
    await page.waitForTimeout(700);
    expect((await readBand(page)).back.expanded).toBe("false");

    await openBack(page);
    expect((await readBand(page)).back.turned).toBe(true);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(700);
    expect((await readBand(page)).back.expanded).toBe("false");

    // The step, not 35px of scroll: the card stays turned through a nudge
    // inside its beat and turns back once the ring has moved on.
    // ⚠ ADR-115: the band's last 27 % is the EXIT now (the deck stacks and
    // the hit layer retires), so the beat change is read from one card's
    // dwell to another's — both before the leave.
    await seatBand(page, BEAT[1]!);
    await openBack(page);
    const openedStep = (await readBand(page)).step;
    await page.evaluate(() => window.scrollBy(0, 60));
    await page.waitForTimeout(400);
    let r = await readBand(page);
    expect(r.step).toBe(openedStep);
    expect(r.back.expanded, "a nudge inside the beat turned the card back").toBe("true");
    await seatBand(page, BEAT[3]!);
    await page.waitForTimeout(700);
    r = await readBand(page);
    expect(r.step).not.toBe(openedStep);
    expect(r.back.expanded, "the ring turned and the card stayed open").toBe("false");
  });

  /* ── ADR-115: the exit stacks the deck, and the copy un-types ─────────── */
  test("the band's exit un-types the copy and retires the cards' targets (ADR-115)", async ({
    page,
  }) => {
    await boot(page);
    // Inside the beats: the copy stands resolved, the front card is a target.
    await seatBand(page, BEAT[3]!);
    let s = await readBand(page);
    expect(s.hits.length).toBe(3);
    const untypeOf = () =>
      page.evaluate(() => {
        const head = document.querySelector<HTMLElement>(".svc-ring-band .services-masthead");
        const stage = document.querySelector<HTMLElement>(".services-stage");
        const leaves = Array.from(
          document.querySelectorAll<HTMLElement>(".svc-ring-band__decode__line")
        ).filter((l) => !l.hidden);
        return {
          stamp: head?.getAttribute("data-untype") ?? null,
          exit: Number.parseFloat(stage?.style.getPropertyValue("--svc-exit") ?? "0") || 0,
          leaves: leaves.length,
          leafText: leaves.map((l) => l.textContent ?? "").join("|"),
          titleVisible: head
            ? getComputedStyle(
                head.querySelector<HTMLElement>(".services-masthead__title-line > span")!
              ).visibility
            : null,
        };
      });
    let u = await untypeOf();
    expect(u.exit).toBe(0);
    expect(u.stamp).toBeNull();
    expect(u.titleVisible).toBe("visible");

    // A third of the way into the exit: the exit clock is live, the real
    // copy is hidden under the leaves, which are mid-decode (some glyphs
    // still standing, some gone), and the cards have stopped being targets
    // — the deck is stacking and nothing may take a tap.
    const L = RING_MOBILE_LEAVE_START;
    await seatBand(page, L + (1 - L) * 0.35);
    u = await untypeOf();
    s = await readBand(page);
    expect(u.exit).toBeGreaterThan(0.2);
    expect(u.exit).toBeLessThan(0.6);
    expect(u.stamp).toBe("live");
    expect(u.titleVisible).toBe("hidden");
    expect(u.leaves, "no decode leaves painting mid-exit").toBeGreaterThan(0);
    expect(u.leafText.replace(/[\s|]/g, "").length).toBeGreaterThan(0);
    expect(s.hits, "the cards still take taps while the deck stacks").toHaveLength(0);
    expect(s.plateOpen).toBeNull();

    // The exit spent: the copy is gone (blank leaves, stamp `gone`), still
    // hidden, and scrolling back re-types it — the decode is scrubbed.
    await seatBand(page, 0.995);
    u = await untypeOf();
    expect(u.exit).toBeGreaterThan(0.9);
    expect(u.stamp).toBe("gone");
    expect(u.leafText.replace(/[\s|]/g, "")).toBe("");
    await seatBand(page, BEAT[3]!);
    u = await untypeOf();
    expect(u.stamp).toBeNull();
    expect(u.titleVisible).toBe("visible");
    expect((await readBand(page)).hits.length).toBe(3);
  });

  test("tapping a side card rolls the band to that card's beat", async ({ page }) => {
    await boot(page);
    await seatBand(page, 0.55);
    const s = await readBand(page);
    const side = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>(
        ".svc-ring-hits__hit:not(.svc-ring-hits__hit--front)"
      );
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, service: el.dataset.service };
    });
    expect(side, "no side-card button").toBeTruthy();
    const idx = SERVICES.findIndex((sv) => sv.id === side!.service);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(String(idx)).not.toBe(s.step);

    await page.mouse.click(side!.x, side!.y);
    await settleScroll(page, 2400);
    await page.waitForTimeout(300);
    const r = await readBand(page);
    // The band is still pinned (the roll stayed on its own runway) and the
    // step is the tapped card's: it is front now.
    expect(Math.abs(r.bandTop)).toBeLessThanOrEqual(1);
    expect(r.step).toBe(String(idx));
    expect(
      await page.evaluate(
        () => document.querySelector<HTMLElement>(".svc-ring-hits__hit--front")?.dataset.service
      )
    ).toBe(side!.service);
  });

  test("#voidwalker still ends the ambient hold", async ({ page }) => {
    await boot(page);
    await seatBand(page, 0.4);
    expect((await readBand(page)).ambient).toBe("true");

    const vwTop = await page.evaluate(() => {
      const el = document.getElementById("voidwalker");
      return el ? el.getBoundingClientRect().top + window.scrollY : Number.NaN;
    });
    expect(vwTop).not.toBeNaN();
    const vh = await page.evaluate(() => document.documentElement.clientHeight);
    await rollTo(page, Math.round(vwTop + vh * 0.6));
    await page.waitForTimeout(400);
    const s = await readBand(page);
    expect(s.ambient, "the ambient hold outlived the kill edge").not.toBe("true");
    expect(s.canvasPosition, "the canvas is still fixed past #voidwalker").not.toBe("fixed");
  });

  test("reduced motion keeps the old phone page: no band, no dock", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 60_000 });
    const svcTop = await page.evaluate(
      () => document.getElementById("services")!.getBoundingClientRect().top + window.scrollY
    );
    await rollTo(page, svcTop);
    await page.waitForTimeout(600);
    const s = await readBand(page);
    expect(s.ringAttr).toBeNull();
    expect(await bandTop(page)).toBeNaN();
    expect(s.hits).toHaveLength(0);
    expect(s.ambient).not.toBe("true");
    expect(s.canvasPosition).not.toBe("fixed");
    // ADR-115: no about band either — the static about, minus the cluster.
    const a = await readAbout(page);
    expect(a.band).toBeNull();
    expect(a.clusterDisplay).toBe("none");
  });

  /* ── ADR-115: THE ABOUT BAND ───────────────────────────────────────────
     The deck flips to the portrait on `#about`'s own clock, the name and the
     first paragraph decode in, the band holds at a reading seat, and at the
     runway's end the WebGL portrait hands over to a DOM image of the same
     bake. Everything below is read off the writer's stamps and the band's
     own boxes; the pixels are the probe's (`scripts/probe-mobile-deck.mjs`). */
  for (const theme of ["dark", "light"] as const) {
    test(`#about is a band welded to the ring's exit; the deck flips and hands over to the DOM — ${theme}`, async ({
      page,
    }) => {
      await boot(page, theme);
      // The weld: the band pins on the frame the ring band's travel ends.
      await seatBand(page, 1);
      let a = await readAbout(page);
      expect(a.band, "the about band did not engage on the ring rung").toBe("on");
      expect(a.bandPosition).toBe("sticky");
      expect(
        Math.abs(a.aboutTop),
        "the about band is not welded to the ring band's release"
      ).toBeLessThanOrEqual(2);
      expect(Math.abs(a.bandTop)).toBeLessThanOrEqual(2);
      expect(Math.abs(a.bandHeight - a.vh)).toBeLessThanOrEqual(1);
      expect(a.clusterDisplay, "the orbit cluster is still drawn on the phone").toBe("none");
      expect(a.ringLive, "the phone ring did not declare itself live").toBe("on");
      // Before the flip has landed: nothing decoded, the DOM portrait hidden
      // (the WebGL deck owns the seat), the seat measured for it.
      expect(a.vwName).toBe("pending");
      expect(a.vwCopy).toBe("pending");
      expect(a.deck).toBe("live");
      expect(a.imgVisible).toBe("hidden");
      expect(a.nameVisible).toBe("hidden");
      expect(a.slot, "no seat for the deck").toBeTruthy();
      expect(a.slot!.h).toBeGreaterThanOrEqual(140);

      // A stop inside the flip completes it: the flip's-end seat.
      const flipEnd = await seatAboutBand(page, 0.11);
      expect(flipEnd).toBeGreaterThan(0.22);
      expect(flipEnd).toBeLessThan(0.3);
      a = await readAbout(page);
      expect(a.vwName, "the name decodes on the flip's-end seat").toBe("pending");

      // The reading seat: everything resolved, the real text shown, no leaf.
      const read = await seatAboutBand(page, 0.62);
      expect(Math.abs(read - 0.62)).toBeLessThan(0.01);
      a = await readAbout(page);
      expect(a.vwName).toBe("1");
      expect(a.vwCopy).toBe("1");
      expect(a.nameVisible).toBe("visible");
      expect(a.nameText.toLowerCase()).toContain("vince buyssens");
      expect(a.copyVisible).toBe("visible");
      expect(a.copyText.length).toBeGreaterThan(60);
      expect(a.leaves).toBe(0);
      expect(a.deck).toBe("live");
      expect(a.imgVisible).toBe("hidden");
      expect(a.more, "no chevron").toBeTruthy();
      expect(a.more!.w).toBeGreaterThanOrEqual(44);
      expect(a.more!.h).toBeGreaterThanOrEqual(44);
      expect(a.more!.y + a.more!.h).toBeLessThanOrEqual(a.vh - 56 + 1);
      // The band's rows, in order and clear of the chrome bands.
      expect(a.slot!.y).toBeGreaterThanOrEqual(56);
      expect(a.slot!.y + a.slot!.h).toBeLessThanOrEqual(a.vh - 56);
      const nameBox = await page.evaluate(() => {
        const r = document.querySelector(".voidwalker__name")!.getBoundingClientRect();
        return { y: r.top, b: r.bottom };
      });
      expect(nameBox.y).toBeGreaterThanOrEqual(56);
      expect(nameBox.b).toBeLessThanOrEqual(a.slot!.y + 1);
      const copyBox = await page.evaluate(() => {
        const r = document
          .querySelector(".voidwalker__copy > .voidwalker__bio")!
          .getBoundingClientRect();
        return { y: r.top, b: r.bottom };
      });
      expect(copyBox.y).toBeGreaterThanOrEqual(a.slot!.y + a.slot!.h - 1);
      expect(copyBox.b).toBeLessThanOrEqual(a.more!.y + 1);

      // The handover: at the runway's end the DOM image (the bake, a blob)
      // shows and the deck is done; back on the seat the deck owns it again.
      await seatAboutBand(page, 1);
      a = await readAbout(page);
      expect(a.deck).toBe("done");
      expect(a.imgVisible).toBe("visible");
      expect(a.portrait, "the DOM portrait is the photo, not the bake").toBe("baked");
      expect(a.imgSrc.startsWith("blob:"), `the picture's source is ${a.imgSrc.slice(0, 30)}`).toBe(
        true
      );
      await seatAboutBand(page, 0.62);
      a = await readAbout(page);
      expect(a.deck).toBe("live");
      expect(a.imgVisible).toBe("hidden");
    });
  }

  test("the chevron unfolds the rest of the bio and the seat gives up its height (ADR-115)", async ({
    page,
  }) => {
    await boot(page);
    await seatBand(page, 1);
    await seatAboutBand(page, 0.62);
    const closed = await readAbout(page);
    expect(closed.moreExpanded).toBe("false");
    expect(closed.restBioVisible).toBe("hidden");
    expect(closed.rest!.h).toBeLessThan(2);

    await page.mouse.click(
      closed.more!.x + closed.more!.w / 2,
      closed.more!.y + closed.more!.h / 2
    );
    await page.waitForTimeout(800);
    const open = await readAbout(page);
    expect(open.bioOpen).toBe("1");
    expect(open.moreExpanded).toBe("true");
    expect(open.rest!.h, "the rest did not unfold").toBeGreaterThan(120);
    expect(open.restBioVisible).toBe("visible");
    // The copy rose and the seat paid for it; on this shape the portrait is
    // still a portrait (over the floor) — a shorter phone hides it instead.
    expect(open.slot!.h).toBeLessThan(closed.slot!.h);
    if (open.slotState !== "hidden") {
      expect(open.slot!.h).toBeGreaterThanOrEqual(140);
      expect(open.imgVisible === "hidden" || open.deck === "live").toBe(true);
    }
    // Nothing runs under the settings row.
    expect(open.more!.y + open.more!.h).toBeLessThanOrEqual(open.vh - 56 + 1);

    await page.mouse.click(open.more!.x + open.more!.w / 2, open.more!.y + open.more!.h / 2);
    await page.waitForTimeout(800);
    const again = await readAbout(page);
    expect(again.bioOpen).toBeNull();
    expect(again.moreExpanded).toBe("false");
    expect(Math.abs(again.slot!.h - closed.slot!.h)).toBeLessThanOrEqual(2);
  });
});
