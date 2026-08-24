import { expect, test, type Page } from "@playwright/test";

import { driveTo, parkBeat, prepare } from "./helpers/arcTerminal";
import { WIREFRAME_STATIONS, expectWireframeBay, readToolBay } from "./helpers/toolBay";

/**
 * The portfolio arc's smoke (ADR-072) — the dossier beats.
 *
 * Structural contracts, no screenshot baselines (the arcs' precedent).
 * What fails SILENTLY on this surface, and is therefore measured:
 *
 *   - the console must have a DEFINITE box — `.fl-con` is `height: 100%`
 *     over an absolutely inset panel, and inside an auto-height grid cell
 *     it measures 0 (the casefile type-lab's lesson);
 *   - the host tokens the bay reads with no fallback (`--fl-shot-px`,
 *     `--fl-copy`, `--fl-mono`) — unset, the watch bar loses its padding
 *     and the claims their size, with nothing on screen to say so;
 *   - each beat must FIT at the three reference shapes: a tall two-column
 *     beat crops the console at the park;
 *   - the drawing must be the landing's drawing — the same pinned label
 *     set, after the decode has run over the beat (the scramble writes
 *     textContent and must never reach the wireframe);
 *   - the walkthrough opens over a pinned beat and the page stays put.
 *
 * The landing's ring smoke keeps measuring the SAME bay on the casefile;
 * both specs read it through `helpers/toolBay.ts`.
 */

const PORTFOLIO = "/arcs/portfolio";
const DOSSIERS = WIREFRAME_STATIONS.map((stn) => ({ ...stn, beat: `tool-${stn.id}` }));

const isDesktop = (page: Page) => (page.viewportSize()?.width ?? 0) >= 961;

