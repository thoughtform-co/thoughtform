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

/* The viewport is any desktop shape, not only the four reference rungs: the
   ultra-wide symmetry case boots widths that deliberately are not in the
   matrix, because that is where the composition had room to go wrong. */
async function bootDesktop(page: Page, viewport: { width: number; height: number }) {
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
            dossier: rect("[data-vwh-handoff-target='dossier']"),
            /* ⚠ THE MAST'S BOX TOP IS NOT ITS CONTENT TOP — it carries
               `--vwh-text-clear` as padding so the identity clears the nav
               corner without the figure column paying for it. The datum the
               two columns share is the first INKED line, not the box. */
            identityInk: rect(".vwh__mast__kicker"),
            factsPanel: rect("[data-vwh-region='record'] .vwh__panel"),
            scopePanel: rect("[data-vwh-region='scope'] .vwh__panel"),
            figure: rect("[data-vwh-region='figure']"),
            scope: rect("[data-vwh-region='scope']"),
            platform: rect("[data-vwh-region='platform']"),
            hudRailL: (() => {
              const t = document.querySelector(".hud__rail--l .hud__rail__track");
              return t ? t.getBoundingClientRect() : null;
            })(),
            hudRailR: (() => {
              const t = document.querySelector(".hud__rail--r .hud__rail__track");
              return t ? t.getBoundingClientRect() : null;
            })(),
            onRecord: rect("[data-slot='on-record']"),
            transmission: rect("[data-slot='transmission']"),
            discBottom: discRect.bottom,
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
        /* ⚠ FIVE ROWS, NOT ONE. The selector is a VERTICAL scrubber on the
           left rail since ADR-082 U9; `1` was the horizontal strip's own
           assertion and is inverted here rather than deleted, so a strip
           returning to a single row fails loudly. */
        expect(geometry.tabRows).toBe(5);
        /* ⚠ THE SELECTOR IS THE SCRUBBER ON THE LEFT HUD RAIL (ADR-082 U9) —
           not a band above the identity, and not the horizontal axis at the
           foot that U8 tried. It rides the rail's own x in the HUD gutter,
           OUTBOARD of both dossier columns, so it adds no fourth column at
           any width. Pinned from both ends: a strip drifting back into the
           grid fails here. */
        if (geometry.hudRailL) {
          expectNear(
            geometry.selector.left,
            geometry.hudRailL.left,
            3,
            "scrubber rides the left rail"
          );
        }
        expect(geometry.selector.right).toBeLessThanOrEqual(geometry.scopePanel.left);
        /* ⚠ THE IDENTITY IS CENTRED OVER THE FIGURE (owner, 2026-08-27: "the
           title of my era should be centered above my head"), which is what
           frees both columns onto ONE datum — while the mast lived in the
           left column, that column always started one mast lower than the
           right and no tuning could line them up. */
        expectNear(
          geometry.identity.left + geometry.identity.width / 2,
          geometry.figure.left + geometry.figure.width / 2,
          2,
          "identity centred over the figure"
        );
        expect(geometry.identity.bottom).toBeLessThanOrEqual(geometry.scopePanel.top + 1);
        expect(geometry.identity.bottom).toBeLessThanOrEqual(geometry.figure.top + 1);
        /* Both ledes on one datum, both seats on another — the arithmetic the
           old 248-vs-280 seat pair made impossible. */
        expectNear(geometry.scopePanel.top, geometry.factsPanel.top, 1.5, "shared lede datum");
        expectNear(geometry.onRecord.top, geometry.transmission.top, 1, "shared seat datum");
        // the handoff target rides whichever panel holds the top-left seat
        expectNear(geometry.dossier.top, geometry.scopePanel.top, 1, "dossier target on scope");
        /* ⚠ SCOPE LEFT, FACTS RIGHT (owner, 2026-08-27) — pinned from both
           ends so a silent swap fails. */
        expect(geometry.scopePanel.right).toBeLessThanOrEqual(geometry.figure.left + 1);
        expect(geometry.factsPanel.left).toBeGreaterThanOrEqual(geometry.figure.right - 1);
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
    await expect(tabs).toHaveCount(5);
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
    await expect(tabs.nth(4)).toBeFocused();
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
    for (let index = 0; index < 5; index += 1) {
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
            /* ⚠ ADDRESSED BY MOBILE PANEL, NOT BY SIDE. ADR-082 U8 swapped the
               columns (scope left, facts right); a selector that names the
               side is asserting where a panel HAPPENS to live rather than
               what it is, and it broke on a change that did not touch the
               phone at all. */
            scopeDisplay: getComputedStyle(required(".vwh__side > [data-vwh-mobile-panel='scope']"))
              .display,
            transmissionDisplay: getComputedStyle(
              required(".vwh__side > [data-vwh-mobile-panel='transmission']")
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
        expect(width, `${label}: five-up era target`).toBeGreaterThanOrEqual(44);
      }
      for (let index = 1; index < initial.tops.length; index += 1) {
        expect(initial.tops[index], `${label}: instrument order ${index}`).toBeGreaterThanOrEqual(
          initial.tops[index - 1] - 1
        );
      }
      expect(initial.activeMode).toBe("record");
      /* ⚠ RECORD LIVES ON THE RIGHT SINCE ADR-082 U8 — the columns swapped
         (scope left, facts right) and the phone's one-mode-one-seat mapping
         followed them. Asserted from BOTH ends so a half-swap fails. */
      expect(initial.rightDisplay).not.toBe("none");
      expect(initial.leftDisplay).toBe("none");
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
      expect(scope.rightDisplay).toBe("none");
      expect(scope.leftDisplay).not.toBe("none");
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
  test("the sheet stays symmetric on ultra-wide screens", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "explicit Chromium viewport matrix");

    /* ⚠ THIS DEFECT WAS INVISIBLE AT EVERY OTHER VIEWPORT IN THIS FILE. At
       1600 the side columns are exactly as wide as the capped panel measure,
       so there is no slack to misplace and the composition reads balanced.
       Give it room and `justify-items: stretch` pinned BOTH panels to their
       column's LEFT edge: measured 427px of inboard gap on the left against
       32px on the right at 2560x1035, with a 235/636 outer-margin split.
       Ultra-wide is therefore its own rung, not a nice-to-have. */
    for (const viewport of [
      { width: 2560, height: 1035 },
      { width: 3440, height: 1440 },
    ]) {
      await bootDesktop(page, viewport);
      const m = await page.evaluate(() => {
        const q = (sel: string) => {
          const el = document.querySelector<HTMLElement>(sel);
          if (!el) throw new Error(`Missing ${sel}`);
          return el.getBoundingClientRect();
        };
        const scope = q("[data-vwh-region='scope'] .vwh__panel");
        const facts = q("[data-vwh-region='record'] .vwh__panel");
        const figure = q(".vwh__column");
        const mast = q("[data-vwh-region='identity']");
        const band = document.documentElement.clientWidth;
        return {
          gapL: figure.left - scope.right,
          gapR: facts.left - figure.right,
          outerL: scope.left,
          outerR: band - facts.right,
          panelL: scope.width,
          panelR: facts.width,
          mastCentre: mast.left + mast.width / 2,
          figureCentre: figure.left + figure.width / 2,
        };
      });
      const label = `${viewport.width}x${viewport.height}`;

      // the panels sit the same distance from the figure on both sides...
      expectNear(m.gapL, m.gapR, 1, `${label}: inboard gaps`);
      // ...and the width the screen brings becomes equal MARGIN, not stretch
      expectNear(m.outerL, m.outerR, 2, `${label}: outer margins`);
      // the reading measure is capped for readability and must not grow
      expectNear(m.panelL, m.panelR, 1, `${label}: panel measures`);
      expect(m.panelL, `${label}: measure stays capped`).toBeLessThanOrEqual(380);
      expectNear(m.mastCentre, m.figureCentre, 2, `${label}: identity centred`);
    }
  });

  test("the era scrubber rides the left rail without taking a column", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "explicit Chromium viewport matrix");

    for (const viewport of DESKTOP_VIEWPORTS) {
      await bootDesktop(page, viewport);
      const geom = await page.evaluate(() => {
        const q = (s: string) => document.querySelector<HTMLElement>(s);
        const strip = q(".vwh__era-selector");
        const figure = q(".vwh__column");
        if (!strip || !figure) throw new Error("Missing strip or figure");
        const station = q(".vwh")!.getBoundingClientRect();
        const stripRect = strip.getBoundingClientRect();
        const trackL = q(".hud__rail--l .hud__rail__track")!.getBoundingClientRect();
        const gauge = Array.from(
          document.querySelectorAll<HTMLElement>(".hud__rail--l .hud__rail__label")
        ).map((el) => el.getBoundingClientRect());
        const years = Array.from(document.querySelectorAll<HTMLElement>(".vwh__pip__year")).map(
          (el) => el.getBoundingClientRect()
        );
        return {
          strip: {
            left: stripRect.left,
            right: stripRect.right,
            top: stripRect.top,
            bottom: stripRect.bottom,
          },
          railLeft: trackL.left,
          railTop: trackL.top,
          railBottom: trackL.bottom,
          gaugeRight: gauge.length ? Math.max(...gauge.map((g) => g.right)) : null,
          yearLeft: years.length ? Math.min(...years.map((y) => y.left)) : null,
          yearTops: years.map((y) => y.top),
          scopeLeft: q("[data-vwh-region='scope'] .vwh__panel")!.getBoundingClientRect().left,
          figureTop: figure.getBoundingClientRect().top,
          stationTop: station.top,
        };
      });
      const label = `${viewport.width}x${viewport.height}`;

      /* ⚠ THE RAIL IS THE TRACK. Its own ticks extend OUTWARD into the margin,
         so the era stops hang off its inboard side — that is what makes this
         "leverage the left rail" rather than a second instrument beside it. */
      expectNear(geom.strip.left, geom.railLeft, 3, `${label}: scrubber on the rail`);
      /* ⚠ AND IT CLEARS THE RAIL'S OWN GAUGE NUMERALS, which sit INBOARD at
         `--hud-rail-guide-inset + 10px` — the same side. At an 18px lead the
         years printed straight through the depth gauge's "2" and "5". */
      if (geom.gaugeRight !== null && geom.yearLeft !== null) {
        expect(geom.yearLeft, `${label}: years clear the depth gauge`).toBeGreaterThan(
          geom.gaugeRight
        );
      }
      /* ⚠ IT COSTS THE COMPOSITION NO COLUMN — it lives in the HUD gutter,
         outboard of the reading band. That is the owner's own worry about
         "a lot of columns on lower screen sizes", pinned. */
      expect(geom.strip.right, `${label}: scrubber outside the reading band`).toBeLessThanOrEqual(
        geom.scopeLeft
      );
      // five stops on one pitch, in order, inside the rail's own extent
      expect(geom.yearTops.length).toBe(5);
      for (let i = 1; i < geom.yearTops.length; i += 1) {
        expect(geom.yearTops[i]).toBeGreaterThan(geom.yearTops[i - 1]);
      }
      expect(geom.strip.top).toBeGreaterThan(geom.railTop - 1);
      expect(geom.strip.bottom).toBeLessThan(geom.railBottom + 1);
    }
  });
});
