import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { CLIENTS, clientPageCount } from "@/lib/arcs/clients";
import { ARCS, arcsOf, houseArcs } from "@/lib/arcs/registry";
import { clientReadout } from "@/lib/sheet/arcs";
import { compositionViolations } from "@/lib/sheet/composition";
import { knobsFor } from "@/lib/sheet/directions";
import { SHEET_ARRANGEMENTS } from "@/lib/sheet/types";
import type { SheetSection } from "@/lib/sheet/types";

/**
 * Subpages smoke (ADR-114) — the sheet's structural contracts, no PNG
 * baselines. What fails SILENTLY on this surface:
 *
 *   - a section whose arrangement is not in the vocabulary, or a ladder
 *     that breaks the variety law in the DOM while the data passes;
 *   - a box that overruns the band at the binding viewport (ink rects,
 *     not bounding boxes — a centred overflow reports zero);
 *   - a readout on the client console that disagrees with the registry;
 *   - a knob that the URL set and the root did not take;
 *   - the pile that never stacks, or a panel that does not stick;
 *   - the sessions page lighting one morning and opening another.
 *
 * Sheet routes carry no WebGL, so these run in parallel. The theme travels
 * in the query (`?theme=`), which the pre-paint bootstrap reads.
 */

const ROUTES = [
  "/home-sessions",
  "/arcs",
  "/arcs/loop",
  "/musings",
  "/musings/navigate-the-intelligence",
];
const VIEWPORTS: [number, number][] = [
  [1280, 720],
  [1440, 800],
  [1920, 1247],
];

async function ready(page: Page, url: string) {
  await page.goto(url);
  await page.locator(".sh-root[data-sh-ready]").waitFor({ timeout: 45_000 });
  const stamp = (await page.locator(".sh-root").getAttribute("data-sh-ready")) ?? "";
  const [loaded, sections, rail] = stamp.split("|").map(Number);
  expect(loaded, `${url}: faces loaded`).toBeGreaterThanOrEqual(2);
  expect(sections, `${url}: sections`).toBeGreaterThanOrEqual(3);
  expect(rail, `${url}: rail height`).toBeGreaterThan(0);
}

/** The DOM's ladder, as the data model, so the law can be asked of the page. */
async function domLadder(page: Page): Promise<SheetSection[]> {
  const raw = await page.$$eval(".sh-sec[data-sh-arrangement]", (els) =>
    els.map((el) => ({
      id: el.id,
      kind: el.getAttribute("data-sh-arrangement") ?? "",
      n: el.querySelector(".sh-cells")?.getAttribute("data-n") ?? null,
      lit: el.querySelectorAll(".sh-tl__item.is-lit").length,
      open: el.querySelectorAll(".sh-steps__item.is-open").length,
      primary: el.querySelectorAll(".sh-console__panel").length,
    }))
  );
  // Only the fields the law reads are reconstructed; the rest is filler.
  return raw.map((r) => {
    const base = { id: r.id, kicker: r.id };
    switch (r.kind) {
      case "split":
        return { ...base, kind: "split", name: "", title: {}, paragraphs: [] };
      case "cells":
        return { ...base, kind: "cells", n: Number(r.n) as 2 | 3 | 4, cells: [] };
      case "timeline":
        return {
          ...base,
          kind: "timeline",
          axis: { from: "2026-01", to: "2026-02" },
          items: r.lit === 1 ? [{ id: "x", date: "2026-01-01", title: "" }] : [],
          lit: "x",
        };
      case "steps":
        return {
          ...base,
          kind: "steps",
          items: r.open === 1 ? [{ id: "x", when: "", title: "" }] : [],
          open: "x",
        };
      case "console":
        return { ...base, kind: "console", consoles: [] };
      case "close":
        return { ...base, kind: "close" };
      case "row":
        return { ...base, kind: "row", items: [] };
      case "figure":
        return {
          ...base,
          kind: "figure",
          items: [{ id: "f", figure: { kind: "mark", caption: "" } }],
        };
      case "table":
        return { ...base, kind: "table", columns: ["", "", "", ""], rows: [] };
      case "prose":
        return { ...base, kind: "prose", meta: [] };
      default:
        return { ...base, kind: r.kind } as unknown as SheetSection;
    }
  });
}

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

