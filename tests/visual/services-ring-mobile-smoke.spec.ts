import { expect, test, type Page } from "@playwright/test";

import { SERVICES } from "../../components/landing/home-v2/services/serviceData";
import { RING_MOBILE_SEAT_FILL, RING_MOBILE_SHEET_ROOM } from "../../lib/services-ring/ringMath";

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
 * below — the thesis beat's own order — and a tap on the front card raises
 * a SHEET from the band's foot with the drawer's copy as DOM type. The
 * plate accordion does not render on this rung.
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
      sheet: (() => {
        const el = document.querySelector<HTMLElement>(".svc-sheet");
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const close = el.querySelector<HTMLElement>(".svc-sheet__close")?.getBoundingClientRect();
        const cta = el.querySelector<HTMLAnchorElement>(".svc-sheet__cta");
        return {
          open: el.getAttribute("data-open") === "1",
          role: el.getAttribute("role"),
          inert: el.hasAttribute("inert"),
          visibility: getComputedStyle(el).visibility,
          service: el.getAttribute("data-service"),
          x: r.left,
          y: r.top,
          w: r.width,
          h: r.height,
          chip: el.querySelector(".svc-sheet__chip")?.textContent?.trim() ?? "",
          title: el.querySelector(".svc-sheet__title")?.textContent?.trim() ?? "",
          lines: el.querySelectorAll(".svc-sheet__list li").length,
          cells: el.querySelectorAll(".svc-sheet__spec dd").length,
          closeW: close?.width ?? 0,
          closeH: close?.height ?? 0,
          ctaHref: cta?.getAttribute("href") ?? null,
          ctaText: cta?.textContent?.trim() ?? "",
          backdrop: getComputedStyle(el).backdropFilter,
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

/** Tap the front card and wait out the sheet's 420ms rise. */
async function openSheet(page: Page) {
  const s = await readBand(page);
  const front = s.hits.find((h) => h.front);
  expect(front, "no front-card button").toBeTruthy();
  await page.mouse.click(front!.x + front!.w / 2, front!.y + front!.h / 2);
  await page.waitForTimeout(900);
  return front!;
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

      await seatBand(page, 0.4);
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
      // The sheet is mounted, shut and out of the tree.
      expect(s.sheet, "no sheet in the band").toBeTruthy();
      expect(s.sheet!.open).toBe(false);
      expect(s.sheet!.inert).toBe(true);
      expect(s.sheet!.visibility).toBe("hidden");
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
    test(`tapping the front card raises the sheet, and ✕ closes it — ${theme}`, async ({
      page,
    }) => {
      await boot(page, theme);
      await seatBand(page, 0.55);
      const before = await readBand(page);
      const serviceId = await page.evaluate(
        () =>
          document.querySelector<HTMLElement>(".svc-ring-hits__hit--front")?.dataset.service ?? null
      );
      expect(serviceId, "the front button names no service").toBeTruthy();
      const plateIdx = SERVICES.findIndex((sv) => sv.id === serviceId);
      expect(plateIdx).toBeGreaterThanOrEqual(0);

      await openSheet(page);
      const s = await readBand(page);
      const sheet = s.sheet!;
      // A dialog about the card that was tapped, with the drawer's copy as
      // DOM type: chip, title, the WHAT lines, the five HOW cells, the CTA.
      expect(sheet.open).toBe(true);
      expect(sheet.role).toBe("dialog");
      expect(sheet.inert).toBe(false);
      expect(sheet.visibility).toBe("visible");
      expect(sheet.service).toBe(serviceId);
      expect(s.plateOpen).toBe("1");
      expect(sheet.chip.length).toBeGreaterThan(0);
      expect(sheet.title.length).toBeGreaterThan(10);
      expect(sheet.lines).toBeGreaterThanOrEqual(3);
      expect(sheet.cells).toBe(5);
      expect(sheet.ctaHref).toBe("#contact");
      expect(sheet.ctaText).toMatch(/^(Book|Scope|Open) /);
      // Touch floor on the close control; no backdrop blur over the canvas
      // (ADR-107's phone ruling).
      expect(sheet.closeW).toBeGreaterThanOrEqual(44);
      expect(sheet.closeH).toBeGreaterThanOrEqual(44);
      expect(sheet.backdrop === "none" || sheet.backdrop === "").toBe(true);
      // Seated inside the frame, clear of the HUD's bottom chrome, and no
      // higher than the room law allows — the card above it is still a card.
      expect(sheet.x).toBeGreaterThanOrEqual(0);
      expect(sheet.x + sheet.w).toBeLessThanOrEqual(s.vw + 1);
      expect(sheet.y + sheet.h).toBeLessThanOrEqual(s.vh - 56 + 1);
      const roomFloor = before.seat!.y + RING_MOBILE_SHEET_ROOM * before.seat!.h;
      expect(sheet.y).toBeGreaterThanOrEqual(roomFloor - 2);
      // The ring answered: the front card fits the room above the sheet
      // (its bottom clear of the sheet's top), still inside the frame.
      const front = s.hits.find((h) => h.front);
      expect(front, "the front card left while the sheet opened").toBeTruthy();
      expect(front!.y + front!.h).toBeLessThanOrEqual(sheet.y + 1);
      expect(front!.y).toBeGreaterThanOrEqual(-1);
      expect(front!.w).toBeGreaterThanOrEqual(44);
      // The ✕ closes it and the step is untouched.
      await page.locator(".svc-sheet__close").click();
      await page.waitForTimeout(600);
      const after = await readBand(page);
      expect(after.sheet!.open).toBe(false);
      expect(after.sheet!.inert).toBe(true);
      expect(after.plateOpen).toBeNull();
      expect(after.step).toBe(before.step);
      // And the card returns to its seat.
      const back = after.hits.find((h) => h.front);
      expect(back).toBeTruthy();
      expect(Math.abs(back!.h - (before.hits.find((h) => h.front)?.h ?? 0))).toBeLessThan(12);
    });
  }

  test("Escape, a tap outside and a beat of scroll all close the sheet", async ({ page }) => {
    await boot(page);
    await seatBand(page, 0.55);

    await openSheet(page);
    expect((await readBand(page)).sheet!.open).toBe(true);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    expect((await readBand(page)).sheet!.open).toBe(false);

    await openSheet(page);
    expect((await readBand(page)).sheet!.open).toBe(true);
    // The band above the sheet is the scrim: a tap on the title closes it.
    const s = await readBand(page);
    await page.mouse.click(s.vw / 2, Math.max(60, s.title!.y - 4));
    await page.waitForTimeout(500);
    expect((await readBand(page)).sheet!.open).toBe(false);

    // The step, not 35px of scroll: the sheet survives a nudge inside its
    // beat and closes once the ring has turned to another card.
    await openSheet(page);
    const openedStep = (await readBand(page)).step;
    await page.evaluate(() => window.scrollBy(0, 60));
    await page.waitForTimeout(400);
    let r = await readBand(page);
    expect(r.step).toBe(openedStep);
    expect(r.sheet!.open, "a nudge inside the beat closed the sheet").toBe(true);
    await seatBand(page, 0.8);
    await page.waitForTimeout(500);
    r = await readBand(page);
    expect(r.step).not.toBe(openedStep);
    expect(r.sheet!.open, "the ring turned and the sheet stayed").toBe(false);
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
  });
});
