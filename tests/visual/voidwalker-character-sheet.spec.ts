import { expect, test, type Page } from "@playwright/test";

/**
 * Voidwalker editorial character sheet (ADR-082 Updates 4–5).
 *
 * These checks pin the authored hierarchy and projector geometry rather than
 * pixels: the surface remains responsive, but its identity, figure and record
 * seats must not drift when the active era retunes the sheet.
 */
test.describe.configure({ mode: "serial" });

const DESKTOP_VIEWPORTS = [
  { width: 1101, height: 800 },
  { width: 1280, height: 720 },
  { width: 1440, height: 800 },
  { width: 1920, height: 1080 },
] as const;

async function settle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
  await page.waitForTimeout(60);
}

async function setVoidwalkerProgress(page: Page, progress: number) {
  const y = await page.evaluate((runwayProgress) => {
    const runway = document.querySelector<HTMLElement>(".vw--hologram");
    if (!runway) throw new Error("Missing Voidwalker runway");
    const top = runway.getBoundingClientRect().top + window.scrollY;
    return Math.round(top + (runway.offsetHeight - window.innerHeight) * runwayProgress);
  }, progress);
  await page.evaluate((targetY) => window.scrollTo({ top: targetY, behavior: "instant" }), y);
  await page.waitForFunction((runwayProgress) => {
    const runway = document.querySelector<HTMLElement>(".vw--hologram");
    if (!runway) return false;
    const travel = runway.offsetHeight - window.innerHeight;
    const actual = Math.max(0, Math.min(1, -runway.getBoundingClientRect().top / travel));
    return Math.abs(actual - runwayProgress) <= 0.003;
  }, progress);
  await settle(page);
}

async function bootDesktop(page: Page, viewport: (typeof DESKTOP_VIEWPORTS)[number]) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize(viewport);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("#voidwalker")).toHaveAttribute("data-vw-handoff", "ready", {
    timeout: 12_000,
  });
  await setVoidwalkerProgress(page, 0.2);
}

function expectNear(actual: number, expected: number, tolerance: number, label: string) {
  expect(Math.abs(actual - expected), `${label}: ${actual} vs ${expected}`).toBeLessThanOrEqual(
    tolerance
  );
}

