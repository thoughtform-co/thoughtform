import { expect, test, type Page } from "@playwright/test";

import { VOIDWALKER_CHARACTER_STAGE } from "../../components/landing/home-v2/unifiedServicesInstrument";

/**
 * Production homepage corridor smoke (ADR-018 / ADR-021 / ADR-022).
 *
 * No screenshot baselines: each test asserts a structural contract
 * the marketing route relies on, so a regression that breaks the
 * corridor wiring fails the suite without needing per-machine
 * baseline updates. Pairs with `landing-page.spec.ts` (which carries
 * the visual snapshots).
 */

// The corridor's attribute writers live inside the WebGL frameloop —
// running many landing pages in parallel against one dev server starves
// headless GPU contexts and the hooks never mount (same failure mode
// services-ring-smoke.spec.ts documents). Serialize this file's tests.
test.describe.configure({ mode: "serial" });

const ARC_SETTLE_MS = 700;

/** Roll to `y` in viewport-sized steps, then let the corridor catch up. */
async function rollTo(page: Page, y: number) {
  await page.evaluate(async (target: number) => {
    const step = Math.max(300, window.innerHeight * 0.5);
    const from = window.scrollY;
    const dir = target > from ? 1 : -1;
    for (let at = from; dir > 0 ? at < target : at > target; at += dir * step) {
      window.scrollTo(0, at);
      await new Promise((r) => requestAnimationFrame(r));
    }
    window.scrollTo(0, target);
  }, y);
  await page.waitForTimeout(ARC_SETTLE_MS);
}

/**
 * Park inside the corridor's `navigate` band (the Arc) and return the
 * scroll position, so a test that leaves can come back to the same place.
 *
 * ⚠ NEVER NAVIGATE THIS CORRIDOR BY A HARDCODED PIXEL COUNT. The stage is
 * sized in viewport units, so the same `y` lands at a different fraction
 * of the corridor on every project — measured stage heights run 6921 to
 * 9676 across the four. At the `y = 2800` these tests used to hardcode
 * that is 0.40 of the corridor on iphone-14 and 0.37 on iphone-14-pro-max,
 * which is the whole reason 2800 sat in `navigate` on three shapes and in
 * `thesis` on the tall phone. The band itself is at 0.40–0.50 on the two
 * phones and 0.30–0.40 on tablet and desktop, so no single fraction is
 * safe either: search for it.
 *
 * ⚠ AND SETTLING COSTS REAL MILLISECONDS. `data-corridor-phase` is written
 * from the WebGL frameloop off a SMOOTHED scroll value, so it lags
 * window.scrollY by more than a frame. A walk that settles on
 * requestAnimationFrame alone never sees the attribute change at all —
 * measured, it reports `thesis` from the top of the stage to the bottom
 * on all four projects. That is why the search below is a Playwright-side
 * loop with a timeout per probe rather than one fast pass inside
 * page.evaluate.
 */
async function walkToArc(page: Page): Promise<number> {
  const stage = await page.evaluate(() => {
    const el = document.querySelector(".home-v2-stage");
    return el ? el.getBoundingClientRect().height : 9000;
  });

  const seen: string[] = [];
  for (let frac = 0.28; frac <= 0.56; frac += 0.04) {
    const y = Math.round(stage * frac);
    await rollTo(page, y);
    const phase = await page.evaluate(() =>
      document.documentElement.getAttribute("data-corridor-phase")
    );
    if (phase === "navigate") return Math.round(y);
    seen.push(`${frac.toFixed(2)}:${phase ?? "-"}`);
  }

  throw new Error(
    `the search never found the corridor's navigate band (stage=${Math.round(stage)}, saw ${seen.join(" ")})`
  );
}

async function scrollToPercentage(page: Page, percentage: number) {
  await page.evaluate((pct: number) => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = (pct / 100) * scrollHeight;
    window.scrollTo({ top: targetScroll, behavior: "instant" });
  }, percentage);
  await page.waitForTimeout(400);
}