/** What a dossier beat looks like once parked — one evaluate, every number. */
const dossierState = (page: Page, beat: string) =>
  page.evaluate((beat) => {
    const section = document.getElementById(beat)!;
    const stage = section.querySelector<HTMLElement>(".arc-stage")!;
    const con = section.querySelector<HTMLElement>(".fl-con")!;
    const console_ = section.querySelector<HTMLElement>(".fl-con__console")!;
    const field = section.querySelector<HTMLElement>(".fl-con__field")!;
    const detail = section.querySelector<HTMLElement>(".fl-detail")!;
    const bar = section.querySelector<HTMLElement>(".fl-shot__bar")!;
    const claim = section.querySelector<HTMLElement>(".fl-detail__d")!;
    const targets = [...stage.querySelectorAll<HTMLElement>("[data-arc-decode]")];
    const clipped: string[] = [];
    stage
      .querySelectorAll<HTMLElement>(
        ".arc-band, .arc-plane, [data-arc-panel], .arc-tdec, .fl-con__field, .fl-toolbody, .fl-bay, .fl-shot, .fl-shot__frame"
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
      tall: section.hasAttribute("data-arc-tall"),
      reveal: stage.getAttribute("data-reveal"),
      resolved: targets.filter((el) => el.textContent === el.dataset.arcDecode).length,
      total: targets.length,
      stageH: Math.round(stage.getBoundingClientRect().height),
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

test.describe("portfolio arc — the dossier beats (ADR-072)", () => {
  test("the page is the portfolio, unlisted, on terminal motion", async ({ page }) => {
    await prepare(page, PORTFOLIO);
    await expect(page).toHaveTitle("Portfolio — Thoughtform");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const beats = await page.evaluate(() =>
      [...document.querySelectorAll(".arc-section")].map((s) => s.id)
    );
    expect(beats.slice(-7)).toEqual([
      "tool-mimir",
      "tool-vesper",
      "tool-babylon",
      "tool-heimdall",
      "studio",
      "proof-ai-atl",
      "close",
    ]);
    // The studio cards print ratios only — no money on a page that travels.
    const rows = await page.locator("#studio .arc-card-item__meta-row dt").allTextContents();
    expect(new Set(rows)).toEqual(new Set(["SKU", "ROAS"]));
    expect(await page.locator("#studio").textContent()).not.toMatch(/[€$£]/);
  });

  test("every dossier beat fits, and mounts the landing's bay, at the three reference shapes", async ({
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
          await parkBeat(page, stn.beat, 4);
          const s = await dossierState(page, stn.beat);
          // FITS: the stage is the viewport and the masthead never had to pin.
          expect(s.tall, `${label}: the beat went tall`).toBe(false);
          expect(s.stageH, `${label}: stage height`).toBeLessThanOrEqual(height + 1);
          expect(s.reveal, `${label}: decode`).toBe("done");
          expect(s.resolved, `${label}: decode targets resolved`).toBe(s.total);
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
          // THE DRAWING IS THE LANDING'S — read AFTER the decode ran.
          const bay = await page.evaluate(readToolBay, `#${stn.beat}`);
          expectWireframeBay(bay, label, stn.labels);
          expect(bay!.barCut ?? 99, `${label}: the watch bar is cut`).toBeLessThanOrEqual(1);
        }
        await page.close();
      }
    }
  });

  test("the walkthrough opens over the pinned beat and the page stays put", async ({ page }) => {
    test.skip(!isDesktop(page), "enhanced tier only");
    await prepare(page, PORTFOLIO);
    await parkBeat(page, "tool-mimir", 6);
    const before = await page.evaluate(() => ({
      y: window.scrollY,
      out: document
        .querySelector<HTMLElement>("#tool-mimir .arc-stage")!
        .style.getPropertyValue("--sec-out"),
    }));
    await page.click("#tool-mimir .fl-shot");
    const dialog = page.locator(".fl-lightbox[role='dialog']");
    await expect(dialog).toHaveCount(1);
    await expect(dialog.locator("video")).toHaveAttribute("src", "/videos/tools/mimir.mp4");
    await expect(dialog.locator(".fl-lightbox__label")).toContainText("Mímir · Briefing Agent");
    await expect(dialog.locator(".fl-lightbox__label")).toContainText("Walkthrough · 1:20");
    // The scroll lock holds: a wheel over the dialog moves nothing.
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(250);
    const during = await page.evaluate(() => ({
      y: window.scrollY,
      out: document
        .querySelector<HTMLElement>("#tool-mimir .arc-stage")!
        .style.getPropertyValue("--sec-out"),
    }));
    expect(during.y).toBe(before.y);
    expect(during.out).toBe(before.out);
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
          reveal: section.querySelector(".arc-stage")?.getAttribute("data-reveal") ?? null,
          conH: Math.round(section.querySelector(".fl-con")!.getBoundingClientRect().height),
          frameH: Math.round(
            section.querySelector(".fl-shot__frame")!.getBoundingClientRect().height
          ),
        };
      }, stn.beat);
      expect(s.reveal, `${stn.id}: no decode under reduced motion`).toBeNull();
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

  test("the hero is the mover and the first beat is held still (ADR-075)", async ({
    browser,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one walk per run \u2014 the desktop project's");
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
            heroTop: number;
            heroVis: string;
            planePos: string;
            planeTop: number;
            bandCentre: number;
            lift: number;
          }>((resolve) =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => {
                const hero = document.querySelector<HTMLElement>("#hero")!;
                const first = document.querySelector<HTMLElement>(".arc-hero + .arc-section")!;
                const plane = first.querySelector<HTMLElement>(".arc-plane")!;
                const band = plane.querySelector<HTMLElement>(".arc-band") ?? plane;
                const b = band.getBoundingClientRect();
                resolve({
                  entry: document.documentElement.hasAttribute("data-arc-entry"),
                  heroTop: Math.round(hero.getBoundingClientRect().top),
                  heroVis: getComputedStyle(hero).visibility,
                  planePos: getComputedStyle(plane).position,
                  planeTop: Math.round(plane.getBoundingClientRect().top),
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
      // AT REST — the beat behind the curtain is already pinned to the
      // viewport, under the hero card (z 4 over the section's z 1).
      const rest = await at(0);
      expect(rest.entry, `${label}: the entry flag is armed at rest`).toBe(true);
      expect(rest.planePos, `${label}: the first plane is held`).toBe("fixed");
      expect(rest.planeTop, `${label}: held at the viewport top`).toBe(0);
      expect(rest.heroTop, `${label}: the card starts at the top`).toBe(0);

      // MID-CURTAIN — THIS PAIR OF ASSERTIONS IS THE PARALLAX. The card
      // has moved a known distance and the panel behind it has not moved
      // at all. Get this backwards and you have ADR-022's rejected v7.
      const mid = await at(Math.round(height * 0.5));
      expect(mid.heroTop, `${label}: the card is the mover`).toBeLessThanOrEqual(
        -Math.round(height * 0.5) + 2
      );
      expect(mid.planePos, `${label}: still held mid-curtain`).toBe("fixed");
      expect(mid.planeTop, `${label}: the panel did not move`).toBe(0);
      expect(mid.lift, `${label}: the rail clip tracks the card 1:1`).toBeCloseTo(0.5, 1);

      // THE HANDOFF — the flag clears, the plane returns to flow, and the
      // CONTENT does not jump: the fixed cell replicates the stage's own
      // centred box, so both put the band in the same place.
      const before = await at(height - 8);
      const after = await at(height + 8);
      expect(before.entry, `${label}: still held one step short`).toBe(true);
      expect(after.entry, `${label}: released at the seam`).toBe(false);
      expect(after.planePos, `${label}: back in flow`).toBe("static");
      expect(
        Math.abs(after.bandCentre - before.bandCentre),
        `${label}: the content jumped ${after.bandCentre - before.bandCentre}px at the handoff`
      ).toBeLessThanOrEqual(2);

      // PAST THE CURTAIN — the card is released from the paint. It
      // outranks every section (z 4 vs 1), so off-screen is not enough.
      const past = await at(Math.round(height * 1.4));
      expect(past.heroVis, `${label}: the card is released`).toBe("hidden");
      expect(past.lift, `${label}: the rails are fully uncovered`).toBeCloseTo(1, 2);
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
        "Skills",
        "Tools",
        "Outcome",
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
      "03Skills",
      "04Tools",
      "05Mímir",
      "06Vesper",
      "07Babylon",
      "08Heimdall",
      "09Outcome",
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
