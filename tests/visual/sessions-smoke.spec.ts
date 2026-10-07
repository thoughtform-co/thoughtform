import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * ADR-150 — the Home sessions page, in a browser. It is its own composition
 * (not a sheet), so this smoke asks the page's own questions: the stamp, the
 * one lit morning, the dial turning with the reader, the band, both themes,
 * the phone, reduced motion and the plate each theme fetches.
 *
 * No WebGL on this route, so it runs headless and in parallel.
 */

const URL = "/home-sessions";
const VIEWPORTS: [number, number][] = [
  [1280, 720],
  [1440, 800],
  [1470, 830],
  [2000, 1000],
  [1920, 1247],
];

async function ready(page: Page, url = URL) {
  await page.goto(url);
  await page.locator(".hs-root[data-hs-ready]").waitFor({ timeout: 60_000 });
  const stamp = (await page.locator(".hs-root").getAttribute("data-hs-ready")) ?? "";
  const [loaded, sections, rail] = stamp.split("|").map(Number);
  expect(loaded, "faces loaded").toBeGreaterThanOrEqual(2);
  // hero · the morning · the dates · the field · the table · reserve · contact
  expect(sections, "sections").toBe(7);
  if ((page.viewportSize()?.width ?? 1280) > 960) expect(rail, "rail height").toBeGreaterThan(0);
}