test.describe("subpages (ADR-114)", () => {
  for (const route of ROUTES) {
    test(`${route}: the rails are up, every section is lawful, and the ladder obeys the law`, async ({
      page,
    }) => {
      await ready(page, route);
      await expect(page.locator(".hud__rail").first()).toBeVisible();
      const lift = await page
        .locator(".sh-root")
        .evaluate((el) => getComputedStyle(el).getPropertyValue("--hero-lift").trim());
      expect(lift).toBe("1");
      const kinds = await page.$$eval(".sh-sec[data-sh-arrangement]", (els) =>
        els.map((e) => e.getAttribute("data-sh-arrangement"))
      );
      for (const k of kinds) expect(SHEET_ARRANGEMENTS as readonly string[]).toContain(k);
      expect(compositionViolations(await domLadder(page))).toEqual([]);
      // Every head band letters an ordinal on the house knob, none on the split.
      const ords = await page.$$eval(
        ".sh-sec:not(.sh-sec--split):not(.sh-sec--close) .sh-head__ord",
        (els) => els.map((e) => e.textContent?.trim())
      );
      expect(ords.length).toBe(kinds.length - 2);
      for (const o of ords) expect(o).toMatch(/^\d\d \/$/);
      // The first screen's reveals have landed.
      await page.waitForTimeout(700);
      const pending = await page.$$eval(
        ".sh-reveal",
        (els) =>
          els.filter((el) => {
            const b = el.getBoundingClientRect();
            return b.top < innerHeight && b.bottom > 0 && !el.classList.contains("is-in");
          }).length
      );
      expect(pending, "reveals in the first screen").toBe(0);
    });
  }

  for (const [w, h] of VIEWPORTS) {
    test(`nothing overruns the band at ${w}x${h}`, async ({ browser }) => {
      const ctx = await browser.newContext({
        viewport: { width: w, height: h },
        reducedMotion: "no-preference",
      });
      const page = await ctx.newPage();
      for (const route of ROUTES) {
        await ready(page, route);
        const over = await page.evaluate(() => {
          const out: string[] = [];
          if (document.documentElement.scrollWidth > innerWidth + 1)
            out.push(
              `document scrollWidth ${document.documentElement.scrollWidth} > ${innerWidth}`
            );
          const band = document.querySelector(".sh-band") as HTMLElement | null;
          const left = band ? band.getBoundingClientRect().left : 0;
          const right = band ? band.getBoundingClientRect().right : innerWidth;
          for (const el of document.querySelectorAll(".sh-sec *")) {
            if (!(el instanceof HTMLElement)) continue;
            if (el.closest(".sh-hud-root, .ft-foot")) continue;
            const hasText = [...el.childNodes].some(
              (n) => n.nodeType === 3 && n.textContent!.trim().length > 0
            );
            if (!hasText) continue;
            const range = document.createRange();
            range.selectNodeContents(el);
            const r = range.getBoundingClientRect();
            if (r.width === 0) continue;
            if (r.left < left - 1 || r.right > right + 1)
              out.push(
                `${el.className || el.tagName}: ink ${Math.round(r.left)}..${Math.round(r.right)} outside band ${Math.round(left)}..${Math.round(right)}`
              );
            if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflowX !== "visible")
              out.push(
                `${el.className || el.tagName}: clipped ${el.scrollWidth} > ${el.clientWidth}`
              );
          }
          return out.slice(0, 8);
        });
        expect(over, `${route} at ${w}x${h}`).toEqual([]);
      }
      await ctx.close();
    });
  }

  test("the phone reads as one column and nothing sticks", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await ready(page, "/home-sessions");
    const lead = await page.locator(".sh-split__lead").boundingBox();
    const copy = await page.locator(".sh-split__copy").boundingBox();
    expect(
      lead && copy && copy.y > lead.y + lead.height - 1,
      "the copy stacks under the lead"
    ).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true
    );
    await ready(page, "/arcs");
    const pos = await page
      .locator(".sh-console__panel")
      .first()
      .evaluate((el) => getComputedStyle(el).position);
    expect(pos).not.toBe("sticky");
    await ctx.close();
  });

  test("/arcs: every console's readout equals the registry's, and the pile holds every engagement", async ({
    page,
  }) => {
    await ready(page, "/arcs");
    const clients = CLIENTS.filter((c) => clientPageCount(c, arcsOf(c.slug)) > 0);
    for (const client of clients) {
      const rows = await page.$$eval(`article#${client.slug} .sh-readout__row`, (els) =>
        els.map((el) => [
          el.querySelector(".sh-readout__k")?.textContent?.trim(),
          el.querySelector(".sh-readout__v")?.textContent?.trim(),
        ])
      );
      expect(rows, client.slug).toEqual(clientReadout(client).map((r) => [r.label, r.value]));
      const cards = await page.locator(`article#${client.slug} .sh-card`).count();
      expect(cards, `${client.slug}: cards`).toBe(
        arcsOf(client.slug).length + (client.pages?.length ?? 0)
      );
    }
    const pages = clients.reduce((n, c) => n + (c.pages?.length ?? 0), 0);
    await expect(page.locator(".sh-card")).toHaveCount(ARCS.length - houseArcs().length + pages);
    await expect(page.locator("a.sh-cell")).toHaveCount(Math.min(4, houseArcs().length));
    // The kind filter narrows whole consoles, never slots.
    await page
      .locator(".sh-stn", { hasText: /^Keynote/i })
      .first()
      .click();
    await expect(page.locator(".sh-root")).toHaveAttribute("data-sh-kind", "keynote");
    const hidden = await page.$$eval("article.sh-console[hidden]", (els) => els.map((e) => e.id));
    for (const client of clients) {
      const kinds = [
        ...(client.pages ?? []).map((p) => p.kind),
        ...arcsOf(client.slug).map((a) => a.kind ?? "production"),
      ];
      if (!kinds.includes("keynote"))
        expect(hidden, `${client.slug} hides without a keynote`).toContain(client.slug);
    }
  });

  test("/home-sessions: one lit morning, and it is the one open with a mailto seat", async ({
    page,
  }) => {
    await ready(page, "/home-sessions");
    const lit = page.locator(".sh-tl__item.is-lit");
    await expect(lit).toHaveCount(1);
    const litId = await lit.getAttribute("data-id");
    const open = page.locator(".sh-steps__item.is-open");
    await expect(open).toHaveCount(1);
    expect(await open.getAttribute("data-id")).toBe(litId);
    const href = (await open.locator(".sh-cta").getAttribute("href")) ?? "";
    expect(href).toMatch(/^mailto:[^?]+\?subject=/);
    expect(decodeURIComponent(href)).toMatch(/Reserve a seat/);
    // The axis carries month ticks and every item sits inside it.
    const ticks = await page.locator(".sh-tl__tick").count();
    expect(ticks).toBeGreaterThanOrEqual(3);
  });

  test("?k=SD writes its knobs on the root and drops the ordinals", async ({ page }) => {
    await page.goto("/home-sessions?k=SD");
    await page.locator(".sh-root[data-sh-ready]").waitFor({ timeout: 45_000 });
    const root = page.locator(".sh-root");
    await expect(root).toHaveAttribute("data-sh-k", "SD");
    const knobs = knobsFor("SD");
    for (const [key, value] of Object.entries(knobs))
      await expect(root).toHaveAttribute(`data-sh-${key}`, value);
    await expect(page.locator(".sh-head__ord")).toHaveCount(0);
  });

  test("the frame's rails are the page's only verticals (ADR-114 U1)", async ({ page }) => {
    /* The owner, 2026-09-20, off the first gallery: the two full-height rules
       at the band's edges "I do not want those. We already have our rails".
       Asserted as paint, not as a knob: no box between the rails, on any
       route, is a hairline as tall as its section. */
    for (const route of ROUTES) {
      await ready(page, route);
      const verticals = await page.evaluate(() => {
        const out: string[] = [];
        for (const sec of document.querySelectorAll(".sh-sec")) {
          const h = sec.getBoundingClientRect().height;
          for (const pseudo of ["::before", "::after"]) {
            const cs = getComputedStyle(sec, pseudo);
            if (cs.content !== "none" && parseFloat(cs.width) <= 2 && parseFloat(cs.height) > 200)
              out.push(`${sec.id}${pseudo} ${cs.width}x${cs.height}`);
          }
          for (const el of sec.querySelectorAll("*")) {
            if (el.closest(".sh-hud-root, .hud-nav-overlay, .rin-host")) continue;
            const b = el.getBoundingClientRect();
            const bg = getComputedStyle(el).backgroundColor;
            if (b.width <= 2 && b.height > Math.max(240, h * 0.8) && bg !== "rgba(0, 0, 0, 0)")
              out.push(`${sec.id} ${el.className} ${Math.round(b.width)}x${Math.round(b.height)}`);
          }
        }
        return out.slice(0, 6);
      });
      expect(verticals, `${route}: a full-height vertical rule`).toEqual([]);
    }
  });

  test("the kit's pile stacks under a panel that sticks", async ({ page }) => {
    await ready(page, "/test/subpage-kit");
    const section = page.locator("#console-fixture");
    const top = await section.evaluate((el) => el.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => window.scrollTo({ top: y - 96, behavior: "instant" }), top);
    await page.waitForTimeout(400);
    const panel = page.locator("#console-fixture .sh-console__panel");
    const panelTopA = (await panel.boundingBox())!.y;
    await page.mouse.move(640, 400);
    let states: (string | null)[] = [];
    for (let i = 0; i < 120; i++) {
      states = await section.evaluate((el) =>
        [...el.querySelectorAll("[data-pc-slot]")].map((s) => s.getAttribute("data-pc-state"))
      );
      if (states[1] === "pinned") break;
      await page.mouse.wheel(0, 160);
      await page.waitForTimeout(60);
    }
    expect(states.slice(0, 4)).toEqual(["covered", "pinned", "incoming", "incoming"]);
    const panelTopB = (await panel.boundingBox())!.y;
    expect(Math.abs(panelTopA - panelTopB)).toBeLessThanOrEqual(1);
  });

  test("both themes paint their own ground and hold contrast", async ({ page }) => {
    const grounds: string[] = [];
    for (const theme of ["dark", "light"]) {
      await page.goto(`/home-sessions?theme=${theme}`);
      await page.locator(".sh-root[data-sh-ready]").waitFor({ timeout: 45_000 });
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      grounds.push(
        await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
      );
      const prose = await contrastOf(page, ".sh-split__p, .sh-cell__p, .sh-steps__title");
      const chrome = await contrastOf(page, ".sh-head__kicker, .sh-readout__k, .sh-split__name");
      /* 4.5:1 on BOTH: every string here is under 18.66px, so WCAG's large-text
         relaxation never applies, and the mechanical gate holds the site to
         the same floor (the first run measured the readout label at 3.19). */
      for (const c of prose) expect(c, `${theme}: prose contrast`).toBeGreaterThanOrEqual(4.5);
      for (const c of chrome) expect(c, `${theme}: chrome contrast`).toBeGreaterThanOrEqual(4.5);
    }
    expect(grounds[0]).not.toBe(grounds[1]);
  });
});
