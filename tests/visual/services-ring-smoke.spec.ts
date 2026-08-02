import { expect, test, type Page } from "@playwright/test";

import { SERVICES_PROOF_RUNWAY_VH } from "../../components/landing/home-v2/unifiedServicesInstrument";

/**
 * Services card ring smoke (ADR-029).
 *
 * Structural contracts only — no screenshot baselines (mirrors
 * gateway-motion-smoke.spec.ts). Covers:
 *   - ring mode retires the console racks on desktop (the orbiting cards
 *     carry their full C3 copy on the baked face);
 *   - the scroll clock advances the active service (rack copy + step);
 *   - the regenerated photo assets resolve (the embedded/workshop.webp 404
 *     regression);
 *   - the /test/services-orbit lab mounts one sized WebGL canvas;
 *   - mobile + reduced-motion keep the plate accordion, with no ring
 *     overlays in the DOM.
 *
 * Note: WebGL canvas CONTENT is not asserted (corridor canvas runs
 * preserveDrawingBuffer: false); the ring's math is pinned by
 * tests/lib/services-ring-math.test.ts instead.
 */

// The desktop assertions depend on the corridor WebGL pipeline actually
// painting (card anchors publish from useFrame) — running several landing
// pages in parallel against one dev server starves headless GPU contexts
// and the instrument never mounts. Serialize this file's tests.
test.describe.configure({ mode: "serial" });

/** Scroll the window so the services runway sits at `progress` (0..1).
 *
 * MUST use the two-arg `window.scrollTo(0, y)` form (rides the page's
 * smooth scroll), NOT `{ behavior: "instant" }`: an instant teleport skips
 * the corridor's scroll-driven engagement band, the canvas frameloop never
 * wakes, and the instrument (mark + card ring) renders nothing — the smoke
 * then fails on a dead canvas that no real scroll path produces.
 *
 * The runway position MUST be measured AFTER the corridor has mounted and
 * inflated the layout above #services: HomeCorridor is a lazy client chunk
 * (2026-07-14 perf pass), so `.services-stage` appearing does not yet mean
 * the page has its final height — measuring early lands the scroll far
 * above the runway and the step clock reads 0. */
/**
 * Scroll to a given RING progress (0..1).
 *
 * ADR-056 put the proof casefile at the FRONT of the services runway, so
 * runway progress is no longer ring progress — the first
 * `SERVICES_PROOF_RUNWAY_VH` viewports belong to the casefile and the ring
 * is dark across them. Converting here keeps every call site pinned to the
 * BEAT it means rather than to a raw offset that silently shifted.
 */
async function scrollServicesRunway(page: Page, ringProgress: number): Promise<boolean> {
  await page.waitForSelector(".home-v2-stage", { timeout: 20_000 });
  const target = await page.evaluate(
    ({ p, proofVh }) => {
      const runway = document.querySelector(".services-stage-root");
      if (!runway) return null;
      const rect = runway.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const travel = Math.max(0, rect.height - window.innerHeight);
      const proof = Math.min(travel, window.innerHeight * proofVh);
      return Math.round(top + proof + (travel - proof) * p);
    },
    { p: ringProgress, proofVh: SERVICES_PROOF_RUNWAY_VH }
  );
  if (target == null) return false;
  await page.evaluate((y) => window.scrollTo(0, y), target);
  await page.waitForTimeout(600);
  return true;
}

/** Scroll to a fraction of the CASEFILE's dwell at the front of the runway. */
async function scrollCasefileDwell(page: Page, progress: number): Promise<boolean> {
  await page.waitForSelector(".home-v2-stage", { timeout: 20_000 });
  const target = await page.evaluate(
    ({ p, proofVh }) => {
      const runway = document.querySelector(".services-stage-root");
      if (!runway) return null;
      const rect = runway.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const travel = Math.max(0, rect.height - window.innerHeight);
      return Math.round(top + Math.min(travel, window.innerHeight * proofVh) * p);
    },
    { p: progress, proofVh: SERVICES_PROOF_RUNWAY_VH }
  );
  if (target == null) return false;
  await page.evaluate((y) => window.scrollTo(0, y), target);
  await page.waitForTimeout(600);
  return true;
}

