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

  test("1024px, mobile and reduced-motion paths use the settled normal-flow order", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "fallback matrix runs once in Chromium");

    for (const viewport of [
      { width: 1024, height: 800, tolerance: 3 },
      { width: 390, height: 844, tolerance: 3 },
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

  test("a failed loop falls back to the normalized canonical poster", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "media failure runs once in Chromium");
    await page.route("**/videos/voidwalker/holo-idle-thoughtform.mp4", (route) => route.abort());
    await bootDesktop(page, { width: 1440, height: 800 });

    const media = page.locator(".vwh__media");
    await expect(media).toHaveJSProperty("tagName", "IMG");
    await expect(media).toHaveAttribute("src", "/images/voidwalker/holo-still-thoughtform.jpg");
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
});
