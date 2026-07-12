import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * #tools structural smoke (ADR-030, calibrated edge-bus rebuild).
 *
 * Geometry and state contracts only — deliberately no screenshot baselines.
 * The suite protects the reversible Services handoff, the rail-owned mode
 * register, the fixed Tools datum, and the compact sticky deck while keeping
 * the base-capability path ordinary document flow.
 */

test.describe.configure({ mode: "serial" });

const BASE_URL = process.env.BASE_URL || "http://localhost:3003";

function isCorridorDesktop(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) >= 961;
}

function isEnhancedViewport(page: Page): boolean {
  const viewport = page.viewportSize();
  return (viewport?.width ?? 0) >= 1101 && (viewport?.height ?? 0) >= 760;
}

async function openViewport(
  browser: Browser,
  viewport: { width: number; height: number },
  reducedMotion: "reduce" | "no-preference" = "no-preference"
) {
  const context = await browser.newContext({ baseURL: BASE_URL, viewport, reducedMotion });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#tools [data-pc-slot]", {
    state: "attached",
    timeout: 15_000,
  });
  return { context, page };
}

async function waitForScrollSettle(page: Page): Promise<void> {
  let previous = -1;
  let stableFrames = 0;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(100);
    const current = await page.evaluate(() => window.scrollY);
    if (Math.abs(current - previous) < 0.5) {
      stableFrames += 1;
      if (stableFrames >= 2) return;
    } else {
      stableFrames = 0;
    }
    previous = current;
  }
}

/** Scroll so `#tools`'s top lands at `topVhFraction` of the viewport.
 * This intentionally rides the authored smooth-scroll path: instant jumps
 * can skip the corridor engagement band used by the compositing probes. */
async function scrollToolsTopTo(page: Page, topVhFraction: number): Promise<boolean> {
  const target = await page.evaluate((fraction) => {
    const tools = document.querySelector("#tools");
    if (!tools) return null;
    const rect = tools.getBoundingClientRect();
    return Math.round(window.scrollY + rect.top - window.innerHeight * fraction);
  }, topVhFraction);
  if (target == null) return false;
  await page.evaluate((y) => window.scrollTo(0, y), target);
  await waitForScrollSettle(page);
  return true;
}

/** Scroll the Services runway to normalized progress p (0..1). */
async function scrollServicesRunway(page: Page, progress: number): Promise<boolean> {
  const target = await page.evaluate((p) => {
    const runway = document.querySelector(".services-stage-root");
    if (!runway) return null;
    const rect = runway.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const travel = Math.max(0, rect.height - window.innerHeight);
    return Math.round(top + travel * p);
  }, progress);
  if (target == null) return false;
  await page.evaluate((y) => window.scrollTo(0, y), target);
  await waitForScrollSettle(page);
  return true;
}

/** Land one card on the sticky top resolved by CSS. The tiny overshoot
 * makes the hook's pure rect math settle at enter=1 without duplicating a
 * pixel constant in the test. */
async function dockToolSlot(page: Page, index: number): Promise<void> {
  const target = await page.evaluate((slotIndex) => {
    const slot = document.querySelectorAll<HTMLElement>("#tools [data-pc-slot]")[slotIndex];
    if (!slot) return null;
    const stickyTop = Number.parseFloat(getComputedStyle(slot).top);
    if (!Number.isFinite(stickyTop)) return null;
    const rect = slot.getBoundingClientRect();
    return Math.round(window.scrollY + rect.top - stickyTop + 2);
  }, index);
  expect(target).not.toBeNull();

  // The deck watcher is a pure scroll/rect reader, so an instant test move
  // is safe here and keeps the multi-viewport geometry matrix fast.
  await page.evaluate((y) => {
    const html = document.documentElement;
    const previous = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, y ?? 0);
    html.style.scrollBehavior = previous;
  }, target);

  await expect
    .poll(() => page.locator("#tools .pcl-stack").getAttribute("data-pc-active"), {
      timeout: 5_000,
    })
    .toBe(String(index));
  await page.waitForTimeout(300);
}

