import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import sharp from "sharp";

import {
  BOARD_BOX_PX,
  CFG_FLOOR_PX,
  CONFIG_CROPS,
  CROP_SWITCH,
  cropFor,
} from "@/components/sheet/config/configLayout";
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
 *   - since U1, a block of another size, text that clips, a list that ends
 *     short of the dossier's floor while it could reach it;
 *   - since U2, a section head off the dossier's band, an icon inside its
 *     plate, a notch on the wrong corner, a ring that thins to nothing at
 *     mid-height, a board on a page with no configuration (or none on a
 *     proposal), a crop that is not the one its box asks for, type under the
 *     floor, and words on the die the die's own ink swallows;
 *   - keys that stop at a section's edge, or walk into a row off the screen;
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
/** The engagements whose dossier draws a configuration: the proposals. */
const CONFIGURED = new Set([
  "hungry-minds-proposal",
  "perfect-ted-proposal",
  "suri-proposal",
  "trinny-london-pitch",
]);

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

/**
 * The seated log's geometry (ADR-118 U1, U2): the gutter, the section heads,
 * the blocks and the floor, each with the TOKEN it answers to.
 *
 * ⚠ A TOKEN IS A STRING UNTIL SOMETHING LAYS IT OUT: `--log-gutter`,
 * `--log-block-h` and `--log-block-min` are clamp()s or lengths, so each is
 * resolved by a probe element laid out in the list — the block height's probe
 * MUST sit inside `.sh-log__list`, which is where `--log-n` and `--log-heads`
 * live and where the token is declared.
 */
async function readLog(page: Page) {
  return page.evaluate(() => {
    const r = (el: Element) => el.getBoundingClientRect();
    const q = (sel: string) => document.querySelector<HTMLElement>(sel)!;
    const list = q(".sh-log__list");
    const dos = q(".sh-log__dossiers");
    const probe = (prop: "width" | "height", token: string) => {
      const p = document.createElement("div");
      p.style[prop] = `var(${token})`;
      list.appendChild(p);
      const v = r(p)[prop];
      p.remove();
      return v;
    };
    const blocks = [...document.querySelectorAll<HTMLElement>(".sh-log__row")];
    const heads = [...document.querySelectorAll<HTMLElement>(".sh-log__head")];
    const d = q(".sh-dos:not([hidden]) .sh-dos__in");
    return {
      monBottom: r(q("#monitor")).bottom,
      listTop: r(list).top,
      dosTop: r(dos).top,
      dosBottom: r(dos).bottom,
      gutter: r(dos).left - r(list).right,
      gutterToken: probe("width", "--log-gutter"),
      headBottom: r(heads[0]).bottom,
      bandBottom: r(d.querySelector(".sh-dos__band")!).bottom,
      heads: heads.length,
      logHeads: Number(list.style.getPropertyValue("--log-heads")),
      blocks: blocks.length,
      logN: Number(list.style.getPropertyValue("--log-n")),
      blockToken: probe("height", "--log-block-h"),
      floorClamp: probe("height", "--log-block-min"),
      ceilClamp: 0.09 * innerHeight,
      heights: blocks.map((b) => r(b).height),
      lastBottom: r(blocks[blocks.length - 1]).bottom,
      // The icon sits LEFT of its plate, outside it (the codex's arrangement).
      iconInside: blocks
        .filter(
          (b) => r(b.querySelector(".sh-glyph")!).right > r(b.querySelector(".sh-log__plate")!).left
        )
        .map((b) => b.dataset.id),
      clipped: blocks.flatMap((b) =>
        [".sh-log__name", ".sh-log__eng", ".sh-log__date"]
          .map((sel) => b.querySelector<HTMLElement>(sel)!)
          .filter((t) => t.scrollWidth > t.clientWidth + 1 || t.getClientRects().length > 1)
          .map((t) => `${b.dataset.id} ${t.className}`)
      ),
      dossierClipped: r(d.querySelector(".sh-dos__foot")!).bottom > r(d).bottom + 1,
    };
  });
}