/** Walk the page so every one-shot reveal fires. */
async function walk(page: Page) {
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
  const h = page.viewportSize()?.height ?? 800;
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += Math.round(h / 3)) {
    await page.mouse.wheel(0, Math.round(h / 3));
    await page.waitForTimeout(40);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

/** Contrast of every match against its first opaque ground, composited —
 *  the subpages smoke's own helper, copied. */
/** Composited contrast: the text colour over the first opaque ancestor. */
async function contrastOf(page: Page, selector: string) {
  return page.$$eval(selector, (els) => {
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
    const over = (
      top: { r: number; g: number; b: number; a: number },
      bed: { r: number; g: number; b: number }
    ) => ({
      r: top.r * top.a + bed.r * (1 - top.a),
      g: top.g * top.a + bed.g * (1 - top.a),
      b: top.b * top.a + bed.b * (1 - top.a),
    });
    const bedOf = (el: Element) => {
      const layers: { r: number; g: number; b: number; a: number }[] = [];
      let node: Element | null = el;
      while (node) {
        const c = parse(getComputedStyle(node).backgroundColor);
        if (c && c.a > 0) {
          layers.push(c);
          if (c.a >= 0.999) break;
        }
        node = node.parentElement;
      }
      let bed = { r: 0, g: 0, b: 0 };
      const html = parse(getComputedStyle(document.documentElement).backgroundColor);
      if (html && html.a > 0) bed = over(html, bed);
      for (const l of layers.reverse()) bed = over(l, bed);
      return bed;
    };
    return els
      .filter((el) => el.textContent?.trim().length && getComputedStyle(el).visibility !== "hidden")
      .slice(0, 12)
      .map((el) => {
        const ink = parse(getComputedStyle(el).color)!;
        const bed = bedOf(el);
        const fg = over(ink, bed);
        const l1 = lum(fg),
          l2 = lum(bed);
        return +((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2);
      });
  });
}

test.describe("the Home sessions page (ADR-150)", () => {
  // two loads and two full walks in one case; a cold dev server needs the room
  test.describe.configure({ timeout: 120_000 });
  test("one morning is lit, it is the readout's, and it mails its own morning", async ({
    page,
  }) => {
    await ready(page);
    const lit = page.locator('.hs-tiles__item[data-state="next"]');
    await expect(lit).toHaveCount(1);
    const readout = (await page.locator("[data-hs-readout]").textContent()) ?? "";
    const day = Number(await lit.locator(".hs-tile__day").textContent());
    const month = (await lit.locator(".hs-tile__when span").nth(1).textContent()) ?? "";
    expect(readout).toContain(`${day} ${month.split(" ")[0]}`);
    const href = (await lit.locator("a.hs-tile").getAttribute("href")) ?? "";
    expect(href).toMatch(/^mailto:[^?]+\?subject=/);
    expect(decodeURIComponent(href)).toContain(month.split(" ")[0]);
    // the axis lights the same morning
    expect(await page.locator(".hs-axis__mark[data-lit]").count()).toBe(1);
    // a held morning is never a link
    for (const held of await page.locator('.hs-tiles__item[data-state="held"]').all())
      expect(await held.locator("a").count()).toBe(0);
  });

  test("the dial turns to each step as it crosses the midline", async ({ page }) => {
    await ready(page);
    await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
    const n = await page.locator(".hs-step").count();
    expect(n).toBe(4);
    for (let i = 0; i < n; i++) {
      await page.evaluate((i) => {
        const el = document.querySelectorAll(".hs-step")[i] as HTMLElement;
        const r = el.getBoundingClientRect();
        window.scrollTo(0, window.scrollY + r.top + r.height / 2 - window.innerHeight / 2);
      }, i);
      await expect(page.locator("#the-morning")).toHaveAttribute("data-step", String(i));
      // the hub prints the lit step's ordinal, and only that one paints
      const hub = await page.$$eval(".hs-dial__hub-n", (els) =>
        els.filter((e) => e.getClientRects().length > 0).map((e) => e.textContent)
      );
      expect(hub).toEqual([`1.${i + 1}`]);
    }
  });

  for (const [w, h] of VIEWPORTS) {
    test.describe(`at ${w}x${h}`, () => {
      test.use({ viewport: { width: w, height: h } });
      test("the dates and the table each fit one viewport, between the rails", async ({ page }) => {
        /* owner, 2026-10-07: "make sure that all elements fit within the
           section / viewport". On a desktop tall enough the two frames are one
           viewport each, their content on the rails' ends, nothing spilling. */
        await ready(page);
        // a reveal rests 24px low until it has been seen; walk so every one lands
        await walk(page);
        await page.waitForTimeout(900);
        const r = await page.evaluate(() => {
          const rail = document.querySelector(".hud__rail")!.getBoundingClientRect();
          return ["dates", "the-table"].map((id) => {
            const s = document.querySelector(`[data-hs-section="${id}"]`)!;
            const top = s.getBoundingClientRect().top;
            let lo = Infinity,
              hi = -Infinity;
            s.querySelectorAll("*").forEach((el) => {
              const b = el.getBoundingClientRect();
              if (!b.width || !b.height) return;
              lo = Math.min(lo, b.top - top);
              hi = Math.max(hi, b.bottom - top);
            });
            const spills: string[] = [];
            s.querySelectorAll(".hs-tile, .hs-readout__row, .hs-plan__stage").forEach((box) => {
              const b = box.getBoundingClientRect();
              box.querySelectorAll("*").forEach((c) => {
                const k = c.getBoundingClientRect();
                if (k.height && (k.bottom > b.bottom + 1 || k.top < b.top - 1))
                  spills.push(String((c as HTMLElement).className));
              });
            });
            return {
              id,
              height: s.getBoundingClientRect().height,
              lo,
              hi,
              railTop: rail.top,
              railBot: rail.bottom,
              spills,
            };
          });
        });
        for (const s of r) {
          expect(s.height, `${s.id}: one viewport`).toBeLessThanOrEqual(h + 1);
          expect(s.lo, `${s.id}: content starts on the rail`).toBeGreaterThanOrEqual(s.railTop - 1);
          expect(s.hi, `${s.id}: content ends on the rail`).toBeLessThanOrEqual(s.railBot + 1);
          expect(s.spills, `${s.id}: spills`).toEqual([]);
        }
      });

      test("nothing scrolls sideways, and every block sits inside its band", async ({ page }) => {
        await ready(page);
        await walk(page);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
        ).toBe(true);
        const overruns = await page.$$eval(".hs-band", (bands) =>
          bands.flatMap((band) => {
            const b = band.getBoundingClientRect();
            const cs = getComputedStyle(band);
            const left = b.left + parseFloat(cs.paddingLeft);
            const right = b.right - parseFloat(cs.paddingRight);
            return [
              ...band.querySelectorAll<HTMLElement>(
                ".hs-head, .hs-housing, .hs-photo, .hs-table__side, .hs-ask, .hs-steps, .hs-morning__fig"
              ),
            ]
              .map((el) => ({ el: el.className, r: el.getBoundingClientRect() }))
              .filter(({ r }) => r.left < left - 1 || r.right > right + 1)
              .map(
                ({ el, r }) =>
                  `${el}: ${Math.round(r.left)}–${Math.round(r.right)} vs ${Math.round(left)}–${Math.round(right)}`
              );
          })
        );
        expect(overruns, overruns.join("\n")).toEqual([]);
      });
    });
  }

  test("both themes paint their own ground and hold contrast", async ({ page }) => {
    const grounds: string[] = [];
    for (const theme of ["dark", "light"]) {
      await ready(page, `${URL}?theme=${theme}`);
      await walk(page);
      if (theme === "light")
        await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
      grounds.push(
        await page.evaluate(
          () => getComputedStyle(document.querySelector(".hs-root")!).backgroundColor
        )
      );
      const prose = await contrastOf(
        page,
        ".hs-head__title, .hs-head__sub, .hs-step__body, .hs-readout__value, .hs-ask__sub"
      );
      const chrome = await contrastOf(
        page,
        ".hs-head__kicker, .hs-tile__when, .hs-readout__key, .hs-chip, .hs-fig__cap span"
      );
      expect(prose.length, `${theme}: prose measured`).toBeGreaterThan(4);
      expect(chrome.length, `${theme}: chrome measured`).toBeGreaterThan(4);
      // 4.5:1 on both: every string here but the titles is under 18.66px.
      expect(Math.min(...prose), `${theme} prose ${prose.join(" ")}`).toBeGreaterThanOrEqual(4.5);
      expect(Math.min(...chrome), `${theme} chrome ${chrome.join(" ")}`).toBeGreaterThanOrEqual(
        4.5
      );
    }
    expect(grounds[0]).not.toBe(grounds[1]);
  });

  test.describe("on the phone", () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    test("one column, the dial above its steps, nothing sideways", async ({ page }) => {
      await ready(page);
      await walk(page);
      const xs = await page.$$eval(".hs-tile", (els) =>
        els.map((e) => Math.round(e.getBoundingClientRect().left))
      );
      expect(new Set(xs).size).toBe(1);
      const fig = await page.locator(".hs-morning__fig").boundingBox();
      const steps = await page.locator(".hs-steps").boundingBox();
      expect(fig && steps && steps.y >= fig.y + fig.height - 1).toBe(true);
      expect(
        await page.evaluate(
          () => getComputedStyle(document.querySelector(".hs-morning__fig")!).position
        )
      ).toBe("static");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
      ).toBe(true);
    });
  });

  test.describe("under reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });
    test("every block is shown at once; the dial still marks the step being read", async ({
      page,
    }) => {
      await ready(page);
      /* ⚠ The steps not being read RECEDE (a state, not a motion), so they are
         asked a different question: present, and never invisible. */
      const hidden = await page.$$eval(
        ".hs-reveal:not(.hs-step)",
        (els) => els.filter((e) => getComputedStyle(e).opacity !== "1").length
      );
      expect(hidden).toBe(0);
      const steps = await page.$$eval(".hs-step", (els) =>
        els.map((e) => Number(getComputedStyle(e).opacity))
      );
      expect(Math.min(...steps)).toBeGreaterThan(0.3);
      expect(steps.filter((o) => o === 1)).toHaveLength(1);
      // the site's own reduced-motion floor collapses every transition to
      // 0.00001s; anything longer is a transition this page reintroduced
      const transitions = await page.$$eval(
        ".hs-reveal",
        (els) =>
          els.filter((e) =>
            getComputedStyle(e)
              .transitionDuration.split(",")
              .some((d) => parseFloat(d) > 0.01)
          ).length
      );
      expect(transitions).toBe(0);
    });
  });

  test("each theme fetches its own plate and never the other's", async ({ browser }) => {
    for (const theme of ["dark", "light"] as const) {
      const ctx = await browser.newContext({ colorScheme: theme });
      const page = await ctx.newPage();
      const urls: string[] = [];
      page.on("request", (r) => urls.push(r.url()));
      await ready(page, `${URL}?theme=${theme}`);
      const plates = urls.filter((u) => /ThoughtForm_v1(?!b)/.test(u) && !/footer/.test(u));
      if (theme === "dark") {
        expect(
          plates.some((u) => /ThoughtForm_v1\.(avif|webp)/.test(u)),
          plates.join("\n")
        ).toBe(true);
        expect(plates.some((u) => /-light/.test(u))).toBe(false);
      } else {
        expect(
          plates.some((u) => /-light/.test(u)),
          plates.join("\n")
        ).toBe(true);
        expect(plates.some((u) => /ThoughtForm_v1\.(avif|webp)/.test(u))).toBe(false);
      }
      expect(urls.some((u) => /three|supabase/i.test(u))).toBe(false);
      await ctx.close();
    }
  });
});