async function assertEnhancedDeckGeometry(page: Page, viewportLabel: string): Promise<void> {
  let fixedHeaderTop: number | null = null;

  for (let activeIndex = 0; activeIndex < 4; activeIndex++) {
    await dockToolSlot(page, activeIndex);

    const geometry = await page.evaluate((index) => {
      const header = document.querySelector<HTMLElement>("#tools .tools__head")!;
      const slots = Array.from(document.querySelectorAll<HTMLElement>("#tools [data-pc-slot]"));
      const cards = Array.from(document.querySelectorAll<HTMLElement>("#tools .pcl-card"));
      const corner = document.querySelector<HTMLElement>(".hud__corner--br")!;
      const headerRect = header.getBoundingClientRect();
      const slotRects = slots.map((slot) => slot.getBoundingClientRect());
      const cardRects = cards.map((card) => card.getBoundingClientRect());
      const hudMargin = window.innerHeight - corner.getBoundingClientRect().bottom;

      return {
        activeStation: document.documentElement.getAttribute("data-active-station"),
        headerPosition: getComputedStyle(header).position,
        headerOpacity: Number.parseFloat(getComputedStyle(header).opacity),
        headerTop: headerRect.top,
        headerBottom: headerRect.bottom,
        activeTop: slotRects[index].top,
        activeBottom: cardRects[index].bottom,
        bottomLimit: window.innerHeight - Math.max(24, hudMargin),
        states: slots.map((slot) => slot.getAttribute("data-pc-state")),
        current: slots
          .map((slot, slotIndex) => (slot.hasAttribute("data-pc-current") ? slotIndex : -1))
          .filter((slotIndex) => slotIndex >= 0),
        coveredPeeks: slotRects.slice(0, index).map((rect, slotIndex) => ({
          delta: slotRects[slotIndex + 1].top - rect.top,
          headerHeight: slots[slotIndex]
            .querySelector<HTMLElement>(".pcl-card__head")!
            .getBoundingClientRect().height,
        })),
      };
    }, activeIndex);

    expect(geometry.activeStation, `${viewportLabel}: Tools owns the viewscreen`).toBe("tools");
    expect(geometry.headerPosition, `${viewportLabel}: fixed mode header`).toBe("fixed");
    expect(geometry.headerOpacity, `${viewportLabel}: header materialized`).toBeGreaterThan(0.9);

    if (fixedHeaderTop == null) fixedHeaderTop = geometry.headerTop;
    expect(
      Math.abs(geometry.headerTop - fixedHeaderTop),
      `${viewportLabel}: header does not ride the card runway`
    ).toBeLessThanOrEqual(1);

    expect(
      geometry.activeTop - geometry.headerBottom,
      `${viewportLabel}: active card remains below the header datum`
    ).toBeGreaterThanOrEqual(15);
    expect(
      geometry.activeBottom,
      `${viewportLabel}: active card clears the bottom HUD margin`
    ).toBeLessThanOrEqual(geometry.bottomLimit + 1.5);
    expect(geometry.current, `${viewportLabel}: one filled identifier`).toEqual([activeIndex]);

    for (let covered = 0; covered < activeIndex; covered++) {
      expect(
        geometry.states[covered],
        `${viewportLabel}: prior unit ${covered + 1} is covered`
      ).toBe("covered");
      expect(
        geometry.coveredPeeks[covered].delta,
        `${viewportLabel}: covered unit exposes only its header strip`
      ).toBeGreaterThanOrEqual(31.5);
      expect(geometry.coveredPeeks[covered].delta).toBeLessThanOrEqual(36.5);
      expect(
        geometry.coveredPeeks[covered].headerHeight,
        `${viewportLabel}: card header tape stays compact`
      ).toBeGreaterThanOrEqual(35.5);
      expect(geometry.coveredPeeks[covered].headerHeight).toBeLessThanOrEqual(40.5);
      expect(
        geometry.coveredPeeks[covered].delta,
        `${viewportLabel}: the next plate covers the remainder of the tape`
      ).toBeLessThanOrEqual(geometry.coveredPeeks[covered].headerHeight + 0.5);
    }
  }
}