test.describe("Voidwalker editorial character sheet", () => {
  test("desktop hierarchy stays three-column and the boots meet the projector", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "explicit Chromium viewport matrix");

    for (const viewport of DESKTOP_VIEWPORTS) {
      await test.step(`${viewport.width}x${viewport.height}`, async () => {
        await bootDesktop(page, viewport);
        const geometry = await page.evaluate(() => {
          const required = (selector: string) => {
            const element = document.querySelector<HTMLElement>(selector);
            if (!element) throw new Error(`Missing ${selector}`);
            return element;
          };
          const rect = (selector: string) => {
            const r = required(selector).getBoundingClientRect();
            return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width };
          };

          const root = required(".vwh");
          const slot = required(".vwh__slot");
          const media = required(".vwh__media");
          const disc = required(".vwh__base__disc");
          const mediaRect = media.getBoundingClientRect();
          const slotRect = slot.getBoundingClientRect();
          const discRect = disc.getBoundingClientRect();
          const frameWidth = Number(slot.dataset.vwhFrameWidth);
          const frameHeight = Number(slot.dataset.vwhFrameHeight);
          const footAnchor = Number(slot.dataset.vwhFootY);
          const scale = Math.min(mediaRect.width / frameWidth, mediaRect.height / frameHeight);
          const renderedHeight = frameHeight * scale;
          const renderedTop = mediaRect.bottom - renderedHeight;
          const bootY = renderedTop + footAnchor * renderedHeight;
          const rootStyle = getComputedStyle(root);

          return {
            root: rect(".vwh"),
            selector: rect("[data-vwh-region='era-selector']"),
            identity: rect("[data-vwh-region='identity']"),
            title: rect("[data-vwh-region='era-title']"),
            facts: rect("[data-vwh-handoff-target='dossier']"),
            figure: rect("[data-vwh-region='figure']"),
            scope: rect("[data-vwh-region='scope']"),
            platform: rect("[data-vwh-region='platform']"),
            slotBottom: slotRect.bottom,
            mediaFill: {
              widthDelta: Math.abs(mediaRect.width - slotRect.width),
              heightDelta: Math.abs(mediaRect.height - slotRect.height),
            },
            bootY,
            discTop: discRect.top,
            rootBackground: rootStyle.backgroundColor,
            rootBackgroundImage: rootStyle.backgroundImage,
            titleText: required("[data-vwh-region='era-title']").getAttribute("aria-label"),
            tabRows: Array.from(document.querySelectorAll<HTMLElement>("[data-vwh-era-tab]"))
              .map((tab) => Math.round(tab.getBoundingClientRect().top))
              .filter((top, index, tops) => tops.indexOf(top) === index).length,
          };
        });

        expect(geometry.titleText).toBe("The Intelligence Architect");
        expect(geometry.tabRows).toBe(1);
        expectNear(
          geometry.selector.left + geometry.selector.width / 2,
          geometry.figure.left + geometry.figure.width / 2,
          1,
          "centred era index"
        );
        expect(geometry.selector.bottom).toBeLessThanOrEqual(geometry.identity.top + 1);
        expect(geometry.identity.top - geometry.selector.bottom).toBeGreaterThanOrEqual(24);
        expectNear(geometry.identity.top, geometry.scope.top, 1, "shared dossier datum");
        expect(geometry.identity.bottom).toBeLessThanOrEqual(geometry.facts.top + 1);
        expect(geometry.title.left).toBeLessThan(geometry.figure.left);
        expect(geometry.facts.right).toBeLessThanOrEqual(geometry.figure.left + 1);
        expect(geometry.scope.left).toBeGreaterThanOrEqual(geometry.figure.right - 1);
        expect(geometry.platform.left + geometry.platform.width / 2).toBeCloseTo(
          geometry.figure.left + geometry.figure.width / 2,
          1
        );
        expect(geometry.platform.bottom).toBeLessThanOrEqual(geometry.root.bottom + 1);
        expectNear(geometry.slotBottom, geometry.discTop, 0.75, "slot/disc contact plane");
        expectNear(geometry.bootY, geometry.discTop, 2, "boot/projector contact");
        expect(geometry.mediaFill.widthDelta).toBeLessThanOrEqual(0.75);
        expect(geometry.mediaFill.heightDelta).toBeLessThanOrEqual(0.75);
        expect(geometry.rootBackground).toBe("rgba(0, 0, 0, 0)");
        expect(geometry.rootBackgroundImage).toBe("none");
      });
    }
  });

  test("the stable tab instrument supports keyboard selection without reshaping seats", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "semantic matrix runs once in Chromium");
    await bootDesktop(page, { width: 1440, height: 800 });

    const tablist = page.getByRole("tablist", { name: "Era" });
    const tabs = tablist.getByRole("tab");
    const panel = page.getByRole("tabpanel");
    await expect(tabs).toHaveCount(6);
    await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(0)).toHaveAttribute("tabindex", "0");
    const panelId = await panel.getAttribute("id");

    await tabs.nth(0).focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    await expect(tabs.nth(4)).toBeFocused();
    await page.keyboard.press("Home");
    await expect(tabs.nth(0)).toBeFocused();
    await page.keyboard.press("End");
    await expect(tabs.nth(5)).toBeFocused();
    expect(await panel.getAttribute("id")).toBe(panelId);

    const seatSnapshot = async () =>
      page.evaluate(() => {
        const capture = (selector: string) => {
          const element = document.querySelector<HTMLElement>(selector);
          if (!element) throw new Error(`Missing ${selector}`);
          const r = element.getBoundingClientRect();
          return { left: r.left, top: r.top, width: r.width, height: r.height };
        };
        return {
          selector: capture("[data-vwh-region='era-selector']"),
          identity: capture("[data-vwh-region='identity']"),
          figure: capture("[data-vwh-region='figure']"),
          record: capture("[data-vwh-region='record']"),
          scope: capture("[data-vwh-region='scope']"),
          onRecord: capture("[data-slot='on-record']"),
          transmission: capture("[data-slot='transmission']"),
        };
      });

    await tabs.nth(0).click();
    await settle(page);
    const baseline = await seatSnapshot();
    for (let index = 0; index < 6; index += 1) {
      await tabs.nth(index).click();
      await expect(tabs.nth(index)).toHaveAttribute("aria-selected", "true");
      await expect(tabs.nth(index)).toBeFocused();
      await settle(page);
      const current = await seatSnapshot();
      for (const seat of Object.keys(baseline) as Array<keyof typeof baseline>) {
        for (const channel of ["left", "top", "width", "height"] as const) {
          expectNear(current[seat][channel], baseline[seat][channel], 0.75, `${seat} ${channel}`);
        }
      }
    }

    const dark = await seatSnapshot();
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
    await settle(page);
    const light = await seatSnapshot();
    expect(light).toEqual(dark);
  });

  test("1024px and reduced-motion paths use the settled normal-flow order", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "fallback matrix runs once in Chromium");

    for (const viewport of [
      { width: 701, height: 900, tolerance: 3 },
      { width: 1024, height: 800, tolerance: 3 },
    ]) {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.setViewportSize(viewport);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.locator(".vwh").scrollIntoViewIfNeeded();
      await settle(page);
      const fallback = await page.evaluate(() => {
        const top = (selector: string) => {
          const element = document.querySelector<HTMLElement>(selector);
          if (!element) throw new Error(`Missing ${selector}`);
          return element.getBoundingClientRect().top;
        };
        return {
          ready: document.querySelector(".vwh")?.hasAttribute("data-vwh-ready") ?? false,
          marginTop: Number.parseFloat(
            getComputedStyle(document.getElementById("voidwalker")!).marginTop
          ),
          tops: [
            top("[data-vwh-region='era-selector']"),
            top("[data-vwh-region='identity']"),
            top("[data-vwh-region='figure']"),
            top("[data-vwh-handoff-target='dossier']"),
            top("[data-vwh-region='scope'] .vwh__panel"),
          ],
        };
      });
      expect(fallback.ready).toBe(false);
      expectNear(fallback.marginTop, 0, 0.5, `${viewport.width}px station margin`);
      for (let index = 1; index < fallback.tops.length; index += 1) {
        expect(fallback.tops[index]).toBeGreaterThanOrEqual(
          fallback.tops[index - 1] - viewport.tolerance
        );
      }
    }

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator(".vwh").scrollIntoViewIfNeeded();
    await expect(page.locator(".vwh__media")).toHaveJSProperty("tagName", "IMG");
    await expect(page.locator(".vwh")).not.toHaveAttribute("data-vwh-ready", "");
    expect(
      await page
        .locator(".vwh__media")
        .evaluate((element) => getComputedStyle(element).animationName)
    ).toBe("none");
  });

  test("phones keep one character stage and retune one dossier seat", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "explicit phone viewport matrix");

    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 700, height: 900 },
    ]) {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.setViewportSize(viewport);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.locator(".vwh").scrollIntoViewIfNeeded();
      await settle(page);

      const readPhone = () =>
        page.evaluate(() => {
          const required = (selector: string) => {
            const element = document.querySelector<HTMLElement>(selector);
            if (!element) throw new Error(`Missing ${selector}`);
            return element;
          };
          const stage = required(".vwh");
          const stageRect = stage.getBoundingClientRect();
          const top = (selector: string) =>
            required(selector).getBoundingClientRect().top - stageRect.top;
          const left = required(".vwh__side[data-side='l']");
          const right = required(".vwh__side[data-side='r']");
          const slot = required(".vwh__slot");
          const media = required(".vwh__media");
          const eras = Array.from(document.querySelectorAll<HTMLElement>(".vwh__pip"));
          const modes = Array.from(document.querySelectorAll<HTMLElement>(".vwh__mobile-mode"));
          const activeSide = getComputedStyle(left).display !== "none" ? left : right;
          return {
            ready: stage.hasAttribute("data-vwh-ready"),
            localOverflow: stage.scrollWidth - stage.clientWidth,
            height: stageRect.height,
            viewportHeight: window.innerHeight,
            mediaOverflow:
              media.getBoundingClientRect().bottom - slot.getBoundingClientRect().bottom,
            slotOverflow: slot.scrollHeight - slot.clientHeight,
            tops: [
              top("[data-vwh-region='identity']"),
              top("[data-vwh-region='figure']"),
              top("[data-vwh-region='era-selector']"),
              top(".vwh__mobile-modes"),
              activeSide.getBoundingClientRect().top - stageRect.top,
            ],
            eraTops: eras.map((element) => element.getBoundingClientRect().top - stageRect.top),
            eraWidths: eras.map((element) => element.getBoundingClientRect().width),
            eraHeights: eras.map((element) => element.getBoundingClientRect().height),
            modeHeights: modes.map((element) => element.getBoundingClientRect().height),
            leftDisplay: getComputedStyle(left).display,
            rightDisplay: getComputedStyle(right).display,
            scopeDisplay: getComputedStyle(
              required(".vwh__side[data-side='r'] > [data-vwh-mobile-panel='scope']")
            ).display,
            transmissionDisplay: getComputedStyle(
              required(".vwh__side[data-side='r'] > [data-vwh-mobile-panel='transmission']")
            ).display,
            activeMode: required(".vwh__tabpanel").dataset.vwhMobileMode,
            activeSeat: {
              top: activeSide.getBoundingClientRect().top - stageRect.top,
              height: activeSide.getBoundingClientRect().height,
              overscrollY: getComputedStyle(activeSide).overscrollBehaviorY,
            },
            stable: [
              "[data-vwh-region='identity']",
              "[data-vwh-region='figure']",
              "[data-vwh-region='era-selector']",
            ].map((selector) => {
              const rect = required(selector).getBoundingClientRect();
              return {
                top: rect.top - stageRect.top,
                left: rect.left - stageRect.left,
                width: rect.width,
                height: rect.height,
              };
            }),
          };
        });

      const initial = await readPhone();
      const label = `${viewport.width}x${viewport.height}`;
      expect(initial.ready, `${label}: phone path must stay normal-flow`).toBe(false);
      expect(initial.height, `${label}: whole character instrument`).toBeLessThanOrEqual(
        initial.viewportHeight + 1
      );
      expect(initial.localOverflow, `${label}: local horizontal overflow`).toBeLessThanOrEqual(1);
      expect(initial.mediaOverflow, `${label}: media escapes figure slot`).toBeLessThanOrEqual(1);
      expect(initial.slotOverflow, `${label}: intrinsic figure overflow`).toBeLessThanOrEqual(1);
      expect(
        Math.max(...initial.eraTops) - Math.min(...initial.eraTops),
        `${label}: era row`
      ).toBeLessThanOrEqual(1);
      for (const height of [...initial.eraHeights, ...initial.modeHeights]) {
        expect(height, `${label}: touch target`).toBeGreaterThanOrEqual(44);
      }
      for (const width of initial.eraWidths) {
        expect(width, `${label}: six-up era target`).toBeGreaterThanOrEqual(44);
      }
      for (let index = 1; index < initial.tops.length; index += 1) {
        expect(initial.tops[index], `${label}: instrument order ${index}`).toBeGreaterThanOrEqual(
          initial.tops[index - 1] - 1
        );
      }
      expect(initial.activeMode).toBe("record");
      expect(initial.leftDisplay).not.toBe("none");
      expect(initial.rightDisplay).toBe("none");
      expect(initial.activeSeat.overscrollY).toBe("auto");
      await expect(page.getByRole("button", { name: "record", exact: true })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      await expect(page.getByRole("button", { name: "transmission", exact: true })).toBeDisabled();

      const loopTab = page.locator("[data-vwh-era-tab='loop']");
      await loopTab.focus();
      await loopTab.press("ArrowDown");
      await expect(loopTab).toHaveAttribute("aria-selected", "true");

      await page.getByRole("button", { name: "scope", exact: true }).click();
      await settle(page);
      const scope = await readPhone();
      expect(scope.activeMode).toBe("scope");
      expect(scope.leftDisplay).toBe("none");
      expect(scope.rightDisplay).not.toBe("none");
      expect(scope.scopeDisplay).not.toBe("none");
      expect(scope.transmissionDisplay).toBe("none");
      expectNear(scope.activeSeat.top, initial.activeSeat.top, 1, `${label}: dossier seat top`);
      expectNear(
        scope.activeSeat.height,
        initial.activeSeat.height,
        1,
        `${label}: dossier seat height`
      );
      await expect(page.getByRole("button", { name: "scope", exact: true })).toHaveAttribute(
        "aria-pressed",
        "true"
      );
      for (let index = 0; index < initial.stable.length; index += 1) {
        for (const channel of ["top", "left", "width", "height"] as const) {
          expectNear(
            scope.stable[index][channel],
            initial.stable[index][channel],
            1,
            `${label}: stable ${index} ${channel}`
          );
        }
      }

      await page.locator("[data-vwh-era-tab='genai']").click();
      const transmission = page.getByRole("button", { name: "transmission", exact: true });
      await expect(transmission).toBeEnabled();
      await transmission.click();
      await expect(page.locator(".vwh__tabpanel")).toHaveAttribute(
        "data-vwh-mobile-mode",
        "transmission"
      );
      await expect(transmission).toHaveAttribute("aria-pressed", "true");
      const filmed = await readPhone();
      expect(filmed.scopeDisplay).toBe("none");
      expect(filmed.transmissionDisplay).not.toBe("none");
      expectNear(filmed.activeSeat.top, initial.activeSeat.top, 1, `${label}: film seat top`);
      expectNear(
        filmed.activeSeat.height,
        initial.activeSeat.height,
        1,
        `${label}: film seat height`
      );

      await page.locator("[data-vwh-era-tab='loop']").click();
      await expect(page.locator(".vwh__tabpanel")).toHaveAttribute(
        "data-vwh-mobile-mode",
        "record"
      );
      await expect(transmission).toBeDisabled();
    }
  });

  test("a failed loop falls back to the normalized canonical poster", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "media failure runs once in Chromium");
    // ⚠ ABORT BOTH SOURCES. ADR-082 U6 gave the figure an alpha branch, so on
    // an engine that honours VP9 alpha the station requests the `.webm` and
    // killing only the `.mp4` tests nothing at all.
    await page.route("**/videos/voidwalker/holo-idle-thoughtform.mp4", (route) => route.abort());
    await page.route("**/videos/voidwalker/holo-idle-thoughtform.webm", (route) => route.abort());
    await bootDesktop(page, { width: 1440, height: 800 });

    const media = page.locator(".vwh__media");
    await expect(media).toHaveJSProperty("tagName", "IMG");
    // ⚠ The still must match the COMPOSITING BRANCH: on the alpha path the
    // floor is off, so an opaque `.jpg` here would repaint the black pane.
    const expectedPoster =
      (await page.locator(".vwh__slot").getAttribute("data-holo-alpha")) !== null
        ? "/images/voidwalker/holo-still-thoughtform.webp"
        : "/images/voidwalker/holo-still-thoughtform.jpg";
    await expect(media).toHaveAttribute("src", expectedPoster);
    await expect(page.locator(".vwh__slot")).toHaveAttribute("data-vwh-frame-width", "720");
    await expect(page.locator(".vwh__slot")).toHaveAttribute("data-vwh-frame-height", "1280");

    const contact = await page.evaluate(() => {
      const slot = document.querySelector<HTMLElement>(".vwh__slot");
      const image = document.querySelector<HTMLImageElement>(".vwh__media");
      const disc = document.querySelector<HTMLElement>(".vwh__base__disc");
      if (!slot || !image || !disc) throw new Error("Missing poster fallback geometry");
      const rect = image.getBoundingClientRect();
      const scale = Math.min(rect.width / 720, rect.height / 1280);
      const height = 1280 * scale;
      const bootY = rect.bottom - height + Number(slot.dataset.vwhFootY) * height;
      return { bootY, discTop: disc.getBoundingClientRect().top };
    });
    expectNear(contact.bootY, contact.discTop, 2, "fallback-poster contact");
  });

  /**
   * ADR-082 U6 · the identity title carries the About name's own type ladder.
   *
   * The name FLIES INTO this seat and now translates without scaling, so any
   * divergence here re-opens the smush. Measuring the two computed sizes is
   * the only check that catches it: the first fix looked correct in the source
   * and still measured 28.02px live, because a short-viewport rung was quietly
   * stepping the title down.
   */
  test("the era title matches the About name's size at every desktop rung", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "explicit Chromium viewport matrix");

    for (const viewport of DESKTOP_VIEWPORTS) {
      await bootDesktop(page, viewport);
      const type = await page.evaluate(() => {
        const name = document.querySelector<HTMLElement>(".voidwalker__name");
        const title = document.querySelector<HTMLElement>(".vwh__mast__title");
        if (!name || !title) throw new Error("Missing name or era title");
        const t = getComputedStyle(title);
        return {
          name: getComputedStyle(name).fontSize,
          title: t.fontSize,
          // Three lines reserved so switching era cannot move FACTS beneath it.
          reserved: title.getBoundingClientRect().height,
          line: parseFloat(t.lineHeight),
        };
      });
      const label = `${viewport.width}x${viewport.height}`;
      expect(type.title, `${label}: era title must equal the About name's size`).toBe(type.name);
      expect(type.reserved, `${label}: three-line seat`).toBeGreaterThanOrEqual(type.line * 2.9);
    }
  });

  /**
   * ADR-082 U6 · the name TRANSLATES; it never scales.
   *
   * Pinned from the rendered matrix rather than the published custom property,
   * so a future pass that re-points a scale channel at the destination's width
   * fails here even if the variable names change.
   */
  test("the About name actor carries no scale channel through its flight", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "explicit Chromium viewport matrix");

    await bootDesktop(page, { width: 1440, height: 800 });
    const matrices = await page.evaluate(() => {
      const actor = document.querySelector<HTMLElement>("[data-about-handoff-name]");
      if (!actor) return null;
      const m = new DOMMatrixReadOnly(getComputedStyle(actor).transform);
      return { a: m.a, d: m.d };
    });
    if (matrices) {
      expect(Math.abs(matrices.a - 1), "name actor scaleX must stay 1").toBeLessThanOrEqual(0.001);
      expect(Math.abs(matrices.d - 1), "name actor scaleY must stay 1").toBeLessThanOrEqual(0.001);
    }
  });

  /**
   * ADR-082 U6 · the era strip sits below the HUD rail's first tick.
   *
   * It used to occupy 28–72px — inside the nav corner's own row — while the
   * rail starts at `--hud-rail-y-start`. The figure column spans the whole grid
   * and must NOT have moved to buy that clearance.
   */
  test("the era strip clears the rail without moving the figure", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "explicit Chromium viewport matrix");

    for (const viewport of DESKTOP_VIEWPORTS) {
      await bootDesktop(page, viewport);
      const geom = await page.evaluate(() => {
        const q = (s: string) => document.querySelector<HTMLElement>(s);
        const strip = q(".vwh__era-selector");
        const rail = q(".hud__rail");
        const figure = q(".vwh__column");
        if (!strip || !rail || !figure) throw new Error("Missing strip, rail or figure");
        const station = q(".vwh")!.getBoundingClientRect();
        return {
          stripTop: strip.getBoundingClientRect().top,
          railTop: rail.getBoundingClientRect().top,
          figureTop: figure.getBoundingClientRect().top,
          stationTop: station.top,
        };
      });
      const label = `${viewport.width}x${viewport.height}`;
      // The clearance is derived as `--hud-rail-y-start − --vwh-pad-top`, so
      // the strip lands ON the rail's first tick by construction and the two
      // can disagree by a sub-pixel of float rounding (measured 0.0156px at
      // 1101x800). What must never return is the ~91px it sat ABOVE the rail,
      // up in the nav corner's own row.
      expect(geom.stripTop, `${label}: strip must sit at or below the rail top`).toBeGreaterThan(
        geom.railTop - 0.5
      );
      // The figure spans grid-row 1/4, so the band's growth cannot push it down.
      expectNear(geom.figureTop, geom.stationTop, 40, `${label}: figure top unmoved`);
    }
  });
});
