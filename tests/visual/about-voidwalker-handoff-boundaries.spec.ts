import { expect, test, type Page, type TestInfo } from "@playwright/test";

/**
 * ADR-082 U3 capability/compositing boundary matrix.
 *
 * The primary handoff spec owns the motion geometry. This serial companion
 * owns the ways that geometry may engage or must fail closed: reload, live
 * media-query changes, mobile/no-GL fallbacks, theme parity, and the two
 * opaque/transparent compositing boundaries around the shared seam.
 */
test.describe.configure({ mode: "serial" });

const DESKTOP = { width: 1440, height: 800 } as const;
const HANDOFF_TIMEOUT = 15_000;

function desktopOnly(testInfo: TestInfo) {
  test.skip(testInfo.project.name !== "desktop", "boundary matrix runs once in Chromium");
}

function smootherstep(start: number, end: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function cssAlpha(color: string): number {
  if (color === "transparent") return 0;
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (!match) throw new Error(`Cannot parse CSS colour: ${color}`);
  const channels = match[1]!.split(/[\s,\/]+/).filter(Boolean);
  return channels.length >= 4 ? Number.parseFloat(channels[3]!) : 1;
}

async function settle(page: Page, extraMs = 80) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
  if (extraMs) await page.waitForTimeout(extraMs);
}

async function waitForHandoff(page: Page) {
  await page.waitForSelector(".home-v2-stage");
  await expect(page.locator("#voidwalker")).toHaveAttribute("data-vw-handoff", "ready", {
    timeout: HANDOFF_TIMEOUT,
  });
  await expect(page.locator("#voidwalker")).toHaveAttribute("data-vw-mode", "hologram");
  await expect(page.locator("#about")).toHaveAttribute("data-about-handoff", "voidwalker", {
    timeout: 5_000,
  });
  await expect(page.locator("#voidwalker .vwh")).toHaveAttribute("data-vwh-ready", "");
  await settle(page);
}

async function bootCapable(page: Page, path = "/") {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize(DESKTOP);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForHandoff(page);
}

async function setRunwayProgress(page: Page, selector: string, progress: number) {
  const y = await page.evaluate(
    ({ runwaySelector, runwayProgress }) => {
      const runway = document.querySelector<HTMLElement>(runwaySelector);
      if (!runway) throw new Error(`Missing runway: ${runwaySelector}`);
      const top = runway.getBoundingClientRect().top + window.scrollY;
      const travel = Math.max(0, runway.offsetHeight - window.innerHeight);
      return Math.round(top + travel * runwayProgress);
    },
    { runwaySelector: selector, runwayProgress: progress }
  );
  await page.evaluate((target) => window.scrollTo({ top: target, behavior: "instant" }), y);
  await page.waitForFunction(
    ({ runwaySelector, runwayProgress }) => {
      const runway = document.querySelector<HTMLElement>(runwaySelector);
      if (!runway) return false;
      const travel = runway.offsetHeight - window.innerHeight;
      if (travel <= 0) return runwayProgress === 0;
      const actual = Math.max(0, Math.min(1, -runway.getBoundingClientRect().top / travel));
      return Math.abs(actual - runwayProgress) <= 0.003;
    },
    { runwaySelector: selector, runwayProgress: progress },
    { timeout: 5_000 }
  );
  await settle(page);
}

