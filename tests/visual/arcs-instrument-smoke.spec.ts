import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { CLIENTS } from "@/lib/arcs/clients";
import { ARCS } from "@/lib/arcs/registry";
import { letterDateShort } from "@/lib/sheet/dates";

/**
 * The arcs instrument, in the browser (ADR-118). What fails SILENTLY here:
 *
 *   - a monitor that is not exactly one screen, or a log that starts under it;
 *   - a mark that is not where its date is, a same-day pair printing through
 *     itself, NOW left of an engagement;
 *   - a dossier that is not the chosen row — for ANY row, because the gate
 *     never measures a hidden dossier;
 *   - a row that wraps or clips at the binding viewport;
 *   - keys that walk into a row the filter has hidden;
 *   - the frame's chrome printing over the device.
 *
 * ⚠ Under `next dev` the owner's gate is open (ADR-117); that is the only
 * reason `/arcs` answers a smoke at all.
 */

const VIEWPORTS: [number, number][] = [
  [1280, 720],
  [1440, 800],
  [1920, 1247],
];

/** Every engagement the overview plots: the arcs and the clients' pages. */
const RECORD = [
  ...ARCS.map((a) => ({ href: `/arcs/${a.slug}`, date: a.date })),
  ...CLIENTS.flatMap((c) => (c.pages ?? []).map((p) => ({ href: p.href, date: p.date }))),
];
const NEWEST = [...RECORD].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))[0];

async function open(page: Page, url = "/arcs") {
  await page.goto(url);
  await page.locator(".sh-root[data-sh-ready]").waitFor({ timeout: 45_000 });
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });
  await page.locator(".sh-mon.is-in, .sh-root:not(.is-sh-inst) .sh-mon").first().waitFor();
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running")
  );
}

async function seatLog(page: Page) {
  const y = await page.evaluate(
    () => document.getElementById("log")!.getBoundingClientRect().top + scrollY
  );
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.locator(".sh-log.is-in, .sh-root:not(.is-sh-inst) .sh-log").first().waitFor();
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running")
  );
}

