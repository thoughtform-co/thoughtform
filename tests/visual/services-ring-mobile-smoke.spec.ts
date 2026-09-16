import { expect, test, type Page } from "@playwright/test";

/**
 * THE RING ON PHONES (ADR-108).
 *
 * At `SERVICES_RING_MOBILE_MEDIA` the corridor's card ring — the desktop
 * offer beat's WebGL carousel around the parked mark — mounts on a phone
 * too: `useCorridorExitScroll` lets the ambient hold engage (the corridor's
 * canvas goes FIXED behind `#services`), `ServicesStage` renders a sticky
 * SEAT BAND between the masthead and the plate accordion whose scroll is
 * the ring's clock, and `ServicesRingHitAreas` shims one button per visible
 * card that scrolls the reader to that service's plate. The plates stay the
 * offer; the ring is the visual.
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
      const ask = Math.min(260, s.vw * 0.66);
      expect(front!.w).toBeGreaterThan(ask * 0.85);
      expect(front!.w).toBeLessThan(ask * 1.15);
      // Inside the frame — the first cut solved the scale at the mark's
      // depth and the card spilled past both edges of the phone.
      expect(front!.x).toBeGreaterThanOrEqual(-1);
      expect(front!.x + front!.w).toBeLessThanOrEqual(s.vw + 1);
      expect(front!.y).toBeGreaterThanOrEqual(0);
      expect(front!.y + front!.h).toBeLessThanOrEqual(s.vh);

      // The epilogue signal is a fixed painter and this band is deep inside
      // #services: it is dead and inert here (`mobile-sections.md` §2).
      expect(s.signalInert).toBe(true);
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

    // Past the release: the ring has left with its stage and the plates
    // below are the offer — nothing shims over them.
    await seatBand(page, 1);
    await rollTo(page, Math.round((await bandTop(page)) + vh * 3.4));
    await page.waitForTimeout(400);
    s = await readBand(page);
    expect(s.hits, "cards still published after the band released").toHaveLength(0);
  });

  test("tapping a card scrolls to its plate", async ({ page }) => {
    await boot(page);
    await seatBand(page, 0.4);
    const s = await readBand(page);
    const front = s.hits.find((h) => h.front);
    expect(front).toBeTruthy();

    const serviceId = await page.evaluate(
      () =>
        document.querySelector<HTMLElement>(".svc-ring-hits__hit--front")?.dataset.service ?? null
    );
    expect(serviceId, "the front button names no service").toBeTruthy();

    await page.mouse.click(front!.x + front!.w / 2, front!.y + front!.h / 2);
    await settleScroll(page, 2400);
    await page.waitForTimeout(200);

    // The plate the button named lands in the frame's top band: the reader
    // asked for a service and got its offer, not the band it was looking at.
    const landed = await page.evaluate((id) => {
      const plate = document.querySelector<HTMLElement>(`.svc-plate[data-service="${id}"]`);
      return plate
        ? plate.getBoundingClientRect().top / document.documentElement.clientHeight
        : Number.NaN;
    }, serviceId);
    expect(landed, `no plate for ${serviceId}`).not.toBeNaN();
    expect(landed).toBeGreaterThanOrEqual(-0.02);
    expect(landed).toBeLessThanOrEqual(0.4);
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
