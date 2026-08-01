import { expect, test, type Page } from "@playwright/test";

/**
 * Arc terminal-motion smoke (ADR-057).
 *
 * Structural contracts only — no screenshot baselines (mirrors
 * services-ring-smoke.spec.ts). These are the properties that fail
 * SILENTLY on this surface:
 *
 *   - the masthead decodes AT REST (identity transform, full opacity) —
 *     the whole ask, and a stray travel var reads as "it flies in";
 *   - panels power on from their own rung and the plane irises shut on
 *     the way out, leaving an EMPTY stage before the beat releases;
 *   - scrolling back up RE-ARMS to a blank rather than a fade;
 *   - no box clips on any beat at laptop heights — the project's default
 *     1440×900 hides every clipping bug this content has;
 *   - v1 pages are untouched: `is-arc-js`, zero terminal markup, and the
 *     one-shot reveal still fires.
 *
 * Arc routes carry no WebGL, so these run in parallel safely — but the
 * page's `scroll-behavior: smooth` means every drive here is a REAL
 * stepped scroll, never a teleport: the arm/strike ladder has to
 * sequence, and a jump skips the states being asserted.
 */

const V2 = "/arcs/claude-workshop-v2";
const KEYNOTE_V2 = "/arcs/ai-keynote-v2";

/** Kill smooth scrolling so a stepped drive lands where we asked. */
async function prepare(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "html{scroll-behavior:auto !important}" });
  await page.waitForTimeout(500);
}

/** Stepped real scroll — the ladder must sequence, so never teleport. */
async function driveTo(page: Page, y: number, steps = 8) {
  const from = await page.evaluate(() => window.scrollY);
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((t) => window.scrollTo(0, t), Math.round(from + ((y - from) * i) / steps));
    await page.waitForTimeout(70);
  }
}

/** Scroll a beat to its park: its stage bottom meeting the viewport bottom. */
async function parkBeat(page: Page, id: string, steps = 8) {
  const geo = await page.evaluate((id) => {
    const s = document.getElementById(id);
    if (!s) return null;
    const stage = s.querySelector<HTMLElement>(".arc-stage");
    return {
      top: Math.round(s.getBoundingClientRect().top + window.scrollY),
      stageH: stage?.offsetHeight ?? 0,
    };
  }, id);
  if (!geo) throw new Error(`no beat #${id}`);
  await driveTo(page, geo.top + Math.max(0, geo.stageH - page.viewportSize()!.height), steps);
  // Wait for the decode to settle rather than sleeping a fixed guess.
  await page
    .locator(`#${id} .arc-stage[data-reveal="done"]`)
    .waitFor({ state: "attached", timeout: 15_000 });
}

const beatState = (page: Page, id: string) =>
  page.evaluate((id) => {
    const s = document.getElementById(id)!;
    const stage = s.querySelector<HTMLElement>(".arc-stage")!;
    const head = stage.querySelector<HTMLElement>(".arc-head, .arc-inter__band, .arc-close__band");
    const plane = stage.querySelector<HTMLElement>(".arc-plane")!;
    const targets = [...stage.querySelectorAll<HTMLElement>("[data-arc-decode]")];
    return {
      reveal: stage.getAttribute("data-reveal"),
      secIn: stage.style.getPropertyValue("--sec-in"),
      secOut: stage.style.getPropertyValue("--sec-out"),
      headTransform: head ? getComputedStyle(head).transform : null,
      headOpacity: head ? Number(getComputedStyle(head).opacity) : null,
      planeClip: getComputedStyle(plane).clipPath,
      planeOpacity: Number(getComputedStyle(plane).opacity),
      total: targets.length,
      resolved: targets.filter((el) => el.textContent === el.dataset.arcDecode).length,
      blank: targets.filter((el) => el.textContent === "").length,
    };
  }, id);

