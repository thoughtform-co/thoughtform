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

/**
 * Measure one map sheet, in SCREEN space (ADR-062).
 *
 * Runs inside the page, against either the casefile panel
 * The map plate (`.fl-pda`).
 *
 * `preserveAspectRatio="xMidYMid meet"` scales by the MINIMUM of the two
 * box ratios and centres the remainder, so `box.width / viewBox.width`
 * over-reports the board sheet by 16 %. Glyph boxes are therefore compared
 * in the SVG's own user units (`getBBox`) and the stamp in client rects,
 * because the stamp is DOM chrome that never entered user space.
 */
/**
 * Measure the map's current reading, in the drawing's own units.
 *
 * `preserveAspectRatio="xMidYMid meet"` scales by the MINIMUM of the two box
 * ratios and centres the remainder, so `box.width / viewBox.width`
 * over-reports. Glyph boxes are therefore compared in the SVG's own user
 * units (`getBBox`), and the rendered size is derived from the meet scale.
 */
function readPda() {
  const host = document.querySelector<HTMLElement>(".fl-pda");
  const svg = host?.querySelector<SVGSVGElement>(".fl-pda__svg");
  const field = host?.querySelector<HTMLElement>(".fl-pda__field");
  if (!host || !svg || !field) return null;
  const vb = svg.viewBox.baseVal;
  const box = svg.getBoundingClientRect();
  const meet = Math.min(box.width / vb.width, box.height / vb.height);

  const items = [...svg.querySelectorAll("text")].map((t) => ({
    text: (t.textContent ?? "").slice(0, 40),
    b: t.getBBox(),
    px: Number.parseFloat(getComputedStyle(t).fontSize) * meet,
  }));

  // Every PAIR of glyph boxes. 0.5 units of tolerance so boxes that merely
  // touch — adjacent columns of a rail, a label sitting on a divider — are
  // not reported; a real collision is glyphs printing through glyphs.
  const overlaps: string[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i].b;
      const b = items[j].b;
      const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (ox > 0.5 && oy > 0.5) overlaps.push(`"${items[i].text}" x "${items[j].text}"`);
    }
  }

  return {
    texts: items.length,
    minPx: Number((items.length ? Math.min(...items.map((i) => i.px)) : 0).toFixed(2)),
    overlaps,
    // 0.6 units of tolerance for sub-pixel bbox rounding; a real clip is a
    // whole glyph or more.
    clipped: items
      .filter(
        (i) =>
          i.b.x < vb.x - 0.6 ||
          i.b.x + i.b.width > vb.x + vb.width + 0.6 ||
          i.b.y < vb.y - 0.6 ||
          i.b.y + i.b.height > vb.y + vb.height + 0.6
      )
      .map((i) => i.text),
    fieldW: Math.round(field.clientWidth),
    fieldH: Math.round(field.clientHeight),
    drawnW: Math.round(vb.width * meet),
    drawnH: Math.round(vb.height * meet),
    overflowX: field.scrollWidth - field.clientWidth,
    overflowY: field.scrollHeight - field.clientHeight,
  };
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

  test("desktop: the harmonised casefile fits its three reference viewports", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "the casefile layer is desktop-only (≥961px)");
    test.setTimeout(90_000);

    const viewports = [
      { width: 1280, height: 720 },
      { width: 1440, height: 800 },
      { width: 2017, height: 1269 },
    ] as const;

    for (const viewport of viewports) {
      const label = `${viewport.width}x${viewport.height}`;
      await page.setViewportSize(viewport);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".services-stage", { timeout: 15_000 });
      expect(await scrollCasefileDwell(page, 0.1), `${label}: casefile runway missing`).toBe(true);
      await page.waitForTimeout(1200);
      await expect(page.locator(".fl-pda")).toBeVisible();

      const geometry = await page.evaluate(() => {
        const casefile = document.querySelector<HTMLElement>(".fl-case");
        const brief = document.querySelector<HTMLElement>(".fl-brief");
        const proof = document.querySelector<HTMLElement>(".fl-proof-register");
        const directory = document.querySelector<HTMLElement>(".fl-dir");
        const panel = document.querySelector<HTMLElement>(".fl-panel");
        const visual = document.querySelector<HTMLElement>(".fl-panel__viz");
        const map = document.querySelector<HTMLElement>(".fl-pda");
        if (!casefile || !brief || !proof || !directory || !panel || !visual || !map) return null;

        const c = casefile.getBoundingClientRect();
        const b = brief.getBoundingClientRect();
        const p = proof.getBoundingClientRect();
        const d = directory.getBoundingClientRect();
        const pn = panel.getBoundingClientRect();
        const v = visual.getBoundingClientRect();
        const m = map.getBoundingClientRect();
        const inside = (inner: DOMRect, outer: DOMRect) =>
          inner.left >= outer.left - 1 &&
          inner.right <= outer.right + 1 &&
          inner.top >= outer.top - 1 &&
          inner.bottom <= outer.bottom + 1;

        return {
          proofItems: proof.querySelectorAll(".fl-proof-register__item").length,
          proofInside: inside(p, c),
          directoryInside: inside(d, c),
          panelInside: inside(pn, c),
          visualInside: inside(v, pn),
          mapInside: inside(m, v),
          briefBeforeProof: b.bottom <= p.top + 1,
          proofBeforeDirectory: p.bottom <= d.top + 1,
          leftAligned: Math.abs(p.left - d.left) <= 1 && Math.abs(p.width - d.width) <= 1,
          proofOverflow: proof.scrollHeight - proof.clientHeight,
          proofOverflowX: proof.scrollWidth - proof.clientWidth,
          directoryOverflow: directory.scrollHeight - directory.clientHeight,
          directoryOverflowX: directory.scrollWidth - directory.clientWidth,
          visualOverflowY: visual.scrollHeight - visual.clientHeight,
          visualOverflowX: visual.scrollWidth - visual.clientWidth,
          visualBottomDelta: Math.abs(v.bottom - pn.bottom),
          visualHeightRatio: v.height / Math.max(1, pn.height),
          mapHeightRatio: m.height / Math.max(1, v.height),
        };
      });

      expect(geometry, `${label}: harmonised casefile zones are missing`).not.toBeNull();
      expect(geometry?.proofItems, `${label}: proof register is not four-up`).toBe(4);
      expect(geometry?.proofInside, `${label}: proof register escaped the casefile`).toBe(true);
      expect(geometry?.directoryInside, `${label}: directory escaped the casefile`).toBe(true);
      expect(geometry?.panelInside, `${label}: right panel escaped the casefile`).toBe(true);
      expect(geometry?.visualInside, `${label}: visual escaped the right panel`).toBe(true);
      expect(geometry?.mapInside, `${label}: map escaped the visual frame`).toBe(true);
      expect(geometry?.briefBeforeProof, `${label}: brief overlaps the proof register`).toBe(true);
      expect(
        geometry?.proofBeforeDirectory,
        `${label}: proof register overlaps the directory`
      ).toBe(true);
      expect(geometry?.leftAligned, `${label}: proof register and directory rails drift`).toBe(
        true
      );
      expect(geometry?.proofOverflow, `${label}: proof register clips`).toBeLessThanOrEqual(1);
      expect(
        geometry?.proofOverflowX,
        `${label}: proof register clips horizontally`
      ).toBeLessThanOrEqual(1);
      expect(geometry?.directoryOverflow, `${label}: directory clips`).toBeLessThanOrEqual(1);
      expect(
        geometry?.directoryOverflowX,
        `${label}: directory clips horizontally`
      ).toBeLessThanOrEqual(1);
      expect(geometry?.visualOverflowY, `${label}: visual clips vertically`).toBeLessThanOrEqual(1);
      expect(geometry?.visualOverflowX, `${label}: visual clips horizontally`).toBeLessThanOrEqual(
        1
      );
      expect(
        geometry?.visualBottomDelta,
        `${label}: visual does not fill the panel`
      ).toBeLessThanOrEqual(1.5);
      expect(
        geometry?.visualHeightRatio ?? 0,
        `${label}: visual retained a footer band`
      ).toBeGreaterThan(0.9);
      expect(
        geometry?.mapHeightRatio ?? 0,
        `${label}: map does not fill the visual`
      ).toBeGreaterThan(0.98);

      // -- THE MAP'S THREE SHEETS (ADR-062) ---------------------------
      // ── THE MAP (the PDA console) ─────────────────────────────────
      // A SVG technical drawing, and `<text>` neither wraps nor ellipsises
      // nor reports overflow — a label that runs past its crop simply
      // vanishes at the edge. So walk EVERY reading and measure every glyph
      // box against the drawing's own viewBox.
      for (const [index, view] of ["1", "2", "3"].entries()) {
        await page.locator(".fl-pda__stn").nth(index).click();
        await page.waitForTimeout(360);
        await expect(page.locator(".fl-pda")).toHaveAttribute("data-view", view);

        const drawn = await page.evaluate(readPda);
        const where = `${label}/view-${view}`;
        expect(drawn, `${where}: the reading drew nothing`).not.toBeNull();
        expect(drawn!.texts, `${where}: the reading lost its labels`).toBeGreaterThan(10);
        expect(
          drawn!.clipped,
          `${where}: labels run outside the crop: ${drawn!.clipped.join(", ")}`
        ).toEqual([]);
        expect(drawn!.overflowX, `${where}: the map field scrolls`).toBeLessThanOrEqual(1);
        expect(drawn!.overflowY, `${where}: the map field scrolls`).toBeLessThanOrEqual(1);

        // ── LABEL ON LABEL (ADR-063 U1) ────────────────────────────
        // Containment is not legibility. Every guard on this surface
        // asked whether a label was inside the crop; none asked whether
        // two labels were inside EACH OTHER — and when the type grew,
        // two pairs collided (a wrapped cartridge title onto its own
        // second line and onto the lane rail, and 02's DECIDES ALONE
        // onto its value) while every existing assertion stayed green.
        expect(drawn!.overlaps, `${where}: labels overlap: ${drawn!.overlaps.join(" | ")}`).toEqual(
          []
        );

        // ── AND THE TYPE IS ACTUALLY BIGGER ────────────────────────
        // A floor under what the reader sees, not under the authored
        // unit — `xMidYMid meet` scales by the MINIMUM of the two box
        // ratios, so an authored size says nothing about rendered size.
        // These are the measured values less a little headroom; the
        // drawing is height-bound, so a regression here means either a
        // crop grew or the console lost height to new chrome.
        expect(
          drawn!.minPx,
          `${where}: rendered type fell to ${drawn!.minPx}px`
        ).toBeGreaterThanOrEqual(4.3);
      }

      // The reading rail is the navigation and its stations are CONTROLS, so
      // they answer to the chrome floor. It runs HORIZONTALLY across the top
      // of the console (ADR-063) and its names must not ellipsise — a station
      // reading "CONFIGURATI…" is the rail outgrowing its box.
      const rail = await page.evaluate(() => {
        const el = document.querySelector<HTMLElement>(".fl-pda__depth");
        const field = document.querySelector<HTMLElement>(".fl-pda__field");
        const consoleEl = document.querySelector<HTMLElement>(".fl-pda__console");
        if (!el || !field || !consoleEl) return null;
        const r = el.getBoundingClientRect();
        const stns = [...el.querySelectorAll<HTMLElement>(".fl-pda__stn")];
        return {
          horizontal: r.width > r.height * 3,
          aboveField: r.bottom <= field.getBoundingClientRect().top + 1,
          spansConsole: r.width / consoleEl.getBoundingClientRect().width,
          truncated: stns
            .map((s) => s.querySelector("b"))
            .filter((b): b is HTMLElement => Boolean(b))
            .filter((b) => b.scrollWidth > b.clientWidth + 1)
            .map((b) => b.textContent ?? ""),
          minFont: Math.min(
            ...stns.flatMap((s) =>
              [...s.querySelectorAll<HTMLElement>("b, em")].map((e) =>
                Number.parseFloat(getComputedStyle(e).fontSize)
              )
            )
          ),
        };
      });
      expect(rail, `${label}: the reading rail is missing`).not.toBeNull();
      expect(rail!.horizontal, `${label}: the reading rail is not horizontal`).toBe(true);
      expect(rail!.aboveField, `${label}: the reading rail is not above the drawing`).toBe(true);
      expect(
        rail!.spansConsole,
        `${label}: the reading rail does not span the console`
      ).toBeGreaterThan(0.98);
      expect(
        rail!.truncated,
        `${label}: station names ellipsised: ${rail!.truncated.join(", ")}`
      ).toEqual([]);
      expect(
        rail!.minFont,
        `${label}: rail labels fell below the chrome floor`
      ).toBeGreaterThanOrEqual(7.9);

      // ── THE WHEEL, AND ITS RELEASE (ADR-063) ──────────────────────
      // Over the console, scroll changes the READING and the page holds.
      // At the last reading in the direction of travel the wheel goes back
      // to the page — this beat is scroll-pinned, so a console that kept it
      // would be a trap on the whole document. The unit test pins the
      // arithmetic (`tests/lib/pda-wheel.test.ts`); this pins that a real
      // wheel event over the real element behaves.
      await page.locator(".fl-pda__stn").first().click();
      await page.waitForTimeout(400);
      const fieldBox = (await page.locator(".fl-pda__field").boundingBox())!;
      await page.mouse.move(fieldBox.x + fieldBox.width / 2, fieldBox.y + fieldBox.height / 2);

      const heldY = await page.evaluate(() => window.scrollY);
      const heldRow = await page.evaluate(
        () => document.querySelector(".fl-row[aria-selected='true']")?.textContent ?? ""
      );
      await page.mouse.wheel(0, 140);
      await page.waitForTimeout(620);
      await expect(
        page.locator(".fl-pda"),
        `${label}: the wheel did not change the reading`
      ).toHaveAttribute("data-view", "2");
      await page.mouse.wheel(0, 140);
      await page.waitForTimeout(620);
      await expect(
        page.locator(".fl-pda"),
        `${label}: the wheel did not reach the last reading`
      ).toHaveAttribute("data-view", "3");
      expect(
        Math.abs((await page.evaluate(() => window.scrollY)) - heldY),
        `${label}: the page scrolled while the readings changed`
      ).toBeLessThanOrEqual(2);
      expect(
        await page.evaluate(
          () => document.querySelector(".fl-row[aria-selected='true']")?.textContent ?? ""
        ),
        `${label}: the directory row changed under the console`
      ).toBe(heldRow);

      // THE RELEASE. Past the last reading the page moves again.
      await page.mouse.wheel(0, 240);
      await page.waitForTimeout(600);
      expect(
        await page.evaluate(() => window.scrollY),
        `${label}: RELEASE FAILED — the console traps the page at its last reading`
      ).toBeGreaterThan(heldY + 2);

      // Back to the map's row and its first reading for the checks below.
      expect(await scrollCasefileDwell(page, 0.1), `${label}: casefile runway missing`).toBe(true);
      await page.waitForTimeout(600);

      // The console carries NO TITLE BAR and NO REPEATED HEADING (ADR-063
      // U1). Both said what the left column and the lit tab already say, and
      // the height they cost was the only place the drawing's type could
      // come from.
      expect(
        await page.locator(".fl-pda__head").count(),
        `${label}: the console grew a title bar back`
      ).toBe(0);
      expect(
        await page.locator(".fl-pda__foot h5").count(),
        `${label}: the foot is printing the reading's name twice`
      ).toBe(0);

      // A cartridge is the panel's control: clicking one opens reading 02 on
      // that stream, and the foot's SENTENCE changes with the reading.
      await page.locator(".fl-pda__stn").first().click();
      await page.waitForTimeout(300);
      const workFoot = await page.locator(".fl-pda__foot p").innerText();
      await page.locator(".fl-pda-hit").first().click({ force: true });
      await page.waitForTimeout(700);
      await expect(page.locator(".fl-pda")).toHaveAttribute("data-view", "2");
      expect(
        await page.locator(".fl-pda__foot p").innerText(),
        `${label}: the foot did not follow the reading`
      ).not.toBe(workFoot);

      // ...and that sentence is PROSE, so it answers to the readable-copy
      // floor rather than the instrument one.
      expect(
        await page.evaluate(() =>
          Number.parseFloat(getComputedStyle(document.querySelector(".fl-pda__foot p")!).fontSize)
        ),
        `${label}: the foot sentence fell below the readable floor`
      ).toBeGreaterThanOrEqual(11.9);

      // Escape returns to the work. Keys are bound on the PLATE, never
      // `document` — the corridor has its own key handling.
      await page.locator(".fl-pda__stn").first().focus();
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      await expect(page.locator(".fl-pda")).toHaveAttribute("data-view", "1");

      // NOTHING THE MAP DOES MAY PUBLISH A RING ANCHOR. The casefile host is
      // `pointer-events: none` with scoped opt-ins, and the map plate is one
      // of them; it sits at z 6 over `.svc-ring-hits__hit` at z 4, so an
      // anchor published during the dwell is an invisible click-eater.
      expect(
        await page.locator(".svc-ring-hits__hit").count(),
        `${label}: a ring anchor published during the casefile dwell`
      ).toBe(0);

      if (viewport.height > 930) {
        const tallProof = await page.evaluate(() => {
          const briefBody = document.querySelector<HTMLElement>(".fl-brief__body");
          const proof = document.querySelector<HTMLElement>(".fl-proof-register");
          if (!briefBody || !proof) return null;
          const proofRect = proof.getBoundingClientRect();
          const descriptions = [
            ...proof.querySelectorAll<HTMLElement>(".fl-proof-register__description"),
          ];
          return {
            count: descriptions.length,
            summaryGap: proofRect.top - briefBody.getBoundingClientRect().bottom,
            clipped: descriptions.flatMap((description, index) => {
              const rect = description.getBoundingClientRect();
              const item = description.closest<HTMLElement>(".fl-proof-register__item");
              const itemRect = item?.getBoundingClientRect();
              const issues: string[] = [];
              if (description.scrollHeight - description.clientHeight > 1) {
                issues.push(`description-${index + 1}:clips-y`);
              }
              if (description.scrollWidth - description.clientWidth > 1) {
                issues.push(`description-${index + 1}:clips-x`);
              }
              if (itemRect && (rect.top < itemRect.top - 1 || rect.bottom > itemRect.bottom + 1)) {
                issues.push(`description-${index + 1}:outside-item`);
              }
              return issues;
            }),
          };
        });
        expect(tallProof, `${label}: tall proof register is missing`).not.toBeNull();
        expect(tallProof?.count).toBe(4);
        expect(
          tallProof?.summaryGap ?? Number.POSITIVE_INFINITY,
          `${label}: dead space reopened between summary and proof register`
        ).toBeLessThan(80);
        expect(
          tallProof?.clipped,
          `${label}: tall proof descriptions clip: ${tallProof?.clipped.join(", ")}`
        ).toEqual([]);
      }

      if (viewport.width === 1280) {
        await page.locator(".fl-row").nth(1).click();
        await page.waitForTimeout(220);
        const studioBrief = await page.evaluate(() => {
          const brief = document.querySelector<HTMLElement>(".fl-brief");
          const body = document.querySelector<HTMLElement>(".fl-brief__body");
          if (!brief || !body) return null;
          const briefRect = brief.getBoundingClientRect();
          const bodyRect = body.getBoundingClientRect();
          return {
            briefOverflow: brief.scrollHeight - brief.clientHeight,
            bodyOverflow: body.scrollHeight - body.clientHeight,
            bodyInside:
              bodyRect.top >= briefRect.top - 1 && bodyRect.bottom <= briefRect.bottom + 1,
          };
        });
        expect(studioBrief, `${label}: Studio brief is missing`).not.toBeNull();
        expect(studioBrief?.briefOverflow, `${label}: Studio brief clips`).toBeLessThanOrEqual(1);
        expect(studioBrief?.bodyOverflow, `${label}: Studio summary clips`).toBeLessThanOrEqual(1);
        expect(studioBrief?.bodyInside, `${label}: Studio summary escaped its brief`).toBe(true);

        const toolsRow = page.locator(".fl-row").nth(3);
        await toolsRow.click();
        await expect(toolsRow).toHaveAttribute("aria-selected", "true");
        await page.waitForTimeout(350);
        const toolNames = page.locator(".fl-tooltab__name");
        await expect(toolNames).toHaveCount(4);
        const toolTabs = await toolNames.evaluateAll((names) => {
          return {
            count: names.length,
            clipped: names.flatMap((name, index) => {
              const issues: string[] = [];
              const element = name as HTMLElement;
              if (element.scrollWidth - element.clientWidth > 1)
                issues.push(`tool-${index + 1}:clips-x`);
              if (element.scrollHeight - element.clientHeight > 1)
                issues.push(`tool-${index + 1}:clips-y`);
              return issues;
            }),
            minFont: names.length
              ? Math.min(...names.map((name) => Number.parseFloat(getComputedStyle(name).fontSize)))
              : 0,
          };
        });
        expect(toolTabs.count, `${label}: tool switcher is incomplete`).toBe(4);
        expect(toolTabs.minFont, `${label}: tool labels fell below 10px`).toBeGreaterThanOrEqual(
          10
        );
        expect(
          toolTabs.clipped,
          `${label}: tool labels clip: ${toolTabs.clipped.join(", ")}`
        ).toEqual([]);
      }
    }
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

    // EVERY ROW, not just the one that opens. The harmonised shell keeps the
    // proof register and directory in the left column while each visual owns
    // the complete right panel. These boxes clip silently, so measure all
    // four project shapes rather than trusting the default map row.
    const rowCount = await page.locator(".fl-row").count();
    expect(rowCount, "the directory holds four rows").toBe(4);

    const clipped: string[] = [];
    for (let i = 0; i < rowCount; i++) {
      const row = page.locator(".fl-row").nth(i);
      await row.click();
      await page.waitForTimeout(350);

      const overflow = await page.evaluate(() => {
        // The inner map field earns its place here (ADR-061): absolute work
        // nodes can overflow their stage while the enclosing visual still
        // reports 0, because its own `overflow: hidden` swallows the evidence.
        const boxes = [
          ".fl-brief",
          ".fl-proof-register",
          ".fl-dir",
          ".fl-panel__viz",
          ".fl-plate",
          // The map's canvas earns its place here (ADR-062): the SVG is
          // absolutely positioned inside it, so a crop that outgrows the
          // console reports 0 on `.fl-plate`, whose own `overflow: hidden`
          // swallows the evidence.
          ".fl-pda__field",
        ] as const;
        const file = document.querySelector<HTMLElement>(".fl-row[aria-selected='true']");
        const out: { box: string; over: number; row: string }[] = [];
        for (const sel of boxes) {
          const el = document.querySelector<HTMLElement>(sel);
          // Visual-specific inner plates may be absent by design; the shared
          // brief/register/directory/panel boxes are always present.
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