test.describe("the arcs instrument (ADR-118)", () => {
  /* ⚠ FIXTURE CONTEXTS, NEVER `browser.newContext()`: a hand-made context
     inherits none of the project's options — the owner's pass in the storage
     state included — so on a gated server it would measure a 404. */
  for (const [w, h] of VIEWPORTS) {
    test.describe(`at ${w}x${h}`, () => {
      test.use({
        viewport: { width: w, height: h },
        contextOptions: { reducedMotion: "no-preference" },
      });
      test(`two screens that never overlap, the device between the rails, at ${w}x${h}`, async ({
        page,
      }) => {
        await open(page);
        const g = await page.evaluate(() => {
          const r = (s: string) => document.querySelector(s)!.getBoundingClientRect();
          const rail = r(".hud__rail");
          return {
            monTop: r("#monitor").top,
            monH: r("#monitor").height,
            logTop: r("#log").top,
            logH: r("#log").height,
            device: r(".sh-mon__in").toJSON(),
            rail: { top: rail.top, bottom: rail.bottom },
            brand: document.querySelector(".hud__brand")?.getBoundingClientRect().toJSON() ?? null,
            nav:
              document.querySelector(".hud-nav-overlay")?.getBoundingClientRect().toJSON() ?? null,
            scrollW: document.documentElement.scrollWidth,
          };
        });
        expect(g.monTop).toBeCloseTo(0, 0);
        expect(Math.abs(g.monH - h), "the monitor is one screen").toBeLessThanOrEqual(1);
        expect(
          Math.abs(g.logTop - (g.monTop + g.monH)),
          "the log starts where it ends"
        ).toBeLessThanOrEqual(1);
        expect(g.logH).toBeGreaterThanOrEqual(h - 1);
        // The device hangs from the rail's first tick and sits on its last.
        expect(Math.abs(g.device.top - g.rail.top)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(g.device.bottom - g.rail.bottom)).toBeLessThanOrEqual(1.5);
        // …so the frame's wordmark and chapter row never print over it.
        if (g.brand)
          expect(g.brand.top, "the wordmark sits under the device").toBeGreaterThanOrEqual(
            g.device.bottom - 1
          );
        if (g.nav && g.nav.height > 0)
          expect(g.nav.bottom, "the chapter row sits over the device").toBeLessThanOrEqual(
            g.device.top + 1
          );
        expect(g.scrollW).toBeLessThanOrEqual(w + 1);

        // Seated, nothing of the monitor is in view, and the dossier is level with the list.
        await seatLog(page);
        const s = await page.evaluate(() => {
          const r = (sel: string) => document.querySelector(sel)!.getBoundingClientRect();
          return {
            monBottom: r("#monitor").bottom,
            listTop: r(".sh-log__list").top,
            listRight: r(".sh-log__list").right,
            dosTop: r(".sh-log__dossiers").top,
            dosLeft: r(".sh-log__dossiers").left,
            dosBottom: r(".sh-log__dossiers").bottom,
            wrapped: [...document.querySelectorAll<HTMLElement>(".sh-log__row")]
              .filter((row) => !row.closest("[hidden]"))
              .filter((row) => {
                const t = row.querySelector<HTMLElement>(".sh-log__title")!;
                return t.scrollWidth > t.clientWidth + 1 || t.getClientRects().length > 1;
              })
              .map((row) => row.dataset.id),
            dossierClipped: (() => {
              const d = document.querySelector<HTMLElement>(".sh-dos:not([hidden]) .sh-dos__in")!;
              const foot = d.querySelector(".sh-dos__foot")!.getBoundingClientRect();
              return foot.bottom > d.getBoundingClientRect().bottom + 1;
            })(),
          };
        });
        expect(s.monBottom).toBeLessThanOrEqual(1);
        expect(
          Math.abs(s.listTop - s.dosTop),
          "the dossier is level with the list"
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(s.listRight - s.dosLeft),
          "no gutter between list and dossier"
        ).toBeLessThanOrEqual(1);
        expect(s.wrapped, "rows that wrap or clip").toEqual([]);
        expect(s.dossierClipped, "the dossier's foot is inside its housing").toBe(false);
      });
    });
  }

  test("the plot is the record: one mark per engagement, at its date, left of NOW", async ({
    page,
  }) => {
    await open(page);
    const marks = await page.$$eval(".sh-mon__mark", (els) =>
      els.map((el) => {
        const b = el.getBoundingClientRect();
        return {
          id: el.getAttribute("data-id"),
          href: el.getAttribute("href"),
          x: b.left + b.width / 2,
        };
      })
    );
    expect(marks.map((m) => m.href).sort()).toEqual(RECORD.map((r) => r.href).sort());
    const byHref = new Map(RECORD.map((r) => [r.href, r.date]));
    const sorted = [...marks].sort((a, b) =>
      byHref.get(a.href!)! < byHref.get(b.href!)! ? -1 : 1
    );
    for (let i = 1; i < sorted.length; i++) {
      const [a, b] = [sorted[i - 1], sorted[i]];
      if (byHref.get(a.href!) === byHref.get(b.href!)) expect(Math.abs(a.x - b.x)).toBeLessThan(1);
      else expect(b.x, `${b.href} after ${a.href}`).toBeGreaterThan(a.x);
    }
    const now = await page.locator(".sh-mon__now").boundingBox();
    for (const m of marks) expect(now!.x, `${m.href} is left of NOW`).toBeGreaterThanOrEqual(m.x);
    // One lit mark and one chosen row, and they are the newest engagement.
    await expect(page.locator(".sh-mon__mark.is-lit")).toHaveCount(1);
    await expect(page.locator('.sh-log__row[aria-current="true"]')).toHaveCount(1);
    await expect(page.locator(".sh-mon__mark.is-lit")).toHaveAttribute("href", NEWEST.href);
    await expect(page.locator('.sh-log__row[aria-current="true"]')).toHaveAttribute(
      "href",
      NEWEST.href
    );
    await expect(page.locator(".sh-root")).toHaveAttribute(
      "data-dos-id",
      (await page.locator(".sh-mon__mark.is-lit").getAttribute("data-id"))!
    );
  });

  test("every row opens ITS dossier: title, date and target agree", async ({ page }) => {
    await open(page);
    await seatLog(page);
    const rows = await page.$$eval(".sh-log__row", (els) =>
      els.map((el) => ({
        id: el.getAttribute("data-id")!,
        href: el.getAttribute("href")!,
        title: el.querySelector(".sh-log__title")!.textContent!.trim(),
      }))
    );
    expect(rows).toHaveLength(RECORD.length);
    const byHref = new Map(RECORD.map((r) => [r.href, r.date]));
    for (const row of rows) {
      await page.locator(`.sh-log__row[data-id="${row.id}"]`).click();
      await expect(page.locator(".sh-root")).toHaveAttribute("data-dos-id", row.id);
      await expect(page.locator(`.sh-log__row[data-id="${row.id}"]`)).toHaveAttribute(
        "aria-current",
        "true"
      );
      await expect(page.locator(`.sh-mon__mark[data-id="${row.id}"]`)).toHaveClass(/is-lit/);
      const d = await page.evaluate(() => {
        const shown = [...document.querySelectorAll<HTMLElement>(".sh-dos")].filter(
          (x) => !x.hidden
        );
        const one = shown[0];
        const read = Object.fromEntries(
          [...one.querySelectorAll(".sh-readout__row")].map((r) => [
            r.querySelector(".sh-readout__k")!.textContent!.trim(),
            r.querySelector(".sh-readout__v")!.textContent!.trim(),
          ])
        );
        const img = one.querySelector("img");
        return {
          shown: shown.length,
          id: one.dataset.id,
          title: one.querySelector(".sh-dos__title")!.textContent!.trim(),
          filed: read.Filed,
          cta: one.querySelector(".sh-cta")!.getAttribute("href"),
          pictured: Boolean(img && img.complete && img.naturalWidth > 0),
        };
      });
      expect(d.shown, row.id).toBe(1);
      expect(d.id, row.id).toBe(row.id);
      // SETTLED means the picture too: the first cut settled on the aperture's
      // timer, and a lazy picture was still streaming in under it.
      expect(d.pictured, `${row.id}'s picture had not loaded when it settled`).toBe(true);
      expect(
        d.title.toLowerCase().endsWith(row.title.toLowerCase()),
        `${d.title} / ${row.title}`
      ).toBe(true);
      expect(d.filed, row.id).toBe(letterDateShort(byHref.get(row.href)!));
      expect(d.cta, row.id).toBe(row.href);
    }
    // The choice is in the address, and the address chooses.
    expect(page.url()).toMatch(new RegExp(`#arc=${rows[rows.length - 1].id}$`));
  });

  test("the keys walk the rows the filter leaves, and Enter opens", async ({ page }) => {
    await open(page);
    await seatLog(page);
    await page
      .locator(".sh-stn", { hasText: /^Keynote/i })
      .first()
      .click();
    await expect(page.locator(".sh-root")).toHaveAttribute("data-sh-kind", "keynote");
    const visible = await page.$$eval(".sh-log__row", (els) =>
      els.filter((el) => !el.closest("[hidden]")).map((el) => el.getAttribute("data-id"))
    );
    expect(visible.length).toBeGreaterThan(1);
    // The filter hid the chosen row, so the choice moved to the first one shown.
    await expect(page.locator(".sh-root")).toHaveAttribute("data-dos-id", visible[0]!);
    await page.locator(`.sh-log__row[data-id="${visible[0]}"]`).focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator(".sh-root")).toHaveAttribute("data-dos-id", visible[1]!);
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-id"))).toBe(
      visible[1]
    );
    await page.keyboard.press("ArrowUp");
    await expect(page.locator(".sh-root")).toHaveAttribute("data-dos-id", visible[0]!);
    const href = await page.locator(`.sh-log__row[data-id="${visible[0]}"]`).getAttribute("href");
    await page.keyboard.press("Enter");
    await page.waitForURL((u) => u.pathname === href, { timeout: 30_000 });
  });

  test("a mark selects, seats the log and focuses its row; a deep link does the same", async ({
    page,
  }) => {
    await open(page);
    const target = await page.$$eval(".sh-mon__mark:not(.is-lit)", (els) =>
      els[0].getAttribute("data-id")
    );
    await page.locator(`.sh-mon__mark[data-id="${target}"]`).click();
    await expect(page.locator(".sh-root")).toHaveAttribute("data-dos-id", target!);
    await page.waitForFunction(
      () => Math.abs(document.getElementById("log")!.getBoundingClientRect().top) < 2
    );
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-id"))).toBe(target);

    await open(page, `/arcs#arc=${target}`);
    await expect(page.locator(".sh-root")).toHaveAttribute("data-dos-id", target!);
    await expect(page.locator(`.sh-log__row[data-id="${target}"]`)).toHaveAttribute(
      "aria-current",
      "true"
    );
  });

  test.describe("under reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });
    test("nothing is armed, and a choice settles at once", async ({ page }) => {
      await open(page);
      const clip = await page.evaluate(
        () => getComputedStyle(document.querySelector(".sh-mon__datum")!).clipPath
      );
      expect(clip, "nothing is armed under reduced motion").toBe("none");
      const other = await page.$$eval(".sh-log__row:not(.is-on)", (els) =>
        els[0].getAttribute("data-id")
      );
      await page.locator(`.sh-log__row[data-id="${other}"]`).click();
      await expect(page.locator(".sh-root")).toHaveAttribute("data-dos-id", other!);
    });
  });

  test("the kit draws what the record does not hold: a same-day pair, a run, an entering lane", async ({
    page,
  }) => {
    const res = await page.goto("/test/arcs-instrument-kit");
    test.skip(res?.status() === 404, "the kit is internal: proxy-blocked on a production server");
    await open(page, "/test/arcs-instrument-kit");
    const twins = await page.$$eval('.sh-mon__lane[data-lane="halcyon"] .sh-mon__mark', (els) =>
      els.map((el) => el.getBoundingClientRect().toJSON())
    );
    expect(twins).toHaveLength(2);
    const [a, b] = twins;
    const overlap = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    expect(overlap, "the same-day pair prints through itself").toBe(false);
    await expect(page.locator(".sh-mon__run--open")).toHaveCount(1);
    await expect(page.locator(".sh-mon__since")).toHaveCount(1);
  });

  test("both themes hold 4.5:1 on every reading", async ({ page }) => {
    for (const theme of ["dark", "light"]) {
      await open(page, `/arcs?theme=${theme}`);
      /* ⚠ DARK IS THE ABSENCE OF THE ATTRIBUTE (ADR-058): the bootstrap only
         ever writes `data-theme="light"`, so asserting "dark" asks for a value
         nothing on the site sets. */
      if (theme === "light")
        await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
      else expect(await page.locator("html").getAttribute("data-theme")).not.toBe("light");
      const ratios = await page.$$eval(
        ".sh-mon__reading dt, .sh-mon__reading dd, .sh-mon__cell-label, .sh-mon__lane-name, .sh-mon__lane-reading, .sh-mon__tick, .sh-log__head, .sh-log__chip, .sh-log__title, .sh-log__date, .sh-dos:not([hidden]) .sh-readout__k, .sh-dos:not([hidden]) .sh-dos__lede",
        (els) => {
          const parse = (s: string) => {
            const m = s.match(/rgba?\(([^)]+)\)/);
            if (!m) return null;
            const p = m[1].split(/[,/]/).map((x) => parseFloat(x));
            return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
          };
          const lum = (c: { r: number; g: number; b: number }) => {
            const f = (v: number) => {
              const s = v / 255;
              return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
            };
            return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
          };
          type C = { r: number; g: number; b: number; a: number };
          const over = (top: C, bed: { r: number; g: number; b: number }) => ({
            r: top.r * top.a + bed.r * (1 - top.a),
            g: top.g * top.a + bed.g * (1 - top.a),
            b: top.b * top.a + bed.b * (1 - top.a),
          });
          return els
            .filter((el) => el.getClientRects().length > 0 && el.textContent!.trim())
            .map((el) => {
              const layers: C[] = [];
              for (let n: Element | null = el; n; n = n.parentElement) {
                const c = parse(getComputedStyle(n).backgroundColor);
                if (c && c.a > 0) {
                  layers.push(c);
                  if (c.a >= 0.999) break;
                }
              }
              let bed = { r: 0, g: 0, b: 0 };
              const html = parse(getComputedStyle(document.documentElement).backgroundColor);
              if (html && html.a > 0) bed = over(html, bed);
              for (const l of layers.reverse()) bed = over(l, bed);
              const fg = over(parse(getComputedStyle(el).color)!, bed);
              const [l1, l2] = [lum(fg), lum(bed)];
              return {
                what: `${el.className || el.tagName}: ${el.textContent!.trim().slice(0, 24)}`,
                ratio: +((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2),
              };
            });
        }
      );
      expect(ratios.length).toBeGreaterThan(30);
      const low = ratios.filter((r) => r.ratio < 4.5);
      expect(low, `${theme}: under 4.5:1`).toEqual([]);
    }
  });
});
