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
  await expect(page.locator("#voidwalker .vwd")).toHaveAttribute("data-vwh-ready", "");
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
    const root = document.querySelector<HTMLElement>("#voidwalker .vwd");
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
      const root = document.querySelector<HTMLElement>("#voidwalker .vwd");
      return root ? Math.abs(root.getBoundingClientRect().top) <= 2 : false;
    });

    const deepLink = await page.evaluate(() => ({
      hash: location.hash,
      scrollY: window.scrollY,
      rootTop: document.querySelector<HTMLElement>("#voidwalker .vwd")?.getBoundingClientRect().top,
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
      const root = document.querySelector<HTMLElement>(".vwd");
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
          const root = document.querySelector<HTMLElement>(".vwd");
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

  test("the hologram floor matches its compositing branch inside a transparent starless station", async ({
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
        alphaBranch: slot.hasAttribute("data-holo-alpha"),
        /* Which lane won. Presence is still the contract every CSS selector
           reads; the VALUE is here so a regression that lights the attribute
           with no alpha source behind it fails LOUDLY rather than by its
           pixels (ADR-082 U23). */
        alphaCodec: slot.getAttribute("data-holo-alpha"),
        stationBackground: stationStyle.backgroundColor,
        stationBackgroundImage: stationStyle.backgroundImage,
        isolation: slotStyle.isolation,
        floorBackground: wrapStyle.backgroundColor,
        mask: wrapStyle.maskImage || wrapStyle.webkitMaskImage,
        clip: wrapStyle.clipPath,
        media: (() => {
          const r = media.getBoundingClientRect();
          return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        })(),
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
    /* ⚠ NO CI PROJECT REACHES THE `hevc` LANE, AND SAYING SO IS THE POINT.
       Every phone project here is Chromium (ADR-107 U1 deleted the WebKit
       ones), and Chromium composites VP9 alpha — so it settles `vp9` and the
       HEVC probe never even runs. The Safari lane is guarded by
       `character-era-hologram.test.ts` on the record's side and by a hand walk
       on a real device; a guard that silently covers two of three branches is
       worse than one that names the gap. */
    if (state.alphaBranch) {
      expect(["vp9", "hevc"], "the lit attribute names a real lane").toContain(state.alphaCodec);
    }
    /* ⚠ THE FLOOR CONTRACT BRANCHES ON THE CODEC VERDICT (ADR-082 U6), and
       until 2026-09-01 this test asserted only the FALLBACK half — against a
       landing that ships the ALPHA branch, which is why it was permanently
       red while the code was correct. With real alpha media the hacks are
       OFF (mix-blend-mode: normal, no ground, transparent wrap, isolation:
       auto); the Safari/H.264 fallback keeps the isolate + opaque masked
       floor + additive blend, and those rules may never be deleted. */
    if (state.alphaBranch) {
      expect(state.isolation, "alpha branch: isolation off").toBe("auto");
      expect(cssAlpha(state.floorBackground), "alpha branch: no local floor").toBe(0);
      expect(state.blend, "alpha branch: no additive blend").toBe("normal");
      /* ⚠ THE MEDIA MUST FIT INSIDE ITS OWN WRAP'S CLIP (ADR-082 U31). The
         asserts below pin the WRAP inside the SLOT, which a `clip-path` cannot
         change — so nothing here could see that U29's overscan drew the floor
         era's media LARGER than the wrap and the wrap's `inset(0)` sliced ~27px
         of azeroth's pauldrons off each side. Two halves, because a vignette
         hides overflow as well as a clip does: the mask is off on this branch
         at the capable width, and the clip — resolved to px, percentages being
         of the wrap's own box — opens at least as far as the media box. */
      expect(state.mask, "alpha branch: no vignette to hide the overscan").toBe("none");
      const m = /inset\(([^)]*)\)/.exec(state.clip ?? "");
      const parts = m ? m[1].trim().split(/\s+/) : ["0px"];
      const [, r, , l] =
        parts.length === 1
          ? [parts[0], parts[0], parts[0], parts[0]]
          : parts.length === 2
            ? [parts[0], parts[1], parts[0], parts[1]]
            : parts.length === 3
              ? [parts[0], parts[1], parts[2], parts[1]]
              : parts;
      const px = (v: string, base: number) =>
        v.endsWith("%") ? (Number.parseFloat(v) / 100) * base : Number.parseFloat(v) || 0;
      const ww = state.wrap.right - state.wrap.left;
      /* ⚠ SIDES ONLY HERE. This read is taken at runway 0.04 — mid-acquisition,
         where the TOP inset is wiping up from 62 % on purpose — so the top edge
         is asserted in the held read below, on the era that actually spills. */
      expect(state.media.left, "the clip opens to the media's left edge").toBeGreaterThanOrEqual(
        state.wrap.left + px(l, ww) - 1
      );
      expect(state.media.right, "the clip opens to the media's right edge").toBeLessThanOrEqual(
        state.wrap.right - px(r, ww) + 1
      );
    } else {
      expect(state.isolation).toBe("isolate");
      expect(cssAlpha(state.floorBackground), "the additive media has an opaque local floor").toBe(
        1
      );
      expect(state.mask).not.toBe("none");
      expect(["plus-lighter", "screen"]).toContain(state.blend);
    }
    expect(state.wrap.left).toBeGreaterThanOrEqual(state.slot.left - 1);
    expect(state.wrap.top).toBeGreaterThanOrEqual(state.slot.top - 1);
    expect(state.wrap.right).toBeLessThanOrEqual(state.slot.right + 1);
    expect(state.wrap.bottom).toBeLessThanOrEqual(state.slot.bottom + 1);
    expect(state.wrap.right - state.wrap.left).toBeLessThan(state.stationWidth * 0.75);
  });

  test("no element wider than 700px paints a border or ground in #voidwalker (ADR-082 U21)", async ({
    page,
  }, testInfo) => {
    /* The datum rails and the ground datum were deleted because three 1653px
       hairlines ran the full plate through the HUD rails' own tick ladder.
       This sweep is the executable half of that ruling: nothing wide enough
       to read as a full-bleed line may paint a border or a ground inside the
       station. ⚠ It asserts PAINT on the active branch, not presence —
       `.vwh__ground` legitimately stays in the DOM as the Safari fallback
       and must not red this sweep on the alpha branch. */
    desktopOnly(testInfo);
    await bootCapable(page);
    await walkToRunwayProgress(page, ".vw--hologram", 0.4);
    await settle(page, 400);

    const offenders = await page.evaluate(() => {
      const alpha = (color: string) => {
        if (!color || color === "transparent") return 0;
        const m = color.match(/rgba?\(([^)]+)\)/);
        if (!m) return 1;
        const ch = m[1]!.split(/[\s,\/]+/).filter(Boolean);
        return ch.length >= 4 ? Number.parseFloat(ch[3]!) : 1;
      };
      const station = document.getElementById("voidwalker");
      if (!station) throw new Error("no #voidwalker");
      const out: Array<{ el: string; w: number; why: string }> = [];
      for (const el of station.querySelectorAll<HTMLElement>("*")) {
        const r = el.getBoundingClientRect();
        if (r.width <= 700 || r.height === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0)
          continue;
        const why: string[] = [];
        if (alpha(cs.backgroundColor) > 0) why.push(`bg ${cs.backgroundColor}`);
        if (cs.backgroundImage !== "none") why.push("bg-image");
        for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
          const st = cs.getPropertyValue(`border-${side.toLowerCase()}-style`);
          const w = Number.parseFloat(cs.getPropertyValue(`border-${side.toLowerCase()}-width`));
          const c = cs.getPropertyValue(`border-${side.toLowerCase()}-color`);
          if (st !== "none" && w > 0 && alpha(c) > 0) why.push(`border-${side.toLowerCase()}`);
        }
        if (why.length > 0) {
          const cls = typeof el.className === "string" ? el.className : el.tagName;
          out.push({ el: cls, w: Math.round(r.width), why: why.join(" + ") });
        }
      }
      return out;
    });

    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);

    /* ⚠ AND THE FLOOR ERA'S MEDIA FITS ITS WRAP'S CLIP, AT REST (ADR-082 U31).
       azeroth is the one era whose `fit` is exactly 1, so under the desktop
       overscan its media box is LARGER than the wrap (that is what cut his
       pauldrons). Held and acquired, all three open edges are checked; the
       bottom stays the wrap's own, because the boots are seated on it.
       ⚠ 0.44 IS HIS SLICE'S CENTRE, NOT 0.4. The era is scroll-derived WITH
       HYSTERESIS (ADR-082 U10), so a reader arriving from above is still on the
       previous era until ~0.409 — and a scrubbed arrival, unlike a click, does
       not restart the 900ms materialize that animates this very clip. */
    await walkToRunwayProgress(page, ".vw--hologram", 0.44);
    await settle(page, 600);
    const paint = await page.evaluate(() => {
      const slot = document.querySelector<HTMLElement>("#voidwalker .vwh__slot");
      const wrap = document.querySelector<HTMLElement>("#voidwalker .vwh__media-wrap");
      const media = document.querySelector<HTMLElement>("#voidwalker .vwh__media");
      const sheet = document.querySelector<HTMLElement>("#voidwalker .vwd__sheet");
      if (!slot || !wrap || !media) throw new Error("Missing hologram media");
      const w = wrap.getBoundingClientRect();
      const b = media.getBoundingClientRect();
      const m = /inset\(([^)]*)\)/.exec(getComputedStyle(wrap).clipPath || "");
      const parts = m ? m[1].trim().split(/\s+/) : ["0px"];
      const [t, r, , l] =
        parts.length === 1
          ? [parts[0], parts[0], parts[0], parts[0]]
          : parts.length === 2
            ? [parts[0], parts[1], parts[0], parts[1]]
            : parts.length === 3
              ? [parts[0], parts[1], parts[2], parts[1]]
              : parts;
      const px = (v: string, base: number) =>
        v.endsWith("%") ? (Number.parseFloat(v) / 100) * base : Number.parseFloat(v) || 0;
      return {
        alpha: slot.hasAttribute("data-holo-alpha"),
        era: sheet?.getAttribute("data-vwd-era") ?? null,
        spills: b.width > w.width + 1,
        cutLeft: Math.max(0, w.left + px(l, w.width) - b.left),
        cutRight: Math.max(0, b.right - (w.right - px(r, w.width))),
        cutTop: Math.max(0, w.top + px(t, w.height) - b.top),
      };
    });
    if (paint.alpha) {
      expect(paint.era, "runway 0.44 holds on the floor era").toBe("azeroth");
      expect(paint.spills, "the floor era's media really is larger than its wrap").toBe(true);
      expect(paint.cutLeft, "nothing cut off the media's left").toBeLessThanOrEqual(1);
      expect(paint.cutRight, "nothing cut off the media's right").toBeLessThanOrEqual(1);
      expect(paint.cutTop, "nothing cut off the media's top").toBeLessThanOrEqual(1);
    }
  });

  test("the musings band is an actually opaque cover when it kills the corridor", async ({
    page,
  }, testInfo) => {
    desktopOnly(testInfo);
    await bootCapable(page);
    await walkToRunwayProgress(page, ".vw--hologram", 0.5);
    await expect(page.locator("html")).toHaveAttribute("data-services-ambient", "true", {
      timeout: 5_000,
    });
    await expect(page.locator("html")).toHaveAttribute("data-corridor-exit", "true");
    /* ⚠ THE WAYPOINT IS THE KILL EDGE ITSELF, NOT A WALK PAST IT — AND THAT IS
       ARITHMETIC, NOT A PREFERENCE. Every earlier cover was at least three
       viewports tall, so "0.3 viewports inside it" still left the box covering
       the frame. The band is EXACTLY `100svh`: one pixel past its top it covers
       `vh − 1`, and what shows in the gap is the held footer beginning to be
       revealed, which is correct behaviour and not a cover failure. So the
       property is asserted where it is actually claimed — at the edge the
       envelope reaches zero on, which is the band's own top.
       ⚠ The clamp stays for the reason ADR-105 recorded: `scrollTo` clamps
       silently and `waitForFunction` does not, so a target past the document's
       end waits out its whole timeout on a page already where it was asked. */
    await page.evaluate(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const cover = document.querySelector<HTMLElement>("#musings .mu__band");
      if (!cover) throw new Error("Missing .mu__band");
      const y = cover.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, Math.min(Math.ceil(y), max)), behavior: "instant" });
    });
    await page.waitForFunction(
      () =>
        !document.documentElement.hasAttribute("data-services-ambient") &&
        !document.documentElement.hasAttribute("data-corridor-exit")
    );
    await settle(page);

    const state = await page.evaluate(() => {
      const cover = document.querySelector<HTMLElement>("#musings .mu__band");
      if (!cover) throw new Error("Missing .mu__band");
      const style = getComputedStyle(cover);
      return {
        top: cover.getBoundingClientRect().top,
        bottom: cover.getBoundingClientRect().bottom,
        vh: window.innerHeight,
        background: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        ambient: document.documentElement.hasAttribute("data-services-ambient"),
        exit: document.documentElement.hasAttribute("data-corridor-exit"),
      };
    });
    /* ⚠ THE PROPERTY IS COVERAGE, NOT A NEGATIVE TOP. This asserted `top < 0`
       — a proxy for "the walk got inside the station" that only holds while
       something follows it. ADR-105 made the cover the FOOTER, i.e. the last
       viewport of the document, so its top rested at exactly 0 and there was
       nowhere further to go. What the ambient's death actually depends on is
       that an opaque station FILLS the screen, so that is what is measured.
       ⚠ ADR-119 MOVED THE COVER ONTO A THREE-VIEWPORT STATION, AND THE
       ASSERTION IS NOT LOOSENED BACK. `#musings` has runway under it, so
       `top < 0` would pass again — which is exactly why it is not restored:
       it would be passing by coincidence a second time, and the next pass
       that moves the cover onto a one-viewport station would find a green
       guard and a dead canvas. Coverage is the property either way. */
    expect(state.top).toBeLessThanOrEqual(0);
    /* ⚠ ADR-119 U1: THE COVER IS THE BAND, NOT THE STATION. `#musings` is a
       TRANSPARENT stage over the live corridor on this rung — it has no ground
       of its own and cannot be what ends the ambient. Its opaque end is one
       100svh full-bleed box at the foot of its runway, and the coverage
       property below binds EXACTLY on it rather than by three viewports of
       slack, which is a strengthening. */
    /* ⚠ ONE SUB-PIXEL OF TOLERANCE, AND IT IS ARITHMETIC RATHER THAN A
       LOOSENING (ADR-105 U2). ⚠ THE COVER IS NO LONGER THE STATION THIS
       PARAGRAPH IS ABOUT — ADR-119 moved it to `#musings`, three viewports
       tall, where the fraction cannot bind. The tolerance is KEPT and the
       reasoning KEPT WITH IT, because `#contact` is still the document's last
       element and this exact arithmetic is what any future assertion on it
       has to survive. The record follows.
       Under ADR-105 the cover WAS the document's LAST element and
       its height was its content's, which is fractional — text line boxes and
       `svh` clamps do not land on integers. The browser CEILS `scrollHeight`
       to compute max scroll, so at the true bottom of the page
             bottom = vh - 1 + frac(documentHeight)
       and an exact `>= vh` can only pass when that fraction happens to be
       zero. It did before ADR-105 U2 and it was LUCK: any copy edit anywhere
       above moves it. Measured at the failure: body 18979.75, scrollHeight
       18980, bottom 799.75 against a 800px frame — a quarter of a CSS pixel,
       below the device grid at DPR 1 and invisible at DPR 2.
       The property is still coverage; what changed is that the assertion can
       now express it on a page whose height is not a whole number. */
    expect(state.bottom, "the cover does not fill the viewport").toBeGreaterThanOrEqual(
      state.vh - 1
    );
    expect(state.ambient).toBe(false);
    expect(state.exit).toBe(false);
    expect(cssAlpha(state.background), "the band owns an opaque ground").toBe(1);
    expect(state.backgroundImage, "the opaque station surface is painted").not.toBe("none");
  });
});
