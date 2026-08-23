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

  test("the reel names the tools by codename and stays off the record column", async ({ page }) => {
    test.skip(!isDesktop(page), "the reel is a desktop instrument");
    await prepare(page, PORTFOLIO);
    await driveTo(page, 1200, 4);
    const rows = await page.locator(".arc-menu__name").allTextContents();
    expect(rows.map((r) => r.trim().toUpperCase())).toEqual(
      expect.arrayContaining(["MÍMIR", "VESPER", "BABYLON", "HEIMDALL"])
    );
    await parkBeat(page, "tool-mimir", 4);
    const gap = await page.evaluate(() => {
      const menu = document.querySelector<HTMLElement>(".arc-menu")!.getBoundingClientRect();
      const record = document
        .querySelector<HTMLElement>("#tool-mimir .arc-dossier__record")!
        .getBoundingClientRect();
      return record.left - menu.right;
    });
    // A 14-character handle crossed the column at 1440 (measured); the
    // codenames clear it.
    expect(gap).toBeGreaterThan(0);
  });
});