function expectSeatedLog(s: Awaited<ReturnType<typeof readLog>>) {
  expect(Math.abs(s.listTop - s.dosTop), "the dossier is level with the list").toBeLessThanOrEqual(
    1
  );
  expect(
    Math.abs(s.gutter - s.gutterToken),
    `the gutter is --log-gutter (${s.gutter.toFixed(1)} vs ${s.gutterToken.toFixed(1)})`
  ).toBeLessThanOrEqual(1);
  expect(s.gutter, "breathing room between the panels (owner, ADR-118 U1)").toBeGreaterThanOrEqual(
    47
  );
  expect(
    Math.abs(s.headBottom - s.bandBottom),
    "the first section head is level with the dossier's band"
  ).toBeLessThanOrEqual(1);
  expect(s.logHeads, "--log-heads counts every section head").toBe(s.heads);
  expect(s.logN, "--log-n counts every block").toBe(s.blocks);
  // ⚠ A TRANSFORMED OR FRACTIONAL RECT NEEDS AN EPSILON; half a pixel is it.
  expect(
    s.heights.filter((h) => Math.abs(h - s.blockToken) > 0.5).map((h) => h.toFixed(2)),
    `every block is --log-block-h (${s.blockToken.toFixed(2)})`
  ).toEqual([]);
  // One floor — while the block height is free to divide the device. At the
  // floor the list runs on past the dossier (owner: "I don't mind that it
  // extends beyond the viewport section"); at the ceiling it ends short.
  if (s.blockToken > s.floorClamp + 0.5 && s.blockToken < s.ceilClamp - 0.5)
    expect(
      Math.abs(s.lastBottom - s.dosBottom),
      `the list ends on the dossier's floor (${s.lastBottom.toFixed(1)} vs ${s.dosBottom.toFixed(1)})`
    ).toBeLessThanOrEqual(1);
  else if (s.blockToken <= s.floorClamp + 0.5)
    expect(s.lastBottom, "at the floor the list runs past the dossier").toBeGreaterThan(
      s.dosBottom - 1
    );
  expect(s.iconInside, "an icon inside its plate").toEqual([]);
  expect(s.clipped, "block text that clips or wraps").toEqual([]);
  expect(s.dossierClipped, "the dossier's foot is inside its housing").toBe(false);
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
        // …so the frame's wordmark and chapter row never print over it, and the
        // wordmark is CLEAR of it: beside the device's column by at least the
        // floor of the frame's breathing gap, or under it by the whole gap
        // (clamp(16px, 1.8vw, 32px)). "Under the device" alone passed while
        // the hero-size lockup sat 7px beneath the monitor's corner at
        // 1280 × 720, 108px inside its column — it is docked from the first
        // frame now. ⚠ The vertical clearance IS the frame's own rail-to-
        // wordmark gap (the device ends on the rail), 24.8px at 1440 × 800
        // against a nominal 25.9, so it cannot be the only way to pass.
        if (g.brand) {
          const gap = Math.min(32, Math.max(16, 0.018 * w));
          const clearX = g.device.left - g.brand.right;
          const clearY = g.brand.top - g.device.bottom;
          expect(clearY, "the wordmark sits under the device").toBeGreaterThanOrEqual(-1);
          expect(
            clearX >= 16 || clearY >= gap - 1,
            `the wordmark clears the device (beside ${clearX.toFixed(1)}px, under ${clearY.toFixed(1)}px, gap ${gap.toFixed(1)}px)`
          ).toBe(true);
        }
        if (g.nav && g.nav.height > 0)
          expect(g.nav.bottom, "the chapter row sits over the device").toBeLessThanOrEqual(
            g.device.top + 1
          );
        expect(g.scrollW).toBeLessThanOrEqual(w + 1);

        // Seated, nothing of the monitor is in view, and the list and the
        // dossier share a datum, a gutter apart (ADR-118 U1, U2).
        await seatLog(page);
        const s = await readLog(page);
        expect(s.monBottom).toBeLessThanOrEqual(1);
        expectSeatedLog(s);
      });

      test(`the kit's log keeps the same seat, on a record of eight, at ${w}x${h}`, async ({
        page,
      }) => {
        const res = await page.goto("/test/arcs-instrument-kit");
        test.skip(
          res?.status() === 404,
          "the kit is internal: proxy-blocked on a production server"
        );
        await open(page, "/test/arcs-instrument-kit");
        await seatLog(page);
        const s = await readLog(page);
        expect(s.blocks, "the kit's record").toBe(8);
        expectSeatedLog(s);
      });

      test(`the board is the crop its box asks for, filled, lettered above the floor, at ${w}x${h}`, async ({
        page,
      }) => {
        await open(page);
        await seatLog(page);
        const b = await readBoard(page);
        expect(b, "the newest proposal draws its configuration").not.toBeNull();
        if (!b) return;
        const want = cropFor(b.box.w, b.box.h);
        expect(b.crops, "one crop is shown").toEqual([want]);
        const pinned = BOARD_BOX_PX[`${w}x${h}` as keyof typeof BOARD_BOX_PX];
        if (pinned) {
          expect(
            Math.abs(b.box.w - pinned.w) / pinned.w,
            "the box the floor is set against (w)"
          ).toBeLessThan(0.02);
          expect(
            Math.abs(b.box.h - pinned.h) / pinned.h,
            "the box the floor is set against (h)"
          ).toBeLessThan(0.02);
        }
        expect(b.fill, `the ${want} crop fills its box`).toBeGreaterThan(0.9);
        expect(b.minName, "a name on the board").toBeGreaterThanOrEqual(CFG_FLOOR_PX.name - 0.05);
        expect(b.minKicker, "a kicker on the board").toBeGreaterThanOrEqual(
          CFG_FLOOR_PX.kicker - 0.05
        );
        expect(b.overlaps, "two of the board's words print through each other").toEqual([]);
        expect(
          b.knock.every((c) => c >= 4.5),
          `the die's words on its ink: ${b.knock.join(", ")}`
        ).toBe(true);
      });
    });
  }

  /* ⚠ THE NARROW DESKTOP RUNG (961–1100). A block's mono line holds the
     bracketed engagement and the date side by side; at 5/12 of the band it
     clipped at 961, so the list takes half there. */
  for (const [w, h] of [
    [1024, 768],
    [961, 700],
  ] as const) {
    test.describe(`at the narrow rung, ${w}x${h}`, () => {
      test.use({
        viewport: { width: w, height: h },
        contextOptions: { reducedMotion: "no-preference" },
      });
      test(`every block keeps its lines unclipped, at ${w}x${h}`, async ({ page }) => {
        await open(page);
        await seatLog(page);
        expectSeatedLog(await readLog(page));
        const b = await readBoard(page);
        expect(b?.crops, "under 480px wide the board stacks").toEqual(["narrow"]);
        expect(b!.box.w).toBeLessThan(CROP_SWITCH.minWidthPx);
      });
    });
  }

  test("every block's notch is bottom-left, and its ring holds at mid-height", async ({ page }) => {
    await open(page);
    await seatLog(page);
    const corners = await page.evaluate(() => {
      const plate = document.querySelectorAll<HTMLElement>(
        ".sh-log__row:not(.is-on) .sh-log__plate"
      )[0];
      const b = plate.getBoundingClientRect();
      const probe = document.createElement("div");
      probe.style.width = "var(--log-ch)";
      plate.appendChild(probe);
      const ch = probe.getBoundingClientRect().width;
      probe.remove();
      const i = ch * 0.35;
      const at = (x: number, y: number) => plate.contains(document.elementFromPoint(x, y));
      return {
        ch,
        tl: at(b.left + i, b.top + i),
        tr: at(b.right - i, b.top + i),
        br: at(b.right - i, b.bottom - i),
        bl: at(b.left + i, b.bottom - i),
        box: { x: b.left, y: b.top, w: b.width, h: b.height },
      };
    });
    // ⚠ PINNED FROM BOTH ENDS (ADR-065 U4/U5): the cut EXISTS at BL, and the
    // other three corners are square.
    expect(corners.ch).toBeGreaterThan(8);
    expect(corners.bl, "the bottom-left corner is cut").toBe(false);
    expect([corners.tl, corners.tr, corners.br], "the other three are square").toEqual([
      true,
      true,
      true,
    ]);

    /* THE RING'S LEFT EDGE, READ AS PIXELS, ON A BLOCK AND ON THE DOSSIER.
       The first cut wrote both contours as one open path and `evenodd` painted
       a bow-tie: on the tall housings a full edge at the corners and nothing at
       mid-height, on a 50px block a half-strength edge all the way down. A DOM
       walk cannot see a `::before`'s paint, so the edges are shot and read:
       the left edge at mid-height must carry most of the top edge's energy at
       mid-width, whatever sub-pixel the box sits on. Measured at 1440 × 800,
       1440 × 900 and 1920 × 1247: closed 0.88–1.21 on a block and 0.64–0.79
       on the dossier; the open path 0.31–0.52 and 0.16–0.27. The thresholds
       sit between the two on each object. */
    expect(await ringRatio(page, corners.box), "a block's left edge at mid-height").toBeGreaterThan(
      0.65
    );
    const dos = await page.evaluate(() =>
      document.querySelector(".sh-dos:not([hidden]) .sh-dos__in")!.getBoundingClientRect().toJSON()
    );
    expect(
      await ringRatio(page, { x: dos.x, y: dos.y, w: dos.width, h: dos.height }),
      "the dossier's left edge at mid-height"
    ).toBeGreaterThan(0.5);
  });

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

  test("every row opens ITS dossier: name, date, target and board agree", async ({ page }) => {
    await open(page);
    await seatLog(page);
    const rows = await page.$$eval(".sh-log__row", (els) =>
      els.map((el) => ({
        id: el.getAttribute("data-id")!,
        href: el.getAttribute("href")!,
        name: el.querySelector(".sh-log__name")!.textContent!.trim(),
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
          [...one.querySelectorAll(".sh-dos__reading")].map((r) => [
            r.querySelector("dt")!.textContent!.trim(),
            r.querySelector("dd")!.textContent!.trim(),
          ])
        );
        return {
          shown: shown.length,
          id: one.dataset.id,
          title: one.getAttribute("aria-label") ?? "",
          desig: one.querySelector(".sh-dos__desig")!.textContent!.trim(),
          filed: read.Filed,
          cta: one.querySelector(".sh-cta")!.getAttribute("href"),
          board: one.querySelectorAll(".sh-cfg").length,
          images: one.querySelectorAll("img").length,
          running: one.getAnimations({ subtree: true }).some((a) => a.playState === "running"),
          swapping: one.classList.contains("is-swap"),
        };
      });
      expect(d.shown, row.id).toBe(1);
      expect(d.id, row.id).toBe(row.id);
      // SETTLED means the aperture has opened: nothing still running on it.
      expect(d.running || d.swapping, `${row.id} settled mid-swap`).toBe(false);
      // A client's block names the client its dossier's band designates; a
      // house format's names its own title ("The Loop portfolio" carries no
      // client prefix, so the title alone cannot say whose it is).
      expect(
        d.desig === `// ${row.name}` || d.title.includes(row.name),
        `${d.desig} · ${d.title} / ${row.name}`
      ).toBe(true);
      expect(d.filed, row.id).toBe(letterDateShort(byHref.get(row.href)!));
      expect(d.cta, row.id).toBe(row.href);
      expect(d.images, `${row.id}: the dossier's picture is gone (U2)`).toBe(0);
      expect(d.board, `${row.id}: a board`).toBe(CONFIGURED.has(row.id) ? 1 : 0);
    }
    // The choice is in the address, and the address chooses.
    expect(page.url()).toMatch(new RegExp(`#arc=${rows[rows.length - 1].id}$`));
  });

  test("the keys walk every row across the sections, bring it into view, and Enter opens", async ({
    page,
  }) => {
    await open(page);
    await seatLog(page);
    const order = await page.$$eval(".sh-log__sec", (secs) =>
      secs.map((s) =>
        [...s.querySelectorAll(".sh-log__row")].map((r) => r.getAttribute("data-id")!)
      )
    );
    expect(order.length, "the kinds divide the list").toBeGreaterThan(1);
    // The last row of the first section steps into the first of the second.
    const [from, to] = [order[0][order[0].length - 1], order[1][0]];
    await page.locator(`.sh-log__row[data-id="${from}"]`).focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator(".sh-root")).toHaveAttribute("data-dos-id", to);
    expect(await page.evaluate(() => document.activeElement?.getAttribute("data-id"))).toBe(to);
    // The step brought the row fully into view, whatever the list's length.
    const box = await page.locator(`.sh-log__row[data-id="${to}"]`).boundingBox();
    const vh = page.viewportSize()!.height;
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(vh + 0.5);
    await page.keyboard.press("ArrowUp");
    await expect(page.locator(".sh-root")).toHaveAttribute("data-dos-id", from);
    const href = await page.locator(`.sh-log__row[data-id="${from}"]`).getAttribute("href");
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

  test("a deep link to the row the server already chose still settles", async ({ page }) => {
    /* U2: `select()` does nothing for the current id, and until the picture
       went only its decode promise wrote the observable on that path. */
    const newest = await (async () => {
      await open(page);
      return page.locator('.sh-log__row[aria-current="true"]').getAttribute("data-id");
    })();
    await open(page, `/arcs#arc=${newest}`);
    await expect(page.locator(".sh-root")).toHaveAttribute("data-dos-id", newest!);
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

  test("the kit draws what the record does not hold: a same-day pair, a run, an entering lane, the ceiling", async ({
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
    // The ceiling: four workstreams, a ghost, eight links, on the page.
    await seatLog(page);
    const cfg = page.locator(".sh-dos:not([hidden]) .sh-cfg");
    await expect(cfg).toHaveAttribute("data-cfg-rows", "5");
    await expect(cfg).toHaveAttribute("data-cfg-links", "8");
    const b2 = await readBoard(page);
    expect(b2?.overlaps).toEqual([]);
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
        ".sh-mon__reading dt, .sh-mon__reading dd, .sh-mon__cell-label, .sh-mon__lane-name, .sh-mon__lane-reading, .sh-mon__tick, .sh-log__head-name, .sh-log__head-n, .sh-log__name, .sh-log__eng, .sh-log__date, .sh-dos:not([hidden]) .sh-dos__reading dt, .sh-dos:not([hidden]) .sh-dos__reading dd, .sh-dos:not([hidden]) .sh-dos__lede",
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
      // And the board's own words, on their own fills (a DOM walk reads the
      // die's ground as the page's — its ink is an SVG fill).
      await seatLog(page);
      const b = await readBoard(page);
      expect(
        b!.knock.every((c) => c >= 4.5),
        `${theme}: the die's words ${b!.knock.join(", ")}`
      ).toBe(true);
      expect(
        b!.chips.every((c) => c >= 4.5),
        `${theme}: the chips' words ${b!.chips.join(", ")}`
      ).toBe(true);
    }
  });
});

/**
 * How much of a clipped ring's top edge its left edge carries, at mid-height:
 * both strips are six pixels across the edge, each pixel's distance from the
 * strip's inner end summed, so a 1px line split across two device pixels
 * counts the same as one landing on a single pixel. 1 is a whole ring.
 */
async function ringRatio(page: Page, box: { x: number; y: number; w: number; h: number }) {
  const strip = async (clip: { x: number; y: number; width: number; height: number }) => {
    const shot = await page.screenshot({ clip });
    const { data, info } = await sharp(shot).raw().toBuffer({ resolveWithObject: true });
    const px: number[] = [];
    for (let i = 0; i < info.width * info.height; i++)
      px.push(
        (data[i * info.channels] + data[i * info.channels + 1] + data[i * info.channels + 2]) / 3
      );
    const base = px[px.length - 1]; // the inner end, on the plate
    return px.reduce((sum, v) => sum + Math.abs(v - base), 0);
  };
  const left = await strip({
    x: Math.floor(box.x) - 2,
    y: Math.round(box.y + box.h / 2),
    width: 6,
    height: 1,
  });
  const top = await strip({
    x: Math.round(box.x + box.w / 2),
    y: Math.floor(box.y) - 2,
    width: 1,
    height: 6,
  });
  return top > 0 ? left / top : 0;
}

/**
 * The shown dossier's board, read in the browser: its box, the crop the page
 * shows, how much of the box it fills, the smallest name and kicker it paints,
 * any two words that print through each other, and the contrast of the die's
 * and the chips' words on their own fills.
 */
async function readBoard(page: Page) {
  const crops = CONFIG_CROPS.map((c) => ({ id: c.id, w: c.w, h: c.h }));
  return page.evaluate((cropList) => {
    const cfg = document.querySelector<HTMLElement>(".sh-dos:not([hidden]) .sh-cfg");
    if (!cfg) return null;
    const box = cfg.getBoundingClientRect();
    const shown = [...cfg.querySelectorAll<SVGSVGElement>(".sh-cfg__crop")].filter(
      (s) => getComputedStyle(s).display !== "none"
    );
    const svg = shown[0];
    const crop = cropList.find((c) => c.id === svg.dataset.crop)!;
    const s = Math.min(box.width / crop.w, box.height / crop.h);
    const fill = (crop.w * s * crop.h * s) / (box.width * box.height);
    const texts = [...svg.querySelectorAll<SVGTextElement>("text")];
    const px = (t: SVGTextElement) =>
      t.getScreenCTM()!.a * parseFloat(t.getAttribute("font-size")!);
    const mono = (t: SVGTextElement) => t.classList.contains("sh-cfg__t--mono");
    const rects = texts.map((t) => ({ t, b: t.getBoundingClientRect() }));
    const overlaps: string[] = [];
    for (let i = 0; i < rects.length; i++)
      for (let j = i + 1; j < rects.length; j++) {
        const [a, b] = [rects[i].b, rects[j].b];
        const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ix > 1 && iy > 1)
          overlaps.push(`${rects[i].t.textContent} / ${rects[j].t.textContent}`);
      }
    const parse = (str: string) => {
      const m = str.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const p = m[1]
          .split(/[,/\s]+/)
          .filter(Boolean)
          .map(parseFloat);
        return { r: p[0], g: p[1], b: p[2] };
      }
      const c = str.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/);
      if (c) return { r: +c[1] * 255, g: +c[2] * 255, b: +c[3] * 255 };
      return null;
    };
    const lum = (c: { r: number; g: number; b: number }) => {
      const f = (v: number) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    };
    const ratio = (fg: string, bg: string) => {
      const [a, b] = [parse(fg), parse(bg)];
      if (!a || !b) return 0;
      const [l1, l2] = [lum(a), lum(b)];
      return +((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2);
    };
    const dieFill = getComputedStyle(svg.querySelector(".sh-cfg__die-plate")!).fill;
    const chipFill = getComputedStyle(svg.querySelector(".sh-cfg__chip-plate")!).fill;
    const onDie = texts.filter((t) => /knock/.test(t.getAttribute("class") ?? ""));
    const onChip = texts.filter((t) => /--ink/.test(t.getAttribute("class") ?? ""));
    return {
      box: { w: +box.width.toFixed(1), h: +box.height.toFixed(1) },
      crops: shown.map((x) => x.dataset.crop),
      fill,
      minName: Math.min(...texts.filter((t) => !mono(t)).map(px)),
      minKicker: Math.min(...texts.filter(mono).map(px)),
      overlaps,
      knock: onDie.map((t) => ratio(getComputedStyle(t).fill, dieFill)),
      chips: onChip.map((t) => ratio(getComputedStyle(t).fill, chipFill)),
    };
  }, crops);
}