function isDesktopViewport(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) >= 961;
}

test.describe("Services card ring smoke (ADR-029)", () => {
  test("desktop: the proof casefile holds the stage before the ring arrives (ADR-056)", async ({
    page,
  }) => {
    test.skip(!isDesktopViewport(page), "the casefile layer is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });

    // Inside the BROWSE BAND (ADR-056 U13: the front 62.5 % of the dwell
    // steps the directory; the release owns only the back stretch). 0.1 of
    // the runway is row one's quarter — the casefile is settled, uncontested
    // and fully live here.
    expect(await scrollCasefileDwell(page, 0.1)).toBe(true);
    await page.waitForTimeout(1400);

    const during = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>(".services-stage");
      const casefile = document.querySelector<HTMLElement>(".fl-case");
      return {
        caseOpacity: casefile ? Number(getComputedStyle(casefile).opacity) : null,
        contentIn: Number.parseFloat(stage?.style.getPropertyValue("--svc-content-in") ?? "1"),
        // The ring's hit anchors are published off the card opacity, so a
        // published anchor here would mean a card is painting — AND that an
        // invisible click target is sitting over the casefile.
        hits: document.querySelectorAll(".svc-ring-hits__hit").length,
        rows: document.querySelectorAll(".fl-row").length,
      };
    });
    expect(during.caseOpacity).toBeGreaterThan(0.9);
    expect(during.contentIn).toBeLessThan(0.05);
    expect(during.hits).toBe(0);
    expect(during.rows).toBeGreaterThan(0);

    // The directory rows are the navigation, and they work while pinned.
    // Since U13 a click also PINS THE SCROLL to the row's browse-band
    // quarter — that is the contract that stops the scrollspy overriding
    // the click on the next frame — so the browse channel must land inside
    // row two's band (0.25..0.5, past the hysteresis edge).
    const secondRow = page.locator(".fl-row").nth(1);
    await secondRow.click();
    await page.waitForTimeout(400);
    await expect(secondRow).toHaveAttribute("aria-selected", "true");
    const browseAfterClick = await page.evaluate(() =>
      Number.parseFloat(
        document
          .querySelector<HTMLElement>(".fl-case")
          ?.style.getPropertyValue("--svc-proof-browse") ?? "-1"
      )
    );
    expect(browseAfterClick).toBeGreaterThan(0.29);
    expect(browseAfterClick).toBeLessThan(0.5);

    // …and SCROLL drives the same selector (the U13 scrollspy): two thirds
    // into the browse band is row three's quarter, reached with no click.
    expect(await scrollCasefileDwell(page, 0.42)).toBe(true);
    await page.waitForTimeout(600);
    await expect(page.locator(".fl-row").nth(2)).toHaveAttribute("aria-selected", "true");

    // THE INTERLEAVE (2026-07-29). The casefile's fold and the offer's
    // assembly deliberately OVERLAP — the departure runs 0.13 → 0.66 of the
    // RELEASE and the release ramp spans it, so the offer is already drawing
    // as the panels start to leave. Sampling inside that overlap is the only
    // assertion that fails if the windows are ever pulled back apart into a
    // fade-then-pop, which is the handoff the owner rejected. The crossing
    // was validated at releaseP 0.52 (caseOpacity ≈ 0.43 against content-in
    // ≈ 0.52); since U13 the release owns only the back 37.5 % of the
    // runway, so the same releaseP sits at total 0.625 + 0.52 × 0.375 =
    // 0.82. Sample the VALUES here, never the window edges — smootherstep
    // is nearly flat across its first third, so overlapping edges alone
    // prove nothing.
    expect(await scrollCasefileDwell(page, 0.82)).toBe(true);
    await page.waitForTimeout(1000);

    const interleave = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>(".services-stage");
      const casefile = document.querySelector<HTMLElement>(".fl-case");
      const cs = casefile ? getComputedStyle(casefile) : null;
      return {
        caseOpacity: cs ? Number(cs.opacity) : null,
        // The iris is the departure's other half; `none` here means the fold
        // silently regressed to a plain fade.
        clipPath: cs?.clipPath ?? null,
        contentIn: Number.parseFloat(stage?.style.getPropertyValue("--svc-content-in") ?? "0"),
      };
    });
    expect(interleave.caseOpacity).toBeGreaterThan(0.05);
    expect(interleave.caseOpacity).toBeLessThan(0.95);
    expect(interleave.contentIn).toBeGreaterThan(0.1);
    expect(interleave.contentIn).toBeLessThan(0.9);
    // A partly-closed aperture. `none` — or an inset still at rest — means
    // the fold silently regressed to a plain whole-plane fade. Since the
    // 2026-07-29 reticle fix the insets rest at −12px (the crosses overhang
    // the band by a half-arm) and serialize mid-iris as `calc(K% + Mpx)`,
    // where K is still iris × 50.5 — so the first-% parse below keeps
    // reading the iris fraction, with the px term invisible to it.
    expect(interleave.clipPath).toContain("inset");
    const irisPct = Number.parseFloat(/([\d.]+)%/.exec(interleave.clipPath ?? "")?.[1] ?? "0");
    expect(irisPct, `the iris should be mid-close, read "${interleave.clipPath}"`).toBeGreaterThan(
      5
    );
    expect(irisPct).toBeLessThan(50.5);

    // Past the dwell: the casefile is gone and the ring has taken over.
    expect(await scrollServicesRunway(page, 0.18)).toBe(true);
    await page.waitForTimeout(1400);

    const after = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>(".services-stage");
      const casefile = document.querySelector<HTMLElement>(".fl-case");
      return {
        caseOpacity: casefile ? Number(getComputedStyle(casefile).opacity) : null,
        contentIn: Number.parseFloat(stage?.style.getPropertyValue("--svc-content-in") ?? "0"),
        hits: document.querySelectorAll(".svc-ring-hits__hit").length,
      };
    });
    expect(after.caseOpacity).toBeLessThan(0.05);
    expect(after.contentIn).toBeGreaterThan(0.9);
    expect(after.hits).toBeGreaterThan(0);

    // …and it is OUT OF THE HIT TEST, not merely transparent. Opacity 0
    // leaves an element clickable, and the casefile's tabs and rows opt into
    // `pointer-events: auto`, so a departed casefile at z 6 goes on eating
    // clicks meant for `.svc-ring-hits__hit` at z 4 — the front card reads as
    // dead. Assert the real property (does a hit at the card's centre reach
    // the ring?) rather than the mechanism, so a different fix still passes.
    const cardHitReachable = await page.evaluate(() => {
      const hit = document.querySelector<HTMLElement>(".svc-ring-hits__hit");
      if (!hit) return null;
      const r = hit.getBoundingClientRect();
      const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return {
        reached: !!el && (el === hit || hit.contains(el)),
        blockedBy: el?.className ?? null,
      };
    });
    expect(cardHitReachable, "a ring hit area must exist after the handover").not.toBeNull();
    expect(
      cardHitReachable?.reached,
      `the departed casefile is still hit-testable — blocked by "${cardHitReachable?.blockedBy}"`
    ).toBe(true);

    // ── The REVERSE handoff (ADR-056 Update 3) ───────────────────────────
    // Backing out of the offer re-enters the dwell with the stage still
    // PINNED, so the masthead's unpark observer never fires and its
    // REARM_BELOW floor (derived: REVEAL_AT − hysteresis) is the only thing
    // that can blank the title. At releaseP 0.40 the clock reads ≈0.32 —
    // below the floor — so the title must already be re-armed (blanked, not
    // merely faded) while the casefile is repainting. Same U13 remap as the
    // interleave: releaseP 0.40 sits at total 0.625 + 0.40 × 0.375 = 0.775.
    // The pre-fix absolute floor (0.05) held the resolved title over the
    // reassembled casefile for a third of the dwell, which is exactly what
    // this drive would catch.
    expect(await scrollCasefileDwell(page, 0.775)).toBe(true);
    await expect(page.locator(".services-masthead")).toHaveAttribute("data-reveal", "armed");
    await expect(
      page.locator(".services-masthead__title-line").first().locator("span").first()
    ).toHaveText("");
    // …and the casefile is back in the hit test (the same gate the forward
    // pass asserts from the other side).
    await expect(page.locator(".services-stage")).toHaveAttribute("data-proof-live", "1");
  });

  test("desktop: no casefile box clips its content, on any row (ADR-056 U11)", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "the casefile layer is desktop-only (≥961px)");

    // 1440x800 — a MacBook Air, where the owner reads this, and the viewport
    // that exposed both pre-existing bugs. The project's 1440x900 default
    // hides them: at 900 the foot has room to spare and everything looks
    // authored-at-1920 correct. Set BEFORE the goto so the corridor lays out
    // once, at the height being asserted.
    await page.setViewportSize({ width: 1440, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });

    // The settle at the front of the dwell — panels assembled, stage pinned,
    // nothing travelling. Same sample point as the hold assertion above.
    expect(await scrollCasefileDwell(page, 0.1)).toBe(true);
    await page.waitForTimeout(1400);

    // THE ALIGNMENT LAW — both section rules land on the HUD rail's own tick
    // ladder. This is what makes the composition read as bolted into the
    // frame rather than floating in front of it, and `.claude/rules/proof.md`
    // names tick drift the one way this design fails silently. It is measured
    // against the LIVE rail box rather than recomputed from the tick formula,
    // so a divergence between `.hud__rail` and `hudTicks.ts` fails here too.
    //
    // It nearly shipped broken: `--fl-sec`'s floor carried a 10px clearance
    // term, which beat the raw tick at every laptop viewport and put the
    // section rule 4-9px off the ladder.
    //
    // The strip hangs ABOVE the section rule, so the second assertion is the
    // floor's actual job: never cross the top of the rail box.
    const geom = await page.evaluate(() => {
      const rail = document.querySelector<HTMLElement>(".hud__rail");
      const sec = document.querySelector<HTMLElement>(".fl-rule--section");
      const viz = document.querySelector<HTMLElement>(".fl-rule--viz");
      const tabs = document.querySelector<HTMLElement>(".fl-tabs");
      if (!rail || !sec || !viz || !tabs) return null;
      const ticks = [...document.querySelectorAll(".hud__rail__tick")].map(
        (t) => t.getBoundingClientRect().top
      );
      if (!ticks.length) return null;
      const offTick = (y: number) => Math.min(...ticks.map((t) => Math.abs(t - y)));
      return {
        sec: offTick(sec.getBoundingClientRect().top),
        viz: offTick(viz.getBoundingClientRect().top),
        stripClearance: tabs.getBoundingClientRect().top - rail.getBoundingClientRect().top,
      };
    });
    expect(geom, "the casefile and the HUD rail must both be mounted").not.toBeNull();
    expect(
      geom!.sec,
      `the section rule is ${geom!.sec.toFixed(1)}px off the tick ladder`
    ).toBeLessThan(1.5);
    expect(geom!.viz, `the viz rule is ${geom!.viz.toFixed(1)}px off the tick ladder`).toBeLessThan(
      1.5
    );
    expect(
      geom!.stripClearance,
      `the tab strip starts ${(-geom!.stripClearance).toFixed(1)}px above the rail box`
    ).toBeGreaterThanOrEqual(0);

    // EVERY ROW, not just the one that opens. The plate kinds differ per row
    // — the skills browser, stills, films, tools — and only the tools plate
    // had any height handling before U11. These three boxes are all
    // `overflow: hidden` with no scrollbar, so they clip SILENTLY: the
    // `SOURCE — ADOPTION BOARD` line was already being cut by 24px at
    // 1280x720 and 4px here, and nobody could see it. Four rows since the
    // U13 directory trim (the rollout/governance/metrics/report rows left).
    const rowCount = await page.locator(".fl-row").count();
    expect(rowCount, "the directory holds four rows").toBe(4);

    const clipped: string[] = [];
    for (let i = 0; i < rowCount; i++) {
      const row = page.locator(".fl-row").nth(i);
      await row.click();
      await page.waitForTimeout(350);

      const overflow = await page.evaluate(() => {
        const boxes = [".fl-brief", ".fl-panel__foot", ".fl-plate"] as const;
        const file = document.querySelector<HTMLElement>(".fl-row[aria-selected='true']");
        const out: { box: string; over: number; row: string }[] = [];
        for (const sel of boxes) {
          const el = document.querySelector<HTMLElement>(sel);
          // `.fl-plate` is absent on the metrics row — the readouts ARE its
          // plate — so a missing box is a shape, not a failure.
          if (!el) continue;
          out.push({
            box: sel,
            over: el.scrollHeight - el.clientHeight,
            row: file?.textContent?.trim().slice(0, 28) ?? "?",
          });
        }
        return out;
      });

      // 1px of tolerance for sub-pixel rounding on fractional line boxes;
      // anything real is a whole line of type or more.
      for (const o of overflow) {
        if (o.over > 1) clipped.push(`${o.row} — ${o.box} clips ${o.over}px`);
      }
    }
    expect(clipped, `boxes clipping at 1440x800:\n${clipped.join("\n")}`).toEqual([]);
  });

  test("desktop: ring mode retires the racks; cards expose their CTA", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "ring mode is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });
    // Arrival beat (5-beat runway, lead-in removed 2026-07-17): beat 0 owns
    // service 0, so Advisory is front on arrival and its CTA is the one to
    // assert. p=0.18 → floor(0.9) = step 0.
    expect(await scrollServicesRunway(page, 0.18)).toBe(true);
    // Step clock + scramble decode settle.
    await page.waitForTimeout(1600);

    const stage = page.locator(".services-stage");
    await expect(stage).toHaveAttribute("data-card-ring", "on");
    await expect(stage).toHaveAttribute("data-active-step", "0");

    // Racks exist in the DOM (mobile path needs them) but render none.
    const rackDisplay = await page
      .locator(".svc-rack")
      .first()
      .evaluate((el) => getComputedStyle(el).display);
    expect(rackDisplay).toBe("none");

    // Leader lines retire with the racks in ring mode.
    await expect(page.locator(".services-scan-connectors")).toHaveCount(0);

    // The cards carry their copy on the baked face; the DOM exposes the
    // front card as a full-rect OPEN button (ADR-050 — the tight face bakes
    // an `OPEN` chit in place of the ADR-029 CTA slab, so there is no CTA box
    // to shim until the drawer is out) plus side-card view targets.
    // Generous timeout: cold dev-server compile + texture bakes + the
    // parked-anchor gate all precede the first publish.
    await expect(page.locator(".svc-ring-hits")).toHaveCount(1);
    const frontCard = page.getByRole("button", { name: "Open Keynote details" });
    await expect(frontCard).toBeVisible({ timeout: 20_000 });
    await expect(frontCard).toHaveAttribute("aria-expanded", "false");
    // The bottom readout strip is RETIRED (owner, 2026-07-16) — the
    // active-service clock is asserted via data-active-step + the CTA
    // link in the step tests below.
    await expect(page.locator(".services-readout")).toHaveCount(0);

    // The SOURCE BUS right-rail register is RETIRED (ADR-044) — the
    // section masthead carries the services title/intro instead. The
    // masthead is pure DOM (ring mode only), title left / intro right.
    await expect(page.locator(".tools-rail-register__heading--services")).toHaveCount(0);
    await expect(page.locator(".services-masthead")).toHaveCount(1);
    await expect(page.locator(".services-masthead__title")).toContainText("AI CAPABILITY");
  });

  test("desktop: the front card opens its spec drawer, and Escape / scroll dismiss it", async ({
    page,
  }) => {
    test.skip(!isDesktopViewport(page), "the card drawer is desktop-only (ring gate)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });
    expect(await scrollServicesRunway(page, 0.18)).toBe(true);
    await page.waitForTimeout(1600);

    const frontCard = page.getByRole("button", { name: "Open Keynote details" });
    await expect(frontCard).toBeVisible({ timeout: 20_000 });

    // ── The ghost fence (ADR-050's blocking flaw) ────────────────────────
    // Parked and closed, the drawer must not exist in ANY channel: no rect
    // published, no shimmed CTA or close control, no screen-reader copy.
    await expect(frontCard).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(".svc-ring-hits__sr")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Book a keynote" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Close Keynote details" })).toHaveCount(0);

    // ── Open ─────────────────────────────────────────────────────────────
    // The drawer faces bake LAZILY on this first click, so the shims can
    // take a beat longer to appear than the rest of the ring.
    await frontCard.click();
    await expect(frontCard).toHaveAttribute("aria-expanded", "true");
    // The open state dims the section copy behind the enlarged pair
    // (services.css keys --svc-plate-dim off this attribute).
    await expect(page.locator(".services-stage")).toHaveAttribute("data-plate-open", "1");
    // The drawer's baked CTA, reachable as a real link on the second rect.
    await expect(page.getByRole("link", { name: "Book a keynote" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("button", { name: "Close Keynote details" })).toBeVisible();
    // The baked spec copy, readable.
    await expect(page.locator(".svc-ring-hits__sr")).toContainText("Duration:");

    // ── Escape dismisses ─────────────────────────────────────────────────
    await page.keyboard.press("Escape");
    await expect(frontCard).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(".services-stage")).not.toHaveAttribute("data-plate-open", "1");
    await expect(page.locator(".svc-ring-hits__sr")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Book a keynote" })).toHaveCount(0);

    // ── Runway scroll dismisses ──────────────────────────────────────────
    // The drawer is welded to its card and rotates away with it, so moving
    // the ring must close it rather than leave a panel hanging off a card
    // swinging out of front-centre.
    await frontCard.click();
    await expect(frontCard).toHaveAttribute("aria-expanded", "true");
    expect(await scrollServicesRunway(page, 0.3)).toBe(true);
    await page.waitForTimeout(800);
    await expect(page.locator(".svc-ring-hits__sr")).toHaveCount(0);
  });

  test("desktop: the ambient hold survives the pinned #about stage and dies under the next opaque station", async ({
    page,
  }) => {
    test.skip(!isDesktopViewport(page), "the deck-flip stage is desktop-only (ring gate)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });

    // #about directly follows #services (ADR-033 funnel; ADR-047 makes it
    // the pinned transparent deck-flip stage).
    const followsServices = await page.evaluate(() => {
      const services = document.getElementById("services");
      const about = document.getElementById("about");
      if (!services || !about) return false;
      return about.offsetTop > services.offsetTop;
    });
    expect(followsServices).toBe(true);

    // Ride the runway to its end, then walk into the pinned #about stage:
    // the ambient hold must SURVIVE (the canvas is the deck's backdrop) and
    // the stage must be engaged + transparent (ADR-047 inverts the ADR-033
    // seam this test used to pin).
    expect(await scrollServicesRunway(page, 0.98)).toBe(true);
    await page.waitForTimeout(900);
    const aboutMid = await page.evaluate(() => {
      const runway = document.querySelector(".about-stage-root");
      if (!runway) return null;
      const rect = runway.getBoundingClientRect();
      return Math.round(rect.top + window.scrollY + (rect.height - window.innerHeight) * 0.5);
    });
    expect(aboutMid).not.toBeNull();
    await page.evaluate((y) => window.scrollTo(0, y as number), aboutMid);
    await page.waitForTimeout(900);

    const mid = await page.evaluate(() => ({
      ambient: document.documentElement.hasAttribute("data-services-ambient"),
      exit: document.documentElement.hasAttribute("data-corridor-exit"),
      mode: document.getElementById("about")?.getAttribute("data-about-mode") ?? null,
      aboutBg: getComputedStyle(document.getElementById("about")!).backgroundColor,
      flip: (
        document
          .querySelector<HTMLElement>(".about-stage")
          ?.style.getPropertyValue("--about-flip") ?? ""
      ).slice(0, 6),
      voidwalkerDisplay: (() => {
        const vw = document.querySelector<HTMLElement>("#about > .voidwalker");
        return vw ? getComputedStyle(vw).display : null;
      })(),
    }));
    expect(mid.ambient).toBe(true);
    expect(mid.exit).toBe(true);
    expect(mid.mode).toBe("stage");
    // The station is transparent over the live canvas (ADR-008 Rule 2
    // exception) and the static fallback yields to the stage.
    expect(mid.aboutBg).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|transparent/);
    expect(parseFloat(mid.flip || "0")).toBe(1);
    expect(mid.voidwalkerDisplay).toBe("none");

    // Walk under #practice: THIS is where the ambient hold ends (ADR-056 —
    // #proof retired and #practice inherited the cover role at the same
    // scroll position). The bottom gate is keyed to the SAME rect as the
    // fade envelope, so there is no hard cut at the about runway's end.
    const underNext = await page.evaluate(() => {
      const next = document.getElementById("practice");
      if (!next) return null;
      return Math.round(
        window.scrollY + next.getBoundingClientRect().top + window.innerHeight * 0.3
      );
    });
    expect(underNext).not.toBeNull();
    await page.evaluate((y) => window.scrollTo(0, y as number), underNext);
    await page.waitForTimeout(900);
    const after = await page.evaluate(() => ({
      ambient: document.documentElement.hasAttribute("data-services-ambient"),
      exit: document.documentElement.hasAttribute("data-corridor-exit"),
    }));
    expect(after.ambient).toBe(false);
    expect(after.exit).toBe(false);
  });

  test("desktop: the scroll clock advances the active service", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "ring mode is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });

    // (Readout strip retired 2026-07-16 — the active-service clock is
    // asserted via data-active-step + the front card's own hit target. Under
    // ADR-050 that target is the full-rect OPEN button, named for the plate's
    // chip, rather than the CTA link the full face used to bake.)
    // Arrival remap (2026-07-17): the ring holds the first slot through the
    // short arrival, then rotates. `data-active-step` = the front-card index
    // (0..3). Occupancy since the 2026-08-02 harmonization: Keynote /
    // Workshop / Embedded AI Partner / Strategic Advisory. p=0.18 is in the
    // arrival window → Keynote front (step 0).
    expect(await scrollServicesRunway(page, 0.18)).toBe(true);
    await page.waitForTimeout(1600);
    await expect(page.locator(".services-stage")).toHaveAttribute("data-active-step", "0");
    await expect(page.getByRole("button", { name: "Open Keynote details" })).toBeVisible({
      timeout: 20_000,
    });

    // p=0.58 → the ring has turned two quarter-turns: the Embedded AI
    // Partner plate is front (step 2).
    expect(await scrollServicesRunway(page, 0.58)).toBe(true);
    await page.waitForTimeout(1600);
    await expect(
      page.getByRole("button", { name: "Open Embedded AI Partner details" })
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".services-stage")).toHaveAttribute("data-active-step", "2");

    // p=0.78 → the LAST service (Strategic Advisory) is front (step 3) — its
    // own hit target proves the rotation reached the end of the roster while
    // the hit areas are still alive (they retire in the exit beat).
    expect(await scrollServicesRunway(page, 0.78)).toBe(true);
    await page.waitForTimeout(1600);
    await expect(page.getByRole("button", { name: "Open Strategic Advisory details" })).toBeVisible(
      { timeout: 20_000 }
    );
    await expect(page.locator(".services-stage")).toHaveAttribute("data-active-step", "3");

    // Exit-hold beat (ADR-030): deep in the runway the front-card index
    // stays clamped on the LAST service (3) — an unclamped index would wrap
    // the clock back to the first slot (the bug the clamps kill).
    expect(await scrollServicesRunway(page, 0.95)).toBe(true);
    await page.waitForTimeout(1200);
    await expect(page.locator(".services-stage")).toHaveAttribute("data-active-step", "3");
  });

  test("desktop: wheel over the instrument scrolls natively and rotates the ring", async ({
    page,
  }) => {
    test.skip(!isDesktopViewport(page), "ring wheel is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });
    expect(await scrollServicesRunway(page, 0.3)).toBe(true);
    // Park + texture bakes settle.
    await page.waitForTimeout(4000);

    // 2026-07-15 native-scroll pass: the wheel-snap hijack is retired. A wheel
    // with the pointer OVER the cards is plain native scroll — it advances the
    // runway (scrollY climbs) and the ring rotation follows continuously, with
    // NO discrete one-beat lockout.
    const startY = await page.evaluate(() => window.scrollY);
    const startStep = Number(
      await page.locator(".services-stage").getAttribute("data-active-step")
    );
    await page.mouse.move(720, 400); // pointer over the instrument
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(600);
    const overY = await page.evaluate(() => window.scrollY);
    // Native scroll advanced the runway (not swallowed by a snap hijack)…
    expect(overY).toBeGreaterThan(startY);
    // …and the ring rotated with it (the active step advanced).
    const overStep = Number(await page.locator(".services-stage").getAttribute("data-active-step"));
    expect(overStep).toBeGreaterThan(startStep);

    // Pointer in the dead space beside the cards → also native page scroll
    // (per the "outside the cards → normal scroll-through" decision).
    const heldY = await page.evaluate(() => window.scrollY);
    await page.mouse.move(120, 400);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(600);
    const movedY = await page.evaluate(() => window.scrollY);
    expect(movedY).toBeGreaterThan(heldY);
  });

  test("regenerated service photos resolve (embedded/workshop.webp 404 regression)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const statuses = await page.evaluate(async () => {
      const urls = [
        "/images/services/strategic.webp",
        "/images/services/keynote.webp",
        "/images/services/embedded.webp",
        "/images/services/workshop.webp",
        "/images/services/strategic.jpg",
      ];
      return Promise.all(
        urls.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "no-cache" });
            return `${url}:${res.status}`;
          } catch {
            return `${url}:0`;
          }
        })
      );
    });
    for (const status of statuses) {
      expect(status.endsWith(":200"), status).toBe(true);
    }
  });

  test("orbit lab mounts exactly one WebGL canvas, sized to the stage", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "the orbit lab is a desktop look-dev surface");

    await page.goto("/test/services-orbit", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("canvas", { timeout: 15_000 });
    // Texture bakes (fonts + photos) take a moment.
    await page.waitForTimeout(2500);

    const canvases = page.locator("canvas");
    await expect(canvases).toHaveCount(1);
    const size = await canvases.first().evaluate((c: HTMLCanvasElement) => [c.width, c.height]);
    expect(size[0]).toBeGreaterThan(400); // not the 300x150 default buffer
    expect(size[1]).toBeGreaterThan(200);
  });

  test("mobile/tablet: the plate accordion is untouched by ring mode", async ({ page }) => {
    test.skip(isDesktopViewport(page), "accordion path is <961px");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });
    await page.evaluate(() => {
      document.querySelector(".services-stage")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(800);

    // All four plates present and flowing (racks dissolve to contents).
    await expect(page.locator(".svc-plate")).toHaveCount(4);
    // No ring overlays mount below the desktop gate.
    await expect(page.locator(".svc-ring-hits")).toHaveCount(0);
    // The about deck-flip stage never engages below the gate (ADR-047):
    // the static voidwalker owns #about and the runway stays flat.
    const aboutStatic = await page.evaluate(() => ({
      mode: document.getElementById("about")?.getAttribute("data-about-mode") ?? null,
      runwayH: document.querySelector(".about-stage-root")?.getBoundingClientRect().height ?? 0,
      voidwalker: (() => {
        const vw = document.querySelector<HTMLElement>("#about > .voidwalker");
        return vw ? getComputedStyle(vw).display : null;
      })(),
    }));
    expect(aboutStatic.mode).toBeNull();
    expect(aboutStatic.runwayH).toBeLessThan(10);
    expect(aboutStatic.voidwalker).not.toBe("none");
  });

  test("reduced motion keeps the accordion and mounts no ring overlays", async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });
    await page.evaluate(() => {
      document.querySelector(".services-stage")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(800);

    await expect(page.locator(".svc-plate")).toHaveCount(4);
    await expect(page.locator(".svc-ring-hits")).toHaveCount(0);
    // Reduced motion keeps the static about (no deck-flip stage) — ADR-047
    // gate parity with the ring.
    const aboutMode = await page.evaluate(
      () => document.getElementById("about")?.getAttribute("data-about-mode") ?? null
    );
    expect(aboutMode).toBeNull();
    await context.close();
  });
});
