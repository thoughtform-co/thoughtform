import { expect, test, type Page } from "@playwright/test";

/**
 * THE PROOF STACK ON PHONES — one project, two sheets (ADR-107).
 *
 * At `PROOF_STACK_SPLIT_MEDIA` every project in the pile is TWO sticky
 * panels: its RECORD (the head band over the record) and its FIELD (rail ·
 * bay · foot, no head), each fitting the viewport, the field sliding up UNDER
 * the record's band, the next project's record pinning on the field's own
 * line so the pair's band is what survives. This spec measures exactly that
 * geometry on the two phone shapes, in Chromium.
 *
 * ⚠ CHROMIUM PHONE PROJECTS ONLY. The WebKit iPhone projects cannot reach the
 * local dev server (`.claude/rules/mobile-sections.md` "Verifying"), and a
 * desktop viewport renders the whole-card pile this spec has nothing to say
 * about — `services-ring-smoke` owns that one.
 *
 * ⚠ A SEAT CONVERGES, IT IS NOT SOLVED ONCE (the proof-stack rule's own law):
 * `offsetTop` on a STUCK sticky slot reports its stuck position, so every seat
 * rewinds above the pile before solving, and then converges on
 * `data-pc-state`, the hook's own published value, because the corridor's lazy
 * mount grows the document under the first scroll. And `<html>` scrolls
 * smoothly, so a `scrollTo` is an animation — `settleScroll` waits for it.
 *
 * ⚠ `innerHeight` IS NOT THE LAYOUT VIEWPORT UNDER MOBILE EMULATION. The page
 * is ~421px wide in Chromium's emulated iPhone (pre-existing, every route),
 * so the emulator zooms out and `innerHeight` reads 912 on an 844 window.
 * Every `svh`-derived box below is measured against
 * `documentElement.clientHeight`, which is the 844 the sheet solved against.
 */

const PHONE = ({
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

async function pileTop(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector<HTMLElement>(".pf-stack__runway");
    if (!el) return Number.NaN;
    return el.getBoundingClientRect().top + window.scrollY;
  });
}

/**
 * Seat slot `i` `extra` px past its pin. Returns the state the hook published.
 * ⚠ REWIND ABOVE THE PILE FIRST — a stuck slot's `offsetTop` is its stuck
 * position, and the solve would land a pitch off.
 */
async function seatSlot(page: Page, i: number, extra = 40): Promise<string | null> {
  let state: string | null = null;
  for (let pass = 0; pass < 6; pass += 1) {
    const top = await pileTop(page);
    await rollTo(page, Math.max(0, top - page.viewportSize()!.height));
    const target = await page.evaluate(
      ({ idx, more }) => {
        const runway = document.querySelector<HTMLElement>(".pf-stack__runway");
        const slot = document.querySelector<HTMLElement>(`.pf-slot[data-pc-index="${idx}"]`);
        if (!runway || !slot) return null;
        const rt = runway.getBoundingClientRect().top + window.scrollY;
        const pin = Number.parseFloat(getComputedStyle(slot).top) || 0;
        return Math.round(rt + slot.offsetTop - pin + more);
      },
      { idx: i, more: extra }
    );
    if (target == null) return null;
    await rollTo(page, target);
    state = await page.evaluate(
      (idx) =>
        document.querySelector<HTMLElement>(`.pf-slot[data-pc-index="${idx}"]`)?.dataset.pcState ??
        null,
      i
    );
    if (state === "pinned" || state === "covered") break;
  }
  return state;
}

function rect(page: Page, sel: string) {
  return page.evaluate((s) => {
    const el = document.querySelector<HTMLElement>(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      top: r.top,
      bottom: r.bottom,
      height: r.height,
      visibility: cs.visibility,
      opacity: Number(cs.opacity),
    };
  }, sel);
}

