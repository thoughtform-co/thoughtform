import { expect, test, type Page } from "@playwright/test";

/**
 * About -> Voidwalker shared-actor seam (ADR-082 U3).
 *
 * This suite deliberately inspects geometry, scroll clocks and computed actor
 * poses. It does not use screenshots or compressed-byte heuristics: the seam's
 * contract is deterministic and should fail at the exact broken boundary.
 */
test.describe.configure({ mode: "serial" });

const CAPABLE_VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 800 },
  { width: 1920, height: 1080 },
] as const;

const CARD_ASPECT = 420 / 680;
const ABOUT_FLIGHT_END = 0.88;
const ABOUT_RESOLVE_END = 0.96;
const VOIDWALKER_ENTRY_END = 0.14;

type Viewport = (typeof CAPABLE_VIEWPORTS)[number];

function smootherstep(start: number, end: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

async function settleFrames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
  );
  await page.waitForTimeout(80);
}

async function bootCapableHandoff(page: Page, viewport: Viewport) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize(viewport);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-v2-stage");

  // Both writers mount asynchronously. `ready` is the common capability +
  // finite-target gate; waiting on it also prevents measuring pre-weld flow.
  await expect(page.locator("#voidwalker")).toHaveAttribute("data-vw-handoff", "ready", {
    timeout: 12_000,
  });
  await expect(page.locator("#about")).toHaveAttribute("data-about-handoff", "voidwalker", {
    timeout: 5_000,
  });
  await expect(page.locator(".vwh")).toHaveAttribute("data-vwh-ready", "", {
    timeout: 5_000,
  });
  await settleFrames(page);
}

async function setRunwayProgress(page: Page, selector: string, progress: number) {
  const y = await page.evaluate(
    ({ selector: runwaySelector, progress: runwayProgress }) => {
      const runway = document.querySelector<HTMLElement>(runwaySelector);
      if (!runway) throw new Error(`Missing runway: ${runwaySelector}`);
      const rect = runway.getBoundingClientRect();
      const documentTop = rect.top + window.scrollY;
      const travel = Math.max(0, runway.offsetHeight - window.innerHeight);
      return Math.round(documentTop + travel * runwayProgress);
    },
    { selector, progress }
  );

  await page.evaluate((targetY) => window.scrollTo({ top: targetY, behavior: "instant" }), y);
  await page.waitForFunction(
    ({ selector: runwaySelector, progress: runwayProgress }) => {
      const runway = document.querySelector<HTMLElement>(runwaySelector);
      if (!runway) return false;
      const travel = runway.offsetHeight - window.innerHeight;
      if (travel <= 0) return runwayProgress === 0;
      const actual = Math.max(0, Math.min(1, -runway.getBoundingClientRect().top / travel));
      return Math.abs(actual - runwayProgress) <= 0.002;
    },
    { selector, progress },
    { timeout: 5_000 }
  );
  await settleFrames(page);
}

async function setAboutProgress(page: Page, progress: number) {
  await setRunwayProgress(page, ".about-stage-root", progress);
}

async function setVoidwalkerProgress(page: Page, progress: number) {
  await setRunwayProgress(page, ".vw--hologram", progress);
}

