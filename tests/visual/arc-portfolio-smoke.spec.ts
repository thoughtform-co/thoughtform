import { expect, test, type Page } from "@playwright/test";

import { driveTo, prepare } from "./helpers/arcTerminal";
import { WIREFRAME_STATIONS, expectWireframeBay, readToolBay } from "./helpers/toolBay";

/**
 * The portfolio arc's smoke (ADR-072, ADR-076).
 *
 * ⚠ THIS PAGE FLOWS. It shipped on terminal motion and was moved to the
 * ADR-052 reveal grammar in ADR-076 (owner: a portfolio is scrolled at the
 * reader's pace, not presented as pinned beats). So there is no
 * `.arc-stage`, no `data-reveal`, no decode ladder here — those belong to
 * `arc-terminal-smoke.spec.ts`, which walks the `-v2` client decks and is
 * what proves this change left THEM alone.
 *
 * Structural contracts, no screenshot baselines (the arcs' precedent).
 * What fails SILENTLY on this surface, and is therefore measured:
 *
 *   - the consoles must have a DEFINITE box — `.fl-con` is `height: 100%`
 *     over an absolutely inset panel, and inside an auto-height grid cell
 *     it measures 0 (the casefile type-lab's lesson). True of the four
 *     dossiers AND of the architecture beat's map console;
 *   - the host tokens the bay reads with no fallback (`--fl-shot-px`,
 *     `--fl-copy`, `--fl-mono`) — unset, the watch bar loses its padding
 *     and the claims their size, with nothing on screen to say so;
 *   - each beat must FIT at the three reference shapes;
 *   - the drawing must be the landing's drawing — the same pinned label set;
 *   - the walkthrough opens over the beat and the page stays put;
 *   - ⚠ THE MAP CONSOLE MUST NOT CAPTURE THE WHEEL. On the casefile it
 *     owns scroll while the pointer is on it; that is gated on the
 *     casefile's own `data-proof-settled`, which nothing here writes. If
 *     that gate ever loosened, this page would have a scroll trap two
 *     thirds of the way down and nothing else would fail.
 *
 * The landing's ring smoke keeps measuring the SAME bay on the casefile;
 * both specs read it through `helpers/toolBay.ts`.
 */

const PORTFOLIO = "/arcs/portfolio";
const DOSSIERS = WIREFRAME_STATIONS.map((stn) => ({ ...stn, beat: `tool-${stn.id}` }));

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 961;

/**
 * Bring a flowing section to rest in the viewport and let its reveal run.
 *
 * The reveal path's replacement for `parkBeat`: a REAL stepped scroll to
 * the section's own top (every section is ≈ one viewport tall), then a
 * wait on the IO having fired rather than a sleep. `driveTo` is shared
 * with the terminal drive — a teleport would skip the observer entirely
 * at large jumps.
 */
async function restAt(page: Page, id: string) {
  /* ⚠ RE-MEASURE AND CONVERGE, never drive to one reading. The target is
     `sectionTop − scrollY`, and everything above it is still settling as
     you pass: posters decode, reveals run, a video frame arrives. A single
     drive to a top measured beforehand lands the page a whole section
     short (measured — it stopped on the film beat and waited 15s for a
     reveal that was never going to intersect). Three passes is plenty;
     the loop exits as soon as the section's top is within 2px.

     ⚠ THEN SWEEP PAST IT AND COME BACK, for a section taller than the
     viewport. The IO is ONE-SHOT (`unobserve` on first intersect), so a
     section parked at its TOP never reveals its own bottom — measured:
     5 of vesper's 6 panels at 1280×720, which is not a defect but the
     wrong place to stand. A reader scrolls THROUGH; this does the same,
     then rests with the section centred, which is where a full-viewport
     exhibit is actually read. */
  const geo = () =>
    page.evaluate((id) => {
      const el = document.getElementById(id)!;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top + window.scrollY), h: Math.round(r.height) };
    }, id);

  for (let pass = 0; pass < 3; pass++) {
    const { top } = await geo();
    const from = await page.evaluate(() => window.scrollY);
    if (pass > 0 && Math.abs(top - from) <= 2) break;
    await driveTo(page, top, pass === 0 ? 6 : 2);
    await page.waitForTimeout(120);
  }

  const vh = page.viewportSize()!.height;
  const { top, h } = await geo();
  const over = Math.max(0, h - vh);
  if (over > 0) {
    await driveTo(page, top + over, 3); // the section's foot at the fold
    await page.waitForTimeout(200);
    await driveTo(page, top + Math.round(over / 2), 3); // rest, centred
  }

  await page
    .locator(`#${id} .arc-reveal.is-in`)
    .first()
    .waitFor({ state: "attached", timeout: 15_000 });
  await page.waitForTimeout(750); // the 0.65s rise, plus its stagger
}