async function openPile(page: Page, theme: "dark" | "light" = "dark") {
  await page.goto(theme === "light" ? "/?theme=light" : "/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".pf-stack", { timeout: 60_000 });
  // Warm the lazy corridor so the document has its real height before any seat.
  await rollTo(page, await pileTop(page));
  await page.waitForTimeout(600);
}

test.describe("the proof stack on phones (ADR-107)", () => {
  test.skip(PHONE, "Chromium phone projects only");

  test("every project is two sticky panels, each fitting the viewport", async ({ page }) => {
    await openPile(page);
    const geo = await page.evaluate(() => {
      const vh = document.documentElement.clientHeight;
      const slots = [...document.querySelectorAll<HTMLElement>(".pf-slot")].map((el) => {
        const cs = getComputedStyle(el);
        return {
          index: el.dataset.pcIndex,
          panel: el.dataset.pcPanel,
          position: cs.position,
          top: Number.parseFloat(cs.top),
          height: el.offsetHeight,
        };
      });
      const runway = document.querySelector<HTMLElement>(".pf-stack__runway");
      return {
        vh,
        split: !!document.querySelector(".pf-stack--split"),
        n: runway ? getComputedStyle(runway).getPropertyValue("--pc-n").trim() : null,
        tail: document.querySelector<HTMLElement>(".pf-stack__tail")?.offsetHeight ?? 0,
        slots,
      };
    });
    expect(geo.split, "the stack is not rendered split on a phone").toBe(true);
    expect(geo.n).toBe("5");
    expect(geo.slots.map((s) => s.index)).toEqual(["0", "1", "2", "3", "4", "5", "6", "7"]);
    expect(geo.slots.map((s) => s.panel)).toEqual([
      "record",
      "field",
      "record",
      "field",
      "record",
      "field",
      "record",
      "field",
    ]);
    for (const s of geo.slots) {
      expect(s.position, `slot ${s.index} is not sticky`).toBe("sticky");
      // The panel fits: its bottom, pinned, stays above the bottom-safe band.
      expect(s.top + s.height, `slot ${s.index} overruns the viewport`).toBeLessThanOrEqual(
        geo.vh - 24 + 1
      );
    }
    // The field seats one peek under its own record; the next record on the
    // same line — `--i` is k for a record and k+1 for its field.
    /* ⚠ THE PITCH IS READ, NOT PINNED (ADR-082 U27). It was the literal 52,
       which is what a pitch was on the day this was written — and the phone
       rung now runs at 44 so every early card gets 32px of its hole back. The
       LAW is that a field seats exactly one peek under its record; the NUMBER
       is a dial the composition owns, and a guard that pins the dial fails on
       a tuning change while saying nothing about the law. */
    const peek = await page.evaluate(() => {
      const el = document.querySelector(".pf-stack");
      return el
        ? Number.parseFloat(getComputedStyle(el).getPropertyValue("--pc-peek"))
        : Number.NaN;
    });
    expect(peek, "the stack publishes no peek").toBeGreaterThan(0);
    for (let k = 0; k < 4; k += 1) {
      const r = geo.slots[2 * k];
      const f = geo.slots[2 * k + 1];
      expect(f.top - r.top).toBeCloseTo(peek, 0);
      if (k < 3) expect(geo.slots[2 * k + 2].top).toBeCloseTo(f.top, 0);
    }
    expect(geo.tail, "the last panel's hold is spent").toBeGreaterThanOrEqual(280);
  });

  test("the field slides under its record's band, and the next record covers the pair", async ({
    page,
  }) => {
    await openPile(page);

    // Record 0 pinned: its content fits its sheet.
    expect(await seatSlot(page, 0)).toBe("pinned");
    const fit = await page.evaluate(() => {
      const rec = document.querySelector<HTMLElement>('[data-pc-index="0"] .pf-card__record');
      return rec ? { scroll: rec.scrollHeight, client: rec.clientHeight } : null;
    });
    expect(fit).not.toBeNull();
    expect(fit!.scroll).toBeLessThanOrEqual(fit!.client + 1);

    // Field 0 pinned: under the band, exactly.
    expect(await seatSlot(page, 1)).toBe("pinned");
    const head0 = await rect(page, '[data-pc-index="0"] .pf-card__head');
    const headTitle = await rect(page, '[data-pc-index="0"] .pf-card__headtitle');
    const slot0 = await rect(page, '[data-pc-index="0"]');
    const body0 = await rect(page, '[data-pc-index="0"] .pf-card__body');
    const field0 = await rect(page, '[data-pc-index="1"] .pf-card__field');
    const bay0 = await rect(page, '[data-pc-index="1"] .pf-card__bay');
    const peek0 = await page.evaluate(() => {
      const el = document.querySelector(".pf-stack");
      return el
        ? Number.parseFloat(getComputedStyle(el).getPropertyValue("--pc-peek"))
        : Number.NaN;
    });
    expect(head0!.height).toBeCloseTo(peek0, 0);
    expect(headTitle, "the record's band carries no slim title").not.toBeNull();
    expect(field0!.top - slot0!.top).toBeCloseTo(peek0, 0);
    /* ⚠ THE BAND STILL HAS TO HOLD ITS TITLE. The pitch is a dial, but it is
       bounded from below by two lines of the card's own 13px name — so the
       floor is asserted rather than trusted to whoever next tunes it. */
    expect(peek0, "the peek is under the head band's two-line floor").toBeGreaterThanOrEqual(44);
    expect(head0!.visibility).toBe("visible");
    // The record's copy has left on the cover channel; the band has not.
    expect(body0!.visibility).toBe("hidden");
    expect(bay0!.height).toBeGreaterThanOrEqual(300);
    const state0 = await page.evaluate(
      () => document.querySelector<HTMLElement>('[data-pc-index="0"]')?.dataset.pcState
    );
    expect(state0).toBe("covered");

    // Record 1 pinned: on field 0's line; pair 0 shows exactly its band.
    expect(await seatSlot(page, 2)).toBe("pinned");
    const slot1 = await rect(page, '[data-pc-index="1"]');
    const slot2 = await rect(page, '[data-pc-index="2"]');
    const head0b = await rect(page, '[data-pc-index="0"] .pf-card__head');
    expect(slot2!.top).toBeCloseTo(slot1!.top, 0);
    expect(Math.abs(head0b!.bottom - slot2!.top)).toBeLessThanOrEqual(1.5);
  });

  test("the last field holds on its tail, and the masthead waits below the pile", async ({
    page,
  }) => {
    await openPile(page);
    expect(await seatSlot(page, 7, 0)).toBe("pinned");
    const pin = await page.evaluate(
      () =>
        Number.parseFloat(
          getComputedStyle(document.querySelector<HTMLElement>('[data-pc-index="7"]')!).top
        ) || 0
    );
    const tail = await page.evaluate(
      () => document.querySelector<HTMLElement>(".pf-stack__tail")?.offsetHeight ?? 0
    );
    const y0 = await page.evaluate(() => window.scrollY);
    await rollTo(page, y0 + tail - 80);
    const held = await rect(page, '[data-pc-index="7"]');
    expect(Math.abs(held!.top - pin)).toBeLessThanOrEqual(1.5);
    /* What waits below the pile: on the ring rung (ADR-109) the masthead
       renders INSIDE the ring's band as `display: contents` — no box of its
       own — so the band's runway is the offer's top edge there; the inert
       rung keeps the flowing masthead. */
    const masthead =
      (await rect(page, ".svc-ring-runway")) ?? (await rect(page, ".services-masthead"));
    expect(masthead, "no offer below the pile").toBeTruthy();
    expect(masthead!.top).toBeGreaterThanOrEqual(held!.bottom - 1);
    await rollTo(page, y0 + tail + 120);
    const gone = await rect(page, '[data-pc-index="7"]');
    expect(gone!.top).toBeLessThan(pin - 100);
  });

  test("every record fits its sheet, in light as in dark", async ({ page }) => {
    await openPile(page, "light");
    for (let k = 0; k < 4; k += 1) {
      const state = await seatSlot(page, 2 * k);
      expect(state, `record ${k} never pinned`).toMatch(/pinned|covered/);
      const fit = await page.evaluate((i) => {
        const rec = document.querySelector<HTMLElement>(`[data-pc-index="${i}"] .pf-card__record`);
        const title = document.querySelector<HTMLElement>(`[data-pc-index="${i}"] .pf-card__title`);
        return rec && title
          ? { scroll: rec.scrollHeight, client: rec.clientHeight, title: title.offsetHeight }
          : null;
      }, 2 * k);
      expect(fit).not.toBeNull();
      expect(fit!.scroll, `record ${k} overflows its sheet`).toBeLessThanOrEqual(fit!.client + 1);
      expect(fit!.title).toBeGreaterThan(0);
    }
  });

  test("reduced motion and a short window keep the whole card in flow", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".pf-stack", { timeout: 60_000 });
    const prm = await page.evaluate(() => ({
      split: !!document.querySelector(".pf-stack--split"),
      slots: [...document.querySelectorAll<HTMLElement>(".pf-slot")].map(
        (el) => getComputedStyle(el).position
      ),
    }));
    expect(prm.split).toBe(false);
    expect(prm.slots).toEqual(["static", "static", "static", "static"]);

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 390, height: 600 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".pf-stack", { timeout: 60_000 });
    const short = await page.evaluate(() => ({
      split: !!document.querySelector(".pf-stack--split"),
      slots: [...document.querySelectorAll<HTMLElement>(".pf-slot")].map(
        (el) => getComputedStyle(el).position
      ),
    }));
    expect(short.split).toBe(false);
    expect(short.slots).toEqual(["static", "static", "static", "static"]);
  });
});