async function readStructuralGeometry(page: Page) {
  return page.evaluate(() => {
    const about = document.querySelector<HTMLElement>("#about");
    const voidwalker = document.querySelector<HTMLElement>("#voidwalker");
    const runway = document.querySelector<HTMLElement>(".vw--hologram");
    const root = document.querySelector<HTMLElement>(".vwh");
    const slot = document.querySelector<HTMLElement>("[data-vwh-handoff-target='portrait']");
    const dossier = document.querySelector<HTMLElement>("[data-vwh-handoff-target='dossier']");
    if (!about || !voidwalker || !runway || !root || !slot || !dossier) {
      throw new Error("About/Voidwalker handoff geometry is incomplete");
    }

    const documentTop = (el: HTMLElement) => el.getBoundingClientRect().top + window.scrollY;
    const futurePinnedRect = (target: HTMLElement) => {
      let x = 0;
      let y = 0;
      let node: HTMLElement | null = target;
      while (node && node !== root) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }
      if (node !== root) throw new Error("Handoff target is not rooted in .vwh");
      const rootRect = root.getBoundingClientRect();
      const stickyTop = Number.parseFloat(getComputedStyle(root).top) || 0;
      return {
        left: rootRect.left + x,
        top: stickyTop + y,
        width: target.offsetWidth,
        height: target.offsetHeight,
      };
    };

    const portraitSlot = futurePinnedRect(slot);
    const portraitSeatHeight = portraitSlot.width / (420 / 680);
    const portraitSeat = {
      left: portraitSlot.left,
      top: portraitSlot.top + portraitSlot.height - portraitSeatHeight,
      width: portraitSlot.width,
      height: portraitSeatHeight,
    };

    const aboutTop = documentTop(about);
    const voidwalkerTop = documentTop(voidwalker);
    const aboutTravel = about.offsetHeight - window.innerHeight;
    const voidwalkerTravel = runway.offsetHeight - window.innerHeight;
    const aboutHandoffStartY = aboutTop + aboutTravel * 0.74;
    const voidwalkerSettledY = documentTop(runway) + voidwalkerTravel * 0.14;

    return {
      viewportHeight: window.innerHeight,
      stationMarginTop: Number.parseFloat(getComputedStyle(voidwalker).marginTop),
      overlap: aboutTop + about.offsetHeight - voidwalkerTop,
      voidwalkerRunwayHeight: runway.offsetHeight,
      settleDistance: voidwalkerSettledY - aboutHandoffStartY,
      portraitSlot,
      portraitSeat,
      dossier: futurePinnedRect(dossier),
    };
  });
}

async function readEntryPose(page: Page) {
  return page.evaluate(() => {
    const root = document.querySelector<HTMLElement>(".vwh");
    const slot = document.querySelector<HTMLElement>(".vwh__slot");
    const canvas = document.querySelector<HTMLCanvasElement>(".home-v2-stage__canvas-inner");
    const aboutTitle = document.querySelector<HTMLElement>(
      "[data-about-handoff-name] > .about-stage__copy-row"
    );
    if (!root || !slot || !canvas || !aboutTitle) {
      throw new Error("The capable renderer/title pair is not mounted");
    }

    const cssNumber = (name: string) => {
      const parsed = Number.parseFloat(root.style.getPropertyValue(name));
      return Number.isFinite(parsed) ? parsed : 0;
    };
    const actor = (selector: string) => {
      const el = root.querySelector<HTMLElement>(selector);
      if (!el) throw new Error(`Missing handoff actor: ${selector}`);
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        top: rect.top,
        left: rect.left,
        opacity: Number.parseFloat(style.opacity),
        transform: style.transform,
      };
    };

    const morph = cssNumber("--vwh-morph");
    return {
      morph,
      enter: cssNumber("--vwh-in"),
      exit: cssNumber("--vwh-exit"),
      webglOwnership: 1 - morph,
      hologramOpacity: Number.parseFloat(getComputedStyle(slot).opacity),
      aboutTitleOpacity: Number.parseFloat(getComputedStyle(aboutTitle).opacity),
      rootTop: root.getBoundingClientRect().top,
      canvasDisplay: getComputedStyle(canvas).display,
      slotCount: document.querySelectorAll(".vwh__slot").length,
      mediaCount: document.querySelectorAll(".vwh__slot > .vwh__media-wrap > .vwh__media").length,
      sourceSeatChildCount: document.querySelectorAll(".about-stage__slot > *").length,
      mast: actor(".vwh__mast"),
      eraTitle: actor("[data-vwh-handoff-target='era-title']"),
      dossier: actor("[data-vwh-handoff-target='dossier']"),
      base: actor(".vwh__base"),
      rail: actor(".vwh__rail"),
      mastKicker: actor(".vwh__mast__kicker"),
    };
  });
}

function expectNear(actual: number, expected: number, tolerance: number, label: string) {
  expect(Math.abs(actual - expected), `${label}: ${actual} vs ${expected}`).toBeLessThanOrEqual(
    tolerance
  );
}

function expectSamePose(
  actual: Awaited<ReturnType<typeof readEntryPose>>,
  expected: Awaited<ReturnType<typeof readEntryPose>>,
  label: string
) {
  for (const scalar of [
    "morph",
    "enter",
    "exit",
    "hologramOpacity",
    "aboutTitleOpacity",
  ] as const) {
    expectNear(actual[scalar], expected[scalar], 0.002, `${label} ${scalar}`);
  }
  for (const actor of ["mast", "eraTitle", "dossier", "base", "rail"] as const) {
    expectNear(actual[actor].top, expected[actor].top, 0.75, `${label} ${actor} top`);
    expectNear(actual[actor].left, expected[actor].left, 0.75, `${label} ${actor} left`);
    expectNear(actual[actor].opacity, expected[actor].opacity, 0.002, `${label} ${actor} opacity`);
    expect(actual[actor].transform, `${label} ${actor} transform`).toBe(expected[actor].transform);
  }
}