test.describe("arc terminal motion (ADR-057)", () => {
  test("the masthead decodes at rest, with zero travel", async ({ page }, testInfo) => {
    test.skip(
      (testInfo.project.use.viewport?.width ?? 0) < 961,
      "terminal motion is an enhanced-tier grammar"
    );
    await prepare(page, V2);

    const root = page.locator(".arc-root");
    await expect(root).toHaveAttribute("data-motion", "terminal");
    // The two grammars are disjoint by gate: terminal pages never take
    // the v1 reveal class, so the two can never fight over an element.
    await expect(root).not.toHaveClass(/is-arc-js/);

    await parkBeat(page, "diagnosis");
    const s = await beatState(page, "diagnosis");
    expect(s.total).toBeGreaterThan(0);
    expect(s.resolved).toBe(s.total);
    // THE ask: it does not fly in and it does not crossfade.
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(s.headTransform);
    expect(s.headOpacity).toBeGreaterThan(0.99);
    expect(s.secIn).toBe("1.0000");
    expect(s.secOut).toBe("0.0000");
  });

  test("the plane folds and irises shut, and is empty before it releases", async ({
    page,
  }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) < 961, "enhanced tier only");
    await prepare(page, V2);
    await parkBeat(page, "diagnosis");

    const atPark = await beatState(page, "diagnosis");
    expect(atPark.planeOpacity).toBeGreaterThan(0.99);
    // Fully open, and the open inset rests NEGATIVE — the survey marks
    // overhang their border box, so a 0 inset amputates them. (Computed
    // clip serialises as `inset(-30px calc(0% - 14px))`.)
    expect(atPark.planeClip).toMatch(/calc\(0%\s*-\s*14px\)/);

    // Drive into the tail; the fold is scrubbed, so mid-tail must be a
    // genuine in-between state, not a switch. THE MASTHEAD LAW: the head
    // never fades and never moves — it UN-TYPES. By mid-tail (past the
    // 0.5 force-blank guard) its text is gone while the head box itself
    // still reads identity transform at full opacity.
    const h = page.viewportSize()!.height;
    await driveTo(page, (await page.evaluate(() => window.scrollY)) + h * 0.45, 5);
    await page.waitForTimeout(400);
    const mid = await beatState(page, "diagnosis");
    expect(Number(mid.secOut)).toBeGreaterThan(0.2);
    expect(Number(mid.secOut)).toBeLessThan(1);
    expect(mid.headOpacity).toBe(1);
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(mid.headTransform);
    expect(mid.blank).toBe(mid.total);

    // By the time the NEXT beat parks, this one is fully folded — what
    // scrolls away is an empty plane, which is what lets the beats stay
    // opaque with no z-index choreography between them (ADR-008).
    await parkBeat(page, "substrate-map");
    const gone = await beatState(page, "diagnosis");
    expect(gone.secOut).toBe("1.0000");
    expect(gone.planeOpacity).toBeLessThan(0.01);
  });

  test("scrolling back up un-types in place — the reverse effect, never a slide", async ({
    page,
  }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) < 961, "enhanced tier only");
    await prepare(page, V2);
    // Park a beat DEEP in the page so there is real travel above it.
    await parkBeat(page, "substrate-map");
    expect((await beatState(page, "substrate-map")).blank).toBe(0);

    // Sit INSIDE the tail first: a reader parked exactly AT the park
    // point has zero pinned runway above (sticky-bottom releases on the
    // first upward pixel — that path is the force-blank truncation, not
    // the reverse effect). 10% of the tail keeps the text resolved
    // (below the 0.12 un-type edge) with ~60px of pinned runway above.
    const tailPx = await page.evaluate(
      () => document.querySelector<HTMLElement>("#substrate-map .arc-beat__tail")!.offsetHeight
    );
    await driveTo(page, (await page.evaluate(() => window.scrollY)) + tailPx * 0.1, 3);
    await page.waitForTimeout(200);
    expect((await beatState(page, "substrate-map")).blank).toBe(0);

    // A few slow upward steps: the un-type must begin while the stage is
    // still pinned — the head box does not move while its text reverses.
    const headTop0 = await page.evaluate(
      () => document.querySelector("#substrate-map .arc-head")!.getBoundingClientRect().top
    );
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollTo(0, window.scrollY - 12));
      await page.waitForTimeout(90);
    }
    const during = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>("#substrate-map .arc-stage")!;
      const head = document.querySelector("#substrate-map .arc-head")!;
      const targets = [...stage.querySelectorAll<HTMLElement>("[data-arc-decode]")];
      return {
        reveal: stage.getAttribute("data-reveal"),
        headTop: head.getBoundingClientRect().top,
        unresolved: targets.filter((el) => el.textContent !== el.dataset.arcDecode).length,
      };
    });
    // The reverse effect is running (or already finished) …
    expect(["untyping", "armed"]).toContain(during.reveal);
    expect(during.unresolved).toBeGreaterThan(0);
    // … and the head has not moved a pixel while it plays.
    expect(Math.abs(during.headTop - headTop0)).toBeLessThanOrEqual(1);

    // Fully above: blank, at rest, ready to replay.
    await driveTo(page, 0, 10);
    await page.waitForTimeout(400);
    const rearmed = await beatState(page, "substrate-map");
    expect(rearmed.reveal).toBe("armed");
    expect(rearmed.blank).toBe(rearmed.total);
    expect(rearmed.headOpacity).toBe(1);

    // And it replays on the way back down.
    await parkBeat(page, "substrate-map");
    const replayed = await beatState(page, "substrate-map");
    expect(replayed.resolved).toBe(replayed.total);
  });

  test("scrolling UP into a beat and stopping still types it in", async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) < 961, "enhanced tier only");
    await prepare(page, V2);
    const geo = await page.evaluate(() => {
      const s = document.getElementById("diagnosis")!;
      const stage = s.querySelector<HTMLElement>(".arc-stage")!;
      const tail = s.querySelector<HTMLElement>(".arc-beat__tail")!;
      const top = Math.round(s.getBoundingClientRect().top + window.scrollY);
      return {
        park: top + Math.max(0, stage.offsetHeight - window.innerHeight),
        tail: tail.offsetHeight,
      };
    });

    // Leave the beat entirely (it arms), then come BACK UP into its
    // dwell and stop dead.
    await driveTo(page, geo.park + geo.tail + page.viewportSize()!.height * 0.8, 6);
    await page.waitForTimeout(300);
    await expect(page.locator('#diagnosis .arc-stage[data-reveal="armed"]')).toHaveCount(1);
    await driveTo(page, geo.park + Math.round(geo.tail * 0.02), 10);

    // The strike here rides a settle timer, NOT the scroll frame — the
    // scroll writer's rAF stops the instant the reader does, so without
    // a self-waking check the masthead stays blank forever (it did).
    await expect(page.locator('#diagnosis .arc-stage[data-reveal="done"]')).toHaveCount(1, {
      timeout: 10_000,
    });
    const s = await beatState(page, "diagnosis");
    expect(s.resolved).toBe(s.total);
    expect(s.headOpacity).toBe(1);
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(s.headTransform);
  });

  test("a tall beat pins its masthead — it types stationary and holds while content scrolls", async ({
    page,
  }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) < 961, "enhanced tier only");
    await prepare(page, V2);
    // skills-engine is taller than every laptop viewport.
    const geo = await page.evaluate(() => {
      const s = document.getElementById("skills-engine")!;
      return { top: Math.round(s.getBoundingClientRect().top + scrollY) };
    });
    const h = page.viewportSize()!.height;
    // Read partway through the tall stage — well past the head's pin.
    await driveTo(page, geo.top + h * 0.6, 8);
    await page
      .locator('#skills-engine .arc-stage[data-reveal="done"]')
      .waitFor({ state: "attached", timeout: 15_000 });
    const a = await page.evaluate(() => {
      const s = document.getElementById("skills-engine")!;
      return {
        tall: s.hasAttribute("data-arc-tall"),
        pin: s.style.getPropertyValue("--arc-head-pin"),
        headTop: s.querySelector(".arc-head")!.getBoundingClientRect().top,
      };
    });
    expect(a.tall).toBe(true);
    expect(a.pin).toMatch(/^\d+px$/);
    // Scroll deeper into the same beat: the head must not move.
    await driveTo(page, geo.top + h * 1.0, 4);
    await page.waitForTimeout(150);
    const b = await page.evaluate(
      () => document.querySelector("#skills-engine .arc-head")!.getBoundingClientRect().top
    );
    expect(Math.abs(b - a.headTop)).toBeLessThanOrEqual(1);
    expect(Math.round(a.headTop)).toBe(parseInt(a.pin, 10));
  });

  test("no box clips on any beat at laptop heights", async ({ browser }) => {
    // Walks every beat at two viewports and waits for each decode — far
    // past the default per-test budget, and worth it: this is the check
    // that catches the whole class of bug.
    test.setTimeout(300_000);
    // The project default is 1440×900, which hides every clipping bug
    // this content has ever had. These two are the ones that bite.
    for (const [width, height] of [
      [1280, 720],
      [1440, 800],
    ] as const) {
      const page = await browser.newPage({ viewport: { width, height } });
      await prepare(page, V2);
      const ids = await page.evaluate(() =>
        [...document.querySelectorAll("[data-arc-beat]")].map((s) => s.id)
      );
      expect(ids.length).toBeGreaterThan(10);
      for (const id of ids) {
        await parkBeat(page, id, 4);
        const bad = await page.evaluate((id) => {
          const stage = document.querySelector<HTMLElement>(`#${id} .arc-stage`)!;
          const out: string[] = [];
          stage
            .querySelectorAll<HTMLElement>(".arc-band, .arc-plane, [data-arc-panel], .arc-tdec")
            .forEach((el) => {
              const cs = getComputedStyle(el);
              if (cs.overflow !== "visible" && el.scrollHeight - el.clientHeight > 1) {
                out.push(`${el.className} +${el.scrollHeight - el.clientHeight}px`);
              }
            });
          return out;
        }, id);
        expect(bad, `${id} @ ${width}x${height}`).toEqual([]);
      }
      // The root clips horizontal overflow visually; scrollWidth still tells.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      );
      expect(overflow, `horizontal overflow @ ${width}x${height}`).toBeLessThanOrEqual(0);
      await page.close();
    }
  });

  test("media apertures sweep open and video stays unfetched", async ({ page }, testInfo) => {
    test.skip((testInfo.project.use.viewport?.width ?? 0) < 961, "enhanced tier only");
    await prepare(page, KEYNOTE_V2);
    const frame = page.locator("#proof-ai-atl .arc-ap").first();
    await expect(frame).toHaveCount(1);

    // Before arrival the frame is clipped to a zero-width centre slit.
    const closed = await frame.evaluate((el) => getComputedStyle(el).clipPath);
    expect(closed).toContain("50%");

    await parkBeat(page, "proof-ai-atl");
    const open = await frame.evaluate((el) => getComputedStyle(el).clipPath);
    expect(open).not.toBe(closed);
    expect(open).toContain("-14px");

    // Zero bytes until a click — the arc mp4s are 13-20 MB.
    const video = page.locator("#proof-ai-atl video");
    await expect(video).toHaveAttribute("preload", "none");
    expect(await video.evaluate((v: HTMLVideoElement) => v.autoplay)).toBe(false);
  });

  test("reduced motion resolves everything statically", async ({ browser }) => {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    await prepare(page, V2);
    await driveTo(page, 4000, 8);
    await page.waitForTimeout(500);
    const state = await page.evaluate(() => {
      const targets = [...document.querySelectorAll<HTMLElement>("[data-arc-decode]")];
      return {
        blank: targets.filter((el) => el.textContent === "").length,
        withState: document.querySelectorAll("[data-reveal]").length,
        ghostVisible: getComputedStyle(document.querySelector(".arc-tdec__ghost")!).visibility,
      };
    });
    // Nothing ever blanks and no beat ever enters a motion state.
    expect(state.blank).toBe(0);
    expect(state.withState).toBe(0);
    expect(state.ghostVisible).toBe("visible");
    await page.close();
  });

  test("the v1 pages are untouched", async ({ page }) => {
    for (const slug of ["claude-workshop", "ai-keynote"]) {
      await prepare(page, `/arcs/${slug}`);
      const root = page.locator(".arc-root");
      await expect(root).toHaveClass(/is-arc-js/);
      await expect(root).not.toHaveAttribute("data-motion", /.*/);
      expect(
        await page.evaluate(
          () =>
            document.querySelectorAll(
              "[data-arc-beat],[data-arc-panel],[data-arc-decode],.arc-stage,.arc-tdec"
            ).length
        )
      ).toBe(0);
      // The one-shot reveal still fires.
      const probe = page.locator(".arc-reveal").nth(6);
      await expect(probe).not.toHaveClass(/is-in/);
      await driveTo(page, 2600, 6);
      await expect(probe).toHaveClass(/is-in/, { timeout: 5_000 });
    }
  });

  test("the overview lists both cuts with distinguishable chips", async ({ page }) => {
    await prepare(page, "/arcs");
    const cards = page.locator(".arc-card");
    await expect(cards).toHaveCount(4);
    const chips = await page.locator(".arc-card__chip").allTextContents();
    expect(new Set(chips).size).toBe(chips.length);
    await expect(page.locator('.arc-card[href="/arcs/claude-workshop-v2"]')).toHaveCount(1);
    await expect(page.locator('.arc-card[href="/arcs/ai-keynote-v2"]')).toHaveCount(1);
  });
});