test.describe("Tools section smoke (ADR-030 edge-bus rebuild)", () => {
  test("desktop: #tools follows the runway in normal flow — no cover overlap", async ({ page }) => {
    test.skip(!isCorridorDesktop(page), "the seam choreography is desktop-only (>=961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#tools [data-pc-slot]", {
      state: "attached",
      timeout: 15_000,
    });

    const layout = await page.evaluate(() => {
      const tools = document.querySelector("#tools")!;
      const services = document.querySelector("#services")!;
      const toolsRect = tools.getBoundingClientRect();
      const servicesRect = services.getBoundingClientRect();
      return {
        marginTop: getComputedStyle(tools).marginTop,
        seamGap: toolsRect.top - servicesRect.bottom,
      };
    });
    expect(layout.marginTop).toBe("0px");
    expect(Math.abs(layout.seamGap)).toBeLessThanOrEqual(2);
  });

  test("desktop: transparent lead-in over the ambient canvas, opaque before it dies", async ({
    page,
  }) => {
    test.skip(!isCorridorDesktop(page), "the transparent lead-in is desktop-only (>=961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#tools [data-pc-slot]", {
      state: "attached",
      timeout: 15_000,
    });

    // The ambient band needs the real corridor pipeline — skip on the
    // WebGL fallback so CI stays honest headless.
    const fallback = await page.evaluate(
      () => document.querySelector<HTMLElement>(".home-v2-stage")?.dataset.fallback === "true"
    );
    test.skip(fallback, "corridor WebGL fallback — no ambient band to probe");

    expect(await scrollToolsTopTo(page, 0.4)).toBe(true);
    await page.waitForTimeout(600);
    const midLeadIn = await page.evaluate(() => {
      const tools = document.querySelector("#tools")!;
      const before = getComputedStyle(tools, "::before");
      return {
        ambient: document.documentElement.getAttribute("data-services-ambient"),
        exit: document.documentElement.getAttribute("data-corridor-exit"),
        background: getComputedStyle(tools).backgroundColor,
        beforeOpacity: Number.parseFloat(before.opacity),
      };
    });
    expect(midLeadIn.ambient).toBe("true");
    expect(midLeadIn.exit).toBe("true");
    expect(midLeadIn.background).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|transparent/);
    expect(midLeadIn.beforeOpacity).toBeLessThan(1);

    expect(await scrollToolsTopTo(page, -0.9)).toBe(true);
    await page.waitForTimeout(600);
    const settled = await page.evaluate(() => ({
      ambient: document.documentElement.getAttribute("data-services-ambient"),
      background: getComputedStyle(document.querySelector("#tools")!).backgroundColor,
    }));
    expect(settled.ambient).toBeNull();
    expect(settled.background).toBe("rgb(10, 9, 8)");
  });

  test("desktop: wheel-down at the last service passes through; wheel-up mid-exit reverses", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    test.skip(!isCorridorDesktop(page), "the services wheel is desktop-only (>=961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#tools [data-pc-slot]", {
      state: "attached",
      timeout: 15_000,
    });

    expect(await scrollServicesRunway(page, 0.75)).toBe(true);
    await page.waitForTimeout(3000);
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(720, 300);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(700);
    const afterDown = await page.evaluate(() => window.scrollY);
    expect(afterDown).toBeGreaterThan(before);

    expect(await scrollServicesRunway(page, 0.92)).toBe(true);
    await page.waitForTimeout(500);
    const midExit = await page.evaluate(() => window.scrollY);
    await page.mouse.move(720, 300);
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(700);
    const afterUp = await page.evaluate(() => window.scrollY);
    expect(afterUp).toBeLessThan(midExit);
  });

  test("enhanced desktop: right rail restores service bus, tool units, and reverse state", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    test.skip(!isEnhancedViewport(page), "the edge-bus register needs the enhanced capability");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#tools [data-pc-slot]", {
      state: "attached",
      timeout: 15_000,
    });
    await page.waitForSelector(".tools-rail-register", { state: "attached", timeout: 15_000 });
    await expect(page.locator(".pcl-rail")).toHaveCount(0);

    const fallback = await page.evaluate(
      () => document.querySelector<HTMLElement>(".home-v2-stage")?.dataset.fallback === "true"
    );
    test.skip(fallback, "corridor WebGL fallback — no reversible Services bus to probe");

    // Whole-section presence (ADR-030 Update 3): mid-runway the register is
    // already seated — all four rows visible with exactly one active row
    // tracking the open service (p≈0.45 → step 2 → row index 1, whose
    // authored id is "workshop" under the verb remap).
    expect(await scrollServicesRunway(page, 0.45)).toBe(true);
    await expect
      .poll(() => page.locator(".tools-rail-register").getAttribute("data-register-mode"))
      .toBe("services");
    const midRunway = await page.evaluate(() => {
      const rows = Array.from(
        document.querySelectorAll<HTMLElement>(".tools-rail-register__row--service")
      );
      return {
        visible: rows.map((row) => getComputedStyle(row).visibility),
        activeIds: rows
          .filter((row) => row.hasAttribute("data-active"))
          .map((row) => row.dataset.serviceId),
      };
    });
    expect(midRunway.visible).toEqual(["visible", "visible", "visible", "visible"]);
    expect(midRunway.activeIds).toEqual(["workshop"]);

    // Finish the Services runway: all four service rows remain seated on
    // the canonical right guide before the viewscreen changes mode.
    expect(await scrollServicesRunway(page, 1)).toBe(true);
    await expect
      .poll(() => page.locator(".tools-rail-register").getAttribute("data-register-mode"))
      .toBe("services");

    const serviceBus = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>(".hud__rail--r .hud__rail__track")!;
      const trackRect = track.getBoundingClientRect();
      const rows = Array.from(
        document.querySelectorAll<HTMLElement>(".tools-rail-register__row--service")
      );
      return {
        heading: document
          .querySelector<HTMLElement>(".tools-rail-register__heading--services")
          ?.textContent?.trim(),
        labels: rows.map((row) => row.querySelector(".tools-rail-register__name")?.textContent),
        markerTops: rows.map(
          (row) =>
            row.querySelector<HTMLElement>(".tools-rail-register__marker")!.getBoundingClientRect()
              .top
        ),
        rows: rows.map((row) => {
          const marker = row.querySelector<HTMLElement>(".tools-rail-register__marker")!;
          const markerRect = marker.getBoundingClientRect();
          const leader = getComputedStyle(marker, "::before");
          const rowStyle = getComputedStyle(row);
          return {
            visible: rowStyle.visibility === "visible",
            opacity: Number.parseFloat(rowStyle.opacity),
            markerDelta: Math.abs(
              markerRect.left + markerRect.width / 2 - (trackRect.left + trackRect.width / 2)
            ),
            leaderContent: leader.content,
            borderWidth: rowStyle.borderWidth,
            background: rowStyle.backgroundColor,
          };
        }),
      };
    });

    expect(serviceBus.heading).toBe("SOURCE BUS · 04");
    expect(serviceBus.labels).toEqual(["ADVISORY", "EMBEDDED", "KEYNOTE", "WORKSHOP"]);
    for (const row of serviceBus.rows) {
      expect(row.visible).toBe(true);
      expect(row.opacity).toBeGreaterThan(0.99);
      expect(row.markerDelta).toBeLessThanOrEqual(1);
      // No leader lines (ADR-030 Update 3): the readout floats free of the
      // rail — the marker must carry no ::before bar.
      expect(row.leaderContent).toBe("none");
      expect(row.borderWidth).toBe("0px");
      expect(row.background).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)/);
    }

    // Dock the second unit. This guarantees the Tools shield is settled,
    // and proves the active fill comes from the stack's live current slot.
    await dockToolSlot(page, 1);
    await expect
      .poll(() => page.locator(".tools-rail-register").getAttribute("data-register-mode"))
      .toBe("tools");

    const toolBus = await page.evaluate(() => {
      const toolRows = Array.from(
        document.querySelectorAll<HTMLElement>(".tools-rail-register__row--tool")
      );
      return {
        heading: document
          .querySelector<HTMLElement>(".tools-rail-register__heading--tools")
          ?.textContent?.trim(),
        labels: toolRows.map((row) => row.querySelector(".tools-rail-register__name")?.textContent),
        activeIds: toolRows
          .filter((row) => row.hasAttribute("data-active"))
          .map((row) => row.dataset.toolId),
        fills: toolRows.map(
          (row) =>
            getComputedStyle(
              row.querySelector<HTMLElement>(".tools-rail-register__marker")!,
              "::after"
            ).backgroundColor
        ),
      };
    });
    expect(toolBus.heading).toBe("TOOL UNITS · 04");
    expect(toolBus.labels).toEqual(["Mímir", "Vesper", "Babylon", "Heimdall"]);
    expect(toolBus.activeIds).toEqual(["vesper"]);
    expect(toolBus.fills[1]).not.toMatch(/rgba\(0,\s*0,\s*0,\s*0\)/);
    for (const fill of toolBus.fills.filter((_, index) => index !== 1)) {
      expect(fill).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)/);
    }

    await dockToolSlot(page, 2);
    await expect(page.locator(".tools-rail-register__row--tool[data-active]")).toHaveAttribute(
      "data-tool-id",
      "babylon"
    );
    await expect(
      page.locator('.tools-rail-register__row--tool[data-tool-id="vesper"]')
    ).not.toHaveAttribute("data-active", "");

    // Exact reverse-scroll restoration: the same four labels return to the
    // same physical rail slots, rather than remounting in a floating layer.
    expect(await scrollServicesRunway(page, 1)).toBe(true);
    await expect
      .poll(() => page.locator(".tools-rail-register").getAttribute("data-register-mode"))
      .toBe("services");
    const restored = await page.evaluate(() => {
      const rows = Array.from(
        document.querySelectorAll<HTMLElement>(".tools-rail-register__row--service")
      );
      return {
        labels: rows.map((row) => row.querySelector(".tools-rail-register__name")?.textContent),
        markerTops: rows.map(
          (row) =>
            row.querySelector<HTMLElement>(".tools-rail-register__marker")!.getBoundingClientRect()
              .top
        ),
        visible: rows.map((row) => getComputedStyle(row).visibility),
      };
    });
    expect(restored.labels).toEqual(serviceBus.labels);
    expect(restored.visible).toEqual(["visible", "visible", "visible", "visible"]);
    restored.markerTops.forEach((top, index) => {
      expect(Math.abs(top - serviceBus.markerTops[index])).toBeLessThanOrEqual(1);
    });
  });

  test("enhanced deck: fixed header and compact peeks fit 1440x900, 1920x1080, 1366x768", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(90_000);
    test.skip(testInfo.project.name !== "desktop", "run the explicit desktop matrix once");

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
    ]) {
      const { context, page } = await openViewport(browser, viewport);
      try {
        await assertEnhancedDeckGeometry(page, `${viewport.width}x${viewport.height}`);
      } finally {
        await context.close();
      }
    }
  });

  test("enhanced deck: sticky cover state resets on reverse scroll", async ({ page }) => {
    test.skip(!isEnhancedViewport(page), "the sticky deck needs the enhanced capability");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#tools .pcl-stack", { state: "attached", timeout: 15_000 });
    await expect(page.locator("#tools [data-pc-slot]")).toHaveCount(4);
    await expect(page.locator("#tools .pcl-v2__plate").first()).toHaveText("TF·MÍMIR");

    await dockToolSlot(page, 1);
    const firstSlot = page.locator("#tools [data-pc-slot]").first();
    await expect(firstSlot).toHaveAttribute("data-pc-state", "covered");

    expect(await scrollToolsTopTo(page, 0.9)).toBe(true);
    await expect(firstSlot).not.toHaveAttribute("data-pc-state", "covered");
  });

  test("capability boundaries: sticky only at 1101px x 760px with motion allowed", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(90_000);
    test.skip(testInfo.project.name !== "desktop", "run the explicit capability matrix once");

    const cases = [
      { viewport: { width: 1100, height: 900 }, enhanced: false },
      { viewport: { width: 1101, height: 900 }, enhanced: true },
      { viewport: { width: 1440, height: 759 }, enhanced: false },
      { viewport: { width: 1440, height: 760 }, enhanced: true },
      { viewport: { width: 1366, height: 700 }, enhanced: false },
    ];

    for (const capability of cases) {
      const { context, page } = await openViewport(browser, capability.viewport);
      try {
        if (capability.enhanced) {
          await page.waitForSelector(".tools-rail-register", {
            state: "attached",
            timeout: 5_000,
          });
        }
        const state = await page.evaluate(() => ({
          slotPosition: getComputedStyle(
            document.querySelector<HTMLElement>("#tools [data-pc-slot]")!
          ).position,
          headerPosition: getComputedStyle(
            document.querySelector<HTMLElement>("#tools .tools__head")!
          ).position,
          registerCount: document.querySelectorAll(".tools-rail-register").length,
        }));

        expect(state.slotPosition).toBe(capability.enhanced ? "sticky" : "static");
        expect(state.headerPosition).toBe(capability.enhanced ? "fixed" : "static");
        expect(state.registerCount).toBe(capability.enhanced ? 1 : 0);
      } finally {
        await context.close();
      }
    }
  });

  test("base capability: natural flow, no register, no horizontal overflow, four named articles", async ({
    page,
  }) => {
    test.skip(isEnhancedViewport(page), "this assertion targets tablet and phone projects");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#tools [data-pc-slot]", {
      state: "attached",
      timeout: 15_000,
    });

    const layout = await page.evaluate(() => {
      const tools = document.querySelector<HTMLElement>("#tools")!;
      const slots = Array.from(document.querySelectorAll<HTMLElement>("#tools [data-pc-slot]"));
      const articles = Array.from(document.querySelectorAll<HTMLElement>("#tools article"));
      const toolsRect = tools.getBoundingClientRect();
      return {
        marginTop: getComputedStyle(tools).marginTop,
        slotPositions: slots.map((slot) => getComputedStyle(slot).position),
        slotCount: slots.length,
        registerCount: document.querySelectorAll(".tools-rail-register").length,
        localRailCount: document.querySelectorAll(".pcl-rail").length,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        articleNames: articles.map((article) => {
          const labelledBy = article.getAttribute("aria-labelledby");
          return labelledBy ? document.getElementById(labelledBy)?.textContent?.trim() : null;
        }),
        articleLabelIds: articles.map((article) => article.getAttribute("aria-labelledby")),
        headingTags: articles.map((article) => {
          const labelledBy = article.getAttribute("aria-labelledby");
          return labelledBy ? document.getElementById(labelledBy)?.tagName : null;
        }),
        articleAriaHidden: articles.map((article) => article.getAttribute("aria-hidden")),
        cardsInsideStation: articles.every((article) => {
          const rect = article.getBoundingClientRect();
          return rect.left >= toolsRect.left - 1 && rect.right <= toolsRect.right + 1;
        }),
      };
    });

    expect(layout.marginTop).toBe("0px");
    expect(layout.slotCount).toBe(4);
    expect(layout.slotPositions).toEqual(["static", "static", "static", "static"]);
    expect(layout.registerCount).toBe(0);
    expect(layout.localRailCount).toBe(0);
    expect(layout.scrollWidth).toBe(layout.innerWidth);
    expect(layout.cardsInsideStation).toBe(true);
    expect(layout.articleNames).toHaveLength(4);
    layout.articleNames.forEach((name) => expect(name?.length ?? 0).toBeGreaterThan(0));
    expect(new Set(layout.articleLabelIds).size).toBe(4);
    expect(layout.headingTags).toEqual(["H3", "H3", "H3", "H3"]);
    expect(layout.articleAriaHidden).toEqual([null, null, null, null]);
  });

  test("reduced motion: static deck, authored header, and no rail register", async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "run the reduced-motion context once");

    const { context, page } = await openViewport(browser, { width: 1440, height: 900 }, "reduce");
    try {
      const state = await page.evaluate(() => ({
        marginTop: getComputedStyle(document.querySelector("#tools")!).marginTop,
        slotPosition: getComputedStyle(
          document.querySelector<HTMLElement>("#tools [data-pc-slot]")!
        ).position,
        headerPosition: getComputedStyle(
          document.querySelector<HTMLElement>("#tools .tools__head")!
        ).position,
        registerCount: document.querySelectorAll(".tools-rail-register").length,
        title: document.querySelector("#tools .tools__title")?.textContent?.trim(),
      }));
      expect(state.marginTop).toBe("0px");
      expect(state.slotPosition).toBe("static");
      expect(state.headerPosition).toBe("static");
      expect(state.registerCount).toBe(0);
      expect(state.title).toContain("one tool at a time");
    } finally {
      await context.close();
    }
  });
});