test.describe("About -> Voidwalker card-to-hologram handoff", () => {
  test("capable desktop geometry is welded and lands inside the measured destination", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "exact viewport matrix runs once in Chromium");

    for (const viewport of CAPABLE_VIEWPORTS) {
      await test.step(`${viewport.width}x${viewport.height}`, async () => {
        await bootCapableHandoff(page, viewport);
        const geometry = await readStructuralGeometry(page);

        expectNear(
          geometry.stationMarginTop,
          -1.2 * viewport.height,
          2,
          "capable-only station margin"
        );
        expectNear(geometry.overlap, 1.2 * viewport.height, 2, "About/Voidwalker overlap");
        expectNear(geometry.voidwalkerRunwayHeight, 2.6 * viewport.height, 2, "Voidwalker runway");
        expect(
          geometry.settleDistance,
          "entry resolves within half a viewport of the About handoff opening"
        ).toBeLessThanOrEqual(viewport.height * 0.5 + 2);

        // The WebGL card itself is not a DOM node. Its inspectable destination
        // contract is the authored portrait-aspect, bottom-aligned future seat.
        expectNear(
          geometry.portraitSeat.width / geometry.portraitSeat.height,
          CARD_ASPECT,
          0.002,
          "portrait seat aspect"
        );
        expectNear(
          geometry.portraitSeat.top + geometry.portraitSeat.height,
          geometry.portraitSlot.top + geometry.portraitSlot.height,
          2,
          "portrait and hologram bottom edge"
        );

        // The copy actor is inspectable: at its endpoint it must occupy the
        // first dossier's future pinned footprint to within the 2px contract.
        await setAboutProgress(page, ABOUT_RESOLVE_END);
        const landing = await page.evaluate(() => {
          const copy = document.querySelector<HTMLElement>("[data-about-handoff-copy]");
          const dossier = document.querySelector<HTMLElement>(
            "[data-vwh-handoff-target='dossier']"
          );
          const root = document.querySelector<HTMLElement>(".vwh");
          if (!copy || !dossier || !root) throw new Error("Missing handoff endpoint actor");

          let x = 0;
          let y = 0;
          let node: HTMLElement | null = dossier;
          while (node && node !== root) {
            x += node.offsetLeft;
            y += node.offsetTop;
            node = node.offsetParent as HTMLElement | null;
          }
          if (node !== root) throw new Error("Dossier is not rooted in .vwh");
          const stickyTop = Number.parseFloat(getComputedStyle(root).top) || 0;
          const target = {
            left: root.getBoundingClientRect().left + x,
            top: stickyTop + y,
            width: dossier.offsetWidth,
          };
          const source = copy.getBoundingClientRect();
          return {
            source: { left: source.left, top: source.top, width: source.width },
            target,
          };
        });
        expectNear(landing.source.left, landing.target.left, 2, "copy/dossier left edge");
        expectNear(landing.source.top, landing.target.top, 2, "copy/dossier top edge");
        expectNear(landing.source.width, landing.target.width, 2, "copy/dossier width");

        // The name has an independent actor and lands in the fixed era-title
        // seat before the shared renderer/title acquisition begins.
        await setAboutProgress(page, ABOUT_FLIGHT_END);
        const titleLanding = await page.evaluate(() => {
          const source = document.querySelector<HTMLElement>("[data-about-handoff-name]");
          const target = document.querySelector<HTMLElement>(
            "[data-vwh-handoff-target='era-title']"
          );
          const root = document.querySelector<HTMLElement>(".vwh");
          if (!source || !target || !root) throw new Error("Missing title endpoint actor");

          let x = 0;
          let y = 0;
          let node: HTMLElement | null = target;
          while (node && node !== root) {
            x += node.offsetLeft;
            y += node.offsetTop;
            node = node.offsetParent as HTMLElement | null;
          }
          if (node !== root) throw new Error("Era title is not rooted in .vwh");
          const stickyTop = Number.parseFloat(getComputedStyle(root).top) || 0;
          const sourceRect = source.getBoundingClientRect();
          return {
            source: {
              left: sourceRect.left,
              top: sourceRect.top,
              width: sourceRect.width,
              height: sourceRect.height,
            },
            target: {
              left: root.getBoundingClientRect().left + x,
              top: stickyTop + y,
              width: target.offsetWidth,
              height: target.offsetHeight,
            },
          };
        });
        for (const channel of ["left", "top", "width", "height"] as const) {
          expectNear(
            titleLanding.source[channel],
            titleLanding.target[channel],
            2,
            `name/title ${channel}`
          );
        }

        // Flight and copy windows end before/About's release by contract.
        expect(ABOUT_FLIGHT_END).toBeLessThan(ABOUT_RESOLVE_END);
        expect(ABOUT_RESOLVE_END).toBeLessThan(1);
      });
    }
  });

  test("renderer ownership, horizontal-only entry and interrupted reversals reconstruct", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "handoff dynamics run once in Chromium");
    for (const viewport of CAPABLE_VIEWPORTS) {
      await test.step(`${viewport.width}x${viewport.height}`, async () => {
        await bootCapableHandoff(page, viewport);

        // Before the receiver pins, all of its moving actors are still present
        // for measurement but visually absent; the station cannot rise in.
        await setAboutProgress(page, 0.84);
        const approach = await page.evaluate(() => {
          const root = document.querySelector<HTMLElement>(".vwh");
          if (!root) throw new Error("Missing .vwh root");
          const opacity = (selector: string) => {
            const el = root.querySelector<HTMLElement>(selector);
            return el ? Number.parseFloat(getComputedStyle(el).opacity) : -1;
          };
          return {
            rootTop: root.getBoundingClientRect().top,
            slotOpacity: opacity(".vwh__slot"),
            actorOpacities: [
              opacity(".vwh__mast__kicker"),
              opacity("[data-vwh-handoff-target='dossier']"),
              opacity(".vwh__base"),
              opacity(".vwh__pip"),
            ],
          };
        });
        expect(approach.rootTop, "receiver is still below its sticky pin").toBeGreaterThan(1);
        expect(approach.slotOpacity).toBe(0);
        for (const opacity of approach.actorOpacities) expect(opacity).toBe(0);

        const ownership: Array<Awaited<ReturnType<typeof readEntryPose>>> = [];
        for (const progress of [0, 0.04, 0.08]) {
          await setVoidwalkerProgress(page, progress);
          const pose = await readEntryPose(page);
          ownership.push(pose);
          const expectedMorph = smootherstep(0, 0.08, progress);
          // Browser scroll coordinates quantize to device/CSS pixels; around
          // midpoint that can move smootherstep by ~0.004 on the 1280px runway.
          expectNear(pose.morph, expectedMorph, 0.006, `morph at ${progress}`);
          expectNear(pose.hologramOpacity, pose.morph, 0.002, `DOM ownership at ${progress}`);
          expectNear(
            pose.aboutTitleOpacity + pose.eraTitle.opacity,
            1,
            0.002,
            `complementary title ownership at ${progress}`
          );
          expectNear(
            pose.eraTitle.opacity,
            pose.morph,
            0.002,
            `destination title ownership at ${progress}`
          );
          expectNear(
            pose.webglOwnership + pose.hologramOpacity,
            1,
            0.002,
            `complementary ownership at ${progress}`
          );
          expect(pose.canvasDisplay).toBe("block");
          expect(pose.slotCount, "one DOM hologram renderer").toBe(1);
          expect(pose.mediaCount, "one hologram media actor").toBe(1);
          expect(
            pose.sourceSeatChildCount,
            "the WebGL portrait is not cloned into the DOM seat"
          ).toBe(0);
        }
        expectNear(ownership[1]!.morph, 0.5, 0.006, "midpoint renderer crossing");

        // Entry may spread sideways by <=24px, but no actor may travel
        // vertically. Compare pinned poses across the whole entry window.
        await setVoidwalkerProgress(page, 0.015);
        const entryStart = await readEntryPose(page);
        await setVoidwalkerProgress(page, 0.12);
        const entryEnd = await readEntryPose(page);
        expectNear(entryStart.rootTop, 0, 1, "entry start pin");
        expectNear(entryEnd.rootTop, 0, 1, "entry end pin");
        for (const actor of ["mast", "eraTitle", "dossier", "base", "rail"] as const) {
          expectNear(
            entryEnd[actor].top,
            entryStart[actor].top,
            0.75,
            `${actor} vertical entrance`
          );
        }

        // Same progress must produce the same complete pose after an
        // interrupted reverse, a deeper pass, and leaving/re-entering.
        await setVoidwalkerProgress(page, 0.06);
        const reference = await readEntryPose(page);
        await setVoidwalkerProgress(page, 0.025);
        await setVoidwalkerProgress(page, 0.06);
        expectSamePose(await readEntryPose(page), reference, "interrupted reverse");

        await setVoidwalkerProgress(page, 0.2);
        await setAboutProgress(page, 0.7);
        const reset = await readEntryPose(page);
        expect(reset.morph).toBe(0);
        expect(reset.hologramOpacity).toBe(0);
        await setVoidwalkerProgress(page, 0.06);
        expectSamePose(await readEntryPose(page), reference, "full re-entry");

        // The shortened entry envelope is fully resolved by 0.14.
        await setVoidwalkerProgress(page, VOIDWALKER_ENTRY_END);
        const settled = await readEntryPose(page);
        expectNear(settled.enter, 1, 0.002, "shortened entry endpoint");
      });
    }
  });

  test("1024px and reduced-motion paths remain un-overlapped normal flow", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "fallback matrix runs once in Chromium");

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".vwh");
    await page.waitForTimeout(1_900);
    const tablet = await page.evaluate(() => {
      const about = document.querySelector<HTMLElement>("#about");
      const voidwalker = document.querySelector<HTMLElement>("#voidwalker");
      const root = document.querySelector<HTMLElement>(".vwh");
      if (!about || !voidwalker || !root) throw new Error("Missing tablet fallback surface");
      const aboutBottom = about.getBoundingClientRect().bottom + window.scrollY;
      const voidwalkerTop = voidwalker.getBoundingClientRect().top + window.scrollY;
      return {
        aboutMode: about.getAttribute("data-about-mode"),
        aboutHandoff: about.getAttribute("data-about-handoff"),
        voidwalkerMode: voidwalker.getAttribute("data-vw-mode"),
        voidwalkerHandoff: voidwalker.getAttribute("data-vw-handoff"),
        rootReady: root.hasAttribute("data-vwh-ready"),
        marginTop: Number.parseFloat(getComputedStyle(voidwalker).marginTop),
        flowGap: voidwalkerTop - aboutBottom,
      };
    });
    expect(tablet.aboutMode).toBe("stage");
    expect(tablet.aboutHandoff).toBeNull();
    expect(tablet.voidwalkerMode).toBeNull();
    expect(tablet.voidwalkerHandoff).toBeNull();
    expect(tablet.rootReady).toBe(false);
    expectNear(tablet.marginTop, 0, 0.5, "1024 station margin");
    expect(tablet.flowGap, "1024 normal-flow sections do not overlap").toBeGreaterThanOrEqual(-1);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 800 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(".vwh");
    await page.waitForTimeout(1_900);
    const reduced = await page.evaluate(() => {
      const about = document.querySelector<HTMLElement>("#about");
      const voidwalker = document.querySelector<HTMLElement>("#voidwalker");
      const root = document.querySelector<HTMLElement>(".vwh");
      const media = document.querySelector<HTMLElement>(".vwh__media");
      if (!about || !voidwalker || !root || !media) {
        throw new Error("Missing reduced-motion fallback surface");
      }
      const aboutBottom = about.getBoundingClientRect().bottom + window.scrollY;
      const voidwalkerTop = voidwalker.getBoundingClientRect().top + window.scrollY;
      return {
        aboutMode: about.getAttribute("data-about-mode"),
        aboutHandoff: about.getAttribute("data-about-handoff"),
        voidwalkerMode: voidwalker.getAttribute("data-vw-mode"),
        voidwalkerHandoff: voidwalker.getAttribute("data-vw-handoff"),
        rootReady: root.hasAttribute("data-vwh-ready"),
        marginTop: Number.parseFloat(getComputedStyle(voidwalker).marginTop),
        flowGap: voidwalkerTop - aboutBottom,
        mediaAnimation: getComputedStyle(media).animationName,
      };
    });
    expect(reduced.aboutMode).toBeNull();
    expect(reduced.aboutHandoff).toBeNull();
    expect(reduced.voidwalkerMode).toBeNull();
    expect(reduced.voidwalkerHandoff).toBeNull();
    expect(reduced.rootReady).toBe(false);
    expectNear(reduced.marginTop, 0, 0.5, "reduced-motion station margin");
    expect(reduced.flowGap, "reduced-motion sections do not overlap").toBeGreaterThanOrEqual(-1);
    expect(reduced.mediaAnimation).toBe("none");
  });
});