async function walkToRunwayProgress(page: Page, selector: string, progress: number) {
  const y = await page.evaluate(
    ({ runwaySelector, runwayProgress }) => {
      const runway = document.querySelector<HTMLElement>(runwaySelector);
      if (!runway) throw new Error(`Missing runway: ${runwaySelector}`);
      const top = runway.getBoundingClientRect().top + window.scrollY;
      const travel = Math.max(0, runway.offsetHeight - window.innerHeight);
      return Math.round(top + travel * runwayProgress);
    },
    { runwaySelector: selector, runwayProgress: progress }
  );
  await page.evaluate(async (target) => {
    const step = Math.max(320, window.innerHeight * 0.5);
    const direction = target >= window.scrollY ? 1 : -1;
    for (
      let at = window.scrollY;
      direction > 0 ? at < target : at > target;
      at += direction * step
    ) {
      window.scrollTo({ top: at, behavior: "instant" });
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    window.scrollTo({ top: target, behavior: "instant" });
  }, y);
  await settle(page, 700);
}

async function flowState(page: Page) {
  return page.evaluate(() => {
    const about = document.querySelector<HTMLElement>("#about");
    const voidwalker = document.querySelector<HTMLElement>("#voidwalker");
    const root = document.querySelector<HTMLElement>("#voidwalker .vwh");
    if (!about || !voidwalker || !root) throw new Error("Missing About/Voidwalker boundary");
    const documentTop = (element: HTMLElement) =>
      element.getBoundingClientRect().top + window.scrollY;
    return {
      aboutMode: about.getAttribute("data-about-mode"),
      aboutHandoff: about.getAttribute("data-about-handoff"),
      voidwalkerMode: voidwalker.getAttribute("data-vw-mode"),
      voidwalkerHandoff: voidwalker.getAttribute("data-vw-handoff"),
      rootReady: root.hasAttribute("data-vwh-ready"),
      rootInert: root.inert,
      marginTop: Number.parseFloat(getComputedStyle(voidwalker).marginTop),
      flowGap: documentTop(voidwalker) - (documentTop(about) + about.offsetHeight),
    };
  });
}

test.describe("About -> Voidwalker handoff boundaries", () => {
  test("deep-link and refresh below the seam reconstruct from scroll truth", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);
    await bootCapable(page, "/#voidwalker");
    await page.waitForFunction(() => {
      const root = document.querySelector<HTMLElement>("#voidwalker .vwh");
      return root ? Math.abs(root.getBoundingClientRect().top) <= 2 : false;
    });

    const deepLink = await page.evaluate(() => ({
      hash: location.hash,
      scrollY: window.scrollY,
      rootTop: document.querySelector<HTMLElement>("#voidwalker .vwh")?.getBoundingClientRect().top,
    }));
    expect(deepLink.hash).toBe("#voidwalker");
    expect(deepLink.scrollY, "the hash lands below the page origin").toBeGreaterThan(
      DESKTOP.height
    );
    expect(
      Math.abs(deepLink.rootTop ?? Number.POSITIVE_INFINITY),
      "the requested stage is pinned"
    ).toBeLessThanOrEqual(2);

    // Refresh is a separate navigation case. Start it on a clean, non-anchor
    // history entry: `replaceState` retains Chromium's original anchor-rest
    // metadata even after the visible hash is removed.
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHandoff(page);
    await setRunwayProgress(page, ".vw--hologram", 0.06);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForHandoff(page);
    await page.waitForFunction(() => window.scrollY > window.innerHeight);
    const after = await page.evaluate(() => {
      const runway = document.querySelector<HTMLElement>(".vw--hologram");
      const root = document.querySelector<HTMLElement>(".vwh");
      if (!runway || !root) throw new Error("Missing reloaded handoff runway");
      const travel = runway.offsetHeight - window.innerHeight;
      const progress =
        travel > 0 ? Math.max(0, Math.min(1, -runway.getBoundingClientRect().top / travel)) : 0;
      return {
        scrollY: window.scrollY,
        progress,
        morph: Number.parseFloat(root.style.getPropertyValue("--vwh-morph")),
        mode: document.getElementById("voidwalker")?.getAttribute("data-vw-mode"),
        handoff: document.getElementById("voidwalker")?.getAttribute("data-vw-handoff"),
      };
    });

    expect(after.scrollY, "reload remains below the page origin").toBeGreaterThan(DESKTOP.height);
    // Chromium restores the anchored ACTOR, not a raw document Y: late runway
    // inflation can seat that actor at the receiver's p=0 boundary. What must
    // reconstruct is the pose for the restored scroll truth, without a latch.
    expect(after.progress).toBeGreaterThanOrEqual(0);
    expect(after.progress, "refresh remains in the receiver's entry band").toBeLessThanOrEqual(
      0.14
    );
    expect(after.mode).toBe("hologram");
    expect(after.handoff).toBe("ready");
    expect(Math.abs(after.morph - smootherstep(0, 0.08, after.progress))).toBeLessThanOrEqual(
      0.008
    );
  });

  test("live resize across 1101px tears down and rebuilds the common gate", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1101, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForHandoff(page);

    const at1101 = await flowState(page);
    expect(at1101.marginTop).toBeCloseTo(-960, 0);
    expect(at1101.flowGap).toBeCloseTo(-960, 0);

    await page.setViewportSize({ width: 1100, height: 800 });
    await page.waitForFunction(() => {
      const vw = document.getElementById("voidwalker");
      const about = document.getElementById("about");
      return (
        vw?.getAttribute("data-vw-mode") === null &&
        vw?.getAttribute("data-vw-handoff") === null &&
        about?.getAttribute("data-about-handoff") === null
      );
    });
    await settle(page);
    const at1100 = await flowState(page);
    expect(at1100.aboutMode).toBe("stage");
    expect(at1100.rootReady).toBe(false);
    expect(at1100.marginTop).toBeCloseTo(0, 1);
    expect(at1100.flowGap).toBeGreaterThanOrEqual(-1);

    await page.setViewportSize({ width: 1101, height: 800 });
    await waitForHandoff(page);
    await setRunwayProgress(page, ".about-stage-root", 0.8);
    const rebuilt = await page.evaluate(() => {
      const runway = document.querySelector<HTMLElement>(".about-stage-root");
      const stage = document.querySelector<HTMLElement>(".about-stage");
      if (!runway || !stage) throw new Error("Missing rebuilt About handoff");
      const travel = runway.offsetHeight - window.innerHeight;
      const progress =
        travel > 0 ? Math.max(0, Math.min(1, -runway.getBoundingClientRect().top / travel)) : 0;
      return {
        progress,
        handoff: Number.parseFloat(stage.style.getPropertyValue("--about-handoff")),
        copyScale: Number.parseFloat(stage.style.getPropertyValue("--about-handoff-copy-scale")),
      };
    });
    expect(
      Math.abs(rebuilt.handoff - smootherstep(0.74, 0.96, rebuilt.progress))
    ).toBeLessThanOrEqual(0.006);
    expect(rebuilt.copyScale).toBeGreaterThan(0);
    expect((await flowState(page)).marginTop).toBeCloseTo(-960, 0);
  });

  test("mobile widths keep Voidwalker in un-overlapped static flow", async ({ page }, testInfo) => {
    desktopOnly(testInfo);
    await page.emulateMedia({ reducedMotion: "no-preference" });

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ]) {
      await test.step(`${viewport.width}x${viewport.height}`, async () => {
        await page.setViewportSize(viewport);
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await expect(page.locator("#voidwalker")).toHaveAttribute("data-vw-surface", "hologram", {
          timeout: 10_000,
        });
        await settle(page);
        const state = await flowState(page);
        expect(state.aboutMode).toBeNull();
        expect(state.aboutHandoff).toBeNull();
        expect(state.voidwalkerMode).toBeNull();
        expect(state.voidwalkerHandoff).toBeNull();
        expect(state.rootReady).toBe(false);
        expect(state.rootInert).toBe(false);
        expect(state.marginTop).toBeCloseTo(0, 1);
        expect(state.flowGap).toBeGreaterThanOrEqual(-1);
      });
    }
  });

  test("forced WebGL fallback invalidates the handoff and preserves normal flow", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);
    await page.addInitScript(() => {
      const proto = HTMLCanvasElement.prototype as unknown as {
        getContext: (type: string, ...rest: unknown[]) => unknown;
      };
      const original = proto.getContext;
      proto.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
        return original.call(this, type, ...rest);
      };
    });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize(DESKTOP);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator('.home-v2-stage[data-fallback="true"]')).toHaveCount(1, {
      timeout: HANDOFF_TIMEOUT,
    });
    await expect(page.locator("#voidwalker")).toHaveAttribute("data-vw-surface", "hologram");
    await settle(page);

    const state = await flowState(page);
    expect(state.aboutMode).toBeNull();
    expect(state.aboutHandoff).toBeNull();
    expect(state.voidwalkerMode).toBeNull();
    expect(state.voidwalkerHandoff).toBeNull();
    expect(state.rootReady).toBe(false);
    expect(state.marginTop).toBeCloseTo(0, 1);
    expect(state.flowGap).toBeGreaterThanOrEqual(-1);
    await expect(page.locator(".home-v2-stage__canvas-inner")).toHaveCount(0);
  });

  test("dark and light themes preserve the same capable handoff contract", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);
    const snapshots: Array<{
      theme: string;
      mode: string | null;
      handoff: string | null;
      marginTop: number;
      background: string;
      backgroundImage: string;
      morph: number;
    }> = [];

    for (const [theme, path] of [
      ["dark", "/"],
      ["light", "/?theme=light"],
    ] as const) {
      await bootCapable(page, path);
      await walkToRunwayProgress(page, ".vw--hologram", 0.04);
      await expect(page.locator("html")).toHaveAttribute("data-corridor-exit", "true", {
        timeout: 5_000,
      });
      snapshots.push(
        await page.evaluate((themeName) => {
          const station = document.getElementById("voidwalker");
          const root = document.querySelector<HTMLElement>(".vwh");
          if (!station || !root) throw new Error("Missing themed handoff");
          const style = getComputedStyle(station);
          return {
            theme: themeName,
            mode: station.getAttribute("data-vw-mode"),
            handoff: station.getAttribute("data-vw-handoff"),
            marginTop: Number.parseFloat(style.marginTop),
            background: style.backgroundColor,
            backgroundImage: style.backgroundImage,
            morph: Number.parseFloat(root.style.getPropertyValue("--vwh-morph")),
          };
        }, theme)
      );
    }

    for (const snapshot of snapshots) {
      expect(snapshot.mode, `${snapshot.theme}: mode`).toBe("hologram");
      expect(snapshot.handoff, `${snapshot.theme}: handoff`).toBe("ready");
      expect(snapshot.marginTop, `${snapshot.theme}: overlap`).toBeCloseTo(-960, 0);
      expect(cssAlpha(snapshot.background), `${snapshot.theme}: transparent station`).toBe(0);
      expect(snapshot.backgroundImage, `${snapshot.theme}: starless station`).toBe("none");
      expect(
        Math.abs(snapshot.morph - 0.5),
        `${snapshot.theme}: takeover midpoint`
      ).toBeLessThanOrEqual(0.008);
    }
  });

  test("the hologram floor stays isolated and contained inside a transparent starless station", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);
    await bootCapable(page);
    await walkToRunwayProgress(page, ".vw--hologram", 0.04);
    await expect(page.locator("html")).toHaveAttribute("data-corridor-exit", "true", {
      timeout: 5_000,
    });

    const state = await page.evaluate(() => {
      const station = document.getElementById("voidwalker");
      const slot = document.querySelector<HTMLElement>(".vwh__slot");
      const wrap = document.querySelector<HTMLElement>(".vwh__media-wrap");
      const media = document.querySelector<HTMLElement>(".vwh__media");
      if (!station || !slot || !wrap || !media) throw new Error("Missing hologram floor");
      const stationStyle = getComputedStyle(station);
      const slotStyle = getComputedStyle(slot);
      const wrapStyle = getComputedStyle(wrap);
      const mediaStyle = getComputedStyle(media);
      const stationRect = station.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      return {
        stationBackground: stationStyle.backgroundColor,
        stationBackgroundImage: stationStyle.backgroundImage,
        isolation: slotStyle.isolation,
        floorBackground: wrapStyle.backgroundColor,
        mask: wrapStyle.maskImage || wrapStyle.webkitMaskImage,
        blend: mediaStyle.mixBlendMode,
        stationWidth: stationRect.width,
        slot: {
          left: slotRect.left,
          top: slotRect.top,
          right: slotRect.right,
          bottom: slotRect.bottom,
        },
        wrap: {
          left: wrapRect.left,
          top: wrapRect.top,
          right: wrapRect.right,
          bottom: wrapRect.bottom,
        },
      };
    });

    expect(cssAlpha(state.stationBackground)).toBe(0);
    expect(state.stationBackgroundImage).toBe("none");
    expect(state.isolation).toBe("isolate");
    expect(cssAlpha(state.floorBackground), "the additive media has an opaque local floor").toBe(1);
    expect(state.mask).not.toBe("none");
    expect(["plus-lighter", "screen"]).toContain(state.blend);
    expect(state.wrap.left).toBeGreaterThanOrEqual(state.slot.left - 1);
    expect(state.wrap.top).toBeGreaterThanOrEqual(state.slot.top - 1);
    expect(state.wrap.right).toBeLessThanOrEqual(state.slot.right + 1);
    expect(state.wrap.bottom).toBeLessThanOrEqual(state.slot.bottom + 1);
    expect(state.wrap.right - state.wrap.left).toBeLessThan(state.stationWidth * 0.75);
  });

  test("#practice is an actually opaque station when it kills the corridor", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);
    await bootCapable(page);
    await walkToRunwayProgress(page, ".vw--hologram", 0.5);
    await expect(page.locator("html")).toHaveAttribute("data-services-ambient", "true", {
      timeout: 5_000,
    });
    await expect(page.locator("html")).toHaveAttribute("data-corridor-exit", "true");
    const practiceY = await page.evaluate(() => {
      const practice = document.getElementById("practice");
      if (!practice) throw new Error("Missing #practice");
      return Math.round(
        practice.getBoundingClientRect().top + window.scrollY + window.innerHeight * 0.3
      );
    });
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), practiceY);
    await page.waitForFunction(
      () =>
        !document.documentElement.hasAttribute("data-services-ambient") &&
        !document.documentElement.hasAttribute("data-corridor-exit")
    );
    await settle(page);

    const state = await page.evaluate(() => {
      const practice = document.getElementById("practice");
      if (!practice) throw new Error("Missing #practice");
      const style = getComputedStyle(practice);
      return {
        top: practice.getBoundingClientRect().top,
        background: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        ambient: document.documentElement.hasAttribute("data-services-ambient"),
        exit: document.documentElement.hasAttribute("data-corridor-exit"),
      };
    });
    expect(state.top).toBeLessThan(0);
    expect(state.ambient).toBe(false);
    expect(state.exit).toBe(false);
    expect(cssAlpha(state.background), "#practice owns an opaque ground").toBe(1);
    expect(state.backgroundImage, "the opaque station surface is painted").not.toBe("none");
  });
});