/** What a dossier section looks like at rest — one evaluate, every number. */
const dossierState = (page: Page, beat: string) =>
  page.evaluate((beat) => {
    const section = document.getElementById(beat)!;
    const con = section.querySelector<HTMLElement>(".fl-con")!;
    const console_ = section.querySelector<HTMLElement>(".fl-con__console")!;
    const field = section.querySelector<HTMLElement>(".fl-con__field")!;
    const detail = section.querySelector<HTMLElement>(".fl-detail")!;
    const bar = section.querySelector<HTMLElement>(".fl-shot__bar")!;
    const claim = section.querySelector<HTMLElement>(".fl-detail__d")!;
    const clipped: string[] = [];
    section
      .querySelectorAll<HTMLElement>(
        ".arc-band, .fl-con__field, .fl-toolbody, .fl-bay, .fl-shot, .fl-shot__frame"
      )
      .forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.overflow !== "visible" && el.scrollHeight - el.clientHeight > 1) {
          clipped.push(`${el.className} +${el.scrollHeight - el.clientHeight}px`);
        }
      });
    const f = field.getBoundingClientRect();
    const d = detail.getBoundingClientRect();
    return {
      sectionH: Math.round(section.getBoundingClientRect().height),
      revealed: section.querySelectorAll(".arc-reveal.is-in").length,
      revealTotal: section.querySelectorAll(".arc-reveal").length,
      conH: Math.round(con.getBoundingClientRect().height),
      conW: Math.round(con.getBoundingClientRect().width),
      consoleOpacity: Number(getComputedStyle(console_).opacity),
      // ADR-068 U1's geometric guard: the blocks sit INSIDE the visible field.
      detailInside: d.bottom <= f.bottom + 1 && d.top >= f.top - 1,
      barPad: getComputedStyle(bar).paddingLeft,
      claimPx: Number.parseFloat(getComputedStyle(claim).fontSize),
      clipped,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
    };
  }, beat);