test.describe("Homepage corridor smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage");
    await page.waitForTimeout(800);
  });

  test("ADR-018: corridor mount placeholder exists and HomeCorridor renders into it", async ({
    page,
  }) => {
    const mount = page.locator("#home-corridor-mount");
    await expect(mount).toHaveCount(1);
    // The R3F sticky stage host mounts inside the placeholder.
    const stage = page.locator("#home-corridor-mount .home-v2-stage");
    await expect(stage).toHaveCount(1);
  });

  test("ADR-021: production stations are in the right relative order", async ({ page }) => {
    const order = await page.evaluate(() => {
      const ids = [
        "hero",
        "home-corridor-mount",
        "services",
        // ADR-033 funnel: the bio follows services as the opaque cover,
        // then the philosophy beat. The Loop case is no longer a station:
        // ADR-056 made it the casefile at the TOP of #services. #tools
        // and #build retired (the cases orbit the Arc's Build park).
        "about",
        // ADR-074: the through-line follows the bio and is the opaque
        // cover; #practice trails it as an empty breather.
        "voidwalker",
        "practice",
        "contact",
      ];
      return ids.map((id) => ({ id, top: document.getElementById(id)?.offsetTop ?? -1 }));
    });

    for (const node of order) {
      expect(node.top, `expected #${node.id} to be present`).toBeGreaterThanOrEqual(0);
    }
    for (let i = 1; i < order.length; i += 1) {
      expect(
        order[i].top,
        `expected #${order[i].id} to follow #${order[i - 1].id} in source order`
      ).toBeGreaterThan(order[i - 1].top);
    }
  });

  test("ADR-018 retired stations are no longer in the DOM", async ({ page }) => {
    const removed = [
      "definition",
      "missing-layer",
      "intelligence-layer",
      "approach",
      "buildQuote",
      // ADR-033: both standalone case surfaces retired.
      "build",
      "tools",
    ];
    const present = await page.evaluate(
      (ids) => ids.map((id) => Boolean(document.getElementById(id))),
      removed
    );
    expect(present).toEqual(removed.map(() => false));
  });

  test("ADR-022: corridor entry flag clears once the stage releases sticky", async ({ page }) => {
    await scrollToPercentage(page, 0);
    const entryAtTop = await page.evaluate(() =>
      document.documentElement.getAttribute("data-corridor-entry")
    );
    expect(entryAtTop === "1" || entryAtTop === null).toBe(true);

    await scrollToPercentage(page, 30);
    const entryDuringFlythrough = await page.evaluate(() =>
      document.documentElement.getAttribute("data-corridor-entry")
    );
    // The fixed-hold curtain only engages over the entry band; deep
    // into the corridor the flag must be absent so the docked-exit
    // `position: fixed` canvas (ADR-021) does not collide with it.
    expect(entryDuringFlythrough).toBeNull();
  });

  test("ADR-018: corridor engagement attribute toggles around the stage", async ({ page }) => {
    // ON leg — the attribute engages inside the corridor band. The band
    // sits at a different page-height fraction per viewport, so probe a
    // spread of depths instead of pinning one exact percentage.
    // (No hero-at-0 assertion: on 390x844 the armed phase legitimately
    // reaches scroll 0 — the hero is inside the corridor's arming band.)
    let engagedInCorridor = false;
    for (const pct of [25, 30, 20, 35, 40]) {
      await scrollToPercentage(page, pct);
      const engaged = await page.evaluate(() =>
        document.documentElement.getAttribute("data-corridor-engaged")
      );
      if (engaged === "true") {
        engagedInCorridor = true;
        break;
      }
    }
    expect(engagedInCorridor).toBe(true);

    // OFF leg — deep past the corridor (post-dock tail) the flag must
    // release on every viewport, so the v7 HUD can own the rail again.
    await scrollToPercentage(page, 90);
    const engagedAtTail = await page.evaluate(() =>
      document.documentElement.getAttribute("data-corridor-engaged")
    );
    expect(engagedAtTail).not.toBe("true");
  });

  test("ADR-021: dock attribute releases on reverse scroll back into corridor", async ({
    page,
  }) => {
    // ⚠ THIS TEST NAVIGATES BY THE CORRIDOR STAGE'S OWN RECT, NOT BY A
    // page-percentage. The percentages used to land here (50/55 forward,
    // 25 back) drifted as ADR-081 grew the page by 14 svh of voidwalker
    // travel runway: on the current layout 25 % puts #services at
    // servicesTop=382 (right in the dock-engage window), so the assertion
    // was true against a percentage that no longer named "middle of the
    // corridor". Rect-based navigation is invariant to page height.
    //
    // The seam target: scroll until the corridor stage's top is one
    // viewport ABOVE 0 (i.e. we are one viewport into the docked window).
    const seamY = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>(".home-v2-stage");
      if (!stage) return 0;
      const r = stage.getBoundingClientRect();
      // stage.top + scrollY = stage's document-space top. Add the stage's
      // own height so the viewport top sits at the stage's bottom, then
      // pull back one vh to sit inside the docked band.
      return Math.round(r.top + window.scrollY + stage.offsetHeight - window.innerHeight * 0.5);
    });
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), seamY);
    await page.waitForTimeout(500);
    await page.evaluate(
      (y) =>
        window.scrollTo({ top: y + Math.round(window.innerHeight * 0.4), behavior: "instant" }),
      seamY
    );
    await page.waitForTimeout(500);
    // Then back to a position where #services is at least TWO viewports
    // below the fold — the honest "middle of the corridor" definition, so
    // sectionNearDock is false by construction.
    const midY = await page.evaluate(() => {
      const svc = document.querySelector<HTMLElement>("#services");
      if (!svc) return 0;
      const r = svc.getBoundingClientRect();
      return Math.round(r.top + window.scrollY - window.innerHeight * 2.5);
    });
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), midY);
    await page.waitForTimeout(500);
    const state = await page.evaluate(() => {
      const svc = document.querySelector<HTMLElement>("#services");
      const r = svc?.getBoundingClientRect() ?? null;
      return {
        docked: document.documentElement.getAttribute("data-corridor-docked"),
        servicesTopVh: r ? Math.round(r.top / window.innerHeight) : null,
      };
    });
    expect(
      state.docked,
      `dock must release when #services is ${state.servicesTopVh}vh below the fold`
    ).not.toBe("true");
  });

  test("v7-parse: dead nav anchors for retired stations are absent", async ({ page }) => {
    const deadHrefs = await page.evaluate(() => {
      const removed = [
        "#definition",
        "#missing-layer",
        "#intelligence-layer",
        "#approach",
        "#buildQuote",
      ];
      const all = Array.from(document.querySelectorAll("a[href]"));
      return all.map((a) => a.getAttribute("href") ?? "").filter((href) => removed.includes(href));
    });
    expect(deadHrefs).toEqual([]);
  });

  test("ADR-021 amendment (2026-06-19): seam pixel field is NOT mounted", async ({ page }) => {
    // The seam pixel field was the visible mark inside #services on the
    // capable path. The 2026-06-19 amendment retires the in-#services
    // brandmark beats entirely (Services is now a content section with
    // terminal cards), so the canvas must NEVER mount on production.
    const seamCanvas = page.locator("#home-corridor-mount canvas.home-v2-seam-pixels");
    await expect(seamCanvas).toHaveCount(0);
    const seamLayer = page.locator(".home-v2-seam-pixels");
    await expect(seamLayer).toHaveCount(0);
  });

  test("ADR-021 amendment: retired in-#services brandmark attributes are NEVER set", async ({
    page,
  }) => {
    // After the 2026-06-19 Services-content amendment, the centred
    // brandmark and pixel-field gates stay retired at every scroll
    // depth. `data-services-ambient` is allowed separately as a
    // background-only inside-sphere particle hold.
    const samples = [10, 25, 55, 65, 75, 85];
    for (const pct of samples) {
      await scrollToPercentage(page, pct);
      const attrs = await page.evaluate(() => ({
        pixelate: document.documentElement.getAttribute("data-services-pixelate"),
        brandmark: document.documentElement.getAttribute("data-services-brandmark"),
      }));
      expect(attrs.pixelate).toBeNull();
      expect(attrs.brandmark).toBeNull();
    }
  });

  /**
   * ⚠ THE CORRIDOR MUST ACTUALLY PAINT AT THE ARC (ADR-081 regression).
   *
   * `useVoidwalkerTravelScroll` set `vwTravelRef.engaged` from "the path
   * is capable" rather than from the reader's POSITION, so it was true
   * from the first paint — and `FlyingCameraRig` takes an early return on
   * that flag and parks the camera at the tunnel mouth. The corridor kept
   * running its own DOM beats (station titles, caption cards, the HUD)
   * while the brandmark, the substrate sphere and the Arc's notation sat
   * off-camera for the whole page.
   *
   * Nothing threw, no asset 404'd, and every structural assertion in this
   * file stayed green, because the scene graph was intact and simply not
   * being looked at. The only honest guard is therefore the SYMPTOM: at
   * the Arc's beats the canvas has to be painting something substantial.
   *
   * Frame WEIGHT is the probe — a near-black viewport compresses to
   * almost nothing. Measured on the bug: 69 kB at the navigate beat
   * against 292 kB once the camera was handed back, so the floor sits
   * well clear of both. ⚠ Do NOT tighten it towards the healthy value:
   * this is a "the scene is absent" alarm, not a rendering baseline, and
   * font/GPU differences move the number between machines.
   */
  test("ADR-081: the time tunnel does not claim the camera during the corridor", async ({
    page,
  }) => {
    await walkToArc(page);

    const phase = await page.evaluate(() =>
      document.documentElement.getAttribute("data-corridor-phase")
    );
    expect(phase, "the walk landed inside the Arc").toBe("navigate");

    const frame = await page.screenshot();
    expect(
      frame.length,
      `the corridor paints at the Arc (${Math.round(frame.length / 1024)} kB) — ` +
        "an empty frame here means something upstream took the camera"
    ).toBeGreaterThan(150_000);

    // And the travel's own mode must not have claimed the station yet:
    // the reader is nine viewports above its runway.
    const runwayTop = await page.evaluate(() => {
      const s = document.getElementById("voidwalker");
      return s ? Math.round(s.getBoundingClientRect().top) : 0;
    });
    expect(runwayTop, "the voidwalker runway is still below the fold").toBeGreaterThan(0);
  });

  /**
   * ⚠ THE STRUCTURAL SHED IS REVERSIBLE (ADR-081 U4 perf pass).
   *
   * The shed hides four corridor painters during voidwalker interior
   * travel (`InterGateCorridor`, `GatewayThroat`, `LatentFieldTunnel`,
   * `LatentWormholeWalls`) so their `useFrame` bodies don't run when the
   * camera has flown past them into the wormhole. The gate is a PURE
   * FUNCTION of `vwTravelRef.current` (`vwTravelInterior()`), and this
   * test walks the failure mode ADR-081 U1 recorded: hide the corridor,
   * then reverse-scroll BACK into it and prove every painter that was
   * shed comes back.
   *
   * Frame-weight marks:
   *   • ARC (baseline) — heavy scene, kB ≫ 150.
   *   • MID-TRAVEL — voidwalker deep in the runway, corridor painters
   *     shed. The wormhole itself is still painting, so kB is still
   *     substantial but this only exists to prove the smoke can see
   *     the flight.
   *   • ARC AFTER REVERSE SCROLL — same weight as the baseline mark.
   *     If the shed accidentally became modal / latched, this fails.
   */
  test("ADR-081 U4: the structural shed restores every painter on reverse scroll", async ({
    page,
    viewport,
  }) => {
    // Travel mode (and therefore the shed) is desktop-only —
    // `useTravelCapable` gates on `(min-width: 961px)`. On mobile and
    // tablet the vertical fallback timeline is what renders, and the
    // shed never engages, so this smoke has nothing to assert.
    test.skip(
      !viewport || viewport.width < 961,
      "voidwalker travel is desktop-only; the shed has no fallback path to guard here"
    );
    // ⚠ ADR-082 supersedes ADR-081 on composition — with the character
    // stage on, `#voidwalker` no longer engages the travel writer, so
    // the shed never activates (the character stage is its own opaque
    // cover). The station's exit-time restore is guarded elsewhere
    // (`services-ring-smoke`'s ambient walk). Skip when the flag is on
    // rather than assert an interior that no longer exists.
    test.skip(
      VOIDWALKER_CHARACTER_STAGE,
      "character stage owns the voidwalker interior; the tunnel shed is inert"
    );
    // 1. Baseline — walk to the Arc. `arcY` is where we must come back
    //    to in step 3; the two marks have to be the SAME place or the
    //    weight comparison is measuring the scroll position, not the shed.
    const arcY = await walkToArc(page);
    const arcPhase = await page.evaluate(() =>
      document.documentElement.getAttribute("data-corridor-phase")
    );
    expect(arcPhase, "the walk landed inside the Arc").toBe("navigate");
    const arcBaseline = (await page.screenshot()).length;
    expect(
      arcBaseline,
      `the corridor paints at the Arc baseline (${Math.round(arcBaseline / 1024)} kB)`
    ).toBeGreaterThan(150_000);

    // 2. Deep mid-travel — walk to voidwalker's mid runway. The
    // corridor painters below the camera are shed here; the tunnel
    // (which is not shed) still paints. This mark exists so the smoke
    // can prove the reversibility by measurement, not by claim.
    await page.evaluate(async () => {
      const vw = document.getElementById("voidwalker");
      if (!vw) return;
      const target = window.scrollY + vw.getBoundingClientRect().top + window.innerHeight * 7;
      const start = window.scrollY;
      const step = Math.max(400, window.innerHeight * 0.6);
      for (let y = start; y <= target; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
      window.scrollTo(0, Math.round(target));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    await page.waitForTimeout(1000);
    const vwMode = await page.evaluate(
      () => document.getElementById("voidwalker")?.getAttribute("data-vw-mode") ?? null
    );
    expect(vwMode, "voidwalker travel is engaged mid-runway").toBe("travel");
    const midWeight = (await page.screenshot()).length;
    expect(
      midWeight,
      `the voidwalker tunnel paints mid-flight (${Math.round(midWeight / 1024)} kB)`
    ).toBeGreaterThan(30_000);

    // 3. Reverse scroll BACK to the Arc — everything the shed hid must
    // come back. The frame weight has to recover to essentially the
    // baseline. If the shed is modal or latched, this weight stays low
    // (the sphere/arc-cases/gateway-groups are still hidden).
    await rollTo(page, arcY);
    await page.waitForTimeout(700);
    const restoredPhase = await page.evaluate(() =>
      document.documentElement.getAttribute("data-corridor-phase")
    );
    expect(restoredPhase, "the reverse scroll landed back inside the Arc").toBe("navigate");
    const restoredWeight = (await page.screenshot()).length;
    // ⚠ THE CORE ASSERTION. Recovered weight must be close to the
    // baseline — a modal shed would leave the arc painting nothing.
    // Cap on the DOWNSIDE at 80 % of baseline; a few kB of variation
    // from font/rasterization/GPU noise is expected.
    expect(
      restoredWeight,
      `the corridor recovers on reverse scroll ` +
        `(baseline ${Math.round(arcBaseline / 1024)} kB, ` +
        `restored ${Math.round(restoredWeight / 1024)} kB)`
    ).toBeGreaterThan(Math.round(arcBaseline * 0.8));
  });

  // NOTE (2026-07-14): the three Services-hologram tests that lived here
  // (ambient hold, production scan notes, /test/services-demo scan notes)
  // asserted markup retired by the ADR-029/030/033 Services reworks — the
  // `.services-scan-note` / `.services-expanded-card` selectors no longer
  // exist in the product, and their `behavior: "instant"` teleports skip
  // the corridor's engagement band (see services-ring-smoke.spec.ts header).
  // The CURRENT Services surface — card ring, step clock, readout, CTAs,
  // source-bus register, and the ambient hold clearing at the services →
  // about seam — is covered by tests/visual/services-ring-smoke.spec.ts.
});