test.describe("portfolio arc — the dossiers and the architecture (ADR-072, ADR-076)", () => {
  test("the page is the portfolio, unlisted, and it FLOWS", async ({ page }) => {
    await prepare(page, PORTFOLIO);
    await expect(page).toHaveTitle("Portfolio — Thoughtform");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

    // ⚠ THE MOTION IS THE CONTRACT (ADR-076). No `data-motion`, so the
    // terminal CSS is inert; `is-arc-js` present, so the reveal grammar is
    // armed. The two are added or skipped TOGETHER by design — asserting
    // only one would pass on a page that renders nothing.
    const root = page.locator(".arc-root");
    await expect(root).not.toHaveAttribute("data-motion", /.*/);
    await expect(root).toHaveClass(/is-arc-js/);
    expect(await page.locator(".arc-stage").count(), "a flowing page has no pinned stages").toBe(0);

    // THE ORDER, and the two text walls are gone: the roster and the
    // five ruled shape rows are ONE drawn instrument at the foot now.
    const beats = await page.evaluate(() =>
      [...document.querySelectorAll(".arc-section")].map((s) => s.id)
    );
    expect(beats).toEqual([
      "about",
      "overview",
      "tools",
      "tool-mimir",
      "tool-vesper",
      "tool-babylon",
      "tool-heimdall",
      "studio",
      "proof-ai-atl",
      "intelligence",
      "close",
    ]);
    expect(beats).not.toContain("five-shapes");
    expect(beats).not.toContain("skills-by-team");

    // The studio cards print ratios only — no money on a page that travels.
    const rows = await page.locator("#studio .arc-card-item__meta-row dt").allTextContents();
    expect(new Set(rows)).toEqual(new Set(["SKU", "ROAS"]));
    expect(await page.locator("#studio").textContent()).not.toMatch(/[€$£]/);
  });

  test("every dossier section fits, and mounts the landing's bay, at the three reference shapes", async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one walk per run — the desktop project's");
    test.setTimeout(420_000);
    for (const [width, height] of [
      [1280, 720],
      [1440, 800],
      [1920, 1080],
    ] as const) {
      for (const theme of ["dark", "light"] as const) {
        const page = await browser.newPage({ viewport: { width, height } });
        await prepare(page, theme === "light" ? `${PORTFOLIO}?theme=light` : PORTFOLIO);
        for (const stn of DOSSIERS) {
          const label = `${stn.id} @ ${width}x${height} ${theme}`;
          await restAt(page, stn.beat);
          const s = await dossierState(page, stn.beat);
          // FITS: one viewport-ish, with the console fully inside it. A
          // flowing section MAY exceed the viewport (it is not pinned), so
          // the guard is the console's own box and its clipping, not a
          // stage height — but a section past 1.15 viewports has stopped
          // being the one-exhibit-per-tool read ADR-072 shipped.
          expect(s.sectionH, `${label}: section height`).toBeLessThanOrEqual(
            Math.round(height * 1.15)
          );
          expect(s.revealed, `${label}: everything revealed`).toBe(s.revealTotal);
          // THE CONSOLE HAS A BOX, AND IT IS LIT.
          expect(s.conH, `${label}: console height`).toBeGreaterThanOrEqual(440);
          expect(s.conW, `${label}: console width`).toBeGreaterThanOrEqual(500);
          expect(s.consoleOpacity, `${label}: console opacity`).toBe(1);
          // THE HOST CONTRACT: the bar pads, the claims letter at the floor.
          expect(s.barPad, `${label}: watch-bar padding (--fl-shot-px)`).toBe("14px");
          expect(s.claimPx, `${label}: claim size (--fl-copy)`).toBeGreaterThanOrEqual(12);
          expect(s.detailInside, `${label}: the blocks sit inside the field`).toBe(true);
          expect(s.clipped, `${label}: clipped boxes`).toEqual([]);
          expect(s.overflowX, `${label}: horizontal overflow`).toBeLessThanOrEqual(0);
          // THE DRAWING IS THE LANDING'S.
          const bay = await page.evaluate(readToolBay, `#${stn.beat}`);
          expectWireframeBay(bay, label, stn.labels);
          expect(bay!.barCut ?? 99, `${label}: the watch bar is cut`).toBeLessThanOrEqual(1);
        }
        await page.close();
      }
    }
  });

  test("the walkthrough opens over the section and the page stays put", async ({ page }) => {
    test.skip(!isDesktop(page), "enhanced tier only");
    await prepare(page, PORTFOLIO);
    await restAt(page, "tool-mimir");
    const before = await page.evaluate(() => window.scrollY);
    await page.click("#tool-mimir .fl-shot");
    const dialog = page.locator(".fl-lightbox[role='dialog']");
    await expect(dialog).toHaveCount(1);
    await expect(dialog.locator("video")).toHaveAttribute("src", "/videos/tools/mimir.mp4");
    await expect(dialog.locator(".fl-lightbox__label")).toContainText("Mímir · Briefing Agent");
    await expect(dialog.locator(".fl-lightbox__label")).toContainText("Walkthrough · 1:20");
    // The scroll lock holds: a wheel over the dialog moves nothing. On a
    // FLOWING page this matters more than it did pinned — there is no
    // sticky stage to hide a few hundred pixels of drift.
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(250);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
    // Escape closes, and focus comes back to the bar one frame late.
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await page.waitForFunction(() => document.activeElement?.classList.contains("fl-shot"));
  });

  test("reduced motion resolves the dossiers statically, with a real console", async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one walk per run — the desktop project's");
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(PORTFOLIO, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    for (const stn of DOSSIERS) {
      await page.locator(`#${stn.beat}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const s = await page.evaluate((beat) => {
        const section = document.getElementById(beat)!;
        return {
          // A flowing page has no stage at all; under PRM the reveal
          // resolves everything statically instead (ArcShell's own path).
          reveal: section.querySelector(".arc-stage")?.getAttribute("data-reveal") ?? null,
          hidden: [...section.querySelectorAll(".arc-reveal")].filter(
            (el) => !el.classList.contains("is-in")
          ).length,
          conH: Math.round(section.querySelector(".fl-con")!.getBoundingClientRect().height),
          frameH: Math.round(
            section.querySelector(".fl-shot__frame")!.getBoundingClientRect().height
          ),
        };
      }, stn.beat);
      expect(s.reveal, `${stn.id}: no stage under reduced motion`).toBeNull();
      expect(s.hidden, `${stn.id}: nothing stays hidden under reduced motion`).toBe(0);
      expect(s.conH, `${stn.id}: console height under reduced motion`).toBeGreaterThan(300);
      expect(s.frameH, `${stn.id}: frame floor under reduced motion`).toBeGreaterThanOrEqual(280);
      const bay = await page.evaluate(readToolBay, `#${stn.beat}`);
      expectWireframeBay(bay, `${stn.id} reduced-motion`, stn.labels);
    }
    await context.close();
  });

  test("below the tier the console unwraps and the drawing keeps a box", async ({ page }) => {
    test.skip(isDesktop(page), "the unwrapped path is the small-screen path");
    await page.goto(PORTFOLIO, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    for (const stn of DOSSIERS) {
      await page.locator(`#${stn.beat}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const s = await page.evaluate((beat) => {
        const section = document.getElementById(beat)!;
        const wire = section.querySelector<HTMLElement>(".fl-wire")!;
        const w = wire.getBoundingClientRect();
        return {
          consolePos: getComputedStyle(section.querySelector(".fl-con__console")!).position,
          wireW: Math.round(w.width),
          wireH: Math.round(w.height),
          overflowX: document.documentElement.scrollWidth - window.innerWidth,
        };
      }, stn.beat);
      // ⚠ THIS IS THE RUNG THAT NEVER RENDERED ANYWHERE BEFORE (casefile.css's
      // ≤960 `.fl-wire` block was dormant — the landing never mounts a bay
      // below the gate). Here it arms: a 16:10 box with real height.
      expect(s.consolePos, `${stn.id}: the console unwraps`).toBe("static");
      expect(s.wireH, `${stn.id}: the drawing has a box`).toBeGreaterThan(100);
      expect(s.wireW / s.wireH, `${stn.id}: the drawing's aspect`).toBeGreaterThan(1.5);
      expect(s.wireW / s.wireH, `${stn.id}: the drawing's aspect`).toBeLessThan(1.7);
      expect(s.overflowX, `${stn.id}: horizontal overflow`).toBeLessThanOrEqual(1);
      const bay = await page.evaluate(readToolBay, `#${stn.beat}`);
      expectWireframeBay(bay, `${stn.id} small-screen`, stn.labels);
    }
  });

  test("the hero is the mover and the first section is held still (ADR-075, ADR-076)", async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one walk per run — the desktop project's");
    test.setTimeout(180_000);
    for (const [width, height] of [
      [1280, 720],
      [1440, 800],
    ] as const) {
      const page = await browser.newPage({ viewport: { width, height } });
      await prepare(page, PORTFOLIO);
      const at = (y: number) =>
        page.evaluate((target) => {
          window.scrollTo(0, target);
          return new Promise<{
            entry: boolean;
            tall: boolean;
            heroTop: number;
            heroVis: string;
            heldPos: string;
            heldTop: number;
            bandCentre: number;
            lift: number;
          }>((resolve) =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                const hero = document.querySelector<HTMLElement>("#hero")!;
                const first = document.querySelector<HTMLElement>(".arc-hero + .arc-section")!;
                /* ⚠ THE HELD ELEMENT IS THE BAND, NOT A PLANE (ADR-076).
                   A flowing page has no `.arc-plane`; `.arc-band` is the
                   direct child of the section in every kind, so it is what
                   the curtain freezes. */
                const held = first.querySelector<HTMLElement>(":scope > .arc-band")!;
                const b = held.getBoundingClientRect();
                resolve({
                  entry: document.documentElement.hasAttribute("data-arc-entry"),
                  tall: first.hasAttribute("data-arc-tall"),
                  heroTop: Math.round(hero.getBoundingClientRect().top),
                  heroVis: getComputedStyle(hero).visibility,
                  heldPos: getComputedStyle(held).position,
                  heldTop: Math.round(b.top),
                  // The content's own centre — what the reader actually
                  // sees hold, and what must not jump at the handoff.
                  bandCentre: Math.round(b.top + b.height / 2),
                  lift: Number(
                    document.documentElement.style.getPropertyValue("--hero-lift") || "0"
                  ),
                });
              })
            )
          );
        }, y);

      const label = `${width}x${height}`;
      // AT REST — the section behind the curtain is already pinned to the
      // viewport, under the hero card (z 4 over the section's z 1).
      const rest = await at(0);
      expect(rest.entry, `${label}: the entry flag is armed at rest`).toBe(true);
      // ⚠ THE BAIL MUST NOT BE ARMED, or every assertion below passes
      // vacuously on a page whose curtain never runs.
      expect(rest.tall, `${label}: the first section outgrew the viewport`).toBe(false);
      expect(rest.heldPos, `${label}: the first band is held`).toBe("fixed");
      expect(rest.heldTop, `${label}: held at the viewport top`).toBe(0);
      expect(rest.heroTop, `${label}: the card starts at the top`).toBe(0);

      // MID-CURTAIN — THIS PAIR OF ASSERTIONS IS THE PARALLAX. The card
      // has moved a known distance and the panel behind it has not moved
      // at all. Get this backwards and you have ADR-022's rejected v7.
      const mid = await at(Math.round(height * 0.5));
      expect(mid.heroTop, `${label}: the card is the mover`).toBeLessThanOrEqual(
        -Math.round(height * 0.5) + 2
      );
      expect(mid.heldPos, `${label}: still held mid-curtain`).toBe("fixed");
      expect(mid.heldTop, `${label}: the panel did not move`).toBe(0);
      expect(mid.lift, `${label}: the rail clip tracks the card 1:1`).toBeCloseTo(0.5, 1);

      /* THE HANDOFF — the flag clears, the band returns to flow, and the
         CONTENT does not jump: the fixed cell replicates the section's own
         centred box, so both put the band in the same place.

         ⚠ SAMPLE WITHIN A PIXEL OF THE SEAM. The fixed cell holds at
         viewport 0 while the flow box sits at `sectionTop − scrollY`, and
         those two agree at EXACTLY scrollY = vh — which is the whole
         design, since that is the instant the swap happens. Sample ±8px
         either side and the assertion measures the 16px of scroll you just
         did (it reported an "8px jump" on a seam that is continuous). The
         defect this guards is a MISMATCHED BOX — a padding or centring
         difference between the two rules — which shows up as tens of
         pixels here however tightly you sample. */
      const before = await at(height - 1);
      const after = await at(height + 1);
      expect(before.entry, `${label}: still held one step short`).toBe(true);
      expect(after.entry, `${label}: released at the seam`).toBe(false);
      expect(after.heldPos, `${label}: back in flow`).toBe("static");
      expect(
        Math.abs(after.bandCentre - before.bandCentre),
        `${label}: the content jumped ${after.bandCentre - before.bandCentre}px at the handoff`
      ).toBeLessThanOrEqual(3);

      // PAST THE CURTAIN — the card is released from the paint. It
      // outranks every section (z 4 vs 1), so off-screen is not enough.
      const past = await at(Math.round(height * 1.4));
      expect(past.heroVis, `${label}: the card is released`).toBe("hidden");
      expect(past.lift, `${label}: the rails are fully uncovered`).toBeCloseTo(1, 2);
      await page.close();
    }
  });

  test("the curtain releases under reduced motion and on a small screen (ADR-076)", async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one walk per run — the desktop project's");
    /* ⚠ THE RELEASE QUERY REPEATS THE FREEZE'S SELECTOR, `:not()`
       INCLUDED — a media query adds NO specificity, and ADR-075 measured
       exactly this rule silently losing 0,6,1 against 0,7,1. Both halves
       of the release pair are walked, because they are separate gates on
       one selector. */
    for (const [label, opts] of [
      ["reduced motion", { viewport: { width: 1440, height: 800 }, reducedMotion: "reduce" }],
      ["small screen", { viewport: { width: 430, height: 900 } }],
    ] as const) {
      const context = await browser.newContext(opts);
      const page = await context.newPage();
      await page.goto(PORTFOLIO, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      const pos = await page.evaluate(
        () =>
          getComputedStyle(
            document.querySelector<HTMLElement>(".arc-hero + .arc-section > .arc-band")!
          ).position
      );
      expect(pos, `${label}: the curtain must release`).toBe("static");
      await context.close();
    }
  });

  test("the architecture beat is the landing's map console, and it cannot trap the page (ADR-076)", async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one walk per run — the desktop project's");
    test.setTimeout(240_000);
    for (const [width, height] of [
      [1280, 720],
      [1440, 800],
      [1920, 1080],
    ] as const) {
      const page = await browser.newPage({ viewport: { width, height } });
      await prepare(page, PORTFOLIO);
      await restAt(page, "intelligence");
      const label = `${width}x${height}`;

      // THE INSTRUMENT IS THERE, WITH A BOX. `.fl-con` is `height: 100%`
      // over an absolutely inset panel — in an auto-height cell it
      // measures 0 and the drawing renders into nothing.
      const box = await page.evaluate(() => {
        const host = document.querySelector<HTMLElement>("#intelligence .arc-intel")!;
        const con = host.querySelector<HTMLElement>(".fl-con")!;
        const svg = host.querySelector<SVGSVGElement>(".fl-pda__svg")!;
        const c = con.getBoundingClientRect();
        const v = svg.getBoundingClientRect();
        return {
          conH: Math.round(c.height),
          conW: Math.round(c.width),
          svgH: Math.round(v.height),
          /* ⚠ THE DRAWING MUST FILL THE PANEL ON BOTH AXES, and asking
             about one is how this is missed. `meet` fits by the SMALLER
             ratio, so a panel wider than the crop letterboxes
             HORIZONTALLY while filling vertically — which is exactly what
             the first cut of this beat did (1129×471, 90 % of the height,
             a third of the width empty) and what a height-only assertion
             reported as green. The ASPECT is asserted too, because the
             fill can be perfect at a shape no drawing was fitted for. */
          fill: Math.round((v.height / Math.max(1, c.height)) * 100),
          fillW: Math.round((v.width / Math.max(1, c.width)) * 100),
          aspect: Number((c.width / Math.max(1, c.height)).toFixed(2)),
          stations: [...host.querySelectorAll<HTMLElement>(".fl-con__stn")].map((el) =>
            (el.textContent ?? "").trim()
          ),
          overflowX: document.documentElement.scrollWidth - window.innerWidth,
        };
      });
      /* THE FLOOR IS THE CASEFILE'S OWN PANEL. "Let it breathe" is the
         whole reason this beat exists, so the box has to beat the one the
         drawing already has on the landing (603x493 at this viewport,
         679x548 at 1440x800, ~850x760 at 1920). A console that merely
         renders would satisfy a floor of zero. */
      expect(box.conH, `${label}: console height`).toBeGreaterThanOrEqual(520);
      expect(box.conW, `${label}: console width`).toBeGreaterThanOrEqual(640);
      expect(box.svgH, `${label}: the drawing has a box`).toBeGreaterThan(300);
      expect(box.fill, `${label}: the drawing fills its panel's height`).toBeGreaterThanOrEqual(70);
      expect(box.fillW, `${label}: the drawing fills its panel's width`).toBeGreaterThanOrEqual(85);
      // The range every field these drawings were fitted to lives in.
      expect(box.aspect, `${label}: the panel's aspect`).toBeLessThanOrEqual(1.3);
      expect(box.aspect, `${label}: the panel's aspect`).toBeGreaterThanOrEqual(0.4);
      expect(box.stations, `${label}: the three readings`).toEqual([
        "WORK",
        "CONFIGURATION",
        "SUBSTRATE",
      ]);
      expect(box.overflowX, `${label}: horizontal overflow`).toBeLessThanOrEqual(0);

      // ⚠ THE WHEEL MAY NOT CAPTURE. On the casefile this console owns
      // scroll while the pointer is on it; that is gated on the casefile's
      // `data-proof-settled`, which nothing on an arc writes. If it ever
      // loosened, this page would have a scroll trap two thirds of the way
      // down and NOTHING ELSE HERE WOULD FAIL.
      const y0 = await page.evaluate(() => window.scrollY);
      const centre = await page.evaluate(() => {
        const r = document
          .querySelector<HTMLElement>("#intelligence .fl-pda__svg")!
          .getBoundingClientRect();
        return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
      });
      await page.mouse.move(centre.x, centre.y);
      await page.mouse.wheel(0, 400);
      await page.waitForTimeout(400);
      const y1 = await page.evaluate(() => window.scrollY);
      expect(y1 - y0, `${label}: the console swallowed the page's scroll`).toBeGreaterThan(200);
      expect(
        await page.evaluate(
          () => document.querySelector<HTMLElement>("#intelligence .fl-pda")!.dataset.view
        ),
        `${label}: and it must not have changed reading either`
      ).toBe("1");

      // THE RAIL IS THE NAVIGATION: reading 02 draws the switchboard,
      // reading 03 letters all 47 Skills around the carrier.
      await restAt(page, "intelligence");
      await page.locator("#intelligence .fl-con__stn").nth(1).click();
      await page.waitForTimeout(700);
      expect(
        await page.evaluate(
          () => document.querySelector<HTMLElement>("#intelligence .fl-pda")!.dataset.view
        ),
        `${label}: the rail opened reading 02`
      ).toBe("2");
      await page.locator("#intelligence .fl-con__stn").nth(2).click();
      await page.waitForTimeout(900);
      const carrier = await page.evaluate(() => {
        const host = document.querySelector<HTMLElement>("#intelligence .fl-pda")!;
        const labels = [...host.querySelectorAll("textPath")].filter(
          (t) => (t.textContent ?? "").trim().length > 0
        );
        return { view: host.dataset.view, arcLabels: labels.length };
      });
      expect(carrier.view, `${label}: the rail opened reading 03`).toBe("3");
      // 47 Skill cells, plus the five substrate names in the band.
      expect(carrier.arcLabels, `${label}: the carrier letters its cells`).toBeGreaterThanOrEqual(
        47
      );
      await page.close();
    }
  });

  test("the hero carries the landing's plate, and an own-plate arc keeps its own (ADR-075)", async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one walk per run \u2014 the desktop project's");
    const read = async (path: string) => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 800 } });
      await page.goto(path, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      const out = await page.evaluate(() => {
        const bg = document.querySelector<HTMLElement>(".hero__bg")!;
        const img = bg.querySelector("img")!;
        return {
          plate: document.querySelector<HTMLElement>(".arc-hero")!.dataset.plate,
          picture: !!bg.querySelector("picture"),
          bg: getComputedStyle(bg).backgroundImage,
          imgSrc: img.getAttribute("src") ?? "",
          imgShown: getComputedStyle(img).display !== "none",
        };
      });
      await page.close();
      return out;
    };

    // The portfolio IS the landing's hero: the AVIF/WebP picture in dark,
    // theme.css's own light background in light.
    const pfDark = await read(`${PORTFOLIO}`);
    expect(pfDark.plate).toBe("gateway");
    expect(pfDark.picture, "the gateway hero delivers a <picture>").toBe(true);
    expect(pfDark.imgSrc).toContain("Gateway_v1b");
    expect(pfDark.imgShown).toBe(true);
    const pfLight = await read(`${PORTFOLIO}?theme=light`);
    expect(pfLight.bg, "the light plate paints as a background").toContain("Gateway_v2-light");
    expect(pfLight.imgShown, "and the dark img is hidden, so neither theme fetches both").toBe(
      false
    );

    // ⚠ THE BUG THIS FIXES: an arc that owns its plate showed the
    // LANDING's in light, because theme.css's swap is global on
    // `.hero__bg`. Both themes must now paint the arc's own file.
    for (const q of ["", "?theme=light"]) {
      const own = await read(`/arcs/ai-keynote-v2${q}`);
      expect(own.plate, `own-plate arc${q}`).toBe("own");
      expect(own.picture, `own-plate arc${q} needs no picture`).toBe(false);
      expect(own.imgShown, `own-plate arc${q} paints its own image`).toBe(true);
      expect(own.bg, `own-plate arc${q} takes no gateway background`).not.toContain("Gateway");
    }
  });

  test("the ink ramp flips with the theme, and every rung clears its target (ADR-077)", async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one walk per run \u2014 the desktop project's");
    /* \u26a0 EVERY COLOUR ON THIS SURFACE WAS A RAW LITERAL until ADR-077 \u2014
       `rgba(235, 227, 214, \u03b1)` is cream-on-black spelled out, so the light
       theme could not reach it and the cards painted a near-black ground on
       parchment. The ramp fixes that; this is what stops it drifting back.

       \u26a0 COMPOSITE BEFORE MEASURING. Every rung is an ALPHA, and an alpha
       means nothing until it lands on a ground \u2014 the same 0.4 recedes
       toward black on void and toward parchment on light (ADR-063 U2).
       Reading `color` alone would report both themes identical and pass on
       a page nobody can read. */
    const probe = () => {
      const lum = (c: number[]) => {
        const f = (v: number) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
      };
      const parse = (c: string) => (c.match(/[\d.]+/g) || []).map(Number);
      const over = (fg: number[], bg: number[]) => {
        const a = fg[3] === undefined ? 1 : fg[3];
        return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
      };
      /* The first ancestor opaque enough to BE the bed. .85 is the same
         cutoff the wireframes' light walk uses. */
      const bedOf = (el: Element) => {
        let n: Element | null = el;
        while (n && n !== document.documentElement) {
          const c = parse(getComputedStyle(n).backgroundColor);
          if (c.length && (c[3] === undefined || c[3] >= 0.85)) return c.slice(0, 3);
          n = n.parentElement;
        }
        return parse(getComputedStyle(document.body).backgroundColor).slice(0, 3);
      };
      const ratio = (a: number[], b: number[]) => {
        const [hi, lo] = lum(a) > lum(b) ? [a, b] : [b, a];
        return (lum(hi) + 0.05) / (lum(lo) + 0.05);
      };
      const rows: { what: string; r: number; px: number }[] = [];
      for (const [sel, what] of [
        [".arc-card-item__body", "card body"],
        [".arc-card-item__title", "card title"],
        [".arc-card-item__meta-row dt", "meta label"],
        [".arc-head__sub", "head sub"],
        [".arc-dossier__key", "dossier key"],
        [".arc-desig", "designation"],
      ] as const) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const cs = getComputedStyle(el);
        const bed = bedOf(el);
        rows.push({
          what,
          r: Number(ratio(over(parse(cs.color), bed), bed).toFixed(2)),
          px: Math.round(parseFloat(cs.fontSize)),
        });
      }
      /* A PLATE MUST BE A PLATE IN BOTH THEMES. The card's ground was a
         literal near-black, which on parchment is not a recess \u2014 it is a
         different design. Measured as the luminance step from the section
         it sits on, so it cannot be satisfied by a colour that merely
         differs. */
      const plate = document.querySelector(".arc-card-item");
      let step = 0;
      if (plate) {
        const sec = parse(getComputedStyle(plate.closest(".arc-section")!).backgroundColor).slice(
          0,
          3
        );
        step = Math.abs(lum(over(parse(getComputedStyle(plate).backgroundColor), sec)) - lum(sec));
      }
      return { rows, step, ground: getComputedStyle(document.body).backgroundColor };
    };

    // Real text carries the 4.5:1 standard; a 10px designation is chrome
    // and takes the 3:1 line-work rung (ADR-063 U2's split).
    const MIN: Record<string, number> = {
      "card body": 7,
      "card title": 7,
      "meta label": 4.5,
      "head sub": 7,
      "dossier key": 4,
      designation: 3,
    };

    for (const path of [PORTFOLIO, "/arcs/ai-keynote"]) {
      for (const theme of ["dark", "light"] as const) {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        await page.goto(`${path}${theme === "light" ? "?theme=light" : ""}`, {
          waitUntil: "networkidle",
        });
        // Resolve the reveals so nothing is measured at opacity 0.
        await page.evaluate(() =>
          document.querySelectorAll(".arc-reveal").forEach((el) => el.classList.add("is-in"))
        );
        await page.waitForTimeout(400);
        const r = await page.evaluate(probe);
        const label = `${path} ${theme}`;

        // THE GROUND ACTUALLY FLIPPED \u2014 without this the whole walk could
        // pass twice on the dark theme.
        expect(r.ground, `${label}: the ground`).toBe(
          theme === "light" ? "rgb(236, 227, 214)" : "rgb(10, 9, 8)"
        );
        expect(r.rows.length, `${label}: found rungs to measure`).toBeGreaterThanOrEqual(4);
        for (const row of r.rows) {
          expect(row.r, `${label}: ${row.what} at ${row.px}px`).toBeGreaterThanOrEqual(
            MIN[row.what]
          );
        }
        expect(
          r.step,
          `${label}: the card plate is indistinguishable from its section`
        ).toBeGreaterThan(0.0005);
        await page.close();
      }
    }
  });

  test("the header carries the chapters, then the readout and the whole drawer (ADR-073)", async ({
    page,
  }, testInfo) => {
    await prepare(page, PORTFOLIO);
    const wide = (testInfo.project.use.viewport?.width ?? 0) > 640;

    // ⚠ THE LEFT REEL IS GONE, EVERYWHERE. It only rendered above
    // 1101×760, which is why it could not be the navigation.
    await expect(page.locator(".arc-menu")).toHaveCount(0);

    // THE HERO STATE: the chapters, inline. Below 641px the row is CSS-
    // hidden and the bars carry the corner, exactly as on the landing.
    const nav = page.locator(".hud__nav");
    await expect(nav).toHaveCount(1);
    await expect(nav).not.toHaveClass(/is-collapsed/);
    if (wide) {
      expect(await page.locator(".hud__nav__inline__link").allTextContents()).toEqual([
        "About",
        "Overview",
        "Tools",
        "Outcome",
        "Architecture",
      ]);
      // The row is chrome over a PHOTO: it may never land on hero ink.
      // The arcs' key visual is near-white top-right, which is what the
      // hero's own top scrim exists for (ADR-073).
      const collision = await page.evaluate(() => {
        const row = document.querySelector<HTMLElement>(".hud__nav__inline");
        if (!row || getComputedStyle(row).display === "none") return null;
        const rb = row.getBoundingClientRect();
        const hits: string[] = [];
        for (const el of document.querySelectorAll<HTMLElement>(
          ".arc-hero__eyebrow, .hero__headline, .hero__desc, .hero__cta__btn"
        )) {
          const range = document.createRange();
          range.selectNodeContents(el);
          for (const ink of range.getClientRects()) {
            if (ink.width < 1 || ink.height < 1) continue;
            if (
              rb.bottom > ink.top &&
              rb.top < ink.bottom &&
              rb.right > ink.left &&
              rb.left < ink.right
            ) {
              hits.push((el.textContent ?? "").slice(0, 24));
            }
          }
        }
        return hits;
      });
      expect(collision, "the chapter row landed on hero ink").toEqual([]);
    }

    // THE COLLAPSE: past half the first viewport the links peel away, the
    // readout decodes in, and the wordmark shrinks with it.
    await driveTo(page, Math.round((page.viewportSize()!.height * 3) / 2), 6);
    await page.waitForTimeout(900);
    await expect(nav).toHaveClass(/is-collapsed/);
    await expect(page.locator(".hud__brand")).toHaveClass(/is-collapsed/);
    const readout = await page.locator(".hud__nav__sector__name").textContent();
    expect(readout, "the readout resolved to a section name").toMatch(/^[A-ZÍ &]+$/);

    // THE DRAWER: every section, numbered, with the active row marked —
    // the reel's whole job, at every width.
    await page.click(".hud__nav__btn");
    await expect(nav).toHaveClass(/is-open/);
    expect(await page.locator(".hud__nav__list a").allTextContents()).toEqual([
      "01About",
      "02Overview",
      "03Tools",
      "04Mímir",
      "05Vesper",
      "06Babylon",
      "07Heimdall",
      "08Outcome",
      "09Architecture",
      "10Close",
    ]);
    await expect(page.locator('.hud__nav__list a[aria-current="true"]')).toHaveCount(1);
    // Escape closes it and hands focus back to the trigger — the drawer
    // goes INERT on close and would otherwise strand it.
    await page.keyboard.press("Escape");
    await expect(nav).not.toHaveClass(/is-open/);
    await expect(page.locator(".hud__nav__list")).toHaveAttribute("inert", "");
    await page.waitForFunction(() => document.activeElement?.classList.contains("hud__nav__btn"));

    // And it navigates: a drawer row jumps to its beat. POLLED, never a
    // fixed wait — the jump is a SMOOTH scroll (the arcs respect reduced
    // motion rather than teleporting) and five thousand pixels of it
    // outlast any sleep worth writing.
    await page.click(".hud__nav__btn");
    await page.click('.hud__nav__list a:has-text("Babylon")');
    await page.waitForFunction(
      () => Math.abs(document.getElementById("tool-babylon")!.getBoundingClientRect().top) < 4,
      undefined,
      { timeout: 15_000 }
    );
  });
});
